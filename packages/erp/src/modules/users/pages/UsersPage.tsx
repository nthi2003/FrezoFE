// ============================================================
// FREZO ERP — Users Page
// ============================================================

import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, KeyRound, Lock, Unlock, Eye, EyeOff, Search, Users } from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  AppModal,
  ConfirmDialog,
  Button,
  Input,
  Select,
  MultiSelect,
  FormField,
  PageHeader,
  PageGuideButton,
  EmptyState,
  ErrorState,
  RowActions,
  StatusBadge,
  type PageGuideConfig,
} from '@frezo/ui'
import { unwrapList } from '@frezo/utils'
import { resolveUserStatus, USER_STATUS_CONFIG, USER_STATUS_FILTER_OPTIONS } from '../constants/userStatus'

const USERS_GUIDE: PageGuideConfig = {
  title: 'Quản lý Người dùng',
  subtitle:
    'Cấp hoặc thu hồi tài khoản đăng nhập, gắn với hồ sơ nhân sự và chọn vai trò làm việc trên hệ thống.',
  sections: [
    {
      heading: 'Cách thêm người dùng mới',
      type: 'steps',
      steps: [
        {
          title: 'Bấm "Thêm mới"',
          description:
            'Điền tên đăng nhập (không dấu, không trùng với người khác) và mật khẩu tạm thời. Người dùng sẽ đổi mật khẩu khi đăng nhập lần đầu.',
        },
        {
          title: 'Liên kết với nhân sự',
          description:
            'Chọn đúng nhân viên đã có trong danh mục Nhân sự để dùng chung họ tên, phòng ban, chức danh. Email lấy từ hồ sơ nhân sự nếu có. Nếu chưa có hồ sơ, nhờ bộ phận Nhân sự tạo trước rồi quay lại gắn.',
        },
        {
          title: 'Gán vai trò',
          description:
            'Chọn một hoặc nhiều vai trò (Quản trị viên / Quản lý / Nhân viên). Vai trò quyết định menu và chức năng người đó được dùng. Có thể chỉnh lại sau tại tab "Vai trò".',
        },
      ],
    },
    {
      heading: 'Vòng đời tài khoản',
      type: 'tips',
      tips: [
        'Khi nhân viên nghỉ tạm hoặc nghi vấn bảo mật: dùng "Khóa" thay vì xóa — tài khoản dừng đăng nhập nhưng vẫn giữ lịch sử thao tác.',
        'Quên mật khẩu: bấm "Đặt lại mật khẩu" — hệ thống tạo mật khẩu mới và gửi về email đã đăng ký.',
        'Không xóa tài khoản đang gắn hợp đồng hoặc lịch sử làm việc quan trọng. Hệ thống sẽ từ chối nếu còn dữ liệu liên quan — hãy khóa thay vì xóa.',
      ],
    },
    {
      heading: 'Lưu ý bảo mật',
      type: 'notes',
      notes: (
        <>
          Vai trò <strong>Quản trị viên</strong> / <strong>Quản trị viên hệ thống</strong> mở toàn bộ menu,
          gồm cả phần Bảo mật và Nhật ký hoạt động. Chỉ cấp cho người được giao vận hành hệ thống.
        </>
      ),
    },
  ],
}

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useUsers, useCreateUser, useUpdateUser, useActiveUser, useLockUser, useResetPassword, useAssignRole } from '../hooks/useUsers'
import type { RegisterRequest, UserDTO } from '../services/userApi'
import { userApi } from '../services/userApi'
import { userFormSchema, type UserFormValues } from '../constants/schema'
import { personApi } from '@/modules/qlns/services/personApi'
import { useRoles } from '@/modules/roles/hooks/useRoles'

