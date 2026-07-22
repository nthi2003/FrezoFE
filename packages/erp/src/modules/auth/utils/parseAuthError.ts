// ============================================================
// parseAuthError — Chuyển lỗi HTTP/network → thông báo user-friendly tiếng Việt
// ============================================================
//
// BE có thể trả về:
//   - 401 + message "Username or password is incorrect" (raw English legacy)
//   - 400/401/403 + message đã resolve i18n Việt (VD: "Địa chỉ IP hoặc tài khoản...")
//   - 429 + message "Quá nhiều yêu cầu..."
//   - Không response (network / CORS / server down)
//
// Trả về `AuthError` typed để LoginPage render UI khác nhau theo severity + action.
// ============================================================

export type AuthErrorSeverity = 'warning' | 'error' | 'blocked' | 'network' | 'server'

export interface AuthError {
  /** Tiêu đề ngắn, hiển thị đậm — VD: "Sai tên đăng nhập hoặc mật khẩu" */
  title: string
  /** Mô tả dài, có thể null — VD: "Còn 2 lần thử. Sau đó tài khoản sẽ bị khóa 15 phút" */
  hint?: string
  /** Quyết định màu sắc + icon của error card */
  severity: AuthErrorSeverity
  /** Sau khi hiển thị error, focus field nào (giúp user retry nhanh) */
  focusField?: 'username' | 'password'
  /** Field nào cần clear (không xóa cả 2 để user không phải gõ lại username) */
  clearField?: 'password' | 'both'
  /** Có nên gợi ý "Quên mật khẩu?" không (VD: sai 3 lần liên tiếp) */
  showForgotPassword?: boolean
  /** Nếu là 429/blocked, số giây phải chờ trước khi retry (dùng cho countdown) */
  retryAfterSeconds?: number
}

// ------------------------------------------------------------
// Legacy message → user-friendly Vietnamese mapping
// ------------------------------------------------------------
// Server dùng "Username or password is incorrect" cho SAI mật khẩu.
// Match case-insensitive để không phụ thuộc capitalization.
const RE_WRONG_CREDENTIALS = /(username or password.*incorrect|invalid username or password|sai (tên|mật)|bad credentials)/i
const RE_ACCOUNT_LOCKED    = /(tài khoản.*(khóa|khoá|kh\u00f3a)|account.*locked|user.*locked)/i
const RE_IP_BLOCKED        = /(ip.*(kh(óa|oá)|block)|địa chỉ ip.*(khóa|kh\u00f3a))/i
const RE_TOO_MANY_REQ      = /(too many|quá nhiều|rate.*limit)/i
const RE_USER_NOT_FOUND    = /(user not found|user.*(không tồn tại|kh\u00f4ng t\u1ed3n t\u1ea1i))/i
const RE_2FA_REQUIRED      = /(2fa|two.?factor|otp.*(yêu cầu|required))/i

/**
 * Cố gắng đọc số giây phải chờ từ message BE.
 * VD: "Thử lại sau 45 giây" hoặc "Retry after 30 seconds"
 */
function extractRetryAfter(message: string, headers?: Record<string, unknown>): number | undefined {
  // Ưu tiên header chuẩn Retry-After
  const headerVal = headers?.['retry-after']
  if (headerVal != null) {
    const n = Number(headerVal)
    if (Number.isFinite(n) && n > 0) return n
  }
  // Fallback parse từ message tiếng Việt / Anh
  const m = message.match(/(\d+)\s*(giây|second|s\b)/i)
  if (m) return Number(m[1])
  const mMin = message.match(/(\d+)\s*(phút|minute|min\b)/i)
  if (mMin) return Number(mMin[1]) * 60
  return undefined
}

