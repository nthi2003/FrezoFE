import { forwardRef } from 'react'
import type { LucideProps } from 'lucide-react'

/**
 * FacebookIcon — icon custom shape khớp với Lucide (ForwardRefExoticComponent<LucideProps>)
 * để dùng chung trong ICON_MAP của Sidebar và các nơi khác nhận LucideIcon.
 *
 * Lucide v0.3xx+ export mọi icon qua forwardRef; nếu không cùng shape TS sẽ báo:
 *   "Property '$$typeof' is missing in type ..."
 */
export const FacebookIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, strokeWidth = 2, className, color = 'currentColor', ...rest }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
)
FacebookIcon.displayName = 'FacebookIcon'
