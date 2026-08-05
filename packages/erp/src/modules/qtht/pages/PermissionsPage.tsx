import { useMemo, useState } from 'react'
import { Plus, Search, Shield } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  AppModal, Button, ConfirmDialog, EmptyState, ErrorState,
  PageHeader, PageGuideButton, RowActions, type PageGuideConfig,
} from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { usePermissions, useCreatePermission, useDeletePermission } from '../hooks/useQtht'
import { orgSchema } from '../constants/schema'

const PERMISSIONS_GUIDE: PageGuideConfig = {
  title: 'Quản lý phân quyền',
  subtitle: 'Danh mục mã quyền dùng gắn vào vai trò — không tự cấp quyền cho user.',
  sections: [
    {
      heading: 'Cách dùng',
      type: 'steps',
      steps: [
        { title: 'Thêm mã quyền', description: 'Mã viết HOA, không dấu (VD: CREATE, VIEW). Tên hiển thị tiếng Việt.' },
        { title: 'Gắn vào vai trò', description: 'Sang Quản lý vai trò để chọn quyền cho từng role.' },
      ],
    },
    {
      heading: 'Lưu ý',
      type: 'notes',
      notes: 'Không xóa quyền đang được vai trò tham chiếu — kiểm tra trước khi xóa.',
    },
  ],
}

export function PermissionsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [confirmDel, setConfirmDel] = useState<{ id: string; name?: string; code?: string } | null>(null)

  const { data: rawData, isLoading, isError, isFetching, refetch } = usePermissions()
  const createReq = useCreatePermission()
  const deleteReq = useDeletePermission()

  const dataList = useMemo(
    () => (Array.isArray(rawData) ? rawData : []) as any[],
    [rawData],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return dataList
    return dataList.filter(
      (p) =>
        (p.code || '').toLowerCase().includes(q) ||
        (p.name || '').toLowerCase().includes(q),
    )
  }, [dataList, search])

  const hasFilter = !!search.trim()
  const isFilteredEmpty = !isLoading && !isError && dataList.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && dataList.length === 0

  const handleSubmit = (values: any) => {
    createReq.mutate(values, { onSuccess: () => setModalOpen(false) })
  }

  const handleDelete = () => {
    if (confirmDel?.id) {
      deleteReq.mutate(confirmDel.id, { onSuccess: () => setConfirmDel(null) })
    }
  }

  const columns: AppTableColumn<any>[] = [
    {
      key: 'code',
      title: 'Mã quyền',
      dataIndex: 'code',
      render: (_, row) => (
        <span className="font-mono text-xs font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
          {row.code}
        </span>
      ),
    },
    { key: 'name', title: 'Tên quyền', dataIndex: 'name' },
    {
      key: 'actions',
      title: 'Thao tác',
      dataIndex: 'id',
      width: 72,
      align: 'right',
      render: (_, row) => (
        <RowActions
          align="end"
          actions={[
            {
              kind: 'delete',
              tooltip: 'Xóa quyền',
              onClick: () => setConfirmDel({ id: row.id, name: row.name, code: row.code }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Quản lý phân quyền"
        description="Danh mục mã quyền hệ thống — dùng khi cấu hình vai trò."
        actions={(
          <div className="flex items-center gap-2">
            <PageGuideButton guide={PERMISSIONS_GUIDE} />
            <Button onClick={() => setModalOpen(true)} className="gap-2 bg-primary-600 hover:bg-primary-700 text-white h-9">
              <Plus size={16} /> Thêm mới
            </Button>
          </div>
        )}
      />

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => setSearch('')}
        countLabel={`${filtered.length} quyền${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm mã hoặc tên quyền…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm quyền"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được danh sách quyền"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Shield}
            title={isFilteredEmpty ? 'Không có quyền khớp bộ lọc' : 'Chưa có quyền nào'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi từ khoá tìm kiếm.'
                : 'Thêm mã quyền đầu tiên để gắn vào vai trò.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: () => setSearch('') }
                : { label: 'Thêm quyền', onClick: () => setModalOpen(true) }
            }
          />
        </div>
      ) : (
        <AppTable
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          pageSize={10}
          pageSizeOptions={[10]}
          onRefresh={() => void refetch()}
        />
      )}

      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Thêm quyền">
        <AppForm
          schema={orgSchema}
          defaultValues={{ code: '', name: '' }}
          onSubmit={handleSubmit}
          fields={[
            { name: 'code', label: 'Mã quyền', placeholder: 'VD: CREATE, VIEW', description: 'Viết HOA, không dấu' },
            { name: 'name', label: 'Tên quyền', placeholder: 'VD: Tạo mới, Xem' },
          ]}
          submitText="Lưu"
          isLoading={createReq.isPending}
        />
      </AppModal>

      <ConfirmDialog
        isOpen={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        title="Xóa quyền này?"
        message={`Quyền "${confirmDel?.name || confirmDel?.code || ''}" sẽ bị xóa.`}
        confirmText="Xóa"
        cancelText="Huỷ"
        variant="danger"
        isLoading={deleteReq.isPending}
      />
    </div>
  )
}
