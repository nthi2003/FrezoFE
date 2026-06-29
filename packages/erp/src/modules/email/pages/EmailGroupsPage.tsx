import { useState } from 'react'
import { Plus, Trash2, Pencil, Send, Users, Mail, X, Copy } from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { AppModal } from '@frezo/ui'
import { Button } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { Label } from '@frezo/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useEmailGroups,
  useCreateEmailGroup,
  useUpdateEmailGroup,
  useDeleteEmailGroup,
  useSendTestEmail,
} from '../hooks/useEmail'

const groupSchema = z.object({
  name: z.string().min(1, 'Tên nhóm không được để trống'),
  description: z.string().optional(),
})

export function EmailGroupsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [sendGroupId, setSendGroupId] = useState<string | null>(null)
  const [sendGroupName, setSendGroupName] = useState('')
  const [sendRecipient, setSendRecipient] = useState('')
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [emails, setEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  const { data, isLoading, refetch } = useEmailGroups()
  const createReq = useCreateEmailGroup()
  const updateReq = useUpdateEmailGroup()
  const deleteReq = useDeleteEmailGroup()
  const sendTestReq = useSendTestEmail()

  const isEditing = !!editingRecord
  const dataList = Array.isArray(data) ? data : []

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '', description: '' },
  })

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

  const addEmail = () => {
    const e = newEmail.trim()
    if (!e) return
    if (!isValidEmail(e)) { setEmailError('Email không hợp lệ'); return }
    if (emails.includes(e)) { setEmailError('Email đã tồn tại'); return }
    setEmails(prev => [...prev, e])
    setNewEmail('')
    setEmailError('')
  }

  const removeEmail = (idx: number) => setEmails(prev => prev.filter((_, i) => i !== idx))

  const openCreate = () => {
    setEditingRecord(null)
    reset({ name: '', description: '' })
    setEmails([])
    setNewEmail('')
    setModalOpen(true)
  }

  const openEdit = (record: any) => {
    setEditingRecord(record)
    setValue('name', record.name)
    setValue('description', record.description || '')
    setEmails(record.emails || [])
    setNewEmail('')
    setModalOpen(true)
  }

  const openSend = (record: any) => {
    setSendGroupId(record.id)
    setSendGroupName(record.name)
    setSendRecipient('')
    setSendModalOpen(true)
  }

  const handleFormSubmit = (values: any) => {
    const payload = { ...values, emails }
    if (isEditing) {
      updateReq.mutate({ id: editingRecord.id, data: payload }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  const handleSendTest = () => {
    if (!sendGroupId || !sendRecipient.trim()) return
    sendTestReq.mutate({
      id: sendGroupId,
      data: { recipients: [sendRecipient.trim()] },
    }, { onSuccess: () => setSendModalOpen(false) })
  }

  const columns: AppTableColumn<any>[] = [
    { title: 'Tên nhóm', dataIndex: 'name', filterType: 'text' as const },
    { title: 'Mô tả', dataIndex: 'description', filterType: 'text' as const },
    {
      title: 'Số lượng',
      dataIndex: 'emails',
      width: 100,
      render: (val: string[]) => (
        <span className="inline-flex items-center gap-1 text-sm">
          <Mail size={14} className="text-neutral-400" />
          {val?.length ?? 0}
        </span>
      ),
    },
    {
      title: 'Danh sách email',
      dataIndex: 'emails',
      render: (val: string[]) => (
        <div className="flex flex-wrap gap-1">
          {val?.slice(0, 3).map((e: string, i: number) => (
            <span key={i} className="text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded truncate max-w-[140px]">{e}</span>
          ))}
          {val?.length > 3 && <span className="text-xs text-neutral-400">+{val.length - 3}</span>}
        </div>
      ),
    },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      width: 160,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)} title="Sửa">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openSend(row)} title="Gửi email cho nhóm">
            <Send className="w-3.5 h-3.5 text-primary-600" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { if (confirm('Xóa nhóm này?')) deleteReq.mutate(row.id) }} title="Xóa">
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Users className="text-primary-600" />
            Nhóm Email
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Tạo nhóm email để gửi hàng loạt</p>
        </div>
        <Button onClick={openCreate} className="bg-primary-600 hover:bg-primary-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Tạo nhóm
        </Button>
      </div>

      <AppTable
        columns={columns}
        data={dataList}
        isLoading={isLoading}
        showSearch
        searchPlaceholder="Tìm kiếm nhóm email..."
        onRefresh={refetch}
      />

      {/* Create/Edit Modal */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRecord(null) }}
        title={isEditing ? 'Sửa nhóm Email' : 'Tạo nhóm Email'}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 py-4">
          <div className="space-y-1.5">
            <Label>Tên nhóm <span className="text-red-500">*</span></Label>
            <Input placeholder="Khách hàng thân thiết" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message as string}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Input placeholder="Nhóm khách hàng VIP" {...register('description')} />
          </div>

          {/* Email management */}
          <div className="space-y-2">
            <Label>Danh sách email <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              <Input
                placeholder="user@example.com"
                value={newEmail}
                onChange={e => { setNewEmail(e.target.value); setEmailError('') }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail() } }}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addEmail}>Thêm</Button>
            </div>
            {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            <div className="border border-border rounded-md p-3 min-h-[100px] space-y-1.5">
              {emails.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">Chưa có email nào</p>
              ) : (
                emails.map((e, i) => (
                  <div key={i} className="flex items-center justify-between bg-neutral-50 rounded px-3 py-1.5 group">
                    <span className="text-sm text-neutral-700">{e}</span>
                    <button type="button" onClick={() => removeEmail(i)} className="text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
              {emails.length > 0 && (
                <div className="text-xs text-neutral-400 pt-1 border-t border-dashed">
                  Tổng: <strong>{emails.length}</strong> email
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditingRecord(null) }}>Hủy</Button>
            <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white" disabled={createReq.isPending || updateReq.isPending || emails.length === 0}>
              {createReq.isPending || updateReq.isPending ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Lưu')}
            </Button>
          </div>
        </form>
      </AppModal>

      {/* Send to group modal */}
      <AppModal
        isOpen={sendModalOpen}
        onClose={() => { setSendModalOpen(false); setSendGroupId(null) }}
        title={`Gửi email test cho nhóm: ${sendGroupName}`}
        maxWidth="md"
      >
        <div className="space-y-4 py-4">
          <p className="text-sm text-neutral-600">
            Gửi email test đến nhóm <strong>{sendGroupName}</strong>. 
            Tất cả email trong nhóm sẽ nhận được email test.
          </p>
          <div className="space-y-1.5">
            <Label>Hoặc gửi đến email cụ thể</Label>
            <Input
              placeholder="test@email.com"
              value={sendRecipient}
              onChange={e => setSendRecipient(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => { setSendModalOpen(false); setSendGroupId(null) }}>Hủy</Button>
            <Button onClick={handleSendTest} disabled={sendTestReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white">
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {sendTestReq.isPending ? 'Đang gửi...' : 'Gửi'}
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}
