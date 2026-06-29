import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, X, CalendarDays, Clock, Users, AlertTriangle, Building2 } from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { AppModal } from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@frezo/ui'
import { Select } from '@frezo/ui'
import { personApi } from '../services/personApi'
import { useAttendanceList } from '../hooks/useAttendance'
import {
  useLeaveRequests,
  useCreateLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest
} from '../hooks/useLeave'
import { leaveRequestSchema, leaveRejectSchema } from '../constants/schema'
import { formatDate } from '@frezo/utils'

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Có mặt' },
  { value: 'ABSENT', label: 'Vắng' },
  { value: 'LATE', label: 'Đi muộn' },
  { value: 'HALF_DAY', label: 'Nửa ngày' },
  { value: 'LEAVE', label: 'Nghỉ phép' },
  { value: 'HOLIDAY', label: 'Nghỉ lễ' },
]

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PRESENT: { label: 'Có mặt', color: 'bg-green-100 text-green-700' },
  ABSENT: { label: 'Vắng', color: 'bg-red-100 text-red-700' },
  LATE: { label: 'Đi muộn', color: 'bg-orange-100 text-orange-700' },
  HALF_DAY: { label: 'Nửa ngày', color: 'bg-yellow-100 text-yellow-700' },
  LEAVE: { label: 'Nghỉ phép', color: 'bg-blue-100 text-blue-700' },
  HOLIDAY: { label: 'Nghỉ lễ', color: 'bg-gray-100 text-gray-700' },
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

