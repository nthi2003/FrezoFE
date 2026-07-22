import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  Monitor,
  Smartphone,
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
  Camera,
  FileText,
  Award,
  Trophy,
  Trash2,
  Upload,
  Download,
  UserCircle,
  History,
  Briefcase,
  Building2,
  Phone,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { profileApi } from '../services/profileApi'
import type { ProfileInfo, LoginHistoryItem, PersonDocument } from '../services/profileApi'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  PageGuideButton,
  type PageGuideConfig,
} from '@frezo/ui'

// ============================================================
// Tabs
// ============================================================

type Tab = 'info' | 'history' | 'cv' | 'certificates' | 'achievements'

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'info', label: 'Thông tin', icon: UserCircle },
  { key: 'history', label: 'Đăng nhập', icon: History },
  { key: 'cv', label: 'CV', icon: FileText },
  { key: 'certificates', label: 'Chứng chỉ', icon: Award },
  { key: 'achievements', label: 'Thành tích', icon: Trophy },
]

// ============================================================
// Page guide
// ============================================================

const PROFILE_GUIDE: PageGuideConfig = {
  title: 'Hồ sơ cá nhân',
  subtitle:
    'Xem và quản lý thông tin tài khoản, tài liệu (CV, chứng chỉ), phiên đăng nhập gần đây.',
  sections: [
    {
      heading: 'Cập nhật thông tin',
      type: 'steps',
      steps: [
        {
          title: 'Đổi ảnh đại diện',
          description:
            'Click vào biểu tượng máy ảnh trên avatar, chọn ảnh (JPG/PNG, tối đa 5MB). Ảnh mới hiển thị ngay sau khi upload thành công.',
        },
        {
          title: 'Kiểm tra thông tin cá nhân',
          description:
            'Vào tab "Thông tin" để xem tên, email, chức danh, phòng ban. Thông tin nhân sự đồng bộ từ module HR — liên hệ HR để sửa dữ liệu master.',
        },
        {
          title: 'Tải CV / chứng chỉ / thành tích',
          description:
            'Chuyển sang tab tương ứng, nhấn "Tải lên" và chọn file (PDF/DOC cho CV, PDF/ảnh cho chứng chỉ). File được lưu vào tài khoản của bạn.',
        },
      ],
    },
    {
      heading: 'Bảo mật tài khoản',
      type: 'tips',
      tips: [
        'Vào tab "Đăng nhập" để xem lịch sử phiên gần đây — nếu thấy phiên lạ (IP/thiết bị bất thường), đổi mật khẩu ngay và liên hệ IT.',
        'Không dùng chung tài khoản với người khác. Mọi thao tác đều được audit theo username.',
        'File tài liệu upload chỉ bạn và HR nhìn thấy được — không public ra ngoài landing.',
      ],
    },
    {
      heading: 'Ghi chú',
      type: 'notes',
      notes: (
        <>
          Nếu tab hiển thị <strong>"Chưa có thông tin nhân sự"</strong>, tài khoản của bạn chưa được liên kết với record trong Quản lý Nhân viên (QLNS). Liên hệ HR để được tạo person record — sau đó tab CV / Chứng chỉ / Thành tích sẽ hoạt động.
        </>
      ),
    },
  ],
}

// ============================================================
// Helpers
// ============================================================

function parseUserAgent(ua: string): { icon: any; label: string } {
  const lower = (ua || '').toLowerCase()
  if (lower.includes('windows')) return { icon: Monitor, label: 'Windows' }
  if (lower.includes('mac') || lower.includes('darwin')) return { icon: Monitor, label: 'macOS' }
  if (lower.includes('linux')) return { icon: Monitor, label: 'Linux' }
  if (lower.includes('iphone') || lower.includes('ipad')) return { icon: Smartphone, label: 'iOS' }
  if (lower.includes('android')) return { icon: Smartphone, label: 'Android' }
  return { icon: Globe, label: 'Thiết bị khác' }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(v?: string | null) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('vi-VN')
}

