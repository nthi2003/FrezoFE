import * as React from 'react'
import { ExternalLink, Maximize2, Minus, Plus, RotateCcw } from 'lucide-react'
import { cn } from '@frezo/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './dialog'

const ZOOM_MIN = 0.25
const ZOOM_MAX = 4
const ZOOM_STEP = 0.25

function clampZoom(value: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100))
}

export interface ImageLightboxProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  src: string
  alt?: string
  /** Tiêu đề hiển thị trên thanh công cụ; mặc định lấy theo alt. */
  caption?: string
}

/** Xem ảnh gần full màn hình: zoom, cuộn để xem chi tiết, Esc/overlay/X để đóng. */
export function ImageLightbox({
  open,
  onOpenChange,
  src,
  alt = 'Hình minh họa',
  caption,
}: ImageLightboxProps) {
  const [fit, setFit] = React.useState(true)
  const [zoom, setZoom] = React.useState(1)
  const [naturalWidth, setNaturalWidth] = React.useState(0)
  const title = caption?.trim() || alt

  React.useEffect(() => {
    if (open) {
      setFit(true)
      setZoom(1)
    }
  }, [open, src])

  const applyZoom = (next: number) => {
    setFit(false)
    setZoom(clampZoom(next))
  }

  const resetFit = () => {
    setFit(true)
    setZoom(1)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      applyZoom(zoom + ZOOM_STEP)
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault()
      applyZoom(zoom - ZOOM_STEP)
    } else if (e.key === '0') {
      e.preventDefault()
      resetFit()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onKeyDown={onKeyDown}
        className="flex h-[92vh] w-[96vw] max-w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 py-2.5 pr-12">
          <DialogTitle className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-800">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Dùng nút phóng to/thu nhỏ hoặc phím + và − để xem chi tiết, phím 0 để
            vừa khung, phím Esc để đóng.
          </DialogDescription>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => applyZoom(zoom - ZOOM_STEP)}
              aria-label="Thu nhỏ"
              className="rounded-lg border border-neutral-200 p-1.5 text-neutral-600 transition hover:border-primary-300 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-[68px] text-center text-xs font-medium tabular-nums text-neutral-500">
              {fit ? 'Vừa khung' : `${Math.round(zoom * 100)}%`}
            </span>
            <button
              type="button"
              onClick={() => applyZoom(zoom + ZOOM_STEP)}
              aria-label="Phóng to"
              className="rounded-lg border border-neutral-200 p-1.5 text-neutral-600 transition hover:border-primary-300 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              onClick={resetFit}
              aria-label="Về kích thước vừa khung"
              className="ml-1 rounded-lg border border-neutral-200 p-1.5 text-neutral-600 transition hover:border-primary-300 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <RotateCcw size={14} />
            </button>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              aria-label="Mở ảnh gốc ở tab mới"
              className="rounded-lg border border-neutral-200 p-1.5 text-neutral-600 transition hover:border-primary-300 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-neutral-100 p-3 sm:p-5">
          <div
            className={cn(
              'flex min-h-full w-full items-center justify-center',
              !fit && 'w-max min-w-full items-start',
            )}
          >
            <img
              src={src}
              alt={alt}
              onLoad={(e) => setNaturalWidth(e.currentTarget.naturalWidth)}
              onClick={() => (fit ? applyZoom(1) : resetFit())}
              style={
                fit || !naturalWidth
                  ? undefined
                  : { width: `${Math.round(naturalWidth * zoom)}px` }
              }
              className={cn(
                'block rounded-lg border border-neutral-200 bg-white shadow-sm',
                fit
                  ? 'max-h-full max-w-full cursor-zoom-in object-contain'
                  : 'max-w-none cursor-zoom-out',
              )}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export interface ZoomableImageProps {
  src: string
  alt?: string
  /** Chú thích hiển thị trên lightbox; mặc định lấy theo alt. */
  caption?: string
  /** Ảnh nằm giữa dòng văn bản thay vì là block riêng. */
  inline?: boolean
  /** Nhãn gợi ý hiện khi hover. */
  hint?: string
  className?: string
  imgClassName?: string
}

/** Ảnh trong nội dung: hover gợi ý, bấm để mở lightbox xem chi tiết. */
export function ZoomableImage({
  src,
  alt = 'Hình minh họa',
  caption,
  inline = false,
  hint = 'Bấm để phóng to',
  className,
  imgClassName,
}: ZoomableImageProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Phóng to hình: ${caption?.trim() || alt}`}
        title={hint}
        className={cn(
          'group relative cursor-zoom-in overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:border-primary-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          inline ? 'inline-block align-middle' : 'block max-w-full',
          className,
        )}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={cn(
            'block max-w-full transition-transform duration-300 group-hover:scale-[1.01]',
            imgClassName,
          )}
        />
        <span className="pointer-events-none absolute inset-0 bg-neutral-900/0 transition-colors group-hover:bg-neutral-900/5" />
        <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-neutral-900/75 px-2 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 size={12} />
          {hint}
        </span>
      </button>

      <ImageLightbox
        open={open}
        onOpenChange={setOpen}
        src={src}
        alt={alt}
        caption={caption}
      />
    </>
  )
}
