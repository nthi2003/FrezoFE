import { Fragment, useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, List, Users,
  ZoomIn, ZoomOut, Maximize2, ChevronRight, ChevronsDownUp, ChevronsUpDown, GitBranch,
  Building2,
} from 'lucide-react'
import { cn } from '@frezo/utils'
import { AppTable } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  AppModal,
  Switch,
  Button,
  PageHeader,
  PageGuideButton,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
  IconActionButton,
  RowActions,
  type PageGuideConfig,
  type StatusConfig,
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

const STATUS_CONFIG: Record<string, StatusConfig> = {
  ACTIVE: { label: 'Hoạt động', color: 'success' },
  INACTIVE: { label: 'Ngừng', color: 'neutral' },
}

/** Trạng thái thu gọn của cây được nhớ giữa các lần vào trang. */
const COLLAPSED_STORAGE_KEY = 'frezo.qtht.departments.collapsed'

/** Bậc thụt lề + toạ độ đường nối của cây (px) — dùng chung cho row và guide line. */
const TREE_INDENT = 24
const TREE_PADDING_LEFT = 12
const guideX = (level: number) => TREE_PADDING_LEFT + level * TREE_INDENT + 12

export function DepartmentsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [createPrefill, setCreatePrefill] = useState<Partial<typeof defaultFormValues> | null>(null)
  const [detailDept, setDetailDept] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [viewMode, setViewMode] = useState<'tree' | 'table' | 'personnel'>('tree')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all')
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      return new Set<string>(Array.isArray(parsed) ? parsed : [])
    } catch {
      return new Set<string>()
    }
  })
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

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(Array.from(collapsedIds)))
    } catch {
      /* localStorage bị chặn — chấp nhận mất trạng thái expand */
    }
  }, [collapsedIds])

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

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

  /** Id của mọi node có phòng con — dùng cho nút mở rộng / thu gọn tất cả. */
  const branchIds = useMemo(() => {
    const ids: string[] = []
    const walk = (nodes: any[]) => {
      nodes.forEach((n) => {
        if (n.children?.length) {
          ids.push(n.id)
          walk(n.children)
        }
      })
    }
    walk(treeData)
    return ids
  }, [treeData])

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

  const isSearching = Boolean(searchQuery.trim())
  const hasActiveFilters = isSearching || statusFilter !== 'all'
  const allCollapsed = branchIds.length > 0 && branchIds.every((id) => collapsedIds.has(id))

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

      <FilterBar
        selects={[
          {
            id: 'status',
            label: 'Trạng thái',
            value: statusFilter,
            onChange: (v) => setStatusFilter(v as typeof statusFilter),
            options: [
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Hoạt động' },
              { value: 'INACTIVE', label: 'Ngừng' },
            ],
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onClear={() => {
          setSearchQuery('')
          setStatusFilter('all')
        }}
        countLabel={`${filteredDataList.length} bản ghi${hasActiveFilters ? ' (đã lọc)' : ''}`}
        extra={
          <>
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

            <div className="inline-flex items-center bg-white border border-neutral-200 rounded-md p-0.5">
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
          </>
        }
      />

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
          <DeptTreeSkeleton />
        ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-3 py-2 bg-neutral-50 border-b border-neutral-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Cây phòng ban
            </span>
            {branchIds.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setCollapsedIds(allCollapsed ? new Set<string>() : new Set(branchIds))
                }
                className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-xs font-medium text-neutral-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
              >
                {allCollapsed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
                {allCollapsed ? 'Mở rộng tất cả' : 'Thu gọn tất cả'}
              </button>
            )}
          </div>

          <div role="tree" aria-label="Cây phòng ban">
            {treeData.map((node: any, idx: number) => (
              <DeptTreeNode
                key={node.id}
                node={node}
                depth={0}
                guides={[]}
                isFirstRow={idx === 0}
                hasNextSibling={idx < treeData.length - 1}
                activeId={detailDept?.id}
                collapsedIds={collapsedIds}
                forceExpand={isSearching}
                onToggleCollapse={handleToggleCollapse}
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
                  <RowActions
                    actions={[
                      { kind: 'view', onClick: () => setDetailDept(row) },
                      { kind: 'edit', onClick: () => handleOpenEdit(row) },
                      { kind: 'delete', onClick: () => handleDelete(row) },
                    ]}
                  />
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
// Tree Node — row nền trắng, divider mảnh, guide line thể hiện cha–con
// ============================================================

interface DeptTreeNodeProps {
  node: any
  depth: number
  /** guides[i] = tổ tiên ở cấp i còn anh em phía sau ⇒ kẻ đường dọc xuyên row. */
  guides: boolean[]
  /** Row đầu tiên của cây — không kẻ divider phía trên. */
  isFirstRow: boolean
  hasNextSibling: boolean
  activeId?: string | null
  collapsedIds: Set<string>
  /** Khi đang tìm kiếm, mở hết nhánh để thấy kết quả sâu trong cây. */
  forceExpand: boolean
  onToggleCollapse: (id: string) => void
  personsByDept: Map<string, any[]>
  onView: (d: any) => void
  onEdit: (d: any) => void
  onAddChild: (parent: any) => void
  onDelete: (d: any) => void
}

function DeptTreeNode({
  node, depth, guides, isFirstRow, hasNextSibling, activeId, collapsedIds, forceExpand,
  onToggleCollapse, personsByDept, onView, onEdit, onAddChild, onDelete,
}: DeptTreeNodeProps) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0
  const expanded = hasChildren && (forceExpand || !collapsedIds.has(node.id))
  const statusCfg = STATUS_CONFIG[node.status || 'ACTIVE'] || STATUS_CONFIG.INACTIVE
  const isActive = activeId === node.id
  const memberCount = (personsByDept.get(node.id) || []).length

  const meta = [
    node.organizationName,
    `${memberCount} nhân sự`,
    hasChildren ? `${node.children.length} phòng ban con` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onView(node)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onView(node)
          }
        }}
        style={{ paddingLeft: TREE_PADDING_LEFT + depth * TREE_INDENT }}
        className={cn(
          'group relative flex items-center gap-3 pr-3 min-h-[56px] cursor-pointer transition-colors',
          'outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-300',
          !isFirstRow && 'border-t border-neutral-100',
          isActive ? 'bg-primary-50' : 'hover:bg-neutral-50',
        )}
      >
        {guides.map((ancestorHasNext, level) => {
          const x = guideX(level)
          if (level < depth - 1) {
            return ancestorHasNext ? (
              <span
                key={level}
                aria-hidden
                style={{ left: x }}
                className="pointer-events-none absolute top-0 bottom-0 w-px bg-neutral-200"
              />
            ) : null
          }
          return (
            <Fragment key={level}>
              <span
                aria-hidden
                style={{ left: x }}
                className={cn(
                  'pointer-events-none absolute top-0 w-px bg-neutral-200',
                  ancestorHasNext ? 'bottom-0' : 'h-1/2',
                )}
              />
              <span
                aria-hidden
                style={{ left: x }}
                className="pointer-events-none absolute top-1/2 h-px w-3 bg-neutral-200"
              />
            </Fragment>
          )
        })}

        {hasChildren && expanded && (
          <span
            aria-hidden
            style={{ left: guideX(depth), top: 'calc(50% + 14px)' }}
            className="pointer-events-none absolute bottom-0 w-px bg-neutral-200"
          />
        )}

        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleCollapse(node.id)
            }}
            aria-label={expanded ? `Thu gọn ${node.name}` : `Mở rộng ${node.name}`}
            aria-expanded={expanded}
            className="relative shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-primary-700 hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 transition-colors"
          >
            <ChevronRight
              size={16}
              strokeWidth={2.25}
              className={cn('transition-transform duration-150', expanded && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="shrink-0 w-6" aria-hidden />
        )}

        <span
          aria-hidden
          className={cn(
            'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold',
            avatarTone(node.code || node.name),
          )}
        >
          {getInitials(node.name)}
        </span>

        <div className="min-w-0 flex-1 py-2">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span
              className={cn(
                'truncate text-sm font-semibold transition-colors',
                isActive ? 'text-primary-800' : 'text-neutral-800 group-hover:text-primary-700',
              )}
            >
              {node.name}
            </span>
            {node.code && (
              <span className="shrink-0 text-xs text-neutral-400">· {node.code}</span>
            )}
          </div>
          {meta && <p className="mt-0.5 truncate text-xs text-neutral-500">{meta}</p>}
        </div>

        <div className="shrink-0 flex sm:w-[92px] justify-end">
          <StatusBadge {...statusCfg} />
        </div>

        <RowActions
          align="end"
          className="hidden sm:flex shrink-0 w-[100px] opacity-70 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
          actions={[
            {
              key: 'add-child',
              icon: Plus,
              tooltip: 'Thêm phòng ban con',
              onClick: () => onAddChild(node),
            },
            { kind: 'edit', onClick: () => onEdit(node) },
            { kind: 'delete', onClick: () => onDelete(node) },
          ]}
        />

        <RowActions
          className="sm:hidden shrink-0"
          actions={[
            { kind: 'more', tooltip: 'Xem chi tiết & thao tác', onClick: () => onView(node) },
          ]}
        />
      </div>

      {hasChildren && expanded && (
        <div role="group">
          {node.children.map((child: any, idx: number) => (
            <DeptTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              guides={[...guides, hasNextSibling]}
              isFirstRow={false}
              hasNextSibling={idx < node.children.length - 1}
              activeId={activeId}
              collapsedIds={collapsedIds}
              forceExpand={forceExpand}
              onToggleCollapse={onToggleCollapse}
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

function DeptTreeSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{ paddingLeft: TREE_PADDING_LEFT + (i % 3) * TREE_INDENT }}
          className={cn(
            'flex items-center gap-3 pr-3 min-h-[56px]',
            i > 0 && 'border-t border-neutral-100',
          )}
        >
          <Skeleton className="w-6 h-6 rounded-md" />
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40 rounded" />
            <Skeleton className="h-3 w-56 rounded" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
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

/**
 * Màu avatar sinh theo hash mã/tên phòng ban — cùng một phòng luôn ra một màu,
 * các phòng khác nhau dễ phân biệt khi lướt cây.
 */
const AVATAR_TONES = [
  'bg-emerald-100 text-emerald-700',
  'bg-teal-100 text-teal-700',
  'bg-sky-100 text-sky-700',
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]

function avatarTone(seed?: string): string {
  const s = seed || '?'
  let hash = 0
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) % 100000
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length]
}
