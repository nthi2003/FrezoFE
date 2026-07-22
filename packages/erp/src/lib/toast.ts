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
          errorKey?: string
          error?: string
        }
      }
      message?: string
    }
  | Error
  | unknown

/**
 * Extract message từ lỗi API (AppException, Axios, generic Error).
 * Ưu tiên: response.data.message → response.data.error → err.message → fallback.
 */
export function extractApiErrorMessage(
  err: ApiErrorLike,
  fallback = 'Đã xảy ra lỗi, vui lòng thử lại.',
): string {
  if (!err) return fallback
  if (typeof err === 'string') return err

  const anyErr = err as any
  const fromResponse =
    anyErr?.response?.data?.message ??
    anyErr?.response?.data?.error ??
    anyErr?.response?.data?.errorKey
  if (typeof fromResponse === 'string' && fromResponse.trim()) {
    return fromResponse
  }

  if (typeof anyErr?.message === 'string' && anyErr.message.trim()) {
    return anyErr.message
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
