import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, Edit, Trash2, Eye, List, Users,
  ZoomIn, ZoomOut, Maximize2, ChevronDown, ChevronRight, GitBranch,
  Building2, X,
} from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import {
  AppModal,
  Switch,
  Button,
  PageHeader,
  PageGuideButton,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Select,
  IconActionButton,
  AppTooltip,
  type PageGuideConfig,
} from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { DepartmentDetailDrawer } from '../components/DepartmentDetailDrawer'
import { organizationApi } from '@/modules/qtht/services/qthtApi'
import { personApi } from '@/modules/qlns/services/personApi'
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useActivateDepartment,
  useDeactivateDepartment,
} from '../hooks/useQtht'
import { depSchema } from '../constants/schema'

const DEPARTMENTS_GUIDE: PageGuideConfig = {
  title: 'Sơ đồ Tổ chức',
  subtitle:
    'Cấu trúc phòng ban, quản lý trưởng/phó phòng và phân bổ nhân sự theo hierarchy.',
  sections: [
    {
      heading: 'Thao tác cơ bản',
      type: 'steps',
      steps: [
        {
          title: 'Chuyển chế độ xem',
          description:
            'Cây phòng ban — hierarchy rõ connector. Sơ đồ nhân sự — xem người theo phòng. Danh sách — tìm kiếm, lọc.',
        },
        {
          title: 'Thêm phòng ban',
          description:
            'Chọn phòng cha (hoặc để trống nếu là root) → điền mã, tên, email liên hệ, chọn Trưởng/Phó phòng (từ danh sách Nhân sự).',
        },
        {
          title: 'Chuyển nhân sự',
          description:
            'Ở chế độ "Nhân sự", kéo-thả (hoặc chỉnh trực tiếp trong hồ sơ nhân viên) để đổi phòng ban. Lịch sử chuyển phòng được ghi audit.',
        },
      ],
    },
    {
      heading: 'Mẹo',
      type: 'tips',
      tips: [
        'Đặt mã phòng ban ngắn gọn, phản ánh chức năng (VD: HR, IT, KD1, KD2) — dùng cho báo cáo và bút toán kế toán.',
        'Deactivate phòng ban khi tái cấu trúc — không xóa nếu còn nhân viên hoặc dữ liệu liên quan.',
        'Hover mọi node trên cây để Thêm con / Sửa / Xoá; click dòng để mở drawer chi tiết.',
      ],
    },
  ],
}

const defaultFormValues = {
  code: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  description: '',
  organizationId: '',
  parentId: '',
  status: true,
}

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  ACTIVE: {
    text: 'Hoạt động',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  INACTIVE: {
    text: 'Ngừng',
    className: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  },
}

