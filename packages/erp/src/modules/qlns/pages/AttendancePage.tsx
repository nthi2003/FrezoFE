import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, X, CalendarDays, LayoutDashboard, ListChecks, PlaneTakeoff, Inbox, UsersRound } from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { AppModal, PageHeader, PageGuideButton } from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@frezo/ui'
import { Select } from '@frezo/ui'
import { profileApi } from '@/modules/profile/services/profileApi'
import { usePersonsCombobox } from '../hooks/usePerson'
import { useAttendanceList, useMyMonthAttendance } from '../hooks/useAttendance'
import {
  useLeaveRequests,
  useCreateLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
} from '../hooks/useLeave'
import { leaveRequestSchema, leaveRejectSchema } from '../constants/schema'
import { formatDate } from '@frezo/utils'
import { AttendanceTodayCard } from '../components/AttendanceTodayCard'
import { AttendanceKPICards } from '../components/AttendanceKPICards'
import { AttendanceHeatmap } from '../components/AttendanceHeatmap'
import { AttendanceDailyRoster } from '../components/AttendanceDailyRoster'
import { ATTENDANCE_GUIDE } from '../constants/attendance.guide'
import { usePermission, useAnyPermission } from '@/lib/hooks/usePermission'

// ============================================================
// Constants
// ============================================================

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

