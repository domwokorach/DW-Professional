"use client"

import React, { useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"
import { renderToString } from "react-dom/server"

interface Icon {
  x: number
  y: number
  z: number
  scale: number
  opacity: number
  id: number
}

interface IconCloudProps {
  icons?: React.ReactNode[]
  images?: string[]
  /** Accessible label per icon/image, in the same order — used for the sr-only list and hover tooltip. */
  labels?: string[]
  showControl?: boolean
  /** Min/max canvas size in px; the cloud fills its container between these bounds. */
  minSize?: number
  maxSize?: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function IconCloud({
  icons,
  images,
  labels,
  showControl = true,
  minSize = 220,
  maxSize = 480,
}: IconCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [iconPositions, setIconPositions] = useState<Icon[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [size, setSize] = useState(maxSize)
  const [targetRotation, setTargetRotation] = useState<{
    x: number
    y: number
    startX: number
    startY: number
    distance: number
    startTime: number
    duration: number
  } | null>(null)
  const animationFrameRef = useRef<number>(0)
  const rotationRef = useRef({ x: 0, y: 0 })
  const iconCanvasesRef = useRef<HTMLCanvasElement[]>([])
  const imagesLoadedRef = useRef<boolean[]>([])

  // Size the canvas to fill its container, clamped between minSize and maxSize.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resize = () => {
      const width = container.clientWidth
      if (width > 0) {
        setSize(Math.max(minSize, Math.min(maxSize, width)))
      }
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [minSize, maxSize])

  // Pause animation if user prefers reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mediaQuery.matches) {
      setIsPaused(true)
    }

    const handleChange = (e: MediaQueryListEvent) => {
      setIsPaused(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // Create icon canvases once when icons/images change
  useEffect(() => {
    if (!icons && !images) return

    const items = icons ?? images ?? []
    imagesLoadedRef.current = new Array(items.length).fill(false)

    const newIconCanvases = items.map((item, index) => {
      const offscreen = document.createElement("canvas")
      offscreen.width = 40
      offscreen.height = 40
      const offCtx = offscreen.getContext("2d")

      if (offCtx) {
        if (images) {
          // Handle image URLs directly
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.src = items[index] as string
          img.onload = () => {
            offCtx.clearRect(0, 0, offscreen.width, offscreen.height)

            // Create circular clipping path
            offCtx.beginPath()
            offCtx.arc(20, 20, 20, 0, Math.PI * 2)
            offCtx.closePath()
            offCtx.clip()

            // Draw the image
            offCtx.drawImage(img, 0, 0, 40, 40)

            imagesLoadedRef.current[index] = true
          }
        } else {
          // Handle SVG icons. Icons are expected to render at a fixed
          // intrinsic size (see the `size` prop passed to each icon) matching
          // the offscreen canvas, so no extra scaling is needed here.
          const svgString = renderToString(item as React.ReactElement)
          const img = new Image()
          img.src = "data:image/svg+xml;base64," + btoa(svgString)
          img.onload = () => {
            offCtx.clearRect(0, 0, offscreen.width, offscreen.height)
            offCtx.drawImage(img, 0, 0)
            imagesLoadedRef.current[index] = true
          }
        }
      }
      return offscreen
    })

    iconCanvasesRef.current = newIconCanvases
  }, [icons, images])

  // Generate initial icon positions on a sphere, scaled to the current canvas size.
  useEffect(() => {
    const items = icons ?? images ?? []
    const newIcons: Icon[] = []
    const numIcons = items.length || 20
    const radius = size * 0.32

    // Fibonacci sphere parameters
    const offset = 2 / numIcons
    const increment = Math.PI * (3 - Math.sqrt(5))

    for (let i = 0; i < numIcons; i++) {
      const y = i * offset - 1 + offset / 2
      const r = Math.sqrt(1 - y * y)
      const phi = i * increment

      const x = Math.cos(phi) * r
      const z = Math.sin(phi) * r

      newIcons.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        scale: 1,
        opacity: 1,
        id: i,
      })
    }
    setIconPositions(newIcons)
  }, [icons, images, size])

  const hitTest = (x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return -1

    for (let i = 0; i < iconPositions.length; i++) {
      const icon = iconPositions[i]
      const cosX = Math.cos(rotationRef.current.x)
      const sinX = Math.sin(rotationRef.current.x)
      const cosY = Math.cos(rotationRef.current.y)
      const sinY = Math.sin(rotationRef.current.y)

      const rotatedX = icon.x * cosY - icon.z * sinY
      const rotatedZ = icon.x * sinY + icon.z * cosY
      const rotatedY = icon.y * cosX + rotatedZ * sinX

      const screenX = canvas.width / 2 + rotatedX
      const screenY = canvas.height / 2 + rotatedY

      const scale = (rotatedZ + size * 0.65) / (size * 0.9)
      const radius = (size * 0.05) * scale
      const dx = x - screenX
      const dy = y - screenY

      if (dx * dx + dy * dy < radius * radius) {
        return i
      }
    }
    return -1
  }

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect || !canvasRef.current) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const hitIndex = hitTest(x, y)
    if (hitIndex !== -1) {
      const icon = iconPositions[hitIndex]
      const targetX = -Math.atan2(
        icon.y,
        Math.sqrt(icon.x * icon.x + icon.z * icon.z)
      )
      const targetY = Math.atan2(icon.x, icon.z)

      const currentX = rotationRef.current.x
      const currentY = rotationRef.current.y
      const distance = Math.sqrt(
        Math.pow(targetX - currentX, 2) + Math.pow(targetY - currentY, 2)
      )

      const duration = Math.min(2000, Math.max(800, distance * 1000))

      setTargetRotation({
        x: targetX,
        y: targetY,
        startX: currentX,
        startY: currentY,
        distance,
        startTime: performance.now(),
        duration,
      })
      return
    }

    setIsDragging(true)
    setLastMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setMousePos({ x, y })
      if (!isDragging) {
        const hitIndex = hitTest(x, y)
        setHoveredIndex(hitIndex === -1 ? null : hitIndex)
      }
    }

    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.x
      const deltaY = e.clientY - lastMousePos.y

      rotationRef.current = {
        x: rotationRef.current.x + deltaY * 0.002,
        y: rotationRef.current.y + deltaX * 0.002,
      }

      setLastMousePos({ x: e.clientX, y: e.clientY })
      setHoveredIndex(null)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setHoveredIndex(null)
  }

  // Animation and rendering
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (canvas && ctx) {
      const iconDrawSize = size * 0.1

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)
        const dx = mousePos.x - centerX
        const dy = mousePos.y - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const speed = 0.003 + (distance / maxDistance) * 0.01

        if (targetRotation) {
          const elapsed = performance.now() - targetRotation.startTime
          const progress = Math.min(1, elapsed / targetRotation.duration)
          const easedProgress = easeOutCubic(progress)

          rotationRef.current = {
            x:
              targetRotation.startX +
              (targetRotation.x - targetRotation.startX) * easedProgress,
            y:
              targetRotation.startY +
              (targetRotation.y - targetRotation.startY) * easedProgress,
          }

          if (progress >= 1) {
            setTargetRotation(null)
          }
        } else if (!isDragging && !isPaused) {
          rotationRef.current = {
            x: rotationRef.current.x + (dy / canvas.height) * speed,
            y: rotationRef.current.y + (dx / canvas.width) * speed,
          }
        }

        iconPositions.forEach((icon, index) => {
          const cosX = Math.cos(rotationRef.current.x)
          const sinX = Math.sin(rotationRef.current.x)
          const cosY = Math.cos(rotationRef.current.y)
          const sinY = Math.sin(rotationRef.current.y)

          const rotatedX = icon.x * cosY - icon.z * sinY
          const rotatedZ = icon.x * sinY + icon.z * cosY
          const rotatedY = icon.y * cosX + rotatedZ * sinX

          const scale = (rotatedZ + size * 0.65) / (size * 0.9)
          const opacity = Math.max(0.25, Math.min(1, (rotatedZ + size * 0.5) / (size * 0.65)))

          ctx.save()
          ctx.translate(
            canvas.width / 2 + rotatedX,
            canvas.height / 2 + rotatedY
          )
          ctx.scale(scale, scale)
          ctx.globalAlpha = hoveredIndex === index ? 1 : opacity

          if (icons || images) {
            // Only try to render icons/images if they exist
            if (
              iconCanvasesRef.current[index] &&
              imagesLoadedRef.current[index]
            ) {
              ctx.drawImage(
                iconCanvasesRef.current[index],
                -iconDrawSize / 2,
                -iconDrawSize / 2,
                iconDrawSize,
                iconDrawSize
              )
            }
          } else {
            // Show numbered circles if no icons/images are provided
            const r = iconDrawSize / 2
            ctx.beginPath()
            ctx.arc(0, 0, r, 0, Math.PI * 2)
            ctx.fillStyle = "#4444ff"
            ctx.fill()
            ctx.fillStyle = "white"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.font = `${r}px Arial`
            ctx.fillText(`${icon.id + 1}`, 0, 0)
          }

          ctx.restore()
        })

        const hasPendingAssets =
          Boolean(icons || images) &&
          !imagesLoadedRef.current.every((loaded) => loaded)
        const shouldContinue =
          !isPaused || isDragging || targetRotation !== null || hasPendingAssets

        if (shouldContinue) {
          animationFrameRef.current = requestAnimationFrame(animate)
        }
      }

      animate()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [
    icons,
    images,
    iconPositions,
    isDragging,
    isPaused,
    mousePos,
    targetRotation,
    hoveredIndex,
    size,
  ])

  const hoveredLabel =
    hoveredIndex !== null ? labels?.[hoveredIndex] : undefined

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-[480px]">
      <div className="relative" style={{ width: size, height: size, margin: "0 auto" }}>
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="rounded-lg"
          aria-hidden="true"
        />
        {hoveredLabel && (
          <div
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-black/80 px-3 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-sm"
          >
            {hoveredLabel}
          </div>
        )}
        {showControl && (
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? "Play icon cloud animation" : "Pause icon cloud animation"}
            className="absolute top-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        )}
      </div>
      {labels && labels.length > 0 && (
        <span className="sr-only">
          Technologies: {labels.join(", ")}
        </span>
      )}
    </div>
  )
}
