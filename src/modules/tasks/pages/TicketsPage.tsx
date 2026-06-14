import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@/components/ui/button'
import * as z from 'zod'
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket } from '../hooks/useTicketTag'
import { ticketSchema } from '../constants/schema'

export function TicketsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  
  const { data: rawData, isLoading } = useTickets()
  const createReq = useCreateTicket()
  const updateReq = useUpdateTicket()
  const deleteReq = useDeleteTicket()

  const dataList = rawData || []

  const handleSubmit = (values: any) => {
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: values }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  const columns = [
    { title: 'Tiêu đề', dataIndex: 'title' },
    { title: 'Nội dung', dataIndex: 'content' },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status',
      render: (val: any) => {
        const statusMap: Record<string, { label: string, color: string }> = {
          'RESOLVED': { label: 'Đã giải quyết', color: 'bg-green-100 text-green-700' },
          'IN_PROGRESS': { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-700' },
          'OPEN': { label: 'Mở', color: 'bg-neutral-100 text-neutral-700' },
        }
        const s = statusMap[val || 'OPEN'] || statusMap['OPEN']
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${s.color}`}>
            {s.label}
          </span>
        )
      }
    },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(row); setModalOpen(true) }}>
            <Pencil className="w-4 h-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { if(confirm('Xóa?')) deleteReq.mutate(row.id) }}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Quản lý Tickets</h1></div>
        <Button onClick={() => { setSelectedItem(null); setModalOpen(true) }} className="gap-2">
          <Plus className="w-4 h-4" /> Thêm mới
        </Button>
      </div>

      <AppTable data={dataList} columns={columns} isLoading={isLoading} />

      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Sửa Ticket' : 'Tạo Ticket'}>
        <AppForm
          schema={ticketSchema}
          defaultValues={selectedItem || { title: '', content: '' }}
          onSubmit={handleSubmit}
          fields={[{ name: 'title', label: 'Tiêu đề' }, { name: 'content', label: 'Nội dung' }, { name: 'status', label: 'Trạng thái' }]}
          submitText="Xác nhận"
          isLoading={createReq.isPending || updateReq.isPending}
        />
      </AppModal>
    </div>
  )
}

