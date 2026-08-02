import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileX2, CheckCircle, Plus, FileText, Clock, TrendingUp, AlertTriangle,
  Search, Eye, Filter, type LucideIcon,
} from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { Button, AppModal, PageHeader, PageGuideButton, StatusBadge, Select, ConfirmDialog, EmptyState, ErrorState } from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { unwrapList } from '@frezo/utils'
import { contractApi } from '@/modules/qlns/services/contractApi'
import { personApi } from '@/modules/qlns/services/personApi'
import { contractRejectSchema } from '@/modules/qlns/constants/schema'
import { toast } from 'sonner'
import { CONTRACT_STATUS_CONFIG, CONTRACT_STATUS_OPTIONS, type ContractStatus } from '../constants/contractStatus'
import { CONTRACT_TYPES } from '../constants/templates'
import { CONTRACTS_GUIDE } from '../constants/contracts.guide'
import { DIGITAL_CONTRACT_GUIDE } from '../constants/digitalContract.guide'
import { StatusPipelineStepper } from '../../warehouse/components/StatusPipelineStepper'
import {
  DIGITAL_CONTRACT_PIPELINE,
  digitalContractListStepIndex,
} from '../../accounting/constants/accountingWorkflow'

const TYPE_OPTIONS = [
  { value: 'ALL', label: '-- Tất cả loại --' },
  ...CONTRACT_TYPES,
]

