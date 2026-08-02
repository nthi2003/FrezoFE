import { Check } from 'lucide-react'
import { cn } from '@frezo/utils'
import { PRESENCE_OPTIONS } from '@/lib/presence/presenceConfig'
import { usePresenceStore } from '@/stores/presenceStore'

interface PresenceStatusPickerProps {
  onSelect?: () => void
  className?: string
}

export function PresenceStatusPicker({ onSelect, className }: PresenceStatusPickerProps) {
  const status = usePresenceStore((s) => s.status)
  const setStatus = usePresenceStore((s) => s.setStatus)

  return (
    <div className={cn('px-2 py-2', className)}>
      <div className="mb-1.5 px-2 text-2xs font-semibold uppercase tracking-wider text-neutral-400">
        Trạng thái của bạn
      </div>
      <div className="space-y-0.5">
        {PRESENCE_OPTIONS.map((opt) => {
          const selected = status === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setStatus(opt.value)
                onSelect?.()
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors',
                selected
                  ? 'bg-primary-50 text-primary-800'
                  : 'text-neutral-700 hover:bg-neutral-50',
              )}
            >
              <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    opt.dotClass,
                    opt.pulse && selected && 'animate-presence-pulse',
                  )}
                />
              </span>
              <span className="flex-1 font-medium">{opt.label}</span>
              {selected && <Check size={14} className="shrink-0 text-primary-600" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
