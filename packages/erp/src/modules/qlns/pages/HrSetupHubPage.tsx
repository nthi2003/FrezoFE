import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FolderTree, Briefcase, Coins } from 'lucide-react'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { QlnsHubLayout } from '../components/QlnsHubLayout'
import {
  HR_SETUP_TABS,
  DEFAULT_HR_SETUP_TAB,
  getVisibleHrSetupTabs,
  resolveHrSetupTab,
} from '../utils/qlnsRoutes'
import { HrCategoriesPage } from './HrCategoriesPage'
import { JobPositionsPage } from './JobPositionsPage'
import { PayrollComponentsPage } from './PayrollComponentsPage'

const TAB_ICONS = {
  categories: FolderTree,
  positions: Briefcase,
  allowances: Coins,
} as const

/** Admin hub — thiết lập HR: Hạng mục → Vị trí → Phụ cấp */
export function HrSetupHubPage() {
  const [searchParams] = useSearchParams()
  const { flatMenuFeUrls } = useMenus()

  const visibleTabKeys = useMemo(
    () => getVisibleHrSetupTabs(flatMenuFeUrls),
    [flatMenuFeUrls],
  )

  const tab = useMemo(
    () => resolveHrSetupTab(searchParams.get('tab'), flatMenuFeUrls),
    [searchParams, flatMenuFeUrls],
  )

  const tabs = HR_SETUP_TABS.map((t) => ({
    key: t.key,
    label: t.label,
    icon: TAB_ICONS[t.key],
    hint: t.hint,
  }))

  return (
    <QlnsHubLayout
      title="Thiết lập hồ sơ nhân sự"
      description="Thứ tự khuyến nghị: Hạng mục → Vị trí công việc → Phụ cấp/khấu trừ → Hồ sơ nhân viên."
      tabs={tabs}
      tab={tab}
      visibleTabKeys={visibleTabKeys}
      defaultTab={DEFAULT_HR_SETUP_TAB}
      syncKey={flatMenuFeUrls}
      onResolveTab={(raw) => resolveHrSetupTab(raw, flatMenuFeUrls)}
    >
      {tab === 'categories' && <HrCategoriesPage embedded />}
      {tab === 'positions' && <JobPositionsPage embedded />}
      {tab === 'allowances' && <PayrollComponentsPage embedded />}
    </QlnsHubLayout>
  )
}
