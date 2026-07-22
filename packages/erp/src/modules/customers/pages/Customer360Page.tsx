// ============================================================
// FREZO ERP — Customer 360° Page
// Trang tổng hợp mọi thông tin về 1 khách hàng: KPI, deals, hoá đơn,
// hoạt động, hợp đồng, ghi chú. Tất cả filter client-side từ hook list-all
// hiện có — không cần BE endpoint by-customer.
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Phone, Mail, MapPin, Building2, User, Pencil,
  Plus, FileText, Receipt, ShoppingBag, Activity, StickyNote,
  TrendingUp, AlertTriangle, Clock, FolderOpen,
  Calendar, DollarSign, CheckCircle2,
} from 'lucide-react'
import { Button, PageHeader, EmptyState } from '@frezo/ui'
import { formatCurrency, formatDate, formatDateTime } from '@frezo/utils'
import { customerApi } from '../services/customerApi'
import {
  useInvoices,
  usePipelines,
  useDealsByPipeline,
} from '../../crm/hooks/useCrm'
import type {
  Deal, Invoice, InvoiceStatus, DealActivity,
} from '../../crm/services/crmApi'
import { activitiesApi } from '../../crm/services/crmApi'

// ============================================================
// Types
// ============================================================

interface CustomerDetail {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  taxCode?: string
  type?: 'INDIVIDUAL' | 'COMPANY'
  note?: string
  createdDate?: string
}

type TabKey = 'overview' | 'deals' | 'invoices' | 'activities' | 'documents' | 'notes'

// ============================================================
// Hook: lấy chi tiết 1 customer
// ============================================================

function useCustomerDetail(id?: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getById(id!),
    enabled: !!id,
    select: (res: unknown) => {
      const r = res as { data?: CustomerDetail } | CustomerDetail | null
      if (!r) return null
      if ('data' in (r as object)) return ((r as { data?: CustomerDetail }).data ?? null)
      return r as CustomerDetail
    },
  })
}

// Activities theo customer — endpoint đã sẵn ở crmApi.activitiesApi
function useCustomerActivities(customerId?: string) {
  return useQuery({
    queryKey: ['crm', 'activities', 'customer', customerId],
    queryFn: () => activitiesApi.listByCustomer(customerId!),
    enabled: !!customerId,
    select: (raw: unknown) => {
      const r = raw as { data?: DealActivity[] } | DealActivity[] | null
      if (!r) return [] as DealActivity[]
      if (Array.isArray(r)) return r
      return (r as { data?: DealActivity[] }).data ?? []
    },
  })
}

// ============================================================
// Sub-component: KPI Card
// ============================================================

interface Customer360KpiProps {
  label: string
  value: string
  icon: typeof Phone
  tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet'
  hint?: string
}

function Customer360Kpi({ label, value, icon: Icon, tone, hint }: Customer360KpiProps) {
  const toneMap = {
    blue: 'from-blue-500 to-blue-600 text-blue-100',
    emerald: 'from-emerald-500 to-emerald-600 text-emerald-100',
    amber: 'from-amber-500 to-amber-600 text-amber-100',
    rose: 'from-rose-500 to-rose-600 text-rose-100',
    violet: 'from-violet-500 to-violet-600 text-violet-100',
  }[tone]
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${toneMap.split(' text-')[0]} p-4 text-white shadow-sm`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium opacity-90 uppercase tracking-wider">{label}</span>
        <Icon size={18} className="opacity-80" />
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {hint && <div className="text-[11px] opacity-80 mt-1">{hint}</div>}
    </div>
  )
}

// ============================================================
// Sub-component: Status pill cho invoice
// ============================================================

const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Nháp',
  ISSUED: 'Đã phát hành',
  PARTIALLY_PAID: 'Trả một phần',
  PAID: 'Đã thanh toán',
  VOID: 'Đã huỷ',
}

const INVOICE_STATUS_TONE: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  ISSUED: 'bg-blue-50 text-blue-700 border-blue-200',
  PARTIALLY_PAID: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VOID: 'bg-red-50 text-red-700 border-red-200',
}

function InvoiceStatusPill({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] border font-medium ${INVOICE_STATUS_TONE[status]}`}>
      {INVOICE_STATUS_LABEL[status]}
    </span>
  )
}

// ============================================================
// Main page
// ============================================================

