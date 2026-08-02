import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Eye, AlertTriangle, RefreshCw } from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  AppModal,
  ConfirmDialog,
  Button,
  Switch,
  PageHeader,
  PageGuideButton,
  FlexibleColumnLayout,
  IconActionButton,
  type PageGuideConfig,
} from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { PersonDetailDrawer } from '../components/PersonDetailDrawer'
import { StatusPipelineStepper } from '../../warehouse/components/StatusPipelineStepper'
import { OFFBOARDING_PIPELINE } from '../constants/hrWorkflow'
import { OFFBOARDING_GUIDE } from '../constants/offboarding.guide'

const PERSONS_GUIDE: PageGuideConfig = {
  title: 'Quản lý Nhân viên (Person)',
  subtitle:
    'Hồ sơ nhân sự — nguồn dữ liệu chuẩn cho user, chấm công, hợp đồng và bảng lương.',
  sections: [
    {
      heading: 'Quy trình chuẩn',
      type: 'steps',
      steps: [
        {
          title: 'Tạo hồ sơ Person',
          description:
            'Đầy đủ: họ tên, ngày sinh, giới tính, CCCD, email, phone, phòng ban, chức danh, ngày vào làm. Person tồn tại độc lập với tài khoản user.',
        },
        {
          title: 'Cấp tài khoản User (QTHT — không tự tạo từ HRM)',
          description:
            'Policy LNK-06: Hire/Onboarding không tạo User. Nếu NV cần login ERP → QTHT → Người dùng → thêm mới → liên kết Person + gán Role. Không có bước «tạo sau» mơ hồ trên checklist onboarding.',
        },
        {
          title: 'Ký hợp đồng & tính lương',
          description:
            'Sang "Hợp đồng lao động" tạo record cho person. Bảng lương và chấm công đều tham chiếu Person ID.',
        },
      ],
    },
    {
      heading: 'Mẹo dữ liệu',
      type: 'tips',
      tips: [
        'Mã nhân viên (employee code) nên có logic: HR001, HR002 hoặc theo mã phòng ban — thuận tiện tra cứu manual.',
        'Không xóa cứng Person có hợp đồng / bảng lương — chỉ deactivate. Xóa gây mất tham chiếu ở module Kế toán.',
        'Khi nhân viên nghỉ việc: cập nhật ngày nghỉ + status "Không hoạt động", đồng thời khóa user trong "Người dùng".',
      ],
    },
  ],
}
import { organizationApi, departmentApi } from '@/modules/qtht/services/qthtApi'
import { categoryApi } from '@/modules/qtht/services/categoryApi'
import {
  usePersons,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson,
  useActivatePerson,
  useDeactivatePerson
} from '../hooks/usePerson'
import { personFormSchema, type PersonFormValues } from '../constants/schema'

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
]

const defaultFormValues = {
  code: '',
  name: '',
  email: '',
  phone: '',
  identityNumber: '',
  gender: '',
  birthDate: '',
  address: '',
  orgId: '',
  departmentId: '',
  jobTitle: '',
  activated: true,
}

