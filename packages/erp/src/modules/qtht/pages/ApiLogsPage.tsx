// ============================================================
// FREZO ERP — ApiLogsPage
// Trang giám sát API request theo chuẩn enterprise / observability:
//   - KPI strip (BE stats) — total, success, failed + trend, avg duration
//   - Toolbar: search + method chips + status preset + date range + auto-refresh
//   - Table: URI truncate + tooltip, method chip, status chip, duration heatmap, relative time
//   - Detail drawer: timeline, meta, tabs Request/Response với copy + format
//   - Delete cleanup: modal chọn preset ngày (thay <input> ad-hoc + confirm() xấu)
// ============================================================

import { useState, useMemo, useEffect } from 'react'
import {
  Activity, Trash2, RefreshCw, Search, X, Copy,
  Radio, ChevronDown, Clock, Zap, CheckCircle2, XCircle, TrendingUp,
  TrendingDown, User, Globe, Calendar, Info, AlertTriangle,
} from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import {
  Button, AppModal, PageHeader, ConfirmDialog, EmptyState, ErrorState, PageGuideButton, Select,
  IconActionButton, RowActions,
  type PageGuideConfig,
} from '@frezo/ui'
import { toast } from 'sonner'
import {
  useApiLogs, useApiLogStats, useDeleteApiLogs,
} from '../hooks/useApiLog'
import { apilogApi, type ApiLogItem, type ApiLogFilter, type StatusGroup } from '../services/apilogApi'

// ============================================================
// Constants
// ============================================================

/** Module = segment đầu của path, do BE tự suy ra khi ghi log. */
const MODULE_OPTIONS = [
  { value: 'all', label: 'Tất cả module' },
  { value: 'auth', label: 'auth' },
  { value: 'qtht', label: 'qtht' },
  { value: 'qlns', label: 'qlns' },
  { value: 'warehouse', label: 'warehouse' },
  { value: 'crm', label: 'crm' },
  { value: 'accounting', label: 'accounting' },
  { value: 'approval', label: 'approval' },
  { value: 'customer', label: 'customer' },
  { value: 'product', label: 'product' },
  { value: 'public', label: 'public' },
]

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
type Method = typeof METHODS[number]

