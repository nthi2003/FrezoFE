import { useState } from 'react'
import { Check, X, CalendarClock, Plus } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@/components/ui/button'
import * as z from 'zod'
import {
  useLeaveRequests,
  useCreateLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest
} from '../hooks/useLeave'
import { leaveRequestSchema, leaveRejectSchema } from '../constants/schema'

export function LeavesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: rawData, isLoading } = useLeaveRequests()
  const createReq = useCreateLeaveRequest()
  const approveReq = useApproveLeaveRequest()
  const rejectReq = useRejectLeaveRequest()

  const dataList = rawData || []

  const handleOpenReject = (id: string) => {
    setSelectedId(id)
    setRejectModalOpen(true)
  }

  const columns = [
    { title: 'Nhân viên', dataIndex: 'personName', filterType: 'text' },
    { title: 'Lý do', dataIndex: 'reason', filterType: 'text' },
    { title: 'Từ ngày', dataIndex: 'startDate' },
    { title: 'Đến ngày', dataIndex: 'endDate' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      filterType: 'select',
      filterOptions: [
        { value: 'PENDING', label: 'Chờ duyệt' },
        { value: 'APPROVED', label: 'Đã duyệt' },
        { value: 'REJECTED', label: 'Từ chối' },
      ],
      render: (val: any) => {
        const statusMap: Record<string, { label: string, color: string }> = {
          'APPROVED': { label: 'Đã duyệt', color: 'bg-green-100 text-green-700' },
          'REJECTED': { label: 'Từ chối', color: 'bg-red-100 text-red-700' },
          'PENDING': { label: 'Chờ duyệt', color: 'bg-orange-100 text-orange-700' },
        }
        const s = statusMap[val || 'PENDING'] || statusMap['PENDING']
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${s.color}`}>
            {s.label}
          </span>
        )
      },
    },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      render: (_: any, row: any) => (
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
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Quản lý Nghỉ phép</h1>
          <p className="text-sm text-neutral-500">Duyệt đơn và theo dõi ngày nghỉ của nhân viên</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Thêm mới
        </Button>
      </div>

      <AppTable 
        data={dataList} 
        columns={columns as any} 
        isLoading={isLoading} 
        showSearch={true}
        searchPlaceholder="Tìm theo tên nhân viên..."
      />

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

      <AppModal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Từ chối đơn">
        <AppForm
          schema={leaveRejectSchema}
          defaultValues={{ reason: '' }}
          onSubmit={(v) => selectedId && rejectReq.mutate({ id: selectedId, data: v }, { onSuccess: () => setRejectModalOpen(false) })}
          fields={[{ name: 'reason', label: 'Lý do từ chối' }]}
          submitText="Xác nhận"
          isLoading={rejectReq.isPending}
        />
      </AppModal>
    </div>
  )
}

