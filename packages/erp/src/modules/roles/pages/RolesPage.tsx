import { useState, useMemo, useEffect } from 'react'
import { Plus, Edit, Trash2, Loader2, ShieldCheck, AlertTriangle, Search } from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { AppModal } from '@frezo/ui'
import { Button } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { Label } from '@frezo/ui'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '../hooks/useRoles'
import { useRoleMenus, useSaveRoleMenus } from '../hooks/useRoleMenu'
import { useAllMenus } from '@/modules/menus/hooks/useMenus'
import type { RoleDTO, RoleRequest } from '../services/roleApi'
import { roleFormSchema, type RoleFormValues } from '../constants/schema'

export function RolesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // -- Phân quyền Menu State --
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleDTO | null>(null)
  const [selectedMenus, setSelectedMenus] = useState<string[]>([])
  const [menuSearch, setMenuSearch] = useState('')

  const { data: rolesData, isLoading, refetch } = useRoles()
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

  // -- Delete confirmation --
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RoleDTO | null>(null)

  const handleDelete = (role: RoleDTO) => {
    setDeleteTarget(role)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteRole.mutate({ code: deleteTarget.code, appCode: deleteTarget.appCode }, {
      onSuccess: () => { setIsDeleteModalOpen(false); setDeleteTarget(null) },
    })
  }

  const onSubmit = (data: RoleFormValues) => {
    const payload: RoleRequest = { ...data, description: data.description || '' }
    if (isEditMode) updateRole.mutate(payload, { onSuccess: () => setIsModalOpen(false) })
    else createRole.mutate(payload, { onSuccess: () => setIsModalOpen(false) })
  }

  // Handlers for Role Menu
  const handleOpenMenuModal = (role: RoleDTO) => {
    setSelectedRole(role)
    setMenuSearch('')
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
    saveMenusReq.mutate({
      roleId: selectedRole.id!,
      appCode: selectedRole.appCode,
      menuIds: selectedMenus,
    }, { onSuccess: () => setIsMenuModalOpen(false) })
  }

  const filteredMenus = useMemo(() => {
    if (!allMenus) return []
    const q = menuSearch.toLowerCase().trim()
    if (!q) return allMenus
    return allMenus.filter((m: any) =>
      m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
    )
  }, [allMenus, menuSearch])

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
           <Plus size={16} className="mr-2" /> Thêm mới
        </Button>
      </div>

      <AppTable columns={columns} data={rolesData} isLoading={isLoading} showSearch searchPlaceholder="Tìm kiếm vai trò..." onRefresh={refetch} pageIndex={1} pageSize={50} totalElements={Array.isArray(rolesData) ? rolesData.length : 0} />

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
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="Tìm menu theo tên hoặc mã..."
                  value={menuSearch}
                  onChange={e => setMenuSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[55vh] overflow-y-auto border rounded-md p-4 space-y-2">
                {filteredMenus.length === 0 ? (
                  <p className="text-center text-sm text-neutral-400 py-8">Không tìm thấy menu</p>
                ) : (
                  filteredMenus.map((menu: any) => (
                    <label key={menu.code} className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded cursor-pointer border-b last:border-0">
                      <input type="checkbox" className="w-4 h-4 accent-primary-600" checked={selectedMenus.includes(menu.code)} onChange={() => toggleMenu(menu.code)} />
                      <span className="text-sm font-medium">{menu.name} <span className="text-neutral-400 text-xs ml-1">({menu.code})</span></span>
                    </label>
                  ))
                )}
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsMenuModalOpen(false)}>Đóng</Button>
            <Button onClick={handleSaveMenus} disabled={saveMenusReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white">
              Lưu Phân Quyền
            </Button>
          </div>
        </div>
      </AppModal>

      <AppModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Xác nhận xóa" maxWidth="sm">
        <div className="py-6 text-center space-y-4">
          <AlertTriangle size={48} className="mx-auto text-red-500" />
          <p className="text-neutral-700">Bạn có chắc chắn muốn xóa vai trò <strong>{deleteTarget?.name}</strong>?</p>
          <p className="text-sm text-neutral-500">Hành động này không thể hoàn tác.</p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Hủy</Button>
            <Button onClick={confirmDelete} disabled={deleteRole.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {deleteRole.isPending ? <Loader2 size={16} className="animate-spin mr-1" /> : null}
              Xóa
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}
