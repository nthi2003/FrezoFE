import { useMemo, useState, type FormEvent } from 'react'
import { ChevronDown, ChevronRight, LayoutGrid, List, Plus, Search, Sparkles, Trash2 } from 'lucide-react'
import {
  Button,
  PageHeader,
  ConfirmDialog,
  AppModal,
  Label,
  Input,
  Select,
} from '@frezo/ui'
import {
  useAccounts, useCreateAccount, useDeleteAccount, useSeedCoa,
  useAccountingSetting,
} from '../hooks/useAccounting'
import type { Account, AccountType, AccountingStandard } from '../services/accountingApi'
import { usePermission } from '@/lib/hooks/usePermission'

const TYPE_LABEL: Record<AccountType, string> = {
  ASSET: 'Tài sản',
  LIABILITY: 'Nợ phải trả',
  EQUITY: 'Vốn CSH',
  REVENUE: 'Doanh thu',
  EXPENSE: 'Chi phí',
  CLEARING: 'Trung gian',
}

const TYPE_OPTIONS = (Object.keys(TYPE_LABEL) as AccountType[]).map((value) => ({
  value,
  label: TYPE_LABEL[value],
}))

const STANDARD_OPTIONS = [
  { value: 'TT133', label: 'TT133' },
  { value: 'TT99', label: 'TT99' },
]

const TYPE_TONE: Record<AccountType, string> = {
  ASSET: 'bg-success-light text-success-dark border-success/30',
  LIABILITY: 'bg-warning-light text-warning-dark border-warning/30',
  EQUITY: 'bg-info-light text-info-dark border-info/30',
  REVENUE: 'bg-primary-100 text-primary-800 border-primary-200',
  EXPENSE: 'bg-danger-light text-danger-dark border-danger/30',
  CLEARING: 'bg-neutral-100 text-neutral-700 border-neutral-200',
}

interface AccountFormState {
  code: string
  name: string
  type: AccountType | ''
  standard: AccountingStandard
  parentId: string
  level: number
  postable: boolean
  requiresPartner: boolean
  description: string
}

function guessTypeFromCode(code: string): AccountType {
  const first = code[0]
  if (first === '3') return 'LIABILITY'
  if (first === '4') return 'EQUITY'
  if (first === '5' || first === '7') return 'REVENUE'
  if (first === '6' || first === '8') return 'EXPENSE'
  if (first === '9') return 'CLEARING'
  return 'ASSET'
}

function emptyForm(standard: AccountingStandard): AccountFormState {
  return {
    code: '',
    name: '',
    type: '',
    standard,
    parentId: '',
    level: 1,
    postable: true,
    requiresPartner: false,
    description: '',
  }
}

// ============================================================
// Nhóm TK theo chữ số đầu (chuẩn TT133/TT99)
// ============================================================
const GROUP_META: Record<string, { label: string; tone: string }> = {
  '1': { label: 'Loại 1 · Tài sản ngắn hạn', tone: 'from-emerald-500 to-emerald-600' },
  '2': { label: 'Loại 2 · Tài sản dài hạn', tone: 'from-teal-500 to-teal-600' },
  '3': { label: 'Loại 3 · Nợ phải trả', tone: 'from-orange-500 to-orange-600' },
  '4': { label: 'Loại 4 · Vốn CSH', tone: 'from-blue-500 to-blue-600' },
  '5': { label: 'Loại 5 · Doanh thu', tone: 'from-purple-500 to-purple-600' },
  '6': { label: 'Loại 6 · Giá vốn / Chi phí SXKD', tone: 'from-rose-500 to-rose-600' },
  '7': { label: 'Loại 7 · Thu nhập khác', tone: 'from-fuchsia-500 to-fuchsia-600' },
  '8': { label: 'Loại 8 · Chi phí khác', tone: 'from-red-500 to-red-600' },
  '9': { label: 'Loại 9 · Xác định kết quả', tone: 'from-neutral-500 to-neutral-600' },
  '0': { label: 'Ngoài bảng / Trung gian', tone: 'from-neutral-400 to-neutral-500' },
}

