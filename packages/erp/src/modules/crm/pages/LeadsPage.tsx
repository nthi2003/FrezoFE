import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, ArrowRight, Trash2, Users, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button, PageHeader, PageGuideButton, AppModal, ConfirmDialog,
  EmptyState, ErrorState, RowActions,
} from '@frezo/ui'
import { formatDate } from '@frezo/utils'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn, BulkAction } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  useLeads, useCreateLead, useConvertLead, useDeleteLead,
} from '../hooks/useCrm'
import type { Lead, LeadStatus } from '../services/crmApi'
import { LEADS_GUIDE } from '../constants/leads.guide'
import { pageRootClass } from '@/modules/accounting/utils/pageEmbed'
import { crmPipelineHubUrl } from '../utils/crmRoutes'

const STATUS_TABS: Array<{ key: LeadStatus | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'NEW', label: 'Mới' },
  { key: 'CONTACTED', label: 'Đã liên hệ' },
  { key: 'QUALIFIED', label: 'Đủ điều kiện' },
  { key: 'UNQUALIFIED', label: 'Loại' },
  { key: 'CONVERTED', label: 'Đã chuyển đổi' },
]

const LEAD_PATH: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED']

export function LeadsPage({ embedded }: { embedded?: boolean } = {}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const statusFromUrl = searchParams.get('status')?.toUpperCase() as LeadStatus | undefined
  const initialStatus: LeadStatus | 'ALL' =
    statusFromUrl && STATUS_TABS.some((t) => t.key === statusFromUrl)
      ? statusFromUrl
      : 'ALL'
  const [status, setStatus] = useState<LeadStatus | 'ALL'>(initialStatus)
  const [pathLead, setPathLead] = useState<Lead | null>(null)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [confirmBulk, setConfirmBulk] = useState<Lead[] | null>(null)
  const [convertTarget, setConvertTarget] = useState<Lead | null>(null)
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', companyName: '', source: '' })

  const { data: rows, isLoading, isError, refetch, isFetching } = useLeads(status === 'ALL' ? undefined : status)
  const create = useCreateLead()
  const convert = useConvertLead()
  const del = useDeleteLead()
  const list = (rows as Lead[]) ?? []

  const filtered = useMemo<Lead[]>(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((l: Lead) =>
      l.fullName.toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q) ||
      (l.companyName || '').toLowerCase().includes(q))
  }, [list, search])

  const hasFilter = !!search.trim() || status !== 'ALL'
  const isFilteredEmpty = !isLoading && !isError && list.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && list.length === 0

  const [bulkRunning, setBulkRunning] = useState(false)

  const runBulkDelete = async () => {
    if (!confirmBulk) return
    setBulkRunning(true)
    const res = await Promise.allSettled(confirmBulk.map((l) => del.mutateAsync(l.id)))
    const ok = res.filter((r) => r.status === 'fulfilled').length
    const fail = res.length - ok
    if (ok > 0) toast.success(`Đã xoá ${ok} khách tiềm năng`)
    if (fail > 0) toast.error(`${fail} bản ghi xoá thất bại`)
    setConfirmBulk(null)
    setBulkRunning(false)
  }

  const onCreate = () => {
    if (!form.fullName.trim()) return
    create.mutate({ ...form, status: 'NEW' }, { onSuccess: () => {
      setShowCreate(false)
      setForm({ fullName: '', phone: '', email: '', companyName: '', source: '' })
    }})
  }

  const bulkActions: BulkAction<Lead>[] = [
    {
      key: 'delete',
      label: 'Xoá',
      icon: Trash2,
      variant: 'destructive',
      onClick: (rowsSel) => setConfirmBulk(rowsSel),
    },
  ]

  const columns: AppTableColumn<Lead>[] = [
    {
      key: 'fullName',
      title: 'Tên',
      render: (_, l) => (
        <button
          type="button"
          className="font-medium text-left hover:text-primary-700"
          onClick={() => setPathLead(l)}
        >
          {l.fullName}
        </button>
      ),
    },
    {
      key: 'companyName',
      title: 'Công ty',
      render: (_, l) => <span className="text-neutral-700">{l.companyName || '—'}</span>,
    },
    {
      key: 'contact',
      title: 'Liên hệ',
      render: (_, l) => (
        <div className="text-neutral-600 text-xs space-y-0.5">
          {l.phone && <div>{l.phone}</div>}
          {l.email && <div className="truncate max-w-[180px]" title={l.email}>{l.email}</div>}
          {!l.phone && !l.email && <span className="text-neutral-400">—</span>}
        </div>
      ),
    },
    {
      key: 'source',
      title: 'Nguồn',
      render: (_, l) => <span className="text-neutral-600">{l.source || '—'}</span>,
    },
    {
      key: 'score',
      title: 'Điểm',
      align: 'center',
      render: (_, l) => <ScoreBadge score={l.score ?? 0} />,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      render: (_, l) => (
        <span className="inline-flex px-2 py-0.5 rounded-md text-xs border border-neutral-200 bg-neutral-50">
          {STATUS_TABS.find((s) => s.key === l.status)?.label || l.status}
        </span>
      ),
    },
    {
      key: 'createdDate',
      title: 'Ngày tạo',
      render: (_, l) => (
        <span className="text-xs text-neutral-500">
          {l.createdDate ? formatDate(l.createdDate) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 120,
      render: (_, l) => (
        <RowActions
          align="end"
          actions={[
            {
              key: 'convert',
              icon: ArrowRight,
              tooltip: 'Chuyển thành cơ hội bán',
              tone: 'emerald',
              hidden: l.status === 'CONVERTED' || l.status === 'UNQUALIFIED',
              onClick: () => setConvertTarget(l),
            },
          ]}
        />
      ),
    },
  ]

  const headerActions = (
    <div className="flex items-center gap-2">
      <PageGuideButton guide={LEADS_GUIDE} />
      <Button className="gap-2" onClick={() => setShowCreate(true)}>
        <Plus size={16} /> Thêm khách tiềm năng
      </Button>
    </div>
  )

  return (
    <div className={pageRootClass(embedded)}>
      {embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-neutral-600">
            Khách tiềm năng — chuyển thành cơ hội bán.
            <span className="ml-2 text-xs text-neutral-400 tabular-nums">
              {filtered.length} lead{hasFilter ? ' (đã lọc)' : ''}
            </span>
          </p>
          {headerActions}
        </div>
      ) : (
        <PageHeader
          title="Khách tiềm năng"
          description="Theo dõi liên hệ mới và chuyển thành cơ hội bán hàng."
          actions={headerActions}
        />
      )}

      <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Lộ trình: Khách tiềm năng → Cơ hội bán
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {LEAD_PATH.map((step, idx) => {
            const active =
              pathLead?.status === step ||
              (status !== 'ALL' && status === step) ||
              (!pathLead && status === 'ALL' && idx === 0)
            const label = STATUS_TABS.find((t) => t.key === step)?.label || step
            return (
              <div key={step} className="flex items-center gap-1">
                {idx > 0 && <ArrowRight size={12} className="text-neutral-300 mx-0.5" />}
                <button
                  type="button"
                  onClick={() => setStatus(step)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
                    active
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {step === 'CONVERTED' && active ? <Check size={12} /> : null}
                  {label}
                </button>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          Chọn khách tiềm năng còn mở → Chuyển đổi để tạo cơ hội bán, rồi mở phễu bán hàng.
        </p>
      </div>

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => {
          setSearch('')
          setStatus('ALL')
        }}
        countLabel={`${filtered.length} bản ghi${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm theo tên, email, SĐT, công ty…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm khách tiềm năng"
          />
        </div>
        <div className="flex gap-1 border rounded-md p-0.5 bg-white flex-wrap">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatus(t.key)}
              className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${
                status === t.key
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được khách tiềm năng"
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Users}
            title={isFilteredEmpty ? 'Không có bản ghi khớp bộ lọc' : 'Chưa có khách tiềm năng'}
            description={
              isFilteredEmpty
                ? 'Thử xoá tìm kiếm hoặc chọn «Tất cả».'
                : 'Thêm thủ công hoặc nhập từ marketing / Facebook.'
            }
            action={
              isFilteredEmpty
                ? {
                    label: 'Xoá lọc',
                    onClick: () => {
                      setSearch('')
                      setStatus('ALL')
                    },
                  }
                : { label: 'Thêm khách tiềm năng', onClick: () => setShowCreate(true) }
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
          selectable
          getRowId={(row) => row.id}
          bulkActions={bulkActions}
          onRefresh={() => void refetch()}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmBulk}
        onClose={() => (bulkRunning ? undefined : setConfirmBulk(null))}
        onConfirm={runBulkDelete}
        title={`Xoá ${confirmBulk?.length ?? 0} khách tiềm năng?`}
        message="Các bản ghi đã chọn sẽ bị xoá vĩnh viễn. Thao tác không thể hoàn tác."
        variant="danger"
        confirmText="Xoá tất cả"
        cancelText="Huỷ"
        isLoading={bulkRunning}
      />

      <ConfirmDialog
        isOpen={!!convertTarget}
        onClose={() => setConvertTarget(null)}
        onConfirm={() => {
          if (!convertTarget) return
          convert.mutate(
            { id: convertTarget.id },
            {
              onSuccess: (res: any) => {
                setConvertTarget(null)
                setPathLead(null)
                // BE trả ApiResponse<{ dealId }> — không phải Deal entity
                const dealId =
                  res?.data?.dealId ||
                  res?.dealId ||
                  res?.data?.id ||
                  res?.id
                navigate(
                  dealId
                    ? `${crmPipelineHubUrl({ tab: 'deals' })}&dealId=${dealId}`
                    : crmPipelineHubUrl({ tab: 'deals' }),
                )
              },
            },
          )
        }}
        title="Tạo cơ hội bán từ khách tiềm năng?"
        message={`「${convertTarget?.fullName || ''}」 sẽ được chuyển thành cơ hội bán và mở phễu bán hàng.`}
        confirmText="Tạo cơ hội"
        cancelText="Huỷ"
        variant="default"
        isLoading={convert.isPending}
      />

      <AppModal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Thêm khách tiềm năng">
        <div className="space-y-3">
          {[
            ['fullName', 'Họ tên *'],
            ['phone', 'Số điện thoại'],
            ['email', 'Email'],
            ['companyName', 'Công ty'],
            ['source', 'Nguồn (Facebook / Giới thiệu / Web / …)'],
          ].map(([f, label]) => (
            <div key={f}>
              <label className="text-sm text-neutral-700 mb-1 block">{label}</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={(form as any)[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Huỷ</Button>
            <Button onClick={onCreate} disabled={create.isPending || !form.fullName.trim()}>
              Thêm
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 80
      ? 'bg-success-light text-success-dark border-success/30'
      : score >= 50
        ? 'bg-warning-light text-warning-dark border-warning/30'
        : 'bg-neutral-100 text-neutral-600 border-neutral-200'
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-md text-xs font-bold tabular-nums border ${cls}`}
      title={
        score >= 80
          ? 'Điểm cao — nên liên hệ sớm'
          : score >= 50
            ? 'Điểm trung bình — cần nuôi dưỡng'
            : 'Điểm thấp — cần thêm thông tin'
      }
    >
      {score}
    </span>
  )
}
