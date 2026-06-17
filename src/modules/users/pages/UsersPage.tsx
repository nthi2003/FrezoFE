// ============================================================
// FREZO ERP — Users Page
// ============================================================

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Loader2, KeyRound, Lock, Unlock } from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/Select'
import { MultiSelect } from '@/components/ui/MultiSelect'

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
  const [confirm, setConfirm] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const { data: usersData, isLoading } = useUsers(1, 1000, '')
  const { data: personOptions } = useQuery({
    queryKey: ['persons-combobox'],
    queryFn: () => personApi.getCombobox(),
    select: (res: any) => res?.data ?? [],
  })
  const { data: rolesData } = useRoles()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const activeUser = useActiveUser()
  const lockUser = useLockUser()
  const resetPassword = useResetPassword()
  const assignRole = useAssignRole()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { username: '', password: '', email: '', fullname: '', dataAction: 1, personId: '', roleIds: [], orgId: '' },
  })
  const selectedRoleIds = watch('roleIds') || []



  const handleOpenCreate = () => { setIsEditMode(false); setSelectedUser(null); setDataPersonId(''); reset(); setIsModalOpen(true) }

  const handleOpenEdit = (user: UserDTO) => {
    setIsEditMode(true)
    setSelectedUser(user)
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
    // Data already set from user object above; no need to fetch Person
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
          setIsModalOpen(false); reset()
        },
      })
    } else {
      if (!data.password) return
      const payload: RegisterRequest = {
        username: data.username,
        password: data.password,
        dataAction: data.dataAction,
        personId: data.personId || undefined,
        email: data.email || undefined,
        fullname: data.fullname || undefined,
        roleIds: data.roleIds || undefined,
        orgId: data.orgId || undefined,
      }
      createUser.mutate(payload, {
        onSuccess: () => { setIsModalOpen(false); reset() },
      })
    }
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
        { value: '1', label: 'Hoạt động' },
        { value: '0', label: 'Khóa' },
      ],
      render: (_, record) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          record.status === 1 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
        }`}>
          {record.status === 1 ? 'Hoạt động' : 'Khóa'}
        </span>
      ),
    },
    {
      key: 'actions', title: 'Thao tác', align: 'center', width: 140,
      render: (_, record) => (
        <div className="flex items-center justify-center gap-1">
          <button title="Sửa" onClick={() => handleOpenEdit(record)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors">
            <Edit size={15} />
          </button>
          <button
            title="Reset mật khẩu"
            onClick={() => setConfirm({
              isOpen: true, title: 'Reset mật khẩu',
              message: 'Bạn có chắc chắn muốn reset mật khẩu tài khoản này về mặc định?',
              onConfirm: () => { resetPassword.mutate(record.id!); setConfirm(c => ({ ...c, isOpen: false })) },
            })}
            className="p-1.5 text-neutral-400 hover:text-warning hover:bg-warning/10 rounded-md transition-colors"
          >
            <KeyRound size={15} />
          </button>
          {record.status === 1 ? (
            <button
              title="Khóa tài khoản"
              onClick={() => setConfirm({
                isOpen: true, title: 'Khóa tài khoản',
                message: 'Bạn có chắc chắn muốn khóa tài khoản này?',
                onConfirm: () => { lockUser.mutate(record.id!); setConfirm(c => ({ ...c, isOpen: false })) },
              })}
              className="p-1.5 text-neutral-400 hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
            >
              <Lock size={15} />
            </button>
          ) : (
            <button
              title="Mở khóa tài khoản"
              onClick={() => setConfirm({
                isOpen: true, title: 'Mở khóa tài khoản',
                message: 'Bạn có chắc chắn muốn mở khóa tài khoản này?',
                onConfirm: () => { activeUser.mutate(record.id!); setConfirm(c => ({ ...c, isOpen: false })) },
              })}
              className="p-1.5 text-neutral-400 hover:text-success hover:bg-success/10 rounded-md transition-colors"
            >
              <Unlock size={15} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Quản lý người dùng</h2>
          <p className="text-sm text-neutral-500 mt-1">Danh sách tài khoản truy cập hệ thống</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus size={16} /> Thêm mới
        </Button>
      </div>

      {/* Table */}
      <AppTable
        columns={columns}
        data={usersData?.items || []}
        isLoading={isLoading}
        showSearch={true}
        searchPlaceholder="Tìm theo tên đăng nhập, họ tên, email..."
        onRefresh={() => {
          queryClient.invalidateQueries({ queryKey: ['users'] })
        }}
      />

      {/* Modal Thêm / Sửa */}
      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Cập nhật người dùng' : 'Thêm mới người dùng'}
        description={isEditMode ? 'Chỉnh sửa thông tin tài khoản.' : 'Điền thông tin chi tiết để tạo tài khoản mới.'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Tên đăng nhập <span className="text-danger">*</span></Label>
              <Input id="username" placeholder="vd: nguyenvana" {...register('username')} disabled={isEditMode} />
              {errors.username && <p className="text-xs text-danger">{errors.username.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{isEditMode ? 'Mật khẩu (để trống nếu không đổi)' : 'Mật khẩu'} <span className="text-danger">{!isEditMode ? '*' : ''}</span></Label>
              <Input id="password" type="password" placeholder="Tối thiểu 6 ký tự" {...register('password')} />
              {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="personSelect">Nhân sự liên kết <span className="text-danger">*</span></Label>
              <Select
                options={personOptions || []}
                value={dataPersonId}
                onChange={(id) => {
                  setDataPersonId(id)
                  setValue('personId', id)
                  const selected = (personOptions || []).find((p: any) => p.value === id)
                  if (selected) {
                    const name = selected.label.split(' (')[0]
                    const email = selected.description?.split(' - ')[1] || ''
                    setValue('fullname', name)
                    setValue('email', email)
                  } else {
                    setValue('fullname', '')
                    setValue('email', '')
                  }
                }}
                placeholder="Chọn nhân sự liên kết..."
              />
              <input type="hidden" {...register('fullname')} />
              {errors.fullname && <p className="text-xs text-danger">{errors.fullname.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email <span className="text-danger">*</span></Label>
              <Input id="email" type="email" placeholder="example@frezo.com" {...register('email')} />
              {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <MultiSelect
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
            {errors.roleIds && <p className="text-xs text-danger">{errors.roleIds.message}</p>}
          </div>

          {/* Hidden */}
          <input type="hidden" {...register('dataAction', { valueAsNumber: true })} />

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
              {(createUser.isPending || updateUser.isPending) && <Loader2 size={16} className="mr-2 animate-spin" />}
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