const METHOD_COLORS: Record<string, { chip: string; dot: string }> = {
  GET:    { chip: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500' },
  POST:   { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PUT:    { chip: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500' },
  PATCH:  { chip: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  DELETE: { chip: 'bg-rose-50 text-rose-700 border-rose-200',       dot: 'bg-rose-500' },
}

/** Nhóm status — gửi thẳng xuống BE qua `statusGroup`, không lọc client-side. */
const STATUS_PRESETS: { key: StatusGroup; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: '2xx', label: '2xx Thành công' },
  { key: '3xx', label: '3xx Chuyển hướng' },
  { key: '4xx', label: '4xx Lỗi máy khách' },
  { key: '5xx', label: '5xx Lỗi máy chủ' },
]

const AUTO_REFRESH_OPTIONS = [
  { value: 0,      label: 'Tắt' },
  { value: 5000,   label: '5s' },
  { value: 10000,  label: '10s' },
  { value: 30000,  label: '30s' },
  { value: 60000,  label: '1 phút' },
] as const

const DELETE_PRESETS = [
  { days: 7,   label: '7 ngày',   hint: '(tuần này)' },
  { days: 30,  label: '30 ngày',  hint: '(mặc định)' },
  { days: 90,  label: '90 ngày',  hint: '(quý)' },
  { days: 180, label: '180 ngày', hint: '(nửa năm)' },
  { days: 365, label: '365 ngày', hint: '(1 năm)' },
] as const

const API_LOGS_GUIDE: PageGuideConfig = {
  title: 'Nhật ký API',
  subtitle: 'Giám sát mọi yêu cầu API toàn hệ thống (mọi tài khoản) — lọc phương thức, mã trạng thái, module, tài khoản; xem chi tiết nội dung; dọn log cũ.',
  sections: [
    {
      heading: 'Thao tác thường dùng',
      type: 'steps',
      steps: [
        {
          title: 'Lọc nhanh',
          description: 'Tìm URI / người dùng / IP, chọn phương thức HTTP và nhóm mã trạng thái (2xx, 4xx…).',
        },
        {
          title: 'Xem chi tiết',
          description: 'Bấm mắt trên dòng để mở nội dung yêu cầu/phản hồi, tham số truy vấn và thông tin kèm theo.',
        },
        {
          title: 'Dọn log cũ',
          description: 'Chọn khoảng ngày → xác nhận. Không thể hoàn tác — hãy sao lưu nếu cần giữ nhật ký lâu dài.',
        },
      ],
    },
    {
      heading: 'Mẹo',
      type: 'tips',
      tips: [
        'Bật tự làm mới (5s–1 phút) khi theo dõi sự cố theo thời gian thực.',
        'Thời gian phản hồi tô màu: xanh = nhanh, đỏ = rất chậm.',
      ],
    },
  ],
}

// ============================================================
// Utilities
// ============================================================

function formatDateTime(dateStr?: string) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function formatRelative(dateStr?: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s trước`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const day = Math.floor(h / 24)
  if (day < 7) return `${day} ngày trước`
  return d.toLocaleDateString('vi-VN')
}

function formatJson(str?: string) {
  if (!str) return ''
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

/** Tone màu cho duration — < 100ms xanh, > 2s đỏ. */
function durationTone(ms?: number) {
  const v = Number(ms) || 0
  if (v < 100)  return { text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', label: 'Nhanh' }
  if (v < 500)  return { text: 'text-neutral-700', bg: 'bg-neutral-50 border-neutral-200', label: 'OK' }
  if (v < 2000) return { text: 'text-amber-700',   bg: 'bg-amber-50 border-amber-100',     label: 'Chậm' }
  return         { text: 'text-rose-700',    bg: 'bg-rose-50 border-rose-100',       label: 'Rất chậm' }
}

function statusTone(status?: number) {
  const s = Number(status) || 0
  if (s >= 500) return { chip: 'bg-rose-50 text-rose-700 border-rose-200',       dot: 'bg-rose-500' }
  if (s >= 400) return { chip: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500' }
  if (s >= 300) return { chip: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500' }
  if (s >= 200) return { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' }
  return         { chip: 'bg-neutral-50 text-neutral-600 border-neutral-200',    dot: 'bg-neutral-400' }
}

function copyToClipboard(text: string, label = 'Đã copy') {
  navigator.clipboard.writeText(text).then(
    () => toast.success(label),
    () => toast.error('Không copy được'),
  )
}

// ============================================================
// Main Page
// ============================================================

export function ApiLogsPage() {
  // ---- Pagination ----
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // ---- Filters ----
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState<Method | 'all'>('all')
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('all')
  const [usernameFilter, setUsernameFilter] = useState('')
  const [debouncedUsername, setDebouncedUsername] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [errorsOnly, setErrorsOnly] = useState(false)

  // ---- Auto-refresh ----
  const [refreshInterval, setRefreshInterval] = useState<number>(0)
  const [autoRefreshOpen, setAutoRefreshOpen] = useState(false)

  // ---- Modals ----
  const [detailLog, setDetailLog] = useState<ApiLogItem | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; days: number }>({ open: false, days: 30 })

  // Debounce search — chỉ gọi BE sau khi user ngừng gõ 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText.trim()), 400)
    return () => clearTimeout(t)
  }, [searchText])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUsername(usernameFilter.trim()), 400)
    return () => clearTimeout(t)
  }, [usernameFilter])

  // Reset về page 1 khi đổi filter (tránh empty page)
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, methodFilter, statusGroup, debouncedUsername, moduleFilter, fromDate, toDate, errorsOnly])

  // pageNumber is 1-based — ApiLogServiceImpl uses ServiceHelper.createPageable
  const filter: ApiLogFilter = useMemo(() => ({
    pageNumber: page,
    pageSize,
    search: debouncedSearch || undefined,
    method: methodFilter === 'all' ? undefined : methodFilter,
    statusGroup: statusGroup === 'all' ? undefined : statusGroup,
    username: debouncedUsername || undefined,
    module: moduleFilter === 'all' ? undefined : moduleFilter,
    fromDate: fromDate ? `${fromDate}T00:00:00` : undefined,
    toDate: toDate ? `${toDate}T23:59:59` : undefined,
    errorsOnly: errorsOnly || undefined,
  }), [page, pageSize, debouncedSearch, methodFilter, statusGroup, debouncedUsername, moduleFilter, fromDate, toDate, errorsOnly])

  const { data, isLoading, isFetching, isError, refetch } = useApiLogs({
    ...filter,
    refetchIntervalMs: refreshInterval || false,
  })

  const { data: stats } = useApiLogStats({
    search: filter.search,
    method: filter.method,
    statusGroup: filter.statusGroup,
    username: filter.username,
    module: filter.module,
    fromDate: filter.fromDate,
    toDate: filter.toDate,
    errorsOnly: filter.errorsOnly,
  })

  const deleteReq = useDeleteApiLogs()

  const items = data?.items ?? []

  const hasActiveFilter = !!(
    debouncedSearch
    || methodFilter !== 'all'
    || statusGroup !== 'all'
    || debouncedUsername
    || moduleFilter !== 'all'
    || fromDate
    || toDate
    || errorsOnly
  )

  const clearFilters = () => {
    setSearchText('')
    setMethodFilter('all')
    setStatusGroup('all')
    setUsernameFilter('')
    setModuleFilter('all')
    setFromDate('')
    setToDate('')
    setErrorsOnly(false)
  }

  // Đóng dropdown auto-refresh khi click ngoài
  useEffect(() => {
    if (!autoRefreshOpen) return
    const handler = () => setAutoRefreshOpen(false)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [autoRefreshOpen])

  // ---- Columns ----
  const columns = useMemo<AppTableColumn<ApiLogItem>[]>(() => [
    {
      title: 'Thời gian',
      dataIndex: 'effFrom',
      width: 150,
      render: (val: string) => (
        <div className="space-y-0.5" title={formatDateTime(val)}>
          <div className="text-xs font-medium text-neutral-900">{formatRelative(val)}</div>
          <div className="text-[10px] text-neutral-400 font-mono">
            {val ? new Date(val).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
          </div>
        </div>
      ),
    },
    {
      title: 'Phương thức',
      dataIndex: 'method',
      width: 80,
      render: (val: string) => {
        const cfg = METHOD_COLORS[val] || METHOD_COLORS.GET
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${cfg.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {val || '—'}
          </span>
        )
      },
    },
    {
      title: 'Đường dẫn (URI)',
      dataIndex: 'uri',
      render: (val: string) => (
        <code
          className="text-xs font-mono text-neutral-800 truncate block max-w-md"
          title={val}
        >
          {val || '—'}
        </code>
      ),
    },
    {
      title: 'Mã trạng thái',
      dataIndex: 'statusCode',
      width: 90,
      align: 'center' as const,
      render: (val: number) => {
        const cfg = statusTone(val)
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${cfg.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {val || '—'}
          </span>
        )
      },
    },
    {
      title: 'Thời gian phản hồi',
      dataIndex: 'duration',
      width: 130,
      align: 'right' as const,
      render: (val: number) => {
        const tone = durationTone(val)
        return (
          <div className="flex items-center justify-end gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono border ${tone.bg} ${tone.text}`}>
              <Clock size={11} />
              {val != null ? `${val} ms` : '—'}
            </span>
          </div>
        )
      },
    },
    {
      title: 'Account',
      dataIndex: 'username',
      width: 130,
      render: (val: string) => (
        val && val !== 'ANONYMOUS' && val !== 'anonymous' ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold uppercase">
              {val.slice(0, 2)}
            </div>
            <span className="text-xs text-neutral-700 truncate">{val}</span>
          </div>
        ) : (
          <span className="text-xs text-neutral-400 italic">ANONYMOUS</span>
        )
      ),
    },
    {
      title: 'Module',
      dataIndex: 'module',
      width: 90,
      render: (val: string) => (
        val ? (
          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
            {val}
          </span>
        ) : '—'
      ),
    },
    {
      title: 'Địa chỉ IP',
      dataIndex: 'ipAddress',
      width: 120,
      render: (val: string) => (
        <code className="text-[11px] font-mono text-neutral-500" title={val}>{val || '—'}</code>
      ),
    },
    {
      title: '',
      dataIndex: 'id',
      width: 50,
      align: 'center' as const,
      render: (_: unknown, row: ApiLogItem) => (
        <RowActions
          align="center"
          actions={[{ kind: 'view', onClick: () => setDetailLog(row) }]}
        />
      ),
    },
  ], [])

  // ---- Render ----
  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Nhật ký API"
        description={`Nhật ký API toàn hệ thống · ${stats?.total ?? '—'} bản ghi${refreshInterval > 0 ? ' · đang cập nhật trực tiếp' : ''}`}
        actions={
          <>
            <PageGuideButton guide={API_LOGS_GUIDE} />
            {/* Auto-refresh dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  setAutoRefreshOpen((v) => !v)
                }}
                className="gap-1.5"
              >
                {refreshInterval > 0 ? (
                  <span className="relative inline-flex items-center justify-center w-3 h-3">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
                  </span>
                ) : (
                  <Radio size={14} className="text-neutral-400" />
                )}
                Tự làm mới {refreshInterval > 0 ? AUTO_REFRESH_OPTIONS.find((o) => o.value === refreshInterval)?.label : 'Tắt'}
                <ChevronDown size={14} className="text-neutral-400" />
              </Button>
              {autoRefreshOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden z-10 animate-fade-in"
                >
                  {AUTO_REFRESH_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setRefreshInterval(opt.value)
                        setAutoRefreshOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 flex items-center justify-between ${
                        refreshInterval === opt.value ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-700'
                      }`}
                    >
                      {opt.label}
                      {refreshInterval === opt.value && <CheckCircle2 size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Làm mới
            </Button>

            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: true, days: 30 })}
              className="gap-1.5 text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              <Trash2 size={14} />
              Dọn log cũ
            </Button>
          </>
        }
      />

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          icon={Activity}
          label="Tổng yêu cầu"
          value={stats?.total ?? 0}
          trend={stats?.totalTrend}
          tone="neutral"
        />
        <StatTile
          icon={CheckCircle2}
          label="Thành công (2xx-3xx)"
          value={stats?.success ?? 0}
          subValue={stats?.total ? `${((stats.success / stats.total) * 100).toFixed(1)}%` : undefined}
          tone="emerald"
        />
        <StatTile
          icon={XCircle}
          label="Thất bại (4xx-5xx)"
          value={stats?.failed ?? 0}
          trend={stats?.failedTrend}
          trendInverse
          tone={stats?.failed && stats.failed > 0 ? 'rose' : 'neutral'}
        />
        <StatTile
          icon={Zap}
          label="Phản hồi TB"
          value={`${stats?.avgDuration ?? 0} ms`}
          subValue={stats?.avgDuration
            ? stats.avgDuration < 200 ? 'Nhanh' : stats.avgDuration < 800 ? 'OK' : 'Chậm'
            : undefined}
          tone={
            !stats?.avgDuration ? 'neutral'
            : stats.avgDuration < 200 ? 'emerald'
            : stats.avgDuration < 800 ? 'blue' : 'amber'
          }
        />
      </div>

      {/* ── Sticky FilterBar ── */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-2 bg-neutral-50/95 backdrop-blur border-y border-neutral-200/80 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px] md:max-w-[360px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              placeholder="Tìm URI, tên người dùng hoặc IP…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-9 w-full pl-8 pr-8 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
              aria-label="Tìm nhật ký API"
            />
            {searchText && (
              <IconActionButton tooltip="Xoá tìm kiếm" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5" onClick={() => setSearchText('')}>
                <X size={14} />
              </IconActionButton>
            )}
          </div>

          <div className="min-w-[130px]">
            <Select
              options={[
                { value: 'all', label: 'Tất cả phương thức' },
                ...METHODS.map((m) => ({ value: m, label: m })),
              ]}
              value={methodFilter}
              onChange={(v) => setMethodFilter(v as Method | 'all')}
              placeholder="Phương thức"
              aria-label="Lọc theo phương thức"
              showSearch={false}
            />
          </div>

          <div className="min-w-[140px]">
            <Select
              options={STATUS_PRESETS.map((p) => ({ value: p.key, label: p.label }))}
              value={statusGroup}
              onChange={(v) => setStatusGroup(v as StatusGroup)}
              placeholder="Mã trạng thái"
              aria-label="Lọc theo mã trạng thái"
              showSearch={false}
            />
          </div>

          <div className="min-w-[140px]">
            <Select
              options={[...MODULE_OPTIONS]}
              value={moduleFilter}
              onChange={(v) => setModuleFilter(v)}
              placeholder="Module"
              aria-label="Lọc theo module"
              showSearch
            />
          </div>

          <div className="relative min-w-[140px] max-w-[180px]">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              placeholder="Account…"
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
              className="h-9 w-full pl-8 pr-2 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
              aria-label="Lọc theo account"
            />
          </div>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-9 px-2 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
            aria-label="Từ ngày"
            title="Từ ngày"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-9 px-2 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
            aria-label="Đến ngày"
            title="Đến ngày"
          />

          <label className="inline-flex items-center gap-1.5 h-9 px-2 text-xs text-neutral-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={errorsOnly}
              onChange={(e) => setErrorsOnly(e.target.checked)}
              className="rounded border-neutral-300"
            />
            Chỉ lỗi
          </label>

          {hasActiveFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X size={12} className="mr-1" /> Xoá lọc
            </Button>
          )}
          <span className="text-xs text-neutral-500 ml-auto tabular-nums">
            {data?.total ?? 0} log{hasActiveFilter ? ' (đã lọc)' : ''}
          </span>
        </div>
      </div>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được nhật ký API"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : !isLoading && items.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Search}
            title={hasActiveFilter ? 'Không có bản ghi phù hợp bộ lọc' : 'Chưa có log nào được ghi'}
            description={hasActiveFilter
              ? 'Thử đổi bộ lọc hoặc xoá lọc.'
              : 'Nhật ký sẽ tự động xuất hiện khi có yêu cầu đến hệ thống.'}
            action={hasActiveFilter ? { label: 'Xoá lọc', onClick: clearFilters } : undefined}
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          showSearch={false}
          density="compact"
          loadingRows={6}
          pageIndex={page}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          totalElements={data?.total ?? 0}
          onPageChange={(newPage, newSize) => {
            setPage(newPage)
            setPageSize(newSize)
          }}
          onRefresh={() => void refetch()}
        />
      )}

      {/* ── Detail modal ── */}
      <ApiLogDetailModal log={detailLog} onClose={() => setDetailLog(null)} />

      {/* ── Delete cleanup modal ── */}
      <DeleteLogsModal
        isOpen={deleteModal.open}
        defaultDays={deleteModal.days}
        isLoading={deleteReq.isPending}
        onClose={() => setDeleteModal({ open: false, days: 30 })}
        onConfirm={(days) =>
          deleteReq.mutate(days, {
            onSuccess: () => setDeleteModal({ open: false, days: 30 }),
          })
        }
      />
    </div>
  )
}

