/**
 * Frezo celebratory illustrations — inline SVG (MIT).
 * Palette: emerald + amber. Flat, minimal — no sparkle clutter.
 */

import { useId } from 'react'
import { cn } from '@frezo/utils'

type IllustProps = {
  className?: string
  'aria-hidden'?: boolean
}

/** Gift box + token — Tặng token */
export function GiftBoxIllustration({ className, ...rest }: IllustProps) {
  const uid = useId().replace(/:/g, '')
  const boxGrad = `giftBox-${uid}`
  const lidGrad = `giftLid-${uid}`
  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-auto w-full', className)}
      {...rest}
    >
      <ellipse cx="100" cy="162" rx="56" ry="8" fill="#B45309" fillOpacity="0.1" />

      {/* leaf accents — subtle, asymmetric */}
      <path
        d="M24 108c6-18 20-24 30-14-12 4-18 14-22 26-3-4-5-8-8-12z"
        fill="#059669"
        fillOpacity="0.28"
      />
      <path
        d="M172 98c-4-14-16-22-28-12 10 2 16 10 20 20 4-3 6-6 8-8z"
        fill="#10B981"
        fillOpacity="0.22"
      />

      {/* box body */}
      <path
        d="M44 86h112v52c0 6.627-5.373 12-12 12H56c-6.627 0-12-5.373-12-12V86z"
        fill={`url(#${boxGrad})`}
        stroke="#047857"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* right facet */}
      <path
        d="M144 86v52c0 6.627-5.373 12-12 12h12c6.627 0 12-5.373 12-12V86h-12z"
        fill="#047857"
        fillOpacity="0.35"
      />

      {/* lid */}
      <path
        d="M36 68h128c2.21 0 4 1.79 4 4v14H32V72c0-2.21 1.79-4 4-4z"
        fill={`url(#${lidGrad})`}
        stroke="#059669"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M36 68h128v6H36z" fill="#6EE7B7" fillOpacity="0.35" />

      {/* ribbons */}
      <rect x="92" y="68" width="16" height="94" rx="1" fill="#F59E0B" />
      <rect x="92" y="68" width="8" height="94" fill="#FBBF24" fillOpacity="0.45" />
      <rect x="36" y="84" width="128" height="14" rx="1" fill="#FBBF24" />
      <rect x="36" y="84" width="128" height="5" fill="#FEF3C7" fillOpacity="0.55" />

      {/* bow — simple loops */}
      <path
        d="M100 68c-14-16-34-18-40-6-2 8 4 14 14 16h26"
        fill="#F59E0B"
        stroke="#B45309"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M100 68c14-16 34-18 40-6 2 8-4 14-14 16H100"
        fill="#D97706"
        stroke="#B45309"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="100" cy="68" r="8" fill="#B45309" />
      <circle cx="100" cy="68" r="4" fill="#FDE68A" />

      {/* token peeking out */}
      <circle cx="100" cy="118" r="18" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
      <circle cx="100" cy="118" r="11" fill="#FEF3C7" />
      <text
        x="100"
        y="123"
        textAnchor="middle"
        fill="#92400E"
        fontSize="13"
        fontWeight="700"
        fontFamily="system-ui,sans-serif"
      >
        ₮
      </text>

      <defs>
        <linearGradient id={boxGrad} x1="44" y1="86" x2="156" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={lidGrad} x1="36" y1="68" x2="164" y2="86" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6EE7B7" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** Trophy + laurel — thành công */
