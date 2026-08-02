import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PAYROLL_PERIODS_DRAWER_KEY } from '../utils/qlnsRoutes'

/** Sync drawer open state với `?drawer=periods` trên URL (deep-link + legacy redirect). */
export function usePayrollPeriodsDrawer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const isOpen = searchParams.get('drawer') === PAYROLL_PERIODS_DRAWER_KEY

  const open = useCallback(() => {
    const sp = new URLSearchParams(searchParams)
    sp.set('drawer', PAYROLL_PERIODS_DRAWER_KEY)
    setSearchParams(sp, { replace: true })
  }, [searchParams, setSearchParams])

  const close = useCallback(() => {
    const sp = new URLSearchParams(searchParams)
    sp.delete('drawer')
    setSearchParams(sp, { replace: true })
  }, [searchParams, setSearchParams])

  return { isOpen, open, close }
}
