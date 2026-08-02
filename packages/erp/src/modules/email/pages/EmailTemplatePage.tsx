import { useMemo, useState, useCallback } from 'react'
import { Plus, Trash2, Pencil, Eye, Send, FileText, Variable, X, HelpCircle, ImageIcon, Link, Search } from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  AppModal, Button, EmptyState, ErrorState,
  PageHeader, PageGuideButton, IconActionButton, AppTooltip, type PageGuideConfig,
} from '@frezo/ui'
import { Input } from '@frezo/ui'
import { Label } from '@frezo/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  useEmailTemplate,
  useSendTestEmail,
} from '../hooks/useEmail'
import { emailTemplateSchema } from '../constants/schema'
import { TiptapEditor } from '@/components/shared/TiptapEditor'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'

const SUGGESTED_VARS = ['name', 'email', 'orderId', 'date', 'amount', 'phone', 'address', 'link']

const TEMPLATE_GUIDE: PageGuideConfig = {
  title: 'Mẫu Email',
  subtitle: 'Quản lý mẫu email gửi tự động — hỗ trợ biến {{variable}}.',
  sections: [
    {
      heading: 'Biến template',
      type: 'tips',
      tips: [
        'Dùng {{name}}, {{orderId}}… trong tiêu đề và nội dung.',
        'Bấm Preview để xem trước với giá trị thử.',
      ],
    },
  ],
}

function extractVars(html: string): string[] {
  const text = html.replace(/<[^>]*>/g, '')
  const matches = text.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
}