export function SuccessTrophyIllustration({ className, ...rest }: IllustProps) {
  const uid = useId().replace(/:/g, '')
  const cupGrad = `trophyCup-${uid}`
  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-auto w-full', className)}
      {...rest}
    >
      <ellipse cx="100" cy="164" rx="50" ry="8" fill="#B45309" fillOpacity="0.12" />

      {/* laurel */}
      <path
        d="M52 120c-8-16-6-36 8-46 0 10 6 20 14 28-8 2-16 8-22 18z"
        fill="#059669"
        fillOpacity="0.5"
      />
      <path
        d="M148 120c8-16 6-36-8-46 0 10-6 20-14 28 8 2 16 8 22 18z"
        fill="#047857"
        fillOpacity="0.5"
      />

      {/* cup body */}
      <path
        d="M64 52h72c0 32-12 54-36 62-24-8-36-30-36-62z"
        fill={`url(#${cupGrad})`}
        stroke="#B45309"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* handles */}
      <path
        d="M64 58c-14 2-20 16-16 30 3 10 12 14 20 10"
        stroke="#D97706"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M136 58c14 2 20 16 16 30-3 10-12 14-20 10"
        stroke="#D97706"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* rim */}
      <rect x="60" y="46" width="80" height="10" rx="2" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />
      {/* stem + base */}
      <rect x="92" y="114" width="16" height="16" rx="1" fill="#B45309" />
      <rect x="76" y="128" width="48" height="10" rx="3" fill="#92400E" />
      <rect x="82" y="136" width="36" height="6" rx="2" fill="#78350F" />

      {/* check mark on cup — clearer than star */}
      <circle cx="100" cy="78" r="14" fill="#059669" fillOpacity="0.9" />
      <path
        d="M93 78l4.5 4.5L107 73"
        stroke="#ECFDF5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <defs>
        <linearGradient id={cupGrad} x1="64" y1="52" x2="136" y2="114" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="0.6" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** Open empty crate — trống */
export function EmptyCrateIllustration({ className, ...rest }: IllustProps) {
  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-auto w-full', className)}
      {...rest}
    >
      <ellipse cx="100" cy="158" rx="54" ry="8" fill="#78716C" fillOpacity="0.1" />
      <path d="M50 72l50-20 50 20v16L100 106 50 88V72z" fill="#D6D3D1" stroke="#A8A29E" strokeWidth="1.5" />
      <path d="M50 72L32 52l18 8v12z" fill="#FBBF24" fillOpacity="0.8" stroke="#D97706" strokeWidth="1" />
      <path d="M150 72l18-20-18 8v12z" fill="#F59E0B" fillOpacity="0.8" stroke="#D97706" strokeWidth="1" />
      <path d="M100 52L80 36l20 16 20-16-20 16z" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" />
      <path
        d="M50 88l50 20 50-20v40c0 5.523-4.477 10-10 10H60c-5.523 0-10-4.477-10-10V88z"
        fill="#78716C"
        stroke="#57534E"
        strokeWidth="1.5"
      />
      <path d="M62 112h76M62 124h76" stroke="#57534E" strokeWidth="1.5" strokeOpacity="0.35" />
      <circle cx="100" cy="110" r="12" stroke="#D97706" strokeWidth="2" strokeDasharray="3 3" fill="none" />
      <path d="M158 120c8-12 18-16 22-8-8 2-14 8-18 16-2-3-3-6-4-8z" fill="#10B981" fillOpacity="0.45" />
    </svg>
  )
}

