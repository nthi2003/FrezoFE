import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Loader2, ShieldCheck } from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '../hooks/useRoles'
import { useRoleMenus, useSaveRoleMenus } from '../hooks/useRoleMenu'
import { useAllMenus } from '@/modules/menus/hooks/useMenus'
import type { RoleDTO, RoleRequest } from '../services/roleApi'
import { roleFormSchema, type RoleFormValues } from '../constants/schema'

export function RolesPage() {
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // -- Phân quyền Menu State --
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleDTO | null>(null)
  const [selectedMenus, setSelectedMenus] = useState<string[]>([])

  const { data: rolesData, isLoading } = useRoles()
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const deleteRole = useDeleteRole()

  const { data: allMenus } = useAllMenus()
  const { data: roleMenus, isFetching: loadingRoleMenus } = useRoleMenus(selectedRole?.code)
  const saveMenusReq = useSaveRoleMenus()

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { code: '', appCode: 'QTHT', name: '', description: '' },
  })

  // Handlers for CRUD Role
  const handleOpenModal = (role?: RoleDTO) => {
    if (role) {
      setIsEditMode(true)
      setValue('code', role.code)
      setValue('appCode', role.appCode)
      setValue('name', role.name)
      setValue('description', role.description || '')
    } else {
      setIsEditMode(false)
      reset()
    }
    setIsModalOpen(true)
  }

  const handleDelete = (role: RoleDTO) => {
    if (window.confirm(`Xóa vai trò [${role.name}]?`)) {
      deleteRole.mutate({ code: role.code, appCode: role.appCode })
    }
  }

  const onSubmit = (data: RoleFormValues) => {
    const payload: RoleRequest = { ...data, description: data.description || '' }
    if (isEditMode) updateRole.mutate(payload, { onSuccess: () => setIsModalOpen(false) })
    else createRole.mutate(payload, { onSuccess: () => setIsModalOpen(false) })
  }

  // Handlers for Role Menu
  const handleOpenMenuModal = (role: RoleDTO) => {
    setSelectedRole(role)
    setIsMenuModalOpen(true)
  }

  useEffect(() => {
    if (roleMenus && isMenuModalOpen) {
      setSelectedMenus(roleMenus.map(m => m.menuCode))
    }
  }, [roleMenus, isMenuModalOpen])

  const toggleMenu = (menuCode: string) => {
    setSelectedMenus(prev => prev.includes(menuCode) ? prev.filter(c => c !== menuCode) : [...prev, menuCode])
  }

  const handleSaveMenus = () => {
    if (!selectedRole) return
    const payload = selectedMenus.map(menuCode => ({
      roleCode: selectedRole.code,
      menuCode,
      appCode: selectedRole.appCode
    }))
    saveMenusReq.mutate(payload, { onSuccess: () => setIsMenuModalOpen(false) })
  }

  const filteredData = Array.isArray(rolesData) ? rolesData.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase())) : []

  const columns: AppTableColumn<RoleDTO>[] = [
    { key: 'code', title: 'Mã vai trò', dataIndex: 'code', width: 150 },
    { key: 'appCode', title: 'Mã ứng dụng', dataIndex: 'appCode', width: 150 },
    { key: 'name', title: 'Tên vai trò', dataIndex: 'name' },
    { key: 'description', title: 'Mô tả', dataIndex: 'description' },
    {
      key: 'actions', title: 'Thao tác', align: 'center', width: 160,
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" className="text-primary-600 px-2" onClick={() => handleOpenMenuModal(record)}>
            <ShieldCheck size={16} className="mr-1" /> Menu
          </Button>
          <button title="Sửa" onClick={() => handleOpenModal(record)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"><Edit size={15} /></button>
          <button title="Xóa" onClick={() => handleDelete(record)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Quản lý Vai trò & Phân quyền</h2>
          <p className="text-sm text-neutral-500 mt-1">Cấu hình các nhóm quyền hạn truy cập chức năng</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-primary-600 hover:bg-primary-700 text-white">
          <Plus size={16} className="mr-2" /> Thêm Vai trò
        </Button>
      </div>

      <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-sm flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Tìm kiếm vai trò..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <AppTable columns={columns} data={filteredData} isLoading={isLoading} pageIndex={1} pageSize={50} totalElements={filteredData.length} />

      <AppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? 'Cập nhật vai trò' : 'Thêm mới vai trò'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Mã vai trò <span className="text-red-500">*</span></Label>
              <Input placeholder="VD: ROLE_ADMIN" {...register('code')} disabled={isEditMode} />
            </div>
            <div className="space-y-1.5">
              <Label>Mã ứng dụng <span className="text-red-500">*</span></Label>
              <Input placeholder="VD: QTHT" {...register('appCode')} disabled={isEditMode} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tên vai trò <span className="text-red-500">*</span></Label>
            <Input placeholder="VD: Quản trị hệ thống" {...register('name')} />
          </div>
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Input placeholder="Nhập mô tả..." {...register('description')} />
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white" disabled={createRole.isPending || updateRole.isPending}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </AppModal>

      <AppModal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)} title={`Phân quyền Menu: ${selectedRole?.name}`} maxWidth="lg">
        <div className="py-4 space-y-4">
          {loadingRoleMenus ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-600" /></div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto border rounded-md p-4 space-y-2">
              {allMenus?.map((menu: any) => (
                <label key={menu.code} className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded cursor-pointer border-b last:border-0">
                  <input type="checkbox" className="w-4 h-4 accent-primary-600" checked={selectedMenus.includes(menu.code)} onChange={() => toggleMenu(menu.code)} />
                  <span className="text-sm font-medium">{menu.name} <span className="text-neutral-400 text-xs ml-1">({menu.code})</span></span>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsMenuModalOpen(false)}>Đóng</Button>
            <Button onClick={handleSaveMenus} disabled={saveMenusReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white">
              Lưu Phân Quyền
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}
