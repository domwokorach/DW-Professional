import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * shadcn-style Button scoped to Admin Chat. Named separately from the
 * site-wide `Button.tsx` (marketing Link-aware button) to avoid a
 * case-insensitive filename collision on macOS/Windows filesystems, and
 * styled against this project's fixed ink/surface/line/accent palette
 * rather than shadcn's default CSS-variable tokens (components.json has
 * cssVariables: false).
 */
const chatButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-accent text-ink hover:opacity-90",
        outline:
          "border border-line bg-ink text-white hover:bg-surface",
        ghost: "text-muted hover:bg-surface hover:text-white",
        destructive: "bg-red-600 text-white hover:bg-red-500",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-6",
        icon: "h-9 w-9 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ChatButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chatButtonVariants> {
  asChild?: boolean
}

const ChatButton = React.forwardRef<HTMLButtonElement, ChatButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(chatButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
ChatButton.displayName = "ChatButton"

export { ChatButton, chatButtonVariants }
