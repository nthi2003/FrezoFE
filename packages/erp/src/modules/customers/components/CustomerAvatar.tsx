import { Camera, Loader2 } from 'lucide-react'
import { useRef, type ChangeEvent } from 'react'
import { cn } from '@frezo/utils'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export interface CustomerAvatarProps {
  name?: string | null
  avatarUrl?: string | null
  /** COMPANY | INDIVIDUAL — chỉ ảnh hưởng màu fallback initials */
  type?: string | null
  taxCode?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Cho phép click đổi ảnh (cần onUpload) */
  editable?: boolean
  uploading?: boolean
  onUpload?: (file: File) => void
}

const SIZE_MAP = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-16 h-16 text-lg',
  lg: 'w-20 h-20 text-xl',
} as const

/**
 * Avatar khách hàng — hiện ảnh thật nếu có `avatarUrl`, không thì initials.
 * Dùng chung list / detail modal / Customer 360.
 */
export function CustomerAvatar({
  name,
  avatarUrl,
  type,
  taxCode,
  size = 'sm',
  className,
  editable,
  uploading,
  onUpload,
}: CustomerAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isCompany = type === 'COMPANY' || !!taxCode
  const sizeCls = SIZE_MAP[size]

  const fallbackTone = isCompany
    ? 'bg-primary-600 text-white'
    : 'bg-primary-500 text-white'

  const handlePick = () => {
    if (!editable || uploading) return
    inputRef.current?.click()
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload?.(file)
    e.target.value = ''
  }

  return (
    <div className={cn('relative shrink-0', className)}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || 'avatar'}
          className={cn(sizeCls, 'rounded-full object-cover border border-neutral-200', editable && 'cursor-pointer')}
          onClick={handlePick}
        />
      ) : (
        <div
          className={cn(
            sizeCls,
            'rounded-full flex items-center justify-center font-bold border border-neutral-200',
            fallbackTone,
            editable && 'cursor-pointer',
          )}
          title={isCompany ? 'Doanh nghiệp' : 'Cá nhân'}
          onClick={handlePick}
          role={editable ? 'button' : undefined}
        >
          {getInitials(name)}
        </div>
      )}

      {editable && (
        <>
          <button
            type="button"
            title="Đổi avatar"
            onClick={handlePick}
            disabled={uploading}
            className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center border-2 border-white hover:bg-primary-700 disabled:opacity-60"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} strokeWidth={1.5} />}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleChange}
          />
        </>
      )}
    </div>
  )
}
