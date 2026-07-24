import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutTemplate,
  FileText,
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Database,
  ExternalLink,
  MoreHorizontal,
  RotateCcw,
  Save,
  CheckCircle2,
  XCircle,
  Palette,
  Phone,
  Type,
  Newspaper,
  Package,
  Workflow,
  Mail,
  Info,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Copy,
  Search,
  Share2,
  BarChart3,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import axiosClient from '@/lib/axios/axiosClient'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import {
  Button,
  Input,
  Label,
  AppModal,
  PageHeader,
  EmptyState,
  ImageUploader,
} from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import { AppForm } from '@/components/shared/AppForm'
import { useForm } from 'react-hook-form'
import { useLandingConfig, useUpdateLandingConfig } from '../hooks/useLandingConfig'
import {
  useArticles,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
} from '@/modules/articles/hooks/useArticle'
import {
  useBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
} from '../hooks/useBanner'
import { bannerFormSchema, type BannerFormValues } from '../constants/banner.schema'
import { makeImageUploader } from '@/lib/upload'
import { LandingPreview, type PreviewDevice, type LandingConfigLite } from '../components/LandingPreview'

// ============================================================
// Constants
// ============================================================

/** URL landing page (dev / prod) — cấu hình qua VITE_LANDING_URL, fallback dev 3001. */
const LANDING_URL = (import.meta as any).env?.VITE_LANDING_URL || 'http://localhost:3001'

const TABS = [
  { key: 'config',   label: 'Cấu hình',           icon: LayoutTemplate },
  { key: 'preview',  label: 'Xem trước (full)',   icon: Eye },
  { key: 'articles', label: 'Bài viết & Tin tức', icon: FileText },
  { key: 'banners',  label: 'Banner',             icon: ImageIcon },
] as const

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
]

const BANNER_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Ẩn' },
]

const BANNER_POSITIONS = [
  { value: 'hero', label: 'Hero Slider', aspectRatio: '21/9', hint: 'Tỉ lệ 21:9 (~1920×820)' },
  { value: 'promo', label: 'Khuyến mãi', aspectRatio: '4/1', hint: 'Tỉ lệ 4:1 (~1600×400)' },
  { value: 'banner', label: 'Banner phụ', aspectRatio: '3/1', hint: 'Tỉ lệ 3:1 (~1200×400)' },
] as const

const ARTICLE_TYPES = [
  { value: '',       label: 'Tất cả loại' },
  { value: 'BLOG',   label: 'Bài viết' },
  { value: 'NEWS',   label: 'Tin tức' },
  { value: 'EVENT',  label: 'Sự kiện' },
  { value: 'PROMO',  label: 'Khuyến mãi' },
]

