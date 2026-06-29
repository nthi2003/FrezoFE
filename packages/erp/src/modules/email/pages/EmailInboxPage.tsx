import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Inbox, Send, FileText, Trash2, Star, AlertTriangle, ChevronLeft, ChevronRight,
  RefreshCw, Search, Paperclip, Clock, Mail, MailOpen, Archive, MoreHorizontal,
  Menu, X, MessageSquare, Reply, Forward, Eye, EyeOff, Pencil,
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
      <div className="p-6 animate-fade-in">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center max-w-md">
            <Mail className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
            <h2 className="text-lg font-semibold text-neutral-700 mb-2">Chưa có cấu hình email</h2>
            <p className="text-sm text-neutral-400 mb-4">Vui lòng tạo và kích hoạt cấu hình email trước khi sử dụng hộp thư.</p>
            <Button onClick={() => window.location.href = '/email/config'} className="bg-primary-600 hover:bg-primary-700 text-white">
              Đến cấu hình email
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex animate-fade-in">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-56' : 'w-0'} transition-all duration-200 border-r border-border bg-white flex-shrink-0 overflow-hidden`}>
        <div className="p-3">
          <Button
            onClick={() => navigate('/email/compose')}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full text-sm gap-2"
          >
            <Menu size={15} /> Soạn thư
          </Button>
        </div>
        <nav className="space-y-0.5 px-2">
          {FOLDERS.map(f => {
            const Icon = f.icon
            const isActive = folder === f.key
            const count = f.key === 'inbox' ? unreadCount : 0
            return (
              <button
                key={f.key}
                onClick={() => { setFolder(f.key); setSelectedEmail(null); setSelectedIds(new Set()) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Icon size={17} className={isActive ? 'text-primary-600' : 'text-neutral-400'} />
                <span className="flex-1 text-left truncate">{f.label}</span>
                {count > 0 && (
                  <span className="text-xs font-bold bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
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
        className="flex-shrink-0 w-6 flex items-center justify-center border-r border-border hover:bg-neutral-50 text-neutral-400"
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {selectedEmail ? (
        /* Email Detail View */
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
              <ChevronLeft size={18} />
            </Button>
            <div className="flex items-center gap-1 ml-auto">
              <Button variant="ghost" size="sm" onClick={() => { /* TODO: reply */ }} title="Trả lời">
                <Reply size={15} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { /* TODO: forward */ }} title="Chuyển tiếp">
                <Forward size={15} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { /* TODO: archive */ }} title="Lưu trữ">
                <Archive size={15} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { /* TODO: delete */ }} title="Xóa">
                <Trash2 size={15} className="text-red-500" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <h1 className="text-xl font-semibold text-neutral-900">{selectedEmail.subject || '(Không có tiêu đề)'}</h1>
            <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {(selectedEmail.fromPersonal || selectedEmail.from || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-900">{selectedEmail.fromPersonal || selectedEmail.from}</div>
                <div className="text-xs text-neutral-400">{selectedEmail.from}</div>
                <div className="text-xs text-neutral-400 mt-1">
                  Đến: {(selectedEmail.to || []).join(', ')}
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  {formatDate(selectedEmail.sentDate)}
                </div>
              </div>
            </div>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml || '<p class="text-neutral-400">(Không có nội dung)</p>' }} />
            {selectedEmail.hasAttachments && selectedEmail.attachmentNames && (
              <div className="border-t pt-4">
                <p className="text-xs font-medium text-neutral-500 mb-2 flex items-center gap-1">
                  <Paperclip size={12} /> Tệp đính kèm ({selectedEmail.attachmentNames.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedEmail.attachmentNames.map((name, i) => (
                    <span key={i} className="text-xs bg-neutral-100 px-2 py-1 rounded flex items-center gap-1">
                      <Paperclip size={10} /> {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Email List */
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b border-border">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={selectAll} title="Chọn tất cả">
                <div className={`w-4 h-4 rounded border ${selectedIds.size === filteredEmails?.length && filteredEmails?.length > 0 ? 'bg-primary-600 border-primary-600' : 'border-neutral-300'} flex items-center justify-center`}>
                  {selectedIds.size === filteredEmails?.length && filteredEmails?.length > 0 && <span className="text-white text-[10px]">✓</span>}
                </div>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => refetch()} title="Làm mới">
                <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              </Button>
            </div>
            <div className="relative flex-1 max-w-md ml-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm email..."
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="text-xs text-neutral-400 ml-auto">
              {filteredEmails ? `${filteredEmails.length} email` : ''}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center h-32">
                <RefreshCw size={20} className="animate-spin text-neutral-300" />
              </div>
            )}
            {!isLoading && filteredEmails?.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MailOpen className="w-16 h-16 mx-auto mb-3 text-neutral-200" />
                  <p className="text-sm text-neutral-500 font-medium">Thư mục trống</p>
                  <p className="text-xs text-neutral-400 mt-1">Không có email nào</p>
                </div>
              </div>
            )}
            {filteredEmails?.map((email: EmailItem) => (
              <button
                key={email.messageId}
                onClick={() => handleSelectEmail(email)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-border hover:bg-neutral-50 transition-colors ${
                  !email.seen ? 'bg-blue-50/40' : ''
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
                <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
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
                    {email.subject || '(Không có tiêu đề)'}
                  </div>
                  <div className="text-xs text-neutral-400 truncate mt-0.5">
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