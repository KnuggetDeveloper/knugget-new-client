import { cn } from "@/lib/utils"
import React from "react"
export const Spinner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "sm" | "md" | "lg"
  }
>(({ className, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-knugget-500",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
})
Spinner.displayName = "Spinner" 