// ============================================================
// Ảnh minh hoạ bài viết cho trang tin /bai-viet.
// Ưu tiên cover thật từ CMS; khi chưa có thumbnail thì fallback
// nền semantic + icon theo nhóm nội dung — không để khung trống.
// ============================================================

import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Gift,
  Megaphone,
  Newspaper,
  PenLine,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@frezo/utils'
import type { HomeArticle } from '../utils/homeArticle'

export interface ArticleTone {
  key: string
  label: string
  icon: LucideIcon
  /** Chip trên nền sáng (filter, card body). */
  chip: string
  /** Chip đè lên ảnh cover. */
  chipOnCover: string
  /** Nền artwork khi bài không có ảnh. */
  artworkBg: string
  /** Màu icon trên artwork fallback. */
  artworkIcon: string
  /** Viền khi hover card. */
  hoverBorder: string
  dot: string
}

const TONES = {
  news: {
    key: 'news',
    label: 'Tin tức',
    icon: Newspaper,
    chip: 'bg-info-light text-info-dark',
    chipOnCover: 'bg-info text-white',
    artworkBg: 'bg-info-light',
    artworkIcon: 'text-info-dark',
    hoverBorder: 'hover:border-info/40',
    dot: 'bg-info',
  },
  event: {
    key: 'event',
    label: 'Sự kiện',
    icon: CalendarDays,
    chip: 'bg-warning-light text-warning-dark',
    chipOnCover: 'bg-warning text-white',
    artworkBg: 'bg-warning-light',
    artworkIcon: 'text-warning-dark',
    hoverBorder: 'hover:border-warning/40',
    dot: 'bg-warning',
  },
  blog: {
    key: 'blog',
    label: 'Bài viết',
    icon: PenLine,
    chip: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200',
    chipOnCover: 'bg-primary-600 text-white',
    artworkBg: 'bg-primary-50',
    artworkIcon: 'text-primary-600',
    hoverBorder: 'hover:border-primary-300',
    dot: 'bg-primary-500',
  },
  promotion: {
    key: 'promotion',
    label: 'Khuyến mãi',
    icon: Gift,
    chip: 'bg-danger-light text-danger-dark',
    chipOnCover: 'bg-danger text-white',
    artworkBg: 'bg-danger-light',
    artworkIcon: 'text-danger-dark',
    hoverBorder: 'hover:border-danger/40',
    dot: 'bg-danger',
  },
  recruitment: {
    key: 'recruitment',
    label: 'Tuyển dụng',
    icon: Users,
    chip: 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200',
    chipOnCover: 'bg-neutral-700 text-white',
    artworkBg: 'bg-neutral-100',
    artworkIcon: 'text-neutral-600',
    hoverBorder: 'hover:border-neutral-400',
    dot: 'bg-neutral-500',
  },
  internal: {
    key: 'internal',
    label: 'Tin nội bộ',
    icon: Megaphone,
    chip: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200',
    chipOnCover: 'bg-primary-700 text-white',
    artworkBg: 'bg-primary-50',
    artworkIcon: 'text-primary-700',
    hoverBorder: 'hover:border-primary-300',
    dot: 'bg-primary-600',
  },
} satisfies Record<string, ArticleTone>

/** Nhóm nội dung của bài — quyết định màu chip + artwork fallback. */
export function articleTone(a: HomeArticle): ArticleTone {
  const key = (a.type ?? '').trim().toLowerCase()
  return (TONES as Record<string, ArticleTone>)[key] ?? TONES.internal
}

export function articleToneByKey(key: string): ArticleTone {
  return (TONES as Record<string, ArticleTone>)[key] ?? TONES.internal
}

export interface ArticleArtworkProps {
  src?: string | null
  alt?: string
  tone: ArticleTone
  className?: string
  iconSize?: number
  /** Hiện nhãn nhóm nội dung dưới icon (khung lớn). */
  showLabel?: boolean
  /** Zoom nhẹ khi card cha có class `group` được hover. */
  zoomOnGroupHover?: boolean
  /** Ảnh hero — tải ngay thay vì lazy. */
  eager?: boolean
}

export function ArticleArtwork({
  src,
  alt = '',
  tone,
  className,
  iconSize = 28,
  showLabel = false,
  zoomOnGroupHover = false,
  eager = false,
}: ArticleArtworkProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [src])

  const showImage = !!src && !failed
  const Icon = tone.icon

  return (
    <div className={cn('relative overflow-hidden bg-neutral-100', className)}>
      {showImage ? (
        <img
          src={src as string}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
          className={cn(
            'h-full w-full object-cover',
            zoomOnGroupHover &&
              'motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:scale-[1.02]',
          )}
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full flex-col items-center justify-center gap-2',
            tone.artworkBg,
            zoomOnGroupHover &&
              'motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:scale-[1.02]',
          )}
        >
          <span
            className={cn(
              'flex items-center justify-center rounded-lg bg-white/80 p-3 ring-1 ring-neutral-200/80',
              tone.artworkIcon,
            )}
          >
            <Icon size={iconSize} strokeWidth={1.5} />
          </span>
          {showLabel && (
            <span className="text-2xs font-medium uppercase tracking-wider text-neutral-500">
              {tone.label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
