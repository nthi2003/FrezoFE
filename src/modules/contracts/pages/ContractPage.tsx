import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileX2, History, CheckCircle, Plus } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { Button } from '@/components/ui/button'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractApi } from '@/modules/qlns/services/contractApi'
import { personApi } from '@/modules/qlns/services/personApi'
import { contractRejectSchema } from '@/modules/qlns/constants/schema'
import { toast } from 'sonner'

export function ContractPage() {
  const navigate = useNavigate()
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: personsData, isLoading } = useQuery({
    queryKey: ['persons_for_contracts'],
    queryFn: () => personApi.getAll(),
    select: (res: any) => res?.data ?? [],
  })

  const contracts = Array.isArray(personsData)
    ? personsData.flatMap((p: any) => p.contracts?.map((c: any) => ({ ...c, personName: p.fullName })) || [])
    : []

  const rejectContract = useMutation({
    mutationFn: ({ id, data }: any) => contractApi.reject(id, data),
    onSuccess: () => {
      toast.success('Đã từ chối Hợp đồng')
      setRejectModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['persons_for_contracts'] })
    }
  })

  const approveContract = useMutation({
    mutationFn: ({ id }: any) => new Promise((resolve) => setTimeout(() => resolve('OK'), 500)),
    onSuccess: () => {
      toast.success('Đã phê duyệt Hợp đồng')
      queryClient.invalidateQueries({ queryKey: ['persons_for_contracts'] })
    }
  })

  const handleOpenReject = (id: string) => {
    setSelectedId(id)
    setRejectModalOpen(true)
  }

  const handleSubmitReject = (values: any) => {
    if (selectedId) rejectContract.mutate({ id: selectedId, data: values })
  }

  const columns = [
    { title: 'Mã HĐ', dataIndex: 'code', filterType: 'text' },
    { title: 'Nhân sự', dataIndex: 'personName', filterType: 'text' },
    { title: 'Loại HĐ', dataIndex: 'type', filterType: 'text' },
    { title: 'Ngày bắt đầu', dataIndex: 'startDate' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      filterType: 'select',
      filterOptions: [
        { value: 'PENDING', label: 'Chờ xử lý' },
        { value: 'APPROVED', label: 'Đã duyệt' },
        { value: 'REJECTED', label: 'Từ chối' },
      ],
      render: (val: any) => {
        const statusMap: Record<string, { label: string, color: string }> = {
          'APPROVED': { label: 'Đã duyệt', color: 'bg-green-100 text-green-700' },
          'REJECTED': { label: 'Từ chối', color: 'bg-red-100 text-red-700' },
          'PENDING': { label: 'Chờ xử lý', color: 'bg-orange-100 text-orange-700' },
        }
        const s = statusMap[val || 'PENDING'] || statusMap['PENDING']
        return <span className={`px-2 py-1 text-xs rounded-full ${s.color}`}>{s.label}</span>
      },
    },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" title="Xem lịch sử/version">
            <History className="w-4 h-4 text-blue-600" />
          </Button>
          {row.status === 'PENDING' && (
            <>
              <Button variant="ghost" size="icon" onClick={() => approveContract.mutate({ id: row.id })} title="Duyệt Hợp đồng">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleOpenReject(row.id)} title="Từ chối Hợp đồng">
                <FileX2 className="w-4 h-4 text-red-600" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Quản lý Hợp đồng</h1>
          <p className="text-sm text-neutral-500">Phê duyệt và theo dõi các hợp đồng lao động</p>
        </div>
        <Button onClick={() => navigate('/qlns/contract/create')} className="gap-2">
          <Plus size={16} /> Thêm mới
        </Button>
      </div>

      <AppTable
        data={contracts}
        columns={columns as any}
        isLoading={isLoading}
        showSearch={true}
        searchPlaceholder="Tìm theo mã HĐ, nhân sự..."
      />

      <AppModal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Từ chối Hợp đồng">
        <AppForm
          schema={contractRejectSchema}
          defaultValues={{ reason: '' }}
          onSubmit={handleSubmitReject}
          fields={[{ name: 'reason', label: 'Lý do từ chối', placeholder: 'Nhập lý do...' }]}
          submitText="Từ chối"
          isLoading={rejectContract.isPending}
        />
      </AppModal>
    </div>
  )
}
