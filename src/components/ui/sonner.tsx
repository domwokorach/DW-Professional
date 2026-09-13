"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * This project doesn't use next-themes — theme is a data-theme attribute set
 * by the inline script in app/layout.tsx — so the toast surface is themed
 * with the same fixed dark tokens as the rest of the admin UI rather than
 * reading a next-themes context that doesn't exist here.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-surface group-[.toaster]:text-white group-[.toaster]:border-line group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted",
          actionButton: "group-[.toast]:bg-white group-[.toast]:text-ink",
          cancelButton: "group-[.toast]:bg-ink group-[.toast]:text-muted",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
