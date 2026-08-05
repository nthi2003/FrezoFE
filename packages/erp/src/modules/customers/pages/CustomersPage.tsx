import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Pencil, Trash2, Users, Phone, Mail, Search,
  Eye, EyeOff, Sparkles, Download, Building2, User, Loader2,
  Radar, FileDown, RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppTable } from '@/components/ui/AppTable'
import type { BulkAction } from '@/components/ui/AppTable/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { AppModal, PageHeader, PageGuideButton, ConfirmDialog, EmptyState, ErrorState, RowActions } from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@frezo/ui'
import {
  useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer,
  useUploadCustomerAvatar,
} from '../hooks/useCustomer'
import { customerApi } from '../services/customerApi'
import { customerFormSchema, type CustomerFormValues } from '../constants/schema'
import { CUSTOMERS_GUIDE } from '../constants/customers.guide'
import { CustomerAvatar } from '../components/CustomerAvatar'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { downloadCsv } from '@/lib/export/toCsv'
import { usePermission } from '@/lib/hooks/usePermission'

export function CustomersPage() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const canRevealPhone = usePermission('CUSTOMER.REVEAL_PHONE')
  const canExport = usePermission('CUSTOMER.EXPORT')
  const canDelete = usePermission('CUSTOMER.DELETE')
  // Create: menu đã gate trang — hiện nút; Delete ẩn nếu thiếu quyền (admin bypass).
  const showDelete = canDelete
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<any[] | null>(null)

  // Filters
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'individual' | 'company' | 'noContact'>('all')

  // Reveal-phone state (per customer)
  const [revealed, setRevealed] = useState<Record<string, string>>({})

  const { data: rawData, isLoading, isError, refetch, isFetching } = useCustomers()
  const createReq = useCreateCustomer()
  const updateReq = useUpdateCustomer()
  const deleteReq = useDeleteCustomer()
  const uploadAvatarReq = useUploadCustomerAvatar()

  const aiSyncReq = useMutation({
    mutationFn: () => customerApi.aiSync(),
    onSuccess: (res: any) => {
      const count = res?.data?.count ?? 0
      toast.success(`AI đồng bộ thành công${count ? ` — ${count} khách hàng mới` : ''}`)
    },
    onError: () => toast.error('Đồng bộ AI thất bại — kiểm tra kết nối Facebook'),
  })

  const exportReq = useMutation({
    mutationFn: () => customerApi.export(),
    onSuccess: () => toast.success('Đã xuất file — kiểm tra thư mục Tải xuống'),
    onError: () => toast.error('Xuất file thất bại'),
  })

  const revealPhoneReq = useMutation({
    mutationFn: (id: string) => customerApi.revealPhone(id),
    onSuccess: (res: any, id: string) => {
      const phone = res?.data?.phone ?? res?.data ?? ''
      if (phone) {
        setRevealed((prev) => ({ ...prev, [id]: phone }))
      } else {
        toast.error('Không lấy được số — có thể khách chưa có SĐT')
      }
    },
    onError: () => toast.error('Không có quyền xem SĐT đầy đủ'),
  })

  const dataList: any[] = Array.isArray(rawData) ? rawData : []

  // ---- Client-side filter ----
  const filteredList = useMemo(() => {
    let list = dataList
    if (typeFilter === 'individual') {
      list = list.filter((c) => (c.type || 'INDIVIDUAL') === 'INDIVIDUAL')
    }
    if (typeFilter === 'company') {
      list = list.filter((c) => c.type === 'COMPANY' || c.taxCode)
    }
    if (typeFilter === 'noContact') {
      list = list.filter((c) => !c.phone && !c.email)
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim()
      list = list.filter((c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.taxCode || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [dataList, typeFilter, searchText])

  const stats = useMemo(() => {
    const total = dataList.length
    const company = dataList.filter((c) => c.type === 'COMPANY' || c.taxCode).length
    const individual = total - company
    const withPhone = dataList.filter((c) => c.phone).length
    const withEmail = dataList.filter((c) => c.email).length
    return { total, individual, company, withPhone, withEmail }
  }, [dataList])

  // ---- Handlers ----
  const handleSubmit = (values: CustomerFormValues) => {
    if (selectedItem?.id) {
      updateReq.mutate(
        { id: selectedItem.id, data: values },
        { onSuccess: () => setModalOpen(false) },
      )
    } else {
      createReq.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    deleteReq.mutate(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
      onError: () => setConfirmDelete(null),
    })
  }

  const openEdit = (item: any) => {
    setSelectedItem(item)
    setModalOpen(true)
  }

  const openDetail = (item: any) => {
    setSelectedItem(item)
    setDetailModalOpen(true)
  }

  const openCreate = () => {
    setSelectedItem(null)
    setModalOpen(true)
  }

  const toggleReveal = (customer: any) => {
    if (revealed[customer.id]) {
      setRevealed((prev) => {
        const next = { ...prev }
        delete next[customer.id]
        return next
      })
    } else {
      revealPhoneReq.mutate(customer.id)
    }
  }

  const clearFilters = () => {
    setSearchText('')
    setTypeFilter('all')
  }

  const hasFilter = !!searchText.trim() || typeFilter !== 'all'

  // ---- Bulk actions ----
  const exportCustomersCsv = (rows: any[]) => {
    if (rows.length === 0) return
    downloadCsv(
      `khach-hang-${new Date().toISOString().slice(0, 10)}`,
      rows,
      [
        { header: 'Tên khách hàng', accessor: 'name' },
        {
          header: 'Loại',
          accessor: (r) =>
            r.type === 'COMPANY' || r.taxCode ? 'Doanh nghiệp' : 'Cá nhân',
        },
        { header: 'Số điện thoại', accessor: 'phone' },
        { header: 'Email', accessor: 'email' },
        { header: 'Mã số thuế', accessor: 'taxCode' },
        { header: 'Địa chỉ', accessor: 'address' },
        { header: 'Ghi chú', accessor: 'note' },
        {
          header: 'Ngày tạo',
          accessor: 'createdDate',
          format: (v) =>
            v ? new Date(String(v)).toLocaleDateString('vi-VN') : '',
        },
      ],
    )
    toast.success(`Đã xuất ${rows.length} khách hàng ra CSV`)
  }

  const bulkDeleteCustomers = async (rows: any[]) => {
    const results = await Promise.allSettled(
      rows.map((r) => customerApi.delete(r.id)),
    )
    const ok = results.filter((r) => r.status === 'fulfilled').length
    const fail = results.length - ok
    if (ok > 0) toast.success(`Đã xoá ${ok} khách hàng`)
    if (fail > 0) toast.error(`${fail} khách hàng xoá thất bại`)
    setConfirmBulkDelete(null)
    qc.invalidateQueries({ queryKey: ['customers'] })
  }

  const bulkActions: BulkAction<any>[] = [
    ...(canExport
      ? [
          {
            key: 'export-csv',
            label: 'Xuất CSV',
            icon: FileDown,
            variant: 'outline' as const,
            onClick: (rows: any[]) => exportCustomersCsv(rows),
          },
        ]
      : []),
    ...(showDelete
      ? [
          {
            key: 'delete',
            label: 'Xoá',
            icon: Trash2,
            variant: 'destructive' as const,
            onClick: (rows: any[]) => setConfirmBulkDelete(rows),
          },
        ]
      : []),
  ]

  // ---- Table columns ----
  const columns = [
    {
      title: 'Khách hàng',
      dataIndex: 'name',
      render: (val: string, row: any) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <CustomerAvatar
            name={val}
            avatarUrl={row.avatarUrl}
            type={row.type}
            taxCode={row.taxCode}
            size="sm"
          />
          <div className="min-w-0">
            <div className="font-semibold text-neutral-800 truncate flex items-center gap-1.5">
              {val || 'Chưa đặt tên'}
              {(row.type === 'COMPANY' || row.taxCode) && (
                <Building2 size={12} className="text-primary-500" />
              )}
            </div>
            {row.address && (
              <div className="text-[11px] text-neutral-400 truncate max-w-[220px]">
                {row.address}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Liên hệ',
      dataIndex: 'phone',
      render: (_: string, row: any) => {
        const isRevealed = !!revealed[row.id]
        const displayPhone = isRevealed ? revealed[row.id] : maskPhone(row.phone)
        return (
          <div className="flex flex-col gap-1 text-xs">
            {row.phone && (
              <div className="flex items-center gap-1.5">
                <Phone size={11} className="text-neutral-400" />
                <span className={`font-mono ${isRevealed ? 'text-neutral-800' : 'text-neutral-500'}`}>
                  {displayPhone}
                </span>
                {canRevealPhone && (
                  <button
                    type="button"
                    onClick={() => toggleReveal(row)}
                    disabled={revealPhoneReq.isPending}
                    className="p-0.5 text-neutral-400 hover:text-primary-600 transition"
                    title={isRevealed ? 'Ẩn số' : 'Xem số đầy đủ'}
                  >
                    {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                )}
              </div>
            )}
            {row.email && (
              <div className="flex items-center gap-1.5 text-neutral-500">
                <Mail size={11} className="text-neutral-400" />
                <span className="truncate max-w-[200px]" title={row.email}>
                  {row.email}
                </span>
              </div>
            )}
            {!row.phone && !row.email && <span className="text-neutral-300">—</span>}
          </div>
        )
      },
    },
    {
      title: 'Mã số thuế',
      dataIndex: 'taxCode',
      render: (val: string) => (
        <span className="font-mono text-xs text-neutral-600">{val || '—'}</span>
      ),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      render: (val: string) => (
        <span className="text-xs text-neutral-500 line-clamp-2 max-w-[240px]" title={val}>
          {val || '—'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      width: 160,
      render: (_: any, row: any) => (
        <RowActions
          actions={[
            {
              key: 'customer-360',
              icon: Radar,
              tooltip: 'Xem 360°',
              tone: 'violet',
              onClick: () => nav(`/customer/${row.id}/360`),
            },
            { kind: 'view', tooltip: 'Xem nhanh', onClick: () => openDetail(row) },
            { kind: 'edit', onClick: () => openEdit(row) },
            { kind: 'delete', hidden: !showDelete, onClick: () => setConfirmDelete(row) },
          ]}
        />
      ),
    },
  ]

  const formFields = [
    {
      name: 'avatarUrl',
      label: 'Ảnh đại diện',
      type: 'image',
      colSpan: 2,
      aspectRatio: '1/1',
      folder: 'customers',
      maxSizeMB: 5,
      hint: 'Kéo-thả hoặc chọn ảnh (JPG/PNG/WebP, tối đa 5MB).',
    },
    { name: 'name', label: 'Tên khách hàng', required: true, placeholder: 'VD: Công ty TNHH Frezo / Nguyễn Văn A' },
    { name: 'phone', label: 'Số điện thoại', placeholder: '0912xxxxxx' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'name@example.com' },
    { name: 'address', label: 'Địa chỉ', placeholder: 'Số nhà, đường, phường/xã, tỉnh/TP' },
    { name: 'taxCode', label: 'Mã số thuế (nếu doanh nghiệp)', placeholder: 'MST 10 hoặc 13 số' },
    { name: 'note', label: 'Ghi chú', placeholder: 'Lịch sử tương tác, ưu đãi đặc biệt...' },
  ]

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <PageHeader
        title="Khách hàng"
        description="Danh bạ cá nhân & doanh nghiệp. Đồng bộ từ hộp thư Facebook khi cần."
        actions={
          <>
            <PageGuideButton guide={CUSTOMERS_GUIDE} />
            <Button
              onClick={() => aiSyncReq.mutate()}
              disabled={aiSyncReq.isPending}
              variant="outline"
              className="gap-2 hover:border-primary-300 hover:text-primary-700"
            >
              {aiSyncReq.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Sparkles size={15} className="text-primary-500" />
              )}
              Đồng bộ AI
            </Button>
            {canExport && (
              <Button
                onClick={() => exportReq.mutate()}
                disabled={exportReq.isPending}
                variant="outline"
                className="gap-2"
              >
                <Download size={15} /> Xuất file
              </Button>
            )}
            <Button
              onClick={openCreate}
              className="gap-2 bg-primary-700 hover:bg-primary-800 text-white shadow-sm"
            >
              <Plus size={17} /> Thêm khách hàng
            </Button>
          </>
        }
      />

      {/* KPI cards */}
      {!isError && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Tổng khách" value={stats.total} tone="neutral" />
        <KpiCard icon={User} label="Cá nhân" value={stats.individual} tone="emerald" />
        <KpiCard icon={Building2} label="Doanh nghiệp" value={stats.company} tone="blue" />
        <KpiCard icon={Phone} label="Có SĐT" value={stats.withPhone} tone="amber" />
      </div>
      )}

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={clearFilters}
        countLabel={`${filteredList.length} khách${hasFilter ? ' (đã lọc)' : ''}`}
        selects={[
          {
            id: 'type',
            label: 'Loại khách',
            value: typeFilter,
            onChange: (v) => setTypeFilter(v as typeof typeFilter),
            options: [
              { value: 'all', label: 'Tất cả loại' },
              { value: 'individual', label: 'Cá nhân' },
              { value: 'company', label: 'Doanh nghiệp' },
              { value: 'noContact', label: 'Chưa có liên hệ' },
            ],
          },
        ]}
        extra={(
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="gap-2 h-9"
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Làm mới
          </Button>
        )}
      >
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="Tìm theo tên, SĐT, email, MST…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            aria-label="Tìm khách hàng"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được khách hàng"
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : !isLoading && filteredList.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200">
          <EmptyState
            icon={Users}
            title={hasFilter ? 'Không có khách hàng khớp bộ lọc' : 'Chưa có khách hàng'}
            description={
              hasFilter
                ? 'Thử xoá lọc hoặc đổi từ khoá.'
                : 'Thêm khách hàng hoặc mở hồ sơ 360° để xem cơ hội bán / hoá đơn liên quan.'
            }
            action={
              hasFilter
                ? { label: 'Xoá lọc', onClick: clearFilters }
                : { label: 'Thêm khách hàng', onClick: openCreate }
            }
          />
        </div>
      ) : (
        <AppTable
          data={filteredList}
          columns={columns as any}
          isLoading={isLoading}
          showSearch={false}
          selectable
          getRowId={(row: any) => String(row.id)}
          bulkActions={bulkActions}
          density="compact"
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={() => void refetch()}
        />
      )}

      {/* Create/Edit Modal */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedItem ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}
        description={selectedItem ? 'Chỉnh sửa thông tin liên hệ và ghi chú.' : 'Điền thông tin để thêm vào danh bạ khách hàng.'}
        maxWidth="3xl"
      >
        <AppForm
          schema={customerFormSchema}
          defaultValues={selectedItem || { name: '', email: '', phone: '', address: '', taxCode: '', note: '', avatarUrl: '' }}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          fields={formFields}
          isLoading={createReq.isPending || updateReq.isPending}
          submitText={selectedItem ? 'Cập nhật' : 'Thêm mới'}
        />
      </AppModal>

      {/* Detail Modal */}
      <AppModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Chi tiết khách hàng"
        maxWidth="xl"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-neutral-100">
              <CustomerAvatar
                name={selectedItem.name}
                avatarUrl={selectedItem.avatarUrl}
                type={selectedItem.type}
                taxCode={selectedItem.taxCode}
                size="md"
                editable
                uploading={uploadAvatarReq.isPending}
                onUpload={(file) => {
                  uploadAvatarReq.mutate(
                    { id: selectedItem.id, file },
                    {
                      onSuccess: (url) => {
                        setSelectedItem((prev: any) =>
                          prev ? { ...prev, avatarUrl: url } : prev,
                        )
                      },
                    },
                  )
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-neutral-800 truncate">
                    {selectedItem.name || 'Chưa đặt tên'}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                      selectedItem.type === 'COMPANY' || selectedItem.taxCode
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'bg-neutral-50 text-neutral-700 border border-neutral-200'
                    }`}
                  >
                    {selectedItem.type === 'COMPANY' || selectedItem.taxCode ? (
                      <>
                        <Building2 size={10} /> Doanh nghiệp
                      </>
                    ) : (
                      <>
                        <User size={10} /> Cá nhân
                      </>
                    )}
                  </span>
                </div>
                {selectedItem.address && (
                  <p className="text-xs text-neutral-500 mt-1">{selectedItem.address}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailRow label="Số điện thoại" value={selectedItem.phone || '—'} mono />
              <DetailRow label="Email" value={selectedItem.email || '—'} />
              <DetailRow label="Mã số thuế" value={selectedItem.taxCode || '—'} mono />
              <DetailRow
                label="Ngày tạo"
                value={
                  selectedItem.createdDate
                    ? new Date(selectedItem.createdDate).toLocaleDateString('vi-VN')
                    : '—'
                }
              />
            </div>

            {selectedItem.note && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-xs font-semibold text-amber-800 mb-1 uppercase tracking-wider">
                  Ghi chú
                </div>
                <div className="text-sm text-amber-900 whitespace-pre-wrap">{selectedItem.note}</div>
              </div>
            )}

            <div className="p-4 bg-neutral-50 border border-dashed border-neutral-200 rounded-lg text-center">
              <p className="text-sm text-neutral-500">
                Lịch sử đơn hàng và tương tác sẽ hiển thị tại đây (đang phát triển).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
              <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                Đóng
              </Button>
              <Button
                onClick={() => {
                  setDetailModalOpen(false)
                  openEdit(selectedItem)
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white gap-2"
              >
                <Pencil size={15} /> Chỉnh sửa
              </Button>
            </div>
          </div>
        )}
      </AppModal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Xóa khách hàng"
        message={`Xóa khách hàng "${confirmDelete?.name}"? Toàn bộ lịch sử đơn hàng liên quan sẽ mất liên kết.`}
        variant="danger"
        confirmText="Xóa"
        cancelText="Hủy"
        isLoading={deleteReq.isPending}
      />

      {/* Confirm bulk delete */}
      <ConfirmDialog
        isOpen={!!confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(null)}
        onConfirm={() => confirmBulkDelete && bulkDeleteCustomers(confirmBulkDelete)}
        title={`Xoá ${confirmBulkDelete?.length ?? 0} khách hàng?`}
        message="Toàn bộ khách hàng đã chọn sẽ bị xoá vĩnh viễn cùng liên kết đơn hàng. Thao tác không thể hoàn tác."
        variant="danger"
        confirmText="Xoá tất cả"
        cancelText="Huỷ"
      />
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

function maskPhone(phone?: string | null): string {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 6) return phone
  return digits.substring(0, 4) + '•••' + digits.substring(digits.length - 2)
}

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: number
  tone: 'neutral' | 'emerald' | 'blue' | 'amber'
}

function KpiCard({ icon: Icon, label, value, tone }: KpiCardProps) {
  const toneMap = {
    neutral: 'bg-white border-neutral-200 text-neutral-700 [&_.ico]:bg-neutral-100 [&_.ico]:text-neutral-600',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 [&_.ico]:bg-emerald-100 [&_.ico]:text-emerald-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-700 [&_.ico]:bg-blue-100 [&_.ico]:text-blue-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-700 [&_.ico]:bg-amber-100 [&_.ico]:text-amber-600',
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

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">
        {label}
      </div>
      <div className={`text-neutral-800 font-medium mt-0.5 ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  )
}
