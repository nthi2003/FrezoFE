import { useMemo, useState } from 'react'
import { Plus, Loader2, Search, HelpCircle, UserRound } from 'lucide-react'
import {
  AppModal, Button, Input, PageHeader, EmptyState, ErrorState, Label, Select, RowActions,
} from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { FacebookIcon } from '@/components/shared/FacebookIcon'
import {
  useFbAccounts, useCreateFbAccount, useUpdateFbAccount, useDeleteFbAccount,
} from '../hooks/useFbAutomation'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Tạm khoá',
}

export function FbAccountsPage() {
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [formStatus, setFormStatus] = useState('ACTIVE')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  const { data: accounts, isLoading, isError, isFetching, refetch } = useFbAccounts()
  const createReq = useCreateFbAccount()
  const updateReq = useUpdateFbAccount()
  const deleteReq = useDeleteFbAccount()

  const list = useMemo(() => (Array.isArray(accounts) ? accounts : []), [accounts])

  const filtered = useMemo(() => {
    let rows = list
    if (statusFilter !== 'ALL') {
      rows = rows.filter((a: any) => a.status === statusFilter)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter((a: any) =>
        (a.username || '').toLowerCase().includes(q) ||
        (a.proxyIp || '').toLowerCase().includes(q),
      )
    }
    return rows
  }, [list, search, statusFilter])

  const hasFilter = !!search.trim() || statusFilter !== 'ALL'
  const isFullyEmpty = !isLoading && !isError && list.length === 0
  const isFilteredEmpty = !isLoading && !isError && list.length > 0 && filtered.length === 0

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      username: form.get('username') as string,
      password: form.get('password') as string,
      proxyIp: form.get('proxyIp') as string,
      userAgent: form.get('userAgent') as string,
      status: formStatus || 'ACTIVE',
    }
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(data, { onSuccess: () => setModalOpen(false) })
    }
  }

  const columns: AppTableColumn<any>[] = [
    {
      key: 'username',
      title: 'Tên đăng nhập',
      render: (_, acc) => (
        <span className="font-medium text-neutral-900">{acc.username}</span>
      ),
    },
    {
      key: 'proxyIp',
      title: 'Proxy',
      render: (_, acc) => (
        <span className="text-sm text-neutral-500">{acc.proxyIp || 'Không có'}</span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      render: (_, acc) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
            acc.status === 'ACTIVE'
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : 'text-rose-700 bg-rose-50 border-rose-200'
          }`}
        >
          {STATUS_LABEL[acc.status] || acc.status}
        </span>
      ),
    },
    {
      key: 'postsToday',
      title: 'Bài hôm nay',
      align: 'center',
      render: (_, acc) => (
        <span className="tabular-nums text-sm text-neutral-600">{acc.postsToday || 0}</span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: 120,
      render: (_, acc) => (
        <RowActions
          align="end"
          actions={[
            {
              kind: 'edit',
              tooltip: 'Sửa tài khoản',
              onClick: () => { setSelectedItem(acc); setFormStatus(acc.status || 'ACTIVE'); setModalOpen(true) },
            },
            {
              kind: 'delete',
              tooltip: 'Xoá tài khoản',
              onClick: () =>
                askConfirm({
                  title: 'Xoá tài khoản này?',
                  message: `Tài khoản "${acc.username}" sẽ bị xoá.`,
                  confirmText: 'Xoá',
                  onConfirm: () => deleteReq.mutate(acc.id),
                }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <FacebookIcon className="w-6 h-6 text-blue-600" />
            Tài khoản Facebook
          </span>
        }
        description="Quản lý tài khoản + proxy dùng cho automation quét group và đăng bài."
        actions={
          <Button
            onClick={() => { setSelectedItem(null); setFormStatus('ACTIVE'); setModalOpen(true) }}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
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
            onChange={(v) => setStatusFilter(v as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            placeholder="Trạng thái"
            aria-label="Lọc trạng thái"
            showSearch={false}
          />
        </div>
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm tên đăng nhập hoặc proxy…"
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
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={UserRound}
            title={isFilteredEmpty ? 'Không có tài khoản khớp bộ lọc' : 'Chưa có tài khoản nào'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi trạng thái.'
                : 'Thêm tài khoản Facebook (kèm proxy nếu có) để bắt đầu automation.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: () => { setSearch(''); setStatusFilter('ALL') } }
                : { label: 'Thêm tài khoản', onClick: () => { setSelectedItem(null); setFormStatus('ACTIVE'); setModalOpen(true) } }
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
          getRowId={(r) => String(r.id)}
        />
      )}

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedItem ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="inline-flex items-center gap-1">
              Tên đăng nhập
              <span title="Email hoặc SĐT Facebook">
                <HelpCircle size={12} className="text-neutral-400" />
              </span>
            </Label>
            <Input
              name="username"
              defaultValue={selectedItem?.username || ''}
              required
              placeholder="Email hoặc SĐT Facebook"
            />
          </div>
          <div>
            <Label>Mật khẩu</Label>
            <Input
              name="password"
              type="password"
              defaultValue={selectedItem?.password || ''}
              required
              placeholder="Mật khẩu"
            />
          </div>
          <div>
            <Label className="inline-flex items-center gap-1">
              Proxy IP (tuỳ chọn)
              <span title="VD: http://user:pass@1.2.3.4:8080">
                <HelpCircle size={12} className="text-neutral-400" />
              </span>
            </Label>
            <Input
              name="proxyIp"
              defaultValue={selectedItem?.proxyIp || ''}
              placeholder="VD: http://user:pass@1.2.3.4:8080"
            />
          </div>
          <div>
            <Label>User Agent (tuỳ chọn)</Label>
            <Input
              name="userAgent"
              defaultValue={selectedItem?.userAgent || ''}
              placeholder="Để trống để dùng mặc định"
            />
          </div>
          <div>
            <Label>Trạng thái</Label>
            <Select
              options={[
                { value: 'ACTIVE', label: 'Hoạt động' },
                { value: 'INACTIVE', label: 'Tạm khoá' },
              ]}
              value={formStatus}
              onChange={setFormStatus}
              placeholder="Trạng thái"
              aria-label="Trạng thái tài khoản"
              showSearch={false}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Huỷ</Button>
            <Button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white"
              disabled={createReq.isPending || updateReq.isPending}
            >
              {createReq.isPending || updateReq.isPending
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : null}
              {selectedItem ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </AppModal>
      {confirmDialog}
    </div>
  )
}
