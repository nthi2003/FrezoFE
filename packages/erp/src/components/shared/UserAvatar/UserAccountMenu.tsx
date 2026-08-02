// Menu tài khoản dùng chung — Lobby + Header (avatar + presence + profile + logout)

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { cn } from '@frezo/utils'
import { useAuthStore } from '@/stores/authStore'
import { usePresenceInit } from '@/lib/presence/usePresenceInit'
import { getPresenceOption } from '@/lib/presence/presenceConfig'
import { usePresenceStore } from '@/stores/presenceStore'
import { UserAvatarWithPresence } from './UserAvatarWithPresence'
import { PresenceStatusPicker } from './PresenceStatusPicker'

interface UserAccountMenuProps {
  /** Hiện tên bên cạnh avatar (header desktop) */
  showName?: boolean
  className?: string
}

export function UserAccountMenu({ showName = true, className }: UserAccountMenuProps) {
  usePresenceInit()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const status = usePresenceStore((s) => s.status)
  const presence = getPresenceOption(status)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-2 border-l border-border"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserAvatarWithPresence size="sm" />
        {showName && (
          <div className="hidden md:block min-w-0 text-left">
            <div className="max-w-[120px] truncate text-xs font-semibold text-neutral-700">
              {user?.fullName || user?.username}
            </div>
            <div className="max-w-[120px] truncate text-[10px] text-neutral-400">
              {presence.label}
            </div>
          </div>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-10 right-0 z-50 w-56 animate-fade-in overflow-hidden rounded-xl border border-border bg-white shadow-lg"
        >
          <div className="border-b border-border bg-neutral-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <UserAvatarWithPresence size="md" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-neutral-800">
                  {user?.fullName || user?.username}
                </div>
                <div className="truncate text-xs text-neutral-500">
                  {user?.email || user?.username}
                </div>
              </div>
            </div>
          </div>

          <PresenceStatusPicker />

          <div className="border-t border-border py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                navigate('/profile')
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              <User size={15} className="text-neutral-400" />
              <span>Thông tin cá nhân</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                logout()
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={15} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
