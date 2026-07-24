// ============================================================
// FREZO Utils — Format helpers (Vietnamese-first)
// ============================================================

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Format ngày dài kiểu "Thứ Ba, 13/07/2026".
 * Dùng cho notification, activity feed, timeline.
 */
export const formatDateLong = (date: string | Date | null | undefined): string => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export const formatRelativeTime = (date: string | Date): string => {
  const now = Date.now()
  const time = new Date(date).getTime()
  const diff = now - time
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day

  if (diff < minute) return 'Vừa xong'
  if (diff < hour) return `${Math.floor(diff / minute)} phút trước`
  if (diff < day) return `${Math.floor(diff / hour)} giờ trước`
  if (diff < week) return `${Math.floor(diff / day)} ngày trước`
  if (diff < month) return `${Math.floor(diff / week)} tuần trước`
  return formatDate(date)
}

export const formatCurrency = (
  amount: number | null | undefined,
  currency = 'VND',
): string => {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format VND ngắn gọn cho KPI card: "1.2 tr", "3.5 tỷ", "45 k".
 * Dùng khi không đủ chỗ hiển thị full số.
 */
export const formatCurrencyShort = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '—'
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)} tỷ`
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)} tr`
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(0)} k`
  return `${sign}${abs}`
}

export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('vi-VN').format(value)
}

export const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(1)}%`
}

/**
 * Format số phút thành chuỗi tiếng Việt dễ đọc.
 * dưới 60 → "45 phút"; từ 60 trở lên → "5 giờ 11 phút" (bỏ phần phút nếu = 0).
 */
export const formatMinutesDuration = (
  minutes: number | null | undefined,
): string => {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return '—'
  const total = Math.max(0, Math.floor(minutes))
  if (total < 60) return `${total} phút`
  const h = Math.floor(total / 60)
  const m = total % 60
  if (m === 0) return `${h} giờ`
  return `${h} giờ ${m} phút`
}

// ============================================================
// Vietnamese-specific formatters
// ============================================================

/**
 * Format số điện thoại VN.
 * Input:  '0912345678' | '84912345678' | '+84912345678'
 * Output: '0912 345 678'
 * Nếu không parse được → trả về nguyên input.
 */
export const formatPhoneVN = (phone: string | null | undefined): string => {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  let normalized = digits
  if (normalized.startsWith('84')) normalized = '0' + normalized.slice(2)
  if (normalized.length === 10 && normalized.startsWith('0')) {
    return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`
  }
  if (normalized.length === 11 && normalized.startsWith('0')) {
    return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`
  }
  return phone
}

/**
 * Che số điện thoại theo pattern "•••• 1234" (giữ 4 số cuối).
 * Dùng cho hiển thị mặc định trước khi user bấm "Hiện SĐT".
 */
export const maskPhone = (phone: string | null | undefined): string => {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  const last4 = digits.slice(-4)
  return `•••• ${last4}`
}

/**
 * Format CCCD 12 chữ số theo pattern "xxx xxx xxx xxx".
 */
export const formatCCCD = (cccd: string | null | undefined): string => {
  if (!cccd) return '—'
  const digits = cccd.replace(/\D/g, '')
  if (digits.length !== 12) return cccd
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
}

/**
 * Format Mã Số Thuế VN theo pattern:
 * - 10 chữ số: "xxxxxxxxxx"
 * - 13 chữ số: "xxxxxxxxxx-xxx" (có mã đơn vị phụ thuộc)
 */
export const formatMST = (mst: string | null | undefined): string => {
  if (!mst) return '—'
  const digits = mst.replace(/\D/g, '')
  if (digits.length === 10) return digits
  if (digits.length === 13) return `${digits.slice(0, 10)}-${digits.slice(10)}`
  return mst
}

// ============================================================
// String helpers
// ============================================================

export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export const capitalize = (str: string): string => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
