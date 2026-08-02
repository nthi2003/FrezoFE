import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CRM_EXPORT_DRAWER_KEY, CRM_SEQUENCES_DRAWER_KEY } from '../utils/crmRoutes'

export type CrmHubDrawerKey = typeof CRM_SEQUENCES_DRAWER_KEY | typeof CRM_EXPORT_DRAWER_KEY

/** Sync drawer open state với `?drawer=` trên URL (deep-link + legacy redirect). */
export function useCrmHubDrawer(key: CrmHubDrawerKey) {
  const [searchParams, setSearchParams] = useSearchParams()
  const isOpen = searchParams.get('drawer') === key

  const open = useCallback(() => {
    const sp = new URLSearchParams(searchParams)
    sp.set('drawer', key)
    setSearchParams(sp, { replace: true })
  }, [searchParams, setSearchParams, key])

  const close = useCallback(() => {
    const sp = new URLSearchParams(searchParams)
    if (sp.get('drawer') === key) sp.delete('drawer')
    setSearchParams(sp, { replace: true })
  }, [searchParams, setSearchParams, key])

  return { isOpen, open, close }
}
