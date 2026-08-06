import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { Skeleton } from '@frezo/ui'
import { cn } from '@/lib/utils/cn'

const AUTO_MS = 6000

export interface NewsBanner {
  id?: string
  title?: string
  imageUrl?: string
  linkUrl?: string
}

interface NewsBannerCarouselProps {
  banners: NewsBanner[]
  isLoading?: boolean
}

export function NewsBannerCarousel({ banners, isLoading = false }: NewsBannerCarouselProps) {
  const nav = useNavigate()
  const slides = banners.filter((b) => b.imageUrl)
  const [index, setIndex] = useState(0)

  useEffect(() => setIndex(0), [slides.length, slides[0]?.id])

  const go = useCallback(
    (delta: number) => {
      if (slides.length <= 1) return
      setIndex((i) => (i + delta + slides.length) % slides.length)
    },
    [slides.length],
  )

  useEffect(() => {
    if (slides.length <= 1) return
    const id = window.setInterval(() => go(1), AUTO_MS)
    return () => window.clearInterval(id)
  }, [go, slides.length])

  const open = (banner: NewsBanner) => {
    if (banner.linkUrl?.startsWith('http')) {
      window.open(banner.linkUrl, '_blank', 'noopener,noreferrer')
      return
    }
    if (banner.linkUrl?.startsWith('/')) {
      nav(banner.linkUrl)
    }
  }

  if (isLoading) {
    return (
      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-surface">
        <Skeleton className="aspect-[21/9] w-full rounded-none" />
      </section>
    )
  }

  if (!slides.length) return null

  const current = slides[index]

  return (
    <section
      className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-surface shadow-sm"
      aria-roledescription="carousel"
      aria-label="Banner tin tức"
    >
      <button
        type="button"
        onClick={() => open(current)}
        className="relative block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
      >
        <img
          src={current.imageUrl}
          alt={current.title || 'Banner'}
          className="aspect-[21/9] w-full object-cover"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-neutral-900/20 to-transparent" />
        {current.title && (
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white sm:text-xl line-clamp-2">{current.title}</h2>
          </div>
        )}
      </button>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Banner trước"
            className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-neutral-900/40 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-neutral-900/60 group-hover:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Banner sau"
            className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-neutral-900/40 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-neutral-900/60 group-hover:opacity-100"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id ?? i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-6 bg-primary-400' : 'w-1.5 bg-white/50 hover:bg-white/80',
                )}
              />
            ))}
          </div>
        </>
      )}

      {!current.imageUrl && (
        <div className="flex aspect-[21/9] items-center justify-center bg-neutral-100 text-neutral-400">
          <ImageIcon size={32} />
        </div>
      )}
    </section>
  )
}
