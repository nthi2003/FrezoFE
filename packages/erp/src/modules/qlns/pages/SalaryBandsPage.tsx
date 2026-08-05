// ============================================================
// FREZO — SalaryBandsPage
// Pay-scale ladder theo style Google/Meta/Radford
// Persist qua categoryApi (groupCode='SalaryBand')
// description = JSON { min, max, target, function, currency }
// ============================================================

import { useState, useMemo } from 'react'
import {
  Plus, Edit, Trash2, DollarSign, Search, Filter, LayoutGrid, List,
  TrendingUp, Loader2, AlertTriangle, Building2, Sparkles,
  type LucideIcon,
} from 'lucide-react'
import {
  AppModal, Button, ConfirmDialog, PageHeader, PageGuideButton, Input, Label, Select,
  IconActionButton, type PageGuideConfig,
} from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../qtht/hooks/useCategory'
import { toast } from 'sonner'
import { pageRootClass } from '../utils/pageEmbed'

// ============================================================
// Types
// ============================================================

interface BandMeta {
  min?: number
  max?: number
  target?: number
  currency?: string
  function?: string
  note?: string
}

interface Band {
  id: string
  code: string
  name: string
  shortName?: string | null
  description?: string | null
  orderIndex?: number
  active?: boolean
  meta: BandMeta
}

const FUNCTION_OPTIONS = [
  { value: 'ALL', label: 'Chung' },
  { value: 'ENG', label: 'Kỹ thuật' },
  { value: 'PROD', label: 'Sản phẩm' },
  { value: 'DES', label: 'Thiết kế' },
  { value: 'SALES', label: 'Kinh doanh' },
  { value: 'MKT', label: 'Marketing' },
  { value: 'OPS', label: 'Vận hành' },
  { value: 'HR', label: 'Nhân sự' },
  { value: 'FIN', label: 'Tài chính' },
  { value: 'LEGAL', label: 'Pháp chế' },
]

const FUNCTION_LABEL: Record<string, string> = Object.fromEntries(
  FUNCTION_OPTIONS.map((f) => [f.value, f.label]),
)

const CURRENCY_OPTIONS = [
  { value: 'VND', label: 'VNĐ' },
  { value: 'USD', label: 'USD' },
  { value: 'SGD', label: 'SGD' },
]

// ============================================================
// Guide
// ============================================================

const SALARY_GUIDE: PageGuideConfig = {
  title: 'Bậc lương',
  subtitle:
    'Khung lương chuẩn theo bậc chức danh — dải Min/Target/Max giúp minh bạch, dễ so sánh khi tuyển & review lương.',
  sections: [
    {
      heading: 'Cách sử dụng',
      type: 'steps',
      steps: [
        {
          title: 'Tạo bậc lương',
          description:
            'Đặt mã theo cấp bậc (P1..P7 hoặc JR/MID/SR/LEAD/PRINCIPAL). Nhập dải Min → Target → Max. Chọn nhóm chức năng (ENG/SALES/OPS...) hoặc "Chung".',
        },
        {
          title: 'Áp vào hợp đồng',
          description:
            'Khi tạo Hợp đồng lao động, chọn bậc lương → hệ thống gợi ý lương trong dải cho phép. Nếu vượt Max, sẽ có cảnh báo cần approval.',
        },
        {
          title: 'Review định kỳ',
          description:
            'Mỗi 6 tháng/năm — cập nhật dải theo thị trường (Robert Half, Anphabe, Talentnet). Bậc mới không xoá bậc cũ, chỉ tạo version.',
        },
      ],
    },
    {
      heading: 'Best practice',
      type: 'tips',
      tips: [
        'Chênh lệch Min↔Max mỗi bậc thường 30–50% (Radford), giữa các bậc thường +20–35%.',
        'Target = midpoint = lương công bằng cho người "meets expectation" — quan trọng nhất để anchor.',
        'Tách theo function khi chênh lệch thị trường lớn (VD: ENG vs OPS lệch tới 2x cùng 1 seniority).',
      ],
    },
  ],
}

// ============================================================
// Page
// ============================================================

const GROUP = 'SalaryBand'

