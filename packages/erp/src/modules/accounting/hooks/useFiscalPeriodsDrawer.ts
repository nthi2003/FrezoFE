import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export const PERIODS_DRAWER_KEY = 'periods'

/** Sync drawer open state với `?drawer=periods` trên URL (deep-link + legacy redirect). */
export function useFiscalPeriodsDrawer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const isOpen = searchParams.get('drawer') === PERIODS_DRAWER_KEY

  const open = useCallback(() => {
    const sp = new URLSearchParams(searchParams)
    sp.set('drawer', PERIODS_DRAWER_KEY)
    setSearchParams(sp, { replace: true })
  }, [searchParams, setSearchParams])

  const close = useCallback(() => {
    const sp = new URLSearchParams(searchParams)
    sp.delete('drawer')
    setSearchParams(sp, { replace: true })
  }, [searchParams, setSearchParams])

  return { isOpen, open, close }
}
