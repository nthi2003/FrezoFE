// ============================================================
// Ảnh minh hoạ bài viết cho trang tin /bai-viet.
// Ưu tiên cover thật từ CMS; khi Admin chưa gắn thumbnail (hoặc URL
// hỏng) thì fallback sang artwork gradient + hoạ tiết hoa lá theo
// nhóm nội dung — không bao giờ để khung xám trống.
// ============================================================

import { useEffect, useId, useState } from 'react'
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
  /** Chip đặt trên nền sáng (card body, thanh filter). */
  chip: string
  /** Chip đặt đè lên ảnh cover / artwork. */
  chipOnCover: string
  /** Nền artwork khi bài không có ảnh. */
  gradient: string
  /** Màu viền khi hover card. */
  hoverBorder: string
  dot: string
}

const TONES = {
  news: {
    key: 'news',
    label: 'Tin tức',
    icon: Newspaper,
    chip: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200',
    chipOnCover: 'bg-primary-600/90 text-white',
    gradient: 'from-primary-600 via-emerald-500 to-teal-400',
    hoverBorder: 'hover:border-primary-300',
    dot: 'bg-primary-500',
  },
  event: {
    key: 'event',
    label: 'Sự kiện',
    icon: CalendarDays,
    chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    chipOnCover: 'bg-amber-500/90 text-white',
    gradient: 'from-amber-500 via-orange-400 to-yellow-300',
    hoverBorder: 'hover:border-amber-300',
    dot: 'bg-amber-500',
  },
  blog: {
    key: 'blog',
    label: 'Bài viết',
    icon: PenLine,
    chip: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
    chipOnCover: 'bg-teal-600/90 text-white',
    gradient: 'from-teal-600 via-cyan-500 to-emerald-400',
    hoverBorder: 'hover:border-teal-300',
    dot: 'bg-teal-500',
  },
  promotion: {
    key: 'promotion',
    label: 'Khuyến mãi',
    icon: Gift,
    chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    chipOnCover: 'bg-rose-500/90 text-white',
    gradient: 'from-rose-500 via-pink-500 to-orange-400',
    hoverBorder: 'hover:border-rose-300',
    dot: 'bg-rose-500',
  },
  recruitment: {
    key: 'recruitment',
    label: 'Tuyển dụng',
    icon: Users,
    chip: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    chipOnCover: 'bg-sky-600/90 text-white',
    gradient: 'from-sky-600 via-blue-500 to-cyan-400',
    hoverBorder: 'hover:border-sky-300',
    dot: 'bg-sky-500',
  },
  internal: {
    key: 'internal',
    label: 'Tin nội bộ',
    icon: Megaphone,
    chip: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200',
    chipOnCover: 'bg-primary-700/90 text-white',
    gradient: 'from-primary-700 via-primary-500 to-lime-400',
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

/** Hash ổn định theo id để mỗi bài có một biến thể hoạ tiết riêng. */
function seedOf(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}

const PATTERN_ROTATIONS = [-18, -6, 9, 21]

/** Hoạ tiết lá + hoa lặp — dùng làm nền artwork và watermark masthead. */
export function BotanicalPattern({
  patternId,
  rotate,
}: {
  patternId: string
  rotate: number
}) {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id={patternId}
          width="72"
          height="72"
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(${rotate})`}
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.55"
          >
            <path d="M16 6c7.5 5.2 11 10.4 11 15.8A11 11 0 0 1 5 21.8C5 16.4 8.5 11.2 16 6Z" />
            <path d="M16 34V16" />
            <path d="M16 24l5-4M16 28l-5-4" />
          </g>
          <g fill="currentColor" opacity="0.45">
            <circle cx="52" cy="17" r="3.4" />
            <circle cx="59" cy="24" r="3.4" />
            <circle cx="52" cy="31" r="3.4" />
            <circle cx="45" cy="24" r="3.4" />
          </g>
          <circle cx="52" cy="24" r="1.9" fill="currentColor" opacity="0.85" />
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.4"
          >
            <path d="M34 70c5.5-3.8 8-7.6 8-11.8a8 8 0 0 0-16 0c0 4.2 2.5 8 8 11.8Z" />
            <path d="M34 70V54" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}

export interface ArticleArtworkProps {
  src?: string | null
  alt?: string
  tone: ArticleTone
  /** Dùng để chọn biến thể hoạ tiết — thường là id bài viết. */
  seed?: string
  /** Khung do caller quyết định (aspect / height). */
  className?: string
  iconSize?: number
  /** Hiện nhãn nhóm nội dung dưới icon (chỉ hợp với khung lớn). */
  showLabel?: boolean
  /** Zoom nhẹ khi card cha có class `group` được hover. */
  zoomOnGroupHover?: boolean
  /** Ảnh nằm trên màn hình đầu (hero) — tải ngay thay vì lazy. */
  eager?: boolean
}

export function ArticleArtwork({
  src,
  alt = '',
  tone,
  seed = '',
  className,
  iconSize = 28,
  showLabel = false,
  zoomOnGroupHover = false,
  eager = false,
}: ArticleArtworkProps) {
  const [failed, setFailed] = useState(false)
  const rawId = useId()
  const patternId = `art-${rawId.replace(/:/g, '')}`

  useEffect(() => setFailed(false), [src])

  const showImage = !!src && !failed
  const Icon = tone.icon
  const rotate = PATTERN_ROTATIONS[seedOf(seed || alt) % PATTERN_ROTATIONS.length]

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {showImage ? (
        <img
          src={src as string}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
          className={cn(
            'h-full w-full object-cover',
            zoomOnGroupHover &&
              'motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.04]',
          )}
        />
      ) : (
        <div
          className={cn(
            'relative h-full w-full bg-gradient-to-br',
            tone.gradient,
            zoomOnGroupHover &&
              'motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.04]',
          )}
        >
          <div className="absolute inset-0 text-white/30">
            <BotanicalPattern patternId={patternId} rotate={rotate} />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 90% at 18% 8%, rgba(255,255,255,0.32), transparent 58%)',
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
            <span className="flex items-center justify-center rounded-2xl bg-white/20 p-3 ring-1 ring-white/35">
              <Icon size={iconSize} strokeWidth={1.5} />
            </span>
            {showLabel && (
              <span className="text-2xs font-semibold uppercase tracking-[0.2em] text-white/90">
                {tone.label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
