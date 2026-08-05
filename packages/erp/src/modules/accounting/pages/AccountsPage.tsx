import { useMemo, useState, type FormEvent } from 'react'
import {
  BookOpen, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown,
  LayoutGrid, List, Plus, RefreshCw, Search, Sparkles, UserCheck, Wallet,
} from 'lucide-react'
import {
  Button,
  PageHeader,
  ConfirmDialog,
  AppModal,
  Label,
  Input,
  Select,
  EmptyState,
  ErrorState,
  PageGuideButton,
  AppTooltip,
  StatusBadge,
  RowActions,
} from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  useAccounts, useCreateAccount, useDeleteAccount, useSeedCoa,
  useAccountingSetting,
} from '../hooks/useAccounting'
import type { Account, AccountType, AccountingStandard } from '../services/accountingApi'
import { pageRootClass } from '../utils/pageEmbed'
import { usePermission } from '@/lib/hooks/usePermission'
import { ACCOUNTS_GUIDE } from '../constants/accounts.guide'

const TYPE_LABEL: Record<AccountType, string> = {
  ASSET: 'Tài sản',
  LIABILITY: 'Nợ phải trả',
  EQUITY: 'Vốn chủ sở hữu',
  REVENUE: 'Doanh thu',
  EXPENSE: 'Chi phí',
  CLEARING: 'Trung gian',
}

const TYPE_OPTIONS = (Object.keys(TYPE_LABEL) as AccountType[]).map((value) => ({
  value,
  label: TYPE_LABEL[value],
}))

const STANDARD_OPTIONS = [
  { value: 'TT133', label: 'Thông tư 133' },
  { value: 'TT99', label: 'Thông tư 99' },
]

const TYPE_TONE: Record<AccountType, string> = {
  ASSET: 'bg-success-light text-success-dark border-success/30',
  LIABILITY: 'bg-warning-light text-warning-dark border-warning/30',
  EQUITY: 'bg-info-light text-info-dark border-info/30',
  REVENUE: 'bg-primary-100 text-primary-800 border-primary-200',
  EXPENSE: 'bg-danger-light text-danger-dark border-danger/30',
  CLEARING: 'bg-neutral-100 text-neutral-700 border-neutral-200',
}

type PostableFilter = 'ALL' | 'POSTABLE' | 'NON_POSTABLE'
type ViewMode = 'tree' | 'flat'

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

const GROUP_META: Record<string, { label: string; accent: string }> = {
  '1': { label: 'Loại 1 · Tài sản ngắn hạn', accent: 'border-l-success' },
  '2': { label: 'Loại 2 · Tài sản dài hạn', accent: 'border-l-success' },
  '3': { label: 'Loại 3 · Nợ phải trả', accent: 'border-l-warning' },
  '4': { label: 'Loại 4 · Vốn chủ sở hữu', accent: 'border-l-info' },
  '5': { label: 'Loại 5 · Doanh thu', accent: 'border-l-primary-500' },
  '6': { label: 'Loại 6 · Giá vốn / Chi phí sản xuất kinh doanh', accent: 'border-l-danger' },
  '7': { label: 'Loại 7 · Thu nhập khác', accent: 'border-l-primary-500' },
  '8': { label: 'Loại 8 · Chi phí khác', accent: 'border-l-danger' },
  '9': { label: 'Loại 9 · Xác định kết quả', accent: 'border-l-neutral-500' },
  '0': { label: 'Ngoài bảng / Trung gian', accent: 'border-l-neutral-400' },
}

