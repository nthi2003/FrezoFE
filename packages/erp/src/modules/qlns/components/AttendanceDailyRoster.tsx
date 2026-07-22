// ============================================================
// FREZO ERP — Attendance Daily Roster (ATT-FE-01 / ATT-FE-02)
// Theo dõi chấm công toàn công ty theo ngày: filter + bảng + export.
// ============================================================

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarDays, MapPin, RefreshCw, AlertTriangle,
} from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { Button, EmptyState, ErrorState, Select } from '@frezo/ui'
import { departmentApi } from '@/modules/qtht/services/qthtApi'
import { usePersonsCombobox } from '../hooks/usePerson'
import { useAttendanceDaily } from '../hooks/useAttendance'
import type { AttendanceDailyRow } from '../services/attendanceApi'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatTime(time: string | null | undefined): string {
  if (!time) return '—'
  return String(time).substring(0, 5)
}

function formatCoord(lat?: number | null, lng?: number | null): string | null {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return null
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
}

const DAILY_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'OK', label: 'Đúng giờ (OK)' },
  { value: 'LATE', label: 'Đi muộn (LATE)' },
  { value: 'NOT_CHECKED_IN', label: 'Chưa check-in' },
  { value: 'CHECKED_IN', label: 'Đã check-in' },
]

const DAILY_STATUS_MAP: Record<string, { label: string; color: string }> = {
  OK: { label: 'Đúng giờ', color: 'bg-emerald-100 text-emerald-700' },
  PRESENT: { label: 'Có mặt', color: 'bg-emerald-100 text-emerald-700' },
  CHECKED_IN: { label: 'Đã check-in', color: 'bg-blue-100 text-blue-700' },
  LATE: { label: 'Đi muộn', color: 'bg-orange-100 text-orange-700' },
  NOT_CHECKED_IN: { label: 'Chưa check-in', color: 'bg-neutral-100 text-neutral-600' },
  ABSENT: { label: 'Vắng', color: 'bg-rose-100 text-rose-700' },
  HALF_DAY: { label: 'Nửa ngày', color: 'bg-yellow-100 text-yellow-700' },
  LEAVE: { label: 'Nghỉ phép', color: 'bg-blue-100 text-blue-700' },
  HOLIDAY: { label: 'Nghỉ lễ', color: 'bg-slate-100 text-slate-600' },
}

function resolveDisplayStatus(row: AttendanceDailyRow): string {
  // LNK03-08: lateMinutes / status LATE thắng CHECKED_OUT (đồng bộ BE resolveDisplayStatus)
  const lateMinutes = Number((row as { lateMinutes?: number }).lateMinutes ?? 0)
  if (lateMinutes > 0 || String(row.status || '').toUpperCase() === 'LATE') return 'LATE'
  if (String(row.displayStatus || '').toUpperCase() === 'LATE') return 'LATE'
  return String(row.displayStatus || row.status || 'NOT_CHECKED_IN').toUpperCase()
}

function GpsCell({ row }: { row: AttendanceDailyRow }) {
  const inOk = row.checkInGeofenceOk ?? row.checkInInsideGeofence
  const outOk = row.checkOutGeofenceOk ?? row.checkOutInsideGeofence
  const inCoords = formatCoord(row.checkInLatitude, row.checkInLongitude)
  const outCoords = formatCoord(row.checkOutLatitude, row.checkOutLongitude)

  if (!inCoords && !outCoords && inOk == null && outOk == null) {
    return <span className="text-neutral-400 text-xs">—</span>
  }

  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      {inCoords && (
        <span className="inline-flex items-center gap-1 text-xs text-neutral-700 font-mono" title="Check-in GPS">
          <MapPin size={12} className="text-emerald-600 shrink-0" />
          In: {inCoords}
        </span>
      )}
      {outCoords && (
        <span className="inline-flex items-center gap-1 text-xs text-neutral-700 font-mono" title="Check-out GPS">
          <MapPin size={12} className="text-rose-500 shrink-0" />
          Out: {outCoords}
        </span>
      )}
      <div className="flex flex-wrap gap-1">
        {inOk != null && (
          <span
            className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
              inOk ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            In {inOk ? 'trong vùng' : 'ngoài vùng'}
          </span>
        )}
        {outOk != null && (
          <span
            className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
              outOk ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            Out {outOk ? 'trong vùng' : 'ngoài vùng'}
          </span>
        )}
      </div>
    </div>
  )
}

