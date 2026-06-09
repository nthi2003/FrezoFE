// ============================================================
// FREZO ERP — Users Page
// Màn hình quản lý người dùng mẫu áp dụng AppTable & AppModal & AppForm
// ============================================================

import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// react-hook-form + zod
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { useUsers, useCreateUser, useActiveUser, useLockUser, useResetPassword, type UserDTO } from '../hooks/useUsers'
import type { RegisterRequest } from '../services/userApi'
import { userFormSchema, type UserFormValues } from '../constants/schema'

export function UsersPage() {
  // ---- State ----
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // ---- Queries & Mutations ----
  const { data: usersData, isLoading } = useUsers(page, size, search)
  const createUser = useCreateUser()
  const activeUser = useActiveUser()
  const lockUser = useLockUser()
  const resetPassword = useResetPassword()

  // ---- Form setup ----
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      password: '',
      email: '',
      fullname: '',
      dataAction: 1, // Mặc định 1
      roleId: '',
      orgId: '',
    },
  })

  // ---- Handlers ----
  const handlePageChange = (newPage: number, newSize: number) => {
    setPage(newPage)
    setSize(newSize)
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1)
      setSearch(e.currentTarget.value)
    }
  }

  const handleOpenModal = () => {
    reset()
    setIsModalOpen(true)
  }

  const onSubmit = (data: UserFormValues) => {
    const payload: RegisterRequest = {
      ...data,
      // Xóa pass nếu không nhập để BE tự gen mặc định (tùy logic BE)
      password: data.password || undefined,
    }
    createUser.mutate(payload, {
      onSuccess: () => {
        setIsModalOpen(false)
        reset()
      },
    })
  }

  // ---- Table Columns ----
  const columns: AppTableColumn<UserDTO>[] = [
    { key: 'username', title: 'Tên đăng nhập', dataIndex: 'username' },
    { key: 'fullName', title: 'Họ và tên', dataIndex: 'fullName' },
    { key: 'email', title: 'Email', dataIndex: 'email' },
    { key: 'phone', title: 'Số điện thoại', dataIndex: 'phone' },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      render: (_, record) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            record.status === 1
              ? 'bg-success/10 text-success'
              : 'bg-danger/10 text-danger'
          }`}
        >
          {record.status === 1 ? 'Hoạt động' : 'Khóa'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'center',
      width: 140,
      render: (_, record) => (
        <div className="flex items-center justify-center gap-1">
          {/* Edit (Placeholder) */}
          <button
            title="Sửa"
            className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
          >
            <Edit size={15} />
          </button>
          
          {/* Reset Password */}
          <button
            title="Reset mật khẩu"
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn reset mật khẩu tài khoản này về mặc định?')) {
                resetPassword.mutate(record.id!)
              }
            }}
            className="p-1.5 text-neutral-400 hover:text-warning hover:bg-warning/10 rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>
          </button>

          {/* Active / Lock */}
          {record.status === 1 ? (
            <button
              title="Khóa tài khoản"
              onClick={() => {
                if (window.confirm('Khóa tài khoản này?')) {
                  lockUser.mutate(record.id!)
                }
              }}
              className="p-1.5 text-neutral-400 hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </button>
          ) : (
            <button
              title="Mở khóa tài khoản"
              onClick={() => {
                if (window.confirm('Mở khóa tài khoản này?')) {
                  activeUser.mutate(record.id!)
                }
              }}
              className="p-1.5 text-neutral-400 hover:text-success hover:bg-success/10 rounded-md transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Quản lý người dùng</h2>
          <p className="text-sm text-neutral-500 mt-1">Danh sách tài khoản truy cập hệ thống</p>
        </div>
        <Button onClick={handleOpenModal} className="gap-2 shadow-primary">
          <Plus size={16} />
          Thêm mới
        </Button>
      </div>

      {/* Toolbar / Filters */}
      <div className="p-4 rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Nhập tên đăng nhập hoặc email và nhấn Enter..."
              className="pl-9"
              onKeyDown={handleSearch}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <AppTable
        columns={columns}
        data={usersData?.content || []}
        isLoading={isLoading}
        pageIndex={page}
        pageSize={size}
        totalElements={usersData?.totalElements || 0}
        onPageChange={handlePageChange}
      />

      {/* Modal Thêm Mới */}
      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thêm mới người dùng"
        description="Điền thông tin chi tiết để tạo tài khoản mới."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Tên đăng nhập */}
          <div className="space-y-1.5">
            <Label htmlFor="username">Tên đăng nhập <span className="text-danger">*</span></Label>
            <Input id="username" placeholder="Nhập tên đăng nhập" {...register('username')} />
            {errors.username && <p className="text-xs text-danger">{errors.username.message}</p>}
          </div>

          {/* Mật khẩu */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Mật khẩu <span className="text-danger">*</span></Label>
            <Input id="password" type="password" placeholder="Nhập mật khẩu" {...register('password')} />
            {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email <span className="text-danger">*</span></Label>
            <Input id="email" type="email" placeholder="example@frezo.com" {...register('email')} />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>

          {/* Họ và tên */}
          <div className="space-y-1.5">
            <Label htmlFor="fullname">Họ và tên <span className="text-danger">*</span></Label>
            <Input id="fullname" placeholder="Nguyễn Văn A" {...register('fullname')} />
            {errors.fullname && <p className="text-xs text-danger">{errors.fullname.message}</p>}
          </div>

          {/* Data Action */}
          <div className="space-y-1.5 hidden">
            <Label htmlFor="dataAction">Quyền truy cập dữ liệu</Label>
            <Input id="dataAction" type="number" {...register('dataAction', { valueAsNumber: true })} />
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </AppModal>
    </div>
  )
}