export function UsersPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null)
  const [dataPersonId, setDataPersonId] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirm, setConfirm] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | '1' | '0'>('all')

  const { data: usersData, isLoading, isError, isFetching, refetch } = useUsers(1, 1000, '')
  const { data: personOptions } = useQuery({
    queryKey: ['persons-combobox'],
    queryFn: () => personApi.getCombobox(),
    select: unwrapList,
  })
  const { data: rolesData } = useRoles()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const activeUser = useActiveUser()
  const lockUser = useLockUser()
  const resetPassword = useResetPassword()
  const assignRole = useAssignRole()

  const { register, handleSubmit, reset, setValue, setError, setFocus, watch, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { username: '', password: '', email: '', fullname: '', dataAction: 1, personId: '', roleIds: [], orgId: '' },
  })
  const selectedRoleIds = watch('roleIds') || []

  const allUsers = usersData?.items || []

  const filteredUsers = useMemo(() => {
    let list = allUsers
    if (statusFilter !== 'all') {
      list = list.filter((u) => String(u.status) === statusFilter)
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim()
      list = list.filter(
        (u) =>
          (u.username || '').toLowerCase().includes(q) ||
          ((u as any).name || u.fullName || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.phone || '').includes(q),
      )
    }
    return list
  }, [allUsers, searchText, statusFilter])

  const hasActiveFilters = Boolean(searchText.trim()) || statusFilter !== 'all'
  const isFilteredEmpty = !isLoading && !isError && allUsers.length > 0 && filteredUsers.length === 0
  const isFullyEmpty = !isLoading && !isError && allUsers.length === 0

  const closeModal = () => {
    setIsModalOpen(false)
    setShowPassword(false)
  }

  const handleOpenCreate = () => {
    setIsEditMode(false)
    setSelectedUser(null)
    setDataPersonId('')
    setShowPassword(false)
    reset()
    setIsModalOpen(true)
  }

  const handleOpenEdit = (user: UserDTO) => {
    setIsEditMode(true)
    setSelectedUser(user)
    setShowPassword(false)
    setValue('username', user.username)
    setValue('email', user.email || '')
    setValue('fullname', user.fullName || '')
    setValue('password', '')
    setValue('dataAction', 1)
    setValue('personId', user.personId || '')
    setDataPersonId(user.personId || '')
    setValue('orgId', user.orgId || '')
    setIsModalOpen(true)
    if (user.username) {
      userApi.getUserRoles(user.username).then((roles: any) => {
        setValue('roleIds', Array.isArray(roles) ? roles : [])
      }).catch(() => {})
    }
  }

  const onSubmit = (data: UserFormValues) => {
    if (isEditMode && selectedUser) {
      const payload: Partial<UserDTO> = {
        username: data.username,
        email: data.email,
        fullName: data.fullname,
        personId: data.personId || undefined,
      }
      updateUser.mutate({ id: selectedUser.id!, data: payload }, {
        onSuccess: () => {
          if (selectedUser.username) {
            const currentRoles = data.roleIds || []
            userApi.getUserRoles(selectedUser.username).then((existingRoles: any) => {
              const existing = Array.isArray(existingRoles) ? existingRoles : []
              const toAdd = currentRoles.filter(r => !existing.includes(r))
              toAdd.forEach(roleCode => {
                assignRole.mutate({ username: selectedUser.username!, roleCode, appCode: 'QTHT' })
              })
            }).catch(() => {})
          }
          closeModal()
          reset()
        },
      })
    } else {
      if (!data.password || data.password.length < 6) {
        setError('password', { type: 'manual', message: 'Mật khẩu tối thiểu 6 ký tự' })
        setFocus('password')
        return
      }
      // Email không có trên form create — chỉ gửi nếu đã lấy được từ person liên kết
      const payload: RegisterRequest = {
        username: data.username,
        password: data.password,
        dataAction: data.dataAction,
        personId: data.personId || undefined,
        ...(data.email ? { email: data.email } : {}),
        fullname: data.fullname || undefined,
        roleIds: data.roleIds?.length ? data.roleIds : undefined,
        orgId: data.orgId || undefined,
      }
      createUser.mutate(payload, {
        onSuccess: () => { closeModal(); reset() },
      })
    }
  }

  const onInvalid = (errs: typeof errors) => {
    const order: (keyof UserFormValues)[] = ['username', 'password', 'personId', 'fullname', 'email', 'roleIds']
    const first = order.find((key) => errs[key])
    if (first === 'personId' || first === 'fullname') {
      document.getElementById('user-person')?.focus()
      return
    }
    if (first) setFocus(first)
  }

  const columns: AppTableColumn<UserDTO>[] = [
    { key: 'username', title: 'Tên đăng nhập', dataIndex: 'username', filterType: 'text' },
    { key: 'fullName', title: 'Họ và tên', dataIndex: 'fullName', filterType: 'text',
      render: (_, record) => (record as any).name || record.fullName || '', },
    { key: 'email', title: 'Email', dataIndex: 'email', filterType: 'text' },
    { key: 'phone', title: 'Số điện thoại', dataIndex: 'phone', filterType: 'text' },
    {
      key: 'status', title: 'Trạng thái', dataIndex: 'status', align: 'center',
      filterType: 'select',
      filterOptions: [
        { value: '1', label: USER_STATUS_CONFIG[1].label },
        { value: '0', label: USER_STATUS_CONFIG[0].label },
      ],
      render: (_, record) => {
        const cfg = resolveUserStatus(record.status)
        return <StatusBadge label={cfg.label} color={cfg.color} />
      },
    },
    {
      key: 'actions', title: 'Thao tác', align: 'center', width: 140,
      render: (_, record) => (
        <RowActions
          align="center"
          actions={[
            { kind: 'edit', onClick: () => handleOpenEdit(record) },
            {
              key: 'reset-password',
              icon: KeyRound,
              tooltip: 'Reset mật khẩu',
              tone: 'amber',
              onClick: () => setConfirm({
                isOpen: true, title: 'Reset mật khẩu',
                message: 'Bạn có chắc chắn muốn reset mật khẩu tài khoản này về mặc định?',
                onConfirm: () => { resetPassword.mutate(record.id!); setConfirm(c => ({ ...c, isOpen: false })) },
              }),
            },
            {
              key: 'lock',
              icon: Lock,
              tooltip: 'Khóa tài khoản',
              tone: 'rose',
              hidden: record.status !== 1,
              onClick: () => setConfirm({
                isOpen: true, title: 'Khóa tài khoản',
                message: 'Bạn có chắc chắn muốn khóa tài khoản này?',
                onConfirm: () => { lockUser.mutate(record.id!); setConfirm(c => ({ ...c, isOpen: false })) },
              }),
            },
            {
              key: 'unlock',
              icon: Unlock,
              tooltip: 'Mở khóa tài khoản',
              tone: 'emerald',
              hidden: record.status === 1,
              onClick: () => setConfirm({
                isOpen: true, title: 'Mở khóa tài khoản',
                message: 'Bạn có chắc chắn muốn mở khóa tài khoản này?',
                onConfirm: () => { activeUser.mutate(record.id!); setConfirm(c => ({ ...c, isOpen: false })) },
              }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in p-6">
      <PageHeader
        title="Quản lý Người dùng"
        description="Danh sách tài khoản truy cập hệ thống — cấp, khóa, phân quyền, reset mật khẩu."
        actions={
          <>
            <PageGuideButton guide={USERS_GUIDE} />
            <Button
              onClick={handleOpenCreate}
              className="gap-2 bg-primary-600 hover:bg-primary-700 text-white h-9"
            >
              <Plus size={16} /> Thêm mới
            </Button>
          </>
        }
      />

      <FilterBar
        hasActiveFilters={hasActiveFilters}
        onClear={() => {
          setSearchText('')
          setStatusFilter('all')
        }}
        countLabel={`${filteredUsers.length} người dùng${hasActiveFilters ? ' (đã lọc)' : ''}`}
      >
        <div className="min-w-[140px]">
          <Select
            options={USER_STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as 'all' | '1' | '0')}
            placeholder="Trạng thái"
            aria-label="Lọc trạng thái"
            showSearch={false}
          />
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm theo tên đăng nhập, họ tên, email…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Tìm người dùng"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được người dùng"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Users}
            title={isFilteredEmpty ? 'Không có người dùng khớp bộ lọc' : 'Chưa có người dùng nào'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi từ khoá.'
                : 'Thêm tài khoản đầu tiên để bắt đầu.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: () => { setSearchText(''); setStatusFilter('all') } }
                : { label: 'Thêm mới', onClick: handleOpenCreate }
            }
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filteredUsers}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          pageSize={10}
          pageSizeOptions={[10]}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
          }}
        />
      )}

      {/* Modal Thêm / Sửa */}
      <AppModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditMode ? 'Cập nhật người dùng' : 'Thêm mới người dùng'}
        description={isEditMode ? 'Chỉnh sửa thông tin tài khoản.' : 'Điền thông tin chi tiết để tạo tài khoản mới.'}
        maxWidth="4xl"
      >
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <FormField
              label="Tên đăng nhập"
              htmlFor="user-username"
              required
              error={errors.username?.message}
            >
              <Input
                id="user-username"
                placeholder="vd: nguyenvana"
                autoComplete="username"
                aria-required
                {...register('username')}
                disabled={isEditMode}
              />
            </FormField>

            <FormField
              label={isEditMode ? 'Mật khẩu (để trống nếu không đổi)' : 'Mật khẩu'}
              htmlFor="user-password"
              required={!isEditMode}
              error={errors.password?.message}
              hint={isEditMode ? 'Chỉ nhập nếu muốn đổi mật khẩu.' : undefined}
            >
              <div className="relative">
                <Input
                  id="user-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
                  aria-required={!isEditMode}
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
            </FormField>

            <FormField
              label="Nhân sự liên kết"
              htmlFor="user-person"
              required
              error={errors.personId?.message || errors.fullname?.message}
              className={isEditMode ? undefined : 'md:col-span-2'}
            >
              <Select
                id="user-person"
                aria-label="Nhân sự liên kết"
                aria-required
                aria-invalid={!!(errors.personId || errors.fullname)}
                options={personOptions || []}
                value={dataPersonId}
                showSearch
                showClear
                onChange={(id) => {
                  setDataPersonId(id)
                  setValue('personId', id, { shouldValidate: true })
                  const selected = (personOptions || []).find((p: any) => p.value === id)
                  if (selected) {
                    const name = selected.label.split(' (')[0]
                    const email = selected.description?.split(' - ')[1] || ''
                    setValue('fullname', name, { shouldValidate: true })
                    // Create: ẩn field email — vẫn lấy từ person nếu có để gửi BE (optional)
                    setValue('email', email, { shouldValidate: true })
                  } else {
                    setValue('fullname', '', { shouldValidate: true })
                    setValue('email', '')
                  }
                }}
                placeholder="Chọn nhân sự..."
              />
            </FormField>

            {isEditMode && (
              <FormField
                label="Email"
                htmlFor="user-email"
                error={errors.email?.message}
              >
                <Input
                  id="user-email"
                  type="email"
                  placeholder="example@frezo.com"
                  autoComplete="email"
                  {...register('email')}
                />
              </FormField>
            )}

            <FormField
              label="Vai trò"
              htmlFor="user-roles"
              error={errors.roleIds?.message}
              className="md:col-span-2"
            >
              <MultiSelect
                id="user-roles"
                aria-label="Vai trò"
                aria-invalid={!!errors.roleIds}
                options={(Array.isArray(rolesData) ? rolesData : []).map((r: any) => ({
                  value: r.code,
                  label: r.name,
                }))}
                value={selectedRoleIds}
                onChange={(updated) => {
                  setValue('roleIds', updated, { shouldValidate: true })
                }}
                placeholder="Chọn vai trò..."
              />
            </FormField>
          </div>

          <input type="hidden" {...register('fullname')} />
          <input type="hidden" {...register('personId')} />
          <input type="hidden" {...register('dataAction', { valueAsNumber: true })} />
          {!isEditMode && <input type="hidden" {...register('email')} />}

          <div className="flex flex-wrap justify-end gap-2 pt-5 border-t border-border">
            <Button type="button" variant="outline" onClick={closeModal}>
              Hủy
            </Button>
            <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
              {(createUser.isPending || updateUser.isPending) && (
                <Loader2 size={16} className="mr-2 animate-spin" />
              )}
              {isEditMode ? 'Cập nhật' : 'Lưu tài khoản'}
            </Button>
          </div>
        </form>
      </AppModal>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        onClose={() => setConfirm(c => ({ ...c, isOpen: false }))}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmText="Xác nhận"
        cancelText="Hủy"
      />
    </div>
  )
}