export function Customer360Page() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [tab, setTab] = useState<TabKey>('overview')

  const { data: customer, isLoading: loadingCust } = useCustomerDetail(id)
  const { data: activities } = useCustomerActivities(id)
  const { data: pipelines } = usePipelines()
  const defaultPipelineId = (pipelines as { id: string; isDefault?: boolean }[] | undefined)
    ?.find((p) => p.isDefault)?.id
    ?? (pipelines as { id: string }[] | undefined)?.[0]?.id
  const { data: allDeals } = useDealsByPipeline(defaultPipelineId)
  const { data: allInvoices } = useInvoices()

  // Filter theo customer id — BE list all, client filter
  const deals = useMemo<Deal[]>(() => {
    const arr = (allDeals as Deal[] | undefined) ?? []
    return arr.filter((d) => d.customerId === id)
  }, [allDeals, id])

  const invoices = useMemo<Invoice[]>(() => {
    const arr = (allInvoices as Invoice[] | undefined) ?? []
    return arr.filter((v) => v.customerId === id)
  }, [allInvoices, id])

  const acts = (activities ?? []) as DealActivity[]

  // KPI derived
  const yearStart = useMemo(() => new Date(new Date().getFullYear(), 0, 1), [])
  const revenueYTD = useMemo(
    () =>
      invoices
        .filter((v) => v.status === 'PAID' || v.status === 'PARTIALLY_PAID')
        .filter((v) => (v.issuedDate ? new Date(v.issuedDate) >= yearStart : false))
        .reduce((s, v) => s + (v.paidAmount || 0), 0),
    [invoices, yearStart],
  )
  const openDealsCount = useMemo(
    () => deals.filter((d) => d.status === 'OPEN' || d.status === 'STALLED').length,
    [deals],
  )
  const overdueInvoices = useMemo(() => {
    const now = new Date()
    return invoices.filter(
      (v) =>
        (v.status === 'ISSUED' || v.status === 'PARTIALLY_PAID') &&
        v.dueDate &&
        new Date(v.dueDate) < now,
    )
  }, [invoices])
  const lastActivity = useMemo(() => {
    if (!acts.length) return null
    const sorted = [...acts].sort((a, b) => {
      const ta = new Date(a.happenedAt || a.createdDate || 0).getTime()
      const tb = new Date(b.happenedAt || b.createdDate || 0).getTime()
      return tb - ta
    })
    return sorted[0] ?? null
  }, [acts])

  if (loadingCust) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-24 bg-neutral-100 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-neutral-100 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-96 bg-neutral-100 rounded-2xl" />
          <div className="h-96 bg-neutral-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Building2}
          title="Không tìm thấy khách hàng"
          description="Khách hàng có thể đã bị xoá hoặc bạn chưa có quyền truy cập."
          action={{ label: 'Quay lại danh sách', onClick: () => nav('/customer') }}
        />
      </div>
    )
  }

  const isCompany = customer.type === 'COMPANY' || !!customer.taxCode

  return (
    <div className="p-6 space-y-5 animate-fade-in bg-neutral-50/50 min-h-[calc(100vh-64px)]">
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <button
              onClick={() => nav('/customer')}
              className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition"
              title="Quay lại danh sách khách hàng"
            >
              <ArrowLeft size={18} />
            </button>
            <span>{customer.name || 'Chưa đặt tên'}</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                isCompany
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {isCompany ? <><Building2 size={10} /> Doanh nghiệp</> : <><User size={10} /> Cá nhân</>}
            </span>
          </span>
        }
        description={customer.address || 'Chưa có địa chỉ đăng ký'}
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={() => nav('/customer')}>
              <Pencil size={15} /> Sửa thông tin
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => nav('/crm/deals')}>
              <Plus size={15} /> Deal mới
            </Button>
            <Button className="gap-2 bg-primary-700 hover:bg-primary-800 text-white" onClick={() => nav('/crm/invoices')}>
              <Plus size={15} /> Hoá đơn mới
            </Button>
          </>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Customer360Kpi
          label="Doanh thu YTD"
          value={formatCurrency(revenueYTD)}
          icon={TrendingUp}
          tone="emerald"
          hint={`${invoices.length} hoá đơn`}
        />
        <Customer360Kpi
          label="Deal đang mở"
          value={String(openDealsCount)}
          icon={ShoppingBag}
          tone="blue"
          hint={`Trong ${deals.length} deal`}
        />
        <Customer360Kpi
          label="HĐ quá hạn"
          value={String(overdueInvoices.length)}
          icon={AlertTriangle}
          tone={overdueInvoices.length > 0 ? 'rose' : 'violet'}
          hint={overdueInvoices.length > 0 ? 'Cần thu hồi công nợ' : 'Tình trạng tốt'}
        />
        <Customer360Kpi
          label="Hoạt động gần nhất"
          value={lastActivity?.happenedAt ? formatDate(lastActivity.happenedAt) : lastActivity?.createdDate ? formatDate(lastActivity.createdDate) : '—'}
          icon={Clock}
          tone="amber"
          hint={lastActivity?.subject || 'Chưa có tương tác'}
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-neutral-200">
        {([
          ['overview', 'Tổng quan', Activity],
          ['deals', 'Deals', ShoppingBag],
          ['invoices', 'Hoá đơn', Receipt],
          ['activities', 'Hoạt động', Clock],
          ['documents', 'Tài liệu', FolderOpen],
          ['notes', 'Ghi chú', StickyNote],
        ] as [TabKey, string, typeof Activity][]).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition ${
              tab === key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Body */}
      {tab === 'overview' && (
        <OverviewTab
          customer={customer}
          deals={deals}
          invoices={invoices}
          activities={acts}
        />
      )}
      {tab === 'deals' && <DealsTab deals={deals} onGoto={() => nav('/crm/deals')} />}
      {tab === 'invoices' && <InvoicesTab invoices={invoices} onGoto={() => nav('/crm/invoices')} />}
      {tab === 'activities' && <ActivitiesTab activities={acts} />}
      {tab === 'documents' && (
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-6">
          <EmptyState
            icon={FolderOpen}
            title="Chưa có tài liệu"
            description="Kho tài liệu tổng hợp (hợp đồng, phụ lục, chứng từ) sẽ tích hợp ở giai đoạn kế tiếp."
          />
        </div>
      )}
      {tab === 'notes' && (
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-6">
          {customer.note ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-xs font-semibold text-amber-800 mb-1 uppercase tracking-wider">
                Ghi chú khách hàng
              </div>
              <div className="text-sm text-amber-900 whitespace-pre-wrap">{customer.note}</div>
            </div>
          ) : (
            <EmptyState
              icon={StickyNote}
              title="Chưa có ghi chú"
              description="Ghi chú quan trọng: lịch sử tương tác, ưu đãi đặc biệt, khiếu nại..."
            />
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Tab: Overview (2 cột)
// ============================================================

function OverviewTab({
  customer, deals, invoices, activities,
}: {
  customer: CustomerDetail
  deals: Deal[]
  invoices: Invoice[]
  activities: DealActivity[]
}) {
  const recentActivities = useMemo(
    () =>
      [...activities]
        .sort((a, b) => {
          const ta = new Date(a.happenedAt || a.createdDate || 0).getTime()
          const tb = new Date(b.happenedAt || b.createdDate || 0).getTime()
          return tb - ta
        })
        .slice(0, 6),
    [activities],
  )
  const recentInvoices = useMemo(
    () =>
      [...invoices]
        .sort((a, b) => new Date(b.issuedDate || 0).getTime() - new Date(a.issuedDate || 0).getTime())
        .slice(0, 5),
    [invoices],
  )
  const openDeals = useMemo(
    () => deals.filter((d) => d.status === 'OPEN' || d.status === 'STALLED').slice(0, 5),
    [deals],
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* LEFT: contact + activities */}
      <div className="lg:col-span-1 space-y-4">
        <SectionCard title="Thông tin liên hệ" icon={User}>
          <div className="space-y-2.5 text-sm">
            <ContactRow icon={Phone} label="Điện thoại" value={customer.phone || '—'} mono />
            <ContactRow icon={Mail} label="Email" value={customer.email || '—'} />
            <ContactRow icon={MapPin} label="Địa chỉ" value={customer.address || '—'} />
            <ContactRow icon={FileText} label="Mã số thuế" value={customer.taxCode || '—'} mono />
            <ContactRow
              icon={Calendar}
              label="Ngày tạo"
              value={customer.createdDate ? formatDate(customer.createdDate) : '—'}
            />
          </div>
        </SectionCard>

        <SectionCard title="Hoạt động gần đây" icon={Activity}>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">Chưa có hoạt động nào</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((a) => (
                <ActivityRow key={a.id} act={a} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* RIGHT: deals + invoices */}
      <div className="lg:col-span-2 space-y-4">
        <SectionCard title="Deals đang mở" icon={ShoppingBag} count={openDeals.length}>
          {openDeals.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">Chưa có deal đang mở</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {openDeals.map((d) => (
                <DealRow key={d.id} deal={d} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Hoá đơn gần đây" icon={Receipt} count={recentInvoices.length}>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">Chưa có hoá đơn</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {recentInvoices.map((v) => (
                <InvoiceRow key={v.id} inv={v} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

// ============================================================
// Sub-components dùng chung
// ============================================================

function SectionCard({
  title, icon: Icon, count, children,
}: {
  title: string
  icon: typeof User
  count?: number
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-neutral-500" />
          <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
        </div>
        {count !== undefined && (
          <span className="text-[11px] font-medium text-neutral-400">{count} mục</span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function ContactRow({
  icon: Icon, label, value, mono,
}: { icon: typeof Phone; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={13} className="text-neutral-400 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{label}</div>
        <div className={`text-neutral-800 truncate ${mono ? 'font-mono' : ''}`} title={value}>
          {value}
        </div>
      </div>
    </div>
  )
}

function ActivityRow({ act }: { act: DealActivity }) {
  const type = act.activityType
  const iconMap = {
    CALL: Phone, EMAIL: Mail, MEETING: User, NOTE: StickyNote, TASK: CheckCircle2,
  } as const
  const toneMap = {
    CALL: 'bg-blue-100 text-blue-600',
    EMAIL: 'bg-violet-100 text-violet-600',
    MEETING: 'bg-emerald-100 text-emerald-600',
    NOTE: 'bg-amber-100 text-amber-600',
    TASK: 'bg-rose-100 text-rose-600',
  } as const
  const Icon = iconMap[type] ?? StickyNote
  const tone = toneMap[type] ?? 'bg-neutral-100 text-neutral-600'
  const when = act.happenedAt || act.createdDate
  return (
    <div className="flex items-start gap-2.5">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-neutral-800 truncate">{act.subject}</div>
        {act.content && (
          <div className="text-xs text-neutral-500 line-clamp-2 mt-0.5">{act.content}</div>
        )}
        <div className="text-[10px] text-neutral-400 mt-0.5">
          {when ? formatDateTime(when) : ''}
          {act.ownerUsername ? ` · ${act.ownerUsername}` : ''}
        </div>
      </div>
    </div>
  )
}

function DealRow({ deal }: { deal: Deal }) {
  return (
    <div className="py-2.5 flex items-center gap-3">
      <div className="w-1 h-8 rounded-full bg-blue-500" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-neutral-800 truncate">{deal.title}</div>
        <div className="text-[11px] text-neutral-500">
          {deal.expectedCloseDate ? `Dự kiến ${formatDate(deal.expectedCloseDate)}` : 'Chưa đặt hạn'}
          {deal.probability != null ? ` · ${deal.probability}%` : ''}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-bold text-emerald-700 tabular-nums">
          {formatCurrency(deal.amount)}
        </div>
        <div className="text-[10px] text-neutral-400">{deal.status}</div>
      </div>
    </div>
  )
}

function InvoiceRow({ inv }: { inv: Invoice }) {
  const remain = inv.total - (inv.paidAmount || 0)
  const paidPct = inv.total > 0 ? Math.min(100, Math.round(((inv.paidAmount || 0) / inv.total) * 100)) : 0
  return (
    <div className="py-2.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-semibold text-blue-700">{inv.code}</span>
        <InvoiceStatusPill status={inv.status} />
        <span className="text-[11px] text-neutral-400 ml-auto">
          {inv.issuedDate ? formatDate(inv.issuedDate) : '—'}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              paidPct === 100 ? 'bg-emerald-500' : paidPct > 0 ? 'bg-amber-500' : 'bg-neutral-300'
            }`}
            style={{ width: `${paidPct}%` }}
          />
        </div>
        <span className="text-neutral-500 tabular-nums shrink-0">{paidPct}%</span>
      </div>
      <div className="flex justify-between text-[11px] text-neutral-500 tabular-nums">
        <span>Tổng: <b>{formatCurrency(inv.total)}</b></span>
        <span className={remain > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600'}>
          Còn: {formatCurrency(remain)}
        </span>
      </div>
    </div>
  )
}

// ============================================================
// Tab: Deals (all)
// ============================================================

function DealsTab({ deals, onGoto }: { deals: Deal[]; onGoto: () => void }) {
  if (!deals.length) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200/60 p-6">
        <EmptyState
          icon={ShoppingBag}
          title="Chưa có deal nào cho khách hàng này"
          description="Tạo cơ hội bán hàng đầu tiên để theo dõi tiến trình."
          action={{ label: 'Sang trang Deals', onClick: onGoto }}
        />
      </div>
    )
  }
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-neutral-600">
          <tr>
            <th className="p-3 text-left font-medium">Tiêu đề</th>
            <th className="p-3 text-right font-medium">Giá trị</th>
            <th className="p-3 text-center font-medium">Xác suất</th>
            <th className="p-3 text-left font-medium">Ngày dự kiến</th>
            <th className="p-3 text-center font-medium">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {deals.map((d) => (
            <tr key={d.id} className="hover:bg-neutral-50">
              <td className="p-3 font-medium">{d.title}</td>
              <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                {formatCurrency(d.amount)}
              </td>
              <td className="p-3 text-center">{d.probability != null ? `${d.probability}%` : '—'}</td>
              <td className="p-3 text-neutral-600">
                {d.expectedCloseDate ? formatDate(d.expectedCloseDate) : '—'}
              </td>
              <td className="p-3 text-center">
                <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] border border-neutral-200 bg-neutral-50">
                  {d.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================
// Tab: Invoices (all)
// ============================================================

function InvoicesTab({ invoices, onGoto }: { invoices: Invoice[]; onGoto: () => void }) {
  if (!invoices.length) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200/60 p-6">
        <EmptyState
          icon={Receipt}
          title="Chưa có hoá đơn"
          description="Xuất hoá đơn đầu tiên cho khách hàng để ghi nhận doanh thu."
          action={{ label: 'Sang trang Hoá đơn', onClick: onGoto }}
        />
      </div>
    )
  }
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-neutral-600">
          <tr>
            <th className="p-3 text-left font-medium">Mã HĐ</th>
            <th className="p-3 text-left font-medium">Ngày</th>
            <th className="p-3 text-right font-medium">Tổng</th>
            <th className="p-3 text-right font-medium">Đã trả</th>
            <th className="p-3 text-center font-medium w-40">Tiến độ</th>
            <th className="p-3 text-center font-medium">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {invoices.map((v) => {
            const pct = v.total > 0 ? Math.min(100, Math.round(((v.paidAmount || 0) / v.total) * 100)) : 0
            return (
              <tr key={v.id} className="hover:bg-neutral-50">
                <td className="p-3 font-mono font-semibold text-blue-700">{v.code}</td>
                <td className="p-3 text-neutral-600">
                  {v.issuedDate ? formatDate(v.issuedDate) : '—'}
                </td>
                <td className="p-3 text-right font-mono">{formatCurrency(v.total)}</td>
                <td className="p-3 text-right font-mono text-emerald-700">
                  {formatCurrency(v.paidAmount || 0)}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] tabular-nums text-neutral-500">{pct}%</span>
                  </div>
                </td>
                <td className="p-3 text-center"><InvoiceStatusPill status={v.status} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================
// Tab: Activities timeline full
// ============================================================

function ActivitiesTab({ activities }: { activities: DealActivity[] }) {
  if (!activities.length) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200/60 p-6">
        <EmptyState
          icon={Activity}
          title="Chưa có hoạt động"
          description="Ghi nhận cuộc gọi, email, cuộc họp với khách hàng để track quan hệ."
        />
      </div>
    )
  }
  const sorted = [...activities].sort((a, b) => {
    const ta = new Date(a.happenedAt || a.createdDate || 0).getTime()
    const tb = new Date(b.happenedAt || b.createdDate || 0).getTime()
    return tb - ta
  })
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm p-5 space-y-4">
      {sorted.map((a) => (
        <ActivityRow key={a.id} act={a} />
      ))}
    </div>
  )
}

// unused imports guard cho tree-shaking
void DollarSign
