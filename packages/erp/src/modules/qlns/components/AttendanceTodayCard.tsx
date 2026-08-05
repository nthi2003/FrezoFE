import { useEffect, useState, useMemo, useCallback } from 'react'
import { Clock, LogIn, LogOut, MapPin, Wifi, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'
import { Button } from '@frezo/ui'
import { formatMinutesDuration } from '@frezo/utils'
import { toast } from 'sonner'
import { useCheckIn, useCheckOut, useMyTodayAttendance } from '../hooks/useAttendance'
import { useUxPopup } from '@/modules/common/hooks/useUxPopup'
import { UxEventPopup } from '@/modules/common/components/UxEventPopup'

interface Props {
  personId?: string
  personName?: string
  contractId?: string
  /** Giờ vào ca chuẩn "HH:mm" — dùng để tính late realtime. Mặc định 08:00. */
  standardStartTime?: string
  /** Giờ tan ca chuẩn "HH:mm" — mặc định 17:30. */
  standardEndTime?: string
}

/**
 * Hero card ở đầu trang Attendance: đồng hồ realtime, trạng thái hôm nay,
 * nút check-in / check-out kèm GPS (nếu browser cho phép).
 * <p>
 * Trạng thái được tính từ record chấm công hôm nay:
 * - Chưa check-in    → "not_checked_in"  (nút xanh CHECK IN)
 * - Đã check-in      → "checked_in"      (nút cam CHECK OUT + hiển thị giờ vào + đếm thời gian đã làm)
 * - Đã check-out     → "done"            (badge Hoàn thành + tổng giờ)
 */
export function AttendanceTodayCard({
  personId,
  personName,
  contractId,
  standardStartTime = '08:00',
  standardEndTime = '17:30',
}: Props) {
  const [now, setNow] = useState(new Date())
  const [geoState, setGeoState] = useState<{ lat?: number; lng?: number; error?: string }>({})

  const { data: today, isLoading } = useMyTodayAttendance(personId)
  const checkInReq = useCheckIn({ skipSuccessToast: true })
  const checkOutReq = useCheckOut()
  const onPopupEmpty = useCallback(() => {
    toast.success('Đã check-in thành công!')
  }, [])
  const uxPopup = useUxPopup({ onEmpty: onPopupEmpty })

  // Đồng hồ tick 1s
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Lấy vị trí GPS 1 lần (không block UI, chỉ show badge)
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoState({ error: 'Trình duyệt không hỗ trợ GPS' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeoState({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setGeoState({ error: err.message }),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    )
  }, [])

  const status: 'not_checked_in' | 'checked_in' | 'done' = useMemo(() => {
    if (!today) return 'not_checked_in'
    if (today.checkOutTime) return 'done'
    if (today.checkInTime) return 'checked_in'
    return 'not_checked_in'
  }, [today])

  const workedMinutes = useMemo(() => {
    if (!today?.checkInTime) return 0
    const [h, m] = today.checkInTime.substring(0, 5).split(':').map(Number)
    const start = new Date(now)
    start.setHours(h, m, 0, 0)
    const end = today.checkOutTime
      ? (() => {
          const [oh, om] = today.checkOutTime.substring(0, 5).split(':').map(Number)
          const e = new Date(now)
          e.setHours(oh, om, 0, 0)
          return e
        })()
      : now
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60_000))
  }, [today, now])

  const lateMinutes = useMemo(() => {
    if (status === 'not_checked_in') {
      const [sh, sm] = standardStartTime.split(':').map(Number)
      const std = new Date(now)
      std.setHours(sh, sm, 0, 0)
      return Math.max(0, Math.floor((now.getTime() - std.getTime()) / 60_000))
    }
    return today?.lateMinutes || 0
  }, [now, status, today, standardStartTime])

  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  const handleCheckIn = () => {
    if (!personId) return
    checkInReq.mutate(
      {
        personId,
        contractId,
        attendanceDate: now.toISOString().slice(0, 10),
        checkInTime: now.toTimeString().slice(0, 8),
        shiftType: 'FULL',
        latitude: geoState.lat,
        longitude: geoState.lng,
      },
      {
        onSuccess: (res: any) => {
          const popupEvent = res?.data?.popupEvent as string | undefined
          if (popupEvent) {
            uxPopup.show(popupEvent)
          } else {
            toast.success('Đã check-in thành công!')
          }
        },
      },
    )
  }

  const handleCheckOut = () => {
    if (!personId) return
    checkOutReq.mutate({
      personId,
      attendanceDate: now.toISOString().slice(0, 10),
      checkOutTime: now.toTimeString().slice(0, 8),
      latitude: geoState.lat,
      longitude: geoState.lng,
    })
  }

  // ---- Palette theo trạng thái để hero card có visual cue rõ ràng ----
  const themeMap = {
    not_checked_in: {
      bg: 'from-blue-600 via-indigo-600 to-primary-700',
      badge: 'bg-white/15 text-white',
      badgeLabel: 'Sẵn sàng làm việc',
      hint: 'Bấm nút bên phải để bắt đầu ngày làm việc.',
    },
    checked_in: {
      bg: 'from-emerald-600 via-teal-600 to-green-700',
      badge: 'bg-white/15 text-white',
      badgeLabel: 'Đang làm việc',
      hint: `Đã làm ${formatHM(workedMinutes)} — nhớ check-out khi hết ca.`,
    },
    done: {
      bg: 'from-slate-600 via-neutral-700 to-neutral-800',
      badge: 'bg-white/15 text-white',
      badgeLabel: 'Hoàn thành ca hôm nay',
      hint: `Tổng giờ làm việc: ${formatHM(today?.workMinutes ?? workedMinutes)}. Nghỉ ngơi nhé!`,
    },
  }[status]

  return (
    <>
    <section
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${themeMap.bg} text-white shadow-lg`}
    >
      {/* Decorative blobs */}
      <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/10 blur-2xl" aria-hidden />
      <div className="absolute -left-10 -bottom-16 w-56 h-56 rounded-full bg-white/5 blur-3xl" aria-hidden />

      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 md:p-8">
        {/* --- Left: Clock + info --- */}
        <div className="lg:col-span-2 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest opacity-90">
            <Sparkles size={14} />
            <span>{themeMap.badgeLabel}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-3 flex-wrap">
            <span className="text-5xl md:text-6xl font-bold tabular-nums leading-none tracking-tight">
              {timeStr}
            </span>
            <span className="text-sm opacity-85 capitalize">{dateStr}</span>
          </div>

          <p className="mt-3 text-sm opacity-90 max-w-lg">
            Xin chào <b>{personName || 'bạn'}</b>! {themeMap.hint}
          </p>

          {/* Info chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <InfoChip
              icon={<Clock size={12} />}
              label={`Vào chuẩn ${standardStartTime} · Ra chuẩn ${standardEndTime}`}
            />
            <InfoChip
              icon={<MapPin size={12} />}
              label={
                geoState.lat
                  ? `GPS ${geoState.lat.toFixed(4)}, ${geoState.lng?.toFixed(4)}`
                  : geoState.error || 'Đang lấy GPS...'
              }
              tone={geoState.lat ? 'ok' : 'warn'}
            />
            <InfoChip
              icon={<Wifi size={12} />}
              label={navigator.onLine ? 'Online' : 'Offline'}
              tone={navigator.onLine ? 'ok' : 'warn'}
            />
            {lateMinutes > 0 && (
              <InfoChip
                icon={<AlertTriangle size={12} />}
                label={`Muộn ${formatMinutesDuration(lateMinutes)} so với giờ chuẩn`}
                tone="danger"
              />
            )}
            {status === 'checked_in' && (
              <InfoChip
                icon={<CheckCircle2 size={12} />}
                label={`Vào lúc ${today?.checkInTime?.substring(0, 5) || '--:--'}`}
                tone="ok"
              />
            )}
            {status === 'done' && (
              <InfoChip
                icon={<CheckCircle2 size={12} />}
                label={`${today?.checkInTime?.substring(0, 5)} → ${today?.checkOutTime?.substring(0, 5)}`}
                tone="ok"
              />
            )}
          </div>
        </div>

        {/* --- Right: Action --- */}
        <div className="lg:justify-self-end w-full lg:w-auto">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/15 min-w-[220px]">
            {status === 'not_checked_in' && (
              <>
                <div className="text-xs opacity-80 mb-1">Sẵn sàng?</div>
                <Button
                  onClick={handleCheckIn}
                  disabled={!personId || checkInReq.isPending || isLoading}
                  className="w-full h-14 text-base font-bold bg-white text-primary-800 hover:bg-white/90 gap-2 shadow-lg"
                >
                  <LogIn size={18} />
                  {checkInReq.isPending ? 'Đang check-in...' : 'CHECK IN'}
                </Button>
                {!personId && (
                  <p className="mt-2 text-[11px] text-white/80 leading-relaxed">
                    Cần liên kết tài khoản với nhân sự trước khi chấm công.
                  </p>
                )}
              </>
            )}
            {status === 'checked_in' && (
              <>
                <div className="text-xs opacity-80 mb-1">
                  Đã làm: <b>{formatHM(workedMinutes)}</b>
                </div>
                <Button
                  onClick={handleCheckOut}
                  disabled={checkOutReq.isPending}
                  className="w-full h-14 text-base font-bold bg-white text-teal-800 hover:bg-white/90 gap-2 shadow-lg"
                >
                  <LogOut size={18} />
                  {checkOutReq.isPending ? 'Đang check-out...' : 'CHECK OUT'}
                </Button>
                <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full bg-white/70 transition-all"
                    style={{ width: `${Math.min(100, (workedMinutes / 480) * 100)}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-white/70 text-right">
                  {formatHM(workedMinutes)} / 8h chuẩn
                </div>
              </>
            )}
            {status === 'done' && (
              <>
                <div className="text-xs opacity-80 mb-1">Ca hôm nay đã kết thúc</div>
                <div className="w-full h-14 rounded-md bg-white/20 flex items-center justify-center gap-2 font-bold text-base">
                  <CheckCircle2 size={18} />
                  Hoàn thành ✓
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs">
                  <MiniStat label="Giờ làm" value={formatHM(today?.workMinutes ?? 0)} />
                  <MiniStat label="OT" value={formatHM(today?.overtimeMinutes ?? 0)} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
    <UxEventPopup {...uxPopup.modalProps} tone="welcome" confirmLabel="Bắt đầu làm việc" />
    </>
  )
}

// ---------------------------------------------------------
// Sub-components
// ---------------------------------------------------------

function InfoChip({
  icon,
  label,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  tone?: 'default' | 'ok' | 'warn' | 'danger'
}) {
  const toneMap = {
    default: 'bg-white/15 text-white',
    ok: 'bg-emerald-400/25 text-emerald-50',
    warn: 'bg-amber-400/25 text-amber-50',
    danger: 'bg-rose-500/25 text-rose-50',
  }[tone]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-medium backdrop-blur-sm ${toneMap}`}
    >
      {icon}
      <span className="max-w-[220px] truncate">{label}</span>
    </span>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 rounded-md py-1.5">
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-sm font-bold tabular-nums">{value}</div>
    </div>
  )
}

function formatHM(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '0h'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}p`
  if (m === 0) return `${h}h`
  return `${h}h${m}p`
}
