// ============================================================
// MKT · Affiliate / KOL
// ------------------------------------------------------------
// Trang quản lý affiliate link cho chương trình KOL/CTV:
//  - KPI: tổng link, click, conversion, doanh thu, hoa hồng dự kiến
//  - Top KOL / Top campaign
//  - CRUD link (tạo, sửa, xoá, sao chép URL)
// ============================================================

import { useMemo, useState } from 'react'
import {
  Link2, Copy, TrendingUp, Users, DollarSign, MousePointerClick,
  Percent, Trophy, Plus, ExternalLink, Trash2, Loader2, Search, RefreshCw, HelpCircle,
} from 'lucide-react'
import {
  Button, PageHeader, EmptyState, ErrorState, AppModal, Input, Label, Select, IconActionButton, AppTooltip,
} from '@frezo/ui'
import { toast } from 'sonner'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import {
  useAffiliateLinks, useAffiliateDashboard, useCreateAffiliateLink,
  useDeleteAffiliateLink,
} from '../hooks/useMkt'

interface AffiliateLink {
  id: string
  code: string
  shortUrl: string
  targetUrl: string
  targetUrlWithUtm?: string
  campaign?: string
  kolName?: string
  kolContact?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  commissionRate?: number
  status?: string
  clickCount: number
  uniqueClickCount: number
  conversionCount: number
  revenue: number
  estimatedCommission: number
  conversionRate: number
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  EXPIRED: 'Hết hạn',
  PAUSED: 'Tạm dừng',
}

const formatVND = (v: number | undefined) => {
  if (!v) return '0 ₫'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M₫'
  if (v >= 1_000) return (v / 1_000).toFixed(1) + ' K₫'
  return v.toLocaleString('vi-VN') + ' ₫'
}

const formatPercent = (v: number | undefined) =>
  v == null ? '—' : (v * 100).toFixed(1) + '%'

