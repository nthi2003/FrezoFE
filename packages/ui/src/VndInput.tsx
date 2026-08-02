import * as React from 'react'
import { cn, formatVndInput, parseVndInput } from '@frezo/utils'
import { Input } from './input'

export interface VndInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'onChange' | 'inputMode'
  > {
  /** Số thuần (API / form state). null/undefined → ô trống. */
  value: number | null | undefined
  /** Emit số nguyên đã parse; xoá hết → undefined. */
  onChange: (value: number | undefined) => void
}

/**
 * VndInput — ô nhập tiền VND chuẩn Frezo.
 * Hiển thị dấu `.` ngăn nghìn khi gõ (180.000); không spinner; emit number.
 */
export const VndInput = React.forwardRef<HTMLInputElement, VndInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={cn('tabular-nums', className)}
        value={formatVndInput(value ?? undefined)}
        onChange={(e) => onChange(parseVndInput(e.target.value))}
        {...props}
      />
    )
  },
)
VndInput.displayName = 'VndInput'
