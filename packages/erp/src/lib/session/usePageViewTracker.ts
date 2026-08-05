import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { usageApi } from '@/modules/qtht/services/usageApi'
import { useAuthStore } from '@/stores/authStore'

function resolveModule(pathname: string): string {
  const seg = pathname.split('/').filter(Boolean)[0] || 'home'
  const map: Record<string, string> = {
    qtht: 'QTHT',
    qlns: 'QLNS',
    warehouse: 'WAREHOUSE',
    crm: 'CRM',
    product: 'PRODUCT',
    products: 'PRODUCT',
    accounting: 'ACCOUNTING',
    approval: 'APPROVAL',
    task: 'TASK',
    assets: 'ASSET',
    mkt: 'MKT',
    dashboard: 'DASHBOARD',
    profile: 'PROFILE',
    docs: 'DOCS',
  }
  return map[seg] || seg.toUpperCase()
}

/** Ghi pageview khi đổi route (debounce 800ms, bỏ qua trùng path). */
export function usePageViewTracker() {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const lastRef = useRef<string>('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    const path = location.pathname
    if (!path || path === lastRef.current) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      lastRef.current = path
      usageApi.trackPageView(path, resolveModule(path)).catch(() => {})
    }, 800)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [location.pathname, isAuthenticated])
}
