import { useState, useMemo } from 'react'
import { Calculator, CheckCircle, HandCoins, PlusCircle, Plus } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { Button } from '@frezo/ui'
import { AppModal } from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { useQuery } from '@tanstack/react-query'
import { personApi } from '../services/personApi'
import {
  usePayrolls,
  useCalculateAllPayroll,
  useCalculatePersonPayroll,
  useBonusPayroll,
  useConfirmPayroll,
  usePayPayroll
} from '../hooks/usePayroll'
import { bonusSchema, createPayrollSchema } from '../constants/schema'

export function PayrollsPage() {
  const [bonusModalOpen, setBonusModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: rawData, isLoading, refetch } = usePayrolls()
  const calculateAll = useCalculateAllPayroll()
  const calculatePerson = useCalculatePersonPayroll()
  const bonusPayroll = useBonusPayroll()
  const confirmPayroll = useConfirmPayroll()
  const payPayroll = usePayPayroll()

  const { data: personData } = useQuery({
    queryKey: ['persons_combobox_payroll'],
    queryFn: () => personApi.getCombobox(),
  })

  const personOptions = useMemo(() =>
    Array.isArray(personData)
      ? (personData as any[]).map((p: any) => ({ value: p.value || p.id, label: p.label || p.name }))
      : [],
    [personData]
  )

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Tháng ${i + 1}`,
  }))

  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map(y => ({
    value: String(y),
    label: `Năm ${y}`,
  }))

  const dataList = rawData || []

  const handleCalculateAll = () => {
    if (confirm('Bắt đầu tính toán bảng lương cho tất cả nhân sự trong tháng này?')) {
      calculateAll.mutate({ month: new Date().getMonth() + 1, year: new Date().getFullYear() })
    }
  }

  const handleOpenCreate = () => {
    setCreateModalOpen(true)
  }

  const handleSubmitCreate = (values: { personId: string; month: string; year: string }) => {
    calculatePerson.mutate(
      {
        personId: values.personId,
        data: { month: parseInt(values.month), year: parseInt(values.year) },
      },
      { onSuccess: () => setCreateModalOpen(false) }
    )
  }

  const handleOpenBonus = (id: string) => {
    setSelectedId(id)
    setBonusModalOpen(true)
  }

  const handleSubmitBonus = (values: any) => {
    if (selectedId) {
      bonusPayroll.mutate({ id: selectedId, data: values }, { onSuccess: () => setBonusModalOpen(false) })
    }
  }

  const columns = [
    { title: 'Kỳ lương', dataIndex: 'period', filterType: 'text' as const },
    { title: 'Nhân viên', dataIndex: 'personName', filterType: 'text' as const },
    { 
      title: 'Lương cơ bản', 
      dataIndex: 'baseSalary',
      render: (val: any) => <span className="font-medium text-blue-600">{val?.toLocaleString()} VNĐ</span>
    },
    { 
      title: 'Thưởng/Phụ cấp', 
      dataIndex: 'bonusAmount',
      render: (val: any) => <span className="text-green-600">+{val?.toLocaleString()} VNĐ</span>
    },
    { 
      title: 'Tổng nhận', 
      dataIndex: 'totalNet',
      render: (val: any) => <span className="font-bold text-red-600">{val?.toLocaleString()} VNĐ</span>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      filterType: 'select' as const,
      filterOptions: [
        { value: 'DRAFT', label: 'Bản nháp' },
        { value: 'CONFIRMED', label: 'Đã chốt' },
        { value: 'PAID', label: 'Đã thanh toán' },
      ],
      render: (val: any) => {
        const statusMap: Record<string, { label: string, color: string }> = {
          'PAID': { label: 'Đã thanh toán', color: 'bg-green-100 text-green-700' },
          'CONFIRMED': { label: 'Đã chốt', color: 'bg-blue-100 text-blue-700' },
          'DRAFT': { label: 'Bản nháp', color: 'bg-orange-100 text-orange-700' },
        }
        const s = statusMap[val || 'DRAFT'] || statusMap['DRAFT']
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
          {(!row.status || row.status === 'DRAFT') && (
            <>
              <Button variant="ghost" size="icon" onClick={() => handleOpenBonus(row.id)} title="Thêm phụ cấp">
                <PlusCircle className="w-4 h-4 text-orange-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => confirmPayroll.mutate(row.id)} title="Chốt lương">
                <CheckCircle className="w-4 h-4 text-blue-600" />
              </Button>
            </>
          )}
          {row.status === 'CONFIRMED' && (
            <Button variant="ghost" size="icon" onClick={() => payPayroll.mutate(row.id)} title="Thanh toán">
              <HandCoins className="w-4 h-4 text-green-600" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Quản lý Bảng Lương</h1>
          <p className="text-sm text-neutral-500">Tính toán, chốt và thanh toán lương nhân viên</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleOpenCreate} className="gap-2" disabled={calculatePerson.isPending}>
            <Plus size={16} /> Thêm mới
          </Button>
          <Button onClick={handleCalculateAll} className="bg-primary-600 hover:bg-primary-700 text-white" disabled={calculateAll.isPending}>
            <Calculator className="w-4 h-4 mr-2" /> Tính lương toàn bộ
          </Button>
        </div>
      </div>

      <AppTable 
        data={dataList} 
        columns={columns} 
        isLoading={isLoading || calculateAll.isPending} 
        showSearch
        searchPlaceholder="Tìm kiếm bảng lương..."
        onRefresh={refetch}
      />

      <AppModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Thêm bảng lương nhân viên"
      >
        <AppForm
          schema={createPayrollSchema}
          defaultValues={{
            personId: '',
            month: String(new Date().getMonth() + 1),
            year: String(new Date().getFullYear()),
          }}
          onSubmit={handleSubmitCreate}
          fields={[
            { name: 'personId', label: 'Nhân viên', type: 'select', options: personOptions, placeholder: '-- Chọn nhân viên --' },
            { name: 'month', label: 'Tháng', type: 'select', options: monthOptions },
            { name: 'year', label: 'Năm', type: 'select', options: yearOptions },
          ]}
          submitText="Tính lương"
          onCancel={() => setCreateModalOpen(false)}
          isLoading={calculatePerson.isPending}
        />
      </AppModal>

      <AppModal
        isOpen={bonusModalOpen}
        onClose={() => setBonusModalOpen(false)}
        title="Thêm khoản Thưởng / Phụ cấp"
      >
        <AppForm
          schema={bonusSchema}
          defaultValues={{ bonusAmount: 0, reason: '' }}
          onSubmit={handleSubmitBonus}
          fields={[
            { name: 'bonusAmount', label: 'Số tiền (VNĐ)', type: 'number' },
            { name: 'reason', label: 'Lý do' },
          ]}
          submitText="Xác nhận"
          onCancel={() => setBonusModalOpen(false)}
          isLoading={bonusPayroll.isPending}
        />
      </AppModal>
    </div>
  )
}

