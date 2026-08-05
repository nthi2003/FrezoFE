// ============================================================
// LoginTrendChart — biểu đồ login SUCCESS theo ngày (FR-USAGE-02)
// Trục Y + gridline, tooltip, đường trung bình, highlight ngày đột biến,
// summary stats và toggle khoảng thời gian (cắt client-side từ data 30 ngày).
// ============================================================

import { useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { LogIn, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { EmptyState, ErrorState, Skeleton } from '@frezo/ui'

export interface LoginTrendPoint {
  /** yyyy-MM-dd */
  date: string
  count: number
}

const COLOR_BAR = '#34d399'
const COLOR_BAR_PEAK = '#f59e0b'
const COLOR_GRID = '#f1f5f9'
const COLOR_TICK = '#94a3b8'
const COLOR_AVG = '#94a3b8'

const RANGE_OPTIONS = [7, 14, 30] as const

const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

function parseDay(date: string) {
  const d = new Date(`${date}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function shortDay(date: string) {
  const d = parseDay(date)
  if (!d) return date
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function longDay(date: string) {
  const d = parseDay(date)
  if (!d) return date
  return `${WEEKDAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** Bậc thang 1-2-5 để làm tick cho thang log (0 luôn là tick đầu). */
function logTickValues(max: number) {
  const ticks = [0]
  let step = 1
  while (step <= max) {
    ticks.push(step)
    const head = Number(String(step)[0])
    step = head === 1 ? step * 2 : head === 2 ? step * 2.5 : step * 2
  }
  if (ticks[ticks.length - 1] < max) ticks.push(max)
  return ticks
}

const toLog = (v: number) => Math.log10(v + 1)

function TrendTooltip({
  active, payload, isPeak,
}: {
  active?: boolean
  payload?: { payload: LoginTrendPoint }[]
  isPeak: (date: string) => boolean
}) {
  const point = active ? payload?.[0]?.payload : undefined
  if (!point) return null
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-lg">
      <div className="text-[11px] text-neutral-500">{longDay(point.date)}</div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className="text-base font-bold tabular-nums text-neutral-900">{point.count}</span>
        <span className="text-[11px] text-neutral-500">lượt đăng nhập</span>
      </div>
      {isPeak(point.date) && (
        <div className="mt-1 text-[11px] font-semibold text-amber-600">Ngày đột biến</div>
      )}
    </div>
  )
}

/**
 * Biểu đồ đăng nhập theo ngày cho hub Sử dụng hệ thống.
 * `data` nhận nguyên chuỗi ngày tăng dần (API trả cố định 30 ngày gần nhất, đã fill ngày trống = 0).
 */
export function LoginTrendChart({
  data,
  isLoading,
  isError,
  onRetry,
}: {
  data: LoginTrendPoint[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
}) {
  const [range, setRange] = useState<number>(30)
  const [logScale, setLogScale] = useState(false)

  const ranges = RANGE_OPTIONS.filter((r) => r <= Math.max(data.length, RANGE_OPTIONS[0]))
  const effectiveRange = Math.min(range, data.length || range)

  const view = useMemo(() => data.slice(-effectiveRange), [data, effectiveRange])

  const stats = useMemo(() => {
    const total = view.reduce((s, d) => s + d.count, 0)
    const avg = view.length ? total / view.length : 0
    const peak = view.reduce<LoginTrendPoint | null>(
      (best, d) => (!best || d.count > best.count ? d : best),
      null,
    )
    const prev = data.slice(-effectiveRange * 2, -effectiveRange)
    const prevTotal = prev.length === view.length ? prev.reduce((s, d) => s + d.count, 0) : null
    const deltaPct =
      prevTotal === null || prevTotal === 0 ? null : ((total - prevTotal) / prevTotal) * 100
    // Bar cam: ngày vượt gấp đôi trung bình — tránh bị đọc nhầm là lỗi khi chuỗi ngày còn lại gần như phẳng.
    const outlierFrom = avg * 2
    const isPeak = (date: string) => {
      const point = view.find((d) => d.date === date)
      return !!point && point.count > 0 && point.count >= outlierFrom && point.count > avg
    }
    const max = peak?.count ?? 0
    return {
      total,
      avg,
      peak,
      deltaPct,
      hasPrev: prevTotal !== null,
      isPeak,
      max,
      skewed: max >= Math.max(5, avg * 3),
    }
  }, [view, data, effectiveRange])

  const chartData = useMemo(
    () => view.map((d) => ({ ...d, value: logScale ? toLog(d.count) : d.count })),
    [view, logScale],
  )

  const logTicks = useMemo(
    () => (logScale ? logTickValues(stats.max).map(toLog) : undefined),
    [logScale, stats.max],
  )

  const xInterval = view.length <= 10 ? 0 : Math.max(0, Math.ceil(view.length / 6) - 1)

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-neutral-800">Đăng nhập theo ngày</h2>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Số lần đăng nhập thành công · {effectiveRange || 30} ngày gần nhất
          </p>
        </div>
        <div className="flex items-center gap-1">
          {stats.skewed && (
            <button
              type="button"
              onClick={() => setLogScale((v) => !v)}
              title="Đổi thang trục Y sang log để thấy rõ các ngày giá trị nhỏ"
              className={`px-2 py-1 rounded text-[11px] font-semibold border transition ${
                logScale
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
              }`}
            >
              Log
            </button>
          )}
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-2 py-1 rounded text-[11px] font-semibold border transition ${
                effectiveRange === r
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <ErrorState
          title="Không tải được biểu đồ"
          message="Thử làm mới hoặc kiểm tra quyền xem thống kê."
          onRetry={onRetry}
        />
      ) : isLoading ? (
        <ChartSkeleton />
      ) : view.length === 0 ? (
        <EmptyState
          icon={LogIn}
          title="Chưa có dữ liệu đăng nhập"
          description="Sau khi có user đăng nhập, biểu đồ sẽ hiện tại đây."
        />
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
            <StatCell label="Tổng lượt" value={stats.total.toLocaleString('vi-VN')} />
            <StatCell label="TB/ngày" value={stats.avg.toFixed(1)} />
            <StatCell
              label="Ngày cao nhất"
              value={stats.peak ? String(stats.peak.count) : '—'}
              hint={stats.peak ? shortDay(stats.peak.date) : undefined}
            />
            <StatCell
              label={`So với ${effectiveRange} ngày trước`}
              value={
                stats.deltaPct === null
                  ? '—'
                  : `${stats.deltaPct > 0 ? '+' : ''}${stats.deltaPct.toFixed(0)}%`
              }
              hint={stats.hasPrev ? undefined : 'Không đủ dữ liệu'}
              trend={stats.deltaPct === null ? undefined : stats.deltaPct}
            />
          </div>

          <div className="mt-3 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={COLOR_GRID} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDay}
                  interval={xInterval}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: COLOR_TICK }}
                  dy={6}
                />
                <YAxis
                  allowDecimals={false}
                  ticks={logTicks}
                  domain={logScale ? [0, toLog(stats.max)] : [0, 'auto']}
                  tickFormatter={(v: number) =>
                    String(logScale ? Math.round(10 ** v - 1) : v)
                  }
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tick={{ fontSize: 11, fill: COLOR_TICK }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={<TrendTooltip isPeak={stats.isPeak} />}
                />
                {stats.avg > 0 && (
                  <ReferenceLine
                    y={logScale ? toLog(stats.avg) : stats.avg}
                    stroke={COLOR_AVG}
                    strokeDasharray="4 4"
                    label={{
                      value: `TB ${stats.avg.toFixed(1)}`,
                      position: 'insideTopRight',
                      fontSize: 10,
                      fill: COLOR_AVG,
                    }}
                  />
                )}
                <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={18}>
                  {chartData.map((d) => (
                    <Cell key={d.date} fill={stats.isPeak(d.date) ? COLOR_BAR_PEAK : COLOR_BAR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
            <LegendDot color={COLOR_BAR} label="Đăng nhập thành công" />
            <LegendDot color={COLOR_BAR_PEAK} label="Ngày đột biến (≥ 2× trung bình)" />
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t border-dashed" style={{ borderColor: COLOR_AVG }} />
              Trung bình/ngày
            </span>
            {logScale && <span className="text-emerald-700 font-semibold">Trục Y thang log</span>}
          </div>
        </>
      )}
    </section>
  )
}

function StatCell({
  label, value, hint, trend,
}: {
  label: string
  value: string
  hint?: string
  trend?: number
}) {
  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendTone =
    trend === undefined ? '' : trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-neutral-500'
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50/60 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 truncate" title={label}>
        {label}
      </div>
      <div className={`text-lg font-bold tabular-nums leading-tight mt-0.5 flex items-center gap-1 ${trendTone || 'text-neutral-900'}`}>
        {TrendIcon && <TrendIcon size={14} />}
        {value}
      </div>
      {hint && <div className="text-[10px] text-neutral-400">{hint}</div>}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  )
}

function ChartSkeleton() {
  const heights = [40, 55, 35, 70, 45, 60, 30, 80, 50, 65, 38, 72]
  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {heights.slice(0, 4).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
      <div className="mt-3 h-[240px] flex items-end gap-2 px-2">
        {heights.map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}
