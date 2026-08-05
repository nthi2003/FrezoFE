import { useEffect, useState } from 'react'
import { cn } from '@frezo/utils'
import { useAuthStore } from '@/stores/authStore'
import { resolveAvatarUrl } from '@/modules/auth/utils/resolveAvatarUrl'
import { usePresenceStore } from '@/stores/presenceStore'
import { getPresenceOption } from '@/lib/presence/presenceConfig'

const SIZE = {
  sm: { wrap: 'h-7 w-7', text: 'text-xs', dot: 'h-2.5 w-2.5 border-[1.5px]', offset: '-bottom-0.5 -right-0.5' },
  md: { wrap: 'h-10 w-10', text: 'text-sm', dot: 'h-3 w-3 border-2', offset: '-bottom-0.5 -right-0.5' },
  lg: { wrap: 'h-14 w-14', text: 'text-lg', dot: 'h-3.5 w-3.5 border-2', offset: 'bottom-0 right-0' },
} as const

interface UserAvatarWithPresenceProps {
  size?: keyof typeof SIZE
  className?: string
  showStatusLabel?: boolean
}

export function UserAvatarWithPresence({
  size = 'sm',
  className,
  showStatusLabel = false,
}: UserAvatarWithPresenceProps) {
  const user = useAuthStore((s) => s.user)
  const status = usePresenceStore((s) => s.status)
  const avatarSrc = resolveAvatarUrl(user)
  const [imgFailed, setImgFailed] = useState(false)
  const option = getPresenceOption(status)
  const s = SIZE[size]
  const initial = user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'

  useEffect(() => {
    setImgFailed(false)
  }, [avatarSrc])

  // Có URL → hiện ảnh ngay; lỗi load → initials. Không spinner / không chờ localStorage.
  const showImage = !!avatarSrc && !imgFailed

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('relative shrink-0', s.wrap)}>
        {showImage ? (
          <img
            src={avatarSrc}
            alt="avatar"
            className={cn(s.wrap, 'rounded-full border border-border object-cover')}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className={cn(
              s.wrap,
              'flex items-center justify-center rounded-full bg-primary-600',
            )}
          >
            <span className={cn('font-bold uppercase text-white', s.text)}>{initial}</span>
          </div>
        )}

        <span
          className={cn(
            'absolute rounded-full border-white',
            s.dot,
            s.offset,
            option.dotClass,
            option.pulse && 'animate-presence-pulse',
          )}
          title={option.label}
          aria-label={`Trạng thái: ${option.label}`}
        />
      </div>

      {showStatusLabel && (
        <span className="text-xs font-medium text-neutral-500">{option.label}</span>
      )}
    </div>
  )
}