// ============================================================
// StatTile — KPI card với optional trend
// ============================================================

function StatTile({
  icon: Icon, label, value, subValue, trend, trendInverse, tone,
}: {
  icon: typeof Activity
  label: string
  value: string | number
  subValue?: string
  /** % thay đổi so với kỳ trước — dương = tăng, âm = giảm */
  trend?: number
  /** Với "Thất bại" thì tăng là XẤU → set true để đảo màu tone */
  trendInverse?: boolean
  tone: 'neutral' | 'emerald' | 'rose' | 'blue' | 'amber'
}) {
  const toneMap = {
    neutral: { bg: 'bg-neutral-50/60', bar: 'bg-neutral-400', text: 'text-neutral-700' },
    emerald: { bg: 'bg-emerald-50/60', bar: 'bg-emerald-500', text: 'text-emerald-700' },
    rose:    { bg: 'bg-rose-50/60',    bar: 'bg-rose-500',    text: 'text-rose-700' },
    blue:    { bg: 'bg-blue-50/60',    bar: 'bg-blue-500',    text: 'text-blue-700' },
    amber:   { bg: 'bg-amber-50/60',   bar: 'bg-amber-500',   text: 'text-amber-700' },
  }[tone]

  const trendPositive = (trend ?? 0) > 0
  const trendGood = trendInverse ? !trendPositive : trendPositive

  return (
    <div className={`relative rounded-xl border border-neutral-200 bg-white overflow-hidden ${toneMap.bg}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${toneMap.bar}`} />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-2">
          <div className={`w-9 h-9 rounded-lg bg-white border border-neutral-100 flex items-center justify-center flex-shrink-0 ${toneMap.text}`}>
            <Icon size={16} />
          </div>
          {trend !== undefined && trend !== 0 && (
            <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
              trendGood ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {trendPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        <div className="mt-2">
          <div className={`text-[11px] font-bold uppercase tracking-wider ${toneMap.text}`}>{label}</div>
          <div className="text-2xl font-bold text-neutral-900 tabular-nums leading-none mt-1 truncate">
            {value}
          </div>
          {subValue && (
            <div className="text-[11px] text-neutral-500 mt-1 truncate">{subValue}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ApiLogDetailModal — meta grid + timeline + tabs Request/Response
// ============================================================

/**
 * Tách URI thành `path` + `queryParams` object. VD:
 *   "/qlns/payroll?month=7&year=2026" →
 *   { path: "/qlns/payroll", queryParams: {month: "7", year: "2026"} }
 */
function splitUri(uri?: string): { path: string; queryParams: Array<[string, string]> } {
  if (!uri) return { path: '', queryParams: [] }
  const qIdx = uri.indexOf('?')
  if (qIdx < 0) return { path: uri, queryParams: [] }
  const path = uri.slice(0, qIdx)
  const queryStr = uri.slice(qIdx + 1)
  const params: Array<[string, string]> = []
  queryStr.split('&').forEach((pair) => {
    if (!pair) return
    const eqIdx = pair.indexOf('=')
    if (eqIdx < 0) {
      params.push([decodeURIComponent(pair), ''])
    } else {
      try {
        params.push([
          decodeURIComponent(pair.slice(0, eqIdx)),
          decodeURIComponent(pair.slice(eqIdx + 1)),
        ])
      } catch {
        params.push([pair.slice(0, eqIdx), pair.slice(eqIdx + 1)])
      }
    }
  })
  return { path, queryParams: params }
}

/**
 * Kiểm tra body có phải "empty marker" từ BE không (VD: "[empty body]", "[multipart...]").
 * Nếu có → chưa phải nội dung thật.
 */
function isEmptyBodyMarker(body?: string): { isMarker: boolean; reason?: string } {
  if (!body) return { isMarker: true, reason: 'null' }
  const trimmed = body.trim()
  if (!trimmed) return { isMarker: true, reason: 'blank' }
  const m = trimmed.match(/^\[(.+?)\]$/)
  if (m) return { isMarker: true, reason: m[1] }
  return { isMarker: false }
}

/** Kiểm tra body có bị BE truncate không (kết thúc bằng "[truncated...]"). */
function isTruncated(body?: string): boolean {
  return !!body && /\[truncated[^\]]*\]$/.test(body.trim())
}

function ApiLogDetailModal({ log, onClose }: { log: ApiLogItem | null; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'request' | 'response' | 'params'>('request')
  const [fresh, setFresh] = useState<ApiLogItem | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    setFresh(null)
    if (log) {
      // Mặc định mở tab hợp lý theo method
      const bodyless = log.method && ['GET', 'HEAD', 'DELETE'].includes(log.method.toUpperCase())
      setActiveTab(bodyless ? 'response' : 'request')
    }
  }, [log])

  if (!log) return null

  // Nếu đã fetch lại từ getById → dùng data mới hơn
  const current = fresh ?? log

  const method = current.method || 'GET'
  const methodCfg = METHOD_COLORS[method] || METHOD_COLORS.GET
  const statusCfg = statusTone(current.statusCode)
  const durTone = durationTone(current.duration)

  const { path, queryParams } = splitUri(current.uri)
  const requestJson = formatJson(current.requestBody)
  const responseJson = formatJson(current.responseBody)
  const reqEmptyInfo = isEmptyBodyMarker(current.requestBody)
  const resEmptyInfo = isEmptyBodyMarker(current.responseBody)

  const handleRefresh = async () => {
    if (!current.id) return
    setRefreshing(true)
    try {
      const latest = await apilogApi.getById(current.id)
      setFresh(latest)
      toast.success('Đã tải lại chi tiết log')
    } catch {
      toast.error('Không tải lại được log')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <AppModal isOpen={!!log} onClose={onClose} title="Chi tiết yêu cầu" maxWidth="4xl">
      <div className="space-y-4">
        {/* Header — method + URI + status + refresh */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${methodCfg.chip} flex-shrink-0`}>
            <span className={`w-1.5 h-1.5 rounded-full ${methodCfg.dot}`} />
            {method}
          </span>
          <code
            className="flex-1 min-w-0 text-sm font-mono text-neutral-900 truncate"
            title={current.uri}
          >
            {current.uri}
          </code>
          <IconActionButton tooltip="Sao chép URI" onClick={() => copyToClipboard(current.uri || '', 'Đã copy URI')}>
            <Copy size={14} />
          </IconActionButton>
          <IconActionButton tooltip="Tải lại từ máy chủ" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </IconActionButton>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${statusCfg.chip} flex-shrink-0`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {current.statusCode ?? '—'}
          </span>
        </div>

        {/* Path only (nếu URI có query, tách path riêng cho dễ đọc) */}
        {queryParams.length > 0 && (
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-xs">
            <span className="text-blue-700 font-semibold">Đường dẫn:</span>{' '}
            <code className="font-mono text-neutral-900">{path}</code>
            <span className="ml-3 text-blue-700 font-semibold">Truy vấn:</span>{' '}
            <code className="font-mono text-neutral-600">{queryParams.length} tham số</code>
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MetaCell icon={Clock} label="Thời gian phản hồi" value={
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-mono border ${durTone.bg} ${durTone.text}`}>
              {current.duration != null ? `${current.duration} ms` : '—'} <span className="opacity-75">· {durTone.label}</span>
            </span>
          } />
          <MetaCell icon={User} label="Người dùng" value={current.username || <span className="italic text-neutral-400">ANONYMOUS</span>} />
          <MetaCell icon={Globe} label="Địa chỉ IP" value={<code className="font-mono text-xs">{current.ipAddress || '—'}</code>} />
          <MetaCell icon={Calendar} label="Bắt đầu" value={<span className="font-mono text-xs">{formatDateTime(current.effFrom)}</span>} />
          <MetaCell icon={Calendar} label="Kết thúc" value={<span className="font-mono text-xs">{formatDateTime(current.effTo)}</span>} />
          <MetaCell icon={Clock} label="Cách đây" value={formatRelative(current.effFrom)} />
          <MetaCell icon={Info} label="Module" value={current.module || '—'} />
          <MetaCell icon={Globe} label="User-Agent" value={
            <span className="text-xs text-neutral-700 line-clamp-2" title={current.userAgent}>{current.userAgent || '—'}</span>
          } />
          <MetaCell icon={Activity} label="Trace ID" value={
            <code className="font-mono text-xs">{current.traceId || '—'}</code>
          } />
        </div>

        {current.errorMessage && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Lỗi</div>
              <div className="mt-0.5">{current.errorMessage}</div>
            </div>
          </div>
        )}

        {/* Tabs: Params / Request / Response */}
        <div>
          <div className="flex items-center gap-1 border-b border-neutral-200">
            {queryParams.length > 0 && (
              <TabButton
                active={activeTab === 'params'}
                onClick={() => setActiveTab('params')}
                label={`Tham số truy vấn (${queryParams.length})`}
                dotColor="bg-indigo-500"
                hasContent={true}
              />
            )}
            <TabButton
              active={activeTab === 'request'}
              onClick={() => setActiveTab('request')}
              label="Nội dung yêu cầu"
              dotColor="bg-blue-500"
              hasContent={!reqEmptyInfo.isMarker}
            />
            <TabButton
              active={activeTab === 'response'}
              onClick={() => setActiveTab('response')}
              label="Nội dung phản hồi"
              dotColor="bg-emerald-500"
              hasContent={!resEmptyInfo.isMarker}
            />
            <div className="ml-auto flex items-center gap-1 pb-1">
              {activeTab !== 'params' && (
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      activeTab === 'request' ? requestJson : responseJson,
                      'Đã copy JSON',
                    )
                  }
                  disabled={
                    activeTab === 'request' ? reqEmptyInfo.isMarker : resEmptyInfo.isMarker
                  }
                  className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <Copy size={12} /> Copy
                </button>
              )}
            </div>
          </div>

          <div className="pt-3 space-y-2">
            {activeTab === 'params' && (
              <QueryParamsView params={queryParams} />
            )}

            {activeTab === 'request' && (
              <BodyView
                content={requestJson}
                emptyInfo={reqEmptyInfo}
                truncated={isTruncated(current.requestBody)}
                kind="request"
                method={method}
              />
            )}

            {activeTab === 'response' && (
              <BodyView
                content={responseJson}
                emptyInfo={resEmptyInfo}
                truncated={isTruncated(current.responseBody)}
                kind="response"
                method={method}
                statusCode={current.statusCode}
              />
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-neutral-100">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </AppModal>
  )
}

// ─── Query params table ───
function QueryParamsView({ params }: { params: Array<[string, string]> }) {
  return (
    <div className="rounded-lg border border-neutral-200 overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-neutral-50 text-neutral-500 text-[10px] uppercase tracking-wider">
          <tr>
            <th className="px-3 py-2 text-left font-semibold w-1/3">Tham số</th>
            <th className="px-3 py-2 text-left font-semibold">Giá trị</th>
            <th className="px-3 py-2 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {params.map(([k, v], i) => (
            <tr key={i} className="hover:bg-neutral-50/50">
              <td className="px-3 py-2 font-mono text-neutral-700">{k}</td>
              <td className="px-3 py-2 font-mono text-neutral-900 break-all">
                {v || <span className="text-neutral-400 italic">(trống)</span>}
              </td>
              <td className="px-3 py-2">
                <IconActionButton tooltip="Sao chép giá trị" size="sm" onClick={() => copyToClipboard(v, `Đã copy ${k}`)}>
                  <Copy size={12} />
                </IconActionButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Body view với empty state + truncation notice ───
function BodyView({
  content, emptyInfo, truncated, kind, method, statusCode,
}: {
  content: string
  emptyInfo: { isMarker: boolean; reason?: string }
  truncated: boolean
  kind: 'request' | 'response'
  method?: string
  statusCode?: number
}) {
  if (!emptyInfo.isMarker) {
    return (
      <>
        {truncated && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              Nội dung này đã bị <strong>cắt ngắn</strong> khi ghi log (giới hạn để tránh cơ sở dữ liệu phình).
              Xem đầy đủ trong log file hoặc APM tool.
            </span>
          </div>
        )}
        <pre className="text-xs font-mono bg-neutral-900 text-neutral-100 rounded-lg p-4 overflow-auto max-h-[420px] leading-relaxed">
          {content}
        </pre>
      </>
    )
  }

  // Xác định empty reason để hiển thị hint phù hợp
  const upperMethod = (method || '').toUpperCase()
  const bodylessMethod = ['GET', 'HEAD', 'DELETE', 'OPTIONS'].includes(upperMethod)

  let title = 'Không có nội dung'
  let hint: React.ReactNode = 'Log này không ghi lại nội dung.'
  let tone: 'info' | 'warning' = 'info'

  if (kind === 'request') {
    if (bodylessMethod) {
      title = `${upperMethod} không có nội dung`
      hint = 'Tham số được truyền qua URL / chuỗi truy vấn (xem tab "Tham số truy vấn" nếu có).'
    } else if (emptyInfo.reason === 'empty body') {
      title = 'Nội dung rỗng'
      hint = 'Máy khách gửi yêu cầu không kèm nội dung (Content-Length: 0).'
    } else if (emptyInfo.reason?.startsWith('multipart')) {
      title = 'Tải lên nhiều phần'
      hint = 'Tệp tải lên đã được bỏ qua khi ghi log để không tốn bộ nhớ. Kiểm tra qua kho lưu trữ hoặc nhật ký riêng.'
      tone = 'warning'
    } else {
      title = 'Không ghi được nội dung yêu cầu'
      hint = 'Có thể yêu cầu bị chặn ở tầng lọc/bảo mật trước khi tới bộ điều khiển. Đã sửa ở phiên bản mới — khởi động lại máy chủ nếu xem log cũ.'
      tone = 'warning'
    }
  } else {
    // response
    if (statusCode && [204, 205, 304].includes(statusCode)) {
      title = `${statusCode} — không có nội dung`
      hint = 'Điểm cuối trả về mã trạng thái không kèm nội dung theo chuẩn HTTP.'
    } else if (bodylessMethod && !statusCode) {
      title = 'Nội dung phản hồi rỗng'
      hint = `${upperMethod} thường trả nội dung rỗng hoặc chỉ mã trạng thái.`
    } else {
      title = 'Nội dung phản hồi rỗng'
      hint = 'Máy chủ không trả nội dung (có thể do chuyển hướng, tải tệp, hoặc luồng dữ liệu liên tục).'
    }
  }

  const toneClass = tone === 'warning'
    ? 'bg-amber-50 border-amber-200 text-amber-800'
    : 'bg-neutral-50 border-neutral-200 text-neutral-600'
  const iconClass = tone === 'warning' ? 'text-amber-600' : 'text-neutral-400'

  return (
    <div className={`rounded-lg border-2 border-dashed py-8 px-6 text-center ${toneClass}`}>
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-white ${iconClass} mb-2`}>
        {tone === 'warning' ? <AlertTriangle size={18} /> : <Info size={18} />}
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs mt-1 opacity-80 max-w-md mx-auto">{hint}</div>
    </div>
  )
}

function MetaCell({ icon: Icon, label, value }: {
  icon: typeof Clock
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-1">
        <Icon size={14} /> {label}
      </div>
      <div className="text-sm text-neutral-900 mt-1 min-h-[20px]">{value}</div>
    </div>
  )
}

function TabButton({ active, onClick, label, dotColor, hasContent }: {
  active: boolean
  onClick: () => void
  label: string
  dotColor: string
  hasContent: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'text-primary-700' : 'text-neutral-500 hover:text-neutral-800'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor} ${hasContent ? '' : 'opacity-30'}`} />
      {label}
      {!hasContent && <span className="text-[10px] text-neutral-400 font-normal">(trống)</span>}
      {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary-600" />}
    </button>
  )
}

// ============================================================
// DeleteLogsModal — chọn preset ngày, thay <input> + confirm() ad-hoc
// ============================================================

function DeleteLogsModal({
  isOpen, defaultDays, isLoading, onClose, onConfirm,
}: {
  isOpen: boolean
  defaultDays: number
  isLoading: boolean
  onClose: () => void
  onConfirm: (days: number) => void
}) {
  const [days, setDays] = useState(defaultDays)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (isOpen) setDays(defaultDays)
  }, [isOpen, defaultDays])

  return (
    <>
      <AppModal
        isOpen={isOpen && !confirmOpen}
        onClose={onClose}
        title="Dọn dẹp log cũ"
        description="Xoá tất cả nhật ký API tạo trước khoảng thời gian bạn chọn."
        maxWidth="md"
      >
        <div className="space-y-4">
          {/* Preset chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Chọn khoảng thời gian
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DELETE_PRESETS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setDays(p.days)}
                  className={`flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left ${
                    days === p.days
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <span className={`text-sm font-semibold ${days === p.days ? 'text-primary-700' : 'text-neutral-900'}`}>
                    {p.label}
                  </span>
                  <span className="text-[11px] text-neutral-500 mt-0.5">{p.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Hoặc nhập số ngày cụ thể
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
                className="h-10 w-full px-3 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <span className="text-sm text-neutral-500 whitespace-nowrap">ngày trở lên</span>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
            <Trash2 size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              Hành động này <strong>không thể hoàn tác</strong>. Toàn bộ log cũ hơn <strong>{days} ngày</strong> sẽ bị xoá vĩnh viễn khỏi cơ sở dữ liệu.
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
        <Button variant="outline" onClick={onClose}>Huỷ</Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
            >
              <Trash2 size={14} /> Tiếp tục xoá
            </Button>
          </div>
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          onConfirm(days)
        }}
        title={`Xoá tất cả log cũ hơn ${days} ngày?`}
        message={
          <span>
            Xác nhận lần cuối: thao tác này <strong>không thể hoàn tác</strong>. Nếu cần lưu nhật ký lâu dài, hãy sao lưu cơ sở dữ liệu trước khi tiếp tục.
          </span>
        }
        confirmText="Xoá vĩnh viễn"
        variant="danger"
        isLoading={isLoading}
      />
    </>
  )
}
