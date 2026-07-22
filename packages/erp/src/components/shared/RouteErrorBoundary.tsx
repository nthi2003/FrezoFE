// ============================================================
// RouteErrorBoundary — React Router `errorElement`
// Bắt runtime error trong toàn bộ subtree route (kể cả lazy chunk lỗi
// do stale Vite cache, network fail, response.json() parse fail, v.v.)
// UX: giữ layout, hiện panel thẩm mỹ, có action Reload / Home / Copy stack.
// ============================================================

import { useState } from 'react'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import {
  AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp,
  ClipboardCopy, ClipboardCheck, ArrowLeft, ExternalLink,
} from 'lucide-react'
import { Button } from '@frezo/ui'
import { toast } from 'sonner'
import logoImg from '@/img/logo.png'

/**
 * Chuẩn hoá lỗi bất kể nguồn:
 * - Route error response (throw new Response(...))
 * - Error object thường
 * - String / any khác
 */
function normalizeError(err: unknown): {
  title: string
  message: string
  stack?: string
  status?: number
  hint?: string
} {
  if (isRouteErrorResponse(err)) {
    return {
      title: `${err.status} — ${err.statusText || 'Lỗi định tuyến'}`,
      message: typeof err.data === 'string' ? err.data : JSON.stringify(err.data ?? {}, null, 2),
      status: err.status,
    }
  }

  if (err instanceof Error) {
    const msg = err.message || 'Đã xảy ra lỗi không xác định.'
    // Đây là dấu hiệu điển hình của stale Vite pre-bundle cache / mismatched icon export
    // — hint cho dev cách xử lý nhanh.
    const looksLikeStaleCache =
      /does not provide an export named|Failed to fetch dynamically imported module|Loading chunk .* failed/i.test(msg)
    return {
      title: err.name || 'Lỗi ứng dụng',
      message: msg,
      stack: err.stack,
      hint: looksLikeStaleCache
        ? 'Có thể là cache Vite / import lỗi. Bấm "Tải lại" hoặc chạy `npm run dev -- --force` để rebuild deps.'
        : undefined,
    }
  }

  return {
    title: 'Lỗi không xác định',
    message: typeof err === 'string' ? err : JSON.stringify(err ?? {}, null, 2),
  }
}

export function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()
  const [showDetail, setShowDetail] = useState(false)
  const [copied, setCopied] = useState(false)

  const info = normalizeError(error)

  const handleCopy = async () => {
    const payload = [
      `Title:   ${info.title}`,
      `Path:    ${window.location.pathname}${window.location.search}`,
      `Message: ${info.message}`,
      info.stack ? `\nStack:\n${info.stack}` : '',
      `\nUA: ${navigator.userAgent}`,
      `Time: ${new Date().toISOString()}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      toast.success('Đã copy chi tiết lỗi vào clipboard.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Không copy được — trình duyệt chặn clipboard.')
    }
  }

  const handleReload = () => window.location.reload()
  const handleHome = () => navigate('/', { replace: true })
  const handleBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/', { replace: true }))

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-primary-50/40 px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Brand mini */}
        <div className="flex items-center gap-2.5 mb-5">
          <img src={logoImg} alt="Frezo" className="w-8 h-8 object-contain" />
          <div className="text-sm">
            <div className="font-bold text-primary-700 tracking-widest uppercase">Frezo</div>
            <div className="text-[11px] text-neutral-500 -mt-0.5">Enterprise Admin</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-start gap-4 p-6 border-b border-neutral-100 bg-gradient-to-r from-rose-50 via-white to-white">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-neutral-900">
                  {info.status ? `Lỗi ${info.status}` : 'Đã xảy ra lỗi'}
                </h1>
                <span className="text-[11px] font-medium text-neutral-500 px-2 py-0.5 rounded-full bg-neutral-100">
                  {info.title}
                </span>
              </div>
              <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
                Trang bạn đang xem không thể hiển thị đầy đủ. Tài khoản & dữ liệu của bạn vẫn an toàn.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Error message */}
            <div className="rounded-xl bg-neutral-950 text-neutral-100 text-[13px] p-4 font-mono leading-relaxed whitespace-pre-wrap break-words max-h-[180px] overflow-auto">
              {info.message}
            </div>

            {info.hint && (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-sm text-amber-800">
                <div className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={14} />
                </div>
                <div className="leading-relaxed">
                  <b className="font-semibold">Gợi ý:</b> {info.hint}
                </div>
              </div>
            )}

            {/* Stack toggle */}
            {info.stack && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowDetail((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
                >
                  {showDetail ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {showDetail ? 'Ẩn stack trace' : 'Xem stack trace chi tiết'}
                </button>
                {showDetail && (
                  <pre className="mt-2 rounded-lg bg-neutral-100 border border-neutral-200 text-[11px] text-neutral-700 p-3 overflow-auto max-h-[260px] font-mono leading-relaxed">
                    {info.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleReload} className="gap-1.5">
                <RefreshCw size={14} /> Tải lại trang
              </Button>
              <Button variant="outline" onClick={handleBack} className="gap-1.5">
                <ArrowLeft size={14} /> Quay lại
              </Button>
              <Button variant="outline" onClick={handleHome} className="gap-1.5">
                <Home size={14} /> Về Dashboard
              </Button>
              <Button variant="ghost" onClick={handleCopy} className="gap-1.5 ml-auto">
                {copied ? <ClipboardCheck size={14} className="text-emerald-600" /> : <ClipboardCopy size={14} />}
                {copied ? 'Đã copy' : 'Copy chi tiết lỗi'}
              </Button>
            </div>
          </div>

          {/* Footer help */}
          <div className="px-6 py-4 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between gap-3">
            <div className="text-[11px] text-neutral-500">
              Route: <code className="font-mono text-neutral-700">{window.location.pathname}</code>
              {info.status && (
                <>  ·  Status: <code className="font-mono text-neutral-700">{info.status}</code></>
              )}
            </div>
            <a
              href="mailto:support@frezo.local"
              className="text-[11px] font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              Gửi báo lỗi cho IT <ExternalLink size={11} />
            </a>
          </div>
        </div>

        {/* Console guidance for devs */}
        {import.meta.env.DEV && (
          <div className="mt-4 text-[11px] text-neutral-500 text-center">
            <b>Dev mode</b> · Đã in stack đầy đủ vào console. Có thể chạy <code className="font-mono px-1.5 py-0.5 rounded bg-neutral-100">npm run dev -- --force</code> để clear Vite cache.
          </div>
        )}
      </div>
    </div>
  )
}