const FORM_SECTIONS = [
  {
    key: 'brand',
    title: 'Thương hiệu',
    icon: Palette,
    description: 'Logo, tên hiển thị và màu chủ đạo cho toàn bộ landing page.',
    fields: [
      { name: 'brandName',    label: 'Tên thương hiệu',  placeholder: 'Frezo - Cung ứng thực phẩm toàn quốc' },
      { name: 'logoUrl',      label: 'Logo',              type: 'image' as const, folder: 'landing/logo', maxSizeMB: 3, aspectRatio: '3/1', hint: 'Nền trong suốt (PNG/SVG), tối đa 3MB.' },
      { name: 'faviconUrl',   label: 'Favicon (32×32)',   type: 'image' as const, folder: 'landing/favicon', maxSizeMB: 1, aspectRatio: '1/1', hint: 'Icon vuông hiển thị trên tab trình duyệt.' },
      { name: 'primaryColor', label: 'Màu chủ đạo',       type: 'color' as const, placeholder: '#16a34a' },
    ],
  },
  {
    key: 'hero',
    title: 'Hero Section',
    icon: Type,
    description: 'Banner đầu trang — quyết định ấn tượng đầu tiên của khách. Ảnh hero là LCP (Largest Contentful Paint) — dùng ảnh dưới 200KB.',
    fields: [
      { name: 'heroTitle',     label: 'Tiêu đề Hero',   placeholder: 'Rau Củ Tươi Sạch\nTrực Tiếp Nông Trại', hint: 'Xuống dòng \\n để tạo hiệu ứng title 2 dòng gradient.', type: 'textarea' as const, rows: 2 },
      { name: 'heroSubtitle',  label: 'Phụ đề Hero',    type: 'textarea' as const, fullWidth: true, rows: 3 },
      { name: 'heroImageUrl',  label: 'Ảnh Hero',       type: 'image' as const, folder: 'landing/hero', maxSizeMB: 5, aspectRatio: '4/3', hint: 'Ảnh minh họa (WebP < 200KB). Đây là LCP.', fullWidth: true },
    ],
  },
  {
    key: 'seo',
    title: 'SEO & Meta',
    icon: Search,
    description: 'Tiêu đề & mô tả hiển thị trên Google search + share Facebook/Zalo. Ảnh hưởng trực tiếp đến rank & CTR.',
    fields: [
      { name: 'seoTitle',       label: 'SEO Title (50-60 ký tự)',        placeholder: 'Frezo – Rau Củ Tươi Sạch VietGAP | Giao 24h', hint: 'Xuất hiện trên tab trình duyệt & Google search.', fullWidth: true },
      { name: 'seoDescription', label: 'Meta Description (150-160 ký tự)', type: 'textarea' as const, rows: 3, fullWidth: true, placeholder: 'Frezo cung ứng rau củ tươi sạch VietGAP, giao 24h toàn quốc. Automation & IoT giám sát 24/7, truy xuất QR minh bạch.' },
      { name: 'seoKeywords',    label: 'Từ khoá (phân cách bằng dấu phẩy)', placeholder: 'rau sạch, rau củ tươi, VietGAP, giao rau tận nhà', fullWidth: true },
      { name: 'ogImageUrl',     label: 'Ảnh Open Graph (1200×630)',      type: 'image' as const, folder: 'landing/og', maxSizeMB: 5, aspectRatio: '1200/630', hint: 'Ảnh hiển thị khi share link lên Facebook, Zalo, Messenger.', fullWidth: true },
      { name: 'canonicalUrl',   label: 'URL Canonical',                  placeholder: 'https://frezo.vn/', hint: 'Bắt buộc khi có nhiều domain redirect về (frezo.vn / www.frezo.vn).', fullWidth: true },
    ],
  },
  {
    key: 'contact',
    title: 'Liên hệ & Vận chuyển',
    icon: Phone,
    description: 'Thông tin xuất hiện ở footer và các nút liên hệ.',
    fields: [
      { name: 'contactEmail',   label: 'Email liên hệ',       placeholder: 'hotro@frezo.vn' },
      { name: 'contactPhone',   label: 'SĐT Hotline',         placeholder: '1900 6868' },
      { name: 'contactAddress', label: 'Địa chỉ',             placeholder: '76 Đường số 7, Bình Trưng, TP HCM', fullWidth: true },
      { name: 'workingHours',   label: 'Giờ làm việc',        placeholder: 'Thứ 2 - Chủ nhật: 7:00 - 21:00' },
      { name: 'shippingPolicy', label: 'Chính sách giao hàng',placeholder: 'Miễn phí đơn từ 500.000đ', type: 'textarea' as const, fullWidth: true },
    ],
  },
  {
    key: 'social',
    title: 'Mạng xã hội',
    icon: Share2,
    description: 'Link social hiển thị ở footer + JSON-LD structured data (giúp Google hiển thị knowledge panel).',
    fields: [
      { name: 'facebookUrl',  label: 'Facebook Fanpage', placeholder: 'https://facebook.com/frezo.vn' },
      { name: 'instagramUrl', label: 'Instagram',        placeholder: 'https://instagram.com/frezo.vn' },
      { name: 'youtubeUrl',   label: 'YouTube',          placeholder: 'https://youtube.com/@frezo' },
      { name: 'tiktokUrl',    label: 'TikTok',           placeholder: 'https://tiktok.com/@frezo.vn' },
      { name: 'zaloUrl',      label: 'Zalo OA',          placeholder: 'https://zalo.me/frezo' },
    ],
  },
  {
    key: 'analytics',
    title: 'Analytics & Tracking',
    icon: BarChart3,
    description: 'Chỉ điền ID — script tự động load. Để trống nếu chưa dùng.',
    fields: [
      { name: 'gtmId',      label: 'Google Tag Manager', placeholder: 'GTM-XXXXXXX', hint: 'Container ID bắt đầu bằng GTM-' },
      { name: 'ga4Id',      label: 'Google Analytics 4', placeholder: 'G-XXXXXXXXXX', hint: 'Measurement ID bắt đầu bằng G-' },
      { name: 'fbPixelId',  label: 'Facebook Pixel',     placeholder: '1234567890123456', hint: 'ID số nguyên (dùng cho remarketing).' },
    ],
  },
  {
    key: 'blog',
    title: 'Khối Blog',
    icon: Newspaper,
    description: 'Tiêu đề khối bài viết trên trang chủ.',
    fields: [
      { name: 'blogTitle',    label: 'Tiêu đề' },
      { name: 'blogSubtitle', label: 'Phụ đề', type: 'textarea' as const, fullWidth: true },
    ],
  },
  {
    key: 'product',
    title: 'Khối Sản phẩm',
    icon: Package,
    description: 'Tiêu đề khối sản phẩm nổi bật.',
    fields: [
      { name: 'productTitle',    label: 'Tiêu đề' },
      { name: 'productSubtitle', label: 'Phụ đề', type: 'textarea' as const, fullWidth: true },
    ],
  },
  {
    key: 'ops',
    title: 'Khối Quy trình',
    icon: Workflow,
    description: 'Giới thiệu quy trình cung ứng / vận hành.',
    fields: [
      { name: 'opsTitle',    label: 'Tiêu đề' },
      { name: 'opsSubtitle', label: 'Phụ đề', type: 'textarea' as const, fullWidth: true },
    ],
  },
  {
    key: 'newsletter',
    title: 'Newsletter',
    icon: Mail,
    description: 'Đăng ký nhận tin qua email — hiển thị ở footer.',
    fields: [
      { name: 'newsletterTitle',    label: 'Tiêu đề' },
      { name: 'newsletterSubtitle', label: 'Phụ đề', type: 'textarea' as const, fullWidth: true },
    ],
  },
  {
    key: 'about',
    title: 'Giới thiệu & Footer',
    icon: Info,
    description: 'Đoạn giới thiệu công ty và text footer.',
    fields: [
      { name: 'aboutUs',    label: 'Giới thiệu công ty', type: 'textarea' as const, rows: 4, fullWidth: true, placeholder: 'Đoạn giới thiệu ngắn về Frezo' },
      { name: 'footerText', label: 'Footer text', fullWidth: true, placeholder: '© 2026 Frezo - Cung ứng thực phẩm toàn quốc' },
    ],
  },
]

const ALL_FIELD_NAMES = FORM_SECTIONS.flatMap((s) => s.fields.map((f) => f.name))

// ============================================================
// Small UI helpers
// ============================================================

