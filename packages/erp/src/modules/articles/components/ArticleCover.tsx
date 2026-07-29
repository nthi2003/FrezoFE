import { useEffect, useState } from 'react'
import { Newspaper } from 'lucide-react'
import { cn } from '@frezo/utils'

interface ArticleCoverProps {
  src?: string | null
  alt?: string
  /** Kích thước khung — caller quyết định aspect / height. */
  className?: string
  iconSize?: number
  /** Zoom nhẹ khi cha có class `group` hover. */
  zoomOnGroupHover?: boolean
}

/**
 * Ảnh cover bài viết + fallback im lặng khi thiếu ảnh hoặc URL hỏng.
 * Không bao giờ để khung trắng trống — luôn có surface + icon.
 */
export function ArticleCover({
  src,
  alt = '',
  className,
  iconSize = 28,
  zoomOnGroupHover = false,
}: ArticleCoverProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [src])

  const showImage = !!src && !failed

  return (
    <div className={cn('relative overflow-hidden bg-neutral-100', className)}>
      {showImage ? (
        <img
          src={src as string}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn(
            'w-full h-full object-cover',
            zoomOnGroupHover &&
              'transition-transform duration-200 ease-out group-hover:scale-[1.02]',
          )}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-neutral-300">
          <Newspaper size={iconSize} strokeWidth={1.5} />
        </div>
      )}
    </div>
  )
}
