import { useMemo, useState } from 'react'
import { Plus, Search, ArrowRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button, PageHeader, AppModal, BulkSelectionBar, ConfirmDialog,
} from '@frezo/ui'
import { formatDate } from '@frezo/utils'
import {
  useLeads, useCreateLead, useConvertLead, useDeleteLead,
} from '../hooks/useCrm'
import type { Lead, LeadStatus } from '../services/crmApi'
import {
  useTableSelection, useCheckboxIndeterminate,
} from '@/lib/table/useTableSelection'

const STATUS_TABS: Array<{ key: LeadStatus | 'ALL'; label: string; tone: string }> = [
  { key: 'ALL', label: 'Tất cả', tone: 'bg-neutral-900' },
  { key: 'NEW', label: 'Mới', tone: 'bg-blue-600' },
  { key: 'CONTACTED', label: 'Đã liên hệ', tone: 'bg-cyan-600' },
  { key: 'QUALIFIED', label: 'Đủ điều kiện', tone: 'bg-amber-600' },
  { key: 'UNQUALIFIED', label: 'Loại', tone: 'bg-neutral-400' },
  { key: 'CONVERTED', label: 'Đã convert', tone: 'bg-emerald-600' },
]

export function LeadsPage() {
  const [status, setStatus] = useState<LeadStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [confirmBulk, setConfirmBulk] = useState<Lead[] | null>(null)
  const [convertTarget, setConvertTarget] = useState<Lead | null>(null)
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', companyName: '', source: '' })

  const { data: rows, isLoading } = useLeads(status === 'ALL' ? undefined : status)
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

  // ---- Bulk selection ----
  const selection = useTableSelection<Lead>(filtered, (l) => l.id)
  const headerCheckboxRef = useCheckboxIndeterminate(selection.someSelected)

  const [bulkRunning, setBulkRunning] = useState<'delete' | null>(null)

  const runBulkDelete = async () => {
    if (!confirmBulk) return
    setBulkRunning('delete')
    const res = await Promise.allSettled(confirmBulk.map((l) => del.mutateAsync(l.id)))
    const ok = res.filter((r) => r.status === 'fulfilled').length
    const fail = res.length - ok
    if (ok > 0) toast.success(`Đã xoá ${ok} lead`)
    if (fail > 0) toast.error(`${fail} lead xoá thất bại`)
    setConfirmBulk(null)
    selection.clear()
    setBulkRunning(null)
  }

  const onCreate = () => {
    if (!form.fullName.trim()) return
    create.mutate({ ...form, status: 'NEW' }, { onSuccess: () => {
      setShowCreate(false)
      setForm({ fullName: '', phone: '', email: '', companyName: '', source: '' })
    }})
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Leads"
        description="Khách hàng tiềm năng — theo dõi và convert thành cơ hội bán hàng (Deal)."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
            placeholder="Tìm theo tên, email, sđt, công ty…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 border rounded-md p-0.5 bg-white flex-wrap">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`px-3 py-1.5 text-sm rounded whitespace-nowrap ${
                status === t.key ? `${t.tone} text-white` : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Button className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Thêm Lead
        </Button>
      </div>

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
                  aria-label="Chọn tất cả lead"
                />
              </th>
              <th className="p-3 text-left font-medium">Tên</th>
              <th className="p-3 text-left font-medium">Công ty</th>
              <th className="p-3 text-left font-medium">Liên hệ</th>
              <th className="p-3 text-left font-medium">Nguồn</th>
              <th className="p-3 text-center font-medium">Score</th>
              <th className="p-3 text-center font-medium">Trạng thái</th>
              <th className="p-3 text-left font-medium">Ngày tạo</th>
              <th className="p-3 text-right font-medium w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {isLoading && <tr><td colSpan={9} className="p-6 text-center text-neutral-500">Đang tải…</td></tr>}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={9} className="p-6 text-center text-neutral-500">Chưa có lead nào</td></tr>
            )}
            {filtered.map((l: Lead) => {
              const rowSelected = selection.isSelected(l)
              return (
                <tr
                  key={l.id}
                  className={rowSelected ? 'bg-primary-50/40 hover:bg-primary-50/60' : 'hover:bg-neutral-50'}
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-300 cursor-pointer"
                      checked={rowSelected}
                      onChange={() => selection.toggleRow(l)}
                      aria-label={`Chọn lead ${l.fullName}`}
                    />
                  </td>
                  <td className="p-3 font-medium">{l.fullName}</td>
                  <td className="p-3 text-neutral-700">{l.companyName || '—'}</td>
                  <td className="p-3 text-neutral-600">
                    {l.phone && <div>📞 {l.phone}</div>}
                    {l.email && <div className="text-xs">✉ {l.email}</div>}
                  </td>
                  <td className="p-3 text-neutral-600">{l.source || '—'}</td>
                  <td className="p-3 text-center">
                    <ScoreBadge score={l.score ?? 0} />
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs border border-neutral-200 bg-neutral-50">
                      {STATUS_TABS.find((s) => s.key === l.status)?.label || l.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-neutral-500">{l.createdDate ? formatDate(l.createdDate) : '—'}</td>
                  <td className="p-3 text-right">
                    {l.status !== 'CONVERTED' && l.status !== 'UNQUALIFIED' && (
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        onClick={() => setConvertTarget(l)}
                        title="Chuyển thành Deal"
                      >
                        Convert <ArrowRight size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Sticky bulk-action bar */}
      <BulkSelectionBar
        selectedCount={selection.count}
        totalCount={filtered.length}
        onDeselect={selection.clear}
        actions={
          <>
            <Button
              size="sm"
              variant="destructive"
              disabled={bulkRunning !== null}
              onClick={() => setConfirmBulk(selection.selectedRows)}
              className="gap-1.5"
            >
              <Trash2 size={14} />
              {bulkRunning === 'delete' ? 'Đang xoá…' : 'Xoá'}
            </Button>
          </>
        }
      />

      {/* Confirm bulk delete */}
      <ConfirmDialog
        isOpen={!!confirmBulk}
        onClose={() => (bulkRunning ? undefined : setConfirmBulk(null))}
        onConfirm={runBulkDelete}
        title={`Xoá ${confirmBulk?.length ?? 0} lead?`}
        message="Các lead đã chọn sẽ bị xoá vĩnh viễn. Thao tác không thể hoàn tác."
        variant="danger"
        confirmText="Xoá tất cả"
        cancelText="Huỷ"
      />

      <ConfirmDialog
        isOpen={!!convertTarget}
        onClose={() => setConvertTarget(null)}
        onConfirm={() => {
          if (!convertTarget) return
          convert.mutate(
            { id: convertTarget.id },
            { onSuccess: () => setConvertTarget(null) },
          )
        }}
        title="Convert lead thành Deal?"
        message={`Lead "${convertTarget?.fullName || ''}" sẽ chuyển thành Deal.`}
        confirmText="Convert"
        cancelText="Huỷ"
        variant="default"
        isLoading={convert.isPending}
      />

      <AppModal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Thêm Lead mới">
        <div className="space-y-3">
          {[
            ['fullName', 'Họ tên *'],
            ['phone', 'Số điện thoại'],
            ['email', 'Email'],
            ['companyName', 'Công ty'],
            ['source', 'Nguồn (Facebook / Referral / Web / …)'],
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

// ============================================================
// Score badge — color theo ngưỡng: >=80 xanh, 50-79 amber, <50 xám
// ============================================================
function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 80
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : score >= 50
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-neutral-100 text-neutral-600 border-neutral-200'
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-full text-xs font-bold tabular-nums border ${cls}`}
      title={
        score >= 80
          ? 'Hot lead — nên contact ngay'
          : score >= 50
            ? 'Warm lead — nurture'
            : 'Cold lead — cần thêm data'
      }
    >
      {score}
    </span>
  )
}

