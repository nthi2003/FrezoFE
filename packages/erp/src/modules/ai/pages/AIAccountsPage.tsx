import { useMemo, useState } from 'react'
import { useAccounts, useAddAccount } from '../hooks/useAI'
import {
  Button, Input, AppModal, PageHeader, EmptyState, ErrorState, Label, Select,
} from '@frezo/ui'
import { Plus, User, Eye, EyeOff, Search, HelpCircle } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'

export function AIAccountsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [proxy, setProxy] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  const { data, isLoading, isError, isFetching, refetch } = useAccounts()
  const addReq = useAddAccount()

  const accounts = useMemo(
    () => (Array.isArray(data?.accounts) ? data.accounts : []),
    [data],
  )

  const filtered = useMemo(() => {
    let rows = accounts
    if (statusFilter === 'ACTIVE') rows = rows.filter((a: any) => a.is_active)
    if (statusFilter === 'INACTIVE') rows = rows.filter((a: any) => !a.is_active)
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter((a: any) =>
        (a.email || '').toLowerCase().includes(q) ||
        (a.proxy || '').toLowerCase().includes(q),
      )
    }
    return rows
  }, [accounts, search, statusFilter])

  const hasFilter = !!search.trim() || statusFilter !== 'ALL'
  const isFullyEmpty = !isLoading && !isError && accounts.length === 0
  const isFilteredEmpty = !isLoading && !isError && accounts.length > 0 && filtered.length === 0

  const handleAdd = () => {
    if (!email.trim() || !password.trim()) return
    addReq.mutate(
      { email: email.trim(), password: password.trim(), proxy: proxy.trim() },
      { onSuccess: () => { setModalOpen(false); setEmail(''); setPassword(''); setProxy('') } },
    )
  }

  const columns: AppTableColumn<any>[] = [
    {
      key: 'email',
      title: 'Email / SĐT',
      render: (_, a) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-neutral-400" />
          <span className="font-medium">{a.email}</span>
        </div>
      ),
    },
    {
      key: 'proxy',
      title: 'Proxy',
      render: (_, a) => <span className="text-sm text-neutral-500">{a.proxy || '—'}</span>,
    },
    {
      key: 'posts_today',
      title: 'Bài đã đăng',
      align: 'center',
      render: (_, a) => <span className="tabular-nums text-sm">{a.posts_today ?? 0}</span>,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      render: (_, a) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
            a.is_active
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : 'text-rose-700 bg-rose-50 border-rose-200'
          }`}
        >
          {a.is_active ? 'Hoạt động' : 'Tạm khoá'}
        </span>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Tài khoản Facebook (AI)"
        description="Quản lý tài khoản clone/via dùng cho automation AI."
        actions={
          <Button onClick={() => setModalOpen(true)} className="bg-primary-600 hover:bg-primary-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Thêm tài khoản
          </Button>
        }
      />

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => { setSearch(''); setStatusFilter('ALL') }}
        countLabel={`${filtered.length} tài khoản${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="min-w-[150px]">
          <Select
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Hoạt động' },
              { value: 'INACTIVE', label: 'Tạm khoá' },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
            placeholder="Trạng thái"
            aria-label="Lọc trạng thái"
            showSearch={false}
          />
        </div>
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm email hoặc proxy…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm tài khoản"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được tài khoản"
            message="Kiểm tra kết nối AI service rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={User}
            title={isFilteredEmpty ? 'Không có tài khoản khớp bộ lọc' : 'Chưa có tài khoản nào'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi trạng thái.'
                : 'Thêm tài khoản Facebook để bắt đầu automation.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: () => { setSearch(''); setStatusFilter('ALL') } }
                : { label: 'Thêm tài khoản', onClick: () => setModalOpen(true) }
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
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={() => void refetch()}
          getRowId={(r) => String(r.email)}
        />
      )}

      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Thêm tài khoản Facebook">
        <div className="space-y-4">
          <div>
            <Label>Email / SĐT</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <Label>Mật khẩu</Label>
            <div className="relative">
              <Input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                title={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <Label className="inline-flex items-center gap-1">
              Proxy (tuỳ chọn)
              <span title="Định dạng: user:pass@ip:port">
                <HelpCircle size={12} className="text-neutral-400" />
              </span>
            </Label>
            <Input value={proxy} onChange={(e) => setProxy(e.target.value)} placeholder="user:pass@ip:port" />
          </div>
          <Button
            onClick={handleAdd}
            disabled={addReq.isPending || !email || !password}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white"
          >
            {addReq.isPending ? 'Đang thêm…' : 'Thêm tài khoản'}
          </Button>
        </div>
      </AppModal>
    </div>
  )
}