export function SalaryBandsPage({ embedded }: { embedded?: boolean } = {}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Band | null>(null)
  const [confirmDel, setConfirmDel] = useState<Band | null>(null)
  const [view, setView] = useState<'ladder' | 'table'>('ladder')
  const [search, setSearch] = useState('')
  const [functionFilter, setFunctionFilter] = useState<string>('all')

  const { data: rawList, isLoading } = useCategories(GROUP)
  const createReq = useCreateCategory()
  const updateReq = useUpdateCategory()
  const deleteReq = useDeleteCategory()

  const bands: Band[] = useMemo(() => {
    const list: any[] = Array.isArray(rawList) ? rawList : []
    return list
      .map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        shortName: c.shortName,
        description: c.description,
        orderIndex: c.orderIndex,
        active: c.active !== false,
        meta: parseMeta(c.description),
      }))
      .sort((a, b) => {
        const oi = (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
        if (oi !== 0) return oi
        return String(a.code).localeCompare(String(b.code))
      })
  }, [rawList])

  const filtered = useMemo(() => {
    return bands.filter((b) => {
      if (functionFilter !== 'all' && (b.meta.function || 'ALL') !== functionFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!b.code.toLowerCase().includes(q) && !b.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [bands, functionFilter, search])

  const stats = useMemo(() => {
    const active = bands.filter((b) => b.active).length
    const withRange = bands.filter((b) => (b.meta.min || 0) > 0 && (b.meta.max || 0) > 0)
    const globalMin = withRange.length ? Math.min(...withRange.map((b) => b.meta.min || Infinity)) : 0
    const globalMax = withRange.length ? Math.max(...withRange.map((b) => b.meta.max || 0)) : 0
    const uniqueFns = new Set(bands.map((b) => b.meta.function || 'ALL'))
    return { total: bands.length, active, globalMin, globalMax, functions: uniqueFns.size }
  }, [bands])

  const hasFilter = !!search.trim() || functionFilter !== 'all'
  const clearFilters = () => {
    setSearch('')
    setFunctionFilter('all')
  }

  // ---- Ladder rendering: normalize range for bar widths ----
  const ladderData = useMemo(() => {
    const withRange = filtered.filter((b) => (b.meta.min || 0) > 0 && (b.meta.max || 0) > 0)
    const overallMin = withRange.length ? Math.min(...withRange.map((b) => b.meta.min || Infinity)) : 0
    const overallMax = withRange.length ? Math.max(...withRange.map((b) => b.meta.max || 0)) : 1
    const range = overallMax - overallMin || 1
    return { rows: filtered, overallMin, overallMax, range }
  }, [filtered])

  // ============================================================
  // Actions
  // ============================================================

  const handleOpenCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const handleOpenEdit = (b: Band) => {
    setEditing(b)
    setModalOpen(true)
  }
  const handleSubmit = (values: BandFormValues) => {
    const meta: BandMeta = {
      min: values.min ?? undefined,
      max: values.max ?? undefined,
      target: values.target ?? undefined,
      currency: values.currency,
      function: values.function,
      note: values.note || undefined,
    }
    const payload = {
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      shortName: values.shortName || null,
      description: JSON.stringify(meta),
      orderIndex: values.orderIndex ?? 0,
      groupCode: GROUP,
      activated: values.active,
    }
    if (editing?.id) {
      updateReq.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => setModalOpen(false) },
      )
    } else {
      createReq.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }
  const handleDelete = () => {
    if (!confirmDel) return
    deleteReq.mutate(confirmDel.id, {
      onSuccess: () => setConfirmDel(null),
      onError: () => setConfirmDel(null),
    })
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className={pageRootClass(embedded, 'space-y-5')}>
      {!embedded && (
      <PageHeader
        title="Bậc lương"
        description="Khung lương chuẩn theo bậc chức danh — minh bạch, dễ so sánh, dễ áp vào hợp đồng"
        actions={
          <>
            <PageGuideButton guide={SALARY_GUIDE} />
            <Button
              onClick={handleOpenCreate}
              className="gap-2 bg-primary-700 hover:bg-primary-800 text-white shadow-sm"
            >
              <Plus size={16} /> Thêm bậc lương
            </Button>
          </>
        }
      />
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={DollarSign} label="Số bậc lương" value={String(stats.total)} tone="neutral" />
        <KpiCard icon={Sparkles} label="Đang hoạt động" value={String(stats.active)} tone="green" />
        <KpiCard
          icon={TrendingUp}
          label="Dải toàn hệ thống"
          value={stats.globalMin ? `${formatMoney(stats.globalMin)} – ${formatMoney(stats.globalMax)}` : '—'}
          tone="blue"
        />
        <KpiCard icon={Building2} label="Nhóm chức năng" value={String(stats.functions)} tone="amber" />
      </div>

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={clearFilters}
        countLabel={`${filtered.length} bậc lương${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã, tên bậc lương…"
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            aria-label="Tìm bậc lương"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mr-1 inline-flex items-center gap-1">
            <Filter size={11} /> Nhóm chức năng:
          </span>
          <button
            type="button"
            onClick={() => setFunctionFilter('all')}
            className={`h-8 px-2.5 rounded-full text-xs font-medium border transition ${
              functionFilter === 'all'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            Tất cả
          </button>
          {FUNCTION_OPTIONS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFunctionFilter(f.value)}
              className={`h-8 px-2.5 rounded-full text-xs font-medium border transition ${
                functionFilter === f.value
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center bg-neutral-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setView('ladder')}
            className={`px-2.5 h-8 rounded text-xs font-semibold inline-flex items-center gap-1 transition ${
              view === 'ladder' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500'
            }`}
          >
            <LayoutGrid size={13} /> Thang bậc
          </button>
          <button
            type="button"
            onClick={() => setView('table')}
            className={`px-2.5 h-8 rounded text-xs font-semibold inline-flex items-center gap-1 transition ${
              view === 'table' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500'
            }`}
          >
            <List size={13} /> Bảng
          </button>
        </div>
      </FilterBar>

      {/* Content */}
      {isLoading ? (
        <div className="p-12 flex items-center justify-center bg-white border border-neutral-200 rounded-2xl">
          <Loader2 size={22} className="animate-spin text-primary-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 bg-white border border-neutral-200 rounded-2xl flex flex-col items-center justify-center text-center">
          <DollarSign size={40} className="text-neutral-300 mb-3" />
          <h3 className="text-base font-semibold text-neutral-700">
            {bands.length === 0 ? 'Chưa có bậc lương nào' : 'Không tìm thấy'}
          </h3>
          <p className="text-sm text-neutral-500 mt-1 max-w-md">
            {bands.length === 0
              ? 'Tạo khung lương chuẩn cho tổ chức — từ Junior đến Principal — để minh bạch và dễ áp vào hợp đồng.'
              : 'Thử điều chỉnh bộ lọc.'}
          </p>
          {bands.length === 0 && (
            <Button
              onClick={handleOpenCreate}
              className="mt-4 gap-2 bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Plus size={16} /> Tạo bậc lương đầu tiên
            </Button>
          )}
        </div>
      ) : view === 'ladder' ? (
        <LadderView
          ladderData={ladderData}
          onEdit={handleOpenEdit}
          onDelete={setConfirmDel}
        />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <AppTable
            data={filtered as any}
            isLoading={false}
            density="compact"
            showSearch={false}
            pageSize={10}
            pageSizeOptions={[10]}
            columns={[
              {
                title: 'Mã', dataIndex: 'code', width: 90,
                render: (v: string) => (
                  <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                    {v}
                  </span>
                ),
              },
              {
                title: 'Tên bậc', dataIndex: 'name',
                render: (_: any, row: any) => (
                  <div>
                    <div className="font-semibold text-neutral-800">{row.name}</div>
                    {row.shortName && (
                      <div className="text-[11px] text-neutral-400">Viết tắt: {row.shortName}</div>
                    )}
                  </div>
                ),
              },
              {
                title: 'Nhóm chức năng', dataIndex: 'meta',
                render: (m: BandMeta) => (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200 rounded">
                    {FUNCTION_LABEL[m.function || 'ALL'] || m.function}
                  </span>
                ),
              },
              {
                title: 'Tối thiểu', dataIndex: 'meta',
                render: (m: BandMeta) => (
                  <span className="tabular-nums font-mono text-sm text-neutral-600">
                    {m.min ? formatMoney(m.min, m.currency) : '—'}
                  </span>
                ),
              },
              {
                title: 'Mục tiêu', dataIndex: 'meta',
                render: (m: BandMeta) => (
                  <span className="tabular-nums font-mono text-sm font-semibold text-primary-700">
                    {m.target ? formatMoney(m.target, m.currency) : '—'}
                  </span>
                ),
              },
              {
                title: 'Tối đa', dataIndex: 'meta',
                render: (m: BandMeta) => (
                  <span className="tabular-nums font-mono text-sm text-neutral-600">
                    {m.max ? formatMoney(m.max, m.currency) : '—'}
                  </span>
                ),
              },
              {
                title: 'Trạng thái', dataIndex: 'active',
                render: (v: boolean) => (
                  <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${
                    v
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                  }`}>
                    {v ? 'Kích hoạt' : 'Tắt'}
                  </span>
                ),
              },
              {
                title: 'Thao tác', dataIndex: 'id', width: 100,
                render: (_: any, row: any) => (
                  <div className="flex items-center gap-1">
                    <IconActionButton tooltip="Sửa" tone="primary" onClick={() => handleOpenEdit(row)}>
                      <Edit size={14} />
                    </IconActionButton>
                    <IconActionButton tooltip="Xoá" tone="rose" onClick={() => setConfirmDel(row)}>
                      <Trash2 size={14} />
                    </IconActionButton>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* ==================== Modals ==================== */}
      <BandFormModal
        isOpen={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createReq.isPending || updateReq.isPending}
      />

      <ConfirmDialog
        isOpen={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        title="Xoá bậc lương"
        message={confirmDel ? `Xoá bậc lương "${confirmDel.name}" (${confirmDel.code})? Hợp đồng đã tham chiếu bậc này sẽ mất liên kết.` : ''}
        variant="danger"
        confirmText="Xoá"
        cancelText="Huỷ"
      />
    </div>
  )
}

// ============================================================
// Ladder view
// ============================================================

interface LadderViewProps {
  ladderData: {
    rows: Band[]
    overallMin: number
    overallMax: number
    range: number
  }
  onEdit: (b: Band) => void
  onDelete: (b: Band) => void
}

function LadderView({ ladderData, onEdit, onDelete }: LadderViewProps) {
  const { rows, overallMin, range } = ladderData
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Legend */}
      <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50/40 flex items-center gap-4 text-[11px]">
        <span className="inline-flex items-center gap-1.5 text-neutral-500">
          <span className="w-3 h-3 rounded bg-primary-200 border border-primary-300" /> Dải Min → Max
        </span>
        <span className="inline-flex items-center gap-1.5 text-neutral-500">
          <span className="w-0.5 h-3 bg-primary-700" /> Target (midpoint)
        </span>
        <span className="ml-auto text-neutral-400">
          Dải toàn cục: <span className="font-mono">{formatMoney(overallMin)}</span> →{' '}
          <span className="font-mono">{formatMoney(overallMin + range)}</span>
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-neutral-100">
        {rows.map((b) => {
          const hasRange = (b.meta.min || 0) > 0 && (b.meta.max || 0) > 0
          const min = b.meta.min || 0
          const max = b.meta.max || 0
          const target = b.meta.target || (min && max ? (min + max) / 2 : 0)

          const leftPct = hasRange ? Math.max(0, ((min - overallMin) / range) * 100) : 0
          const widthPct = hasRange ? Math.max(2, ((max - min) / range) * 100) : 0
          const targetPct = hasRange && target > min && target < max
            ? ((target - min) / (max - min)) * 100
            : 50

          return (
            <div key={b.id} className="group px-5 py-4 hover:bg-neutral-50/50 transition-colors">
              <div className="flex items-center gap-4">
                {/* Left: code + name */}
                <div className="w-56 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center min-w-[42px] h-7 px-2 rounded-md bg-gradient-to-br from-primary-500 to-primary-700 text-white font-mono text-xs font-bold shadow-sm">
                      {b.code}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-neutral-800 truncate">{b.name}</div>
                      <div className="text-[10px] text-neutral-400 uppercase tracking-wider truncate">
                        {FUNCTION_LABEL[b.meta.function || 'ALL']}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle: ladder bar */}
                <div className="flex-1 min-w-0">
                  {hasRange ? (
                    <>
                      <div className="relative h-8 bg-neutral-100 rounded-lg overflow-hidden">
                        <div
                          className="absolute top-0 h-full bg-gradient-to-r from-primary-200 to-primary-400 border-l border-r border-primary-500/60 rounded"
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        >
                          {/* Target marker inside bar */}
                          {target > 0 && (
                            <span
                              className="absolute top-0 bottom-0 w-0.5 bg-primary-800"
                              style={{ left: `${targetPct}%` }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px] tabular-nums font-mono text-neutral-500">
                        <span>
                          Min: <strong className="text-neutral-700">{formatMoney(min, b.meta.currency)}</strong>
                        </span>
                        {target > 0 && (
                          <span>
                            Target: <strong className="text-primary-700">{formatMoney(target, b.meta.currency)}</strong>
                          </span>
                        )}
                        <span>
                          Max: <strong className="text-neutral-700">{formatMoney(max, b.meta.currency)}</strong>
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-neutral-400 italic inline-flex items-center gap-1">
                      <AlertTriangle size={11} /> Chưa nhập dải lương
                    </div>
                  )}
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <IconActionButton tooltip="Sửa" tone="primary" size="sm" onClick={() => onEdit(b)}>
                    <Edit size={13} />
                  </IconActionButton>
                  <IconActionButton tooltip="Xoá" tone="rose" size="sm" onClick={() => onDelete(b)}>
                    <Trash2 size={13} />
                  </IconActionButton>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Band Form Modal
// ============================================================

interface BandFormValues {
  code: string
  name: string
  shortName?: string | null
  function: string
  currency: string
  min: number | null
  target: number | null
  max: number | null
  note?: string
  orderIndex: number
  active: boolean
}

interface BandFormModalProps {
  isOpen: boolean
  editing: Band | null
  onClose: () => void
  onSubmit: (values: BandFormValues) => void
  isSubmitting: boolean
}

function BandFormModal({ isOpen, editing, onClose, onSubmit, isSubmitting }: BandFormModalProps) {
  const [form, setForm] = useState<BandFormValues>(getInitialForm(editing))

  // Reset when editing changes / modal opens
  useMemo(() => {
    if (isOpen) setForm(getInitialForm(editing))
  }, [isOpen, editing])

  const setField = <K extends keyof BandFormValues>(k: K, v: BandFormValues[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
  }

  const handleSubmit = () => {
    if (!form.code.trim()) return toast.error('Mã bậc lương không được để trống')
    if (!form.name.trim()) return toast.error('Tên bậc lương không được để trống')
    if (form.min != null && form.max != null && form.min > form.max) {
      return toast.error('Min phải nhỏ hơn Max')
    }
    if (form.target != null && form.min != null && form.target < form.min) {
      return toast.error('Target phải ≥ Min')
    }
    if (form.target != null && form.max != null && form.target > form.max) {
      return toast.error('Target phải ≤ Max')
    }
    onSubmit(form)
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? `Sửa bậc lương: ${editing.name}` : 'Thêm bậc lương mới'}
      maxWidth="2xl"
    >
      <div className="py-2 space-y-4">
        {/* Basic */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Mã bậc <span className="text-rose-500">*</span></Label>
            <Input
              placeholder="P1, JR, SENIOR..."
              value={form.code}
              onChange={(e) => setField('code', e.target.value.toUpperCase())}
              disabled={!!editing}
              className="font-mono"
            />
            <p className="text-[10px] text-neutral-400">UPPERCASE, khoá cứng sau khi tạo</p>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Tên bậc <span className="text-rose-500">*</span></Label>
            <Input
              placeholder="Junior, Middle, Senior..."
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Viết tắt</Label>
            <Input
              placeholder="JR"
              value={form.shortName || ''}
              onChange={(e) => setField('shortName', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Nhóm chức năng</Label>
            <Select
              options={FUNCTION_OPTIONS}
              value={form.function}
              onChange={(v) => setField('function', v)}
              placeholder="Nhóm chức năng"
              aria-label="Nhóm chức năng"
              showSearch={false}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Loại tiền</Label>
            <Select
              options={CURRENCY_OPTIONS}
              value={form.currency}
              onChange={(v) => setField('currency', v)}
              placeholder="Loại tiền"
              aria-label="Loại tiền"
              showSearch={false}
            />
          </div>
        </div>

        {/* Salary range */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
            Dải lương (khuyến nghị chênh Min↔Max = 30–50%)
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MoneyInput
              label="Min"
              value={form.min}
              onChange={(v) => setField('min', v)}
              currency={form.currency}
              tone="border-neutral-300"
            />
            <MoneyInput
              label="Target"
              value={form.target}
              onChange={(v) => setField('target', v)}
              currency={form.currency}
              tone="border-primary-300 bg-primary-50/30"
              highlight
            />
            <MoneyInput
              label="Max"
              value={form.max}
              onChange={(v) => setField('max', v)}
              currency={form.currency}
              tone="border-neutral-300"
            />
          </div>
          {form.min != null && form.max != null && form.min > 0 && form.max > 0 && (
            <div className="mt-2 text-[11px] text-neutral-500">
              Spread: <strong className="text-primary-700 tabular-nums">
                {(((form.max - form.min) / form.min) * 100).toFixed(0)}%
              </strong>
              {form.target != null && form.target > 0 && (
                <> · Compa-Ratio Target: <strong className="text-primary-700 tabular-nums">
                  {((form.target / ((form.min + form.max) / 2)) * 100).toFixed(0)}%
                </strong></>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Thứ tự hiển thị</Label>
            <Input
              type="number"
              value={form.orderIndex}
              onChange={(e) => setField('orderIndex', Number(e.target.value) || 0)}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Ghi chú nội bộ</Label>
            <Input
              placeholder="Tham khảo Radford Q2/2026..."
              value={form.note || ''}
              onChange={(e) => setField('note', e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setField('active', e.target.checked)}
            className="w-4 h-4 accent-primary-600"
          />
          <span className="text-sm text-neutral-700">Kích hoạt (dùng để chọn khi tạo hợp đồng)</span>
        </label>

        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary-700 hover:bg-primary-800 text-white gap-1"
          >
            {isSubmitting && <Loader2 size={13} className="animate-spin" />}
            {editing ? 'Cập nhật' : 'Tạo bậc lương'}
          </Button>
        </div>
      </div>
    </AppModal>
  )
}

// ============================================================
// Helpers / Sub-components
// ============================================================

interface MoneyInputProps {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  currency: string
  tone: string
  highlight?: boolean
}

function MoneyInput({ label, value, onChange, currency, tone, highlight }: MoneyInputProps) {
  return (
    <div className="space-y-1.5">
      <Label className={highlight ? 'text-primary-700' : ''}>{label}</Label>
      <div className={`relative border rounded-lg ${tone}`}>
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          placeholder="0"
          className="w-full h-9 pl-3 pr-14 text-sm bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 tabular-nums font-mono"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-neutral-400">
          {currency}
        </span>
      </div>
      {value != null && value > 0 && (
        <p className="text-[10px] text-neutral-400 tabular-nums">
          ≈ {formatMoney(value, currency)}
        </p>
      )}
    </div>
  )
}

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: string
  tone: 'neutral' | 'green' | 'amber' | 'blue'
}
function KpiCard({ icon: Icon, label, value, tone }: KpiCardProps) {
  const toneMap = {
    neutral: 'bg-white border-neutral-200 [&_.ico]:bg-neutral-100 [&_.ico]:text-neutral-600',
    green:   'bg-emerald-50/60 border-emerald-200 [&_.ico]:bg-emerald-100 [&_.ico]:text-emerald-600',
    amber:   'bg-amber-50/60 border-amber-200 [&_.ico]:bg-amber-100 [&_.ico]:text-amber-600',
    blue:    'bg-blue-50/60 border-blue-200 [&_.ico]:bg-blue-100 [&_.ico]:text-blue-600',
  }[tone]
  return (
    <div className={`p-3 rounded-xl border flex items-center gap-3 ${toneMap}`}>
      <div className="ico w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 truncate">{label}</div>
        <div className="text-sm font-bold text-neutral-900 tabular-nums truncate mt-0.5">{value}</div>
      </div>
    </div>
  )
}

// ============================================================
// Utils
// ============================================================

function parseMeta(description?: string | null): BandMeta {
  if (!description) return {}
  try {
    const parsed = JSON.parse(description)
    if (typeof parsed === 'object' && parsed !== null) return parsed as BandMeta
  } catch { /* not JSON */ }
  return { note: description }
}

function getInitialForm(editing: Band | null): BandFormValues {
  if (!editing) {
    return {
      code: '',
      name: '',
      shortName: '',
      function: 'ALL',
      currency: 'VND',
      min: null,
      target: null,
      max: null,
      note: '',
      orderIndex: 0,
      active: true,
    }
  }
  return {
    code: editing.code,
    name: editing.name,
    shortName: editing.shortName || '',
    function: editing.meta.function || 'ALL',
    currency: editing.meta.currency || 'VND',
    min: editing.meta.min ?? null,
    target: editing.meta.target ?? null,
    max: editing.meta.max ?? null,
    note: editing.meta.note || '',
    orderIndex: editing.orderIndex ?? 0,
    active: editing.active !== false,
  }
}

function formatMoney(value?: number, currency: string = 'VND'): string {
  if (value == null) return '—'
  if (currency === 'VND') {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B ₫`
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ₫`
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K ₫`
    return `${value.toLocaleString('vi-VN')} ₫`
  }
  if (currency === 'USD') return `$${value.toLocaleString('en-US')}`
  return `${value.toLocaleString()} ${currency}`
}