export function DepartmentsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [createPrefill, setCreatePrefill] = useState<Partial<typeof defaultFormValues> | null>(null)
  const [detailDept, setDetailDept] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [viewMode, setViewMode] = useState<'tree' | 'table' | 'personnel'>('tree')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all')
  const [scale, setScale] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const zoomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = zoomRef.current
    if (!el || viewMode !== 'personnel') return
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        setScale((prev) => Math.max(0.1, Math.min(3, prev + (e.deltaY > 0 ? -0.1 : 0.1))))
      }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [viewMode])

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    isPanning.current = true
    panStart.current = { x: e.clientX, y: e.clientY, panX, panY }
  }, [panX, panY])

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return
    setPanX(panStart.current.panX + e.clientX - panStart.current.x)
    setPanY(panStart.current.panY + e.clientY - panStart.current.y)
  }, [])

  const handlePanEnd = useCallback(() => {
    isPanning.current = false
  }, [])

  const resetZoom = useCallback(() => {
    setScale(1)
    setPanX(0)
    setPanY(0)
  }, [])

  const queryClient = useQueryClient()
  const { data: rawData, isLoading, isError, isFetching, refetch } = useDepartments()
  const { data: orgList } = useQuery({
    queryKey: ['organizations-combobox'],
    queryFn: () => organizationApi.getCombobox(),
  })
  const { data: personsData } = useQuery({
    queryKey: ['persons-all'],
    queryFn: () => personApi.getAll({ pageNumber: 0, pageSize: 9999 }),
    select: (res: any) => res?.data?.items ?? [],
  })
  const createReq = useCreateDepartment()
  const updateReq = useUpdateDepartment()
  const deleteReq = useDeleteDepartment()
  const activateReq = useActivateDepartment()
  const deactivateReq = useDeactivateDepartment()

  const orgOptions = Array.isArray(orgList) ? orgList.map((o: any) => ({ value: o.value, label: o.label })) : []
  const dataList = rawData || []

  const deptOptions = useMemo(() => {
    const exclude = selectedItem?.id
      ? collectDescendants(selectedItem.id, dataList)
      : new Set<string>()
    return dataList
      .filter((d: any) => !exclude.has(d.id))
      .map((d: any) => ({ value: d.id, label: `${d.code} - ${d.name}` }))
  }, [dataList, selectedItem])

  const filteredDataList = useMemo(() => {
    let list = dataList
    if (statusFilter !== 'all') {
      list = list.filter((item: any) => item.status === statusFilter)
    }
    if (!searchQuery.trim()) return list
    const query = searchQuery.toLowerCase().trim()
    const matches = list.filter((item: any) => {
      return (
        item.name?.toLowerCase().includes(query) ||
        item.code?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.organizationName?.toLowerCase().includes(query)
      )
    })
    const result = new Set<any>()
    const addWithAncestors = (item: any) => {
      if (!item || result.has(item)) return
      result.add(item)
      if (item.parentId) {
        const parent = dataList.find((p: any) => p.id === item.parentId)
        if (parent) addWithAncestors(parent)
      }
    }
    matches.forEach(addWithAncestors)
    return Array.from(result)
  }, [dataList, searchQuery, statusFilter])

  const treeData = useMemo(
    () => buildTree(filteredDataList, dataList),
    [filteredDataList, dataList],
  )

  const personsByDept = useMemo(() => {
    const map = new Map<string, any[]>()
    ;(personsData || []).forEach((p: any) => {
      const deptId = p.departmentId
      if (deptId) {
        if (!map.has(deptId)) map.set(deptId, [])
        map.get(deptId)!.push(p)
      }
    })
    return map
  }, [personsData])

  const personnelTree = useMemo(() => {
    const buildNode = (deptNode: any): any[] => {
      const employees = personsByDept.get(deptNode.id) || []
      const manager = employees.find((p: any) => p.id === deptNode.managerId)
      const deputy = employees.find((p: any) => p.id === deptNode.deputyManagerId)
      const staff = employees.filter(
        (p: any) => p.id !== deptNode.managerId && p.id !== deptNode.deputyManagerId,
      )

      const nodes: any[] = []
      const childDeptNodes = deptNode.children ? deptNode.children.flatMap((c: any) => buildNode(c)) : []

      if (manager) {
        const node: any = {
          id: manager.id,
          name: manager.name,
          role: 'Trưởng phòng',
          deptName: deptNode.name,
          children: [...childDeptNodes],
        }
        if (deputy) {
          node.children.unshift({
            id: deputy.id,
            name: deputy.name,
            role: 'Phó phòng',
            deptName: deptNode.name,
            children: [],
          })
        }
        staff.forEach((p: any) => {
          node.children.push({
            id: p.id,
            name: p.name,
            role: p.jobTitle || 'Nhân viên',
            deptName: deptNode.name,
            children: [],
          })
        })
        nodes.push(node)
      } else {
        if (deputy) {
          nodes.push({
            id: deputy.id,
            name: deputy.name,
            role: 'Phó phòng',
            deptName: deptNode.name,
            children: [...childDeptNodes],
          })
        }
        staff.forEach((p: any) => {
          nodes.push({
            id: p.id,
            name: p.name,
            role: p.jobTitle || 'Nhân viên',
            deptName: deptNode.name,
            children: [],
          })
        })
        nodes.push(...childDeptNodes)
      }

      return nodes
    }

    return treeData.flatMap((root: any) => buildNode(root))
  }, [treeData, personsByDept])

  const stats = useMemo(() => ({
    total: dataList.length,
    active: dataList.filter((d: any) => d.status === 'ACTIVE').length,
    people: personsData?.length || 0,
  }), [dataList, personsData])

  const handleOpenCreate = (parent?: any) => {
    setSelectedItem(null)
    setCreatePrefill(
      parent
        ? {
            parentId: parent.id,
            organizationId: parent.organizationId || '',
          }
        : null,
    )
    setModalOpen(true)
  }

  const handleOpenEdit = (node: any) => {
    setCreatePrefill(null)
    setSelectedItem(node)
    setModalOpen(true)
  }

  const handleDelete = (node: any) => {
    setDeleteTarget(node)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedItem(null)
    setCreatePrefill(null)
  }

  const handleSubmit = (values: any) => {
    const payload = { ...values, status: values.status ? 'ACTIVE' : 'INACTIVE' }
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: payload }, { onSuccess: handleCloseModal })
    } else {
      createReq.mutate(payload, { onSuccess: handleCloseModal })
    }
  }

  const handleToggleStatus = (row: any) => {
    const nextStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    queryClient.setQueryData(['departments'], (old: any) => {
      if (!old?.items) return old
      return {
        ...old,
        items: old.items.map((item: any) =>
          item.id === row.id ? { ...item, status: nextStatus } : item,
        ),
      }
    })
    if (detailDept?.id === row.id) {
      setDetailDept({ ...detailDept, status: nextStatus })
    }
    if (row.status === 'ACTIVE') deactivateReq.mutate(row.id)
    else activateReq.mutate(row.id)
  }

  const formDefaults = selectedItem
    ? { ...defaultFormValues, ...selectedItem, status: selectedItem.status === 'ACTIVE' }
    : { ...defaultFormValues, ...createPrefill }

  const hasActiveFilters = Boolean(searchQuery.trim()) || statusFilter !== 'all'

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Sơ đồ tổ chức"
        description="Quản lý cơ cấu phòng ban, trưởng/phó phòng và phân bổ nhân sự."
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <PageGuideButton guide={DEPARTMENTS_GUIDE} />
            <Button onClick={() => handleOpenCreate()} className="gap-2">
              <Plus size={16} /> Thêm phòng ban
            </Button>
          </div>
        }
      />

      {!isLoading && !isError && dataList.length > 0 && (
        <p className="text-xs text-neutral-500 tabular-nums">
          {stats.total} phòng ban · {stats.active} hoạt động · {stats.people} nhân sự
        </p>
      )}

      <div className="sticky top-0 z-10 -mx-6 px-6 py-2 bg-neutral-50/95 backdrop-blur border-y border-neutral-200/80">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              placeholder="Tìm mã, tên, email, tổ chức…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full pl-8 pr-3 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
              aria-label="Tìm phòng ban"
            />
          </div>

          <div className="min-w-[140px]">
            <Select
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'ACTIVE', label: 'Hoạt động' },
                { value: 'INACTIVE', label: 'Ngừng' },
              ]}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as typeof statusFilter)}
              placeholder="Trạng thái"
              aria-label="Lọc theo trạng thái"
              showSearch={false}
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
            >
              <X size={12} className="mr-1" /> Xoá lọc
            </Button>
          )}

          <div className="ml-auto flex items-center bg-white border border-neutral-200 rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`px-2.5 h-8 rounded text-xs font-semibold inline-flex items-center gap-1 transition ${
                viewMode === 'tree' ? 'bg-primary-50 text-primary-700' : 'text-neutral-500'
              }`}
              aria-label="Chế độ cây phòng ban"
            >
              <GitBranch size={13} /> Cây phòng ban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('personnel')}
              className={`px-2.5 h-8 rounded text-xs font-semibold inline-flex items-center gap-1 transition ${
                viewMode === 'personnel' ? 'bg-primary-50 text-primary-700' : 'text-neutral-500'
              }`}
              aria-label="Chế độ sơ đồ nhân sự"
            >
              <Users size={13} /> Nhân sự
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 h-8 rounded text-xs font-semibold inline-flex items-center gap-1 transition ${
                viewMode === 'table' ? 'bg-primary-50 text-primary-700' : 'text-neutral-500'
              }`}
              aria-label="Chế độ danh sách"
            >
              <List size={13} /> Danh sách
            </button>
          </div>

          <span className="text-xs text-neutral-500 tabular-nums">
            {filteredDataList.length} bản ghi{hasActiveFilters ? ' (đã lọc)' : ''}
          </span>
        </div>
      </div>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được phòng ban"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : !isLoading && filteredDataList.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Building2}
            title={dataList.length === 0 ? 'Chưa có phòng ban nào' : 'Không có bản ghi phù hợp bộ lọc'}
            description={
              dataList.length === 0
                ? 'Tạo phòng ban đầu tiên để dựng hierarchy tổ chức.'
                : 'Thử đổi bộ lọc hoặc xoá lọc.'
            }
            action={
              dataList.length === 0
                ? { label: 'Thêm phòng ban đầu tiên', onClick: () => handleOpenCreate() }
                : undefined
            }
          />
        </div>
      ) : viewMode === 'tree' ? (
        isLoading ? (
          <div className="p-12 flex items-center justify-center bg-white border border-neutral-200 rounded-xl">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
        <div className="px-3 py-3 bg-white border border-neutral-200 rounded-xl">
          <div className="dept-tree">
            {treeData.map((node: any, idx: number) => (
              <DeptTreeNode
                key={node.id}
                node={node}
                depth={0}
                isLast={idx === treeData.length - 1}
                memberCount={(personsByDept.get(node.id) || []).length}
                personsByDept={personsByDept}
                onView={setDetailDept}
                onEdit={handleOpenEdit}
                onAddChild={handleOpenCreate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
        )
      ) : viewMode === 'personnel' ? (
        <div
          ref={zoomRef}
          className="w-full overflow-hidden p-10 border border-neutral-200 rounded-xl bg-white min-h-[450px] relative select-none"
          style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
        >
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-border p-1.5">
            <IconActionButton tooltip="Phóng to" onClick={() => setScale((s) => Math.min(3, s + 0.2))}>
              <ZoomIn size={16} />
            </IconActionButton>
            <span className="text-xs font-mono text-neutral-400 min-w-[36px] text-center select-none">{Math.round(scale * 100)}%</span>
            <IconActionButton tooltip="Thu nhỏ" onClick={() => setScale((s) => Math.max(0.1, s - 0.2))}>
              <ZoomOut size={16} />
            </IconActionButton>
            <div className="w-px h-4 bg-neutral-200 mx-0.5" />
            <IconActionButton tooltip="Khôi phục" onClick={resetZoom}>
              <Maximize2 size={16} />
            </IconActionButton>
          </div>

          {personnelTree.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Chưa có nhân sự trên sơ đồ"
              description="Gán nhân viên vào phòng ban (và trưởng phòng nếu có) để hiển thị hierarchy."
            />
          ) : (
            <div
              style={{ transform: `scale(${scale}) translate(${panX}px, ${panY}px)`, transformOrigin: '0 0' }}
              className="flex gap-10 items-start justify-center"
            >
              {personnelTree.map((node: any, idx: number) => (
                <PersonnelNode key={node.id + idx} node={node} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <AppTable
            data={filteredDataList}
            isLoading={isLoading}
            showSearch={false}
            density="compact"
            loadingRows={6}
            columns={[
              {
                title: 'Mã',
                dataIndex: 'code',
                render: (v: string) => (
                  <span className="font-mono text-xs font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                    {v}
                  </span>
                ),
              },
              {
                title: 'Tên phòng ban',
                dataIndex: 'name',
                render: (_: any, row: any) => (
                  <button type="button" onClick={() => setDetailDept(row)} className="text-left group">
                    <div className="font-semibold text-neutral-800 group-hover:text-primary-700 transition-colors">
                      {row.name}
                    </div>
                    {row.email && (
                      <div className="text-[11px] text-neutral-400 truncate max-w-[220px]">{row.email}</div>
                    )}
                  </button>
                ),
              },
              {
                title: 'Tổ chức',
                dataIndex: 'organizationName',
                render: (v: string) => v || '—',
              },
              {
                title: 'Nhân sự',
                dataIndex: 'id',
                render: (_: any, row: any) => (
                  <span className="text-xs tabular-nums text-neutral-600">
                    {(personsByDept.get(row.id) || []).length}
                  </span>
                ),
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                render: (_: any, row: any) => (
                  <div className="flex items-center gap-2">
                    <Switch checked={row.status === 'ACTIVE'} onChange={() => handleToggleStatus(row)} />
                    <span className={`text-xs font-medium ${row.status === 'ACTIVE' ? 'text-emerald-700' : 'text-neutral-500'}`}>
                      {row.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng'}
                    </span>
                  </div>
                ),
              },
              {
                title: 'Thao tác',
                dataIndex: 'id',
                width: 160,
                render: (_: any, row: any) => (
                  <div className="flex items-center gap-1">
                    <IconActionButton tooltip="Xem chi tiết" tone="blue" onClick={() => setDetailDept(row)}>
                      <Eye size={14} />
                    </IconActionButton>
                    <IconActionButton tooltip="Sửa" tone="primary" onClick={() => handleOpenEdit(row)}>
                      <Edit size={14} />
                    </IconActionButton>
                    <IconActionButton tooltip="Xoá" tone="rose" onClick={() => handleDelete(row)}>
                      <Trash2 size={14} />
                    </IconActionButton>
                  </div>
                ),
              },
            ]}
          />
      )}

      <AppModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={selectedItem ? 'Sửa thông tin phòng ban' : 'Thêm phòng ban mới'}
        maxWidth="4xl"
      >
        <AppForm
          key={selectedItem?.id || `new-${createPrefill?.parentId || 'root'}`}
          schema={depSchema}
          defaultValues={formDefaults}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={createReq.isPending || updateReq.isPending}
          fields={[
            { name: 'code', label: 'Mã phòng ban', required: true },
            { name: 'name', label: 'Tên phòng ban', required: true },
            { name: 'organizationId', label: 'Tổ chức', type: 'select', options: orgOptions },
            { name: 'parentId', label: 'Phòng ban cha', type: 'select', options: deptOptions },
            { name: 'email', label: 'Email' },
            { name: 'phone', label: 'Số điện thoại' },
            { name: 'status', label: 'Trạng thái', type: 'switch' },
            { name: 'address', label: 'Địa chỉ' },
            { name: 'description', label: 'Mô tả' },
          ]}
        />
      </AppModal>

      <DepartmentDetailDrawer
        isOpen={!!detailDept}
        dept={detailDept}
        allDepts={dataList}
        persons={personsData || []}
        onClose={() => setDetailDept(null)}
        onEdit={(d) => {
          setDetailDept(null)
          handleOpenEdit(d)
        }}
        onDelete={(d) => {
          setDetailDept(null)
          handleDelete(d)
        }}
        onAddChild={(d) => {
          setDetailDept(null)
          handleOpenCreate(d)
        }}
        onToggleStatus={(d) => handleToggleStatus(d)}
        onSelectChild={(child) => setDetailDept(child)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteReq.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          })
        }}
        title={`Xóa phòng ban "${deleteTarget?.name || ''}"?`}
        message="Phòng ban sẽ bị xóa. Không nên xóa nếu còn nhân viên hoặc dữ liệu liên quan — cân nhắc deactivate thay thế."
        confirmText="Xóa"
        cancelText="Huỷ"
        variant="danger"
        isLoading={deleteReq.isPending}
      />
    </div>
  )
}

// ============================================================
// Tree Node — connector + indent + actions (mirror OrgTreeNode)
// ============================================================

interface DeptTreeNodeProps {
  node: any
  depth: number
  isLast: boolean
  memberCount: number
  personsByDept: Map<string, any[]>
  onView: (d: any) => void
  onEdit: (d: any) => void
  onAddChild: (parent: any) => void
  onDelete: (d: any) => void
}

function DeptTreeNode({
  node, depth, isLast, memberCount, personsByDept, onView, onEdit, onAddChild, onDelete,
}: DeptTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = Array.isArray(node.children) && node.children.length > 0
  const statusCfg = STATUS_LABEL[node.status || 'ACTIVE'] || STATUS_LABEL.INACTIVE
  const isRoot = depth === 0

  return (
    <div className={`relative ${isRoot ? '' : 'pl-6'}`}>
      {!isRoot && (
        <>
          <span
            aria-hidden
            className={`pointer-events-none absolute left-0 top-0 w-px bg-neutral-300 ${
              isLast ? 'h-5' : 'bottom-0'
            }`}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-5 h-px w-6 bg-neutral-300"
          />
        </>
      )}

      <div
        className={`group relative flex items-center gap-1.5 rounded-md transition-colors ${
          isRoot
            ? 'bg-primary-50/60 hover:bg-primary-50 border border-primary-100 px-1.5'
            : 'hover:bg-neutral-50 pr-1'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) setExpanded((v) => !v)
          }}
          aria-label={hasChildren ? (expanded ? 'Thu gọn' : 'Mở rộng') : undefined}
          className={`w-5 h-5 shrink-0 flex items-center justify-center rounded ${
            hasChildren
              ? 'text-neutral-500 hover:text-primary-700 hover:bg-primary-100'
              : 'text-neutral-300 cursor-default'
          }`}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={14} strokeWidth={2.25} /> : <ChevronRight size={14} strokeWidth={2.25} />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
          )}
        </button>

        <AppTooltip content="Xem chi tiết">
          <button
            type="button"
            onClick={() => onView(node)}
            aria-label="Xem chi tiết"
            className={`w-7 h-7 rounded-md bg-gradient-to-br ${pickTone(node.name)} flex items-center justify-center text-white text-[10px] font-bold shrink-0 ring-1 ring-black/5`}
          >
            {getInitials(node.name)}
          </button>
        </AppTooltip>

        <button
          type="button"
          onClick={() => onView(node)}
          className="flex-1 min-w-0 flex items-center gap-2 py-1.5 pr-1 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[13px] font-semibold text-neutral-800 truncate group-hover:text-primary-700 transition-colors">
                {node.name}
              </span>
              <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                {node.code}
              </span>
              {isRoot && !node.parentId && (
                <span className="inline-flex items-center px-1 py-px text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 rounded shrink-0">
                  ★ Root
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-px text-[11px] text-neutral-500 min-w-0">
              {node.organizationName && (
                <span className="truncate max-w-[160px]">{node.organizationName}</span>
              )}
              {node.organizationName && <span className="text-neutral-300">·</span>}
              <span className="tabular-nums shrink-0">{memberCount} NS</span>
              {hasChildren && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="text-primary-700 font-medium shrink-0">
                    {node.children.length} phòng con
                  </span>
                </>
              )}
            </div>
          </div>
        </button>

        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border shrink-0 ${statusCfg.className}`}>
          {statusCfg.text}
        </span>

        <div className="flex items-center gap-0.5 shrink-0 opacity-45 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <IconActionButton
            tooltip="Thêm phòng ban con"
            tone="primary"
            className="text-neutral-500 hover:text-primary-700 hover:bg-primary-50"
            onClick={(e) => { e.stopPropagation(); onAddChild(node) }}
          >
            <Plus size={13} />
          </IconActionButton>
          <IconActionButton
            tooltip="Sửa"
            tone="primary"
            className="text-neutral-500 hover:text-primary-700 hover:bg-primary-50"
            onClick={(e) => { e.stopPropagation(); onEdit(node) }}
          >
            <Edit size={13} />
          </IconActionButton>
          <IconActionButton
            tooltip="Xoá"
            tone="rose"
            className="text-neutral-500"
            onClick={(e) => { e.stopPropagation(); onDelete(node) }}
          >
            <Trash2 size={13} />
          </IconActionButton>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="mt-0.5">
          {node.children.map((child: any, idx: number) => (
            <DeptTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isLast={idx === node.children.length - 1}
              memberCount={(personsByDept.get(child.id) || []).length}
              personsByDept={personsByDept}
              onView={onView}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Personnel chart node (giữ sơ đồ nhân sự)
// ============================================================

function PersonnelNode({ node, depth = 0 }: { node: any; depth?: number }) {
  const hasChildren = node.children && node.children.length > 0
  const isManager = node.role === 'Trưởng phòng'
  const isDeputy = node.role === 'Phó phòng'
  return (
    <div className="flex flex-col items-center">
      <div className={`relative rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 w-56 text-center group ${
        isManager ? 'border-amber-300 border-t-2 border-t-amber-500' :
        isDeputy ? 'border-sky-200 border-t-2 border-t-sky-400' :
        'border-neutral-200 border-t border-t-neutral-300'
      }`}>
        <div className="p-3">
          <p className={`text-sm font-semibold truncate ${isManager ? 'text-amber-800' : isDeputy ? 'text-sky-700' : 'text-neutral-700'}`}>
            {node.name}
          </p>
          <p className={`text-[10px] mt-0.5 ${isManager ? 'text-amber-600' : isDeputy ? 'text-sky-500' : 'text-neutral-400'}`}>
            {node.role}
          </p>
          {node.deptName && (
            <p className="text-[9px] text-neutral-400 mt-0.5 truncate">{node.deptName}</p>
          )}
        </div>
      </div>
      {hasChildren && (
        <div className="flex flex-col items-center mt-3 w-full">
          <div className="w-0.5 h-4 bg-neutral-300" />
          <div className="flex gap-4 relative pt-3">
            {node.children.length > 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-180px)] h-0.5 bg-neutral-300" />
            )}
            {node.children.map((child: any, idx: number) => (
              <div key={child.id + child.role + idx} className="relative flex flex-col items-center">
                <div className="absolute -top-3 w-0.5 h-3 bg-neutral-300" />
                <PersonnelNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

function buildTree(filteredList: any[], allList: any[]): any[] {
  const nodeMap = new Map<string, any>()
  filteredList.forEach((item) => nodeMap.set(item.id, { ...item, children: [] }))

  filteredList.forEach((item) => {
    if (item.parentId && !nodeMap.has(item.parentId)) {
      const parent = allList.find((o) => o.id === item.parentId)
      if (parent) nodeMap.set(parent.id, { ...parent, children: [], _partial: true })
    }
  })

  const roots: any[] = []
  nodeMap.forEach((node) => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortTree = (nodes: any[]) => {
    nodes.sort((a, b) => {
      const oi = (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
      if (oi !== 0) return oi
      return String(a.name || '').localeCompare(String(b.name || ''), 'vi')
    })
    nodes.forEach((n) => sortTree(n.children))
  }
  sortTree(roots)
  return roots
}

function collectDescendants(id: string, allList: any[]): Set<string> {
  const set = new Set<string>([id])
  let changed = true
  while (changed) {
    changed = false
    for (const o of allList) {
      if (o.parentId && set.has(o.parentId) && !set.has(o.id)) {
        set.add(o.id)
        changed = true
      }
    }
  }
  return set
}

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function pickTone(seed?: string): string {
  const tones = [
    'from-emerald-500 to-teal-600',
    'from-primary-500 to-emerald-600',
    'from-teal-500 to-emerald-700',
    'from-emerald-600 to-green-700',
    'from-lime-600 to-emerald-600',
    'from-cyan-600 to-teal-700',
  ]
  const s = (seed || '?').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return tones[s % tones.length]
}