type ViewMode = 'tree' | 'flat'

export function AccountsPage() {
  const { data: setting } = useAccountingSetting()
  const [filter, setFilter] = useState<AccountingStandard | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Account | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<AccountFormState>(() =>
    emptyForm((setting?.standard || 'TT133') as AccountingStandard),
  )
  const [formError, setFormError] = useState<string | null>(null)

  const stdFilter = filter === 'ALL' ? undefined : filter
  const { data: rows, isLoading } = useAccounts(stdFilter)
  const seedCoa = useSeedCoa()
  const del = useDeleteAccount()
  const create = useCreateAccount()
  const canCreate = usePermission('ACCOUNTING.ACCOUNTS.CREATE')
  const canDelete = usePermission('ACCOUNTING.ACCOUNTS.DELETE')

  const list = (rows as Account[]) ?? []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((a: Account) =>
      a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
  }, [list, search])

  const parentOptions = useMemo(
    () => [
      { value: '', label: '— Không có TK cha —' },
      ...list
        .slice()
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` })),
    ],
    [list],
  )

  // Group by first digit + sort by code
  const grouped = useMemo(() => {
    const map = new Map<string, Account[]>()
    filtered.forEach((a) => {
      const key = a.code?.[0] || '0'
      const arr = map.get(key) ?? []
      arr.push(a)
      map.set(key, arr)
    })
    const groups = Array.from(map.entries())
      .map(([key, items]) => ({
        key,
        meta: GROUP_META[key] ?? GROUP_META['0'],
        items: items.sort((a, b) => a.code.localeCompare(b.code)),
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
    return groups
  }, [filtered])

  const onSeed = () => {
    const std = setting?.standard || 'TT133'
    seedCoa.mutate(std as AccountingStandard)
  }

  const openCreateModal = () => {
    const std = (setting?.standard || 'TT133') as AccountingStandard
    setForm(emptyForm(std))
    setFormError(null)
    setModalOpen(true)
  }

  const patchForm = (patch: Partial<AccountFormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch }
      // Auto level từ độ dài số hiệu nếu user chưa chọn parent
      if (patch.code != null) {
        const code = patch.code.trim()
        next.level = code.length >= 4 ? 2 : 1
        if (!prev.type && code.length > 0) {
          next.type = guessTypeFromCode(code)
        }
      }
      if (patch.parentId != null) {
        const parent = list.find((a) => a.id === patch.parentId)
        if (parent) {
          next.level = Math.min(parent.level + 1, 5)
          if (!prev.type) next.type = parent.type
          if (!prev.standard) next.standard = parent.standard
        } else if (patch.parentId === '') {
          next.level = next.code.trim().length >= 4 ? 2 : 1
        }
      }
      return next
    })
  }

  const onSubmitCreate = (e: FormEvent) => {
    e.preventDefault()
    const code = form.code.trim()
    const name = form.name.trim()
    if (!code) {
      setFormError('Nhập số hiệu tài khoản')
      return
    }
    if (!name) {
      setFormError('Nhập tên tài khoản')
      return
    }
    if (!form.type) {
      setFormError('Chọn loại tài khoản')
      return
    }
    setFormError(null)
    create.mutate(
      {
        code,
        name,
        type: form.type,
        standard: form.standard,
        level: form.level,
        parentId: form.parentId || null,
        postable: form.postable,
        requiresPartner: form.requiresPartner,
        active: true,
        description: form.description.trim() || undefined,
      },
      {
        onSuccess: () => setModalOpen(false),
      },
    )
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Hệ thống tài khoản (COA)"
        description={`Chuẩn hiện tại: ${setting?.standard || '—'} · Tổng số TK: ${list.length}`}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
            placeholder="Tìm theo số hiệu hoặc tên…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 border rounded-md p-0.5 bg-white">
          {['ALL', 'TT133', 'TT99'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 text-sm rounded ${
                filter === f ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {f === 'ALL' ? 'Tất cả' : f}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 border rounded-md p-0.5 bg-white">
          <button
            onClick={() => setViewMode('tree')}
            title="Xem theo nhóm loại TK"
            className={`px-2.5 py-1.5 rounded ${
              viewMode === 'tree' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('flat')}
            title="Xem bảng phẳng"
            className={`px-2.5 py-1.5 rounded ${
              viewMode === 'flat' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <List size={14} />
          </button>
        </div>
        <div className="flex-1" />
        {canCreate && (
          <Button onClick={onSeed} variant="outline" className="gap-2" disabled={seedCoa.isPending}>
            <Sparkles size={16} /> Seed COA
          </Button>
        )}
        {canCreate && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus size={16} /> Thêm TK
          </Button>
        )}
      </div>

      {/* Loading / Empty */}
      {isLoading && (
        <div className="p-8 border rounded-lg bg-white text-center text-neutral-500">Đang tải…</div>
      )}
      {!isLoading && filtered.length === 0 && (
        <div className="p-8 border rounded-lg bg-white text-center text-neutral-500">
          Chưa có tài khoản nào. Bấm <b>Seed COA</b> để nạp bộ TK theo Thông tư.
        </div>
      )}

      {/* Tree grouped view */}
      {!isLoading && filtered.length > 0 && viewMode === 'tree' && (
        <div className="space-y-3">
          {grouped.map((g) => {
            const isCollapsed = !!collapsed[g.key]
            return (
              <div key={g.key} className="border rounded-lg bg-white overflow-hidden">
                <button
                  type="button"
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-white bg-gradient-to-r ${g.meta.tone} hover:opacity-95 transition`}
                  onClick={() => setCollapsed((prev) => ({ ...prev, [g.key]: !prev[g.key] }))}
                >
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  <span className="font-semibold text-sm">{g.meta.label}</span>
                  <span className="ml-auto text-[11px] font-medium bg-white/20 px-2 py-0.5 rounded-full">
                    {g.items.length} TK
                  </span>
                </button>
                {!isCollapsed && (
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                      <tr>
                        <th className="p-3 text-left font-medium w-24">Số hiệu</th>
                        <th className="p-3 text-left font-medium">Tên tài khoản</th>
                        <th className="p-3 text-left font-medium w-32">Loại</th>
                        <th className="p-3 text-center font-medium w-20">Cấp</th>
                        <th className="p-3 text-center font-medium w-24">Ghi sổ</th>
                        <th className="p-3 text-center font-medium w-24">Đối tượng</th>
                        <th className="p-3 text-right font-medium w-24">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {g.items.map((a) => (
                        <tr key={a.id} className="hover:bg-neutral-50">
                          <td
                            className="p-3 font-mono font-semibold text-neutral-900"
                            style={{ paddingLeft: 12 + Math.max(0, (a.level - 1) * 14) }}
                          >
                            {a.code}
                          </td>
                          <td className="p-3">
                            <div className="text-neutral-900">{a.name}</div>
                            {a.description && (
                              <div className="text-xs text-neutral-500 mt-0.5">{a.description}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${TYPE_TONE[a.type]}`}>
                              {TYPE_LABEL[a.type]}
                            </span>
                          </td>
                          <td className="p-3 text-center">{a.level}</td>
                          <td className="p-3 text-center">{a.postable ? '✓' : '—'}</td>
                          <td className="p-3 text-center">{a.requiresPartner ? '✓' : '—'}</td>
                          <td className="p-3 text-right">
                            {canDelete && (
                              <button
                                className="p-1.5 rounded hover:bg-red-50 text-red-600"
                                onClick={() => setConfirmDelete(a)}
                                title="Xoá TK"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Flat table view */}
      {!isLoading && filtered.length > 0 && viewMode === 'flat' && (
        <div className="overflow-x-auto border rounded-lg bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="p-3 text-left font-medium w-24">Số hiệu</th>
                <th className="p-3 text-left font-medium">Tên tài khoản</th>
                <th className="p-3 text-left font-medium w-32">Loại</th>
                <th className="p-3 text-center font-medium w-20">Cấp</th>
                <th className="p-3 text-center font-medium w-24">Ghi sổ</th>
                <th className="p-3 text-center font-medium w-24">Đối tượng</th>
                <th className="p-3 text-right font-medium w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((a: Account) => (
                <tr key={a.id} className="hover:bg-neutral-50">
                  <td className="p-3 font-mono font-semibold text-neutral-900">{a.code}</td>
                  <td className="p-3">
                    <div className="text-neutral-900">{a.name}</div>
                    {a.description && <div className="text-xs text-neutral-500 mt-0.5">{a.description}</div>}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${TYPE_TONE[a.type]}`}>
                      {TYPE_LABEL[a.type]}
                    </span>
                  </td>
                  <td className="p-3 text-center">{a.level}</td>
                  <td className="p-3 text-center">{a.postable ? '✓' : '—'}</td>
                  <td className="p-3 text-center">{a.requiresPartner ? '✓' : '—'}</td>
                  <td className="p-3 text-right">
                    {canDelete && (
                      <button
                        className="p-1.5 rounded hover:bg-red-50 text-red-600"
                        onClick={() => setConfirmDelete(a)}
                        title="Xoá TK"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Xoá tài khoản?"
        message={
          confirmDelete
            ? `TK ${confirmDelete.code} — ${confirmDelete.name}. TK có phát sinh sẽ không hiển thị nhưng lịch sử vẫn giữ.`
            : ''
        }
        onConfirm={() => {
          if (confirmDelete) {
            del.mutate(confirmDelete.id)
            setConfirmDelete(null)
          }
        }}
      />

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Thêm tài khoản"
        description="Nhập số hiệu, chọn loại và TK cha (nếu có)."
        maxWidth="lg"
      >
        <form onSubmit={onSubmitCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Số hiệu TK <span className="text-danger">*</span>
              </Label>
              <Input
                value={form.code}
                onChange={(e) => patchForm({ code: e.target.value })}
                placeholder="VD: 1112, 3388"
                className="font-mono"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Tên TK <span className="text-danger">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => patchForm({ name: e.target.value })}
                placeholder="VD: Tiền mặt VND"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Loại tài khoản <span className="text-danger">*</span>
              </Label>
              <Select
                options={TYPE_OPTIONS}
                value={form.type}
                onChange={(v) => patchForm({ type: (v as AccountType) || '' })}
                placeholder="Chọn loại TK"
                showSearch={false}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Chuẩn kế toán</Label>
              <Select
                options={STANDARD_OPTIONS}
                value={form.standard}
                onChange={(v) =>
                  patchForm({ standard: (v as AccountingStandard) || 'TT133' })
                }
                showSearch={false}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tài khoản cha</Label>
            <Select
              options={parentOptions}
              value={form.parentId}
              onChange={(v) => patchForm({ parentId: v || '' })}
              placeholder="Chọn TK cha (tuỳ chọn)"
              showSearch
              showClear
            />
            <p className="text-xs text-neutral-500">
              Chọn TK cha để gắn cấp con. Để trống nếu là TK gốc.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Cấp</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.level}
                onChange={(e) =>
                  patchForm({ level: Math.max(1, Math.min(5, Number(e.target.value) || 1)) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Input
                value={form.description}
                onChange={(e) => patchForm({ description: e.target.value })}
                placeholder="Tuỳ chọn"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="inline-flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.postable}
                onChange={(e) => patchForm({ postable: e.target.checked })}
                className="rounded border-border"
              />
              Cho phép ghi sổ
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.requiresPartner}
                onChange={(e) => patchForm({ requiresPartner: e.target.checked })}
                className="rounded border-border"
              />
              Bắt buộc đối tượng
            </label>
          </div>

          {formError && (
            <p className="text-xs text-danger-dark bg-danger-light border border-danger/20 rounded-md px-3 py-2">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Đang lưu…' : 'Thêm tài khoản'}
            </Button>
          </div>
        </form>
      </AppModal>
    </div>
  )
}
