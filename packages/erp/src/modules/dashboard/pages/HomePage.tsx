// ============================================================
// FREZO ERP — Home (portal) — mọi user đăng nhập
// Hero công bố + KPI strip + quick links + chương trình tháng
// + bảng Sale vàng + tin nội bộ + launcher chức năng
// ============================================================

import { useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useHomeFeedArticles } from '@/modules/articles/hooks/useArticle'
import {
  selectMonthlyPrograms,
  sortPublishedDesc,
} from '@/modules/articles/utils/homeArticle'
import { useHomeInsights } from '../hooks/useHomeInsights'
import { HomeHero } from '../components/HomeHero'
import { HomeStats } from '../components/HomeStats'
import { HomeQuickLinks } from '../components/HomeQuickLinks'
import { MonthlyPrograms } from '../components/MonthlyPrograms'
import { SalesHonorBoard } from '../components/SalesHonorBoard'
import { CompanyAnnouncements } from '../components/CompanyAnnouncements'
import { ModuleLauncher } from '../components/ModuleLauncher'

const PROGRAM_LIMIT = 2
const ANNOUNCEMENT_LIMIT = 6

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Chào buổi sáng'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

function getISOWeek(d: Date): number {
  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
}

export function HomePage() {
  const user = useAuthStore((s) => s.user)
  const now = useMemo(() => new Date(), [])
  const insights = useHomeInsights()
  const { data, isLoading, isError, refetch, isFetching } = useHomeFeedArticles()

  const articles = useMemo(() => sortPublishedDesc(data), [data])
  const featured = articles[0] ?? null

  const programs = useMemo(
    () => selectMonthlyPrograms(articles, PROGRAM_LIMIT, featured ? [featured.id] : []),
    [articles, featured],
  )

  // Tin còn lại: bỏ bài đã lên Hero và các chương trình đã hiện ở block trên.
  const announcements = useMemo(() => {
    const shown = new Set(programs.items.map((p) => p.id))
    if (featured) shown.add(featured.id)
    return articles.filter((a) => !shown.has(a.id)).slice(0, ANNOUNCEMENT_LIMIT)
  }, [articles, featured, programs.items])

  const dateStr = now.toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const dateLabel = `${dateStr[0].toUpperCase()}${dateStr.slice(1)} · Tuần ${getISOWeek(now)}`
  const userLabel = user?.fullName || user?.username || 'bạn'

  return (
    <div className="animate-fade-in space-y-5 md:space-y-6">
      <HomeHero
        greeting={getGreeting()}
        userLabel={userLabel}
        dateLabel={dateLabel}
        featured={featured}
        isLoading={isLoading}
      />

      <HomeStats insights={insights} />

      <HomeQuickLinks />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 md:gap-6">
        <div className={insights.canSeeOverview ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <MonthlyPrograms selection={programs} isLoading={isLoading} />
        </div>
        {insights.canSeeOverview && (
          <SalesHonorBoard
            rows={insights.leaderboard}
            period={insights.honorPeriod}
            isLoading={insights.deals.isLoading}
          />
        )}
      </div>

      <CompanyAnnouncements
        items={announcements}
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        onRetry={() => void refetch()}
        isFeedEmpty={!isLoading && articles.length === 0}
      />

      <ModuleLauncher />
    </div>
  )
}
