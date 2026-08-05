import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Target, Star, Gift } from 'lucide-react'
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
import { RecognitionPage } from './RecognitionPage'

const TAB_ICONS = {
  okrs: Target,
  reviews: Star,
  recognition: Gift,
} as const

/** Wave 2 hub — OKR · Reviews · Ghi nhận (token). */
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
      description="OKR, đánh giá hiệu suất và ghi nhận đóng góp bằng điểm."
      tabs={tabs}
      tab={tab}
      visibleTabKeys={visibleTabKeys}
      defaultTab={DEFAULT_PERFORMANCE_TAB}
      syncKey={flatMenuFeUrls}
      onResolveTab={(raw) => resolvePerformanceTab(raw, flatMenuFeUrls)}
    >
      {tab === 'okrs' && <OkrsPage embedded />}
      {tab === 'reviews' && <PerformanceReviewsPage embedded />}
      {tab === 'recognition' && <RecognitionPage embedded />}
    </QlnsHubLayout>
  )
}
