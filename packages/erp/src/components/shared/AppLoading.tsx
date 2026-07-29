// ============================================================
// FREZO ERP — Loading shell
// AppSplash: màn brand toàn trang (auth / bootstrap gate)
// PageLoader: loader trong MainLayout (route Suspense)
// ============================================================

import { useEffect, useState } from 'react'
import logoImg from '@/img/logo.png'

const BOOT_STEPS = [
  'Xác thực phiên đăng nhập',
  'Tải danh mục chức năng',
  'Chuẩn bị không gian làm việc',
]

/** Lá Frezo — dùng cho nền sáng, nơi logo trắng không hiển thị được. */
function LeafMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M20.5 3.5c0 8.6-4.7 13.6-11.4 13.6H6.6c.4-5.8 4.4-9.3 10.3-10.5-5.2.4-9.1 2.6-11.1 6.4C4 16.2 4.5 19 5.4 21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ---- Full-screen splash ----
export function AppSplash({ label = 'Đang mở Frezo ERP' }: { label?: string }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const iv = setInterval(
      () => setStep((s) => (s < BOOT_STEPS.length - 1 ? s + 1 : s)),
      1800,
    )
    return () => clearInterval(iv)
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="frz-splash fixed inset-0 z-[100] flex flex-col items-center justify-center
        overflow-hidden bg-[#060d09] px-6 text-center"
    >
      {/* Atmosphere — quầng xanh vườn + hơi ấm vụ mùa */}
      <div className="frz-glow frz-glow-a" />
      <div className="frz-glow frz-glow-b" />
      <div className="frz-glow frz-glow-c" />
      <div className="frz-grid" />
      <div className="frz-horizon" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Brand lockup trong vòng quỹ đạo */}
        <div className="relative flex h-[248px] w-[248px] items-center justify-center sm:h-[320px] sm:w-[320px]">
          <div className="absolute inset-0 rounded-full border border-emerald-400/10" />
          <div className="absolute inset-[16%] rounded-full border border-emerald-400/[0.07]" />
          <div className="frz-orbit absolute inset-0 rounded-full border border-transparent
            border-t-emerald-400/50 border-r-emerald-400/15" />
          <div className="frz-halo absolute inset-[22%] rounded-full bg-emerald-500/10 blur-2xl" />
          <img
            src={logoImg}
            alt="Frezo"
            className="relative w-[152px] object-contain sm:w-[196px]"
          />
        </div>

        <p className="-mt-3 max-w-[260px] text-[13px] leading-relaxed text-emerald-50/60
          sm:-mt-5 sm:max-w-[380px] sm:text-sm">
          Hệ thống quản trị nội bộ — nông sản, kho vận, con người.
        </p>

        {/* Progress */}
        <div className="mt-8 h-[3px] w-[220px] overflow-hidden rounded-full bg-white/10 sm:w-[280px]">
          <div className="frz-bar h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-400/0 via-emerald-400 to-emerald-300/0" />
        </div>

        {/* Trạng thái bootstrap */}
        <div className="mt-4 flex h-5 items-center gap-2">
          <span className="frz-halo h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span key={step} className="frz-step text-xs font-medium text-emerald-50/70">
            {BOOT_STEPS[step]}
          </span>
        </div>
      </div>

      <div className="absolute bottom-7 z-10 text-[11px] tracking-wide text-emerald-50/25">
        Frezo ERP • {new Date().getFullYear()}
      </div>

      <LoadingStyles />
    </div>
  )
}

// ---- In-layout loader (route Suspense trong MainLayout) ----
export function PageLoader({ label = 'Đang tải nội dung' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="frz-splash flex min-h-[60vh] w-full flex-col items-center justify-center gap-6 px-6"
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-primary-100" />
        <div className="frz-orbit-fast absolute inset-0 rounded-full border border-transparent
          border-t-primary-500 border-r-primary-200" />
        <div className="frz-halo absolute inset-2 rounded-full bg-primary-50" />
        <LeafMark className="frz-halo relative h-8 w-8 text-primary-600" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.32em] text-primary-700">
          Frezo
        </span>
        <span className="text-xs text-neutral-400">{label}…</span>
        <div className="h-[3px] w-44 overflow-hidden rounded-full bg-neutral-200">
          <div className="frz-bar h-full w-1/3 rounded-full bg-gradient-to-r from-primary-500/0 via-primary-500 to-primary-500/0" />
        </div>
      </div>

      <LoadingStyles />
    </div>
  )
}

function LoadingStyles() {
  return (
    <style>{`
      @keyframes frzOrbit { to { transform: rotate(360deg); } }
      @keyframes frzBar {
        0%   { transform: translateX(-110%); }
        100% { transform: translateX(320%); }
      }
      @keyframes frzBreathe {
        0%, 100% { opacity: 0.75; transform: scale(1); }
        50%      { opacity: 1;    transform: scale(1.05); }
      }
      @keyframes frzRise {
        from { opacity: 0; transform: translateY(4px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .frz-orbit      { animation: frzOrbit 14s linear infinite; }
      .frz-orbit-fast { animation: frzOrbit 2.4s linear infinite; }
      .frz-bar        { animation: frzBar 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
      .frz-halo       { animation: frzBreathe 3s ease-in-out infinite; }
      .frz-step       { animation: frzRise 0.4s ease-out; }

      .frz-glow {
        position: absolute;
        border-radius: 9999px;
        filter: blur(120px);
        pointer-events: none;
      }
      .frz-glow-a {
        top: -20%; left: -10%;
        width: 620px; height: 620px;
        background: rgba(34, 197, 94, 0.20);
      }
      .frz-glow-b {
        bottom: -25%; right: -8%;
        width: 540px; height: 540px;
        background: rgba(13, 148, 136, 0.18);
      }
      /* Sắc ấm rất nhẹ — gợi nắng vụ mùa trên nền xanh, không phá tone brand */
      .frz-glow-c {
        bottom: -10%; left: 28%;
        width: 420px; height: 420px;
        background: rgba(202, 138, 4, 0.12);
      }
      .frz-grid {
        position: absolute;
        inset: 0;
        opacity: 0.05;
        pointer-events: none;
        background-image:
          linear-gradient(#22c55e 1px, transparent 1px),
          linear-gradient(90deg, #22c55e 1px, transparent 1px);
        background-size: 72px 72px;
        mask-image: radial-gradient(ellipse at center, #000 20%, transparent 78%);
        -webkit-mask-image: radial-gradient(ellipse at center, #000 20%, transparent 78%);
      }
      .frz-horizon {
        position: absolute;
        inset: auto 0 0 0;
        height: 42%;
        pointer-events: none;
        background: linear-gradient(to top, rgba(5, 46, 22, 0.55), transparent);
      }

      @media (prefers-reduced-motion: reduce) {
        .frz-splash * { animation: none !important; }
        .frz-splash .frz-bar { width: 100%; }
      }
    `}</style>
  )
}
