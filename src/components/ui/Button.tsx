import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        control: "p-2 rounded-lg transition-colors",
        reset: "p-2 rounded-lg border-2 transition-colors font-semibold shadow-sm"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        control: "p-2"
      },
      theme: {
        light: "",
        dark: ""
      }
    },
    compoundVariants: [
      {
        variant: "control",
        theme: "light",
        class: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      },
      {
        variant: "control", 
        theme: "dark",
        class: "text-gray-400 hover:text-white hover:bg-gray-800"
      },
      {
        variant: "reset",
        theme: "light", 
        class: "bg-blue-100/80 border-blue-400 text-blue-700 hover:bg-blue-200 hover:text-blue-900"
      },
      {
        variant: "reset",
        theme: "dark",
        class: "bg-blue-900/70 border-blue-600 text-blue-300 hover:bg-blue-800 hover:text-white"
      }
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      theme: "light"
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, theme, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, theme, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }