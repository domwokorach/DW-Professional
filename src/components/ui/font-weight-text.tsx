"use client"

import type { CSSProperties, ElementType } from "react"

import { cn } from "@/lib/utils"

/*
 * Eldora UI "Font Weight Text" (npx shadcn@latest add @eldoraui/font-weight-text),
 * adapted for this project:
 * - The keyframes live in globals.css (.font-weight-text-char) driven by CSS
 *   variables, instead of a styled-jsx <style jsx> block, so the animation
 *   name in each letter's style always matches the keyframes.
 * - Renders a configurable element (e.g. h1) with the full text for screen
 *   readers and the animated letters aria-hidden, instead of a <p aria-label>.
 * - fontSize is optional so callers can size it responsively with classes.
 * - Reduced-motion users get a static weight (see globals.css).
 * Needs a variable font with a "wght" axis — the site's Inter is one.
 */

interface FontWeightTextProps {
  text: string
  className?: string
  /** Element to render, e.g. "h1". Defaults to "p" like the original. */
  as?: ElementType
  /** Fixed size in px. Omit to size with className instead. */
  fontSize?: number
  minWeight?: number
  maxWeight?: number
  /** Weight shown when the visitor prefers reduced motion. */
  staticWeight?: number
  animationDuration?: number
  delayMultiplier?: number
}

type FontWeightTextStyle = CSSProperties & {
  "--fwt-min"?: number
  "--fwt-max"?: number
  "--fwt-static"?: number
  "--fwt-duration"?: string
}

export function FontWeightText({
  text,
  className = "",
  as: Component = "p",
  fontSize,
  minWeight = 0,
  maxWeight = 840,
  staticWeight = 700,
  animationDuration = 1.5,
  delayMultiplier = 0.25,
}: FontWeightTextProps) {
  const letters = Array.from(text)
  const style: FontWeightTextStyle = {
    "--fwt-min": minWeight,
    "--fwt-max": maxWeight,
    "--fwt-static": staticWeight,
    "--fwt-duration": `${animationDuration}s`,
    ...(fontSize ? { fontSize: `${fontSize}px` } : {}),
  }

  return (
    <Component className={cn("m-0 font-sans", className)} style={style}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {letters.map((char, index) => (
          <span
            key={index}
            className="font-weight-text-char"
            // Offsetting each letter from the centre makes the weight wave
            // ripple outwards, as in the original component.
            style={{ animationDelay: `${(index - letters.length / 2) * delayMultiplier}s` }}
          >
            {char === " " ? " " : char}
          </span>
        ))}
      </span>
    </Component>
  )
}
