import * as React from 'react'
import { cn } from '@frezo/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Textarea — multi-line input đồng bộ style với Input.
 * Mặc định `rows=4`. Chỉnh chiều cao qua prop `rows` hoặc `className="min-h-[...]"`.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
          'ring-offset-background placeholder:text-neutral-500',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'resize-y',
          className,
        )}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
