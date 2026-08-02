import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { cn } from '@frezo/utils'

/** Default hover delay — match native title feel without instant flash. */
export const TOOLTIP_DELAY_MS = 300

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, side = 'top', sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      side={side}
      sideOffset={sideOffset}
      className={cn(
        'z-50 max-w-xs rounded-md bg-neutral-800 px-2.5 py-1.5 text-sm text-white shadow-sm',
        'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export interface AppTooltipProps {
  /** Label hiển thị — thay cho HTML `title=` (không dùng native tooltip). */
  content: React.ReactNode
  children: React.ReactElement
  side?: React.ComponentPropsWithoutRef<typeof TooltipContent>['side']
  /** Tắt tooltip khi label đã hiện trên UI (vd. sidebar mở rộng). */
  disabled?: boolean
  contentClassName?: string
}

/**
 * Wrapper thay `title=` — dùng cho icon/button cần hint ngắn.
 * Cần bọc app bằng `TooltipProvider` (đã gắn ở `AppProviders`).
 *
 * @example
 * <AppTooltip content="Thông báo">
 *   <button type="button" aria-label="Thông báo"><Bell /></button>
 * </AppTooltip>
 */
function AppTooltip({
  content,
  children,
  side = 'top',
  disabled = false,
  contentClassName,
}: AppTooltipProps) {
  if (disabled || content == null || content === '') {
    return children
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className={contentClassName}>
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  AppTooltip,
}