function TypeBadge({ type }: { type: AccountType }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${TYPE_TONE[type]}`}>
      {TYPE_LABEL[type]}
    </span>
  )
}

function PostableBadge({ postable }: { postable: boolean }) {
  if (postable) {
    return (
      <StatusBadge label="Ghi sổ được" color="success" icon={BookOpen} />
    )
  }
  return (
    <StatusBadge label="Tổng hợp" color="neutral" />
  )
}

function PartnerBadge({ requiresPartner }: { requiresPartner: boolean }) {
  if (requiresPartner) {
    return (
      <StatusBadge label="Bắt buộc đối tượng" color="info" icon={UserCheck} />
    )
  }
  return <span className="text-xs text-neutral-400">—</span>
}

function AccountNameCell({ account }: { account: Account }) {
  return (
    <div>
      <div className="text-neutral-900">{account.name}</div>
      {account.description && (
        <div className="text-xs text-neutral-500 mt-0.5">{account.description}</div>
      )}
    </div>
  )
}

function AccountCodeCell({ account, indent = false }: { account: Account; indent?: boolean }) {
  const pad = indent ? 12 + Math.max(0, (account.level - 1) * 16) : undefined
  return (
    <div className="flex items-center gap-1.5 min-w-0" style={pad != null ? { paddingLeft: pad } : undefined}>
      {indent && account.level > 1 && (
        <span className="text-neutral-300 shrink-0" aria-hidden="true">
          └
        </span>
      )}
      <span className="font-mono font-semibold text-primary-700">{account.code}</span>
    </div>
  )
}

export function AccountsPage({ embedded }: { embedded?: boolean } = {}) {
  const { data: setting } = useAccountingSetting()
  const [filter, setFilter] = useState<AccountingStandard | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<AccountType | 'ALL'>('ALL')
  const [postableFilter, setPostableFilter] = useState<PostableFilter>('ALL')
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
  const {
    data: rows,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAccounts(stdFilter)
  const seedCoa = useSeedCoa()
  const del = useDeleteAccount()
  const create = useCreateAccount()
  const canCreate = usePermission('ACCOUNTING.ACCOUNTS.CREATE')
  const canDelete = usePermission('ACCOUNTING.ACCOUNTS.DELETE')

  const list = (rows as Account[]) ?? []

  const filtered = useMemo(() => {
    let result = list
    if (typeFilter !== 'ALL') {
      result = result.filter((a) => a.type === typeFilter)
    }
    if (postableFilter === 'POSTABLE') {
      result = result.filter((a) => a.postable)
    } else if (postableFilter === 'NON_POSTABLE') {
      result = result.filter((a) => !a.postable)
    }
    const q = search.trim().toLowerCase()
    if (!q) return result
    return result.filter((a: Account) =>
      a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
  }, [list, search, typeFilter, postableFilter])

  const hasActiveFilters =
    !!search.trim()
    || filter !== 'ALL'
    || typeFilter !== 'ALL'
    || postableFilter !== 'ALL'

  const clearFilters = () => {
    setSearch('')
    setFilter('ALL')
    setTypeFilter('ALL')
    setPostableFilter('ALL')
  }

  const isFilteredEmpty = !isLoading && !isError && list.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && list.length === 0

  const errMsg =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    || (error as Error)?.message
    || 'Không tải được danh sách tài khoản.'

  const parentOptions = useMemo(
    () => [
      { value: '', label: '— Không có tài khoản cha —' },
      ...list
        .slice()
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` })),
    ],
    [list],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, Account[]>()
    filtered.forEach((a) => {
      const key = a.code?.[0] || '0'
      const arr = map.get(key) ?? []
      arr.push(a)
      map.set(key, arr)
    })
    return Array.from(map.entries())
      .map(([key, items]) => ({
        key,
        meta: GROUP_META[key] ?? GROUP_META['0'],
        items: items.sort((a, b) => a.code.localeCompare(b.code)),
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [filtered])

  const expandAllGroups = () => setCollapsed({})
  const collapseAllGroups = () => {
    const next: Record<string, boolean> = {}
    grouped.forEach((g) => { next[g.key] = true })
    setCollapsed(next)
  }

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
      if (patch.code != null) {
        const c = patch.code.trim()
        next.level = c.length >= 4 ? 2 : 1
        if (!prev.type && c.length > 0) {
          next.type = guessTypeFromCode(c)
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
    const c = form.code.trim()
    const name = form.name.trim()
    if (!c) {
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
        code: c,
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
      { onSuccess: () => setModalOpen(false) },
    )
  }

  const renderDeleteAction = (account: Account) => (
    <RowActions
      align="end"
      actions={[
        {
          kind: 'delete',
          tooltip: 'Xoá tài khoản',
          hidden: !canDelete,
          onClick: () => setConfirmDelete(account),
        },
      ]}
    />
  )

  const columns: AppTableColumn<Account>[] = [
    {
      key: 'code',
      title: 'Số hiệu',
      width: 120,
      render: (_, a) => <AccountCodeCell account={a} indent />,
    },
    {
      key: 'name',
      title: 'Tên tài khoản',
      render: (_, a) => <AccountNameCell account={a} />,
    },
    {
      key: 'type',
      title: 'Loại',
      width: 140,
      render: (_, a) => <TypeBadge type={a.type} />,
    },
    {
      key: 'level',
      title: 'Cấp',
      align: 'center',
      width: 56,
      render: (_, a) => <span className="tabular-nums">{a.level}</span>,
    },
    {
      key: 'postable',
      title: 'Ghi sổ',
      align: 'center',
      width: 120,
      render: (_, a) => <PostableBadge postable={a.postable} />,
    },
    {
      key: 'requiresPartner',
      title: 'Đối tượng',
      align: 'center',
      width: 160,
      render: (_, a) => <PartnerBadge requiresPartner={a.requiresPartner} />,
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 56,
      render: (_, a) => renderDeleteAction(a),
    },
  ]

  return (
    <div className={pageRootClass(embedded)}>
      {!embedded && (
      <PageHeader
        title="Hệ thống tài khoản"
        description={`Chuẩn hiện tại: ${setting?.standard || '—'} · Tổng số: ${list.length} tài khoản`}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <PageGuideButton guide={ACCOUNTS_GUIDE} />
            {canCreate && (
              <>
                <Button
                  onClick={onSeed}
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9"
                  disabled={seedCoa.isPending}
                >
                  <Sparkles size={14} />
                  Nạp danh mục mẫu
                </Button>
                <Button onClick={openCreateModal} size="sm" className="gap-2 h-9">
                  <Plus size={14} />
                  Thêm tài khoản
                </Button>
              </>
            )}
          </div>
        )}
      />
      )}

      <FilterBar
        selects={[
          {
            id: 'standard',
            label: 'Chuẩn kế toán',
            value: filter,
            onChange: (v) => setFilter(v as AccountingStandard | 'ALL'),
            options: [
              { value: 'ALL', label: 'Tất cả chuẩn' },
              { value: 'TT133', label: 'Thông tư 133' },
              { value: 'TT99', label: 'Thông tư 99' },
            ],
            minWidth: '150px',
          },
          {
            id: 'type',
            label: 'Loại tài khoản',
            value: typeFilter,
            onChange: (v) => setTypeFilter(v as AccountType | 'ALL'),
            options: [
              { value: 'ALL', label: 'Tất cả loại' },
              ...TYPE_OPTIONS,
            ],
            minWidth: '160px',
          },
          {
            id: 'postable',
            label: 'Ghi sổ',
            value: postableFilter,
            onChange: (v) => setPostableFilter(v as PostableFilter),
            options: [
              { value: 'ALL', label: 'Tất cả' },
              { value: 'POSTABLE', label: 'Được ghi sổ' },
              { value: 'NON_POSTABLE', label: 'Tài khoản tổng hợp' },
            ],
            minWidth: '170px',
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
        countLabel={`${filtered.length} tài khoản${hasActiveFilters ? ' (đã lọc)' : ''}`}
        extra={(
          <>
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
                placeholder="Tìm theo số hiệu hoặc tên…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Tìm tài khoản"
              />
            </div>
            <div className="inline-flex items-center rounded-md border bg-white p-0.5">
              <AppTooltip content="Xem theo nhóm loại tài khoản">
                <button
                  type="button"
                  onClick={() => setViewMode('tree')}
                  className={`h-8 px-2.5 rounded text-xs font-medium inline-flex items-center gap-1 ${
                    viewMode === 'tree'
                      ? 'bg-neutral-100 text-primary-700'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  aria-label="Xem theo nhóm"
                  aria-pressed={viewMode === 'tree'}
                >
                  <LayoutGrid size={13} />
                  <span className="hidden sm:inline">Nhóm</span>
                </button>
              </AppTooltip>
              <AppTooltip content="Xem bảng phẳng có phân trang">
                <button
                  type="button"
                  onClick={() => setViewMode('flat')}
                  className={`h-8 px-2.5 rounded text-xs font-medium inline-flex items-center gap-1 ${
                    viewMode === 'flat'
                      ? 'bg-neutral-100 text-primary-700'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  aria-label="Xem bảng"
                  aria-pressed={viewMode === 'flat'}
                >
                  <List size={13} />
                  <span className="hidden sm:inline">Bảng</span>
                </button>
              </AppTooltip>
            </div>
            {viewMode === 'tree' && grouped.length > 0 && (
              <>
                <AppTooltip content="Mở rộng tất cả nhóm">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2"
                    onClick={expandAllGroups}
                    aria-label="Mở rộng tất cả nhóm"
                  >
                    <ChevronsDownUp size={14} />
                  </Button>
                </AppTooltip>
                <AppTooltip content="Thu gọn tất cả nhóm">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2"
                    onClick={collapseAllGroups}
                    aria-label="Thu gọn tất cả nhóm"
                  >
                    <ChevronsUpDown size={14} />
                  </Button>
                </AppTooltip>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="gap-2 h-9"
              disabled={isFetching}
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
          </>
        )}
      />

      {isError && (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được danh sách tài khoản"
            message={errMsg}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      )}

      {!isError && (isFullyEmpty || isFilteredEmpty) && (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Wallet}
            title={isFilteredEmpty ? 'Không có tài khoản khớp bộ lọc' : 'Chưa có tài khoản nào'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi từ khoá tìm kiếm / loại tài khoản.'
                : 'Bấm "Nạp danh mục mẫu" để nạp bộ tài khoản theo Thông tư, hoặc thêm tài khoản thủ công.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: clearFilters }
                : canCreate
                  ? { label: 'Nạp danh mục mẫu', onClick: onSeed }
                  : { label: 'Làm mới', onClick: () => void refetch() }
            }
          />
        </div>
      )}

      {!isError && !isFullyEmpty && !isFilteredEmpty && viewMode === 'tree' && (
        <div className="space-y-3">
          {grouped.map((g) => {
            const isCollapsed = !!collapsed[g.key]
            return (
              <div key={g.key} className="border rounded-lg bg-white overflow-hidden">
                <button
                  type="button"
                  className={`w-full flex items-center gap-2 px-4 py-2.5 bg-neutral-50 border-l-4 ${g.meta.accent} hover:bg-neutral-100 transition text-left`}
                  onClick={() => setCollapsed((prev) => ({ ...prev, [g.key]: !prev[g.key] }))}
                  aria-expanded={!isCollapsed}
                >
                  {isCollapsed ? (
                    <ChevronRight size={14} className="text-neutral-500 shrink-0" />
                  ) : (
                    <ChevronDown size={14} className="text-neutral-500 shrink-0" />
                  )}
                  <span className="font-semibold text-sm text-neutral-900">{g.meta.label}</span>
                  <span className="ml-auto text-[11px] font-medium text-neutral-500 bg-neutral-200/60 px-2 py-0.5 rounded-full tabular-nums">
                    {g.items.length} tài khoản
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50 text-neutral-600 border-t border-neutral-100">
                        <tr>
                          <th className="p-2.5 text-left font-medium w-28">Số hiệu</th>
                          <th className="p-2.5 text-left font-medium">Tên tài khoản</th>
                          <th className="p-2.5 text-left font-medium w-36 hidden md:table-cell">Loại</th>
                          <th className="p-2.5 text-center font-medium w-14">Cấp</th>
                          <th className="p-2.5 text-center font-medium w-28 hidden sm:table-cell">Ghi sổ</th>
                          <th className="p-2.5 text-center font-medium w-36 hidden lg:table-cell">Đối tượng</th>
                          <th className="p-2.5 text-right font-medium w-14">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {g.items.map((a) => (
                          <tr key={a.id} className="hover:bg-neutral-50">
                            <td className="p-2.5">
                              <AccountCodeCell account={a} indent />
                            </td>
                            <td className="p-2.5">
                              <AccountNameCell account={a} />
                            </td>
                            <td className="p-2.5 hidden md:table-cell">
                              <TypeBadge type={a.type} />
                            </td>
                            <td className="p-2.5 text-center tabular-nums">{a.level}</td>
                            <td className="p-2.5 text-center hidden sm:table-cell">
                              <PostableBadge postable={a.postable} />
                            </td>
                            <td className="p-2.5 text-center hidden lg:table-cell">
                              <PartnerBadge requiresPartner={a.requiresPartner} />
                            </td>
                            <td className="p-2.5 text-right">{renderDeleteAction(a)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!isError && !isFullyEmpty && !isFilteredEmpty && viewMode === 'flat' && (
        <AppTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={() => void refetch()}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Xoá tài khoản?"
        message={
          confirmDelete
            ? `${confirmDelete.code} — ${confirmDelete.name}. Tài khoản có phát sinh sẽ không hiển thị nhưng lịch sử vẫn giữ.`
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
        description="Nhập số hiệu, chọn loại và tài khoản cha (nếu có)."
        maxWidth="2xl"
      >
        <form onSubmit={onSubmitCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Số hiệu tài khoản <span className="text-danger">*</span>
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
                Tên tài khoản <span className="text-danger">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => patchForm({ name: e.target.value })}
                placeholder="VD: Tiền mặt VND"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Loại tài khoản <span className="text-danger">*</span>
              </Label>
              <Select
                options={TYPE_OPTIONS}
                value={form.type}
                onChange={(v) => patchForm({ type: (v as AccountType) || '' })}
                placeholder="Chọn loại tài khoản"
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
              placeholder="Chọn tài khoản cha (tuỳ chọn)"
              showSearch
              showClear
            />
            <p className="text-xs text-neutral-500">
              Chọn tài khoản cha để gắn cấp con. Để trống nếu là tài khoản gốc.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
