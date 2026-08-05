import { useEffect, useRef } from 'react'
import { usageApi } from '@/modules/qtht/services/usageApi'
import { useAuthStore } from '@/stores/authStore'

const INTERVAL_MS = 90_000

/** Ping session heartbeat khi tab visible — cập nhật lastActiveTime trên BE. */
export function useSessionHeartbeat() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    const ping = () => {
      if (document.visibilityState !== 'visible') return
      usageApi.heartbeat().catch(() => {
        /* silent — không spam toast */
      })
    }

    ping()
    timerRef.current = setInterval(ping, INTERVAL_MS)

    const onVis = () => {
      if (document.visibilityState === 'visible') ping()
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [isAuthenticated])
}
