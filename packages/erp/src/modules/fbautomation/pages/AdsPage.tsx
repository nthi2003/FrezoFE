import { useEffect, useMemo, useState } from 'react'
import {
  Plus, RefreshCw, Trash2, Pencil, Megaphone, Eye, MousePointerClick, Users, DollarSign, Target,
} from 'lucide-react'
import {
  Button, PageHeader, EmptyState, ErrorState, AppModal, Input, Label, Select, IconActionButton, StatusBadge,
} from '@frezo/ui'
import { Can } from '@/lib/permissions'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import {
  useAdCampaigns, useAdsDashboard, useCreateAdCampaign, useUpdateAdCampaign, useDeleteAdCampaign,
} from '../hooks/useMkt'

interface AdCampaign {
  id: string
  name: string
  platform?: string
  objective?: string
  status?: string
  budget?: number
  spend?: number
  impressions?: number
  clicks?: number
  leads?: number
  revenue?: number
  ctr?: number
  cpc?: number
  cpl?: number
  roas?: number
  startDate?: string
  endDate?: string
}

const STATUS_CFG: Record<string, { label: string; color: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  DRAFT: { label: 'Nháp', color: 'neutral' },
  ACTIVE: { label: 'Đang chạy', color: 'success' },
  PAUSED: { label: 'Tạm dừng', color: 'warning' },
  ENDED: { label: 'Kết thúc', color: 'info' },
}

const formatVND = (v?: number) => {
  if (v == null || v === 0) return '0 ₫'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M₫'
  if (v >= 1_000) return (v / 1_000).toFixed(1) + ' K₫'
  return v.toLocaleString('vi-VN') + ' ₫'
}

const formatPct = (v?: number) => (v == null ? '—' : (v * 100).toFixed(2) + '%')

