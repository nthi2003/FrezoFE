import * as React from 'react'
import { cn } from '@frezo/utils'
import { Label } from './label'

export interface FormFieldProps {
  label?: React.ReactNode
  htmlFor?: string
  required?: boolean
  error?: string | React.ReactNode
  hint?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/**
 * FormField — wrapper chuẩn cho mọi field trong form.
 * - Label ở TRÊN input (không đặt bên trái).
 * - Required marker `*` tự động render bằng token text-danger.
 * - Error message hiển thị dưới field bằng text-danger.
 * - Hint hiển thị dưới field bằng text-neutral-500 (khi không có error).
 *
 * Dùng như:
 *   <FormField label="Tên hợp đồng" htmlFor="name" required error={errors.name?.message}>
 *     <Input id="name" {...register('name')} />
 *   </FormField>
 */
export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  const describedById = htmlFor
    ? error
      ? `${htmlFor}-error`
      : hint
        ? `${htmlFor}-hint`
        : undefined
    : undefined

  const enhancedChildren = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedById,
      })
    : children

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={htmlFor} className="block text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </Label>
      )}
      {enhancedChildren}
      {error && (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-xs text-danger">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={htmlFor ? `${htmlFor}-hint` : undefined} className="text-xs text-neutral-500">
          {hint}
        </p>
      )}
    </div>
  )
}
