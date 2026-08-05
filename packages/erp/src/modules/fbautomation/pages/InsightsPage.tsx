import {
  RefreshCw, Users, FileText, Link2, Megaphone, Star, MousePointerClick, TrendingUp,
} from 'lucide-react'
import { Button, PageHeader, EmptyState, ErrorState } from '@frezo/ui'
import { useMktInsights } from '../hooks/useMkt'

const formatVND = (v?: number) => {
  if (v == null || v === 0) return '0 ₫'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M₫'
  if (v >= 1_000) return (v / 1_000).toFixed(1) + ' K₫'
  return Number(v).toLocaleString('vi-VN') + ' ₫'
}

const formatPct = (v?: number) => (v == null ? '—' : (Number(v) * 100).toFixed(2) + '%')

export function InsightsPage() {
  const { data, isLoading, isFetching, isError, refetch } = useMktInsights()
  const d: any = data || {}

  const breakdown = (obj: Record<string, number> | undefined) =>
    Object.entries(obj || {}).map(([k, v]) => ({ key: k, value: v }))

  const isEmpty = !isLoading && !isError && (d.totalLeads ?? 0) === 0 && (d.totalPosts ?? 0) === 0
    && (d.adCampaigns ?? 0) === 0 && (d.affiliateLinks ?? 0) === 0

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Phân tích Fanpage"
        description="Tổng hợp khách tiềm năng, nội dung, tiếp thị liên kết và quảng cáo từ dữ liệu Frezo. Phân tích Meta Graph sẽ bổ sung khi có mã trang."
        actions={
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={16} className={isFetching ? 'animate-spin mr-2' : 'mr-2'} />
            Làm mới
          </Button>
        }
      />

      {isError ? (
        <ErrorState title="Không tải được phân tích" onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState
          title="Chưa có dữ liệu marketing"
          description="Khi có khách tiềm năng, bài đăng, tiếp thị liên kết hoặc chiến dịch quảng cáo, bảng điều khiển sẽ hiện tại đây."
        />
      ) : (
        <>
          {d.note ? (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {d.note}
            </div>
          ) : null}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi icon={Users} label="Khách tiềm năng" value={d.totalLeads ?? 0} />
            <Kpi icon={FileText} label="Bài đăng" value={d.totalPosts ?? 0} sub={`${d.postsPublished ?? 0} đã đăng`} />
            <Kpi icon={Link2} label="Click tiếp thị liên kết" value={d.affiliateClicks ?? 0} sub={`Tỷ lệ chuyển đổi ${formatPct(d.affiliateConversionRate)}`} />
            <Kpi icon={Megaphone} label="Chi phí quảng cáo" value={formatVND(d.adSpend)} sub={`${d.adLeads ?? 0} khách từ ads`} />
            <Kpi icon={MousePointerClick} label="CTR quảng cáo" value={formatPct(d.adCtr)} sub={`${(d.adClicks ?? 0).toLocaleString('vi-VN')} click`} />
            <Kpi icon={TrendingUp} label="Lượt hiển thị ads" value={(d.adImpressions ?? 0).toLocaleString('vi-VN')} />
            <Kpi icon={Star} label="Đánh giá trung bình" value={d.averageRating ?? 0} sub={`${d.lowRatingReviews ?? 0} ≤2★`} />
            <Kpi icon={Users} label="Tài khoản / Nhóm FB" value={`${d.fbAccounts ?? 0} / ${d.fbGroups ?? 0}`} />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Breakdown title="Khách tiềm năng theo nguồn" rows={breakdown(d.leadsBySource)} />
            <Breakdown title="Khách tiềm năng theo trạng thái" rows={breakdown(d.leadsByStatus)} />
            <Breakdown title="Bài theo kênh" rows={breakdown(d.postsByChannel)} />
          </div>
        </>
      )}
    </div>
  )
}

function Kpi({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
        <Icon size={14} />
        {label}
      </div>
      <div className="text-lg font-semibold text-neutral-900">{value}</div>
      {sub ? <div className="text-xs text-neutral-500 mt-0.5">{sub}</div> : null}
    </div>
  )
}

function Breakdown({ title, rows }: { title: string; rows: { key: string; value: number }[] }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="text-sm font-semibold text-neutral-800 mb-3">{title}</div>
      {rows.length === 0 ? (
        <div className="text-sm text-neutral-400 text-center py-4">Chưa có dữ liệu</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 truncate">{r.key}</span>
              <span className="font-semibold text-neutral-900">{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default InsightsPage
