// ============================================================
// FREZO ERP — Cron helpers cho Tác vụ nền (QTHT · Jobs)
// BE dùng cron Spring 6 trường: `giây phút giờ ngày tháng thứ`.
// ============================================================

const WEEKDAY_LABELS: Record<string, string> = {
  '0': 'Chủ Nhật',
  '1': 'Thứ Hai',
  '2': 'Thứ Ba',
  '3': 'Thứ Tư',
  '4': 'Thứ Năm',
  '5': 'Thứ Sáu',
  '6': 'Thứ Bảy',
  '7': 'Chủ Nhật',
  SUN: 'Chủ Nhật',
  MON: 'Thứ Hai',
  TUE: 'Thứ Ba',
  WED: 'Thứ Tư',
  THU: 'Thứ Năm',
  FRI: 'Thứ Sáu',
  SAT: 'Thứ Bảy',
}

const pad2 = (v: string) => v.padStart(2, '0')

/**
 * Mô tả tiếng Việt cho các mẫu cron thường gặp — chỉ dùng làm fallback
 * khi BE không trả `cronDescription`. Mẫu lạ trả về chính biểu thức.
 */
export function humanizeCron(expression?: string): string {
  const expr = (expression ?? '').trim()
  if (!expr) return '—'

  const parts = expr.split(/\s+/)
  if (parts.length !== 6) return expr

  const [sec, min, hour, dom, month, dow] = parts
  const everyDay = dom === '*' && month === '*' && (dow === '*' || dow === '?')
  const isNum = (v: string) => /^\d+$/.test(v)

  if (sec === '0' && min === '0' && hour === '*' && everyDay) {
    return 'Đầu mỗi giờ'
  }

  const everyMin = min.match(/^\*\/(\d+)$/)
  if (sec === '0' && everyMin && hour === '*' && everyDay) {
    return `Mỗi ${everyMin[1]} phút`
  }

  const everyHour = hour.match(/^\*\/(\d+)$/)
  if (sec === '0' && isNum(min) && everyHour && everyDay) {
    return `Mỗi ${everyHour[1]} giờ (phút thứ ${Number(min)})`
  }

  if (isNum(min) && isNum(hour)) {
    const time = `${pad2(hour)}:${pad2(min)}`

    if (everyDay) return `${time} mỗi ngày`

    if (dom === '*' && month === '*' && dow !== '*' && dow !== '?') {
      const labels = dow
        .split(',')
        .map((d) => WEEKDAY_LABELS[d.toUpperCase()])
        .filter(Boolean)
      if (labels.length) return `${time} ${labels.join(', ')} hằng tuần`
    }

    if (isNum(dom) && month === '*' && (dow === '*' || dow === '?')) {
      return `${time} ngày ${Number(dom)} hằng tháng`
    }
  }

  return expr
}

/** Cron preset — build sẵn cho các lịch hay dùng. */
export const cronPresets = {
  hourly: () => '0 0 * * * *',
  daily: (hour: number, minute: number) => `0 ${minute} ${hour} * * *`,
  weekly: (hour: number, minute: number, weekday = 'MON') =>
    `0 ${minute} ${hour} * * ${weekday}`,
  monthly: (dayOfMonth: number, hour: number, minute: number) =>
    `0 ${minute} ${hour} ${dayOfMonth} * *`,
}

/** Kiểm tra sơ bộ ở FE (đủ 6 trường) trước khi gọi preview-cron của BE. */
export function isCronShapeValid(expression?: string): boolean {
  const expr = (expression ?? '').trim()
  if (!expr) return false
  return expr.split(/\s+/).length === 6
}

/** Thời lượng chạy dạng người đọc được: 850 ms · 4,2 giây · 3 phút 05 giây. */
export function formatDuration(ms?: number | null): string {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms} ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1).replace('.', ',')} giây`
  const mins = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return `${mins} phút ${String(rest).padStart(2, '0')} giây`
}