export function PersonsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('selected') || ''

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null)
  const [detailPerson, setDetailPerson] = useState<any | null>(null)
  const [confirm, setConfirm] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: 'danger' | 'warning'
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  // Pagination & Filter States
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [filters, setFilters] = useState<Record<string, any>>({})

  const hasActiveFilters = Object.keys(filters).some(
    (k) => filters[k] !== undefined && filters[k] !== '' && filters[k] !== 'ALL',
  )
  const clearFilters = () => {
    setFilters({})
    setPage(1)
  }

  const queryClient = useQueryClient()

  const openDetail = useCallback(
    (person: any) => {
      if (!person?.id) return
      setDetailPerson(person)
      const next = new URLSearchParams(searchParams)
      next.set('selected', person.id)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const closeDetail = useCallback(() => {
    setDetailPerson(null)
    if (!searchParams.get('selected')) return
    const next = new URLSearchParams(searchParams)
    next.delete('selected')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  // Build filter query params
  const filterParams = {
    pageNumber: page,
    pageSize: size,
    ...filters
  }

  const { data: rawData, isLoading } = usePersons(filterParams)
  const { data: orgList } = useQuery({
    queryKey: ['organizations-combobox'],
    queryFn: () => organizationApi.getCombobox(),
  })
  const { data: departmentList } = useQuery({
    queryKey: ['departments-combobox'],
    queryFn: () => departmentApi.getCombobox(),
  })
  const {
    data: chucDanhList,
    isError: chucDanhError,
    isFetching: chucDanhFetching,
    refetch: refetchChucDanh,
  } = useQuery({
    queryKey: ['categories', 'ChucDanh'],
    queryFn: () =>
      categoryApi.getAll({ groupCode: 'ChucDanh', pageNumber: 1, pageSize: 200, active: true }),
    select: (res: any) => res?.data?.items ?? [],
  })
  const createPerson = useCreatePerson()
  const updatePerson = useUpdatePerson()
  const deletePerson = useDeletePerson()
  const activatePerson = useActivatePerson()
  const deactivatePerson = useDeactivatePerson()

  const orgOptions = useMemo(() => Array.isArray(orgList) ? orgList.map((o: any) => ({ value: o.value, label: o.label })) : [], [orgList])
  const departmentOptions = useMemo(() => Array.isArray(departmentList) ? departmentList.map((d: any) => ({ value: d.value, label: d.label })) : [], [departmentList])
  const chucDanhOptions = useMemo(
    () =>
      Array.isArray(chucDanhList)
        ? chucDanhList
            .filter((item: any) => item.active !== false && item.isDeleted !== true)
            .map((item: any) => ({ value: item.name, label: item.name }))
        : [],
    [chucDanhList],
  )
  const chucDanhEmpty = !chucDanhError && chucDanhOptions.length === 0
  const jobTitleDescription = chucDanhError
    ? undefined
    : chucDanhEmpty
      ? 'Chưa có chức danh — thêm tại Danh mục (Chức danh). Có thể lưu nhân viên mà không chọn chức danh.'
      : undefined
  
  const dataList = rawData?.items || []
  const totalElements = rawData?.total || 0

  // FR-UX-06: deep-link ?selected= → mở cột detail
  useEffect(() => {
    if (!selectedId) {
      if (detailPerson) setDetailPerson(null)
      return
    }
    const fromList = dataList.find((p: any) => p.id === selectedId)
    if (fromList) {
      setDetailPerson(fromList)
      return
    }
    if (detailPerson?.id === selectedId) return
    // Giữ selection nếu đã có; không gọi API riêng (pilot list page)
  }, [selectedId, dataList]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (newPage: number, newSize: number) => {
    setPage(newPage)
    setSize(newSize)
  }

  const handleOpenCreate = () => {
    setSelectedPerson(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (person: any) => {
    setSelectedPerson(person)
    setModalOpen(true)
  }

  const handleDelete = (person: any) => {
    setConfirm({
      isOpen: true,
      title: 'Xóa nhân viên',
      message: `Bạn có chắc chắn muốn xóa nhân viên "${person.name}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
      onConfirm: () => { deletePerson.mutate(person.id); setConfirm(c => ({ ...c, isOpen: false })) },
    })
  }

  const handleToggleActive = (person: any) => {
    const newActivated = !person.activated
    if (newActivated) {
      activatePerson.mutate(person.id, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['persons'] })
      })
    } else {
      deactivatePerson.mutate(person.id, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['persons'] })
      })
    }
  }

  const onSubmit = (values: PersonFormValues) => {
    if (selectedPerson?.id) {
      updatePerson.mutate(
        { id: selectedPerson.id, data: values },
        { onSuccess: () => setModalOpen(false) }
      )
    } else {
      createPerson.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  const isPending = createPerson.isPending || updatePerson.isPending

  const columns: AppTableColumn<any>[] = [
    { title: 'Mã NV', dataIndex: 'code', key: 'code',
      render: (val: any) => <span className="font-mono text-xs font-semibold text-neutral-600">{val}</span> },
    { title: 'Họ tên', dataIndex: 'name', key: 'name',
      render: (val: any) => <span className="font-medium text-neutral-800">{val}</span> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Tổ chức',
      dataIndex: 'orgName',
      key: 'orgName',
      filterType: 'select',
      filterKey: 'orgId',
      filterOptions: orgOptions,
    },
    {
      title: 'Phòng ban',
      dataIndex: 'departmentName',
      key: 'departmentName',
      filterType: 'select',
      filterKey: 'departmentId',
      filterOptions: departmentOptions,
    },
    {
      title: 'Chức danh',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      filterType: 'select',
      filterOptions: chucDanhOptions,
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      filterType: 'select',
      filterOptions: GENDER_OPTIONS,
      render: (val: string) => GENDER_OPTIONS.find(opt => opt.value === val)?.label || val
    },
    {
      title: 'Trạng thái', dataIndex: 'activated', key: 'activated',
      filterType: 'boolean',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={!!row.activated}
            onChange={() => handleToggleActive(row)}
          />
          <span className={`text-xs font-medium ${row.activated ? 'text-success' : 'text-neutral-500'}`}>
            {row.activated ? 'Hoạt động' : 'Không hoạt động'}
          </span>
        </div>
      ),
    },
    {
      title: 'Thao tác', dataIndex: 'id', key: 'actions',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1">
          <IconActionButton
            tooltip="Xem chi tiết"
            tone="blue"
            className={selectedId === row.id ? 'text-primary-700 bg-primary-50' : undefined}
            onClick={() => openDetail(row)}
          >
            <Eye size={15} />
          </IconActionButton>
          <IconActionButton tooltip="Sửa" tone="primary" onClick={() => handleOpenEdit(row)}>
            <Edit size={15} />
          </IconActionButton>
          <IconActionButton tooltip="Xóa" tone="red" onClick={() => handleDelete(row)}>
            <Trash2 size={15} />
          </IconActionButton>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in p-6">
      <PageHeader
        title="Quản lý Nhân viên"
        description="Hồ sơ nhân sự — nguồn dữ liệu chuẩn cho tài khoản, chấm công, hợp đồng và bảng lương."
        actions={
          <>
            <PageGuideButton guide={PERSONS_GUIDE} />
            <PageGuideButton guide={OFFBOARDING_GUIDE} label="Nghỉ việc" />
            <Button
              onClick={handleOpenCreate}
              className="gap-2 bg-primary-600 hover:bg-primary-700 text-white h-9"
            >
              <Plus size={16} /> Thêm mới
            </Button>
          </>
        }
      />

      <StatusPipelineStepper
        steps={OFFBOARDING_PIPELINE}
        currentIndex={0}
        nextCta={{ label: 'Bảng lương quyết toán', href: '/qlns/payroll?tab=payrolls' }}
      />

      <FilterBar
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
        countLabel={`${totalElements} nhân viên${hasActiveFilters ? ' (đã lọc)' : ''}`}
      />

      {/* FR-UX-06 Flexible Column — desktop 40|60; &lt;md 1 cột */}
      <FlexibleColumnLayout
        hasSelection={!!detailPerson}
        onCloseDetail={closeDetail}
        detailTitle={
          detailPerson ? (
            <span className="inline-flex items-center gap-2">
              {detailPerson.name}
              <span className="font-mono text-xs text-neutral-500">{detailPerson.code}</span>
            </span>
          ) : (
            'Chi tiết'
          )
        }
        master={
          <AppTable
            data={dataList}
            columns={columns}
            isLoading={isLoading}
            density="compact"
            pageIndex={page}
            pageSize={size}
            pageSizeOptions={[10, 20, 50, 100]}
            totalElements={totalElements}
            onPageChange={handlePageChange}
            showSearch={true}
            searchPlaceholder="Tìm theo tên, mã nhân viên..."
            onFilterChange={(nextFilters) => {
              setFilters(nextFilters)
              setPage(1)
            }}
            showDensityToggle
          />
        }
        detail={
          detailPerson ? (
            <PersonDetailDrawer
              isOpen
              variant="panel"
              person={detailPerson}
              onClose={closeDetail}
              onEdit={(p) => {
                closeDetail()
                handleOpenEdit(p)
              }}
              onToggleActive={(p) => {
                handleToggleActive(p)
              }}
            />
          ) : null
        }
      />

      {/* Modal Tạo / Sửa */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedPerson ? 'Cập nhật thông tin nhân viên' : 'Thêm nhân viên mới'}
        description={selectedPerson ? 'Chỉnh sửa thông tin hồ sơ nhân sự.' : 'Điền thông tin để tạo hồ sơ nhân viên mới.'}
        maxWidth="5xl"
      >
        {chucDanhError && (
          <div className="mb-4 flex items-start gap-3 rounded-md border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-neutral-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" />
            <div className="flex-1 space-y-1">
              <p className="font-medium text-danger">Không tải được danh mục chức danh</p>
              <p className="text-xs text-neutral-500">
                Kiểm tra mạng hoặc quyền xem danh mục, rồi thử lại. Không dùng option giả.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-1.5 shrink-0"
              disabled={chucDanhFetching}
              onClick={() => void refetchChucDanh()}
            >
              <RefreshCw size={14} className={chucDanhFetching ? 'animate-spin' : undefined} />
              Thử lại
            </Button>
          </div>
        )}
        <AppForm
          schema={personFormSchema}
          defaultValues={selectedPerson ? selectedPerson : defaultFormValues}
          onSubmit={onSubmit}
          onCancel={() => setModalOpen(false)}
          isLoading={isPending}
          fields={[
            { name: 'code', label: 'Mã nhân viên', required: true, placeholder: 'NV001' },
            { name: 'name', label: 'Họ và tên', required: true, placeholder: 'Nguyễn Văn A' },
            { name: 'gender', label: 'Giới tính', type: 'radio', options: GENDER_OPTIONS },
            { name: 'email', label: 'Email', placeholder: 'example@frezo.com' },
            { name: 'phone', label: 'Số điện thoại', placeholder: '0901 234 567' },
            { name: 'identityNumber', label: 'CCCD / CMND', placeholder: '012345678901' },
            { name: 'birthDate', label: 'Ngày sinh', type: 'date' },
            {
              name: 'jobTitle',
              label: 'Chức danh',
              type: 'select',
              options: chucDanhError ? [] : chucDanhOptions,
              placeholder: chucDanhEmpty ? 'Chưa có chức danh' : '-- Chọn chức danh --',
              description: jobTitleDescription,
            },
            { name: 'orgId', label: 'Tổ chức', type: 'select', options: orgOptions },
            { name: 'departmentId', label: 'Phòng ban', type: 'select', options: departmentOptions },
            { name: 'activated', label: 'Trạng thái', type: 'switch' },
            { name: 'address', label: 'Địa chỉ', placeholder: 'Số nhà, đường, quận, thành phố...', colSpan: 2 },
          ]}
        />
      </AppModal>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        onClose={() => setConfirm(c => ({ ...c, isOpen: false }))}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant || 'danger'}
        confirmText="Xác nhận"
        cancelText="Hủy"
      />

    </div>
  )
}
