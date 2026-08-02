import { Navigate, useLocation } from 'react-router-dom'

/** Redirect legacy `/accounting/*` leaf routes → hub với tab hoặc drawer tương ứng. */
export function AccountingLegacyRedirect({
  hubPath,
  tab,
  drawer,
}: {
  hubPath: string
  tab?: string
  drawer?: string
}) {
  const location = useLocation()
  const sp = new URLSearchParams(location.search)
  if (tab && !sp.has('tab') && tab !== 'periods') sp.set('tab', tab)
  if (drawer && !sp.has('drawer')) sp.set('drawer', drawer)
  if (tab === 'periods' && !sp.has('drawer')) sp.set('drawer', 'periods')
  const qs = sp.toString()
  return <Navigate to={qs ? `${hubPath}?${qs}` : hubPath} replace />
}
