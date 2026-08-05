import { useMemo, useState } from 'react'
import {
  Plus, Zap, Power, PowerOff, Eye, EyeOff, MailWarning,
  Server, Key, Globe, CheckCircle2, XCircle, Loader2, Search,
} from 'lucide-react'
import { AppModal, Button, Input, Label, PageHeader, PageGuideButton, ConfirmDialog, EmptyState, ErrorState, Select, RowActions, type PageGuideConfig } from '@frezo/ui'
import { FilterBar } from '@/components/ui/FilterBar'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useEmailConfigs,
  useCreateEmailConfig,
  useUpdateEmailConfig,
  useDeleteEmailConfig,
  useActivateEmailConfig,
  useDeactivateEmailConfig,
  useTestEmailConfig,
} from '../hooks/useEmail'
import { emailConfigSchema } from '../constants/schema'
import { useAuthStore } from '@/stores/authStore'

const EMAIL_CONFIG_GUIDE: PageGuideConfig = {
  title: 'Cấu hình Email',
  subtitle: 'Quản lý SMTP gửi email — kích hoạt một cấu hình để dùng cho hệ thống.',
  sections: [
    {
      heading: 'Hướng dẫn',
      type: 'tips',
      tips: [
        'SMTP Server: vd smtp.gmail.com — Cổng thường 587 (TLS) hoặc 465 (SSL).',
        'API Key: mật khẩu ứng dụng do nhà cung cấp email cấp.',
        'Sau khi tạo, bấm Kích hoạt và dùng nút kiểm tra kết nối trước khi gửi hàng loạt.',
        'MailHog (dev): SMTP localhost:1025 — UI http://localhost:8025',
      ],
    },
  ],
}