export function AdsPage() {
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const deleteCampaign = useDeleteAdCampaign()
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [platformFilter, setPlatformFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<AdCampaign | null>(null)

  const { data: dashData, refetch: refetchDash } = useAdsDashboard()
  const { data, isLoading, isFetching, isError, refetch } = useAdCampaigns()

  const rows: AdCampaign[] = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const dash: any = dashData || {}

  const filtered = useMemo(() => {
    let list = rows
    if (statusFilter !== 'ALL') list = list.filter((r) => (r.status || 'DRAFT') === statusFilter)
    if (platformFilter !== 'ALL') list = list.filter((r) => (r.platform || '') === platformFilter)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || (r.objective || '').toLowerCase().includes(q))
    return list
  }, [rows, statusFilter, platformFilter, search])

  const hasFilter = statusFilter !== 'ALL' || platformFilter !== 'ALL' || !!search.trim()

  const columns: AppTableColumn<AdCampaign>[] = [
    {
      key: 'name',
      title: 'Chiến dịch',
      render: (_, r) => (
        <div>
          <div className="font-medium text-neutral-900">{r.name}</div>
          <div className="text-xs text-neutral-500">{r.platform || '—'} · {r.objective || '—'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'TT',
      width: 110,
      render: (_, r) => {
        const cfg = STATUS_CFG[r.status || 'DRAFT'] || STATUS_CFG.DRAFT
        return <StatusBadge label={cfg.label} color={cfg.color} />
      },
    },
    { key: 'spend', title: 'Chi tiêu', align: 'right', render: (_, r) => formatVND(r.spend) },
    { key: 'impressions', title: 'Impression', align: 'right', render: (_, r) => (r.impressions ?? 0).toLocaleString('vi-VN') },
    { key: 'clicks', title: 'Click', align: 'right', render: (_, r) => (r.clicks ?? 0).toLocaleString('vi-VN') },
    { key: 'ctr', title: 'CTR', align: 'right', render: (_, r) => formatPct(r.ctr) },
    { key: 'leads', title: 'Lead', align: 'right', render: (_, r) => (r.leads ?? 0).toLocaleString('vi-VN') },
    { key: 'cpl', title: 'CPL', align: 'right', render: (_, r) => formatVND(r.cpl) },
    { key: 'roas', title: 'ROAS', align: 'right', render: (_, r) => (r.roas != null ? Number(r.roas).toFixed(2) + 'x' : '—') },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 90,
      render: (_, r) => (
        <div className="flex items-center justify-end gap-1">
          <Can permission="MKT_ADS_ID_UPDATE">
            <IconActionButton tooltip="Sửa số liệu" tone="blue" onClick={() => setEditing(r)}>
              <Pencil size={14} />
            </IconActionButton>
          </Can>
          <Can permission="MKT_ADS_ID_DELETE">
            <IconActionButton
              tooltip="Xoá"
              tone="rose"
              onClick={() =>
                askConfirm({
                  title: 'Xoá chiến dịch?',
                  message: `“${r.name}” sẽ bị xoá.`,
                  confirmText: 'Xoá',
                  onConfirm: () => deleteCampaign.mutate(r.id),
                })
              }
            >
              <Trash2 size={14} />
            </IconActionButton>
          </Can>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Báo cáo Ads"
        description="Theo dõi chi phí / CTR / CPL / ROAS theo chiến dịch. Nhập số liệu từ Ads Manager (MVP chưa đồng bộ Meta API)."
        actions={
          <>
            <Button variant="outline" onClick={() => { refetch(); refetchDash() }} disabled={isFetching}>
              <RefreshCw size={16} className={isFetching ? 'animate-spin mr-2' : 'mr-2'} />
              Làm mới
            </Button>
            <Can permission="MKT_ADS_CREATE">
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} className="mr-2" />
                Thêm chiến dịch
              </Button>
            </Can>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi icon={Megaphone} label="Chiến dịch" value={dash.totalCampaigns ?? rows.length} />
        <Kpi icon={DollarSign} label="Chi tiêu" value={formatVND(dash.totalSpend)} />
        <Kpi icon={Eye} label="Impression" value={(dash.totalImpressions ?? 0).toLocaleString('vi-VN')} />
        <Kpi icon={MousePointerClick} label="Click" value={(dash.totalClicks ?? 0).toLocaleString('vi-VN')} />
        <Kpi icon={Users} label="Lead" value={(dash.totalLeads ?? 0).toLocaleString('vi-VN')} />
        <Kpi icon={Target} label="ROAS" value={dash.roas != null ? Number(dash.roas).toFixed(2) + 'x' : '—'} />
      </div>

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => { setSearch(''); setStatusFilter('ALL'); setPlatformFilter('ALL') }}
        countLabel={`${filtered.length} chiến dịch`}
      >
        <Input placeholder="Tìm tên / mục tiêu…" value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-[180px]" />
        <Select
          options={[
            { value: 'ALL', label: 'Mọi nền tảng' },
            { value: 'FACEBOOK', label: 'Facebook' },
            { value: 'GOOGLE', label: 'Google' },
            { value: 'TIKTOK', label: 'TikTok' },
            { value: 'ZALO', label: 'Zalo' },
            { value: 'OTHER', label: 'Khác' },
          ]}
          value={platformFilter}
          onChange={setPlatformFilter}
        />
        <Select
          options={[
            { value: 'ALL', label: 'Mọi trạng thái' },
            { value: 'DRAFT', label: 'Nháp' },
            { value: 'ACTIVE', label: 'Đang chạy' },
            { value: 'PAUSED', label: 'Tạm dừng' },
            { value: 'ENDED', label: 'Kết thúc' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </FilterBar>

      {isError ? (
        <ErrorState title="Không tải được Ads" onRetry={() => refetch()} />
      ) : !isLoading && filtered.length === 0 ? (
        <EmptyState
          title={hasFilter ? 'Không có kết quả phù hợp' : 'Chưa có chiến dịch Ads'}
          description={hasFilter ? 'Thử xoá bộ lọc.' : 'Thêm chiến dịch và nhập spend / impression / click từ Ads Manager.'}
          action={!hasFilter ? (
            <Can permission="MKT_ADS_CREATE">
              <Button onClick={() => setShowCreate(true)}><Plus size={16} className="mr-2" />Thêm chiến dịch</Button>
            </Can>
          ) : undefined}
        />
      ) : (
        <AppTable columns={columns} data={filtered} loading={isLoading} rowKey={(r) => r.id} pageSize={10} />
      )}

      <AdFormModal open={showCreate} onClose={() => setShowCreate(false)} />
      <AdFormModal open={!!editing} onClose={() => setEditing(null)} initial={editing} />
      {confirmDialog}
    </div>
  )
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
        <Icon size={14} />
        {label}
      </div>
      <div className="text-lg font-semibold text-neutral-900">{value}</div>
    </div>
  )
}

type AdForm = {
  name: string
  platform: string
  objective: string
  status: string
  budget: number
  spend: number
  impressions: number
  clicks: number
  leads: number
  revenue: number
}

const EMPTY_AD: AdForm = {
  name: '',
  platform: 'FACEBOOK',
  objective: 'LEADS',
  status: 'ACTIVE',
  budget: 0,
  spend: 0,
  impressions: 0,
  clicks: 0,
  leads: 0,
  revenue: 0,
}

function AdFormModal({
  open,
  onClose,
  initial,
}: {
  open: boolean
  onClose: () => void
  initial?: AdCampaign | null
}) {
  const create = useCreateAdCampaign()
  const update = useUpdateAdCampaign()
  const isEdit = !!initial?.id
  const [form, setForm] = useState<AdForm>(EMPTY_AD)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        name: initial.name || '',
        platform: initial.platform || 'FACEBOOK',
        objective: initial.objective || 'LEADS',
        status: initial.status || 'ACTIVE',
        budget: Number(initial.budget) || 0,
        spend: Number(initial.spend) || 0,
        impressions: Number(initial.impressions) || 0,
        clicks: Number(initial.clicks) || 0,
        leads: Number(initial.leads) || 0,
        revenue: Number(initial.revenue) || 0,
      })
    } else {
      setForm(EMPTY_AD)
    }
  }, [open, initial])

  const pending = create.isPending || update.isPending
  const submit = () => {
    if (!form.name.trim()) return
    if (isEdit && initial) {
      update.mutate({ id: initial.id, data: form }, { onSuccess: onClose })
    } else {
      create.mutate(form, { onSuccess: onClose })
    }
  }

  return (
    <AppModal isOpen={open} onClose={onClose} title={isEdit ? 'Cập nhật chiến dịch Ads' : 'Thêm chiến dịch Ads'} maxWidth="2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <Label>Tên chiến dịch</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Lead form T7" />
        </div>
        <div>
          <Label>Nền tảng</Label>
          <Select
            options={[
              { value: 'FACEBOOK', label: 'Facebook' },
              { value: 'GOOGLE', label: 'Google' },
              { value: 'TIKTOK', label: 'TikTok' },
              { value: 'ZALO', label: 'Zalo' },
              { value: 'OTHER', label: 'Khác' },
            ]}
            value={form.platform}
            onChange={(v) => setForm({ ...form, platform: v })}
          />
        </div>
        <div>
          <Label>Mục tiêu</Label>
          <Select
            options={[
              { value: 'AWARENESS', label: 'Awareness' },
              { value: 'TRAFFIC', label: 'Traffic' },
              { value: 'LEADS', label: 'Leads' },
              { value: 'SALES', label: 'Sales' },
              { value: 'ENGAGEMENT', label: 'Engagement' },
            ]}
            value={form.objective}
            onChange={(v) => setForm({ ...form, objective: v })}
          />
        </div>
        <div>
          <Label>Trạng thái</Label>
          <Select
            options={[
              { value: 'DRAFT', label: 'Nháp' },
              { value: 'ACTIVE', label: 'Đang chạy' },
              { value: 'PAUSED', label: 'Tạm dừng' },
              { value: 'ENDED', label: 'Kết thúc' },
            ]}
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
          />
        </div>
        {([
          ['budget', 'Ngân sách (₫)'],
          ['spend', 'Chi tiêu (₫)'],
          ['impressions', 'Impressions'],
          ['clicks', 'Clicks'],
          ['leads', 'Leads'],
          ['revenue', 'Doanh thu (₫)'],
        ] as const).map(([key, label]) => (
          <div key={key}>
            <Label>{label}</Label>
            <Input
              type="number"
              min={0}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) || 0 })}
            />
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Huỷ</Button>
        <Button onClick={submit} disabled={pending || !form.name.trim()}>Lưu</Button>
      </div>
    </AppModal>
  )
}

export default AdsPage