/** Morning desk — chào buổi sáng */
export function MorningWelcomeIllustration({ className, ...rest }: IllustProps) {
  const uid = useId().replace(/:/g, '')
  const skyGrad = `morningSky-${uid}`
  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-auto w-full', className)}
      {...rest}
    >
      <rect x="18" y="18" width="164" height="144" rx="14" fill={`url(#${skyGrad})`} />
      <circle cx="146" cy="50" r="20" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
      <circle cx="146" cy="50" r="12" fill="#FEF3C7" />
      <path
        d="M146 24v5M146 71v5M120 50h5M167 50h5"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M18 112c26-16 46-12 70-2 18-14 40-20 74-6v42H18v-34z" fill="#059669" fillOpacity="0.3" />
      <path d="M18 126c34-18 56-10 84 4 22-12 44-8 76 4v28H18v-36z" fill="#047857" fillOpacity="0.4" />
      <rect x="38" y="130" width="124" height="8" rx="2" fill="#92400E" />
      <rect x="42" y="138" width="6" height="16" rx="1" fill="#78350F" />
      <rect x="152" y="138" width="6" height="16" rx="1" fill="#78350F" />
      <rect x="54" y="110" width="20" height="20" rx="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" />
      <path d="M74 116h6c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5h-6" stroke="#D97706" strokeWidth="2.5" fill="none" />
      <path d="M146 120h18l-2.5 18h-13l-2.5-18z" fill="#B45309" />
      <path d="M150 110c-2-10 5-16 10-8-2 5 0 10 1 14-5 0-10-2-11-6z" fill="#10B981" />
      <rect x="90" y="114" width="40" height="16" rx="2" fill="#FFFBEB" stroke="#D6D3D1" strokeWidth="1" />
      <path d="M96 120h28M96 126h18" stroke="#D6D3D1" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="90" y="114" width="5" height="16" rx="1" fill="#059669" />
      <circle cx="50" cy="50" r="12" fill="#059669" />
      <path
        d="M44 50l3.5 3.5L56 45"
        stroke="#ECFDF5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id={skyGrad} x1="100" y1="18" x2="100" y2="162" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF3C7" />
          <stop offset="1" stopColor="#D1FAE5" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** Coins stack — đổi thưởng */
export function CoinsStackIllustration({ className, ...rest }: IllustProps) {
  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-auto w-full', className)}
      {...rest}
    >
      <ellipse cx="100" cy="160" rx="54" ry="8" fill="#B45309" fillOpacity="0.12" />
      <ellipse cx="116" cy="110" rx="34" ry="11" fill="#B45309" />
      <rect x="82" y="82" width="68" height="28" fill="#D97706" />
      <ellipse cx="116" cy="82" rx="34" ry="11" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
      <ellipse cx="76" cy="128" rx="38" ry="12" fill="#92400E" />
      <rect x="38" y="96" width="76" height="32" fill="#F59E0B" />
      <ellipse cx="76" cy="96" rx="38" ry="12" fill="#FCD34D" stroke="#B45309" strokeWidth="1" />
      <text
        x="76"
        y="102"
        textAnchor="middle"
        fill="#92400E"
        fontSize="13"
        fontWeight="700"
        fontFamily="system-ui,sans-serif"
      >
        ₮
      </text>
      <circle cx="148" cy="54" r="20" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
      <text
        x="148"
        y="59"
        textAnchor="middle"
        fill="#92400E"
        fontSize="12"
        fontWeight="700"
        fontFamily="system-ui,sans-serif"
      >
        ₮
      </text>
      <path d="M160 126c10-14 22-18 26-8-10 2-16 10-20 18-2-5-4-8-6-10z" fill="#059669" fillOpacity="0.45" />
    </svg>
  )
}

/** Confetti nhẹ — amber/emerald only */
export function ConfettiLite({ className }: { className?: string }) {
  const bits = [
    { left: '12%', delay: '0s', color: 'bg-amber-400', w: 'w-1.5', h: 'h-2' },
    { left: '28%', delay: '0.12s', color: 'bg-emerald-500', w: 'w-1', h: 'h-1.5' },
    { left: '44%', delay: '0.06s', color: 'bg-amber-300', w: 'w-2', h: 'h-1' },
    { left: '58%', delay: '0.2s', color: 'bg-emerald-400', w: 'w-1.5', h: 'h-1.5' },
    { left: '72%', delay: '0.1s', color: 'bg-amber-500', w: 'w-1', h: 'h-2' },
    { left: '86%', delay: '0.18s', color: 'bg-teal-500', w: 'w-1.5', h: 'h-1' },
  ]
  return (
    <div
      className={cn('pointer-events-none absolute inset-x-0 top-0 h-24 overflow-hidden', className)}
      aria-hidden
    >
      {bits.map((b, i) => (
        <span
          key={i}
          className={cn(
            'absolute top-0 rounded-[1px] opacity-80 animate-[confettiFall_1.4s_ease-out_forwards]',
            b.color,
            b.w,
            b.h,
          )}
          style={{ left: b.left, animationDelay: b.delay }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-8px); opacity: 0; }
          20% { opacity: 0.85; }
          100% { transform: translateY(80px) rotate(180deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
