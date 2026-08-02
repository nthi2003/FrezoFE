import { useMemo, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, ListChecks, UsersRound,
  Search, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  PageHeader, PageGuideButton, EmptyState, ErrorState,
  Button, Select,
} from '@frezo/ui'
import { profileApi } from '@/modules/profile/services/profileApi'
import { usePersonsCombobox } from '../hooks/usePerson'
import { useAttendanceList, useMyMonthAttendance } from '../hooks/useAttendance'
import { formatDate } from '@frezo/utils'
import { AttendanceTodayCard } from '../components/AttendanceTodayCard'
import { AttendanceKPICards } from '../components/AttendanceKPICards'
import { AttendanceHeatmap } from '../components/AttendanceHeatmap'
import { AttendanceDailyRoster } from '../components/AttendanceDailyRoster'
import { ATTENDANCE_GUIDE } from '../constants/attendance.guide'
import { StatusPipelineStepper } from '../../warehouse/components/StatusPipelineStepper'
import {
  ATTENDANCE_PAYROLL_PIPELINE,
  attendanceWorkflowStepIndex,
} from '../constants/hrWorkflow'
import { pageRootClass } from '../utils/pageEmbed'
import { payrollHubUrl, timeHubUrl } from '../utils/qlnsRoutes'

const now = new Date()
const CURRENT_MONTH = now.getMonth() + 1
const CURRENT_YEAR = now.getFullYear()

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Tháng ${i + 1}`,
}))

const YEAR_OPTIONS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => ({
  value: String(y),
  label: `Năm ${y}`,
}))

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Có mặt' },
  { value: 'ABSENT', label: 'Vắng' },
  { value: 'LATE', label: 'Đi muộn' },
  { value: 'HALF_DAY', label: 'Nửa ngày' },
  { value: 'LEAVE', label: 'Nghỉ phép' },
  { value: 'HOLIDAY', label: 'Nghỉ lễ' },
]

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PRESENT: { label: 'Có mặt', color: 'bg-emerald-100 text-emerald-700' },
  ABSENT: { label: 'Vắng', color: 'bg-rose-100 text-rose-700' },
  LATE: { label: 'Đi muộn', color: 'bg-orange-100 text-orange-700' },
  HALF_DAY: { label: 'Nửa ngày', color: 'bg-yellow-100 text-yellow-700' },
  LEAVE: { label: 'Nghỉ phép', color: 'bg-blue-100 text-blue-700' },
  HOLIDAY: { label: 'Nghỉ lễ', color: 'bg-slate-100 text-slate-600' },
}

const STANDALONE_TABS = [
  { key: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { key: 'daily', label: 'Theo dõi ngày', icon: UsersRound },
  { key: 'list', label: 'Danh sách tháng', icon: ListChecks },
] as const

type AttendanceTabKey = 'overview' | 'daily' | 'list'

export function AttendancePage({
  embedded,
  initialTab = 'daily',
}: {
  embedded?: boolean
  initialTab?: AttendanceTabKey
} = {}) {
  const [month, setMonth] = useState(CURRENT_MONTH)
  const [year, setYear] = useState(CURRENT_YEAR)
  const [personIdFilter, setPersonIdFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [listSearch, setListSearch] = useState('')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [activeTab, setActiveTab] = useState<AttendanceTabKey>(initialTab)

  const effectiveTab = embedded ? initialTab : activeTab

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    staleTime: 5 * 60 * 1000,
  })
  const myPersonId = profile?.personId
  const myName = profile?.name

  const filterParams = {
    month,
    year,
    ...(personIdFilter && { personId: personIdFilter }),
    ...(statusFilter && { status: statusFilter }),
    pageNumber: page,
    pageSize: size,
  }
  const {
    data: rawData,
    isLoading,
    isError: listIsError,
    error: listError,
    refetch: refetchList,
    isFetching: listFetching,
  } = useAttendanceList(filterParams)

  const { data: myMonthRecords = [] } = useMyMonthAttendance(myPersonId, month, year)
  const { options: personOptions, data: personData, isLoading: personsLoading } = usePersonsCombobox()

  const personMap = useMemo(() => {
    const map: Record<string, string> = {}
    ;(personData ?? []).forEach((p: any) => {
      map[p.value ?? p.id ?? p.code] = p.label ?? p.name ?? p.fullName
    })
    return map
  }, [personData])

  const dataList = rawData?.items || []
  const totalElements = rawData?.total || 0
  const periodLabel = `Tháng ${month}/${year}`
  const isCurrentPeriod = month === CURRENT_MONTH && year === CURRENT_YEAR

  const listHasFilter = !!personIdFilter || !!statusFilter || !!listSearch.trim()
  const clearListFilters = useCallback(() => {
    setPersonIdFilter('')
    setStatusFilter('')
    setListSearch('')
    setPage(1)
  }, [])

  const shiftPeriod = useCallback((delta: -1 | 1) => {
    setMonth((m) => {
      const next = m + delta
      if (next < 1) { setYear((y) => y - 1); return 12 }
      if (next > 12) { setYear((y) => y + 1); return 1 }
      return next
    })
    setPage(1)
  }, [])

  const goCurrentPeriod = () => {
    setMonth(CURRENT_MONTH)
    setYear(CURRENT_YEAR)
    setPage(1)
  }

  const getPersonName = useCallback(
    (record: any) => record.personName || personMap[record.personId] || '—',
    [personMap],
  )

  const filteredList = useMemo(() => {
    const q = listSearch.trim().toLowerCase()
    if (!q) return dataList
    return dataList.filter((row: any) => getPersonName(row).toLowerCase().includes(q))
  }, [dataList, listSearch, getPersonName])

  const handlePageChange = (newPage: number, newSize: number) => {
    setPage(newPage)
    setSize(newSize)
  }

  const listErrMsg =
    (listError as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (listError as Error)?.message ||
    'Không tải được danh sách chấm công.'

  const attendanceColumns: AppTableColumn<any>[] = useMemo(() => [
    {
      title: 'Nhân viên',
      dataIndex: 'personId',
      key: 'personName',
      render: (_, row) => (
        <span className="font-medium text-neutral-800">
          {personsLoading && !row.personName && !personMap[row.personId] ? (
            <span className="inline-block h-4 w-28 rounded bg-neutral-100 animate-pulse" />
          ) : (
            getPersonName(row)
          )}
        </span>
      ),
    },
    {
      title: 'Ngày',
      dataIndex: 'attendanceDate',
      key: 'attendanceDate',
      render: (val: string) => <span className="text-neutral-600">{val ? formatDate(val) : '—'}</span>,
    },
    {
      title: 'Check-in',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      render: (val: string) => <span className="font-mono text-xs">{formatTime(val)}</span>,
    },
    {
      title: 'Check-out',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      render: (val: string) => <span className="font-mono text-xs">{formatTime(val)}</span>,
    },
    {
      title: 'Giờ làm',
      dataIndex: 'workMinutes',
      key: 'workMinutes',
      render: (val: number) => <span className="text-neutral-700">{formatMinutes(val)}</span>,
    },
    {
      title: 'Đi muộn',
      dataIndex: 'lateMinutes',
      key: 'lateMinutes',
      render: (val: number) => {
        if (!val || val <= 0) return <span className="text-emerald-600">—</span>
        return <span className="text-orange-600 font-medium">{formatMinutes(val)}</span>
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        const s = STATUS_MAP[val] || STATUS_MAP['ABSENT']
        return (
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${s.color}`}>{s.label}</span>
        )
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (val: string) => (
        <span className="text-neutral-500 text-xs max-w-[150px] truncate block">{val || '—'}</span>
      ),
    },
  ], [personMap, personsLoading, getPersonName])

  return (
    <div className={pageRootClass(embedded)}>
      {!embedded && (
        <PageHeader
          title="Chấm công"
          description="Theo dõi roster ngày toàn công ty và giờ công cá nhân."
          actions={<PageGuideButton guide={ATTENDANCE_GUIDE} />}
        />
      )}

      <StatusPipelineStepper
        steps={ATTENDANCE_PAYROLL_PIPELINE}
        currentIndex={attendanceWorkflowStepIndex(effectiveTab)}
        nextCta={{ label: 'Nghỉ phép', href: timeHubUrl({ tab: 'leaves' }) }}
      />

      {(effectiveTab === 'overview' || effectiveTab === 'daily') && (
        <AttendanceTodayCard personId={myPersonId} personName={myName} />
      )}

      {!embedded && (
        <div
          className="inline-flex flex-wrap gap-1 bg-neutral-100 p-1 rounded-lg"
          role="tablist"
          aria-label="Chế độ xem chấm công"
        >
          {STANDALONE_TABS.map((t) => {
            const Icon = t.icon
            const active = activeTab === t.key
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(t.key)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md transition-all ${
                  active
                    ? 'bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200/80'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50/80'
                }`}
              >
                <Icon size={15} className={active ? 'text-primary-600' : 'text-neutral-400'} />
                {t.label}
              </button>
            )
          })}
        </div>
      )}

      {effectiveTab === 'overview' && (
        <div className="space-y-6">
          <AttendanceKPICards records={myMonthRecords} />
          <AttendanceHeatmap
            records={myMonthRecords}
            month={month}
            year={year}
            onChangeMonth={(m, y) => {
              setMonth(m)
              setYear(y)
              setPage(1)
            }}
          />
        </div>
      )}

      {effectiveTab === 'daily' && <AttendanceDailyRoster />}

      {effectiveTab === 'list' && (
        <>
          <FilterBar
            hasActiveFilters={listHasFilter}
            onClear={clearListFilters}
            countLabel={`${listSearch.trim() ? filteredList.length : totalElements} bản ghi${listHasFilter ? ' (đã lọc)' : ''} · ${periodLabel}`}
            extra={(
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetchList()}
                className="gap-2 h-9"
                disabled={listFetching}
              >
                <RefreshCw size={14} className={listFetching ? 'animate-spin' : ''} />
                Làm mới
              </Button>
            )}
          >
            <button
              type="button"
              onClick={() => shiftPeriod(-1)}
              className="w-9 h-9 rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 flex items-center justify-center"
              aria-label="Kỳ trước"
            >
              <ChevronLeft size={16} />
            </button>
            <PeriodInlineSelect
              months={MONTH_OPTIONS}
              years={YEAR_OPTIONS}
              month={month}
              year={year}
              onChange={(m, y) => { setMonth(m); setYear(y); setPage(1) }}
            />
            {isCurrentPeriod && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded">
                Kỳ hiện tại
              </span>
            )}
            <button
              type="button"
              onClick={() => shiftPeriod(+1)}
              className="w-9 h-9 rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 flex items-center justify-center"
              aria-label="Kỳ sau"
            >
              <ChevronRight size={16} />
            </button>
            {!isCurrentPeriod && (
              <button
                type="button"
                onClick={goCurrentPeriod}
                className="h-9 px-2.5 text-xs font-medium text-primary-700 hover:bg-primary-50 rounded-md border border-primary-200"
              >
                ← Về kỳ hiện tại
              </button>
            )}
            <div className="min-w-[160px]">
              <Select
                options={[{ value: '', label: 'Tất cả trạng thái' }, ...STATUS_OPTIONS]}
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setPage(1) }}
                placeholder="Trạng thái"
                aria-label="Lọc trạng thái chấm công"
                showSearch={false}
              />
            </div>
            <div className="min-w-[180px]">
              <Select
                options={[{ value: '', label: 'Tất cả nhân viên' }, ...personOptions]}
                value={personIdFilter}
                onChange={(v) => { setPersonIdFilter(v); setPage(1) }}
                showSearch
                placeholder={personsLoading ? 'Đang tải...' : 'Nhân viên'}
                aria-label="Lọc nhân viên"
              />
            </div>
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
                placeholder="Tìm theo tên nhân viên…"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                aria-label="Tìm chấm công"
              />
            </div>
          </FilterBar>

          {listIsError ? (
            <div className="border rounded-xl bg-white">
              <ErrorState
                title="Không tải được danh sách chấm công"
                message={listErrMsg}
                onRetry={() => void refetchList()}
                isRetrying={listFetching}
              />
            </div>
          ) : !isLoading && filteredList.length === 0 ? (
            <div className="border rounded-xl bg-white">
              <EmptyState
                icon={ListChecks}
                title={dataList.length === 0 ? 'Không có bản ghi chấm công' : 'Không có bản ghi khớp bộ lọc'}
                description={
                  dataList.length === 0
                    ? `Chưa có dữ liệu chấm công trong ${periodLabel}.`
                    : 'Thử xoá lọc hoặc đổi kỳ / trạng thái.'
                }
                action={listHasFilter ? { label: 'Xoá lọc', onClick: clearListFilters } : undefined}
              />
            </div>
          ) : (
            <AppTable
              data={filteredList}
              columns={attendanceColumns}
              isLoading={isLoading}
              density="compact"
              pageIndex={page}
              pageSize={size}
              totalElements={listSearch.trim() ? filteredList.length : totalElements}
              onPageChange={handlePageChange}
              showSearch={false}
              onRefresh={() => void refetchList()}
            />
          )}
        </>
      )}

      {!embedded && effectiveTab !== 'list' && (
        <div className="text-sm text-neutral-500 pt-2">
          Tiếp theo:{' '}
          <a href={payrollHubUrl()} className="text-primary-600 hover:underline font-medium">
            Bảng lương
          </a>
        </div>
      )}
    </div>
  )
}

function PeriodInlineSelect({
  months,
  years,
  month,
  year,
  onChange,
}: {
  months: Array<{ value: string; label: string }>
  years: Array<{ value: string; label: string }>
  month: number
  year: number
  onChange: (month: number, year: number) => void
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <div className="w-[110px]">
        <Select
          options={months}
          value={String(month)}
          onChange={(v) => onChange(Number(v), year)}
          placeholder="Tháng"
          aria-label="Tháng chấm công"
          showSearch={false}
        />
      </div>
      <span className="text-neutral-400 text-sm">/</span>
      <div className="w-[100px]">
        <Select
          options={years.map((y) => ({ value: y.value, label: y.label.replace('Năm ', '') }))}
          value={String(year)}
          onChange={(v) => onChange(month, Number(v))}
          placeholder="Năm"
          aria-label="Năm chấm công"
          showSearch={false}
        />
      </div>
    </div>
  )
}

function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${m > 0 ? `${m}p` : ''}`
}

function formatTime(time: string | null | undefined): string {
  if (!time) return '—'
  return time.substring(0, 5)
}
