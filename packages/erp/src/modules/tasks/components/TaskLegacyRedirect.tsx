import { Navigate, useLocation } from 'react-router-dom'
import type { WorkTab } from '../utils/taskRoutes'

/** Redirect legacy `/task/tickets`, `/task/tags`, `/tasks` → hub với tab tương ứng. */
export function TaskLegacyRedirect({ tab }: { tab?: WorkTab }) {
  const location = useLocation()
  const sp = new URLSearchParams(location.search)
  if (tab && !sp.has('tab')) sp.set('tab', tab)
  const qs = sp.toString()
  return <Navigate to={qs ? `/task?${qs}` : '/task'} replace />
}
