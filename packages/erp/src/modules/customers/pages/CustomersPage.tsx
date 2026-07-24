import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Pencil, Trash2, Users, Phone, Mail, Search, X,
  Eye, EyeOff, Sparkles, Download, Upload, Building2, User, Loader2,
  Radar, FileDown,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppTable } from '@/components/ui/AppTable'
import type { BulkAction } from '@/components/ui/AppTable/AppTable'
import { AppModal, PageHeader, PageGuideButton, ConfirmDialog, EmptyState, ErrorState } from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@frezo/ui'
import {
  useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer,
} from '../hooks/useCustomer'
import { customerApi } from '../services/customerApi'
import { customerFormSchema, type CustomerFormValues } from '../constants/schema'
import { CUSTOMERS_GUIDE } from '../constants/customers.guide'
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
  const [quickTab, setQuickTab] = useState<'all' | 'individual' | 'company' | 'noContact'>('all')

  // Reveal-phone state (per customer)
  const [revealed, setRevealed] = useState<Record<string, string>>({})

  const { data: rawData, isLoading, isError, refetch, isFetching } = useCustomers()
  const createReq = useCreateCustomer()
  const updateReq = useUpdateCustomer()
  const deleteReq = useDeleteCustomer()

  const aiSyncReq = useMutation({
    mutationFn: () => customerApi.aiSync(),
    onSuccess: (res: any) => {
      const count = res?.data?.count ?? 0
      toast.success(`AI đồng bộ thành công${count ? ` — ${count} khách hàng mới` : ''}`)
    },
    onError: () => toast.error('AI Sync thất bại — kiểm tra Facebook token'),
  })

  const exportReq = useMutation({
    mutationFn: () => customerApi.export(),
    onSuccess: () => toast.success('Đã xuất file — kiểm tra Downloads'),
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
    onError: () => toast.error('Không có quyền reveal SĐT'),
  })

  const dataList: any[] = Array.isArray(rawData) ? rawData : []

  // ---- Client-side filter ----
  const filteredList = useMemo(() => {
    let list = dataList
    if (quickTab === 'individual') {
      list = list.filter((c) => (c.type || 'INDIVIDUAL') === 'INDIVIDUAL')
    }
    if (quickTab === 'company') {
      list = list.filter((c) => c.type === 'COMPANY' || c.taxCode)
    }
    if (quickTab === 'noContact') {
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
  }, [dataList, quickTab, searchText])

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
    setQuickTab('all')
  }

  const hasFilter = !!searchText || quickTab !== 'all'

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
            label: 'Export CSV',
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
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm ${
              row.type === 'COMPANY' || row.taxCode
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600'
            }`}
            title={row.type === 'COMPANY' || row.taxCode ? 'Doanh nghiệp' : 'Cá nhân'}
          >
            {getInitials(val)}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-neutral-800 truncate flex items-center gap-1.5">
              {val || 'Chưa đặt tên'}
              {(row.type === 'COMPANY' || row.taxCode) && (
                <Building2 size={12} className="text-blue-500" />
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
        <div className="flex items-center gap-1">
          <button
            title="Xem 360°"
            onClick={() => nav(`/customer/${row.id}/360`)}
            className="p-1.5 text-neutral-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
          >
            <Radar className="w-4 h-4" />
          </button>
          <button
            title="Xem nhanh"
            onClick={() => openDetail(row)}
            className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            title="Sửa"
            onClick={() => openEdit(row)}
            className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          {showDelete && (
            <button
              title="Xóa"
              onClick={() => setConfirmDelete(row)}
              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  const formFields = [
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
        title="Khách hàng (CRM)"
        description="Danh bạ khách hàng — cá nhân & doanh nghiệp. Tích hợp AI Inbox để tự thu thập từ Facebook."
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
              AI Sync
            </Button>
            {canExport && (
              <Button
                onClick={() => exportReq.mutate()}
                disabled={exportReq.isPending}
                variant="outline"
                className="gap-2"
              >
                <Download size={15} /> Export
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

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được khách hàng"
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : null}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Tổng khách" value={stats.total} tone="neutral" />
        <KpiCard icon={User} label="Cá nhân" value={stats.individual} tone="emerald" />
        <KpiCard icon={Building2} label="Doanh nghiệp" value={stats.company} tone="blue" />
        <KpiCard icon={Phone} label="Có SĐT" value={stats.withPhone} tone="amber" />
      </div>

      {/* Filter bar */}
      <div className="p-3 bg-white border border-neutral-200 shadow-sm rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, email, MST..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-10 w-full pl-9 pr-3 text-sm bg-neutral-50 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all placeholder:text-neutral-400"
            />
          </div>
          <Button variant="outline" disabled className="gap-2 opacity-60 cursor-not-allowed">
            <Upload size={15} /> Import
          </Button>
        </div>

        {/* Quick tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'all' as const, label: 'Tất cả', count: stats.total },
            { key: 'individual' as const, label: 'Cá nhân', count: stats.individual },
            { key: 'company' as const, label: 'Doanh nghiệp', count: stats.company },
            {
              key: 'noContact' as const,
              label: 'Chưa có liên hệ',
              count: dataList.filter((c) => !c.phone && !c.email).length,
            },
          ].map((t) => {
            const active = quickTab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setQuickTab(t.key)}
                className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium border transition ${
                  active
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {t.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-4 rounded-full text-[10px] font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            )
          })}
          {hasFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition"
            >
              <X size={12} /> Xoá lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {!isError && !isLoading && filteredList.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
          <EmptyState
            icon={Users}
            title="Chưa có khách hàng"
            description="Thêm khách hàng hoặc mở hồ sơ 360 để xem Deal / Invoice liên quan."
            action={{ label: 'Thêm khách hàng', onClick: openCreate }}
          />
        </div>
      ) : !isError ? (
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <AppTable
          data={filteredList}
          columns={columns as any}
          isLoading={isLoading}
          showSearch={false}
          selectable
          getRowId={(row: any) => String(row.id)}
          bulkActions={bulkActions}
        />
      </div>
      ) : null}

      {/* Create/Edit Modal */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedItem ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}
        description={selectedItem ? 'Chỉnh sửa thông tin liên hệ và ghi chú.' : 'Điền thông tin để thêm khách hàng vào CRM.'}
        maxWidth="3xl"
      >
        <AppForm
          schema={customerFormSchema}
          defaultValues={selectedItem || { name: '', email: '', phone: '', address: '', taxCode: '', note: '' }}
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
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0 shadow-md ${
                  selectedItem.type === 'COMPANY' || selectedItem.taxCode
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                }`}
              >
                {getInitials(selectedItem.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-neutral-800 truncate">
                    {selectedItem.name || 'Chưa đặt tên'}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                      selectedItem.type === 'COMPANY' || selectedItem.taxCode
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
                📊 Lịch sử đơn hàng, tương tác chat sẽ hiển thị ở đây (đang phát triển).
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

function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

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