export function ContractPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<any | null>(null)
  const [approveTarget, setApproveTarget] = useState<any | null>(null)

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [quickTab, setQuickTab] = useState<'all' | 'pending' | 'active' | 'expiring'>('all')

  // ---- Data ----
  const { data: contractsRaw, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['contracts', { statusFilter, typeFilter }],
    queryFn: () => contractApi.getAll({
      ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      ...(typeFilter !== 'ALL' ? { type: typeFilter } : {}),
    }),
    select: unwrapList,
  })

  const { data: personOptions } = useQuery({
    queryKey: ['persons-combobox'],
    queryFn: () => personApi.getCombobox(),
    select: unwrapList,
  })

  const personMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const p of (personOptions || []) as any[]) m[p.value || p.id] = p.label || p.name
    return m
  }, [personOptions])

  // ---- Mutations ----
  const rejectContract = useMutation({
    mutationFn: ({ id, data }: any) => contractApi.reject(id, data),
    onSuccess: () => {
      toast.success('Đã từ chối Hợp đồng')
      setRejectModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })

  const approveContract = useMutation({
    mutationFn: ({ id }: any) => contractApi.updateStatus(id, { status: 'ACTIVE' }),
    onSuccess: () => {
      toast.success('Đã phê duyệt Hợp đồng — chuyển sang hiệu lực')
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
    onError: () => toast.error('Duyệt thất bại'),
  })

  // ---- Enrich contracts ----
  const contracts = useMemo(() => {
    const raw: any[] = Array.isArray(contractsRaw) ? contractsRaw : []
    return raw.map((c) => ({
      ...c,
      personName: c.personName || personMap[c.personId] || '—',
      isExpiringSoon: isExpiringSoon(c),
    }))
  }, [contractsRaw, personMap])

  // ---- Client-side filter (quick tabs + search) ----
  const filteredList = useMemo(() => {
    let list = contracts
    if (quickTab === 'pending') list = list.filter((c) => c.status === 'PENDING_APPROVAL')
    if (quickTab === 'active') list = list.filter((c) => c.status === 'ACTIVE')
    if (quickTab === 'expiring') list = list.filter((c) => c.isExpiringSoon)

    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim()
      list = list.filter(
        (c) =>
          (c.code || '').toLowerCase().includes(q) ||
          (c.personName || '').toLowerCase().includes(q) ||
          (c.type || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [contracts, quickTab, searchText])

  // ---- Stats ----
  const stats = useMemo(() => {
    return {
      total: contracts.length,
      pending: contracts.filter((c) => c.status === 'PENDING_APPROVAL').length,
      active: contracts.filter((c) => c.status === 'ACTIVE').length,
      expiring: contracts.filter((c) => c.isExpiringSoon).length,
    }
  }, [contracts])

  // ---- Handlers ----
  const handleOpenReject = (contract: any) => {
    setSelectedContract(contract)
    setRejectModalOpen(true)
  }

  const handleOpenDetail = (contract: any) => {
    if (contract?.id) navigate(`/qlns/contract/${contract.id}`)
  }

  const handleSubmitReject = (values: any) => {
    if (selectedContract?.id) rejectContract.mutate({ id: selectedContract.id, data: values })
  }

  const clearFilters = () => {
    setSearchText('')
    setStatusFilter('ALL')
    setTypeFilter('ALL')
    setQuickTab('all')
  }

  const hasFilter = searchText || statusFilter !== 'ALL' || typeFilter !== 'ALL' || quickTab !== 'all'

  // ---- Columns ----
  const columns = [
    {
      title: 'Mã HĐ',
      dataIndex: 'code',
      render: (val: string) => (
        <span className="font-mono text-xs font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
          {val || '—'}
        </span>
      ),
    },
    {
      title: 'Nhân sự',
      dataIndex: 'personName',
      render: (val: string) => <span className="font-medium text-neutral-800">{val}</span>,
    },
    {
      title: 'Loại HĐ',
      dataIndex: 'type',
      render: (val: string) => {
        const label = CONTRACT_TYPES.find((t) => t.value === val)?.label || val || '—'
        return <span className="text-neutral-600">{label}</span>
      },
    },
    {
      title: 'Từ ngày',
      dataIndex: 'effFrom',
      render: (val: string, row: any) => (
        <span className="text-neutral-600 tabular-nums">{formatDate(val || row.startDate)}</span>
      ),
    },
    {
      title: 'Đến ngày',
      dataIndex: 'effTo',
      render: (val: string, row: any) => (
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-600 tabular-nums">{formatDate(val || row.endDate)}</span>
          {row.isExpiringSoon && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 bg-orange-50 rounded-md border border-orange-200"
              title="Hết hạn trong 30 ngày"
            >
              <AlertTriangle size={9} /> Sắp hết
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      render: (val: number, row: any) => {
        const n = val ?? row.basicSalary
        return (
          <span className="text-neutral-700 tabular-nums">
            {n != null && n !== '' ? Number(n).toLocaleString('vi-VN') + '₫' : '—'}
          </span>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (val: string) => {
        const cfg = CONTRACT_STATUS_CONFIG[(val || 'DRAFT') as ContractStatus]
        return <StatusBadge label={cfg.label} color={cfg.color} icon={cfg.icon} />
      },
    },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      width: 120,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1">
          <button
            title="Xem chi tiết"
            onClick={() => handleOpenDetail(row)}
            className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          {(row.status === 'PENDING_APPROVAL' || row.status === 'DRAFT') && (
            <>
              <button
                title="Duyệt hợp đồng"
                onClick={() => setApproveTarget(row)}
                disabled={approveContract.isPending}
                className="p-1.5 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-40"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                title="Từ chối hợp đồng"
                onClick={() => handleOpenReject(row)}
                className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              >
                <FileX2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  // ============================================================
  // Render
  // ============================================================
  const pipelineIndex = digitalContractListStepIndex(contracts)

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <PageHeader
        title="Hợp đồng lao động"
        description="Quản lý vòng đời hợp đồng: soạn thảo → duyệt → hiệu lực → gia hạn / kết thúc."
        actions={
          <>
            <PageGuideButton guide={DIGITAL_CONTRACT_GUIDE} />
            <PageGuideButton guide={CONTRACTS_GUIDE} label="Vòng đời HĐ" />
            <Button
              onClick={() => navigate('/qlns/contract/create')}
              className="gap-2 bg-primary-700 hover:bg-primary-800 text-white shadow-sm"
            >
              <Plus size={17} /> Tạo hợp đồng
            </Button>
          </>
        }
      />

      <StatusPipelineStepper steps={DIGITAL_CONTRACT_PIPELINE} currentIndex={pipelineIndex} />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={FileText} label="Tổng HĐ" value={stats.total} tone="neutral" />
        <KpiCard icon={Clock} label="Chờ duyệt" value={stats.pending} tone="amber" />
        <KpiCard icon={TrendingUp} label="Đang hiệu lực" value={stats.active} tone="green" />
        <KpiCard icon={AlertTriangle} label="Sắp hết hạn (30d)" value={stats.expiring} tone="orange" />
      </div>

      <FilterBar
        hasActiveFilters={!!hasFilter}
        onClear={clearFilters}
        countLabel={`${filteredList.length} hợp đồng${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm theo mã HĐ, nhân sự, loại…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            aria-label="Tìm hợp đồng"
          />
        </div>
        <div className="w-52">
          <Select
            options={CONTRACT_STATUS_OPTIONS}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v || 'ALL')}
            placeholder="Trạng thái"
          />
        </div>
        <div className="w-48">
          <Select
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={(v) => setTypeFilter(v || 'ALL')}
            placeholder="Loại hợp đồng"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mr-1 inline-flex items-center gap-1">
            <Filter size={11} /> Lọc nhanh:
          </span>
          {[
            { key: 'all' as const, label: 'Tất cả', count: stats.total },
            { key: 'pending' as const, label: 'Chờ duyệt', count: stats.pending },
            { key: 'active' as const, label: 'Đang hiệu lực', count: stats.active },
            { key: 'expiring' as const, label: 'Sắp hết hạn', count: stats.expiring },
          ].map((t) => {
            const active = quickTab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setQuickTab(t.key)}
                className={`inline-flex items-center gap-1 h-8 px-2 rounded-full text-xs font-medium border transition ${
                  active
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {t.label}
                <span className={`inline-flex items-center justify-center min-w-[18px] h-4 rounded-full text-[10px] font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được hợp đồng"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : !isLoading && filteredList.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={FileText}
            title={contracts.length === 0 ? 'Chưa có hợp đồng nào' : 'Không có hợp đồng khớp bộ lọc'}
            description={
              contracts.length === 0
                ? 'Tạo hợp đồng mới để bắt đầu quy trình ký kết.'
                : 'Thử xoá lọc hoặc đổi điều kiện tìm kiếm.'
            }
            action={
              contracts.length === 0
                ? { label: 'Tạo hợp đồng', onClick: () => navigate('/qlns/contract/create') }
                : hasFilter
                  ? { label: 'Xoá lọc', onClick: clearFilters }
                  : undefined
            }
          />
        </div>
      ) : (
        <AppTable
          data={filteredList}
          columns={columns as any}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={() => void refetch()}
        />
      )}

      <ConfirmDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={() => {
          if (!approveTarget?.id) return
          approveContract.mutate(
            { id: approveTarget.id },
            { onSuccess: () => setApproveTarget(null) },
          )
        }}
        title={`Duyệt hợp đồng ${approveTarget?.code || ''}?`}
        message={`HĐ sẽ chuyển sang hiệu lực cho ${approveTarget?.personName || 'nhân sự'}.`}
        confirmText="Duyệt"
        cancelText="Huỷ"
        variant="warning"
        isLoading={approveContract.isPending}
      />

      {/* Reject Modal */}
      <AppModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Từ chối Hợp đồng"
        description={
          selectedContract?.code
            ? `HĐ ${selectedContract.code} — ${selectedContract.personName}`
            : undefined
        }
      >
        <AppForm
          schema={contractRejectSchema}
          defaultValues={{ reason: '' }}
          onSubmit={handleSubmitReject}
          fields={[{ name: 'reason', label: 'Lý do từ chối', placeholder: 'Nhập lý do rõ ràng để nhân sự biết cần chỉnh sửa gì...' }]}
          submitText="Xác nhận từ chối"
          isLoading={rejectContract.isPending}
        />
      </AppModal>
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

function isExpiringSoon(contract: any): boolean {
  const endRaw = contract.effTo || contract.endDate
  if (!endRaw) return false
  if (contract.status !== 'ACTIVE') return false
  const end = new Date(endRaw)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  const days = diff / (1000 * 60 * 60 * 24)
  return days > 0 && days <= 30
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: number
  tone: 'neutral' | 'amber' | 'green' | 'orange'
}

function KpiCard({ icon: Icon, label, value, tone }: KpiCardProps) {
  const toneMap = {
    neutral: 'bg-white border-neutral-200 text-neutral-700 [&_.ico]:bg-neutral-100 [&_.ico]:text-neutral-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-700 [&_.ico]:bg-amber-100 [&_.ico]:text-amber-600',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700 [&_.ico]:bg-emerald-100 [&_.ico]:text-emerald-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-700 [&_.ico]:bg-orange-100 [&_.ico]:text-orange-600',
  }[tone]
  return (
    <div className={`rounded-xl border p-3 flex items-center gap-3 ${toneMap}`}>
      <div className="ico w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80 truncate">
          {label}
        </div>
        <div className="text-xl font-bold tabular-nums text-neutral-900 leading-none mt-0.5">
          {value.toLocaleString('vi-VN')}
        </div>
      </div>
    </div>
  )
}
