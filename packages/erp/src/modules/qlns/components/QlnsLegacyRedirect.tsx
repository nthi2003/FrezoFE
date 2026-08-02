import { Navigate, useLocation } from 'react-router-dom'

/** Redirect legacy QLNS leaf routes → hub với tab/drawer tương ứng. */
export function QlnsLegacyRedirect({
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
  if (tab && !sp.has('tab')) sp.set('tab', tab)
  if (drawer && !sp.has('drawer')) sp.set('drawer', drawer)
  const qs = sp.toString()
  return <Navigate to={qs ? `${hubPath}?${qs}` : hubPath} replace />
}
