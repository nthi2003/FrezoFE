import { useState } from 'react'
import { Plus, Trash2, Zap, Power, PowerOff, Pencil, Eye, EyeOff, MailWarning, HelpCircle, Server, Key, Globe, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { AppModal } from '@/components/ui/AppModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export function EmailConfigPage() {
  const user = useAuthStore(s => s.user)
  const isAdmin = user?.isAdmin ?? false
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'deactivate'; id: string; name: string } | null>(null)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { data, isLoading, refetch } = useEmailConfigs()
  const createReq = useCreateEmailConfig()
  const updateReq = useUpdateEmailConfig()
  const deleteReq = useDeleteEmailConfig()
  const activateReq = useActivateEmailConfig()
  const deactivateReq = useDeactivateEmailConfig()
  const testReq = useTestEmailConfig()

  const isEditing = !!editingRecord

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
    if (confirmAction.type === 'delete') deleteReq.mutate(confirmAction.id)
    else deactivateReq.mutate(confirmAction.id)
    setConfirmOpen(false)
    setConfirmAction(null)
  }

  const filteredData = data?.filter((item: any) =>
    !searchTerm || item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || item.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <MailWarning className="text-primary-600" />
            Cấu hình Email
            <button type="button" onClick={() => setShowHelp(!showHelp)}
              className="text-neutral-400 hover:text-primary-600 transition-colors"
              title="Hướng dẫn"
            >
              <HelpCircle size={16} />
            </button>
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Quản lý cấu hình SMTP gửi email</p>
        </div>
        <Button onClick={openCreate} className="bg-primary-600 hover:bg-primary-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Thêm cấu hình
        </Button>
      </div>

      {showHelp && (
        <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-sm text-blue-800 space-y-2">
          <p className="font-semibold flex items-center gap-1.5"><HelpCircle size={14} /> Hướng dẫn cấu hình email:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700 ml-1">
            <li><strong>SMTP Server:</strong> máy chủ gửi mail (vd: smtp.gmail.com)</li>
            <li><strong>Cổng:</strong> thường là <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">587</code> (TLS) hoặc <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">465</code> (SSL)</li>
            <li><strong>Email hiển thị:</strong> địa chỉ email dùng để gửi</li>
            <li><strong>API Key:</strong> mật khẩu ứng dụng do nhà cung cấp email cấp (vd: Gmail App Password 16 ký tự)</li>
            <li>Sau khi tạo, bấm <strong>Kích hoạt</strong> để sử dụng</li>
            <li>Bấm <Zap size={12} className="inline text-blue-500" /> để <strong>kiểm tra kết nối</strong> trước khi dùng</li>
          </ul>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : !isAdmin ? (
        <div className="text-center py-20 text-neutral-400 bg-white rounded-xl border border-dashed border-neutral-200 max-w-lg mx-auto">
          <MailWarning className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-500">Bạn chỉ có thể tạo cấu hình email của riêng mình.</p>
          <p className="text-xs mt-1.5">Sau khi tạo, cấu hình sẽ được áp dụng cho email của bạn.</p>
          {(!data || data.length === 0) && (
            <Button onClick={openCreate} className="mt-6 bg-primary-600 hover:bg-primary-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Tạo cấu hình
            </Button>
          )}
        </div>
      ) : filteredData?.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <Server className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-500">Chưa có cấu hình nào</p>
          <p className="text-xs mt-1">Thêm cấu hình SMTP để bắt đầu gửi email</p>
          <Button onClick={openCreate} className="mt-6 bg-primary-600 hover:bg-primary-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Thêm cấu hình đầu tiên
          </Button>
        </div>
      ) : (
        <>
          <div className="relative max-w-sm">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm cấu hình..."
              className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredData?.map((item: any) => (
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
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/50 rounded-b-xl flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all" title="Sửa">
                      <Pencil size={14} />
                    </button>
                    {item.activated ? (
                      <button onClick={() => { setConfirmAction({ type: 'deactivate', id: item.id, name: item.name }); setConfirmOpen(true) }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-orange-600 hover:bg-orange-50 transition-all" title="Hủy kích hoạt">
                        <PowerOff size={14} />
                      </button>
                    ) : (
                      <button onClick={() => activateReq.mutate(item.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-green-600 hover:bg-green-50 transition-all" title="Kích hoạt">
                        <Power size={14} />
                      </button>
                    )}
                    <button onClick={() => testReq.mutate(item.id)} disabled={testReq.isPending}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50" title="Kiểm tra kết nối">
                      {testReq.isPending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    </button>
                  </div>
                  <button onClick={() => { setConfirmAction({ type: 'delete', id: item.id, name: item.name }); setConfirmOpen(true) }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100" title="Xóa">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
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

      <AppModal isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); setConfirmAction(null) }} title="Xác nhận" maxWidth="sm">
        <div className="py-4 text-center space-y-4">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
            confirmAction?.type === 'delete' ? 'bg-red-50' : 'bg-orange-50'
          }`}>
            {confirmAction?.type === 'delete'
              ? <Trash2 className="w-6 h-6 text-red-500" />
              : <PowerOff className="w-6 h-6 text-orange-500" />
            }
          </div>
          <p className="text-neutral-700">
            {confirmAction?.type === 'delete'
              ? <>Bạn có chắc muốn xóa cấu hình <strong>{confirmAction?.name}</strong>?</>
              : <>Bạn có chắc muốn hủy kích hoạt <strong>{confirmAction?.name}</strong>?</>
            }
          </p>
          <p className="text-sm text-neutral-500">Hành động này có thể ảnh hưởng đến việc gửi email tự động.</p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => { setConfirmOpen(false); setConfirmAction(null) }}>Hủy</Button>
            <Button onClick={handleConfirmAction}
              className={confirmAction?.type === 'delete'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
              }>
              Xác nhận
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}
