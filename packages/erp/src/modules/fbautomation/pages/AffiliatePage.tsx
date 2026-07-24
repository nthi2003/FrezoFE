// ============================================================
// MKT · Affiliate / KOL
// ------------------------------------------------------------
// Trang quản lý affiliate link cho chương trình KOL/CTV:
//  - KPI: tổng link, click, conversion, doanh thu, hoa hồng dự kiến
//  - Top KOL / Top campaign
//  - CRUD link (tạo, sửa, xoá, sao chép URL)
// Không cần API bên ngoài — hoạt động độc lập.
// ============================================================

import { useMemo, useState } from 'react'
import {
  Link2, Copy, TrendingUp, Users, DollarSign, MousePointerClick,
  Percent, Trophy, Plus, ExternalLink, Trash2, Loader2, Search, RefreshCw,
} from 'lucide-react'
import { Button, PageHeader, EmptyState, AppModal, Input, Label } from '@frezo/ui'
import { toast } from 'sonner'
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
  const [showCreate, setShowCreate] = useState(false)

  const { data: dashboardData, refetch: refetchDashboard } = useAffiliateDashboard()
  const { data: linksData, isLoading, isFetching, refetch } = useAffiliateLinks()

  const links: AffiliateLink[] = linksData || []
  const dashboard: any = dashboardData || {}

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return links
    return links.filter(
      (l) =>
        l.code.toLowerCase().includes(q) ||
        (l.kolName || '').toLowerCase().includes(q) ||
        (l.campaign || '').toLowerCase().includes(q) ||
        (l.targetUrl || '').toLowerCase().includes(q),
    )
  }, [links, search])

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

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        <PageHeader
          title="Affiliate / KOL Tracker"
          description="Sinh short link có UTM, đo click & conversion cho chương trình đối tác."
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

        {/* ==== KPI STRIP ==== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Kpi icon={Link2} label="Tổng link" value={dashboard.totalLinks ?? links.length} tone="primary" />
          <Kpi icon={MousePointerClick} label="Click" value={dashboard.totalClicks ?? 0} tone="blue" />
          <Kpi icon={TrendingUp} label="Conversion" value={dashboard.totalConversions ?? 0} tone="emerald" />
          <Kpi
            icon={Percent}
            label="Tỉ lệ CR"
            value={formatPercent(dashboard.conversionRate)}
            tone="amber"
          />
          <Kpi icon={DollarSign} label="Doanh thu" value={formatVND(dashboard.totalRevenue)} tone="rose" />
          <Kpi
            icon={Trophy}
            label="Hoa hồng est."
            value={formatVND(dashboard.estimatedCommission)}
            tone="violet"
          />
        </div>

        {/* ==== TOP KOL + CAMPAIGN ==== */}
        {(dashboard.topKol?.length || dashboard.topCampaign?.length) ? (
          <div className="grid md:grid-cols-2 gap-4">
            <TopList
              title="Top KOL theo doanh thu"
              icon={Users}
              rows={
                (dashboard.topKol || []).map((k: any, idx: number) => ({
                  rank: idx + 1,
                  primary: k.kol,
                  secondary: formatVND(k.revenue),
                }))
              }
            />
            <TopList
              title="Top Campaign theo click"
              icon={Trophy}
              rows={
                (dashboard.topCampaign || []).map((c: any, idx: number) => ({
                  rank: idx + 1,
                  primary: c.campaign,
                  secondary: `${c.clicks} clicks`,
                }))
              }
            />
          </div>
        ) : null}

        {/* ==== SEARCH BAR ==== */}
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 text-sm"
              placeholder="Tìm theo mã, KOL, campaign, URL đích..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ==== TABLE ==== */}
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-neutral-500">
              <Loader2 size={20} className="animate-spin mr-2" /> Đang tải...
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="Chưa có affiliate link"
              description={
                search
                  ? 'Không tìm thấy link nào khớp — thử từ khoá khác.'
                  : 'Tạo link đầu tiên để bắt đầu chương trình KOL. Link sinh ra sẽ có UTM đầy đủ và tracker click/conversion.'
              }
              action={
                !search
                  ? { label: 'Tạo link đầu tiên', onClick: () => setShowCreate(true) }
                  : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr className="text-left text-xs uppercase tracking-wider text-neutral-500">
                    <th className="px-4 py-3 font-semibold">Link</th>
                    <th className="px-4 py-3 font-semibold">KOL / Campaign</th>
                    <th className="px-4 py-3 font-semibold text-right">Click</th>
                    <th className="px-4 py-3 font-semibold text-right">Conv.</th>
                    <th className="px-4 py-3 font-semibold text-right">CR</th>
                    <th className="px-4 py-3 font-semibold text-right">Doanh thu</th>
                    <th className="px-4 py-3 font-semibold text-right">Hoa hồng</th>
                    <th className="px-4 py-3 font-semibold text-center">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.map((l) => (
                    <LinkRow
                      key={l.id}
                      link={l}
                      onCopy={copy}
                      onDelete={(link) =>
                        askConfirm({
                          title: 'Xoá link này?',
                          message: `Link ${link.code} sẽ bị xoá.`,
                          confirmText: 'Xoá',
                          onConfirm: () => deleteLink.mutate(link.id),
                        })
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ==== CREATE MODAL ==== */}
      {showCreate && (
        <CreateLinkModal open={showCreate} onClose={() => setShowCreate(false)} />
      )}
      {confirmDialog}
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================
function Kpi({
  icon: Icon, label, value, tone,
}: { icon: any; label: string; value: any; tone: string }) {
  const tones: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-700',
    blue:    'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber:   'bg-amber-50 text-amber-700',
    rose:    'bg-rose-50 text-rose-700',
    violet:  'bg-violet-50 text-violet-700',
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

function LinkRow({
  link,
  onCopy,
  onDelete,
}: {
  link: AffiliateLink
  onCopy: (s: string, hint?: string) => void
  onDelete: (link: AffiliateLink) => void
}) {
  return (
    <tr className="hover:bg-neutral-50/50">
      <td className="px-4 py-3">
        <div className="font-mono text-xs text-primary-700 font-semibold">{link.code}</div>
        <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
          <span className="truncate max-w-[240px]">{link.shortUrl}</span>
          <button
            onClick={() => onCopy(link.shortUrl)}
            className="p-1 hover:bg-neutral-100 rounded"
            title="Copy short URL"
          >
            <Copy size={12} />
          </button>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-neutral-900">{link.kolName || '—'}</div>
        {link.campaign && (
          <div className="text-xs text-neutral-500 mt-0.5">Camp: {link.campaign}</div>
        )}
      </td>
      <td className="px-4 py-3 text-right font-mono text-sm">{link.clickCount}</td>
      <td className="px-4 py-3 text-right font-mono text-sm">{link.conversionCount}</td>
      <td className="px-4 py-3 text-right text-sm font-semibold text-amber-600">
        {formatPercent(link.conversionRate)}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold">{formatVND(link.revenue)}</td>
      <td className="px-4 py-3 text-right text-sm text-violet-600">{formatVND(link.estimatedCommission)}</td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
            link.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-700'
              : link.status === 'EXPIRED'
                ? 'bg-neutral-100 text-neutral-500'
                : 'bg-amber-100 text-amber-700'
          }`}
        >
          {link.status || 'ACTIVE'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => window.open(link.targetUrlWithUtm || link.targetUrl, '_blank')}
            className="p-1.5 hover:bg-neutral-100 rounded"
            title="Mở URL đích"
          >
            <ExternalLink size={14} className="text-neutral-600" />
          </button>
          <button
            onClick={() => onCopy(link.targetUrlWithUtm || link.targetUrl, 'Đã copy URL đích')}
            className="p-1.5 hover:bg-neutral-100 rounded"
            title="Copy URL đích (đã kèm UTM)"
          >
            <Copy size={14} className="text-neutral-600" />
          </button>
          <button
            onClick={() => onDelete(link)}
            className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded text-neutral-600"
            title="Xoá"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ============================================================
// CREATE MODAL
// ============================================================
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
      description="Slug tự sinh nếu để trống. UTM sẽ tự append vào URL đích."
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
          <Label>Mã slug (tùy chọn, để trống = tự sinh)</Label>
          <Input
            placeholder="VD: kolminh01"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
        </div>
        <div>
          <Label>Campaign</Label>
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
          <Label>% hoa hồng (0-1, VD 0.1 = 10%)</Label>
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
