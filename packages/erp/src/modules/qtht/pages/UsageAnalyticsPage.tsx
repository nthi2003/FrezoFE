// ============================================================
// UsageAnalyticsPage — hub Sử dụng hệ thống (FR-USAGE-01..04)
// KPI hôm nay · chart login 30 ngày · top module/route · phiên online
// ============================================================

import { useMemo, useState } from 'react'
import {
  Activity, Users, LogIn, Monitor, RefreshCw, ShieldOff, Eye, Route,
} from 'lucide-react'
import {
  PageHeader, Button, EmptyState, ErrorState, ConfirmDialog, PageGuideButton,
  type PageGuideConfig,
} from '@frezo/ui'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import {
  useUsageSummary,
  useLoginByDayMap,
  usePageViewTop,
  useAdminSessions,
  useRevokeSession,
} from '../hooks/useUsage'
import type { UserSessionRow } from '../services/usageApi'

const GUIDE: PageGuideConfig = {
  title: 'Sử dụng hệ thống',
  subtitle: 'Theo dõi ai đang online, login hôm nay, module được mở nhiều — tối ưu quy trình vận hành.',
  sections: [
    {
      heading: 'Chỉ số',
      type: 'steps',
      steps: [
        { title: 'Đăng nhập hôm nay', description: 'Số lần login SUCCESS trong ngày (một người có thể login nhiều lần).' },
        { title: 'User unique', description: 'Số tài khoản khác nhau đã login thành công hôm nay.' },
        { title: 'Online', description: 'User có heartbeat trong 5 phút gần nhất (tab đang mở).' },
        { title: 'Pageview', description: 'Mỗi lần đổi màn hình trong ERP được ghi (không lưu nội dung form).' },
      ],
    },
    {
      heading: 'Lưu ý',
      type: 'notes',
      notes: 'Đây là thống kê sử dụng phần mềm — không thay chấm công HR. Thu hồi phiên sẽ buộc thiết bị đó đăng nhập lại.',
    },
  ],
}

