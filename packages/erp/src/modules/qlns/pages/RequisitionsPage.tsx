// ============================================================
// FREZO ERP — Recruitment Requisitions Page
// Danh sách tin tuyển dụng + modal tạo mới.
// Nếu BE chưa release endpoint → hook trả empty → hiển thị EmptyState.
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Briefcase, Users as UsersIcon, Kanban, Loader2, ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button, PageHeader, AppModal, EmptyState, BulkSelectionBar } from '@frezo/ui'
import { formatDate } from '@frezo/utils'
import {
  useRequisitions, useCreateRequisition,
} from '../hooks/useRecruitment'
import type {
  Requisition, RequisitionStatus, RequisitionRequest,
} from '../services/recruitmentApi'
import {
  useTableSelection, useCheckboxIndeterminate,
} from '@/lib/table/useTableSelection'

const STATUS_LABEL: Record<RequisitionStatus, string> = {
  DRAFT: 'Nháp',
  OPEN: 'Đang tuyển',
  ON_HOLD: 'Tạm dừng',
  CLOSED: 'Đã đóng',
  FILLED: 'Đã đủ',
}

const STATUS_TONE: Record<RequisitionStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  OPEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ON_HOLD: 'bg-amber-50 text-amber-700 border-amber-200',
  CLOSED: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  FILLED: 'bg-blue-50 text-blue-700 border-blue-200',
}

