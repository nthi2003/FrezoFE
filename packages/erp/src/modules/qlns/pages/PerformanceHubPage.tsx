import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Target, Star } from 'lucide-react'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { QlnsHubLayout } from '../components/QlnsHubLayout'
import {
  PERFORMANCE_TABS,
  DEFAULT_PERFORMANCE_TAB,
  getVisiblePerformanceTabs,
  resolvePerformanceTab,
} from '../utils/qlnsRoutes'
import { OkrsPage } from './OkrsPage'
import { PerformanceReviewsPage } from './PerformanceReviewsPage'

const TAB_ICONS = {
  okrs: Target,
  reviews: Star,
} as const

/** Wave 2 hub — stub embeds legacy pages. */
export function PerformanceHubPage() {
  const [searchParams] = useSearchParams()
  const { flatMenuFeUrls } = useMenus()

  const visibleTabKeys = useMemo(
    () => getVisiblePerformanceTabs(flatMenuFeUrls),
    [flatMenuFeUrls],
  )

  const tab = useMemo(
    () => resolvePerformanceTab(searchParams.get('tab'), flatMenuFeUrls),
    [searchParams, flatMenuFeUrls],
  )

  const tabs = PERFORMANCE_TABS.map((t) => ({
    key: t.key,
    label: t.label,
    icon: TAB_ICONS[t.key],
    hint: t.hint,
  }))

  return (
    <QlnsHubLayout
      title="Hiệu suất"
      description="OKR, mục tiêu và đánh giá hiệu suất nhân viên."
      tabs={tabs}
      tab={tab}
      visibleTabKeys={visibleTabKeys}
      defaultTab={DEFAULT_PERFORMANCE_TAB}
      syncKey={flatMenuFeUrls}
      onResolveTab={(raw) => resolvePerformanceTab(raw, flatMenuFeUrls)}
    >
      {tab === 'okrs' && <OkrsPage />}
      {tab === 'reviews' && <PerformanceReviewsPage />}
    </QlnsHubLayout>
  )
}