function StatusPill({ value }: { value?: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    DRAFT:     { cls: 'bg-neutral-100 text-neutral-600',   label: 'Bản nháp' },
    PUBLISHED: { cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100', label: 'Đã xuất bản' },
    ARCHIVED:  { cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',       label: 'Lưu trữ' },
  }
  const cfg = map[value || ''] || { cls: 'bg-neutral-100 text-neutral-500', label: value || '—' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
  hint,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: React.ReactNode
  tone?: 'neutral' | 'primary' | 'success' | 'warning'
  hint?: string
}) {
  const toneMap: Record<string, string> = {
    neutral: 'bg-neutral-50 text-neutral-700',
    primary: 'bg-primary-50 text-primary-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${toneMap[tone]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-neutral-500 truncate">{label}</div>
        <div className="text-lg font-bold text-neutral-900 truncate">{value}</div>
        {hint && <div className="text-[11px] text-neutral-400 truncate">{hint}</div>}
      </div>
    </div>
  )
}

/** Dropdown "..." — dùng cho actions ít gặp (seed menu, doc, etc). */
function MoreMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
        aria-label="Nhiều tuỳ chọn"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-10 z-50 min-w-[240px] rounded-lg border border-neutral-200 bg-white shadow-lg py-1"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function MoreMenuItem({
  icon: Icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  onClick: () => void
  tone?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-neutral-50 ${
        tone === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-neutral-700'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

// ============================================================
// Config Tab
// ============================================================

// ============================================================
// Constants — SEO limits chuẩn Google/Facebook
// ============================================================
const SEO_TITLE_MAX = 60
const SEO_DESC_MAX = 160
const OG_ASPECT_RATIO = '1.91/1'   // Chuẩn Open Graph 1200×630
const DEFAULT_SITE_URL = 'https://frezo.vn/'
const DEFAULT_SEO_TITLE = 'Frezo – Rau Củ Tươi Sạch VietGAP'
const DEFAULT_SEO_DESC = 'Frezo cung ứng rau củ tươi sạch VietGAP, giao 24h toàn quốc. Automation & IoT giám sát 24/7, truy xuất QR minh bạch.'

// ============================================================
// Google search snippet preview — cho section 'seo'
// ------------------------------------------------------------
// Mô phỏng chính xác cách Google hiển thị page trong SERP.
// Truncate title 60/desc 160 (chuẩn Google desktop, mobile khác vài px
// nhưng cùng ngưỡng khuyến nghị).
// ============================================================
function GoogleSnippet({ title, desc, url }: { title?: string; desc?: string; url?: string }) {
  const dispTitle = (title || DEFAULT_SEO_TITLE).slice(0, SEO_TITLE_MAX)
  const dispDesc = (desc || DEFAULT_SEO_DESC).slice(0, SEO_DESC_MAX)
  const dispUrl = url || DEFAULT_SITE_URL
  const titleLen = title?.length ?? 0
  const descLen = desc?.length ?? 0
  const titleOverflow = titleLen > SEO_TITLE_MAX
  const descOverflow = descLen > SEO_DESC_MAX

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-2 inline-flex items-center gap-1.5">
        <Search size={14} /> Google Search Preview
      </div>
      <div className="max-w-xl">
        <div className="text-xs text-neutral-700 mb-0.5 truncate">{dispUrl}</div>
        <span className="text-lg text-primary-700 font-normal leading-tight block truncate">
          {dispTitle}
        </span>
        <p className="text-sm text-neutral-600 leading-snug mt-1 line-clamp-2">{dispDesc}</p>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
        <span>
          Title:{' '}
          <strong className={titleOverflow ? 'text-danger' : 'text-primary-700'}>
            {titleLen}/{SEO_TITLE_MAX}
          </strong>
        </span>
        <span>
          Description:{' '}
          <strong className={descOverflow ? 'text-danger' : 'text-primary-700'}>
            {descLen}/{SEO_DESC_MAX}
          </strong>
        </span>
      </div>
    </div>
  )
}

// ============================================================
// Facebook / social share preview — cho section 'seo'
// ------------------------------------------------------------
// Cùng preview cho Zalo/Messenger vì cùng chuẩn Open Graph.
// Aspect 1.91:1 = 1200×630 (chuẩn OG image).
// ============================================================
function FacebookSnippet({ title, desc, ogImage, url }: { title?: string; desc?: string; ogImage?: string; url?: string }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-2 inline-flex items-center gap-1.5">
        <Share2 size={14} /> Facebook / Zalo Share Preview
      </div>
      <div className="max-w-md border border-neutral-200 rounded-lg overflow-hidden">
        <div
          className="bg-neutral-100 flex items-center justify-center text-neutral-400 relative"
          style={{ aspectRatio: OG_ASPECT_RATIO }}
        >
          {ogImage ? (
            <img
              src={ogImage}
              alt="Ảnh Open Graph"
              className="w-full h-full object-cover"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
            />
          ) : (
            <div className="text-center">
              <ImageIcon size={24} className="mx-auto mb-1" />
              <div className="text-xs">Thêm ảnh OG 1200×630</div>
            </div>
          )}
        </div>
        <div className="p-3 bg-neutral-50 border-t border-neutral-200">
          <div className="text-xs text-neutral-500 uppercase truncate">{url || 'frezo.vn'}</div>
          <div className="font-semibold text-sm text-neutral-900 line-clamp-1 mt-0.5">
            {title || DEFAULT_SEO_TITLE}
          </div>
          <div className="text-xs text-neutral-500 line-clamp-2 mt-0.5">
            {desc || DEFAULT_SEO_DESC}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Device switcher — Desktop / Tablet / Mobile
// ============================================================
function DeviceSwitcher({ value, onChange }: { value: PreviewDevice; onChange: (v: PreviewDevice) => void }) {
  const opts: { key: PreviewDevice; icon: LucideIcon; label: string }[] = [
    { key: 'desktop', icon: Monitor,    label: 'Desktop' },
    { key: 'tablet',  icon: Tablet,     label: 'Tablet'  },
    { key: 'mobile',  icon: Smartphone, label: 'Mobile'  },
  ]
  return (
    <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
      {opts.map((o) => {
        const Icon = o.icon
        const on = o.key === value
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            title={o.label}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              on ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Icon size={14} /> <span className="hidden md:inline">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function ConfigTab() {
  const { data, isLoading } = useLandingConfig()
  const updateReq = useUpdateLandingConfig()
  const [activeSection, setActiveSection] = useState(FORM_SECTIONS[0].key)
  const [previewOn, setPreviewOn] = useState(true)
  const [device, setDevice] = useState<PreviewDevice>('desktop')

  const emptyDefaults = useMemo(
    () => Object.fromEntries(ALL_FIELD_NAMES.map((f) => [f, ''])),
    [],
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm({ defaultValues: emptyDefaults })

  useEffect(() => {
    if (data) reset({ ...emptyDefaults, ...data })
  }, [data, reset, emptyDefaults])

  const onSubmit = (formData: any) => {
    updateReq.mutate(formData, {
      onSuccess: () => reset(formData),
    })
  }

  const section = FORM_SECTIONS.find((s) => s.key === activeSection) ?? FORM_SECTIONS[0]

  // Watch all fields → drive live preview. Small overhead vì react-hook-form
  // chỉ re-render component khi field trong watch(*) đổi giá trị.
  const liveValues = watch()
  const primaryColorValue = (liveValues.primaryColor as string) || '#16a34a'
  const updatedAt = (data as any)?.updatedAt || (data as any)?.updatedDate

  // Factory upload — cache theo folder, tránh tạo mới mỗi lần render.
  const uploaders = useMemo(() => ({
    logo:     makeImageUploader({ folder: 'landing/logo',    maxSizeMB: 3 }),
    favicon:  makeImageUploader({ folder: 'landing/favicon', maxSizeMB: 1 }),
    hero:     makeImageUploader({ folder: 'landing/hero',    maxSizeMB: 5 }),
    og:       makeImageUploader({ folder: 'landing/og',      maxSizeMB: 5 }),
    default:  makeImageUploader({ folder: 'landing',         maxSizeMB: 3 }),
  }), [])

  // Chọn uploader theo folder field (fallback default).
  const pickUploader = (folder?: string) => {
    if (folder?.includes('logo'))    return uploaders.logo
    if (folder?.includes('favicon')) return uploaders.favicon
    if (folder?.includes('hero'))    return uploaders.hero
    if (folder?.includes('og'))      return uploaders.og
    return uploaders.default
  }

  const colWidth = previewOn ? 'lg:col-span-5' : 'lg:col-span-9'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* ── Section navigation (2 cols) ──────────────────────────── */}
      <aside className="lg:col-span-2">
        <div className="sticky top-4 bg-white rounded-xl border border-neutral-100 shadow-sm p-2">
          <div className="px-3 py-2 border-b border-neutral-100 mb-1 flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
              Danh mục
            </div>
            <button
              type="button"
              onClick={() => setPreviewOn(!previewOn)}
              title={previewOn ? 'Ẩn preview' : 'Hiện preview'}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                previewOn ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              {previewOn ? <Eye size={14} /> : <EyeOff size={14} />} {previewOn ? 'On' : 'Off'}
            </button>
          </div>
          <nav className="space-y-0.5">
            {FORM_SECTIONS.map((s) => {
              const Icon = s.icon
              const isActive = s.key === activeSection
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActiveSection(s.key)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-primary-600' : 'text-neutral-400'} />
                  <span className="flex-1 truncate">{s.title}</span>
                </button>
              )
            })}
          </nav>

          {updatedAt && (
            <div className="mt-3 px-3 py-2 border-t border-neutral-100 text-[10px] text-neutral-500 leading-tight">
              Cập nhật:{' '}
              <span className="text-neutral-700 font-medium block">
                {new Date(updatedAt).toLocaleString('vi-VN')}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* ── Form area ──────────────────────────────────────────────── */}
      <div className={colWidth}>
        {isLoading ? (
          <div className="bg-white rounded-xl border border-neutral-100 p-16 flex justify-center">
            <Loader2 className="animate-spin text-primary-600 w-8 h-8" />
          </div>
        ) : (
          <form
            id="landing-config-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm">
              {/* Section header */}
              <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                    <section.icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">{section.title}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">{section.description}</p>
                  </div>
                </div>
              </div>

              {/* Fields grid */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                {section.fields.map((f: any) => {
                  const colSpan = f.fullWidth ? 'md:col-span-2' : ''
                  return (
                    <div key={f.name} className={`space-y-1.5 ${colSpan}`}>
                      <Label className="text-sm text-neutral-700 font-medium">
                        {f.label}
                      </Label>

                      {f.type === 'image' ? (
                        <ImageUploader
                          value={(watch(f.name) as string) || ''}
                          onChange={(url) =>
                            setValue(f.name, url, { shouldDirty: true, shouldValidate: false })
                          }
                          onUpload={pickUploader(f.folder)}
                          aspectRatio={f.aspectRatio || '3/1'}
                          maxSizeMB={f.maxSizeMB || 3}
                          hint={f.hint}
                        />
                      ) : f.type === 'color' ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="relative w-11 h-9 rounded-md border border-neutral-200 overflow-hidden cursor-pointer"
                            title="Bấm để chọn màu"
                          >
                            <input
                              type="color"
                              {...register(f.name)}
                              className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                            />
                            <div
                              className="absolute inset-0"
                              style={{ backgroundColor: primaryColorValue }}
                            />
                          </div>
                          <Input
                            {...register(f.name)}
                            placeholder={f.placeholder}
                            className="flex-1 font-mono text-xs uppercase"
                          />
                        </div>
                      ) : f.type === 'textarea' ? (
                        <>
                          <textarea
                            {...register(f.name)}
                            placeholder={f.placeholder}
                            rows={f.rows ?? 3}
                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 placeholder:text-neutral-400 resize-y"
                          />
                          {f.hint && <div className="text-[11px] text-neutral-400">{f.hint}</div>}
                        </>
                      ) : (
                        <>
                          <Input {...register(f.name)} placeholder={f.placeholder} />
                          {f.hint && <div className="text-[11px] text-neutral-400">{f.hint}</div>}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* SEO section — thêm Google + Facebook snippet preview */}
            {section.key === 'seo' && (
              <div className="space-y-3">
                <GoogleSnippet
                  title={liveValues.seoTitle as string}
                  desc={liveValues.seoDescription as string}
                  url={(liveValues.canonicalUrl as string) || 'https://frezo.vn/'}
                />
                <FacebookSnippet
                  title={liveValues.seoTitle as string}
                  desc={liveValues.seoDescription as string}
                  ogImage={liveValues.ogImageUrl as string}
                  url={(liveValues.canonicalUrl as string) || 'https://frezo.vn/'}
                />
              </div>
            )}

            {/* ── Sticky save bar ────────────────────────────────── */}
            <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-white/95 backdrop-blur border-t border-neutral-200 flex items-center justify-between rounded-b-xl z-10">
              <div className="flex items-center gap-2 text-sm">
                {isDirty ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-amber-700 font-medium">Có thay đổi chưa lưu</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span className="text-neutral-500 text-xs">Đã đồng bộ</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => reset({ ...emptyDefaults, ...(data || {}) })}
                  disabled={!isDirty || updateReq.isPending}
                >
                  <RotateCcw size={14} className="mr-1.5" /> Hoàn tác
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!isDirty || updateReq.isPending}
                  className="bg-primary-600 hover:bg-primary-700 text-white min-w-[120px]"
                >
                  {updateReq.isPending ? (
                    <>
                      <Loader2 size={14} className="mr-1.5 animate-spin" /> Đang lưu…
                    </>
                  ) : (
                    <>
                      <Save size={14} className="mr-1.5" /> Lưu thay đổi
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ── Live preview column (5 cols) — sticky ──────────────── */}
      {previewOn && (
        <div className="lg:col-span-5">
          <div className="sticky top-4">
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-neutral-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles size={14} className="text-primary-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-neutral-800 truncate">
                    Xem trước landing (live)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DeviceSwitcher value={device} onChange={setDevice} />
                  <button
                    type="button"
                    title="Mở landing thật trong tab mới"
                    onClick={() => window.open(LANDING_URL, '_blank', 'noopener,noreferrer')}
                    className="h-7 w-7 inline-flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-3 bg-neutral-100">
                <LandingPreview
                  config={liveValues as LandingConfigLite}
                  device={device}
                  highlightSection={activeSection}
                />
              </div>
              <div className="px-4 py-2 border-t border-neutral-100 text-[11px] text-neutral-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Thay đổi ở form sẽ hiện tức thì. Bấm <strong className="mx-1 text-neutral-700">Lưu</strong> để publish lên landing thật.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Preview Tab — full-page landing preview, không có form
// ------------------------------------------------------------
// Hiển thị landing y hệt như live nhưng render bằng React trong ERP.
// Dùng khi user muốn xem toàn cảnh trước khi share link, hoặc demo cho khách.
// ============================================================
function PreviewTab() {
  const { data, isLoading } = useLandingConfig()
  const [device, setDevice] = useState<PreviewDevice>('desktop')

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-100 p-16 flex justify-center">
        <Loader2 className="animate-spin text-primary-600 w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <Sparkles size={14} className="text-primary-600" /> Xem trước landing page (chế độ full-page)
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Đây là bản render nội bộ dựa trên config hiện tại. Bấm{' '}
            <button
              type="button"
              onClick={() => window.open(LANDING_URL, '_blank', 'noopener,noreferrer')}
              className="text-primary-600 hover:underline inline-flex items-center gap-1"
            >
              Mở landing thật <ExternalLink size={14} />
            </button>{' '}
            để xem site production.
          </p>
        </div>
        <DeviceSwitcher value={device} onChange={setDevice} />
      </div>
      <div className="p-4 bg-neutral-100 min-h-[calc(100vh-320px)]">
        <LandingPreview config={(data || {}) as LandingConfigLite} device={device} />
      </div>
    </div>
  )
}

// ============================================================
// Articles Tab (merged with News)
// ============================================================

function ArticlesTab() {
  const navigate = useNavigate()
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const { data: rawData, isLoading } = useArticles()
  const updateReq = useUpdateArticle()
  const deleteReq = useDeleteArticle()
  const createReq = useCreateArticle()

  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const dataList = useMemo(() => {
    const arr = rawData || []
    return arr.filter((a: any) => {
      if (typeFilter && a.type !== typeFilter) return false
      if (statusFilter && a.status !== statusFilter) return false
      return true
    })
  }, [rawData, typeFilter, statusFilter])

  const quickPublish = (row: any) => {
    const next = row.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    updateReq.mutate({ id: row.id, data: { ...row, status: next } })
  }

  const duplicate = (row: any) => {
    const { id, createdDate, updatedDate, ...rest } = row
    createReq.mutate({
      ...rest,
      title: `${row.title} (Bản sao)`,
      status: 'DRAFT',
    })
  }

  const columns = [
    {
      title: 'Ảnh',
      dataIndex: 'thumbnailUrl',
      width: 80,
      render: (val: string) =>
        val ? (
          <img
            src={val}
            alt="thumb"
            className="w-14 h-10 object-cover rounded-md border border-neutral-100"
          />
        ) : (
          <div className="w-14 h-10 bg-neutral-50 rounded-md border border-neutral-100 flex items-center justify-center text-neutral-300">
            <ImageIcon size={14} />
          </div>
        ),
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      filterType: 'text' as const,
      render: (val: string, row: any) => (
        <div className="min-w-0">
          <div className="font-medium text-neutral-900 truncate max-w-[320px]" title={val}>
            {val || '(Không có tiêu đề)'}
          </div>
          {row.summary && (
            <div className="text-xs text-neutral-500 truncate max-w-[320px]" title={row.summary}>
              {row.summary}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      render: (val: string) => {
        const t = ARTICLE_TYPES.find((x) => x.value === val)
        return (
          <span className="text-xs text-neutral-600 bg-neutral-50 px-2 py-0.5 rounded">
            {t?.label || val || '—'}
          </span>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (val: string) => <StatusPill value={val} />,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdDate',
      render: (val: string) => (val ? new Date(val).toLocaleDateString('vi-VN') : '—'),
    },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      width: 200,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title={row.status === 'PUBLISHED' ? 'Chuyển về nháp' : 'Xuất bản nhanh'}
            onClick={() => quickPublish(row)}
            disabled={updateReq.isPending}
          >
            {row.status === 'PUBLISHED' ? (
              <XCircle size={16} className="text-amber-600" />
            ) : (
              <CheckCircle2 size={16} className="text-emerald-600" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Xem preview"
            onClick={() => window.open(`${LANDING_URL}/bai-viet/${row.id}`, '_blank')}
          >
            <Eye size={16} className="text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Sao chép"
            onClick={() => duplicate(row)}
          >
            <Copy size={16} className="text-neutral-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Chỉnh sửa (mở trình soạn full)"
            onClick={() => navigate(`/admin/article-management/${row.id}/edit`)}
          >
            <Pencil size={16} className="text-primary-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Xoá"
            onClick={() =>
              askConfirm({
                title: 'Xoá bài viết?',
                message: `Bài viết "${row.title}" sẽ bị xoá.`,
                confirmText: 'Xoá',
                onConfirm: () => deleteReq.mutate(row.id),
              })
            }
          >
            <Trash2 size={16} className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm">
      {/* Filter bar */}
      <div className="p-4 border-b border-neutral-100 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1">
          {ARTICLE_TYPES.map((t) => (
            <button
              key={t.value || 'all'}
              type="button"
              onClick={() => setTypeFilter(t.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                typeFilter === t.value
                  ? 'bg-primary-600 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <span className="w-px h-6 bg-neutral-200" />

        <div className="flex flex-wrap items-center gap-1">
          {[{ value: '', label: 'Mọi trạng thái' }, ...STATUS_OPTIONS].map((s) => (
            <button
              key={s.value || 'all'}
              type="button"
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === s.value
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-neutral-500">
            Tổng: <strong>{dataList.length}</strong> bài
          </span>
          <Button
            onClick={() => navigate('/admin/article-management/new')}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            <Plus size={14} className="mr-1.5" /> Thêm bài viết
          </Button>
        </div>
      </div>

      {dataList.length === 0 && !isLoading ? (
        <div className="p-12">
          <EmptyState
            icon={FileText}
            title="Chưa có bài viết nào"
            description={
              typeFilter || statusFilter
                ? 'Không có bài viết nào khớp bộ lọc — thử bỏ bớt điều kiện.'
                : 'Bắt đầu bằng cách tạo bài viết mới với trình soạn full-page.'
            }
            action={
              <Button
                onClick={() => navigate('/admin/article-management/new')}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                <Plus size={14} className="mr-1.5" /> Tạo bài đầu tiên
              </Button>
            }
          />
        </div>
      ) : (
        <div className="p-4">
          <AppTable
            data={dataList}
            columns={columns as any}
            isLoading={isLoading}
            showSearch
            searchPlaceholder="Tìm theo tiêu đề, tóm tắt…"
          />
        </div>
      )}
      {confirmDialog}
    </div>
  )
}

// ============================================================
// Banners Tab
// ============================================================

function BannersTab() {
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [defaultPosition, setDefaultPosition] = useState<string>('hero')

  const { data: rawData, isLoading } = useBanners()
  const createReq = useCreateBanner()
  const updateReq = useUpdateBanner()
  const deleteReq = useDeleteBanner()

  const dataList = rawData || []

  const groupedByPosition = useMemo(() => {
    const groups: Record<string, any[]> = {}
    for (const pos of BANNER_POSITIONS) groups[pos.value] = []
    for (const b of dataList) {
      const key = groups[b.position] ? b.position : 'banner'
      groups[key].push(b)
    }
    for (const k of Object.keys(groups)) {
      groups[k].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
    }
    return groups
  }, [dataList])

  const openCreate = (position: string) => {
    setSelectedItem(null)
    setDefaultPosition(position)
    setModalOpen(true)
  }

  const openEdit = (row: any) => {
    setSelectedItem(row)
    setDefaultPosition(row.position || 'hero')
    setModalOpen(true)
  }

  const handleSubmit = (values: BannerFormValues) => {
    if (selectedItem?.id) {
      updateReq.mutate(
        { id: selectedItem.id, data: values },
        { onSuccess: () => setModalOpen(false) },
      )
    } else {
      createReq.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  const toggleStatus = (row: any) => {
    const next = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    updateReq.mutate({ id: row.id, data: { ...row, status: next } })
  }

  const moveOrder = (row: any, delta: number) => {
    const same = (groupedByPosition[row.position] || []).sort(
      (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0),
    )
    const idx = same.findIndex((x) => x.id === row.id)
    const target = same[idx + delta]
    if (!target) return
    // Swap orderIndex.
    const rowOrder = row.orderIndex ?? idx
    const targetOrder = target.orderIndex ?? (idx + delta)
    updateReq.mutate({ id: row.id, data: { ...row, orderIndex: targetOrder } })
    updateReq.mutate({ id: target.id, data: { ...target, orderIndex: rowOrder } })
  }

  const activePosition =
    BANNER_POSITIONS.find((p) => p.value === defaultPosition) ?? BANNER_POSITIONS[0]

  const formFields = [
    { name: 'title',      label: 'Tiêu đề', required: true },
    { name: 'subtitle',   label: 'Phụ đề' },
    {
      name: 'imageUrl',
      label: 'Hình ảnh',
      type: 'image',
      folder: 'banners',
      aspectRatio: activePosition.aspectRatio,
      maxSizeMB: 5,
      hint: `${activePosition.hint} — kéo-thả file hoặc dán URL.`,
      colSpan: 3,
      required: true,
    },
    { name: 'linkUrl', label: 'Đường dẫn khi click', placeholder: 'https://...' },
    {
      name: 'position',
      label: 'Vị trí',
      type: 'select',
      options: BANNER_POSITIONS.map((p) => ({ value: p.value, label: p.label })),
    },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      options: BANNER_STATUS_OPTIONS,
    },
    { name: 'orderIndex', label: 'Thứ tự hiển thị', type: 'number' },
  ]

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-100 p-16 flex justify-center">
        <Loader2 className="animate-spin text-primary-500 w-8 h-8" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {BANNER_POSITIONS.map((pos) => {
          const list = groupedByPosition[pos.value] || []
          const activeCount = list.filter((b) => b.status === 'ACTIVE').length
          return (
            <div
              key={pos.value}
              className="bg-white rounded-xl border border-neutral-100 shadow-sm"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-neutral-900">{pos.label}</h3>
                      <span className="text-xs text-neutral-500">
                        {list.length} banner · {activeCount} đang hoạt động
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400">{pos.hint}</div>
                  </div>
                </div>
                <Button
                  onClick={() => openCreate(pos.value)}
                  size="sm"
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  <Plus size={14} className="mr-1" /> Thêm
                </Button>
              </div>

              <div className="p-4">
                {list.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500">
                    Chưa có banner cho vị trí này.{' '}
                    <button
                      type="button"
                      onClick={() => openCreate(pos.value)}
                      className="text-primary-600 font-medium hover:underline"
                    >
                      Thêm banner đầu tiên
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map((banner, idx) => (
                      <div
                        key={banner.id}
                        className="group rounded-lg border border-neutral-100 bg-white overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div
                          className="relative bg-neutral-100"
                          style={{ aspectRatio: pos.aspectRatio }}
                        >
                          {banner.imageUrl ? (
                            <img
                              src={banner.imageUrl}
                              alt={banner.title}
                              className="w-full h-full object-cover"
                              onError={(e) =>
                                ((e.currentTarget as HTMLImageElement).style.display = 'none')
                              }
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-300">
                              <ImageIcon size={28} />
                            </div>
                          )}

                          {/* Order badge */}
                          <div className="absolute top-2 left-2 flex items-center gap-1">
                            <span className="w-6 h-6 rounded-md bg-black/60 text-white text-[11px] font-bold flex items-center justify-center backdrop-blur">
                              #{banner.orderIndex ?? idx + 1}
                            </span>
                          </div>

                          {/* Status badge */}
                          <button
                            type="button"
                            onClick={() => toggleStatus(banner)}
                            className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur transition-colors ${
                              banner.status === 'ACTIVE'
                                ? 'bg-emerald-500/90 text-white hover:bg-emerald-600'
                                : 'bg-neutral-500/80 text-white hover:bg-neutral-600'
                            }`}
                            title="Bấm để bật/tắt"
                            disabled={updateReq.isPending}
                          >
                            {banner.status === 'ACTIVE' ? 'Đang bật' : 'Đang ẩn'}
                          </button>

                          {/* Hover actions */}
                          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end px-2 pb-2 gap-1">
                            <button
                              type="button"
                              onClick={() => moveOrder(banner, -1)}
                              disabled={idx === 0}
                              className="w-7 h-7 rounded-md bg-white/95 text-neutral-700 hover:bg-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Lên"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveOrder(banner, +1)}
                              disabled={idx === list.length - 1}
                              className="w-7 h-7 rounded-md bg-white/95 text-neutral-700 hover:bg-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Xuống"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(banner)}
                              className="w-7 h-7 rounded-md bg-white/95 text-primary-700 hover:bg-white flex items-center justify-center"
                              title="Chỉnh sửa"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                askConfirm({
                                  title: 'Xoá banner?',
                                  message: `Banner "${banner.title}" sẽ bị xoá.`,
                                  confirmText: 'Xoá',
                                  onConfirm: () => deleteReq.mutate(banner.id),
                                })
                              }
                              className="w-7 h-7 rounded-md bg-white/95 text-red-600 hover:bg-white flex items-center justify-center"
                              title="Xoá"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="p-3">
                          <div
                            className="text-sm font-semibold text-neutral-800 truncate"
                            title={banner.title}
                          >
                            {banner.title}
                          </div>
                          {banner.subtitle && (
                            <div
                              className="text-xs text-neutral-500 truncate mt-0.5"
                              title={banner.subtitle}
                            >
                              {banner.subtitle}
                            </div>
                          )}
                          {banner.linkUrl && (
                            <div className="mt-2 flex items-center gap-1 text-[11px] text-neutral-500 truncate">
                              <ExternalLink size={10} className="flex-shrink-0" />
                              <a
                                href={banner.linkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary-600 hover:underline truncate"
                                title={banner.linkUrl}
                              >
                                {banner.linkUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedItem ? 'Cập nhật Banner' : `Thêm Banner — ${activePosition.label}`}
        maxWidth="3xl"
      >
        {/* `key` forces AppForm to remount → picks up fresh defaultValues khi switch giữa create/edit. */}
        <AppForm
          key={selectedItem?.id || `new-${defaultPosition}`}
          schema={bannerFormSchema}
          defaultValues={
            selectedItem || {
              title: '',
              subtitle: '',
              imageUrl: '',
              linkUrl: '',
              position: defaultPosition,
              status: 'ACTIVE',
              orderIndex: (groupedByPosition[defaultPosition]?.length ?? 0) + 1,
            }
          }
          onSubmit={handleSubmit}
          fields={formFields}
          isLoading={createReq.isPending || updateReq.isPending}
          submitText={selectedItem ? 'Cập nhật' : 'Thêm mới'}
        />
      </AppModal>
      {confirmDialog}
    </>
  )
}

// ============================================================
// Menu seed items (dev tool)
// ============================================================

const MENU_SEED_ITEMS = [
  {
    code: 'QLHT_WEBSITE', parentCode: null,
    name: 'Quản lý Website', nameEn: 'Website Management',
    appCode: 'QTHT', orderIndex: 4, menuType: 1, isPublic: true, status: true,
    icon: '', feUrl: null,
  },
  {
    code: 'WEBSITE_CONFIG', parentCode: 'QLHT_WEBSITE',
    name: 'Cấu hình trang', nameEn: 'Site Config',
    appCode: 'QTHT', orderIndex: 1, menuType: 1, isPublic: true, status: true,
    icon: '', feUrl: '/qtht/website',
  },
  {
    code: 'WEBSITE_BANNERS', parentCode: 'QLHT_WEBSITE',
    name: 'Quản lý Banner', nameEn: 'Banners',
    appCode: 'QTHT', orderIndex: 2, menuType: 1, isPublic: true, status: true,
    icon: '', feUrl: '/qtht/website',
  },
  {
    code: 'WEBSITE_ARTICLES', parentCode: 'QLHT_WEBSITE',
    name: 'Quản lý bài viết', nameEn: 'Articles',
    appCode: 'QTHT', orderIndex: 3, menuType: 1, isPublic: true, status: true,
    icon: '', feUrl: '/qtht/website',
  },
]

// ============================================================
// Main Page
// ============================================================

export function WebsiteManagementPage() {
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['key']>('config')
  const [seeding, setSeeding] = useState(false)

  const { data: config } = useLandingConfig()
  const { data: articles } = useArticles()
  const { data: banners } = useBanners()

  const kpis = useMemo(() => {
    const articleList = articles || []
    const bannerList = banners || []
    const publishedCount = articleList.filter((a: any) => a.status === 'PUBLISHED').length
    const activeBannerCount = bannerList.filter((b: any) => b.status === 'ACTIVE').length
    const lastUpdated =
      (config as any)?.updatedAt ||
      (config as any)?.updatedDate ||
      articleList.map((a: any) => a.updatedDate).sort().reverse()[0]
    return {
      articleTotal: articleList.length,
      publishedCount,
      bannerActive: activeBannerCount,
      bannerTotal: bannerList.length,
      lastUpdated,
    }
  }, [articles, banners, config])

  const runSeedMenu = useCallback(async () => {
    if (seeding) return
    setSeeding(true)
    let ok = 0
    let fail = 0
    for (const item of MENU_SEED_ITEMS) {
      try {
        await axiosClient.post('/qtht/menu', item)
        ok++
      } catch {
        fail++
      }
      await new Promise((r) => setTimeout(r, 200))
    }
    setSeeding(false)
    toast.success(`Đã seed ${ok} menu, ${fail} lỗi (có thể do trùng code — bỏ qua nếu đã tồn tại).`)
  }, [seeding])

  const handleSeedMenu = useCallback(() => {
    if (seeding) return
    askConfirm({
      title: 'Seed lại menu website?',
      message: 'Thao tác sẽ ghi menu website vào hệ thống (trùng code sẽ bỏ qua).',
      confirmText: 'Seed menu',
      variant: 'warning',
      onConfirm: () => runSeedMenu(),
    })
  }, [askConfirm, runSeedMenu, seeding])

  const openLanding = () => window.open(LANDING_URL, '_blank', 'noopener,noreferrer')

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* ── Page header ────────────────────────────────────────── */}
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <LayoutTemplate className="text-primary-600" size={22} />
            Quản lý Trang chủ
          </span>
        }
        description="Cấu hình thương hiệu, banner và bài viết hiển thị trên landing page."
        actions={
          <>
            <Button variant="outline" onClick={openLanding}>
              <ExternalLink size={14} className="mr-1.5" /> Xem trang chủ
            </Button>
            <MoreMenu>
              <MoreMenuItem
                icon={Database}
                label={seeding ? 'Đang seed menu…' : 'Seed menu website (dev)'}
                onClick={handleSeedMenu}
              />
              <MoreMenuItem
                icon={ExternalLink}
                label="Mở docs landing"
                onClick={() => window.open('/AI_LANDING_STANDARD.md', '_blank')}
              />
            </MoreMenu>
          </>
        }
      />

      {/* ── KPI strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={FileText}
          label="Tổng bài viết"
          value={kpis.articleTotal}
          hint={`${kpis.publishedCount} đã xuất bản`}
          tone="primary"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Bài đã publish"
          value={kpis.publishedCount}
          hint={
            kpis.articleTotal
              ? `${Math.round((kpis.publishedCount / kpis.articleTotal) * 100)}% tổng bài`
              : '—'
          }
          tone="success"
        />
        <KpiCard
          icon={ImageIcon}
          label="Banner hoạt động"
          value={kpis.bannerActive}
          hint={`${kpis.bannerTotal} tổng số`}
          tone="warning"
        />
        <KpiCard
          icon={Sparkles}
          label="Landing config"
          value={config ? 'Đã cấu hình' : 'Chưa có'}
          hint={
            kpis.lastUpdated
              ? `Cập nhật ${new Date(kpis.lastUpdated).toLocaleDateString('vi-VN')}`
              : 'Chưa có dữ liệu'
          }
          tone="neutral"
        />
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-neutral-200">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.key === activeTab
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                isActive
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ────────────────────────────────────────── */}
      <div>
        {activeTab === 'config'   && <ConfigTab />}
        {activeTab === 'preview'  && <PreviewTab />}
        {activeTab === 'articles' && <ArticlesTab />}
        {activeTab === 'banners'  && <BannersTab />}
      </div>
      {confirmDialog}
    </div>
  )
}