// ============================================================
// Sub-components
// ============================================================

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-primary-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-neutral-500">{label}</div>
        <div className="text-sm font-medium text-neutral-800 truncate mt-0.5">
          {value || '—'}
        </div>
      </div>
    </div>
  )
}

function StatusBadgeMini({ status }: { status: string }) {
  const isSuccess = status === 'SUCCESS'
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
        isSuccess ? 'bg-success-light text-success-dark' : 'bg-danger-light text-danger-dark'
      }`}
    >
      {isSuccess ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
      {isSuccess ? 'Thành công' : 'Thất bại'}
    </span>
  )
}

function LoginHistoryRow({ item }: { item: LoginHistoryItem }) {
  const device = parseUserAgent(item.userAgent)
  const DeviceIcon = device.icon
  const time = new Date(item.loginTime)
  return (
    <div className="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
        <DeviceIcon size={16} className="text-neutral-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-neutral-800">{device.label}</span>
          <StatusBadgeMini status={item.status} />
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-neutral-500">{item.ipAddress || '—'}</span>
          <span className="text-xs text-neutral-400">
            {time.toLocaleDateString('vi-VN')} {time.toLocaleTimeString('vi-VN')}
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Document section
// ============================================================

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
      const response = await fetch(doc.fileUrl || '')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.fileName || doc.title || 'download'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      const a = document.createElement('a')
      a.href = doc.fileUrl || ''
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.click()
      a.remove()
    }
  }

  return (
    <>
      <div
        className="flex items-center gap-3 py-3 px-4 border border-neutral-200 rounded-lg cursor-pointer hover:bg-primary-50/30 hover:border-primary-200 transition group"
        onClick={() => setPreviewOpen(true)}
      >
        <div className="w-11 h-11 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition">
          <FileText size={20} className="text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-800 truncate">
            {doc.title || doc.fileName || 'Không có tiêu đề'}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {doc.fileName && `${doc.fileName} · `}
            {formatFileSize(doc.fileSize)}
            {doc.createdDate && ` · ${formatDate(doc.createdDate)}`}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDownload(e)
            }}
            className="p-2 rounded-lg hover:bg-white text-neutral-500 hover:text-primary-600 transition"
            title="Tải xuống"
          >
            <Download size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            disabled={deleting}
            className="p-2 rounded-lg hover:bg-white text-neutral-500 hover:text-danger transition disabled:opacity-50"
            title="Xoá"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">
              {doc.title || doc.fileName || 'Xem tài liệu'}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex flex-col items-center gap-4">
            {isImage ? (
              <img
                src={doc.fileUrl}
                alt={doc.title || ''}
                className="max-w-full max-h-[65vh] object-contain rounded-lg"
              />
            ) : (
              <iframe
                src={doc.fileUrl}
                className="w-full h-[65vh] rounded-lg border border-neutral-200"
                title={doc.title || ''}
              />
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
  emptyIcon: EmptyIcon,
  emptyMessage,
}: {
  personId: string
  type: 'CV' | 'CERTIFICATE' | 'ACHIEVEMENT'
  emptyIcon: any
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
          {type === 'CV'
            ? 'Chấp nhận .pdf, .doc, .docx — tối đa 10MB.'
            : type === 'CERTIFICATE'
              ? 'Chấp nhận PDF hoặc ảnh — tối đa 10MB mỗi file.'
              : 'Bằng khen, thành tích, giấy chứng nhận…'}
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
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
        <div className="flex items-center justify-center py-10">
          <Loader2 size={22} className="animate-spin text-primary-600" />
        </div>
      ) : !docs || docs.length === 0 ? (
        <div className="py-10 flex flex-col items-center text-center border-2 border-dashed border-neutral-200 rounded-lg bg-neutral-50/40">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-neutral-400 mb-3 border border-neutral-200">
            <EmptyIcon size={22} strokeWidth={1.6} />
          </div>
          <p className="text-sm font-medium text-neutral-700">{emptyMessage}</p>
          <p className="text-xs text-neutral-500 mt-1">
            Nhấn nút "Tải lên" ở góc trên để bắt đầu.
          </p>
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

// ============================================================
// Main Page
// ============================================================

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

  // KPI derived
  const successCount = useMemo(
    () => (loginHistory || []).filter((x) => x.status === 'SUCCESS').length,
    [loginHistory],
  )
  const lastLogin = useMemo(() => {
    const sorted = [...(loginHistory || [])].sort(
      (a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime(),
    )
    return sorted[0]?.loginTime
  }, [loginHistory])

  if (profileLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 size={28} className="animate-spin text-primary-600" />
      </div>
    )
  }

  const p = profile as ProfileInfo | undefined
  const currentAvatar = previewUrl || p?.avatarUrl
  const personId = p?.personId
  const isAdmin = user?.isAdmin || p?.isAdmin

  const kpi = [
    { label: 'Vai trò', value: isAdmin ? 'Quản trị viên' : 'Người dùng', icon: Shield },
    { label: 'Chức danh', value: p?.jobTitle || 'Chưa cập nhật', icon: Briefcase },
    { label: 'Đơn vị', value: p?.orgId || '—', icon: Building2 },
    { label: 'Đăng nhập cuối', value: lastLogin ? formatDate(lastLogin) : '—', icon: Clock },
    { label: 'Phiên thành công', value: `${successCount}`, icon: CheckCircle2 },
  ]

  // ============================================================
  // Tab content
  // ============================================================

  function renderContent() {
    switch (activeTab) {
      case 'info':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SectionCard
              title="Thông tin cá nhân"
              description="Dữ liệu đồng bộ từ HR — sửa ở module Quản lý Nhân viên."
            >
              <InfoRow icon={User} label="Tên đăng nhập" value={p?.username || user?.username} />
              <InfoRow icon={User} label="Họ và tên" value={p?.name || user?.fullName} />
              <InfoRow icon={Mail} label="Email" value={p?.email || user?.email} />
              <InfoRow icon={Phone} label="Số điện thoại" value={p?.phone} />
              <InfoRow icon={Briefcase} label="Chức danh" value={p?.jobTitle} />
              <InfoRow icon={Building2} label="Đơn vị" value={p?.orgId} />
            </SectionCard>
            <SectionCard
              title="Bảo mật & Vai trò"
              description="Vai trò và trạng thái tài khoản hệ thống."
            >
              <InfoRow icon={Shield} label="Vai trò" value={user?.roles?.join(', ') || '—'} />
              <InfoRow icon={UserCircle} label="Loại tài khoản" value={isAdmin ? 'Quản trị viên' : 'Người dùng'} />
              <InfoRow icon={Calendar} label="Ngày tham gia" value={undefined} />
              <InfoRow icon={Clock} label="Đăng nhập gần nhất" value={lastLogin ? formatDate(lastLogin) : '—'} />
            </SectionCard>
          </div>
        )

      case 'history':
        return (
          <SectionCard
            title="Lịch sử đăng nhập"
            description="10 phiên gần đây, phát hiện bất thường IP/thiết bị."
          >
            {historyLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={22} className="animate-spin text-primary-600" />
              </div>
            ) : !loginHistory || loginHistory.length === 0 ? (
              <div className="py-10 text-center text-sm text-neutral-500">
                Chưa có lịch sử đăng nhập
              </div>
            ) : (
              <div>
                {loginHistory.slice(0, 10).map((item) => (
                  <LoginHistoryRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </SectionCard>
        )

      case 'cv':
        return (
          <SectionCard title="CV cá nhân" description="Sơ yếu lý lịch, hồ sơ nghề nghiệp.">
            {personId ? (
              <DocumentSection
                personId={personId}
                type="CV"
                emptyIcon={FileText}
                emptyMessage="Chưa có CV nào"
              />
            ) : (
              <NoPersonNotice />
            )}
          </SectionCard>
        )

      case 'certificates':
        return (
          <SectionCard title="Chứng chỉ" description="Chứng chỉ chuyên môn, kỹ năng đã đạt được.">
            {personId ? (
              <DocumentSection
                personId={personId}
                type="CERTIFICATE"
                emptyIcon={Award}
                emptyMessage="Chưa có chứng chỉ nào"
              />
            ) : (
              <NoPersonNotice />
            )}
          </SectionCard>
        )

      case 'achievements':
        return (
          <SectionCard title="Thành tích" description="Bằng khen, danh hiệu, thành tích nổi bật.">
            {personId ? (
              <DocumentSection
                personId={personId}
                type="ACHIEVEMENT"
                emptyIcon={Trophy}
                emptyMessage="Chưa có thành tích nào"
              />
            ) : (
              <NoPersonNotice />
            )}
          </SectionCard>
        )
    }
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-neutral-50/40 pb-10">
      {/* Hero cover banner */}
      <div className="relative h-40 md:h-48 overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-blue-500">
        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -top-8 -right-8 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -mb-40" />

        {/* Guide button top-right */}
        <div className="absolute top-4 right-4 md:right-6">
          <PageGuideButton
            guide={PROFILE_GUIDE}
            className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white hover:border-white/50 backdrop-blur"
          />
        </div>
      </div>

      {/* Content container */}
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Avatar + name — overlap on hero */}
        <div className="-mt-16 md:-mt-20 flex flex-col md:flex-row md:items-end gap-5">
          <div className="relative shrink-0 self-start md:self-auto">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="avatar"
                className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-white shadow-lg bg-neutral-100"
              />
            ) : (
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
                <span className="text-white text-4xl md:text-5xl font-bold uppercase">
                  {fallbackLetter}
                </span>
              </div>
            )}
            <button
              onClick={handleAvatarClick}
              disabled={uploadMutation.isPending}
              className="absolute -bottom-1 -right-1 w-9 h-9 bg-white border border-neutral-200 rounded-full flex items-center justify-center shadow-md hover:bg-neutral-50 hover:shadow-lg transition disabled:opacity-50 cursor-pointer"
              title="Đổi ảnh đại diện"
            >
              {uploadMutation.isPending ? (
                <Loader2 size={16} className="animate-spin text-primary-600" />
              ) : (
                <Camera size={16} className="text-neutral-600" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Name + roles */}
          <div className="flex-1 min-w-0 md:mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 truncate">
              {p?.name || user?.fullName || user?.username}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <User size={13} /> @{p?.username || user?.username}
              </span>
              {p?.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail size={13} /> {p.email}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isAdmin ? 'bg-primary-600 text-white shadow-sm' : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                <Shield size={12} />
                {isAdmin ? 'Quản trị viên' : 'Người dùng'}
              </span>
              {(user?.roles || []).map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-white text-neutral-700 text-xs font-medium border border-neutral-200"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        {uploadMutation.isError && (
          <div className="mt-4 px-3 py-2 rounded-md bg-danger-light text-danger-dark text-sm">
            Tải ảnh thất bại: {(uploadMutation.error as any)?.message || 'Lỗi không xác định'}
          </div>
        )}

        {/* KPI Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpi.map((k, idx) => {
            const Icon = k.icon
            return (
              <div
                key={idx}
                className="bg-white border border-neutral-200 rounded-xl p-3.5 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-neutral-500 truncate">
                    {k.label}
                  </div>
                  <div className="text-sm font-semibold text-neutral-800 truncate">
                    {k.value}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Tab pills */}
        <div className="mt-6 border-b border-neutral-200">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition
                    ${active
                      ? 'text-primary-700 border-primary-600'
                      : 'text-neutral-500 border-transparent hover:text-neutral-700 hover:border-neutral-300'}
                  `}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="mt-5">{renderContent()}</div>
      </div>
    </div>
  )
}

// ============================================================
// Small helpers
// ============================================================

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
        {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function NoPersonNotice() {
  return (
    <div className="py-10 flex flex-col items-center text-center border-2 border-dashed border-neutral-200 rounded-lg bg-neutral-50/40">
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-neutral-400 mb-3 border border-neutral-200">
        <User size={22} strokeWidth={1.6} />
      </div>
      <p className="text-sm font-medium text-neutral-700">Chưa có thông tin nhân sự</p>
      <p className="text-xs text-neutral-500 mt-1 max-w-xs">
        Tài khoản chưa liên kết với record trong Quản lý Nhân viên. Liên hệ HR để tạo person record.
      </p>
    </div>
  )
}