const TABS = [
  { key: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { key: 'daily', label: 'Theo dõi ngày', icon: UsersRound },
  { key: 'list', label: 'Danh sách chấm công', icon: ListChecks },
  { key: 'leaves', label: 'Đơn nghỉ phép', icon: PlaneTakeoff },
] as const

type TabKey = (typeof TABS)[number]['key']

// ============================================================
// Page
// ============================================================

export function AttendancePage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [personIdFilter, setPersonIdFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [activeTab, setActiveTab] = useState<TabKey>('daily')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null)
  const canCreateLeave = usePermission('LEAVE.CREATE')
  const canApproveLeave = useAnyPermission(['LEAVE.APPROVE', 'APPROVALS.APPROVE'])

  // ---- Auth / profile: lấy personId của user hiện tại ----
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    staleTime: 5 * 60 * 1000,
  })
  const myPersonId = profile?.personId
  const myName = profile?.name

  // ---- Team / list data ----
  const filterParams = {
    month,
    year,
    ...(personIdFilter && { personId: personIdFilter }),
    ...(statusFilter && { status: statusFilter }),
    pageNumber: page,
    pageSize: size,
  }
  const { data: rawData, isLoading } = useAttendanceList(filterParams)

  // ---- Personal month data (cho Overview) ----
  const { data: myMonthRecords = [] } = useMyMonthAttendance(myPersonId, month, year)

  // ---- Person combobox ----
  const { options: personOptions, data: personData, isLoading: personsLoading } = usePersonsCombobox()

  const { data: leaveData, isLoading: leaveLoading } = useLeaveRequests()
  const createReq = useCreateLeaveRequest()
  const approveReq = useApproveLeaveRequest()
  const rejectReq = useRejectLeaveRequest()

  const personMap = useMemo(() => {
    const map: Record<string, string> = {}
    ;(personData ?? []).forEach((p: any) => {
      map[p.value ?? p.id ?? p.code] = p.label ?? p.name ?? p.fullName
    })
    return map
  }, [personData])

  const dataList = rawData?.items || []
  const totalElements = rawData?.total || 0

  // ---- Handlers ----
  /** Resolve tên NV — không bao giờ flash UUID. */
  const getPersonName = (record: any) =>
    record.personName || personMap[record.personId] || '—'

  const handlePageChange = (newPage: number, newSize: number) => {
    setPage(newPage)
    setSize(newSize)
  }

  const handleOpenReject = (id: string) => {
    setSelectedLeaveId(id)
    setRejectModalOpen(true)
  }

  // ---- Columns cho danh sách chấm công (dành cho manager) ----
  const attendanceColumns: AppTableColumn<any>[] = [
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
      filterType: 'select',
      filterOptions: STATUS_OPTIONS,
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
  ]

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Chấm công"
        description="Theo dõi roster ngày toàn công ty, giờ công cá nhân và đơn nghỉ phép."
        actions={
          <>
            <PageGuideButton guide={ATTENDANCE_GUIDE} />
            {activeTab === 'leaves' && (
              <>
                <Link to="/approval/inbox">
                  <Button variant="outline" className="gap-2">
                    <Inbox className="w-4 h-4" /> Approval Inbox
                  </Button>
                </Link>
                {canCreateLeave && (
                  <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
                    <CalendarDays className="w-4 h-4" /> Tạo đơn nghỉ phép
                  </Button>
                )}
              </>
            )}
          </>
        }
      />

      {/* Today Hero — luôn hiển thị nếu có personId */}
      <AttendanceTodayCard personId={myPersonId} personName={myName} />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-neutral-100 p-1 rounded-lg w-fit">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = activeTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                active
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* === TAB: OVERVIEW === */}
      {activeTab === 'overview' && (
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

      {/* === TAB: DAILY ROSTER (HR) — ATT-FE-01 === */}
      {activeTab === 'daily' && <AttendanceDailyRoster />}

      {/* === TAB: LIST (tháng — manager) === */}
      {activeTab === 'list' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-28">
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Tháng</label>
                <Select
                  options={Array.from({ length: 12 }, (_, i) => ({
                    value: String(i + 1),
                    label: `Tháng ${i + 1}`,
                  }))}
                  value={String(month)}
                  onChange={(v) => {
                    setMonth(Number(v))
                    setPage(1)
                  }}
                />
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Năm</label>
                <Select
                  options={[2024, 2025, 2026, 2027].map((y) => ({
                    value: String(y),
                    label: String(y),
                  }))}
                  value={String(year)}
                  onChange={(v) => {
                    setYear(Number(v))
                    setPage(1)
                  }}
                />
              </div>
              <div className="w-56">
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                  Nhân viên {personOptions.length > 0 && (
                    <span className="text-neutral-400 font-normal">({personOptions.length})</span>
                  )}
                </label>
                <Select
                  options={[{ value: '', label: 'Tất cả nhân viên' }, ...personOptions]}
                  value={personIdFilter}
                  onChange={(v) => {
                    setPersonIdFilter(v)
                    setPage(1)
                  }}
                  showSearch
                  placeholder={personsLoading ? 'Đang tải...' : 'Chọn nhân viên...'}
                />
              </div>
              <div className="w-40">
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                  Trạng thái
                </label>
                <Select
                  options={[{ value: '', label: 'Tất cả' }, ...STATUS_OPTIONS]}
                  value={statusFilter}
                  onChange={(v) => {
                    setStatusFilter(v)
                    setPage(1)
                  }}
                />
              </div>
            </div>
          </div>

          <AppTable
            data={dataList}
            columns={attendanceColumns}
            isLoading={isLoading}
            pageIndex={page}
            pageSize={size}
            totalElements={totalElements}
            onPageChange={handlePageChange}
            showSearch
            searchPlaceholder="Tìm theo tên nhân viên..."
          />
        </>
      )}

      {/* === TAB: LEAVES === */}
      {activeTab === 'leaves' && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  {['STT', 'Nhân viên', 'Lý do', 'Từ ngày', 'Đến ngày', 'Trạng thái', 'Thao tác'].map(
                    (h) => (
                      <th
                        key={h}
                        className="h-12 px-4 text-left align-middle font-medium text-neutral-500"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {leaveLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        Đang tải...
                      </div>
                    </td>
                  </tr>
                ) : !leaveData || leaveData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-400">
                      <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      Không có đơn nghỉ phép nào
                    </td>
                  </tr>
                ) : (
                  leaveData.map((row: any, idx: number) => {
                    const statusMap: Record<string, { label: string; color: string }> = {
                      APPROVED: { label: 'Đã duyệt', color: 'bg-emerald-100 text-emerald-700' },
                      REJECTED: { label: 'Từ chối', color: 'bg-rose-100 text-rose-700' },
                      CANCELLED: { label: 'Đã huỷ', color: 'bg-neutral-100 text-neutral-600' },
                      PENDING: { label: 'Chờ Approval', color: 'bg-orange-100 text-orange-700' },
                      PENDING_MANAGER: { label: 'Chờ Approval', color: 'bg-orange-100 text-orange-700' },
                      PENDING_HR: { label: 'Chờ Approval', color: 'bg-blue-100 text-blue-700' },
                    }
                    const st = row.status || 'PENDING'
                    const s = statusMap[st] || statusMap.PENDING
                    const canAct =
                      !st ||
                      st === 'PENDING' ||
                      st === 'PENDING_MANAGER' ||
                      st === 'PENDING_HR'
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors"
                      >
                        <td className="p-4 text-neutral-500">{idx + 1}</td>
                        <td className="p-4 font-medium text-neutral-800">
                          {row.personName || personMap[row.personId] || '—'}
                        </td>
                        <td className="p-4 text-neutral-700 max-w-[200px] truncate">{row.reason}</td>
                        <td className="p-4 text-neutral-600">{formatDate(row.startDate)}</td>
                        <td className="p-4 text-neutral-600">{formatDate(row.endDate)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${s.color}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {canAct && canApproveLeave && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => approveReq.mutate(row.id)}
                                  disabled={approveReq.isPending}
                                  title="Duyệt qua Approval"
                                >
                                  <Check className="w-4 h-4 text-emerald-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenReject(row.id)}
                                  title="Từ chối qua Approval"
                                >
                                  <X className="w-4 h-4 text-rose-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Leave Modal */}
      <AppModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Tạo đơn xin nghỉ phép"
      >
        <AppForm
          schema={leaveRequestSchema}
          defaultValues={{ reason: '', startDate: '', endDate: '' }}
          onSubmit={(v) => createReq.mutate(v, { onSuccess: () => setCreateModalOpen(false) })}
          fields={[
            { name: 'reason', label: 'Lý do' },
            { name: 'startDate', label: 'Từ ngày', type: 'date' },
            { name: 'endDate', label: 'Đến ngày', type: 'date' },
          ]}
          submitText="Xác nhận"
          isLoading={createReq.isPending}
        />
      </AppModal>

      {/* Reject Leave Modal */}
      <AppModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Từ chối đơn"
      >
        <AppForm
          schema={leaveRejectSchema}
          defaultValues={{ reason: '' }}
          onSubmit={(v) =>
            selectedLeaveId &&
            rejectReq.mutate(
              { id: selectedLeaveId, data: v },
              { onSuccess: () => setRejectModalOpen(false) },
            )
          }
          fields={[{ name: 'reason', label: 'Lý do từ chối' }]}
          submitText="Xác nhận"
          isLoading={rejectReq.isPending}
        />
      </AppModal>
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

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
