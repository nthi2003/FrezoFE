/**
 * Shared shell for Frezo celebrate / gift / redeem popups.
 * Asymmetric illustration panel + warm paper wash — not generic white AI modal.
 */

import type { CSSProperties, ReactNode } from 'react'
import { DialogDescription, DialogHeader, DialogTitle } from '@frezo/ui'
import { cn } from '@frezo/utils'
import { ConfettiLite } from './CelebratoryIllustrations'

/** Subtle paper grain via repeating SVG noise (inline data URI) */
const PAPER_STYLE: CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
}

export type CelebrateModalShellProps = {
  /** form = side illustration + title; celebrate = centered banner */
  layout?: 'form' | 'celebrate'
  illustration?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** Show confetti (celebrate layout) */
  confetti?: boolean
  /** Warm tone of the illustration panel */
  tone?: 'amber' | 'forest' | 'morning'
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

const PANEL_TONE: Record<NonNullable<CelebrateModalShellProps['tone']>, string> = {
  amber:
    'bg-[linear-gradient(145deg,#FFF7ED_0%,#FEF3C7_42%,#ECFDF5_100%)]',
  forest:
    'bg-[linear-gradient(155deg,#ECFDF5_0%,#D1FAE5_40%,#FEF3C7_100%)]',
  morning:
    'bg-[linear-gradient(160deg,#FFFBEB_0%,#FEF9C3_35%,#D1FAE5_100%)]',
}

export function CelebrateModalShell({
  layout = 'form',
  illustration,
  title,
  description,
  confetti = false,
  tone = 'amber',
  children,
  footer,
  className,
}: CelebrateModalShellProps) {
  if (layout === 'celebrate') {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        {confetti ? <ConfettiLite /> : null}
        <div
          className={cn('relative px-6 pb-7 pt-9', PANEL_TONE[tone])}
          style={PAPER_STYLE}
        >
          {/* forest accent rail */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-500 via-emerald-600 to-teal-700"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-emerald-500/15 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col items-center text-center">
            {illustration ? (
              <div className="mb-4 w-[7.5rem] drop-shadow-sm sm:w-36">{illustration}</div>
            ) : null}
            <DialogHeader className="space-y-2 text-center sm:text-center">
              <DialogTitle className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
                {title}
              </DialogTitle>
              {description ? (
                <DialogDescription className="text-base leading-relaxed text-neutral-600">
                  {description}
                </DialogDescription>
              ) : null}
            </DialogHeader>
          </div>
        </div>
        {(children || footer) && (
          <div className="border-t border-amber-100/80 bg-[#FFFCFA] px-6 py-4">
            {children}
            {footer}
          </div>
        )}
      </div>
    )
  }

  // form — asymmetric illustration column
  return (
    <div className={cn('overflow-hidden', className)}>
      <div
        className={cn(
          'relative grid gap-0 sm:grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)]',
          PANEL_TONE[tone],
        )}
        style={PAPER_STYLE}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-500 to-emerald-700"
          aria-hidden
        />
        <div className="relative flex items-end justify-center px-4 pb-3 pt-6 sm:items-center sm:pb-5 sm:pt-5">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,rgba(16,185,129,0.12),transparent_55%)]"
            aria-hidden
          />
          {illustration ? (
            <div className="relative w-24 drop-shadow-sm sm:w-[7.25rem]">{illustration}</div>
          ) : null}
        </div>
        <div className="relative flex flex-col justify-center px-5 pb-5 pt-2 sm:py-6 sm:pl-2 sm:pr-6">
          <DialogHeader className="space-y-1.5 text-left sm:text-left">
            <DialogTitle className="text-xl font-bold tracking-tight text-neutral-900">
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription className="text-base leading-relaxed text-neutral-600">
                {description}
              </DialogDescription>
            ) : null}
          </DialogHeader>
        </div>
      </div>
      {(children || footer) && (
        <div className="space-y-4 border-t border-amber-100/70 bg-[#FFFCFA] px-6 py-5">
          {children}
          {footer}
        </div>
      )}
    </div>
  )
}
