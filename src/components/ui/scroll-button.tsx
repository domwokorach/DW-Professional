"use client";

import { ChatButton, chatButtonVariants } from "@/components/ui/chat-button";
import { cn } from "@/lib/utils";
import { type VariantProps } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import { useStickToBottomContext } from "use-stick-to-bottom";

export type ScrollButtonProps = {
  className?: string;
  variant?: VariantProps<typeof chatButtonVariants>["variant"];
  size?: VariantProps<typeof chatButtonVariants>["size"];
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function ScrollButton({ className, variant = "outline", size = "icon", ...props }: ScrollButtonProps) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  return (
    <ChatButton
      type="button"
      variant={variant}
      size={size}
      aria-label="Scroll to latest message"
      className={cn(
        "h-10 w-10 rounded-full shadow-md transition-all duration-150 ease-out",
        !isAtBottom
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-4 scale-95 opacity-0",
        className
      )}
      onClick={() => scrollToBottom()}
      {...props}
    >
      <ChevronDown className="h-5 w-5" aria-hidden="true" />
    </ChatButton>
  );
}

export { ScrollButton };