export function AffiliatePage() {
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const deleteLink = useDeleteAffiliateLink()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'PAUSED'>('ALL')
  const [showCreate, setShowCreate] = useState(false)

  const { data: dashboardData, refetch: refetchDashboard } = useAffiliateDashboard()
  const { data: linksData, isLoading, isFetching, isError, refetch } = useAffiliateLinks()

  const links: AffiliateLink[] = useMemo(
    () => (Array.isArray(linksData) ? linksData : []),
    [linksData],
  )
  const dashboard: any = dashboardData || {}

  const filtered = useMemo(() => {
    let rows = links
    if (statusFilter !== 'ALL') {
      rows = rows.filter((l) => (l.status || 'ACTIVE') === statusFilter)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (l) =>
          l.code.toLowerCase().includes(q) ||
          (l.kolName || '').toLowerCase().includes(q) ||
          (l.campaign || '').toLowerCase().includes(q) ||
          (l.targetUrl || '').toLowerCase().includes(q),
      )
    }
    return rows
  }, [links, search, statusFilter])

  const hasFilter = !!search.trim() || statusFilter !== 'ALL'
  const isFullyEmpty = !isLoading && !isError && links.length === 0
  const isFilteredEmpty = !isLoading && !isError && links.length > 0 && filtered.length === 0

  const copy = async (text: string, hint = 'Đã copy link') => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(hint)
    } catch {
      toast.error('Không copy được — trình duyệt chặn clipboard')
    }
  }

  const refreshAll = () => {
    refetch()
    refetchDashboard()
  }

  const columns: AppTableColumn<AffiliateLink>[] = [
    {
      key: 'link',
      title: 'Link',
      render: (_, link) => (
        <div>
          <div className="font-mono text-xs text-primary-700 font-semibold">{link.code}</div>
          <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
            <span className="truncate max-w-[220px]" title={link.shortUrl}>{link.shortUrl}</span>
            <IconActionButton tooltip="Sao chép short URL" size="sm" className="p-1" onClick={() => copy(link.shortUrl)}>
              <Copy size={12} />
            </IconActionButton>
          </div>
        </div>
      ),
    },
    {
      key: 'kol',
      title: 'KOL / Chiến dịch',
      render: (_, link) => (
        <div>
          <div className="text-sm font-medium text-neutral-900">{link.kolName || '—'}</div>
          {link.campaign && (
            <div className="text-xs text-neutral-500 mt-0.5">Camp: {link.campaign}</div>
          )}
        </div>
      ),
    },
    {
      key: 'clickCount',
      title: 'Click',
      align: 'right',
      render: (_, link) => <span className="font-mono text-sm tabular-nums">{link.clickCount}</span>,
    },
    {
      key: 'conversionCount',
      title: 'Chuyển đổi',
      align: 'right',
      render: (_, link) => <span className="font-mono text-sm tabular-nums">{link.conversionCount}</span>,
    },
    {
      key: 'conversionRate',
      title: 'Tỉ lệ CR',
      align: 'right',
      render: (_, link) => (
        <span className="text-sm font-semibold text-amber-600">{formatPercent(link.conversionRate)}</span>
      ),
    },
    {
      key: 'revenue',
      title: 'Doanh thu',
      align: 'right',
      render: (_, link) => <span className="text-sm font-semibold tabular-nums">{formatVND(link.revenue)}</span>,
    },
    {
      key: 'commission',
      title: 'Hoa hồng',
      align: 'right',
      render: (_, link) => (
        <span className="text-sm text-violet-600 tabular-nums">{formatVND(link.estimatedCommission)}</span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      render: (_, link) => {
        const st = link.status || 'ACTIVE'
        return (
          <span
            className={`inline-flex text-[10px] px-2 py-0.5 rounded font-bold border ${
              st === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : st === 'EXPIRED'
                  ? 'bg-neutral-50 text-neutral-500 border-neutral-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {STATUS_LABEL[st] || st}
          </span>
        )
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: 120,
      render: (_, link) => (
        <div className="flex items-center justify-end gap-1">
          <IconActionButton tooltip="Mở URL đích" onClick={() => window.open(link.targetUrlWithUtm || link.targetUrl, '_blank')}>
            <ExternalLink size={14} />
          </IconActionButton>
          <IconActionButton tooltip="Sao chép URL đích (kèm UTM)" onClick={() => copy(link.targetUrlWithUtm || link.targetUrl, 'Đã copy URL đích')}>
            <Copy size={14} />
          </IconActionButton>
          <IconActionButton
            tooltip="Xoá"
            tone="red"
            onClick={() =>
              askConfirm({
                title: 'Xoá link này?',
                message: `Link ${link.code} sẽ bị xoá.`,
                confirmText: 'Xoá',
                onConfirm: () => deleteLink.mutate(link.id),
              })
            }
          >
            <Trash2 size={14} />
          </IconActionButton>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Theo dõi Affiliate / KOL"
        description="Sinh short link có UTM, đo click & chuyển đổi cho chương trình đối tác."
        actions={
          <>
            <Button variant="outline" onClick={refreshAll} disabled={isFetching}>
              <RefreshCw size={16} className={isFetching ? 'animate-spin mr-2' : 'mr-2'} />
              Làm mới
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} className="mr-2" />
              Tạo link mới
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi icon={Link2} label="Tổng link" value={dashboard.totalLinks ?? links.length} tone="primary" />
        <Kpi icon={MousePointerClick} label="Click" value={dashboard.totalClicks ?? 0} tone="blue" />
        <Kpi icon={TrendingUp} label="Chuyển đổi" value={dashboard.totalConversions ?? 0} tone="emerald" />
        <Kpi icon={Percent} label="Tỉ lệ CR" value={formatPercent(dashboard.conversionRate)} tone="amber" />
        <Kpi icon={DollarSign} label="Doanh thu" value={formatVND(dashboard.totalRevenue)} tone="rose" />
        <Kpi icon={Trophy} label="Hoa hồng ước tính" value={formatVND(dashboard.estimatedCommission)} tone="violet" />
      </div>

      {(dashboard.topKol?.length || dashboard.topCampaign?.length) ? (
        <div className="grid md:grid-cols-2 gap-4">
          <TopList
            title="Top KOL theo doanh thu"
            icon={Users}
            rows={(dashboard.topKol || []).map((k: any, idx: number) => ({
              rank: idx + 1,
              primary: k.kol,
              secondary: formatVND(k.revenue),
            }))}
          />
          <TopList
            title="Top chiến dịch theo click"
            icon={Trophy}
            rows={(dashboard.topCampaign || []).map((c: any, idx: number) => ({
              rank: idx + 1,
              primary: c.campaign,
              secondary: `${c.clicks} click`,
            }))}
          />
        </div>
      ) : null}

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => { setSearch(''); setStatusFilter('ALL') }}
        countLabel={`${filtered.length} link${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="min-w-[150px]">
          <Select
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Hoạt động' },
              { value: 'PAUSED', label: 'Tạm dừng' },
              { value: 'EXPIRED', label: 'Hết hạn' },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
            placeholder="Trạng thái"
            aria-label="Lọc trạng thái"
            showSearch={false}
          />
        </div>
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm mã, KOL, chiến dịch, URL đích…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm affiliate link"
          />
        </div>
        <span className="inline-flex items-center text-neutral-400" title="Short link tự kèm UTM khi tạo">
          <HelpCircle size={14} />
        </span>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được affiliate link"
            message="Kiểm tra kết nối rồi thử lại."
            onRetry={() => void refreshAll()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Link2}
            title={isFilteredEmpty ? 'Không tìm thấy link khớp bộ lọc' : 'Chưa có affiliate link'}
            description={
              isFilteredEmpty
                ? 'Thử từ khoá khác hoặc xoá lọc.'
                : 'Tạo link đầu tiên để bắt đầu chương trình KOL. Link sinh ra sẽ có UTM và theo dõi click/chuyển đổi.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: () => { setSearch(''); setStatusFilter('ALL') } }
                : { label: 'Tạo link đầu tiên', onClick: () => setShowCreate(true) }
            }
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={() => void refreshAll()}
          getRowId={(r) => r.id}
        />
      )}

      {showCreate && (
        <CreateLinkModal open={showCreate} onClose={() => setShowCreate(false)} />
      )}
      {confirmDialog}
    </div>
  )
}

function Kpi({
  icon: Icon, label, value, tone,
}: { icon: any; label: string; value: any; tone: string }) {
  const tones: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-700',
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    violet: 'bg-violet-50 text-violet-700',
  }
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${tones[tone] || tones.primary}`}>
          <Icon size={16} />
        </div>
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-bold text-neutral-900">{value}</div>
    </div>
  )
}

function TopList({
  title, icon: Icon, rows,
}: { title: string; icon: any; rows: Array<{ rank: number; primary: string; secondary: string }> }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-primary-600" />
        <h3 className="font-semibold text-sm text-neutral-900">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <div className="text-sm text-neutral-400 py-4 text-center">Chưa có dữ liệu</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.rank} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center text-xs font-bold">
                {r.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-900 truncate">{r.primary}</div>
              </div>
              <div className="text-sm font-semibold text-neutral-700">{r.secondary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateLinkModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    code: '',
    targetUrl: '',
    campaign: '',
    kolName: '',
    kolContact: '',
    utmSource: 'affiliate',
    utmMedium: 'kol',
    utmCampaign: '',
    commissionRate: 0.1,
  })
  const create = useCreateAffiliateLink()

  const submit = () => {
    if (!form.targetUrl.trim()) {
      toast.error('URL đích không được để trống')
      return
    }
    try {
      new URL(form.targetUrl)
    } catch {
      toast.error('URL đích không hợp lệ — phải bắt đầu bằng http:// hoặc https://')
      return
    }
    create.mutate(form, { onSuccess: onClose })
  }

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title="Tạo affiliate link mới"
      description="Slug tự sinh nếu để trống. UTM sẽ tự gắn vào URL đích."
      maxWidth="3xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>URL đích (bắt buộc)</Label>
          <Input
            placeholder="https://frezo.io/product/abc"
            value={form.targetUrl}
            onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
          />
        </div>
        <div>
          <Label>Mã slug (tuỳ chọn, để trống = tự sinh)</Label>
          <Input
            placeholder="VD: kolminh01"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
        </div>
        <div>
          <Label>Chiến dịch</Label>
          <Input
            placeholder="VD: Tết 2026"
            value={form.campaign}
            onChange={(e) => setForm({ ...form, campaign: e.target.value })}
          />
        </div>
        <div>
          <Label>Tên KOL / CTV</Label>
          <Input
            placeholder="VD: Nguyễn Văn A"
            value={form.kolName}
            onChange={(e) => setForm({ ...form, kolName: e.target.value })}
          />
        </div>
        <div>
          <Label>Liên hệ KOL (SĐT / Zalo / Email)</Label>
          <Input
            placeholder="VD: 0901234567"
            value={form.kolContact}
            onChange={(e) => setForm({ ...form, kolContact: e.target.value })}
          />
        </div>
        <div>
          <Label>UTM Source</Label>
          <Input
            value={form.utmSource}
            onChange={(e) => setForm({ ...form, utmSource: e.target.value })}
          />
        </div>
        <div>
          <Label>UTM Medium</Label>
          <Input
            value={form.utmMedium}
            onChange={(e) => setForm({ ...form, utmMedium: e.target.value })}
          />
        </div>
        <div>
          <Label className="inline-flex items-center gap-1">
            % hoa hồng (0–1)
            <span title="VD: 0.1 = 10%">
              <HelpCircle size={12} className="text-neutral-400" />
            </span>
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={form.commissionRate}
            onChange={(e) => setForm({ ...form, commissionRate: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-neutral-200 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Huỷ</Button>
        <Button onClick={submit} disabled={create.isPending}>
          {create.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
          Tạo link
        </Button>
      </div>
    </AppModal>
  )
}

export default AffiliatePage