export function EmailConfigPage() {
  const user = useAuthStore(s => s.user)
  const isAdmin = user?.isAdmin ?? false
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'deactivate'; id: string; name: string } | null>(null)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const { data, isLoading, isError, isFetching, refetch } = useEmailConfigs()
  const createReq = useCreateEmailConfig()
  const updateReq = useUpdateEmailConfig()
  const deleteReq = useDeleteEmailConfig()
  const activateReq = useActivateEmailConfig()
  const deactivateReq = useDeactivateEmailConfig()
  const testReq = useTestEmailConfig()

  const isEditing = !!editingRecord
  const dataList = Array.isArray(data) ? data : []

  const filteredData = useMemo(() => {
    let list = dataList
    if (statusFilter === 'active') list = list.filter((item: any) => item.activated)
    if (statusFilter === 'inactive') list = list.filter((item: any) => !item.activated)
    const q = searchTerm.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (item: any) =>
          item.name?.toLowerCase().includes(q) ||
          item.code?.toLowerCase().includes(q) ||
          item.smtp?.toLowerCase().includes(q),
      )
    }
    return list
  }, [dataList, searchTerm, statusFilter])

  const hasFilter = !!searchTerm.trim() || statusFilter !== 'all'
  const isFilteredEmpty = !isLoading && !isError && dataList.length > 0 && filteredData.length === 0
  const isFullyEmpty = !isLoading && !isError && dataList.length === 0

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: { code: '', name: '', apiKey: '', smtp: '', port: '', nameEmail: '' },
  })

  const openCreate = () => {
    setEditingRecord(null)
    reset({ code: '', name: '', apiKey: '', smtp: '', port: '', nameEmail: '' })
    setShowApiKey(false)
    setModalOpen(true)
  }

  const openEdit = (record: any) => {
    setEditingRecord(record)
    setValue('code', record.code)
    setValue('name', record.name)
    setValue('apiKey', record.apiKey)
    setValue('smtp', record.smtp)
    setValue('port', String(record.port ?? ''))
    setValue('nameEmail', record.nameEmail)
    setShowApiKey(false)
    setModalOpen(true)
  }

  const handleFormSubmit = (values: any) => {
    const payload = { ...values, port: values.port ? Number(values.port) : null }
    if (isEditing) {
      updateReq.mutate({ id: editingRecord.id, data: payload }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  const handleConfirmAction = () => {
    if (!confirmAction) return
    if (confirmAction.type === 'delete') {
      deleteReq.mutate(confirmAction.id, { onSettled: () => setConfirmAction(null) })
    } else {
      deactivateReq.mutate(confirmAction.id, { onSettled: () => setConfirmAction(null) })
    }
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Cấu hình Email"
        description="Quản lý cấu hình SMTP gửi email"
        actions={(
          <div className="flex flex-wrap gap-2 items-center">
            <PageGuideButton guide={EMAIL_CONFIG_GUIDE} />
            <Button onClick={openCreate} className="gap-2 bg-primary-600 hover:bg-primary-700 text-white">
              <Plus className="w-4 h-4" /> Thêm cấu hình
            </Button>
          </div>
        )}
      />

      {!isAdmin && !isLoading && (
        <p className="text-xs text-neutral-500">
          Bạn chỉ có thể tạo cấu hình email của riêng mình — sau khi tạo sẽ áp dụng cho tài khoản của bạn.
        </p>
      )}

      {(isAdmin || dataList.length > 0) && (
        <FilterBar
          hasActiveFilters={hasFilter}
          onClear={() => {
            setSearchTerm('')
            setStatusFilter('all')
          }}
          countLabel={`${filteredData.length} cấu hình${hasFilter ? ' (đã lọc)' : ''}`}
        >
          <div className="min-w-[140px]">
            <Select
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Tắt' },
              ]}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}
              placeholder="Trạng thái"
              aria-label="Lọc trạng thái"
              showSearch={false}
            />
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm cấu hình…"
              className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
              aria-label="Tìm cấu hình email"
            />
          </div>
        </FilterBar>
      )}

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được cấu hình email"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={MailWarning}
            title={isFilteredEmpty ? 'Không có cấu hình khớp bộ lọc' : 'Chưa có cấu hình nào'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi từ khoá.'
                : 'Thêm cấu hình SMTP để bắt đầu gửi email.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: () => { setSearchTerm(''); setStatusFilter('all') } }
                : { label: 'Thêm cấu hình', onClick: openCreate }
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredData.map((item: any) => (
            <div key={item.id} className="group bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all">
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.activated ? 'bg-green-50' : 'bg-neutral-50'
                    }`}>
                      <MailWarning className={`w-4.5 h-4.5 ${item.activated ? 'text-green-600' : 'text-neutral-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-neutral-900 truncate">{item.name}</h3>
                      <p className="text-xs text-neutral-400 font-mono mt-0.5">{item.code}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    item.activated ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.activated ? 'bg-green-500' : 'bg-neutral-400'}`} />
                    {item.activated ? 'Hoạt động' : 'Tắt'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Server size={14} className="flex-shrink-0" />
                    <span className="truncate">{item.smtp}</span>
                    {item.port && <span className="text-neutral-300">:</span>}
                    {item.port && <span className="font-mono text-neutral-400">{item.port}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Globe size={14} className="flex-shrink-0" />
                    <span className="truncate">{item.nameEmail}</span>
                  </div>
                  {item.activated && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 size={14} className="flex-shrink-0" />
                      <span>Đã kích hoạt</span>
                    </div>
                  )}
                  {!item.activated && (
                    <div className="flex items-center gap-2 text-neutral-400">
                      <XCircle size={14} className="flex-shrink-0" />
                      <span>Chưa kích hoạt</span>
                    </div>
                  )}
                  {isMailhogConfig(item) && (
                    <div className="rounded-md bg-amber-50 border border-amber-200 px-2 py-1.5 text-xs text-amber-900">
                      MailHog / local SMTP — kiểm tra UI{' '}
                      <span className="font-mono">http://localhost:8025</span> (SMTP :{item.port || 1025})
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/50 rounded-b-xl">
                <RowActions
                  actions={[
                    { kind: 'edit', tooltip: 'Sửa', onClick: () => openEdit(item) },
                    {
                      key: 'deactivate',
                      icon: PowerOff,
                      tooltip: 'Hủy kích hoạt',
                      tone: 'amber',
                      hidden: !item.activated,
                      onClick: () => setConfirmAction({ type: 'deactivate', id: item.id, name: item.name }),
                    },
                    {
                      key: 'activate',
                      icon: Power,
                      tooltip: 'Kích hoạt',
                      tone: 'emerald',
                      hidden: !!item.activated,
                      onClick: () => activateReq.mutate(item.id),
                    },
                    {
                      key: 'test',
                      icon: Zap,
                      tooltip: 'Kiểm tra kết nối',
                      tone: 'blue',
                      disabled: testReq.isPending,
                      onClick: () => testReq.mutate(item.id),
                    },
                    {
                      kind: 'delete',
                      tooltip: 'Xóa',
                      onClick: () => setConfirmAction({ type: 'delete', id: item.id, name: item.name }),
                    },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <AppModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRecord(null) }}
        title={isEditing ? 'Sửa cấu hình Email' : 'Thêm cấu hình Email'}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700">Mã cấu hình <span className="text-red-500">*</span></Label>
              <Input placeholder="SMTP_MAIN" {...register('code')} disabled={isEditing} />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message as string}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700">Tên cấu hình <span className="text-red-500">*</span></Label>
              <Input placeholder="SMTP chính" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message as string}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700">SMTP Server <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Server size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input placeholder="smtp.gmail.com" {...register('smtp')} className="pl-9" />
              </div>
              {errors.smtp && <p className="text-xs text-red-500">{errors.smtp.message as string}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700">Cổng</Label>
              <Input placeholder="587" {...register('port')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700">API Key <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Key size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 z-10" />
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={isEditing ? '••••••••' : 'Nhập API key'}
                  {...register('apiKey')}
                  className="pl-9 pr-10"
                />
                <button type="button" onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors">
                  {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.apiKey && <p className="text-xs text-red-500">{errors.apiKey.message as string}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700">Email hiển thị <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input placeholder="noreply@frezo.com" {...register('nameEmail')} className="pl-9" />
              </div>
              {errors.nameEmail && <p className="text-xs text-red-500">{errors.nameEmail.message as string}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditingRecord(null) }}>Hủy</Button>
            <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white min-w-[100px]" disabled={createReq.isPending || updateReq.isPending}>
              {createReq.isPending || updateReq.isPending ? <Loader2 size={15} className="animate-spin mx-auto" /> : (isEditing ? 'Cập nhật' : 'Lưu')}
            </Button>
          </div>
        </form>
      </AppModal>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => {
          if (!deleteReq.isPending && !deactivateReq.isPending) setConfirmAction(null)
        }}
        onConfirm={handleConfirmAction}
        title={confirmAction?.type === 'delete' ? 'Xóa cấu hình email?' : 'Hủy kích hoạt cấu hình?'}
        message={
          confirmAction?.type === 'delete'
            ? `Bạn có chắc muốn xóa cấu hình "${confirmAction?.name}"? Hành động có thể ảnh hưởng đến việc gửi email tự động.`
            : `Bạn có chắc muốn hủy kích hoạt "${confirmAction?.name}"?`
        }
        confirmText={confirmAction?.type === 'delete' ? 'Xóa' : 'Hủy kích hoạt'}
        cancelText="Giữ lại"
        variant={confirmAction?.type === 'delete' ? 'danger' : 'warning'}
        isLoading={deleteReq.isPending || deactivateReq.isPending}
      />
    </div>
  )
}

/** LNK09-06: nhận diện SMTP local / MailHog để gợi ý UI :8025 */
function isMailhogConfig(item: {
  smtp?: string
  host?: string
  port?: number | string
  code?: string
  name?: string
}): boolean {
  const host = String(item.smtp || item.host || '').toLowerCase()
  const code = String(item.code || item.name || '').toLowerCase()
  const port = Number(item.port)
  return (
    port === 1025 ||
    host.includes('mailhog') ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    code.includes('mailhog')
  )
}
