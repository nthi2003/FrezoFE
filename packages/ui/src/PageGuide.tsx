import * as React from 'react'
import {
  HelpCircle,
  X,
  Info,
  Lightbulb,
  Command,
  BookOpen,
  ChevronRight,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@frezo/utils'

// ============================================================
// Types
// ============================================================

export interface GuideStep {
  /** Icon lucide (optional). Nếu không truyền dùng số thứ tự. */
  icon?: LucideIcon
  /** Tiêu đề ngắn (1 dòng). */
  title: string
  /** Mô tả chi tiết — string hoặc React node (có thể chứa <kbd>, <code>). */
  description?: React.ReactNode
}

export interface GuideShortcut {
  /** Tổ hợp phím: ['Ctrl', 'K'] hoặc ['⌘', 'N']. */
  keys: string[]
  /** Mô tả hành động. */
  label: string
}

export interface GuideLink {
  label: string
  href: string
  /** External = mở tab mới. */
  external?: boolean
}

export interface GuideSection {
  /** Loại section — quyết định icon + style. */
  type?: 'steps' | 'tips' | 'shortcuts' | 'notes' | 'links'
  /** Tiêu đề section. */
  heading: string
  /** Steps (dạng danh sách đánh số) — dùng khi type='steps' (default). */
  steps?: GuideStep[]
  /** Tips — dùng khi type='tips'. */
  tips?: string[]
  /** Shortcuts — dùng khi type='shortcuts'. */
  shortcuts?: GuideShortcut[]
  /** Notes text (paragraph) — dùng khi type='notes'. */
  notes?: React.ReactNode
  /** Links — dùng khi type='links'. */
  links?: GuideLink[]
}

export interface PageGuideConfig {
  /** Tiêu đề drawer (thường tên page). */
  title: string
  /** Subtitle mô tả 1 dòng ngắn. */
  subtitle?: string
  /** Các section theo thứ tự. */
  sections: GuideSection[]
  /** Link tới doc đầy đủ (optional) — hiển thị dưới footer. */
  docHref?: string
  /** Video demo (optional) — link youtube/loom. */
  videoHref?: string
  /**
   * FR-DOC-04: Markdown body từ BE CMS. Khi có → ưu tiên hiển thị thay steps local.
   * Thường do {@link registerPageGuideCmsResolver} inject khi mở drawer.
   */
  bodyMarkdown?: string
}

/** Resolve published guide body by slug (vd. guide-qlts). ERP đăng ký ở bootstrap. */
export type PageGuideCmsResolver = (slug: string) => Promise<string | null>

let pageGuideCmsResolver: PageGuideCmsResolver | null = null

/** ERP gọi 1 lần khi app start để PageGuide ưu tiên body BE theo slug. */
export function registerPageGuideCmsResolver(resolver: PageGuideCmsResolver | null) {
  pageGuideCmsResolver = resolver
}

function slugFromDocHref(docHref?: string): string | null {
  if (!docHref) return null
  const m = docHref.match(/\/docs\/([^/?#]+)/)
  return m?.[1] ? decodeURIComponent(m[1]) : null
}

// ============================================================
// PageGuideButton — nút "?" nhỏ đặt trong PageHeader.actions
// ============================================================

export interface PageGuideButtonProps {
  guide: PageGuideConfig
  /** Label tooltip cho nút — mặc định "Hướng dẫn". */
  label?: string
  className?: string
}

/**
 * Nút "?" mở drawer hướng dẫn cho page.
 * Đặt bên trong `PageHeader.actions` (bên trái các nút Primary).
 *
 * @example
 * <PageHeader
 *   title="Bài viết"
 *   actions={
 *     <>
 *       <PageGuideButton guide={ARTICLES_GUIDE} />
 *       <Button>Thêm mới</Button>
 *     </>
 *   }
 * />
 */
export function PageGuideButton({ guide, label = 'Hướng dẫn', className }: PageGuideButtonProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={label}
        aria-label={label}
        className={cn(
          'inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-neutral-200',
          'text-sm font-medium text-neutral-600 bg-white',
          'hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300',
          'transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          className,
        )}
      >
        <HelpCircle size={16} strokeWidth={2} className="text-primary-600" />
        <span className="hidden sm:inline">{label}</span>
      </button>
      <PageGuideDrawer open={open} onClose={() => setOpen(false)} guide={guide} />
    </>
  )
}

// ============================================================
// PageGuideDrawer — drawer nội dung
// ============================================================

interface PageGuideDrawerProps {
  open: boolean
  onClose: () => void
  guide: PageGuideConfig
}

function PageGuideDrawer({ open, onClose, guide }: PageGuideDrawerProps) {
  const [cmsBody, setCmsBody] = React.useState<string | null>(guide.bodyMarkdown ?? null)

  // ESC to close
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock body scroll + compensate scrollbar width khi drawer mở
  React.useEffect(() => {
    if (!open) return
    const body = document.body
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const prevOverflow = body.style.overflow
    const prevPadding = body.style.paddingRight
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      const currentPadding = parseInt(window.getComputedStyle(body).paddingRight, 10) || 0
      body.style.paddingRight = `${currentPadding + scrollbarWidth}px`
    }
    return () => {
      body.style.overflow = prevOverflow
      body.style.paddingRight = prevPadding
    }
  }, [open])

  // FR-DOC-04: ưu tiên body BE theo slug từ docHref
  React.useEffect(() => {
    if (!open) return
    if (guide.bodyMarkdown) {
      setCmsBody(guide.bodyMarkdown)
      return
    }
    const slug = slugFromDocHref(guide.docHref)
    if (!slug || !pageGuideCmsResolver) {
      setCmsBody(null)
      return
    }
    let cancelled = false
    pageGuideCmsResolver(slug)
      .then((body) => {
        if (!cancelled) setCmsBody(body)
      })
      .catch(() => {
        if (!cancelled) setCmsBody(null)
      })
    return () => {
      cancelled = true
    }
  }, [open, guide.bodyMarkdown, guide.docHref])

  const preferCms = Boolean(cmsBody && cmsBody.trim())

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="page-guide-title"
        className={cn(
          'fixed right-0 top-0 bottom-0 w-full sm:w-[440px] bg-white shadow-2xl z-[10000]',
          'flex flex-col transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-neutral-100 bg-gradient-to-br from-primary-50 to-white">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-700">
              <BookOpen size={13} strokeWidth={2.4} />
              Hướng dẫn nhanh
            </div>
            <h2
              id="page-guide-title"
              className="mt-1 text-lg font-bold text-neutral-900 truncate"
            >
              {guide.title}
            </h2>
            {guide.subtitle && (
              <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                {guide.subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-md text-neutral-400 hover:bg-white hover:text-neutral-700 transition -mt-1 -mr-1"
          >
            <X size={18} />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {preferCms ? (
            <section>
              <SectionHeading heading="Nội dung hướng dẫn" type="notes" />
              <div className="mt-3 text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                {cmsBody}
              </div>
            </section>
          ) : (
            guide.sections.map((section, idx) => (
              <SectionRenderer key={idx} section={section} />
            ))
          )}
        </div>

        {/* Footer */}
        {(guide.docHref || guide.videoHref) && (
          <footer className="border-t border-neutral-100 px-6 py-3 bg-neutral-50/50 flex flex-wrap gap-2">
            {guide.docHref && (
              <a
                href={guide.docHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-primary-700 px-2.5 py-1.5 rounded-md hover:bg-white transition"
              >
                <BookOpen size={13} />
                Tài liệu chi tiết
                <ExternalLink size={11} />
              </a>
            )}
            {guide.videoHref && (
              <a
                href={guide.videoHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-primary-700 px-2.5 py-1.5 rounded-md hover:bg-white transition"
              >
                <Info size={13} />
                Xem video demo
                <ExternalLink size={11} />
              </a>
            )}
          </footer>
        )}
      </aside>
    </>
  )
}

// ============================================================
// Section renderer
// ============================================================

function SectionRenderer({ section }: { section: GuideSection }) {
  const type = section.type || (section.steps ? 'steps' : 'notes')

  return (
    <section>
      <SectionHeading heading={section.heading} type={type} />
      <div className="mt-3">
        {type === 'steps' && section.steps && <StepsList steps={section.steps} />}
        {type === 'tips' && section.tips && <TipsList tips={section.tips} />}
        {type === 'shortcuts' && section.shortcuts && (
          <ShortcutsList shortcuts={section.shortcuts} />
        )}
        {type === 'notes' && section.notes && <NotesBlock>{section.notes}</NotesBlock>}
        {type === 'links' && section.links && <LinksList links={section.links} />}
      </div>
    </section>
  )
}

function SectionHeading({ heading, type }: { heading: string; type: string }) {
  const iconMap: Record<string, LucideIcon> = {
    steps: BookOpen,
    tips: Lightbulb,
    shortcuts: Command,
    notes: Info,
    links: ExternalLink,
  }
  const Icon = iconMap[type] || BookOpen
  const colorMap: Record<string, string> = {
    steps: 'text-primary-600 bg-primary-50',
    tips: 'text-warning-dark bg-warning-light',
    shortcuts: 'text-neutral-600 bg-neutral-100',
    notes: 'text-info-dark bg-info-light',
    links: 'text-neutral-600 bg-neutral-100',
  }
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
      <span
        className={cn(
          'inline-flex items-center justify-center w-6 h-6 rounded-md',
          colorMap[type] || 'text-neutral-600 bg-neutral-100',
        )}
      >
        <Icon size={13} strokeWidth={2.2} />
      </span>
      {heading}
    </h3>
  )
}

function StepsList({ steps }: { steps: GuideStep[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, idx) => {
        const Icon = step.icon
        return (
          <li key={idx} className="flex gap-3">
            <span
              className={cn(
                'flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full',
                'bg-primary-50 text-primary-700 text-xs font-bold tabular-nums',
              )}
            >
              {Icon ? <Icon size={14} strokeWidth={2.2} /> : idx + 1}
            </span>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-medium text-neutral-800 leading-snug">
                {step.title}
              </p>
              {step.description && (
                <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
                  {step.description}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function TipsList({ tips }: { tips: string[] }) {
  return (
    <ul className="space-y-2">
      {tips.map((tip, idx) => (
        <li
          key={idx}
          className="flex gap-2 items-start text-sm text-neutral-600 leading-relaxed p-2.5 rounded-md bg-warning-light/40"
        >
          <Lightbulb size={14} strokeWidth={2} className="text-warning-dark shrink-0 mt-0.5" />
          <span>{tip}</span>
        </li>
      ))}
    </ul>
  )
}

function ShortcutsList({ shortcuts }: { shortcuts: GuideShortcut[] }) {
  return (
    <ul className="space-y-1.5">
      {shortcuts.map((sc, idx) => (
        <li
          key={idx}
          className="flex items-center justify-between gap-3 text-sm text-neutral-600 py-1.5"
        >
          <span className="flex-1 min-w-0 truncate">{sc.label}</span>
          <span className="flex items-center gap-1 shrink-0">
            {sc.keys.map((k, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-neutral-300 text-xs">+</span>}
                <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[11px] font-mono font-medium text-neutral-700 bg-neutral-100 border border-neutral-200 rounded shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  {k}
                </kbd>
              </React.Fragment>
            ))}
          </span>
        </li>
      ))}
    </ul>
  )
}

function NotesBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-neutral-600 leading-relaxed p-3 rounded-md bg-info-light/40 border border-info-light">
      {children}
    </div>
  )
}

function LinksList({ links }: { links: GuideLink[] }) {
  return (
    <ul className="space-y-1">
      {links.map((link, idx) => (
        <li key={idx}>
          <a
            href={link.href}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noopener noreferrer' : undefined}
            className="flex items-center gap-2 text-sm text-primary-700 hover:text-primary-800 hover:bg-primary-50 rounded-md px-2 py-1.5 transition group"
          >
            <ChevronRight size={14} className="text-primary-500 group-hover:translate-x-0.5 transition-transform" />
            <span className="flex-1">{link.label}</span>
            {link.external && <ExternalLink size={12} className="text-primary-400" />}
          </a>
        </li>
      ))}
    </ul>
  )
}