export function AttendanceDailyRoster() {
  const [date, setDate] = useState(todayIso)
  const [departmentId, setDepartmentId] = useState('')
  const [status, setStatus] = useState('')
  const [personId, setPersonId] = useState('')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)

  const { options: personOptions, isLoading: personsLoading } = usePersonsCombobox()

  const { data: departmentList } = useQuery({
    queryKey: ['departments-combobox'],
    queryFn: () => departmentApi.getCombobox(),
  })

  const departmentOptions = useMemo(
    () =>
      Array.isArray(departmentList)
        ? departmentList.map((d: { value?: string; label?: string; id?: string; name?: string }) => ({
            value: String(d.value ?? d.id ?? ''),
            label: String(d.label ?? d.name ?? d.value ?? d.id ?? ''),
          }))
        : [],
    [departmentList],
  )

  const personMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const p of personOptions) {
      if (p.value) m[p.value] = p.label
    }
    return m
  }, [personOptions])

  const departmentMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const d of departmentOptions) {
      if (d.value) m[d.value] = d.label
    }
    return m
  }, [departmentOptions])

  /** personId → departmentName (từ combobox raw hoặc map departmentId). */
  const personDeptMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const p of personOptions) {
      if (!p.value) continue
      const raw = p.raw as {
        departmentName?: string
        departmentId?: string
        department?: { id?: string; name?: string }
      } | undefined
      const fromRaw =
        raw?.departmentName ||
        raw?.department?.name ||
        (raw?.departmentId && departmentMap[raw.departmentId]) ||
        (raw?.department?.id && departmentMap[raw.department.id])
      if (fromRaw) m[p.value] = String(fromRaw)
    }
    return m
  }, [personOptions, departmentMap])

  const filterParams = {
    date,
    ...(departmentId && { departmentId }),
    ...(status && { status }),
    ...(personId && { personId }),
    pageNumber: page,
    pageSize: size,
  }

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAttendanceDaily(filterParams)

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const source = data?.source ?? 'daily'

  const resolvePersonName = (row: AttendanceDailyRow): string => {
    if (row.personName) return row.personName
    const mapped = row.personId ? personMap[row.personId] : undefined
    if (mapped) return mapped
    // Đang load combobox → không flash UUID; thiếu map → "—"
    return '—'
  }

  const resolveDepartmentName = (row: AttendanceDailyRow): string => {
    if (row.departmentName) return row.departmentName
    if (row.departmentId && departmentMap[row.departmentId]) {
      return departmentMap[row.departmentId]
    }
    if (row.personId && personDeptMap[row.personId]) {
      return personDeptMap[row.personId]
    }
    return '—'
  }

  const columns: AppTableColumn<AttendanceDailyRow>[] = useMemo(
    () => [
      {
        title: 'Tên',
        dataIndex: 'personName',
        key: 'personName',
        render: (_, row) => (
          <span className="font-medium text-neutral-800">
            {personsLoading && !row.personName && !personMap[row.personId] ? (
              <span className="inline-block h-4 w-28 rounded bg-neutral-100 animate-pulse" />
            ) : (
              resolvePersonName(row)
            )}
          </span>
        ),
      },
      {
        title: 'Phòng',
        dataIndex: 'departmentName',
        key: 'departmentName',
        render: (_, row) => (
          <span className="text-neutral-600">{resolveDepartmentName(row)}</span>
        ),
      },
      {
        title: 'In',
        dataIndex: 'checkInTime',
        key: 'checkInTime',
        render: (val: string) => (
          <span className="font-mono text-xs">{formatTime(val)}</span>
        ),
      },
      {
        title: 'Out',
        dataIndex: 'checkOutTime',
        key: 'checkOutTime',
        render: (val: string) => (
          <span className="font-mono text-xs">{formatTime(val)}</span>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'displayStatus',
        key: 'displayStatus',
        render: (_, row) => {
          const key = resolveDisplayStatus(row)
          const s = DAILY_STATUS_MAP[key] || {
            label: key,
            color: 'bg-neutral-100 text-neutral-600',
          }
          return (
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${s.color}`}>
              {s.label}
            </span>
          )
        },
      },
      {
        title: 'GPS',
        key: 'gps',
        render: (_, row) => <GpsCell row={row} />,
      },
      {
        title: 'Ghi chú',
        dataIndex: 'note',
        key: 'note',
        render: (val: string) => (
          <span className="text-neutral-500 text-xs max-w-[160px] truncate block">
            {val || '—'}
          </span>
        ),
      },
    ],
    [personMap, departmentMap, personDeptMap, personsLoading],
  )

  const errMsg =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (error as Error)?.message ||
    'Không tải được roster ngày.'

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Ngày</label>
            <input
              type="date"
              className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm"
              value={date}
              onChange={(e) => {
                setDate(e.target.value || todayIso())
                setPage(1)
              }}
            />
          </div>
          <div className="w-48">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Phòng ban</label>
            <Select
              options={[{ value: '', label: 'Tất cả phòng ban' }, ...departmentOptions]}
              value={departmentId}
              onChange={(v) => {
                setDepartmentId(v)
                setPage(1)
              }}
              showSearch
              placeholder="Chọn phòng ban..."
            />
          </div>
          <div className="w-44">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Trạng thái</label>
            <Select
              options={DAILY_STATUS_OPTIONS}
              value={status}
              onChange={(v) => {
                setStatus(v)
                setPage(1)
              }}
            />
          </div>
          <div className="w-56">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">
              Nhân viên{' '}
              {personOptions.length > 0 && (
                <span className="text-neutral-400 font-normal">({personOptions.length})</span>
              )}
            </label>
            <Select
              options={[{ value: '', label: 'Tất cả nhân viên' }, ...personOptions]}
              value={personId}
              onChange={(v) => {
                setPersonId(v)
                setPage(1)
              }}
              showSearch
              placeholder={personsLoading ? 'Đang tải...' : 'Chọn nhân viên...'}
            />
          </div>
          <div className="flex-1" />
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Làm mới
          </Button>
        </div>
      </div>

      {source === 'fallback' && !isError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Endpoint <code className="text-xs">/qlns/attendance/daily</code> chưa sẵn sàng —
            đang dùng danh sách theo ngày (có thể thiếu tên / phòng ban / nhân viên chưa
            check-in).
          </span>
        </div>
      )}

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được roster ngày"
            message={errMsg}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : !isLoading && items.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={CalendarDays}
            title="Không có dữ liệu chấm công ngày này"
            description="Thử đổi ngày / phòng ban / trạng thái, hoặc đợi nhân viên check-in."
            action={{ label: 'Làm mới', onClick: () => refetch() }}
          />
        </div>
      ) : (
        <AppTable
          data={items}
          columns={columns}
          isLoading={isLoading}
          pageIndex={page}
          pageSize={size}
          totalElements={total}
          onPageChange={(p, s) => {
            setPage(p)
            setSize(s)
          }}
          onRefresh={() => refetch()}
          showSearch
          searchPlaceholder="Tìm theo tên nhân viên..."
        />
      )}
    </div>
  )
}
