import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  records: any[]
  month: number
  year: number
  onChangeMonth: (m: number, y: number) => void
}

/**
 * Calendar heatmap kiểu GitHub cho tháng — mỗi ô = 1 ngày, màu theo status:
 *   - Cyan   PRESENT (đúng giờ)
 *   - Orange LATE
 *   - Red    ABSENT
 *   - Blue   LEAVE
 *   - Slate  HOLIDAY / CN-T7 / chưa có record
 * <p>
 * Layout: 7 cột (T2 → CN), tự động chèn ô trống cho weeks đầu/cuối.
 * Ngày trong tương lai → dimmed để nhân viên thấy "còn X ngày trong tháng".
 */
export function AttendanceHeatmap({ records, month, year, onChangeMonth }: Props) {
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month
  const todayISO = today.toISOString().slice(0, 10)

  // Build map ISO date → record for O(1) lookup
  const recordByDate = useMemo(() => {
    const map: Record<string, any> = {}
    for (const r of records) {
      if (r.attendanceDate) map[r.attendanceDate.substring(0, 10)] = r
    }
    return map
  }, [records])

  // Build cells cho tháng: prefix ô trống cho tuần đầu để căn cột T2
  const cells = useMemo(() => {
    const first = new Date(year, month - 1, 1)
    const last = new Date(year, month, 0) // ngày cuối tháng
    const daysInMonth = last.getDate()
    // JS getDay: CN=0, T2=1..T7=6. Ta muốn cột 0=T2 → offset:
    const firstDow = (first.getDay() + 6) % 7 // T2=0 ... CN=6
    const arr: Array<{ date?: Date; iso?: string }> = []
    for (let i = 0; i < firstDow; i++) arr.push({})
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month - 1, d)
      arr.push({ date: dt, iso: dt.toISOString().slice(0, 10) })
    }
    // padding cuối để chia hết 7
    while (arr.length % 7 !== 0) arr.push({})
    return arr
  }, [month, year])

  // Legend counters
  const counts = useMemo(() => {
    const c: Record<string, number> = { PRESENT: 0, LATE: 0, ABSENT: 0, LEAVE: 0, EMPTY: 0 }
    for (const cell of cells) {
      if (!cell.iso) continue
      const r = recordByDate[cell.iso]
      if (!r) {
        c.EMPTY++
        continue
      }
      const key = r.status || 'EMPTY'
      c[key] = (c[key] || 0) + 1
    }
    return c
  }, [cells, recordByDate])

  const prevMonth = () => {
    const nm = month === 1 ? 12 : month - 1
    const ny = month === 1 ? year - 1 : year
    onChangeMonth(nm, ny)
  }
  const nextMonth = () => {
    const nm = month === 12 ? 1 : month + 1
    const ny = month === 12 ? year + 1 : year
    onChangeMonth(nm, ny)
  }

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-800">Lịch chấm công của tôi</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Rê chuột vào ô để xem chi tiết ngày</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 transition"
            aria-label="Tháng trước"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="mx-2 text-sm font-semibold text-neutral-800 capitalize min-w-[110px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 transition"
            aria-label="Tháng sau"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
          <div key={d} className="text-[10px] font-semibold text-neutral-400 text-center uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, idx) => {
          if (!cell.iso || !cell.date) {
            return <div key={idx} className="aspect-square" />
          }
          const record = recordByDate[cell.iso]
          const dow = cell.date.getDay() // 0=CN, 6=T7
          const isWeekend = dow === 0 || dow === 6
          const isFuture = isCurrentMonth && cell.iso > todayISO
          const isToday = cell.iso === todayISO
          const day = cell.date.getDate()

          const bg = getCellColor(record, isWeekend, isFuture)
          const label = getCellLabel(cell.iso, record, isWeekend, isFuture)

          return (
            <div
              key={idx}
              title={label}
              className={`aspect-square rounded-md border flex flex-col items-center justify-center relative transition hover:scale-105 hover:shadow-sm ${bg} ${
                isToday ? 'ring-2 ring-primary-500 ring-offset-1' : ''
              }`}
            >
              <span className="text-[11px] font-semibold tabular-nums">{day}</span>
              {record?.workMinutes ? (
                <span className="text-[9px] font-medium opacity-80 leading-none mt-0.5">
                  {Math.round(record.workMinutes / 60)}h
                </span>
              ) : null}
              {record?.lateMinutes > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"
                  aria-hidden
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-neutral-500 border-t border-neutral-100 pt-3">
        <LegendItem color="bg-emerald-100 border-emerald-200" label={`Đúng giờ (${counts.PRESENT || 0})`} />
        <LegendItem color="bg-orange-100 border-orange-200" label={`Đi muộn (${counts.LATE || 0})`} />
        <LegendItem color="bg-rose-100 border-rose-200" label={`Vắng (${counts.ABSENT || 0})`} />
        <LegendItem color="bg-blue-100 border-blue-200" label={`Nghỉ phép (${counts.LEAVE || 0})`} />
        <LegendItem color="bg-neutral-100 border-neutral-200" label={`Chưa chấm (${counts.EMPTY || 0})`} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------

function getCellColor(record: any, isWeekend: boolean, isFuture: boolean): string {
  if (isFuture) return 'bg-neutral-50 border-neutral-100 text-neutral-300'
  if (!record) {
    if (isWeekend) return 'bg-slate-50 border-slate-100 text-slate-300'
    return 'bg-neutral-100 border-neutral-200 text-neutral-400'
  }
  switch (record.status) {
    case 'PRESENT':
      return (record.lateMinutes ?? 0) > 0
        ? 'bg-orange-100 border-orange-200 text-orange-800'
        : 'bg-emerald-100 border-emerald-200 text-emerald-800'
    case 'LATE':
      return 'bg-orange-100 border-orange-200 text-orange-800'
    case 'ABSENT':
      return 'bg-rose-100 border-rose-200 text-rose-800'
    case 'LEAVE':
      return 'bg-blue-100 border-blue-200 text-blue-800'
    case 'HALF_DAY':
      return 'bg-yellow-100 border-yellow-200 text-yellow-800'
    case 'HOLIDAY':
      return 'bg-slate-100 border-slate-200 text-slate-600'
    default:
      return 'bg-neutral-100 border-neutral-200 text-neutral-500'
  }
}

function getCellLabel(iso: string, record: any, isWeekend: boolean, isFuture: boolean): string {
  const dateLabel = new Date(iso).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  })
  if (isFuture) return `${dateLabel} — chưa tới`
  if (!record) return `${dateLabel} — ${isWeekend ? 'Cuối tuần' : 'Chưa chấm công'}`
  const parts = [dateLabel, `Trạng thái: ${record.status}`]
  if (record.checkInTime) parts.push(`Vào: ${record.checkInTime.substring(0, 5)}`)
  if (record.checkOutTime) parts.push(`Ra: ${record.checkOutTime.substring(0, 5)}`)
  if (record.workMinutes) parts.push(`Giờ làm: ${Math.round(record.workMinutes / 60)}h`)
  if (record.lateMinutes > 0) parts.push(`⚠ Muộn ${record.lateMinutes}p`)
  if (record.note) parts.push(`Ghi chú: ${record.note}`)
  return parts.join('\n')
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded-sm border ${color}`} />
      <span>{label}</span>
    </div>
  )
}
