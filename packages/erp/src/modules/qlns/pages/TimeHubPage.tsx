import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LayoutDashboard, UsersRound, ListChecks, PlaneTakeoff, Plus } from 'lucide-react'
import { Button, PageGuideButton } from '@frezo/ui'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { usePermission } from '@/lib/hooks/usePermission'
import { QlnsHubLayout } from '../components/QlnsHubLayout'
import { LeaveRequestModal } from '../components/LeaveRequestModal'
import { LEAVES_GUIDE } from '../constants/leaves.guide'
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
  const canCreateLeave = usePermission('LEAVE.CREATE')
  const [createLeaveOpen, setCreateLeaveOpen] = useState(false)

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

  const openCreateLeave = () => setCreateLeaveOpen(true)

  return (
    <>
      <QlnsHubLayout
        title="Chấm công & nghỉ phép"
        description="Theo dõi chấm công hàng ngày, tổng hợp công tháng và duyệt đơn nghỉ — tại một nơi."
        tabs={tabs}
        tab={tab}
        visibleTabKeys={visibleTabKeys}
        defaultTab={DEFAULT_TIME_TAB}
        syncKey={flatMenuFeUrls}
        onResolveTab={(raw) => resolveTimeTab(raw, flatMenuFeUrls)}
        headerExtra={
          tab === 'leaves' ? (
            <>
              <PageGuideButton guide={LEAVES_GUIDE} />
              {canCreateLeave && (
                <Button onClick={openCreateLeave} className="gap-1.5">
                  <Plus size={14} />
                  Tạo đơn nghỉ phép
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {attendanceTab && <AttendancePage embedded initialTab={attendanceTab} />}
        {tab === 'leaves' && (
          <LeavesPage embedded onCreateLeave={canCreateLeave ? openCreateLeave : undefined} />
        )}
      </QlnsHubLayout>

      <LeaveRequestModal open={createLeaveOpen} onClose={() => setCreateLeaveOpen(false)} />
    </>
  )
}
