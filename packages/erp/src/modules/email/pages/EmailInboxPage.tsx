import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Inbox, Send, FileText, Trash2, Star, AlertTriangle, ChevronLeft, ChevronRight,
  RefreshCw, Search, Paperclip, Clock, Mail, MailOpen, Archive, MoreHorizontal,
  Menu, X, MessageSquare, Reply, Forward, Eye, EyeOff, Pencil, SquarePen,
} from 'lucide-react'
import { Button } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosClient from '@/lib/axios/axiosClient'
import { toast } from 'sonner'
import type { ApiResponse } from '@frezo/types'
import { useEmailConfigs } from '../hooks/useEmail'

type Folder = 'inbox' | 'sent' | 'drafts' | 'trash' | 'starred' | 'spam'
type EmailItem = {
  messageId: string
  subject: string
  from: string
  fromPersonal: string
  to: string[]
  sentDate: string
  bodyPreview: string
  bodyHtml: string
  seen: boolean
  hasAttachments: boolean
  attachmentNames: string[]
}

const FOLDERS: { key: Folder; label: string; icon: any }[] = [
  { key: 'inbox', label: 'Hộp thư đến', icon: Inbox },
  { key: 'starred', label: 'Có gắn sao', icon: Star },
  { key: 'sent', label: 'Đã gửi', icon: Send },
  { key: 'drafts', label: 'Thư nháp', icon: FileText },
  { key: 'spam', label: 'Spam', icon: AlertTriangle },
  { key: 'trash', label: 'Thùng rác', icon: Trash2 },
]

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const isThisYear = d.getFullYear() === now.getFullYear()
  if (isThisYear) return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function EmailInboxPage() {
  const qc = useQueryClient()
  const [folder, setFolder] = useState<Folder>('inbox')
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: configs } = useEmailConfigs()
  const activeConfig = useMemo(() => {
    if (!configs) return null
    return configs.find((c: any) => c.activated) || configs[0]
  }, [configs])

  const { data: emails, isLoading, refetch, isFetching } = useQuery<EmailItem[]>({
    queryKey: ['email-inbox', activeConfig?.id, folder],
    queryFn: () =>
      axiosClient.get<ApiResponse<EmailItem[]>>(`/email/inbox/${activeConfig.id}`, {
        params: { folder, page: 0, size: 20 },
      }).then(r => r.data?.data ?? []),
    enabled: !!activeConfig?.id,
    refetchInterval: false,
    staleTime: 15000,
  })

  const markReadMutation = useMutation({
    mutationFn: (uid: number) =>
      axiosClient.put(`/email/inbox/${activeConfig.id}/${uid}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-inbox', activeConfig?.id] }),
  })

  const filteredEmails = useMemo(() => {
    if (!emails) return []
    if (!searchTerm) return emails
    const s = searchTerm.toLowerCase()
    return emails.filter((e: EmailItem) =>
      e.subject?.toLowerCase().includes(s) ||
      e.from?.toLowerCase().includes(s) ||
      e.fromPersonal?.toLowerCase().includes(s) ||
      e.bodyPreview?.toLowerCase().includes(s)
    )
  }, [emails, searchTerm])

  const handleSelectEmail = (email: EmailItem) => {
    setSelectedEmail(email)
    if (!email.seen && folder === 'inbox') {
      markReadMutation.mutate(Number(email.messageId))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (!filteredEmails) return
    if (selectedIds.size === filteredEmails.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredEmails.map((e: EmailItem) => e.messageId)))
    }
  }

  const unreadCount = useMemo(() => {
    if (!emails || folder !== 'inbox') return 0
    return emails.filter((e: EmailItem) => !e.seen).length
  }, [emails, folder])

  if (!activeConfig) {
    return (
      <div className="p-6 animate-fade-in flex items-center justify-center h-[80vh]">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-neutral-50 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-10 h-10 text-neutral-300" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-700 mb-2">Chưa có cấu hình email</h2>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">Vui lòng tạo và kích hoạt cấu hình email trước khi sử dụng hộp thư.</p>
          <Button onClick={() => navigate('/email/config')} className="bg-primary-600 hover:bg-primary-700 text-white px-6">
            Đến cấu hình email
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex animate-fade-in">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-60' : 'w-0'} transition-all duration-200 border-r border-border bg-white flex-shrink-0 overflow-hidden flex flex-col`}>
        <div className="p-4">
          <Button
            onClick={() => navigate('/email/compose')}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm gap-2 h-10"
          >
            <SquarePen size={15} /> Soạn thư
          </Button>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {FOLDERS.map(f => {
            const Icon = f.icon
            const isActive = folder === f.key
            const count = f.key === 'inbox' ? unreadCount : 0
            return (
              <button
                key={f.key}
                onClick={() => { setFolder(f.key); setSelectedEmail(null); setSelectedIds(new Set()) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive ? 'bg-primary-50 text-primary-700 font-medium shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800'
                }`}
              >
                <div className={`p-1 rounded-md ${isActive ? 'bg-primary-100' : ''}`}>
                  <Icon size={17} className={isActive ? 'text-primary-600' : 'text-neutral-400'} />
                </div>
                <span className="flex-1 text-left truncate">{f.label}</span>
                {count > 0 && (
                  <span className="text-xs font-bold bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full min-w-[22px] text-center">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Toggle sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="flex-shrink-0 w-7 flex items-center justify-center border-r border-border hover:bg-neutral-50 text-neutral-400 transition-colors"
        title={sidebarOpen ? 'Thu gọn' : 'Mở rộng'}
      >
        {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
      </button>

      {selectedEmail ? (
        /* Email Detail View */
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Detail Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <button
              onClick={() => setSelectedEmail(null)}
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              <ChevronLeft size={17} />
              <span>Quay lại</span>
            </button>
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={() => { /* TODO: reply */ }} title="Trả lời"
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-all">
                <Reply size={16} />
              </button>
              <button onClick={() => { /* TODO: forward */ }} title="Chuyển tiếp"
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-all">
                <Forward size={16} />
              </button>
              <button onClick={() => { /* TODO: archive */ }} title="Lưu trữ"
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-all">
                <Archive size={16} />
              </button>
              <button onClick={() => { /* TODO: delete */ }} title="Xóa"
                className="p-2 rounded-lg hover:bg-red-50 text-neutral-500 hover:text-red-600 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Detail Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
              <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
                {selectedEmail.subject || <span className="italic text-neutral-400 font-normal">(Không có tiêu đề)</span>}
              </h1>

              {/* Sender Info */}
              <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-base font-bold flex-shrink-0">
                  {(selectedEmail.fromPersonal || selectedEmail.from || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-semibold text-neutral-900">
                      {selectedEmail.fromPersonal || selectedEmail.from || '(Không rõ)'}
                    </span>
                    {!selectedEmail.seen && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">Mới</span>
                    )}
                  </div>
                  <div className="text-sm text-neutral-400 mt-0.5">{selectedEmail.from}</div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-neutral-400" />
                      {formatDate(selectedEmail.sentDate)}
                    </span>
                    <span>Đến: <span className="text-neutral-600">{(selectedEmail.to || []).join(', ')}</span></span>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="prose prose-sm max-w-none leading-relaxed text-neutral-800" dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml || '<p class="text-neutral-400 italic">(Không có nội dung)</p>' }} />

              {/* Attachments */}
              {selectedEmail.hasAttachments && selectedEmail.attachmentNames && selectedEmail.attachmentNames.length > 0 && (
                <div className="border-t border-neutral-200 pt-5">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Paperclip size={13} /> Tệp đính kèm ({selectedEmail.attachmentNames.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.attachmentNames.map((name, i) => (
                      <span key={i} className="text-xs bg-neutral-100 hover:bg-neutral-200 transition-colors px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-neutral-600 cursor-default">
                        <Paperclip size={11} /> {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Email List */
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border">
            <div className="flex items-center gap-1">
              <button
                onClick={selectAll}
                className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                title="Chọn tất cả"
              >
                <div className={`w-4 h-4 rounded border-2 ${
                  selectedIds.size === filteredEmails?.length && filteredEmails?.length > 0
                    ? 'bg-primary-600 border-primary-600'
                    : 'border-neutral-300'
                } flex items-center justify-center transition-colors`}>
                  {selectedIds.size === filteredEmails?.length && filteredEmails?.length > 0 && (
                    <span className="text-white text-[10px] font-bold">✓</span>
                  )}
                </div>
              </button>
              <button
                onClick={() => refetch()}
                className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                title="Làm mới"
              >
                <RefreshCw size={15} className={`text-neutral-500 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm email..."
                className="pl-9 h-9 text-sm bg-neutral-50 border-neutral-200 focus:bg-white rounded-lg"
              />
            </div>
            <div className="text-xs text-neutral-400 whitespace-nowrap">
              {filteredEmails ? `${filteredEmails.length} email` : ''}
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {isLoading && (
              <div className="flex items-center justify-center h-40">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw size={22} className="animate-spin text-primary-400" />
                  <span className="text-xs text-neutral-400">Đang tải...</span>
                </div>
              </div>
            )}
            {!isLoading && filteredEmails?.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center px-6">
                  <div className="w-20 h-20 rounded-2xl bg-neutral-50 flex items-center justify-center mx-auto mb-4">
                    <MailOpen className="w-10 h-10 text-neutral-300" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-600">Thư mục trống</p>
                  <p className="text-xs text-neutral-400 mt-1">Không có email nào trong thư mục này</p>
                </div>
              </div>
            )}
            {filteredEmails?.map((email: EmailItem) => (
              <button
                key={email.messageId}
                onClick={() => handleSelectEmail(email)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-all ${
                  !email.seen ? 'bg-primary-50/30' : ''
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(email.messageId)}
                    onChange={() => toggleSelect(email.messageId)}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  !email.seen
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {(email.fromPersonal || email.from || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm truncate ${!email.seen ? 'font-semibold text-neutral-900' : 'text-neutral-600'}`}>
                      {email.fromPersonal || email.from || '(Không rõ)'}
                    </span>
                    {email.hasAttachments && <Paperclip size={11} className="text-neutral-300 flex-shrink-0" />}
                    <span className="text-xs text-neutral-400 ml-auto whitespace-nowrap flex-shrink-0">
                      {formatDate(email.sentDate)}
                    </span>
                  </div>
                  <div className={`text-sm truncate mt-0.5 ${!email.seen ? 'font-medium text-neutral-800' : 'text-neutral-500'}`}>
                    {email.subject || <span className="italic text-neutral-400">(Không có tiêu đề)</span>}
                  </div>
                  <div className="text-xs text-neutral-400 truncate mt-0.5 leading-relaxed">
                    {email.bodyPreview || ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}