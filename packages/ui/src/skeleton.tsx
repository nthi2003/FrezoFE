import { cn } from '@frezo/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Skeleton — placeholder loading animation.
 * Base primitive; kết hợp thêm SkeletonText / SkeletonCircle / SkeletonTable ở dưới.
 */
function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-neutral-200', className)}
      aria-hidden="true"
      {...props}
    />
  )
}

/**
 * SkeletonText — 1 dòng chữ giả.
 * Prop `width` để tuỳ chỉnh, mặc định full width.
 */
function SkeletonText({
  className,
  width,
  ...props
}: SkeletonProps & { width?: string }) {
  return (
    <Skeleton
      className={cn('h-4', className)}
      style={width ? { width } : undefined}
      {...props}
    />
  )
}

/**
 * SkeletonCircle — placeholder cho avatar/icon tròn.
 */
function SkeletonCircle({
  className,
  size = 40,
  ...props
}: SkeletonProps & { size?: number }) {
  return (
    <Skeleton
      className={cn('rounded-full', className)}
      style={{ width: size, height: size }}
      {...props}
    />
  )
}

/**
 * SkeletonTable — placeholder cho AppTable trong lúc loading.
 * Match visual với table hover style của Frezo (header + rows + divider).
 */
function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-xl border border-border bg-surface',
        className,
      )}
      role="status"
      aria-label="Đang tải dữ liệu"
    >
      <div className="border-b border-border bg-neutral-50 px-4 py-3 grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonText key={i} className="h-3" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="px-4 py-4 grid gap-4"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, colIdx) => (
              <SkeletonText key={colIdx} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCircle, SkeletonTable }