export function AttendancePage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [personId, setPersonId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves'>('attendance')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null)

  const filterParams = {
    month,
    year,
    ...(personId && { personId }),
    ...(statusFilter && { status: statusFilter }),
    pageNumber: page,
    pageSize: size,
  }

  const { data: rawData, isLoading } = useAttendanceList(filterParams)
  const { data: personData } = useQuery({
    queryKey: ['persons_combobox'],
    queryFn: () => personApi.getCombobox(),
  })
  const { data: leaveData, isLoading: leaveLoading } = useLeaveRequests()
  const createReq = useCreateLeaveRequest()
  const approveReq = useApproveLeaveRequest()
  const rejectReq = useRejectLeaveRequest()

  const personOptions = Array.isArray(personData)
    ? (personData as any[]).map((p: any) => ({ value: p.value || p.id, label: p.label || p.name }))
    : []

  const personMap = useMemo(() => {
    const map: Record<string, string> = {}
    if (Array.isArray(personData)) {
      ;(personData as any[]).forEach((p: any) => {
        map[p.value || p.id] = p.label || p.name
      })
    }
    return map
  }, [personData])

  const dataList = rawData?.items || []
  const totalElements = rawData?.total || 0

  const getPersonName = (record: any) => {
    return record.personName || personMap[record.personId] || record.personId || '—'
  }

  const handlePageChange = (newPage: number, newSize: number) => {
    setPage(newPage)
    setSize(newSize)
  }

  const handleOpenReject = (id: string) => {
    setSelectedLeaveId(id)
    setRejectModalOpen(true)
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    dataList.forEach((r: any) => {
      const s = r.status || 'UNKNOWN'
      counts[s] = (counts[s] || 0) + 1
    })
    return counts
  }, [dataList])

  const summaryCards = [
    {
      label: 'Tổng chấm công',
      value: totalElements,
      icon: CalendarDays,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Có mặt',
      value: statusCounts['PRESENT'] || 0,
      icon: Users,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Đi muộn',
      value: statusCounts['LATE'] || 0,
      icon: Clock,
      color: 'text-orange-600 bg-orange-50',
    },
    {
      label: 'Vắng',
      value: (statusCounts['ABSENT'] || 0) + (statusCounts['HALF_DAY'] || 0),
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50',
    },
    {
      label: 'Nghỉ phép',
      value: statusCounts['LEAVE'] || 0,
      icon: Building2,
      color: 'text-blue-600 bg-blue-50',
    },
  ]

  const attendanceColumns: AppTableColumn<any>[] = [
    {
      title: 'Nhân viên',
      dataIndex: 'personId',
      key: 'personName',
      render: (_: any, row: any) => (
        <span className="font-medium text-neutral-800">{getPersonName(row)}</span>
      ),
    },
    {
      title: 'Ngày',
      dataIndex: 'attendanceDate',
      key: 'attendanceDate',
      render: (val: string) => (
        <span className="text-neutral-600">{val ? formatDate(val) : '—'}</span>
      ),
    },
    {
      title: 'Check-in',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      render: (val: string) => (
        <span className="font-mono text-xs">{formatTime(val)}</span>
      ),
    },
    {
      title: 'Check-out',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      render: (val: string) => (
        <span className="font-mono text-xs">{formatTime(val)}</span>
      ),
    },
    {
      title: 'Giờ làm',
      dataIndex: 'workMinutes',
      key: 'workMinutes',
      render: (val: number) => (
        <span className="text-neutral-700">{formatMinutes(val)}</span>
      ),
    },
    {
      title: 'Đi muộn',
      dataIndex: 'lateMinutes',
      key: 'lateMinutes',
      render: (val: number) => {
        if (!val || val <= 0) return <span className="text-green-600">—</span>
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
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${s.color}`}>
            {s.label}
          </span>
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

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Quản lý Chấm công</h1>
          <p className="text-sm text-neutral-500 mt-1">Theo dõi chấm công, đi muộn và nghỉ phép của nhân viên</p>
        </div>
        {activeTab === 'leaves' && (
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <CalendarDays className="w-4 h-4" /> Tạo đơn nghỉ phép
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${card.color}`}>
              <card.icon size={18} />
            </div>
            <div>
              <p className="text-xs text-neutral-500">{card.label}</p>
              <p className="text-xl font-bold text-neutral-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

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
              onChange={(v) => { setMonth(Number(v)); setPage(1) }}
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
              onChange={(v) => { setYear(Number(v)); setPage(1) }}
            />
          </div>
          <div className="w-56">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Nhân viên</label>
            <Select
              options={[{ value: '', label: 'Tất cả' }, ...personOptions]}
              value={personId}
              onChange={(v) => { setPersonId(v); setPage(1) }}
              showSearch
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Trạng thái</label>
            <Select
              options={[{ value: '', label: 'Tất cả' }, ...STATUS_OPTIONS]}
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1) }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'attendance'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Chấm công hàng ngày
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'leaves'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Đơn nghỉ phép
        </button>
      </div>

      {/* Attendance Table */}
      {activeTab === 'attendance' && (
        <AppTable
          data={dataList}
          columns={attendanceColumns}
          isLoading={isLoading}
          pageIndex={page}
          pageSize={size}
          totalElements={totalElements}
          onPageChange={handlePageChange}
          showSearch={true}
          searchPlaceholder="Tìm theo tên nhân viên..."
        />
      )}

      {/* Leave Requests */}
      {activeTab === 'leaves' && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  {['STT', 'Nhân viên', 'Lý do', 'Từ ngày', 'Đến ngày', 'Trạng thái', 'Thao tác'].map((h) => (
                    <th key={h} className="h-12 px-4 text-left align-middle font-medium text-neutral-500">
                      {h}
                    </th>
                  ))}
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
                      APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-700' },
                      REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-700' },
                      PENDING: { label: 'Chờ duyệt', color: 'bg-orange-100 text-orange-700' },
                    }
                    const s = statusMap[row.status || 'PENDING'] || statusMap['PENDING']
                    return (
                      <tr key={row.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                        <td className="p-4 text-neutral-500">{idx + 1}</td>
                        <td className="p-4 font-medium text-neutral-800">{row.personName || personMap[row.personId] || '—'}</td>
                        <td className="p-4 text-neutral-700 max-w-[200px] truncate">{row.reason}</td>
                        <td className="p-4 text-neutral-600">{formatDate(row.startDate)}</td>
                        <td className="p-4 text-neutral-600">{formatDate(row.endDate)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${s.color}`}>{s.label}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {(!row.status || row.status === 'PENDING') && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => approveReq.mutate(row.id)} title="Duyệt">
                                  <Check className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenReject(row.id)} title="Từ chối">
                                  <X className="w-4 h-4 text-red-600" />
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
      <AppModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Tạo đơn xin nghỉ phép">
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
      <AppModal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Từ chối đơn">
        <AppForm
          schema={leaveRejectSchema}
          defaultValues={{ reason: '' }}
          onSubmit={(v) => selectedLeaveId && rejectReq.mutate({ id: selectedLeaveId, data: v }, { onSuccess: () => setRejectModalOpen(false) })}
          fields={[{ name: 'reason', label: 'Lý do từ chối' }]}
          submitText="Xác nhận"
          isLoading={rejectReq.isPending}
        />
      </AppModal>
    </div>
  )
}
