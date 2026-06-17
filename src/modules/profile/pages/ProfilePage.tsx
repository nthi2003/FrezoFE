import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  User, Mail, Shield, Calendar, Clock, Monitor, Smartphone, Globe,
  CheckCircle2, XCircle, Loader2, Camera, FileText, Award, Trophy,
  ChevronRight, Trash2, Upload, Download, UserCircle, History,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { profileApi } from '../services/profileApi'
import type { ProfileInfo, LoginHistoryItem, PersonDocument } from '../services/profileApi'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Tab = 'info' | 'history' | 'cv' | 'certificates' | 'achievements'

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'info', label: 'Thông tin cá nhân', icon: UserCircle },
  { key: 'history', label: 'Lịch sử đăng nhập', icon: History },
  { key: 'cv', label: 'CV', icon: FileText },
  { key: 'certificates', label: 'Chứng chỉ', icon: Award },
  { key: 'achievements', label: 'Thành tích', icon: Trophy },
]

/* ====== InfoRow ====== */
function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
        <Icon size={15} className="text-primary-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-neutral-500">{label}</div>
        <div className="text-sm font-medium text-neutral-800 truncate mt-0.5">
          {value || '---'}
        </div>
      </div>
    </div>
  )
}

/* ====== Login History ====== */
function StatusBadge({ status }: { status: string }) {
  const isSuccess = status === 'SUCCESS'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
      isSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
    }`}>
      {isSuccess ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
      {isSuccess ? 'Thành công' : 'Thất bại'}
    </span>
  )
}

function parseUserAgent(ua: string): { icon: any; label: string } {
  const lower = ua.toLowerCase()
  if (lower.includes('windows')) return { icon: Monitor, label: 'Windows' }
  if (lower.includes('mac') || lower.includes('darwin')) return { icon: Monitor, label: 'macOS' }
  if (lower.includes('linux')) return { icon: Monitor, label: 'Linux' }
  if (lower.includes('iphone') || lower.includes('ipad')) return { icon: Smartphone, label: 'iOS' }
  if (lower.includes('android')) return { icon: Smartphone, label: 'Android' }
  return { icon: Globe, label: 'Unknown' }
}

function LoginHistoryCard({ item }: { item: LoginHistoryItem }) {
  const device = parseUserAgent(item.userAgent)
  const DeviceIcon = device.icon
  const time = new Date(item.loginTime)
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
        <DeviceIcon size={15} className="text-neutral-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-800">{device.label}</span>
          <StatusBadge status={item.status} />
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-neutral-500">{item.ipAddress}</span>
          <span className="text-xs text-neutral-400">
            {time.toLocaleDateString('vi-VN')} {time.toLocaleTimeString('vi-VN')}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ====== Document Section ====== */
function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocumentCard({
  doc,
  onDelete,
  deleting,
}: {
  doc: PersonDocument
  onDelete: () => void
  deleting: boolean
}) {
  const [previewOpen, setPreviewOpen] = useState(false)

  const isImage = doc.fileName ? /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(doc.fileName) : false

  async function handleDownload(e?: React.MouseEvent) {
    e?.stopPropagation()
    try {
      const response = await fetch(doc.fileUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.fileName || doc.title || 'download'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      const a = document.createElement('a')
      a.href = doc.fileUrl
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.click()
      a.remove()
    }
  }

  return (
    <>
      <div
        className="flex items-center gap-3 py-3 px-4 border border-border rounded-lg cursor-pointer hover:bg-neutral-50 transition"
        onClick={() => setPreviewOpen(true)}
      >
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
          <FileText size={18} className="text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-800 truncate">
            {doc.title || doc.fileName || 'Không có tiêu đề'}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {doc.fileName && `${doc.fileName} · `}
            {formatFileSize(doc.fileSize)}
            {doc.createdDate && ` · ${new Date(doc.createdDate).toLocaleDateString('vi-VN')}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload(e) }}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-primary-600 transition"
            title="Tải xuống"
          >
            <Download size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            disabled={deleting}
            className="p-2 rounded-lg hover:bg-red-50 text-neutral-500 hover:text-red-600 transition disabled:opacity-50"
            title="Xoá"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="truncate">{doc.title || doc.fileName || 'Xem tài liệu'}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="mt-4 flex flex-col items-center gap-4">
            {isImage ? (
              <img src={doc.fileUrl} alt={doc.title || ''} className="max-w-full max-h-[65vh] object-contain rounded-lg" />
            ) : (
              <iframe src={doc.fileUrl} className="w-full h-[65vh] rounded-lg border border-border" title={doc.title || ''} />
            )}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition"
            >
              <Download size={16} />
              Tải xuống
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DocumentSection({
  personId,
  type,
  emptyMessage,
}: {
  personId: string
  type: 'CV' | 'CERTIFICATE' | 'ACHIEVEMENT'
  emptyMessage: string
}) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: docs, isLoading } = useQuery({
    queryKey: ['person-documents', personId, type],
    queryFn: () => profileApi.getDocuments(personId, type),
  })

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await profileApi.uploadDocument(personId, type, file, file.name)
      queryClient.invalidateQueries({ queryKey: ['person-documents', personId, type] })
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDelete(docId: string) {
    setDeletingId(docId)
    try {
      await profileApi.deleteDocument(personId, docId)
      queryClient.invalidateQueries({ queryKey: ['person-documents', personId, type] })
    } catch (err) {
      console.error('Delete failed', err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-neutral-500">
          {type === 'CV' ? 'Tải lên CV của bạn' : type === 'CERTIFICATE' ? 'Chứng chỉ đã đạt được' : 'Thành tích nổi bật'}
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Đang tải...' : 'Tải lên'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={type === 'CV' ? '.pdf,.doc,.docx' : 'image/*,.pdf'}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-primary-600" />
        </div>
      ) : !docs || docs.length === 0 ? (
        <div className="py-8 text-center text-sm text-neutral-500 border-2 border-dashed border-border rounded-lg">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={() => handleDelete(doc.id)}
              deleting={deletingId === doc.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ====== Main Component ====== */
export function ProfilePage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('info')

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  })

  const { data: loginHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['login-history'],
    queryFn: profileApi.getLoginHistory,
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: (avatarUrl) => {
      setPreviewUrl(null)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      if (avatarUrl && user) {
        useAuthStore.getState().setUser({ ...user, avatar: avatarUrl })
      }
    },
  })

  function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    uploadMutation.mutate(file)
    e.target.value = ''
  }

  const fallbackLetter = user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'

  if (profileLoading) {
    return (
      <div className="animate-fade-in p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-primary-600" />
      </div>
    )
  }

  const p = profile as ProfileInfo | undefined
  const currentAvatar = previewUrl || p?.avatarUrl
  const personId = p?.personId

  /* ---- Render tab content ---- */
  function renderContent() {
    switch (activeTab) {
      /* ========== INFO ========== */
      case 'info':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-border p-5">
              <h2 className="text-sm font-semibold text-neutral-800 mb-1">Thông tin cá nhân</h2>
              <p className="text-xs text-neutral-500 mb-4">Thông tin tài khoản của bạn</p>
              <div>
                <InfoRow icon={User} label="Tên đăng nhập" value={p?.username || user?.username} />
                <InfoRow icon={Mail} label="Email" value={p?.email || user?.email} />
                <InfoRow icon={User} label="Họ và tên" value={p?.name || user?.fullName} />
                <InfoRow icon={Smartphone} label="Số điện thoại" value={p?.phone} />
                <InfoRow icon={User} label="Chức danh" value={p?.jobTitle} />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <h2 className="text-sm font-semibold text-neutral-800 mb-1">Thông tin tài khoản</h2>
              <p className="text-xs text-neutral-500 mb-4">Chi tiết bảo mật tài khoản</p>
              <div>
                <InfoRow icon={Shield} label="Vai trò" value={user?.roles?.join(', ') || '---'} />
                <InfoRow icon={Calendar} label="Ngày tham gia" value={undefined} />
                <InfoRow icon={Clock} label="Lần cuối hoạt động" value={undefined} />
              </div>
            </div>
          </div>
        )

      /* ========== LOGIN HISTORY ========== */
      case 'history':
        return (
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-neutral-800">Lịch sử đăng nhập</h2>
              <Clock size={14} className="text-neutral-400" />
            </div>
            <p className="text-xs text-neutral-500 mb-4">Các phiên đăng nhập gần đây</p>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-primary-600" />
              </div>
            ) : !loginHistory || loginHistory.length === 0 ? (
              <div className="py-8 text-center text-sm text-neutral-500">
                Chưa có lịch sử đăng nhập
              </div>
            ) : (
              <div>
                {loginHistory.slice(0, 10).map((item: LoginHistoryItem) => (
                  <LoginHistoryCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )

      /* ========== CV ========== */
      case 'cv':
        return (
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-neutral-800 mb-1">CV</h2>
            {personId ? (
              <DocumentSection personId={personId} type="CV" emptyMessage='Chưa có CV nào. Nhấn "Tải lên" để thêm.' />
            ) : (
              <p className="py-8 text-center text-sm text-neutral-500">Chưa có thông tin nhân sự</p>
            )}
          </div>
        )

      /* ========== CERTIFICATES ========== */
      case 'certificates':
        return (
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-neutral-800 mb-1">Chứng chỉ</h2>
            {personId ? (
              <DocumentSection personId={personId} type="CERTIFICATE" emptyMessage="Chưa có chứng chỉ nào." />
            ) : (
              <p className="py-8 text-center text-sm text-neutral-500">Chưa có thông tin nhân sự</p>
            )}
          </div>
        )

      /* ========== ACHIEVEMENTS ========== */
      case 'achievements':
        return (
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-neutral-800 mb-1">Thành tích</h2>
            {personId ? (
              <DocumentSection personId={personId} type="ACHIEVEMENT" emptyMessage="Chưa có thành tích nào." />
            ) : (
              <p className="py-8 text-center text-sm text-neutral-500">Chưa có thông tin nhân sự</p>
            )}
          </div>
        )
    }
  }

  return (
    <div className="animate-fade-in p-6 max-w-6xl mx-auto">
      {/* Profile header — always visible */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {currentAvatar ? (
              <img src={currentAvatar} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold uppercase">{fallbackLetter}</span>
              </div>
            )}
            <button
              onClick={handleAvatarClick}
              disabled={uploadMutation.isPending}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-neutral-50 transition disabled:opacity-50 cursor-pointer"
              title="Đổi ảnh đại diện"
            >
              {uploadMutation.isPending ? (
                <Loader2 size={14} className="animate-spin text-primary-600" />
              ) : (
                <Camera size={14} className="text-neutral-600" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" className="hidden" onChange={handleFileChange} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-neutral-900">{p?.name || user?.fullName}</h1>
            <p className="text-sm text-neutral-500 mt-0.5">{p?.jobTitle || 'Chưa có chức danh'}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                <Shield size={12} />
                {user?.isAdmin || p?.isAdmin ? 'Quản trị viên' : 'Người dùng'}
              </span>
              {user?.roles?.map((role) => (
                <span key={role} className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">{role}</span>
              ))}
            </div>
            {uploadMutation.isError && (
              <p className="text-xs text-red-600 mt-2">Tải ảnh thất bại: {(uploadMutation.error as any)?.message || 'Lỗi không xác định'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Layout: sidebar + content */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-56 shrink-0">
          <div className="bg-white rounded-xl border border-border p-2 space-y-0.5 sticky top-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Icon size={16} />
                  <span className="flex-1 text-left">{tab.label}</span>
                  <ChevronRight size={14} className={active ? 'text-primary-500' : 'text-neutral-300'} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
