// ============================================================



// FREZO ERP — Lobby / Sảnh chờ



// Sảnh chờ action-oriented — pending, quick access, grid module



// ============================================================



import { useEffect, useMemo, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { Bell, Newspaper } from 'lucide-react'

import { useAuthStore } from '@/stores/authStore'

import { useHomeFeedArticles } from '@/modules/articles/hooks/useArticle'

import { sortPublishedDesc } from '@/modules/articles/utils/homeArticle'

import { UserAvatarWithPresence } from '@/components/shared/UserAvatar'

import { usePresenceInit } from '@/lib/presence/usePresenceInit'

import { usePresenceStore } from '@/stores/presenceStore'

import { getPresenceOption } from '@/lib/presence/presenceConfig'

import { cn } from '@/lib/utils/cn'

import { LobbyMenuGrid } from '../components/LobbyMenuGrid'

import { LobbyPendingStrip } from '../components/LobbyPendingStrip'

import { LobbyRecentShortcuts } from '../components/LobbyRecentShortcuts'

import { LobbyTodayChips } from '../components/LobbyTodayChips'

import { LobbyTodayContext } from '../components/LobbyTodayContext'

import { LobbyNewsSection } from '../components/LobbyNewsSection'



function getGreeting(): string {

  const h = new Date().getHours()

  if (h < 12) return 'Chào buổi sáng'

  if (h < 18) return 'Chào buổi chiều'

  return 'Chào buổi tối'

}



function formatVnClock(date: Date): string {

  return date.toLocaleTimeString('vi-VN', {

    hour: '2-digit',

    minute: '2-digit',

    timeZone: 'Asia/Ho_Chi_Minh',

  })

}



export function LobbyPage() {

  usePresenceInit()

  const nav = useNavigate()

  const user = useAuthStore((s) => s.user)

  const status = usePresenceStore((s) => s.status)

  const presence = getPresenceOption(status)

  const { data, isLoading } = useHomeFeedArticles()

  const articles = useMemo(() => sortPublishedDesc(data), [data])

  const userLabel = user?.fullName || user?.username || 'bạn'



  const [clock, setClock] = useState(() => formatVnClock(new Date()))



  useEffect(() => {

    const tick = () => setClock(formatVnClock(new Date()))

    tick()

    const id = window.setInterval(tick, 30_000)

    return () => window.clearInterval(id)

  }, [])



  const dateStr = new Date().toLocaleDateString('vi-VN', {

    weekday: 'long',

    day: 'numeric',

    month: 'long',

    year: 'numeric',

    timeZone: 'Asia/Ho_Chi_Minh',

  })

  const dateLabel = `${dateStr[0].toUpperCase()}${dateStr.slice(1)}`



  return (

    <div className="animate-fade-in">

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8">

        {/* 1. Greeting */}

        <div className="flex items-start gap-4">

          <UserAvatarWithPresence size="lg" />

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">

              <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">

                {getGreeting()}, <span className="text-primary-700">{userLabel}</span>

              </h1>

              <span className="text-sm tabular-nums text-neutral-400">{clock}</span>

            </div>

            <p className="mt-1 text-sm text-neutral-500">{dateLabel}</p>

            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500">

              <span

                className={cn(

                  'inline-block h-2 w-2 rounded-full',

                  presence.dotClass,

                  presence.pulse && 'animate-pulse',

                )}

                aria-hidden

              />

              {presence.label}

            </p>

          </div>

        </div>



        {/* 2. Việc cần xử lý + preview */}

        <LobbyPendingStrip />



        {/* 3–5. Quick access: recent, today chips, today context */}

        <div className="space-y-6 rounded-xl border border-neutral-200 bg-surface/50 p-4 sm:p-5">

          <LobbyRecentShortcuts />

          <LobbyTodayChips />

          <LobbyTodayContext />

        </div>



        {/* 6. Module grid + ghim */}

        <LobbyMenuGrid />



        {/* 7. Tin nội bộ */}

        <LobbyNewsSection articles={articles} isLoading={isLoading} />



        {/* Footer links */}

        <div className="flex flex-wrap gap-2 border-t border-neutral-200 pt-6">

          <button

            type="button"

            onClick={() => nav('/bai-viet')}

            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-surface px-3.5 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800"

          >

            <Newspaper size={16} strokeWidth={1.5} />

            Tin nội bộ

          </button>

          <button

            type="button"

            onClick={() => nav('/notifications')}

            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-surface px-3.5 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800"

          >

            <Bell size={16} strokeWidth={1.5} />

            Thông báo

          </button>

        </div>

      </div>

    </div>

  )

}


