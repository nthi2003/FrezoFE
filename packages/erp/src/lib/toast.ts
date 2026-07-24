// ============================================================
// FREZO ERP — Toast Helper
// Wrapper cho sonner với style + logic chuẩn Frezo.
// - re-export `toast` gốc để code cũ vẫn chạy.
// - `toast.apiError(err, fallback)` chuẩn hoá extract message từ AppException.
// ============================================================

import { toast as sonnerToast } from 'sonner'

type ApiErrorLike =
  | {
      response?: {
        data?: {
          message?: string
          /** Legacy / alias field một số API cũ. */
          mess?: string
          errorKey?: string
          messageCode?: string
          error?: string
        }
      }
      message?: string
    }
  | Error
  | unknown

/** Key i18n dạng `a.b.c` — không dùng làm copy UI khi thiếu message đã resolve. */
function looksLikeI18nKey(value: string): boolean {
  const v = value.trim()
  if (!v || /\s/.test(v)) return false
  return /^[a-zA-Z][\w.-]*\.[a-zA-Z][\w.-]*$/.test(v)
}

/**
 * Extract message từ lỗi API (AppException, Axios, generic Error).
 * Ưu tiên message đã resolve từ BE (`message` / `mess`) — không lookup i18n lại từ messageCode.
 * Đặc biệt với `*.code.exist*` / `*.code.exists*`: trả nguyên `mess`/`message` từ API.
 */
export function extractApiErrorMessage(
  err: ApiErrorLike,
  fallback = 'Đã xảy ra lỗi, vui lòng thử lại.',
): string {
  if (!err) return fallback
  if (typeof err === 'string') return err

  const anyErr = err as any
  const data = anyErr?.response?.data as
    | {
        message?: string
        mess?: string
        error?: string
        errorKey?: string
        messageCode?: string
      }
    | undefined

  const messageCode = typeof data?.messageCode === 'string' ? data.messageCode.trim() : ''
  const errorKey = typeof data?.errorKey === 'string' ? data.errorKey.trim() : ''

  // Ưu tiên message/mess đã resolve. Nếu BE trả nhầm key vào message (== messageCode) thì bỏ qua.
  const candidates = [data?.message, data?.mess, data?.error]
  for (const raw of candidates) {
    if (typeof raw !== 'string' || !raw.trim()) continue
    const text = raw.trim()
    const isUnresolvedKey =
      looksLikeI18nKey(text) &&
      (text === messageCode || text === errorKey || /\.code\.exists?$/i.test(text))
    if (isUnresolvedKey) continue
    return text
  }

  // Không toast messageCode/errorKey thô (vd. validate.code.exist) — dùng fallback
  for (const raw of [errorKey, messageCode]) {
    if (raw && !looksLikeI18nKey(raw)) {
      return raw
    }
  }

  if (typeof anyErr?.message === 'string' && anyErr.message.trim()) {
    const m = anyErr.message.trim()
    // Axios default "Request failed with status code 400" → fallback
    if (!/^Request failed with status code \d+$/i.test(m) && !looksLikeI18nKey(m)) {
      return m
    }
  }

  return fallback
}

/**
 * Toast helpers — dùng chung style Frezo.
 * Sonner Toaster được cấu hình trong `app/providers.tsx` với richColors + top-right.
 */
export const toast = Object.assign(sonnerToast, {
  /**
   * Show error toast từ 1 API error (Axios/AppException/Error).
   * Tự động extract message chuẩn, có fallback.
   *
   * @example
   * toast.apiError(err, 'Lỗi khi xóa hợp đồng')
   */
  apiError(err: ApiErrorLike, fallback?: string): string | number {
    return sonnerToast.error(extractApiErrorMessage(err, fallback))
  },
})

// Re-export type-safe alias để dễ import
export type Toast = typeof toast