// ------------------------------------------------------------
// Main parser
// ------------------------------------------------------------
export function parseAuthError(err: unknown, opts?: {
  /** Số lần đã fail liên tiếp (client-side count) — dùng để gợi ý "Quên mật khẩu" sau 3 lần. */
  failedAttempts?: number
}): AuthError {
  const attempts = opts?.failedAttempts ?? 0

  // ---- Network / no response ----
  if (isAxiosLikeError(err) && !err.response) {
    if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) {
      return {
        title: 'Máy chủ phản hồi quá chậm',
        hint: 'Kiểm tra lại tốc độ internet hoặc thử lại sau ít phút.',
        severity: 'network',
        focusField: 'username',
      }
    }
    return {
      title: 'Không kết nối được máy chủ',
      hint: 'Vui lòng kiểm tra kết nối internet và thử lại.',
      severity: 'network',
      focusField: 'username',
    }
  }

  const status = getStatus(err)
  const rawMessage = getMessage(err) || ''
  const headers = getHeaders(err)

  // ---- 429 rate limit ----
  if (status === 429 || RE_TOO_MANY_REQ.test(rawMessage)) {
    const secs = extractRetryAfter(rawMessage, headers) ?? 60
    return {
      title: 'Bạn thử quá nhiều lần',
      hint: `Vui lòng chờ ${secs} giây rồi thử lại. Nếu quên mật khẩu, hãy dùng chức năng khôi phục.`,
      severity: 'blocked',
      focusField: 'username',
      showForgotPassword: true,
      retryAfterSeconds: secs,
    }
  }

  // ---- IP hoặc account bị khoá ----
  if (RE_IP_BLOCKED.test(rawMessage) || RE_ACCOUNT_LOCKED.test(rawMessage)) {
    const secs = extractRetryAfter(rawMessage, headers)
    return {
      title: 'Tài khoản tạm khóa',
      hint: secs
        ? `Vui lòng chờ ${Math.ceil(secs / 60)} phút rồi thử lại, hoặc liên hệ quản trị viên.`
        : 'Do sai quá nhiều lần. Vui lòng chờ 15 phút hoặc liên hệ quản trị viên.',
      severity: 'blocked',
      focusField: 'username',
      showForgotPassword: true,
      retryAfterSeconds: secs,
    }
  }

  // ---- 2FA required ----
  if (status === 403 && RE_2FA_REQUIRED.test(rawMessage)) {
    return {
      title: 'Cần mã xác thực 2FA',
      hint: 'Mã OTP đã được gửi đến email của bạn. Vui lòng nhập mã để hoàn tất đăng nhập.',
      severity: 'warning',
      focusField: 'password',
    }
  }

  // ---- User không tồn tại (BE có thể lộ, thường trả chung với sai password) ----
  if (RE_USER_NOT_FOUND.test(rawMessage)) {
    return {
      title: 'Tên đăng nhập không tồn tại',
      hint: 'Kiểm tra lại chính tả hoặc liên hệ quản trị viên để được cấp tài khoản.',
      severity: 'error',
      focusField: 'username',
      clearField: 'password',
    }
  }

  // ---- 401 / sai mật khẩu (case phổ biến nhất) ----
  if (status === 401 || RE_WRONG_CREDENTIALS.test(rawMessage)) {
    const isThirdFail = attempts >= 2 // attempts=2 nghĩa là đây là lần thứ 3
    return {
      title: 'Sai tên đăng nhập hoặc mật khẩu',
      hint: isThirdFail
        ? `Đã sai ${attempts + 1} lần. Nếu quên mật khẩu, bạn có thể đặt lại qua email.`
        : 'Kiểm tra lại Caps Lock và chính tả rồi thử lại.',
      severity: 'error',
      focusField: 'password',
      clearField: 'password',
      showForgotPassword: isThirdFail,
    }
  }

  // ---- 500+ server error ----
  if (typeof status === 'number' && status >= 500) {
    return {
      title: 'Máy chủ gặp sự cố',
      hint: 'Hệ thống đang tạm thời không phản hồi. Vui lòng thử lại sau ít phút.',
      severity: 'server',
      focusField: 'username',
    }
  }

  // ---- Fallback: hiển thị message gốc ----
  return {
    title: rawMessage || 'Đăng nhập không thành công',
    hint: 'Vui lòng thử lại. Nếu vấn đề tiếp diễn, liên hệ quản trị viên.',
    severity: 'error',
    focusField: 'password',
    clearField: 'password',
  }
}

// ------------------------------------------------------------
// Small helpers (avoid `any` casts everywhere)
// ------------------------------------------------------------
interface AxiosLikeError {
  message?: string
  code?: string
  response?: {
    status?: number
    data?: { message?: string; error?: string }
    headers?: Record<string, unknown>
  }
}

function isAxiosLikeError(err: unknown): err is AxiosLikeError {
  return typeof err === 'object' && err !== null && ('response' in err || 'message' in err)
}

function getStatus(err: unknown): number | undefined {
  return isAxiosLikeError(err) ? err.response?.status : undefined
}

function getMessage(err: unknown): string | undefined {
  if (!isAxiosLikeError(err)) return undefined
  return err.response?.data?.message || err.response?.data?.error || err.message
}

function getHeaders(err: unknown): Record<string, unknown> | undefined {
  return isAxiosLikeError(err) ? err.response?.headers : undefined
}
