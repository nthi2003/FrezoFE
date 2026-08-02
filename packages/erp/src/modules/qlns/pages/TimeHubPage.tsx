import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LayoutDashboard, UsersRound, ListChecks, PlaneTakeoff } from 'lucide-react'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { QlnsHubLayout } from '../components/QlnsHubLayout'
import {
  TIME_TABS,
  DEFAULT_TIME_TAB,
  getVisibleTimeTabs,
  resolveTimeTab,
} from '../utils/qlnsRoutes'
import { AttendancePage } from './AttendancePage'
import { LeavesPage } from './LeavesPage'

const TAB_ICONS = {
  overview: LayoutDashboard,
  daily: UsersRound,
  records: ListChecks,
  leaves: PlaneTakeoff,
} as const

export function TimeHubPage() {
  const [searchParams] = useSearchParams()
  const { flatMenuFeUrls } = useMenus()

  const visibleTabKeys = useMemo(
    () => getVisibleTimeTabs(flatMenuFeUrls),
    [flatMenuFeUrls],
  )

  const tab = useMemo(
    () => resolveTimeTab(searchParams.get('tab'), flatMenuFeUrls),
    [searchParams, flatMenuFeUrls],
  )

  const tabs = TIME_TABS.map((t) => ({
    key: t.key,
    label: t.label,
    icon: TAB_ICONS[t.key],
    hint: t.hint,
  }))

  const attendanceTab =
    tab === 'overview' ? 'overview' : tab === 'daily' ? 'daily' : tab === 'records' ? 'list' : null

  return (
    <QlnsHubLayout
      title="Chấm công & nghỉ phép"
      description="Theo dõi chấm công hàng ngày, tổng hợp công tháng và duyệt đơn nghỉ — tại một nơi."
      tabs={tabs}
      tab={tab}
      visibleTabKeys={visibleTabKeys}
      defaultTab={DEFAULT_TIME_TAB}
      syncKey={flatMenuFeUrls}
      onResolveTab={(raw) => resolveTimeTab(raw, flatMenuFeUrls)}
    >
      {attendanceTab && <AttendancePage embedded initialTab={attendanceTab} />}
      {tab === 'leaves' && <LeavesPage embedded />}
    </QlnsHubLayout>
  )
}
