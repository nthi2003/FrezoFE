// ============================================================
// FREZO — RolesPage v2
// 2-pane layout: Role list (trái) + Permission Matrix (phải)
// Inspiration: Linear / GitHub / Vercel access settings
// ============================================================

import { useState, useMemo, useEffect } from 'react'
import {
  Plus, Edit, Trash2, Loader2, ShieldCheck, Search, Copy, Save,
  ChevronRight, ChevronDown, Folder, FileText, Filter,
  AlertTriangle, CheckSquare, Square, Shield, RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import {
  AppModal, Button, Input, Label, PageHeader, PageGuideButton,
  StatusBadge, type PageGuideConfig,
} from '@frezo/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '../hooks/useRoles'
import { useRoleMenus, useSaveRoleMenus } from '../hooks/useRoleMenu'
import { useAllMenus } from '@/modules/menus/hooks/useMenus'
import type { RoleDTO, RoleRequest } from '../services/roleApi'
import { roleFormSchema, type RoleFormValues } from '../constants/schema'
import { roleMenuApi } from '../services/roleMenuApi'
import { toast } from 'sonner'

// ============================================================
// Guide
// ============================================================

const ROLES_GUIDE: PageGuideConfig = {
  title: 'Vai trò & Phân quyền',
  subtitle:
    'Vai trò gom quyền truy cập theo nhóm chức năng. Chọn 1 role bên trái → tick menu bên phải → Lưu.',
  sections: [
    {
      heading: 'Quy trình',
      type: 'steps',
      steps: [
        {
          title: '1. Tạo vai trò',
          description:
            'Bấm "Thêm vai trò". Đặt mã UPPER_SNAKE (VD: MANAGER_KD, STAFF_HR), chọn app, mô tả ngắn.',
        },
        {
          title: '2. Chọn menu được truy cập',
          description:
            'Bấm vào role → tick các menu ở panel phải. Tick folder = chọn tất cả menu con. Bấm "Lưu phân quyền".',
        },
        {
          title: '3. Nhân bản (Clone)',
          description:
            'Muốn tạo role tương tự (VD: STAFF_KD1 giống STAFF_KD2)? Bấm icon copy → đặt mã mới → hệ thống copy toàn bộ quyền menu.',
        },
        {
          title: '4. Gán role cho user',
          description:
            'Sang trang "Người dùng" → chỉnh user → chọn multi-role. User cần logout/login lại để menu mới có hiệu lực.',
        },
      ],
    },
    {
      heading: 'Best practice',
      type: 'tips',
      tips: [
        'Đặt tên role theo chức năng, KHÔNG đặt theo tên user (VD: OK: ACCOUNTANT, MANAGER_HR. Xấu: USER_A, USER_B).',
        'ADMIN / SUPER_ADMIN whitelist toàn hệ thống — không cần cấu hình menu chi tiết.',
        'Không xoá role còn user gán — chuyển user sang role khác trước, sau đó soft-delete.',
      ],
    },
  ],
}

// ============================================================
// App options
// ============================================================

const APP_OPTIONS = [
  { value: 'QTHT', label: 'QTHT — Quản trị hệ thống' },
  { value: 'QLNS', label: 'QLNS — Quản lý nhân sự' },
  { value: 'QLKH', label: 'QLKH — Quản lý khách hàng' },
  { value: 'CRM',  label: 'CRM' },
  { value: 'ERP',  label: 'ERP' },
]

// ============================================================
// Page
// ============================================================

export function RolesPage() {
  // ---- Role CRUD state ----
  const [selectedRole, setSelectedRole] = useState<RoleDTO | null>(null)
  const [search, setSearch] = useState('')
  const [appFilter, setAppFilter] = useState<string>('all')

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RoleDTO | null>(null)
  const [cloneTarget, setCloneTarget] = useState<RoleDTO | null>(null)

  // ---- Permission matrix state ----
  const [selectedMenus, setSelectedMenus] = useState<Set<string>>(new Set())
  const [menuSearch, setMenuSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [dirty, setDirty] = useState(false)

  const { data: rolesData, isLoading: rolesLoading, refetch: refetchRoles } = useRoles()
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const deleteRole = useDeleteRole()

  const { data: allMenus, isLoading: menusLoading } = useAllMenus()
  const { data: roleMenus, isFetching: loadingRoleMenus } = useRoleMenus(selectedRole?.code)
  const saveMenusReq = useSaveRoleMenus()

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { code: '', appCode: 'QTHT', name: '', description: '' },
  })

  // ---- Sync menu selection when role menus loaded ----
  useEffect(() => {
    if (roleMenus && selectedRole) {
      const codes = new Set<string>((roleMenus as any[]).map((m) => m.menuCode))
      setSelectedMenus(codes)
      setDirty(false)
    }
  }, [roleMenus, selectedRole?.code]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Derived: filtered roles ----
  const filteredRoles = useMemo(() => {
    if (!Array.isArray(rolesData)) return []
    let list = rolesData as RoleDTO[]
    if (appFilter !== 'all') list = list.filter((r) => r.appCode === appFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q),
      )
    }
    return list
  }, [rolesData, appFilter, search])

  // ---- Menu tree (from flat allMenus, filtered by role's appCode) ----
  const menuTree = useMemo(() => {
    if (!Array.isArray(allMenus)) return []
    let flat = allMenus as any[]
    if (selectedRole?.appCode) {
      flat = flat.filter((m) => !m.appCode || m.appCode === selectedRole.appCode)
    }

    const map = new Map<string, any>()
    flat.forEach((m) => map.set(m.code, { ...m, children: [] }))
    const roots: any[] = []
    flat.forEach((m) => {
      const node = map.get(m.code)!
      if (m.parentCode && map.has(m.parentCode)) {
        map.get(m.parentCode)!.children.push(node)
      } else {
        roots.push(node)
      }
    })
    const sort = (nodes: any[]) => {
      nodes.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
      nodes.forEach((n) => sort(n.children))
    }
    sort(roots)
    return roots
  }, [allMenus, selectedRole?.appCode])

  // ---- Filter tree by search text (keep parents of matches) ----
  const filteredTree = useMemo(() => {
    if (!menuSearch.trim()) return menuTree
    const q = menuSearch.toLowerCase().trim()
    const filter = (nodes: any[]): any[] => {
      const out: any[] = []
      for (const n of nodes) {
        const matched = n.name?.toLowerCase().includes(q) || n.code?.toLowerCase().includes(q)
        const filteredChildren = filter(n.children || [])
        if (matched || filteredChildren.length > 0) {
          out.push({ ...n, children: filteredChildren })
        }
      }
      return out
    }
    return filter(menuTree)
  }, [menuTree, menuSearch])

  // ---- Auto-expand all groups when search or role change ----
  useEffect(() => {
    if (menuSearch.trim()) {
      const s = new Set<string>()
      const collect = (nodes: any[]) => {
        for (const n of nodes) {
          if (n.children?.length) {
            s.add(n.code)
            collect(n.children)
          }
        }
      }
      collect(filteredTree)
      setExpandedGroups(s)
    }
  }, [menuSearch, filteredTree])

  useEffect(() => {
    // Default: expand top-level folders when a role is selected
    const s = new Set<string>()
    for (const root of menuTree) {
      if (root.children?.length) s.add(root.code)
    }
    setExpandedGroups(s)
  }, [selectedRole?.code, menuTree.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Total menu leaves for stats ----
  const totalLeaves = useMemo(() => {
    const count = (nodes: any[]): number => {
      let c = 0
      for (const n of nodes) {
        if (!n.children?.length) c++
        else c += count(n.children)
      }
      return c
    }
    return count(menuTree)
  }, [menuTree])

  const selectedLeavesCount = useMemo(() => {
    const count = (nodes: any[]): number => {
      let c = 0
      for (const n of nodes) {
        if (!n.children?.length) {
          if (selectedMenus.has(n.code)) c++
        } else c += count(n.children)
      }
      return c
    }
    return count(menuTree)
  }, [menuTree, selectedMenus])

  // ============================================================
  // Actions
  // ============================================================

  const handleOpenCreate = () => {
    setIsEditMode(false)
    reset({ code: '', appCode: appFilter !== 'all' ? appFilter : 'QTHT', name: '', description: '' })
    setIsRoleModalOpen(true)
  }
  const handleOpenEdit = (role: RoleDTO) => {
    setIsEditMode(true)
    setValue('code', role.code)
    setValue('appCode', role.appCode)
    setValue('name', role.name)
    setValue('description', role.description || '')
    setIsRoleModalOpen(true)
  }
  const onSubmitRole = (data: RoleFormValues) => {
    const payload: RoleRequest = { ...data, description: data.description || '' }
    if (isEditMode) {
      updateRole.mutate(payload, {
        onSuccess: () => {
          setIsRoleModalOpen(false)
          if (selectedRole?.code === payload.code) {
            setSelectedRole({ ...selectedRole, name: payload.name, description: payload.description })
          }
        },
      })
    } else {
      createRole.mutate(payload, {
        onSuccess: () => {
          setIsRoleModalOpen(false)
          refetchRoles()
        },
      })
    }
  }
  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteRole.mutate(
      { code: deleteTarget.code, appCode: deleteTarget.appCode },
      {
        onSuccess: () => {
          setDeleteTarget(null)
          if (selectedRole?.code === deleteTarget.code) setSelectedRole(null)
        },
      },
    )
  }

  // ---- Toggle single menu ----
  const toggleMenu = (code: string) => {
    setSelectedMenus((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
    setDirty(true)
  }

  // ---- Toggle a group (folder) — check/uncheck all descendants ----
  const collectDescendantCodes = (node: any, acc: string[]): void => {
    acc.push(node.code)
    if (node.children) for (const c of node.children) collectDescendantCodes(c, acc)
  }
  const toggleGroup = (node: any, checked: boolean) => {
    const codes: string[] = []
    collectDescendantCodes(node, codes)
    setSelectedMenus((prev) => {
      const next = new Set(prev)
      if (checked) codes.forEach((c) => next.add(c))
      else codes.forEach((c) => next.delete(c))
      return next
    })
    setDirty(true)
  }
  const isGroupChecked = (node: any): 'all' | 'partial' | 'none' => {
    const codes: string[] = []
    collectDescendantCodes(node, codes)
    // Chỉ đếm leaves cho semantic đúng
    const leafCodes = codes.filter((c) => {
      const findLeaf = (nodes: any[]): boolean => {
        for (const n of nodes) {
          if (n.code === c) return !n.children || n.children.length === 0
          if (n.children?.length) {
            const found = findLeaf(n.children)
            if (found !== undefined) return found
          }
        }
        return false
      }
      return findLeaf([node])
    })
    if (leafCodes.length === 0) return selectedMenus.has(node.code) ? 'all' : 'none'
    const selectedCount = leafCodes.filter((c) => selectedMenus.has(c)).length
    if (selectedCount === 0) return 'none'
    if (selectedCount === leafCodes.length) return 'all'
    return 'partial'
  }

  const toggleExpand = (code: string) => {
    setExpandedGroups((prev) => {
      const n = new Set(prev)
      if (n.has(code)) n.delete(code)
      else n.add(code)
      return n
    })
  }

  const handleSelectAll = () => {
    const all: string[] = []
    const walk = (nodes: any[]) => { for (const n of nodes) { all.push(n.code); if (n.children) walk(n.children) } }
    walk(filteredTree)
    setSelectedMenus((prev) => {
      const next = new Set(prev)
      all.forEach((c) => next.add(c))
      return next
    })
    setDirty(true)
  }
  const handleClearAll = () => {
    const all: string[] = []
    const walk = (nodes: any[]) => { for (const n of nodes) { all.push(n.code); if (n.children) walk(n.children) } }
    walk(filteredTree)
    setSelectedMenus((prev) => {
      const next = new Set(prev)
      all.forEach((c) => next.delete(c))
      return next
    })
    setDirty(true)
  }

  const handleSaveMenus = () => {
    if (!selectedRole) return
    saveMenusReq.mutate(
      {
        roleId: selectedRole.id!,
        appCode: selectedRole.appCode,
        menuIds: Array.from(selectedMenus),
      },
      { onSuccess: () => setDirty(false) },
    )
  }

  // ---- Clone role ----
  const [cloneForm, setCloneForm] = useState({ code: '', name: '' })
  const [cloneSubmitting, setCloneSubmitting] = useState(false)
  const handleOpenClone = (role: RoleDTO) => {
    setCloneTarget(role)
    setCloneForm({ code: `${role.code}_COPY`, name: `${role.name} (Bản sao)` })
  }
  const handleConfirmClone = async () => {
    if (!cloneTarget) return
    if (!cloneForm.code.trim()) return toast.error('Nhập mã role mới')
    setCloneSubmitting(true)
    try {
      // 1. Create new role (same appCode + description)
      await new Promise<void>((resolve, reject) => {
        createRole.mutate(
          {
            code: cloneForm.code.trim().toUpperCase(),
            name: cloneForm.name.trim() || cloneForm.code,
            appCode: cloneTarget.appCode,
            description: `Copied from ${cloneTarget.code}`,
          },
          { onSuccess: () => resolve(), onError: (e) => reject(e) },
        )
      })
      // 2. Get source role's menus
      const srcMenus = (await roleMenuApi.getMenusByRole(cloneTarget.code)) as any[]
      const menuIds = srcMenus.map((m) => m.menuCode)

      // 3. Refetch to get the new role's ID
      const refetchResult = await refetchRoles()
      const newRole = (refetchResult.data as RoleDTO[] | undefined)?.find(
        (r) => r.code === cloneForm.code.trim().toUpperCase() && r.appCode === cloneTarget.appCode,
      )
      if (!newRole?.id) throw new Error('Không tìm thấy role mới sau khi tạo')

      // 4. Save menus for the new role
      await roleMenuApi.saveAll({
        roleId: newRole.id,
        appCode: newRole.appCode,
        menuIds,
      })
      toast.success(`Đã nhân bản role "${cloneTarget.name}" thành "${newRole.code}" với ${menuIds.length} menu`)
      setCloneTarget(null)
      setSelectedRole(newRole)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Nhân bản thất bại')
    } finally {
      setCloneSubmitting(false)
    }
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <PageHeader
        title="Vai trò & Phân quyền"
        description="Cấu hình role, gán menu cho role, nhân bản nhanh khi tạo role tương tự"
        actions={
          <>
            <PageGuideButton guide={ROLES_GUIDE} />
            <Button
              onClick={handleOpenCreate}
              className="gap-2 bg-primary-700 hover:bg-primary-800 text-white shadow-sm"
            >
              <Plus size={16} /> Thêm vai trò
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip label="Tổng vai trò" value={Array.isArray(rolesData) ? String(rolesData.length) : '0'} icon={Shield} tone="neutral" />
        <StatChip label="Đang chọn" value={selectedRole ? selectedRole.name : '—'} icon={ShieldCheck} tone="blue" />
        <StatChip label="Menu được cấp" value={selectedRole ? `${selectedLeavesCount}/${totalLeaves}` : '—'} icon={CheckSquare} tone="green" />
        <StatChip label="Trạng thái" value={dirty ? 'Có thay đổi chưa lưu' : selectedRole ? 'Đã đồng bộ' : 'Chọn 1 role'} icon={dirty ? AlertTriangle : ShieldCheck} tone={dirty ? 'amber' : 'neutral'} />
      </div>

      {/* Main 2-pane */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        {/* ==================== LEFT: Role list ==================== */}
        <aside className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-260px)]">
          {/* Search + filter */}
          <div className="p-3 border-b border-neutral-100 space-y-2 shrink-0">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã, tên vai trò..."
                className="h-8 w-full pl-8 pr-2 text-sm bg-neutral-50 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-0.5 inline-flex items-center gap-1">
                <Filter size={9} /> App:
              </span>
              <button
                type="button"
                onClick={() => setAppFilter('all')}
                className={`h-6 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
                  appFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                }`}
              >
                Tất cả
              </button>
              {APP_OPTIONS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAppFilter(a.value)}
                  className={`h-6 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
                    appFilter === a.value ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                  }`}
                >
                  {a.value}
                </button>
              ))}
            </div>
          </div>

          {/* Role list */}
          <div className="flex-1 overflow-y-auto p-2">
            {rolesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={16} className="animate-spin text-primary-500" />
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-70">
                <Shield size={28} className="text-neutral-300 mb-2" />
                <p className="text-xs text-neutral-500">Không có vai trò nào</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredRoles.map((role) => (
                  <RoleListItem
                    key={`${role.code}_${role.appCode}`}
                    role={role}
                    selected={selectedRole?.code === role.code && selectedRole?.appCode === role.appCode}
                    dirty={dirty && selectedRole?.code === role.code}
                    onSelect={() => {
                      if (dirty && !confirm('Bạn có thay đổi chưa lưu. Chuyển sang role khác sẽ mất thay đổi. Tiếp tục?')) return
                      setSelectedRole(role)
                    }}
                    onEdit={() => handleOpenEdit(role)}
                    onClone={() => handleOpenClone(role)}
                    onDelete={() => setDeleteTarget(role)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ==================== RIGHT: Permission Matrix ==================== */}
        <section className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-260px)]">
          {!selectedRole ? (
            <EmptyPane
              onCreate={handleOpenCreate}
              hasAnyRole={Array.isArray(rolesData) && rolesData.length > 0}
            />
          ) : (
            <>
              {/* Role hero header */}
              <div className="px-5 py-4 border-b border-neutral-100 bg-gradient-to-b from-neutral-50/60 to-white flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-sm shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-neutral-900 truncate">{selectedRole.name}</h2>
                    <StatusBadge label={selectedRole.appCode} color="info" compact={false} />
                    {dirty && <StatusBadge label="Chưa lưu" color="warning" icon={AlertTriangle} />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                    <code className="px-1.5 py-0.5 bg-neutral-100 rounded font-mono">{selectedRole.code}</code>
                    <span className="text-neutral-300">·</span>
                    <span>{selectedRole.description || 'Không có mô tả'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenClone(selectedRole)}
                    className="h-8 px-2.5 rounded-lg text-xs font-medium text-neutral-600 hover:text-primary-700 hover:bg-primary-50 border border-neutral-200 inline-flex items-center gap-1"
                    title="Nhân bản role này với đầy đủ quyền"
                  >
                    <Copy size={12} /> Clone
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedRole)}
                    className="h-8 w-8 rounded-lg text-neutral-500 hover:text-primary-700 hover:bg-primary-50 inline-flex items-center justify-center border border-neutral-200"
                    title="Sửa thông tin role"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selectedRole)}
                    className="h-8 w-8 rounded-lg text-neutral-500 hover:text-rose-600 hover:bg-rose-50 inline-flex items-center justify-center border border-neutral-200"
                    title="Xoá role"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Matrix toolbar */}
              <div className="px-5 py-2.5 border-b border-neutral-100 flex flex-wrap items-center gap-2 bg-neutral-50/40">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder="Tìm menu..."
                    className="h-8 w-full pl-8 pr-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div className="text-xs text-neutral-500">
                  <span className="font-semibold text-primary-700">{selectedLeavesCount}</span>
                  <span className="text-neutral-300 mx-1">/</span>
                  <span>{totalLeaves} menu</span>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="h-7 px-2 text-xs font-medium text-neutral-600 hover:text-primary-700 hover:bg-primary-50 rounded-md inline-flex items-center gap-1"
                  >
                    <CheckSquare size={11} /> Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="h-7 px-2 text-xs font-medium text-neutral-600 hover:text-rose-600 hover:bg-rose-50 rounded-md inline-flex items-center gap-1"
                  >
                    <Square size={11} /> Bỏ hết
                  </button>
                </div>
              </div>

              {/* Matrix body */}
              <div className="flex-1 overflow-y-auto p-3">
                {loadingRoleMenus || menusLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={20} className="animate-spin text-primary-500" />
                  </div>
                ) : filteredTree.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Folder size={36} className="text-neutral-200 mb-3" />
                    <p className="text-sm font-semibold text-neutral-600">Không có menu để hiển thị</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {menuSearch ? 'Xoá bộ lọc tìm kiếm' : `Không có menu nào cho app ${selectedRole.appCode}`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredTree.map((node) => (
                      <MatrixNode
                        key={node.code}
                        node={node}
                        depth={0}
                        expandedGroups={expandedGroups}
                        onToggleExpand={toggleExpand}
                        selectedMenus={selectedMenus}
                        onToggleMenu={toggleMenu}
                        onToggleGroup={toggleGroup}
                        isGroupChecked={isGroupChecked}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Sticky footer */}
              <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/70 flex items-center gap-3 shrink-0">
                {dirty ? (
                  <span className="text-xs text-amber-700 inline-flex items-center gap-1.5">
                    <AlertTriangle size={12} /> Bạn có thay đổi chưa lưu
                  </span>
                ) : (
                  <span className="text-xs text-neutral-500 inline-flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-emerald-600" /> Không có thay đổi
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {dirty && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Reset selection to server-side state
                        if (roleMenus) {
                          setSelectedMenus(new Set((roleMenus as any[]).map((m) => m.menuCode)))
                          setDirty(false)
                        }
                      }}
                      className="gap-1"
                    >
                      <RefreshCw size={12} /> Huỷ thay đổi
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveMenus}
                    disabled={!dirty || saveMenusReq.isPending}
                    className="bg-primary-700 hover:bg-primary-800 text-white gap-1.5"
                  >
                    {saveMenusReq.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Lưu phân quyền
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ==================== Role Modal ==================== */}
      <AppModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={isEditMode ? 'Cập nhật vai trò' : 'Thêm vai trò mới'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmitRole)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Mã vai trò <span className="text-rose-500">*</span></Label>
              <Input placeholder="VD: ROLE_ADMIN" {...register('code')} disabled={isEditMode} />
              {errors.code && <p className="text-xs text-rose-600">{errors.code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>App <span className="text-rose-500">*</span></Label>
              <select
                {...register('appCode')}
                disabled={isEditMode}
                className="w-full h-9 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:bg-neutral-50 disabled:text-neutral-500"
              >
                {APP_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              {errors.appCode && <p className="text-xs text-rose-600">{errors.appCode.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tên hiển thị <span className="text-rose-500">*</span></Label>
            <Input placeholder="VD: Quản trị hệ thống" {...register('name')} />
            {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Input placeholder="Chức năng của role" {...register('description')} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
            <Button type="button" variant="outline" onClick={() => setIsRoleModalOpen(false)}>
              Huỷ
            </Button>
            <Button
              type="submit"
              className="bg-primary-700 hover:bg-primary-800 text-white"
              disabled={createRole.isPending || updateRole.isPending}
            >
              {(createRole.isPending || updateRole.isPending) && <Loader2 size={13} className="animate-spin mr-1" />}
              Lưu
            </Button>
          </div>
        </form>
      </AppModal>

      {/* ==================== Clone Modal ==================== */}
      <AppModal
        isOpen={!!cloneTarget}
        onClose={() => setCloneTarget(null)}
        title={`Nhân bản vai trò: ${cloneTarget?.name || ''}`}
        maxWidth="md"
      >
        <div className="py-2 space-y-4">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
            <Copy size={14} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Nhân bản với đầy đủ quyền menu</div>
              <div className="mt-1 opacity-80">
                Hệ thống sẽ tạo role mới với cùng app <code className="font-mono">{cloneTarget?.appCode}</code>, sau đó copy toàn bộ menu đã cấp cho role gốc.
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mã role mới <span className="text-rose-500">*</span></Label>
            <Input
              value={cloneForm.code}
              onChange={(e) => setCloneForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="VD: MANAGER_KD_NORTH"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tên hiển thị</Label>
            <Input
              value={cloneForm.name}
              onChange={(e) => setCloneForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="VD: Quản lý kinh doanh miền Bắc"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
            <Button variant="outline" onClick={() => setCloneTarget(null)}>Huỷ</Button>
            <Button
              onClick={handleConfirmClone}
              disabled={cloneSubmitting}
              className="bg-primary-700 hover:bg-primary-800 text-white gap-1"
            >
              {cloneSubmitting && <Loader2 size={13} className="animate-spin" />}
              <Copy size={13} /> Nhân bản
            </Button>
          </div>
        </div>
      </AppModal>

      {/* ==================== Delete Confirm ==================== */}
      <AppModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xác nhận xoá vai trò"
        maxWidth="sm"
      >
        <div className="py-4 space-y-3 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 flex items-center justify-center">
            <AlertTriangle size={22} className="text-rose-600" />
          </div>
          <p className="text-sm text-neutral-800">
            Xoá vai trò <strong>{deleteTarget?.name}</strong>?
          </p>
          <p className="text-xs text-neutral-500">
            User đang được gán role này sẽ mất quyền tương ứng. Không xoá được nếu còn user tham chiếu.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Huỷ</Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteRole.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteRole.isPending && <Loader2 size={13} className="animate-spin mr-1" />}
              Xoá
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

interface RoleListItemProps {
  role: RoleDTO
  selected: boolean
  dirty: boolean
  onSelect: () => void
  onEdit: () => void
  onClone: () => void
  onDelete: () => void
}

function RoleListItem({ role, selected, dirty, onSelect, onEdit, onClone, onDelete }: RoleListItemProps) {
  return (
    <div
      className={`group relative rounded-lg border transition-all ${
        selected
          ? 'border-primary-300 bg-primary-50/70 shadow-sm'
          : 'border-transparent hover:border-neutral-200 hover:bg-neutral-50'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left p-2.5 pr-16"
      >
        <div className="flex items-center gap-2">
          <div className={`w-1 h-8 rounded-full shrink-0 ${selected ? 'bg-primary-600' : 'bg-transparent'}`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-semibold truncate ${selected ? 'text-primary-800' : 'text-neutral-800'}`}>
                {role.name}
              </span>
              {dirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Có thay đổi chưa lưu" />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-neutral-500">
              <code className="font-mono">{role.code}</code>
              <span className="text-neutral-300">·</span>
              <span className="inline-flex items-center px-1 py-px text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 rounded">
                {role.appCode}
              </span>
            </div>
          </div>
        </div>
      </button>
      {/* Hover actions */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClone() }}
          className="p-1 rounded text-neutral-400 hover:text-primary-600 hover:bg-white"
          title="Nhân bản"
        >
          <Copy size={11} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          className="p-1 rounded text-neutral-400 hover:text-primary-600 hover:bg-white"
          title="Sửa"
        >
          <Edit size={11} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-white"
          title="Xoá"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

interface MatrixNodeProps {
  node: any
  depth: number
  expandedGroups: Set<string>
  onToggleExpand: (code: string) => void
  selectedMenus: Set<string>
  onToggleMenu: (code: string) => void
  onToggleGroup: (node: any, checked: boolean) => void
  isGroupChecked: (node: any) => 'all' | 'partial' | 'none'
}

function MatrixNode({
  node, depth, expandedGroups, onToggleExpand, selectedMenus, onToggleMenu, onToggleGroup, isGroupChecked,
}: MatrixNodeProps) {
  const isGroup = node.children && node.children.length > 0
  const expanded = expandedGroups.has(node.code)
  const state = isGroup ? isGroupChecked(node) : (selectedMenus.has(node.code) ? 'all' : 'none')

  return (
    <div>
      <div
        className="group flex items-center gap-2 py-1.5 pr-2 rounded-md hover:bg-neutral-50"
        style={{ paddingLeft: `${depth * 20 + 4}px` }}
      >
        {/* Toggle expand */}
        <button
          type="button"
          onClick={() => isGroup && onToggleExpand(node.code)}
          className={`w-4 h-4 shrink-0 flex items-center justify-center rounded ${
            isGroup ? 'text-neutral-400 hover:text-primary-600' : 'text-transparent cursor-default'
          }`}
        >
          {isGroup ? (
            expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />
          ) : (
            <span className="w-1 h-1 rounded-full bg-neutral-300" />
          )}
        </button>

        {/* Checkbox */}
        <TriStateCheckbox
          state={state as any}
          onClick={() => {
            if (isGroup) onToggleGroup(node, state !== 'all')
            else onToggleMenu(node.code)
          }}
        />

        {/* Icon + name */}
        <div className={`w-5 h-5 shrink-0 flex items-center justify-center rounded ${isGroup ? 'text-primary-600' : 'text-neutral-400'}`}>
          {isGroup ? <Folder size={12} /> : <FileText size={12} />}
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={`text-sm truncate ${state === 'all' ? 'font-semibold text-neutral-800' : 'text-neutral-700'}`}>
            {node.name}
          </span>
          <code className="hidden sm:inline text-[10px] font-mono text-neutral-400 truncate">
            {node.code}
          </code>
          {node.feUrl && (
            <code className="hidden md:inline text-[10px] font-mono text-neutral-300 truncate">
              {node.feUrl}
            </code>
          )}
        </div>
      </div>

      {isGroup && expanded && (
        <div className="ml-2 border-l border-dashed border-neutral-200">
          {node.children.map((c: any) => (
            <MatrixNode
              key={c.code}
              node={c}
              depth={depth + 1}
              expandedGroups={expandedGroups}
              onToggleExpand={onToggleExpand}
              selectedMenus={selectedMenus}
              onToggleMenu={onToggleMenu}
              onToggleGroup={onToggleGroup}
              isGroupChecked={isGroupChecked}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface TriStateCheckboxProps {
  state: 'all' | 'partial' | 'none'
  onClick: () => void
}
function TriStateCheckbox({ state, onClick }: TriStateCheckboxProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
        state === 'all'
          ? 'bg-primary-600 border-primary-600 text-white'
          : state === 'partial'
          ? 'bg-primary-100 border-primary-400 text-primary-700'
          : 'bg-white border-neutral-300 hover:border-primary-400'
      }`}
      title={state === 'all' ? 'Đã chọn tất cả' : state === 'partial' ? 'Chọn một phần' : 'Chưa chọn'}
    >
      {state === 'all' && (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M2.5 6l2.5 2.5L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {state === 'partial' && <div className="w-1.5 h-0.5 bg-primary-700 rounded-full" />}
    </button>
  )
}

interface StatChipProps {
  label: string
  value: string
  icon: LucideIcon
  tone: 'neutral' | 'green' | 'blue' | 'amber'
}
function StatChip({ label, value, icon: Icon, tone }: StatChipProps) {
  const toneMap = {
    neutral: 'bg-white border-neutral-200 [&_.ico]:bg-neutral-100 [&_.ico]:text-neutral-600',
    green:   'bg-emerald-50/60 border-emerald-200 [&_.ico]:bg-emerald-100 [&_.ico]:text-emerald-600',
    blue:    'bg-blue-50/60 border-blue-200 [&_.ico]:bg-blue-100 [&_.ico]:text-blue-600',
    amber:   'bg-amber-50/60 border-amber-200 [&_.ico]:bg-amber-100 [&_.ico]:text-amber-600',
  }[tone]
  return (
    <div className={`p-3 rounded-xl border flex items-center gap-3 ${toneMap}`}>
      <div className="ico w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 truncate">{label}</div>
        <div className="text-sm font-bold text-neutral-900 tabular-nums truncate mt-0.5">{value}</div>
      </div>
    </div>
  )
}

function EmptyPane({ onCreate, hasAnyRole }: { onCreate: () => void; hasAnyRole: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-4">
        <ShieldCheck size={28} className="text-primary-700" />
      </div>
      <h3 className="text-base font-bold text-neutral-800">
        {hasAnyRole ? 'Chọn một vai trò để phân quyền' : 'Chưa có vai trò nào'}
      </h3>
      <p className="text-sm text-neutral-500 mt-1 max-w-md">
        {hasAnyRole
          ? 'Bấm vào một vai trò ở panel bên trái để xem chi tiết và cấu hình menu được truy cập.'
          : 'Tạo vai trò đầu tiên để bắt đầu phân quyền cho user trong hệ thống.'}
      </p>
      {!hasAnyRole && (
        <Button onClick={onCreate} className="mt-4 gap-2 bg-primary-700 hover:bg-primary-800 text-white">
          <Plus size={14} /> Tạo vai trò đầu tiên
        </Button>
      )}
    </div>
  )
}