export function EmailTemplatePage() {
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [viewId, setViewId] = useState<string | null>(null)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({})
  const [sendRecipients, setSendRecipients] = useState('')
  const [sendParams, setSendParams] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [search, setSearch] = useState('')

  const { data, isLoading, isError, refetch, isFetching } = useEmailTemplates()
  const createReq = useCreateEmailTemplate()
  const updateReq = useUpdateEmailTemplate()
  const deleteReq = useDeleteEmailTemplate()
  const { data: viewData } = useEmailTemplate(viewId ?? '')
  const sendTestReq = useSendTestEmail()

  const isEditing = !!editingRecord

  const dataList = useMemo(() => (Array.isArray(data) ? data : []), [data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return dataList
    return dataList.filter(
      (t) =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.subject || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q),
    )
  }, [dataList, search])

  const hasFilter = !!search.trim()
  const isFilteredEmpty = !isLoading && !isError && dataList.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && dataList.length === 0

  const { register, handleSubmit, reset, setValue, watch, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: { name: '', subject: '', content: '', description: '' },
  })

  const watchContent = watch('content')
  const watchSubject = watch('subject')

  const detectedVars = useMemo(() => {
    const all = [...extractVars(watchContent || ''), ...extractVars(watchSubject || '')]
    return [...new Set(all)]
  }, [watchContent, watchSubject])

  const renderedContent = useMemo(() => {
    let text = watchContent || ''
    Object.entries(previewValues).forEach(([key, val]) => {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val || `{{${key}}}`)
    })
    return text
  }, [watchContent, previewValues])

  const renderedSubject = useMemo(() => {
    let text = watchSubject || ''
    Object.entries(previewValues).forEach(([key, val]) => {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val || `{{${key}}}`)
    })
    return text
  }, [watchSubject, previewValues])

  const handleContentChange = useCallback((html: string) => {
    setValue('content', html, { shouldValidate: true })
  }, [setValue])

  const openCreate = () => {
    setEditingRecord(null)
    reset({ name: '', subject: '', content: '', description: '' })
    setPreviewValues({})
    setShowPreview(false)
    setModalOpen(true)
  }

  const openEdit = (record: any) => {
    setEditingRecord(record)
    setValue('name', record.name)
    setValue('subject', record.subject)
    setValue('content', record.content)
    setValue('description', record.description || '')
    setPreviewValues({})
    setShowPreview(false)
    setModalOpen(true)
  }

  const openSend = (id: string) => {
    setViewId(id)
    setSendRecipients('')
    setSendParams('')
    setSendModalOpen(true)
  }

  const handleFormSubmit = (values: any) => {
    if (isEditing) {
      updateReq.mutate({ id: editingRecord.id, data: values }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  const handleSendTest = () => {
    if (!viewId) return
    const recipients = sendRecipients.split(',').map(s => s.trim()).filter(Boolean)
    if (recipients.length === 0) return
    let params: Record<string, any> = {}
    try {
      params = sendParams ? JSON.parse(sendParams) : {}
    } catch { return }
    sendTestReq.mutate({ id: viewId, data: { recipients, params } }, {
      onSuccess: () => setSendModalOpen(false),
    })
  }

  const insertVar = (v: string) => {
    const textarea = document.querySelector<HTMLTextAreaElement>('[name="content"]')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const content = watchContent || ''
      const newContent = content.substring(0, start) + `{{${v}}}` + content.substring(end)
      setValue('content', newContent)
    }
  }

  const columns: AppTableColumn<any>[] = [
    { title: 'Tên mẫu', dataIndex: 'name', filterType: 'text' as const },
    { title: 'Tiêu đề', dataIndex: 'subject', filterType: 'text' as const },
    { title: 'Mô tả', dataIndex: 'description', filterType: 'text' as const },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      width: 200,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-0.5">
          <IconActionButton tooltip="Xem" tone="blue" size="sm" onClick={() => { setViewId(row.id); setViewModalOpen(true) }}>
            <Eye className="w-3.5 h-3.5" />
          </IconActionButton>
          <IconActionButton tooltip="Sửa" size="sm" onClick={() => openEdit(row)}>
            <Pencil className="w-3.5 h-3.5" />
          </IconActionButton>
          <IconActionButton tooltip="Gửi test" tone="primary" size="sm" onClick={() => openSend(row.id)}>
            <Send className="w-3.5 h-3.5" />
          </IconActionButton>
          <IconActionButton
            tooltip="Xóa"
            tone="red"
            size="sm"
            onClick={() =>
              askConfirm({
                title: 'Xóa mẫu này?',
                message: `Mẫu "${row.name || row.code || ''}" sẽ bị xóa.`,
                confirmText: 'Xóa',
                onConfirm: () => deleteReq.mutate(row.id),
              })
            }
          >
            <Trash2 className="w-3.5 h-3.5" />
          </IconActionButton>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Mẫu Email"
        description={<>Quản lý mẫu email gửi tự động, hỗ trợ biến <code className="text-xs bg-neutral-100 px-1 rounded">{'{{variable}}'}</code></>}
        actions={(
          <div className="flex flex-wrap gap-2 items-center">
            <PageGuideButton guide={TEMPLATE_GUIDE} />
            <Button onClick={openCreate} className="gap-2 bg-primary-600 hover:bg-primary-700 text-white">
              <Plus className="w-4 h-4" /> Thêm mẫu
            </Button>
          </div>
        )}
      />

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => setSearch('')}
        countLabel={`${filtered.length} mẫu${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm kiếm mẫu email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm mẫu email"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white overflow-hidden">
          <ErrorState
            title="Không tải được mẫu email"
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={FileText}
            title={isFilteredEmpty ? 'Không có mẫu khớp bộ lọc' : 'Chưa có mẫu email nào'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi từ khoá.'
                : 'Thêm mẫu đầu tiên cho email tự động.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: () => setSearch('') }
                : { label: 'Thêm mẫu', onClick: openCreate }
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
          onRefresh={refetch}
        />
      )}

      {/* Create/Edit Modal */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRecord(null) }}
        title={isEditing ? 'Sửa mẫu Email' : 'Thêm mẫu Email'}
        maxWidth="4xl"
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tên mẫu <span className="text-red-500">*</span></Label>
              <Input placeholder="Xác nhận đơn hàng" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message as string}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tiêu đề <span className="text-red-500">*</span></Label>
              <Input placeholder="Xác nhận đơn hàng #{{orderId}}" {...register('subject')} />
              {errors.subject && <p className="text-xs text-red-500">{errors.subject.message as string}</p>}
            </div>
          </div>

          {/* Biến gợi ý */}
          <div className="space-y-1.5">
            {detectedVars.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-neutral-400 flex items-center gap-1"><Variable size={12} /> Biến:</span>
                {detectedVars.map(v => (
                  <span key={v} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded font-mono">
                    {'{{'}{v}{'}}'}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Nội dung <span className="text-red-500">*</span></Label>
                <IconActionButton tooltip="Hướng dẫn sử dụng" tone="primary" onClick={() => setShowHelp(!showHelp)}>
                  <HelpCircle size={14} />
                </IconActionButton>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {SUGGESTED_VARS.map(v => (
                    <button type="button" key={v} onClick={() => insertVar(v)}
                      className="text-[10px] bg-neutral-100 hover:bg-primary-50 text-neutral-600 hover:text-primary-700 px-1.5 py-0.5 rounded font-mono transition-colors"
                    >{'{{'}{v}{'}}'}</button>
                  ))}
                </div>
                <button type="button" onClick={() => setShowPreview(!showPreview)}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Eye size={12} /> {showPreview ? 'Ẩn preview' : 'Preview'}
                </button>
              </div>
            </div>
            {showHelp && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800 space-y-1">
                <p className="font-medium flex items-center gap-1"><HelpCircle size={12} /> Hướng dẫn sử dụng:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                  <li>Bôi đen văn bản → dùng toolbar để <strong>bôi đậm</strong>, <em>in nghiêng</em>, gạch chân, gạch ngang</li>
                  <li>Chèn <strong>hình ảnh</strong> bằng icon <ImageIcon size={12} className="inline" /> (nhập URL hình)</li>
                  <li>Chèn <strong>link</strong> bằng icon <Link size={12} className="inline" /></li>
                  <li>Dùng biến <code className="bg-blue-100 px-1 rounded">{'{{variable}}'}</code> để tự động điền dữ liệu</li>
                  <li>Click vào các biến gợi ý <code className="bg-blue-100 px-1 rounded">{'{{name}}'}</code> để chèn nhanh</li>
                </ul>
              </div>
            )}
            <div className={`grid gap-4 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <TiptapEditor
                  value={watchContent || ''}
                  onChange={handleContentChange}
                  placeholder="Nội dung email... Sử dụng {{variable}} để chèn biến"
                />
                {errors.content && <p className="text-xs text-red-500">{errors.content.message as string}</p>}
              </div>
              {showPreview && (
                <div className="border border-border rounded-md p-4 bg-white">
                  <div className="text-xs text-neutral-400 mb-2">📧 {renderedSubject || '(no subject)'}</div>
                  <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderedContent }} />
                </div>
              )}
            </div>
          </div>

          {/* Preview values */}
          {showPreview && detectedVars.length > 0 && (
            <div className="space-y-2 p-3 bg-neutral-50 rounded-md border">
              <Label className="text-xs text-neutral-500">Giá trị thử cho preview:</Label>
              <div className="flex flex-wrap gap-2">
                {detectedVars.map(v => (
                  <div key={v} className="flex items-center gap-1">
                    <span className="text-xs text-neutral-500 font-mono">{v}:</span>
                    <input
                      value={previewValues[v] || ''}
                      onChange={e => setPreviewValues(p => ({ ...p, [v]: e.target.value }))}
                      className="w-24 text-xs border border-border rounded px-1.5 py-0.5"
                      placeholder={v}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Input placeholder="Mẫu email dùng cho..." {...register('description')} />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditingRecord(null) }}>Hủy</Button>
            <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white" disabled={createReq.isPending || updateReq.isPending}>
              {createReq.isPending || updateReq.isPending ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Lưu')}
            </Button>
          </div>
        </form>
      </AppModal>

      {/* View Modal */}
      <AppModal
        isOpen={viewModalOpen}
        onClose={() => { setViewModalOpen(false); setViewId(null) }}
        title={viewData?.name || 'Chi tiết mẫu Email'}
        maxWidth="xl"
      >
        {viewData ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-neutral-400">Mã</Label>
                <p className="text-sm font-mono">{viewData.code || '—'}</p>
              </div>
              <div>
                <Label className="text-xs text-neutral-400">Tên mẫu</Label>
                <p className="text-sm font-medium">{viewData.name}</p>
              </div>
            </div>
            <div>
              <Label className="text-xs text-neutral-400">Tiêu đề</Label>
              <p className="text-sm">{viewData.subject}</p>
            </div>
            <div>
              <Label className="text-xs text-neutral-400">Nội dung</Label>
              <div className="mt-1 p-3 bg-neutral-50 rounded border text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">{viewData.content}</div>
            </div>
            {viewData.description && (
              <div>
                <Label className="text-xs text-neutral-400">Mô tả</Label>
                <p className="text-sm text-neutral-600">{viewData.description}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-neutral-400">Đang tải...</div>
        )}
      </AppModal>

      {/* Send Test Modal */}
      <AppModal
        isOpen={sendModalOpen}
        onClose={() => { setSendModalOpen(false); setViewId(null) }}
        title="Gửi email test"
        maxWidth="md"
      >
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label>Người nhận <span className="text-red-500">*</span></Label>
            <Input
              placeholder="user1@email.com, user2@email.com"
              value={sendRecipients}
              onChange={e => setSendRecipients(e.target.value)}
            />
            <p className="text-xs text-neutral-400">Nhập email, cách nhau bằng dấu phẩy</p>
          </div>
          <div className="space-y-1.5">
            <Label>Params (JSON)</Label>
            <textarea
              className="w-full border border-border rounded-md p-2 text-xs font-mono h-20 resize-none"
              placeholder='{"name": "Test User", "orderId": "123"}'
              value={sendParams}
              onChange={e => setSendParams(e.target.value)}
            />
            <p className="text-xs text-neutral-400">Các biến sẽ thay thế vào template</p>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => { setSendModalOpen(false); setViewId(null) }}>Hủy</Button>
            <Button onClick={handleSendTest} disabled={sendTestReq.isPending || !sendRecipients.trim()} className="bg-primary-600 hover:bg-primary-700 text-white">
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {sendTestReq.isPending ? 'Đang gửi...' : 'Gửi'}
            </Button>
          </div>
        </div>
      </AppModal>
      {confirmDialog}
    </div>
  )
}