export function RequisitionsPage() {
  const nav = useNavigate()
  const { data: rows, isLoading, isError } = useRequisitions()
  const create = useCreateRequisition()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<RequisitionRequest>({
    title: '', headcount: 1, positionCode: '', jobDescription: '',
    requirements: '', status: 'DRAFT',
  })

  const list = (rows as Requisition[] | undefined) ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.departmentName || '').toLowerCase().includes(q) ||
        (r.positionCode || '').toLowerCase().includes(q),
    )
  }, [list, search])

  // ---- Bulk selection ----
  const selection = useTableSelection<Requisition>(filtered, (r) => r.id)
  const headerCheckboxRef = useCheckboxIndeterminate(selection.someSelected)

  const stats = useMemo(() => {
    const total = list.length
    const openCount = list.filter((r) => r.status === 'OPEN').length
    const filledCount = list.filter((r) => r.status === 'FILLED').length
    const openHeadcount = list
      .filter((r) => r.status === 'OPEN')
      .reduce((s, r) => s + Math.max(0, r.headcount - (r.filledCount ?? 0)), 0)
    return { total, openCount, filledCount, openHeadcount }
  }, [list])

  const onCreate = () => {
    if (!form.title.trim() || form.headcount < 1) return
    create.mutate(form, {
      onSuccess: () => {
        setShowCreate(false)
        setForm({
          title: '', headcount: 1, positionCode: '', jobDescription: '',
          requirements: '', status: 'DRAFT',
        })
      },
    })
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Tin tuyển dụng"
        description="Quản lý nhu cầu tuyển dụng — tạo tin, phân công quản lý và theo dõi tiến độ."
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={() => nav('/qlns/recruitment/board')}>
              <Kanban size={15} /> Kanban ứng viên
            </Button>
            <Button className="gap-2 bg-primary-700 hover:bg-primary-800 text-white" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Tạo tin tuyển dụng
            </Button>
          </>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile icon={Briefcase} label="Tổng tin" value={stats.total} tone="neutral" />
        <KpiTile icon={UsersIcon} label="Đang tuyển" value={stats.openCount} tone="emerald" />
        <KpiTile icon={UsersIcon} label="Cần tuyển thêm" value={stats.openHeadcount} tone="amber" />
        <KpiTile icon={Briefcase} label="Đã đủ" value={stats.filledCount} tone="blue" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
            placeholder="Tìm theo tiêu đề, phòng ban, mã vị trí…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table / Empty */}
      {isLoading ? (
        <div className="p-8 border rounded-lg bg-white text-center text-neutral-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Đang tải…
        </div>
      ) : isError ? (
        <div className="border rounded-lg bg-white">
          <EmptyState
            icon={Briefcase}
            title="Không tải được tin tuyển dụng"
            description="Lỗi API (401 không bị nuốt). Kiểm tra đăng nhập hoặc thử lại."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border rounded-lg bg-white">
          <EmptyState
            icon={Briefcase}
            title="Chưa có tin tuyển dụng"
            description={
              list.length === 0
                ? 'Tạo tin mới để bắt đầu quy trình tuyển dụng (quantity / hiredCount sync BE).'
                : 'Không có tin nào khớp với tìm kiếm.'
            }
            action={{ label: 'Tạo tin tuyển dụng', onClick: () => setShowCreate(true) }}
          />
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="p-3 text-center w-10">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-300 cursor-pointer"
                    checked={selection.allSelected}
                    onChange={selection.toggleAll}
                    aria-label="Chọn tất cả tin"
                  />
                </th>
                <th className="p-3 text-left font-medium">Tiêu đề</th>
                <th className="p-3 text-left font-medium">Phòng ban</th>
                <th className="p-3 text-center font-medium">Headcount</th>
                <th className="p-3 text-left font-medium">Ngày mở</th>
                <th className="p-3 text-center font-medium">Trạng thái</th>
                <th className="p-3 text-right font-medium w-40">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((r) => {
                const filled = r.filledCount ?? 0
                const pct = r.headcount > 0 ? Math.min(100, Math.round((filled / r.headcount) * 100)) : 0
                const rowSelected = selection.isSelected(r)
                return (
                  <tr
                    key={r.id}
                    className={rowSelected ? 'bg-primary-50/40 hover:bg-primary-50/60' : 'hover:bg-neutral-50'}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-300 cursor-pointer"
                        checked={rowSelected}
                        onChange={() => selection.toggleRow(r)}
                        aria-label={`Chọn tin ${r.title}`}
                      />
                    </td>
                    <td className="p-3 font-medium text-neutral-900">
                      {r.title}
                      {r.positionCode && (
                        <div className="text-[11px] text-neutral-400 font-mono">{r.positionCode}</div>
                      )}
                    </td>
                    <td className="p-3 text-neutral-600">{r.departmentName || '—'}</td>
                    <td className="p-3 text-center">
                      <div className="text-sm font-semibold tabular-nums">
                        {filled}/{r.headcount}
                      </div>
                      <div className="mt-1 mx-auto max-w-[80px] h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-3 text-xs text-neutral-500">
                      {r.openedDate || r.openDate
                        ? formatDate((r.openedDate || r.openDate) as string)
                        : '—'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${STATUS_TONE[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                        onClick={() => nav(`/qlns/recruitment/board?requisitionId=${r.id}`)}
                      >
                        Xem ứng viên <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Sticky bulk-action bar — hiện khi có tin được chọn (export ẩn — chưa seed *.EXPORT) */}
      {selection.count > 0 && (
        <BulkSelectionBar
          selectedCount={selection.count}
          totalCount={filtered.length}
          onDeselect={selection.clear}
          actions={
            <span className="text-xs text-neutral-500 px-2">Export — Chưa sẵn sàng</span>
          }
        />
      )}

      {/* Create modal */}
      <AppModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tạo tin tuyển dụng"
        description="Điền thông tin nhu cầu — sau khi tạo có thể mở tin để đăng lên public."
        maxWidth="2xl"
      >
        <div className="space-y-3">
          <FormRow label="Tiêu đề *">
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="VD: Senior Backend Java (Spring Boot)"
            />
          </FormRow>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Mã vị trí">
              <input
                className="w-full border rounded-md px-3 py-2 text-sm font-mono"
                value={form.positionCode ?? ''}
                onChange={(e) => setForm({ ...form, positionCode: e.target.value })}
                placeholder="ENG-BE-01"
              />
            </FormRow>
            <FormRow label="Số lượng cần *">
              <input
                type="number"
                min={1}
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.headcount}
                onChange={(e) => setForm({ ...form, headcount: Math.max(1, Number(e.target.value) || 1) })}
              />
            </FormRow>
          </div>
          <FormRow label="Mô tả công việc">
            <textarea
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.jobDescription ?? ''}
              onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
            />
          </FormRow>
          <FormRow label="Yêu cầu ứng viên">
            <textarea
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.requirements ?? ''}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            />
          </FormRow>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Huỷ</Button>
            <Button onClick={onCreate} disabled={create.isPending || !form.title.trim()}>
              {create.isPending ? 'Đang tạo…' : 'Tạo mới'}
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}

// ============================================================
// Local sub-components
// ============================================================

interface KpiTileProps {
  icon: typeof Briefcase
  label: string
  value: number
  tone: 'neutral' | 'emerald' | 'amber' | 'blue'
}

function KpiTile({ icon: Icon, label, value, tone }: KpiTileProps) {
  const toneMap = {
    neutral: 'bg-white border-neutral-200 [&_.ico]:bg-neutral-100 [&_.ico]:text-neutral-600',
    emerald: 'bg-emerald-50 border-emerald-200 [&_.ico]:bg-emerald-100 [&_.ico]:text-emerald-600',
    amber: 'bg-amber-50 border-amber-200 [&_.ico]:bg-amber-100 [&_.ico]:text-amber-600',
    blue: 'bg-blue-50 border-blue-200 [&_.ico]:bg-blue-100 [&_.ico]:text-blue-600',
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

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-neutral-700 mb-1 block">{label}</label>
      {children}
    </div>
  )
}