function formatDt(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function UsageAnalyticsPage() {
  const [tab, setTab] = useState<'overview' | 'sessions'>('overview')
  const [pageViewDays, setPageViewDays] = useState(1)
  const [revokeId, setRevokeId] = useState<string | null>(null)

  const summary = useUsageSummary()
  const loginByDay = useLoginByDayMap()
  const pageViews = usePageViewTop(pageViewDays)
  const sessions = useAdminSessions(0, 50)
  const revoke = useRevokeSession()

  const chartDays = useMemo(() => {
    const map = loginByDay.data || {}
    return Object.entries(map).map(([date, count]) => ({ date, count: Number(count) || 0 }))
  }, [loginByDay.data])

  const maxLogin = Math.max(1, ...chartDays.map((d) => d.count))

  const sessionRows: UserSessionRow[] = sessions.data?.content || []

  const sessionColumns: AppTableColumn<UserSessionRow>[] = [
    {
      key: 'username',
      title: 'User',
      render: (_, row) => (
        <div>
          <div className="text-sm font-semibold text-neutral-800">{row.username}</div>
          <div className="text-[11px] text-neutral-400 font-mono truncate max-w-[200px]">{row.deviceInfo || '—'}</div>
        </div>
      ),
    },
    {
      key: 'ipAddress',
      title: 'IP',
      render: (v) => <span className="font-mono text-xs text-neutral-600">{(v as string) || '—'}</span>,
    },
    {
      key: 'loginTime',
      title: 'Đăng nhập',
      render: (v) => <span className="text-xs text-neutral-600">{formatDt(v as string)}</span>,
    },
    {
      key: 'lastActiveTime',
      title: 'Hoạt động gần nhất',
      render: (v) => <span className="text-xs text-neutral-600">{formatDt(v as string)}</span>,
    },
    {
      key: 'actions',
      title: '',
      width: 100,
      render: (_, row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-rose-600 hover:bg-rose-50"
          onClick={() => setRevokeId(row.id)}
        >
          <ShieldOff size={14} /> Thu hồi
        </Button>
      ),
    },
  ]

  const s = summary.data
  const isError = summary.isError && !s

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sử dụng hệ thống"
        description="Login · online · pageview · phiên đang mở"
        actions={
          <div className="flex items-center gap-2">
            <PageGuideButton guide={GUIDE} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                summary.refetch()
                loginByDay.refetch()
                pageViews.refetch()
                sessions.refetch()
              }}
            >
              <RefreshCw size={14} className={summary.isFetching ? 'animate-spin' : ''} /> Làm mới
            </Button>
          </div>
        }
      />

      {isError ? (
        <ErrorState
          title="Không tải được thống kê"
          description="Thử lại hoặc kiểm tra quyền Admin / QTHT."
          onRetry={() => summary.refetch()}
        />
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              icon={LogIn}
              label="Đăng nhập hôm nay"
              value={s?.loginsToday ?? '—'}
              hint={s?.date ? `Ngày ${s.date}` : undefined}
              tone="emerald"
            />
            <KpiCard
              icon={Users}
              label="User unique hôm nay"
              value={s?.uniqueUsersToday ?? '—'}
              tone="blue"
            />
            <KpiCard
              icon={Activity}
              label="Đang online"
              value={s?.onlineUsers ?? '—'}
              hint={`Heartbeat ≤ ${s?.onlineWindowMinutes ?? 5} phút`}
              tone="amber"
            />
            <KpiCard
              icon={Monitor}
              label="Phiên active"
              value={s?.activeSessions ?? '—'}
              tone="violet"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-neutral-200">
            {([
              { id: 'overview', label: 'Tổng quan' },
              { id: 'sessions', label: `Phiên đang mở (${sessionRows.length})` },
            ] as const).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
                  tab === t.id
                    ? 'border-emerald-500 text-emerald-700'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Login chart */}
              <section className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-neutral-800">Đăng nhập 30 ngày</h2>
                  <span className="text-[11px] text-neutral-400">SUCCESS / ngày</span>
                </div>
                {loginByDay.isError ? (
                  <EmptyState icon={LogIn} title="Không tải được chart" description="Thử làm mới trang." />
                ) : chartDays.length === 0 ? (
                  <EmptyState icon={LogIn} title="Chưa có dữ liệu login" description="Sau khi user đăng nhập sẽ hiện tại đây." />
                ) : (
                  <div className="flex items-end gap-0.5 h-36">
                    {chartDays.map((d) => (
                      <div key={d.date} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full group relative">
                        <div
                          className="w-full max-w-[10px] rounded-t bg-emerald-400/80 group-hover:bg-emerald-500 transition-all"
                          style={{ height: `${Math.max(4, (d.count / maxLogin) * 100)}%` }}
                          title={`${d.date}: ${d.count}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {chartDays.length > 0 && (
                  <div className="mt-2 flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>{chartDays[0]?.date?.slice(5)}</span>
                    <span>{chartDays[chartDays.length - 1]?.date?.slice(5)}</span>
                  </div>
                )}
              </section>

              {/* Pageview tops */}
              <section className="rounded-xl border border-neutral-200 bg-white p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-neutral-800">Pageview ERP</h2>
                  <div className="flex gap-1">
                    {[1, 7, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setPageViewDays(d)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                          pageViewDays === d
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-neutral-500">
                  Tổng lượt: <b className="text-neutral-800">{pageViews.data?.total ?? '—'}</b>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TopList
                    title="Top module"
                    icon={Eye}
                    items={(pageViews.data?.topModules || []).map((m) => ({
                      label: m.code,
                      count: m.count,
                    }))}
                    empty="Chưa có pageview — duyệt vài màn để ghi nhận."
                  />
                  <TopList
                    title="Top route"
                    icon={Route}
                    items={(pageViews.data?.topRoutes || []).map((r) => ({
                      label: r.route,
                      count: r.count,
                    }))}
                    empty="Chưa có route nào được ghi."
                  />
                </div>
              </section>
            </div>
          )}

          {tab === 'sessions' && (
            <section className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
              {sessions.isError ? (
                <div className="p-6">
                  <ErrorState title="Không tải được phiên" onRetry={() => sessions.refetch()} />
                </div>
              ) : (
                <AppTable
                  columns={sessionColumns}
                  data={sessionRows}
                  getRowId={(row) => row.id}
                  isLoading={sessions.isLoading}
                  loadingRows={5}
                  density="compact"
                  showSearch={false}
                  onRefresh={() => void sessions.refetch()}
                />
              )}
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={!!revokeId}
        onClose={() => setRevokeId(null)}
        title="Thu hồi phiên?"
        message="User trên thiết bị đó sẽ phải đăng nhập lại."
        confirmText="Thu hồi"
        variant="danger"
        isLoading={revoke.isPending}
        onConfirm={() => {
          if (!revokeId) return
          revoke.mutate(revokeId, { onSettled: () => setRevokeId(null) })
        }}
      />
    </div>
  )
}

function KpiCard({
  icon: Icon, label, value, hint, tone,
}: {
  icon: typeof Activity
  label: string
  value: string | number
  hint?: string
  tone: 'emerald' | 'blue' | 'amber' | 'violet'
}) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
  }
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 flex gap-3 items-start">
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{label}</div>
        <div className="text-2xl font-bold text-neutral-900 tabular-nums leading-tight mt-0.5">{value}</div>
        {hint && <div className="text-[11px] text-neutral-400 mt-0.5">{hint}</div>}
      </div>
    </div>
  )
}

function TopList({
  title, icon: Icon, items, empty,
}: {
  title: string
  icon: typeof Eye
  items: { label: string; count: number }[]
  empty: string
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 mb-2">
        <Icon size={12} /> {title}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-neutral-400 leading-relaxed">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li key={it.label} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-mono text-neutral-700" title={it.label}>{it.label}</span>
              <span className="font-bold tabular-nums text-neutral-900 shrink-0">{it.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
