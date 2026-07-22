import { useMemo } from 'react'
import { Calendar, Clock, TrendingUp, AlertTriangle, Award, type LucideIcon } from 'lucide-react'

interface Props {
  /** Danh sách attendance records của user trong tháng đang xem. */
  records: any[]
  /** Số ngày công chuẩn của tháng (mặc định tính = tổng ngày trừ CN/T7). */
  standardWorkingDays?: number
}

/**
 * 5 KPI card cá nhân trong tháng: ngày công / on-time / muộn / OT / streak.
 * Tất cả compute từ mảng records (không cần API mới).
 */
export function AttendanceKPICards({ records, standardWorkingDays }: Props) {
  const stats = useMemo(() => {
    const presentDays = records.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE' || r.status === 'HALF_DAY',
    ).length
    const lateDays = records.filter((r) => r.status === 'LATE' || (r.lateMinutes ?? 0) > 0).length
    const onTimeDays = presentDays - lateDays
    const absentDays = records.filter((r) => r.status === 'ABSENT').length
    const totalLateMinutes = records.reduce((sum, r) => sum + (r.lateMinutes ?? 0), 0)
    const totalOtMinutes = records.reduce((sum, r) => sum + (r.overtimeMinutes ?? 0), 0)
    const totalWorkMinutes = records.reduce((sum, r) => sum + (r.workMinutes ?? 0), 0)

    // Streak: đếm liên tiếp ngày on-time gần nhất trở về trước
    const sorted = [...records].sort((a, b) =>
      (b.attendanceDate || '').localeCompare(a.attendanceDate || ''),
    )
    let streak = 0
    for (const r of sorted) {
      const isOnTime =
        (r.status === 'PRESENT' && (r.lateMinutes ?? 0) === 0) ||
        (!r.status && (r.lateMinutes ?? 0) === 0)
      if (isOnTime) streak++
      else break
    }

    const stdDays = standardWorkingDays ?? Math.max(presentDays + absentDays, 22)
    const attendanceRate = stdDays > 0 ? Math.round((presentDays / stdDays) * 100) : 0

    return {
      presentDays,
      lateDays,
      onTimeDays,
      absentDays,
      totalLateMinutes,
      totalOtMinutes,
      totalWorkMinutes,
      streak,
      stdDays,
      attendanceRate,
    }
  }, [records, standardWorkingDays])

  const cards = [
    {
      label: 'Ngày công',
      value: `${stats.presentDays}`,
      sub: `/ ${stats.stdDays} ngày chuẩn`,
      icon: Calendar,
      tone: 'blue' as const,
      hint: `Tỉ lệ chuyên cần ${stats.attendanceRate}%`,
    },
    {
      label: 'Đúng giờ',
      value: `${stats.onTimeDays}`,
      sub: `/ ${stats.presentDays} ngày`,
      icon: Clock,
      tone: 'green' as const,
      hint:
        stats.presentDays > 0
          ? `${Math.round((stats.onTimeDays / stats.presentDays) * 100)}% ngày đúng giờ`
          : 'Chưa có dữ liệu',
    },
    {
      label: 'Đi muộn',
      value: `${stats.lateDays}`,
      sub: `${formatHM(stats.totalLateMinutes)} tổng`,
      icon: AlertTriangle,
      tone: 'orange' as const,
      hint: stats.lateDays > 3 ? 'Vượt ngưỡng cho phép, chú ý cải thiện!' : 'Vẫn trong ngưỡng an toàn',
    },
    {
      label: 'Làm thêm giờ',
      value: formatHM(stats.totalOtMinutes),
      sub: `${formatHM(stats.totalWorkMinutes)} tổng giờ`,
      icon: TrendingUp,
      tone: 'purple' as const,
      hint: stats.totalOtMinutes > 600 ? 'Nhiều OT — cần cân bằng WLB' : 'Mức OT hợp lý',
    },
    {
      label: 'Streak đúng giờ',
      value: `${stats.streak}`,
      sub: 'ngày liên tiếp',
      icon: Award,
      tone: 'pink' as const,
      hint: stats.streak >= 5 ? '🔥 Đang giữ phong độ tốt!' : 'Bắt đầu build streak nào',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <KPICard key={c.label} {...c} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------
// Sub-component
// ---------------------------------------------------------

interface KPICardProps {
  label: string
  value: string
  sub: string
  icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'purple' | 'pink'
  hint: string
}

function KPICard({ label, value, sub, icon: Icon, tone, hint }: KPICardProps) {
  const toneMap = {
    blue: 'from-blue-50 to-indigo-50 text-blue-700 border-blue-100 [&_.ico]:bg-blue-100 [&_.ico]:text-blue-600',
    green: 'from-emerald-50 to-teal-50 text-emerald-700 border-emerald-100 [&_.ico]:bg-emerald-100 [&_.ico]:text-emerald-600',
    orange: 'from-orange-50 to-amber-50 text-orange-700 border-orange-100 [&_.ico]:bg-orange-100 [&_.ico]:text-orange-600',
    purple: 'from-violet-50 to-purple-50 text-violet-700 border-violet-100 [&_.ico]:bg-violet-100 [&_.ico]:text-violet-600',
    pink: 'from-pink-50 to-rose-50 text-pink-700 border-pink-100 [&_.ico]:bg-pink-100 [&_.ico]:text-pink-600',
  }[tone]

  return (
    <div
      className={`relative rounded-xl bg-gradient-to-br p-4 border ${toneMap} transition hover:shadow-md`}
      title={hint}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</span>
        <span className="ico w-7 h-7 rounded-md flex items-center justify-center">
          <Icon size={14} />
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums text-neutral-900">{value}</span>
        <span className="text-xs text-neutral-500 truncate">{sub}</span>
      </div>
      <div className="mt-2 text-[11px] text-neutral-500 leading-snug line-clamp-2">{hint}</div>
    </div>
  )
}

function formatHM(minutes: number): string {
  if (!minutes || minutes <= 0) return '0h'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}p`
  if (m === 0) return `${h}h`
  return `${h}h${m}p`
}
