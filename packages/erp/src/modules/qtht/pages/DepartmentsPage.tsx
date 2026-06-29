import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Edit, Trash2, ChevronRight, ChevronDown, List, GitFork, Users, Loader2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { Switch } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { Button } from '@frezo/ui'
import { organizationApi } from '@/modules/qtht/services/qthtApi'
import { personApi } from '@/modules/qlns/services/personApi'
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, useActivateDepartment, useDeactivateDepartment } from '../hooks/useQtht'
import { depSchema } from '../constants/schema'

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

export function DepartmentsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [viewMode, setViewMode] = useState<'tree' | 'table' | 'personnel'>('tree')
  const [searchQuery, setSearchQuery] = useState('')
  const [scale, setScale] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const zoomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = zoomRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        setScale(prev => Math.max(0.1, Math.min(3, prev + (e.deltaY > 0 ? -0.1 : 0.1))))
      }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
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
  const { data: rawData, isLoading } = useDepartments()
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
  const deptOptions = dataList
    .filter((d: any) => d.id !== selectedItem?.id)
    .map((d: any) => ({ value: d.id, label: `${d.code} - ${d.name}` }))

  // Filter departments based on search query
  const filteredDataList = useMemo(() => {
    if (!searchQuery.trim()) return dataList
    const query = searchQuery.toLowerCase().trim()
    
    // Find all matching items
    const matches = dataList.filter((item: any) => {
      return (
        item.name?.toLowerCase().includes(query) ||
        item.code?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.organizationName?.toLowerCase().includes(query)
      )
    })

    // To keep hierarchy intact, if a child matches, we must recursively include all parent ancestors
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
  }, [dataList, searchQuery])

  // Build tree structure from filtered flat list
  const treeData = useMemo(() => {
    const map = new Map<string, any>()
    const roots: any[] = []
    filteredDataList.forEach((item: any) => { map.set(item.id, { ...item, children: [] }) })
    filteredDataList.forEach((item: any) => {
      const node = map.get(item.id)
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId).children.push(node)
      } else {
        roots.push(node)
      }
    })
    const sortTree = (nodes: any[]) => {
      nodes.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      nodes.forEach(n => sortTree(n.children))
    }
    sortTree(roots)
    return roots
  }, [filteredDataList])

  // Group persons by departmentId
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

  // Build personnel tree (employees arranged by hierarchy)
  const personnelTree = useMemo(() => {
    const buildNode = (deptNode: any): any[] => {
      const employees = personsByDept.get(deptNode.id) || []
      const manager = employees.find((p: any) => p.id === deptNode.managerId)
      const deputy = employees.find((p: any) => p.id === deptNode.deputyManagerId)
      const staff = employees.filter(
        (p: any) => p.id !== deptNode.managerId && p.id !== deptNode.deputyManagerId
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
        // No manager: show deputy + staff + child nodes at this level
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

  const handleOpenEdit = (node: any) => {
    setSelectedItem(node)
    setModalOpen(true)
  }

  const handleDelete = (node: any) => {
    if (confirm(`Bạn có chắc chắn muốn xóa phòng ban "${node.name}"?`)) {
      deleteReq.mutate(node.id)
    }
  }

  const handleSubmit = (values: any) => {
    const payload = { ...values, status: values.status ? 'ACTIVE' : 'INACTIVE' }
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: payload }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  const handleToggleStatus = (row: any) => {
    queryClient.setQueryData(['departments'], (old: any) => {
      if (!old?.items) return old
      return { ...old, items: old.items.map((item: any) =>
        item.id === row.id ? { ...item, status: row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : item
      )}
    })
    if (row.status === 'ACTIVE') deactivateReq.mutate(row.id)
    else activateReq.mutate(row.id)
  }

  // Recursive Org Chart Node Component
  const OrgChartNode = ({ node, onEdit, onDelete }: { node: any, onEdit: (node: any) => void, onDelete: (node: any) => void }) => {
    const hasChildren = node.children && node.children.length > 0
    const deptEmployees = personsByDept.get(node.id) || []
    const manager = deptEmployees.find((p: any) => p.id === node.managerId)
    const deputy = deptEmployees.find((p: any) => p.id === node.deputyManagerId)
    const staffList = deptEmployees.filter((p: any) => p.id !== node.managerId && p.id !== node.deputyManagerId)

    return (
      <div className="flex flex-col items-center">
        {/* Node Card */}
        <div className="relative p-4 rounded-xl border border-emerald-500/20 bg-white shadow-sm hover:shadow-md transition-all duration-200 w-64 text-center group border-t-4 border-t-emerald-600">
          <div className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
            {node.code}
          </div>
          <h4 className="text-sm font-bold text-neutral-800 line-clamp-2 min-h-[36px] flex items-center justify-center">
            {node.name}
          </h4>
          {node.email && (
            <p className="text-[11px] text-neutral-400 mt-1 truncate w-full" title={node.email}>
              {node.email}
            </p>
          )}

          {/* Employees Section */}
          {deptEmployees.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-neutral-100 text-left">
              {/* Manager */}
              {manager && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-amber-50 border border-amber-200 mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-800 truncate">{manager.name}</p>
                    <p className="text-[10px] text-amber-600">Trưởng phòng</p>
                  </div>
                </div>
              )}
              {/* Deputy */}
              {deputy && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-blue-50 border border-blue-200 mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-800 truncate">{deputy.name}</p>
                    <p className="text-[10px] text-blue-600">Phó phòng</p>
                  </div>
                </div>
              )}
              {/* Staff */}
              {staffList.length > 0 && (
                <div className="max-h-[120px] overflow-y-auto space-y-0.5 scrollbar-thin">
                  {staffList.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-neutral-50">
                      <span className="text-[10px] text-neutral-400">•</span>
                      <p className="text-xs text-neutral-700 truncate flex-1">{p.name}</p>
                      {p.jobTitle && <span className="text-[9px] text-neutral-400 truncate max-w-[60px]">{p.jobTitle}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status + Count */}
          <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between px-1">
            <span className="text-[10px] text-neutral-400">{deptEmployees.length} nhân sự</span>
            <div className="flex items-center gap-2">
              <Switch
                checked={node.status === 'ACTIVE'}
                onChange={() => handleToggleStatus(node)}
              />
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${node.status === 'ACTIVE' ? 'text-success' : 'text-neutral-400'}`}>
                {node.status === 'ACTIVE' ? 'Bật' : 'Tắt'}
              </span>
            </div>
          </div>

          {/* Action Overlay */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-white/95 backdrop-blur p-0.5 rounded border border-border shadow-sm">
            <button
              title="Chỉnh sửa"
              onClick={() => onEdit(node)}
              className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-primary-600 transition-colors"
            >
              <Edit size={12} />
            </button>
            <button
              title="Xóa"
              onClick={() => onDelete(node)}
              className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && (
          <div className="flex flex-col items-center mt-4 w-full">
            {/* Vertical connector from parent to horizontal line */}
            <div className="w-0.5 h-6 bg-emerald-300" />

            {/* Horizontal Line connector */}
            <div className="flex gap-8 relative pt-4">
              {node.children.length > 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-224px)] h-0.5 bg-emerald-300" />
              )}
              {node.children.map((child: any, idx: number) => (
                  <div key={child.id} className="relative flex flex-col items-center">
                    {/* Vertical connector line to child card */}
                    <div className="absolute -top-4 w-0.5 h-4 bg-emerald-300" />
                    
                    {/* Edge line maskers for visual cleanliness */}
                    {node.children.length > 1 && idx === 0 && (
                      <div className="absolute -top-4 left-0 w-1/2 h-0.5 bg-white/0" />
                    )}
                    {node.children.length > 1 && idx === node.children.length - 1 && (
                      <div className="absolute -top-4 right-0 w-1/2 h-0.5 bg-white/0" />
                    )}

                    <OrgChartNode node={child} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Recursive Personnel Node Component
  const PersonnelNode = ({ node, depth = 0 }: { node: any; depth?: number }) => {
    const hasChildren = node.children && node.children.length > 0
    const isManager = node.role === 'Trưởng phòng'
    const isDeputy = node.role === 'Phó phòng'
    return (
      <div className="flex flex-col items-center">
        <div className={`relative rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 w-56 text-center group ${
          isManager ? 'border-amber-300 border-t-2 border-t-amber-500' :
          isDeputy ? 'border-blue-200 border-t-2 border-t-blue-400' :
          'border-neutral-200 border-t border-t-neutral-300'
        }`}>
          <div className="p-3">
            <p className={`text-sm font-semibold truncate ${isManager ? 'text-amber-800' : isDeputy ? 'text-blue-700' : 'text-neutral-700'}`}>
              {node.name}
            </p>
            <p className={`text-[10px] mt-0.5 ${isManager ? 'text-amber-600' : isDeputy ? 'text-blue-500' : 'text-neutral-400'}`}>
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

  return (
    <div className="space-y-4 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Sơ đồ phòng ban</h2>
          <p className="text-sm text-neutral-500 mt-1">Quản lý cơ cấu và danh sách phòng ban của doanh nghiệp</p>
        </div>
        <Button onClick={() => { setSelectedItem(null); setModalOpen(true) }} className="gap-2 bg-primary-700 hover:bg-primary-800 text-white shadow-sm">
           <Plus size={16} /> Thêm mới
        </Button>
      </div>

      {/* Toolbar View Mode selector */}
      <div className="p-4 rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Tìm theo tên, mã phòng ban..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'tree' ? 'bg-white shadow-sm text-primary-600 font-medium' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <GitFork size={15} className="inline mr-1" />Gia phả (Cây)
            </button>
            <button
              onClick={() => setViewMode('personnel')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'personnel' ? 'bg-white shadow-sm text-primary-600 font-medium' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <Users size={15} className="inline mr-1" />Nhân sự
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-primary-600 font-medium' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <List size={15} className="inline mr-1" />Bảng chi tiết
            </button>
          </div>
        </div>
      </div>

      {/* Main content display based on viewMode */}
      {viewMode === 'tree' ? (
        <div
          ref={zoomRef}
          className="w-full overflow-hidden p-10 border border-border rounded-xl bg-neutral-50/40 shadow-inner min-h-[450px] relative select-none"
          style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
        >
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-border p-1.5">
            <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700 transition-colors" title="Phóng to">
              <ZoomIn size={16} />
            </button>
            <span className="text-xs font-mono text-neutral-400 min-w-[36px] text-center select-none">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.max(0.1, s - 0.2))} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700 transition-colors" title="Thu nhỏ">
              <ZoomOut size={16} />
            </button>
            <div className="w-px h-4 bg-neutral-200 mx-0.5" />
            <button onClick={resetZoom} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700 transition-colors" title="Khôi phục">
              <Maximize2 size={16} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-neutral-400 h-64">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-emerald-600" />
              <span>Đang tải cơ cấu tổ chức...</span>
            </div>
          ) : treeData.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-neutral-400 h-64">
              <span>Không có dữ liệu cơ cấu phòng ban</span>
            </div>
          ) : (
            <div
              style={{ transform: `scale(${scale}) translate(${panX}px, ${panY}px)`, transformOrigin: '0 0' }}
              className="flex gap-12 items-start justify-center"
            >
              {treeData.map((node) => (
                <OrgChartNode
                  key={node.id}
                  node={node}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      ) : viewMode === 'personnel' ? (
        <div
          ref={zoomRef}
          className="w-full overflow-hidden p-10 border border-border rounded-xl bg-neutral-50/40 shadow-inner min-h-[450px] relative select-none"
          style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
        >
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-border p-1.5">
            <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700 transition-colors" title="Phóng to">
              <ZoomIn size={16} />
            </button>
            <span className="text-xs font-mono text-neutral-400 min-w-[36px] text-center select-none">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.max(0.1, s - 0.2))} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700 transition-colors" title="Thu nhỏ">
              <ZoomOut size={16} />
            </button>
            <div className="w-px h-4 bg-neutral-200 mx-0.5" />
            <button onClick={resetZoom} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700 transition-colors" title="Khôi phục">
              <Maximize2 size={16} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-neutral-400 h-64">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-amber-600" />
              <span>Đang tải sơ đồ nhân sự...</span>
            </div>
          ) : personnelTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-neutral-400 h-64">
              <span>Không có dữ liệu nhân sự</span>
            </div>
          ) : (
            <div
              style={{ transform: `scale(${scale}) translate(${panX}px, ${panY}px)`, transformOrigin: '0 0' }}
              className="flex gap-10 items-start justify-center"
            >
              {personnelTree.map((node, idx) => (
                <PersonnelNode key={node.id + idx} node={node} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <AppTable
          data={dataList}
          columns={[
            { title: 'Mã phòng ban', dataIndex: 'code', filterType: 'text' },
            { title: 'Tên phòng ban', dataIndex: 'name', filterType: 'text' },
            { title: 'Email', dataIndex: 'email', filterType: 'text' },
            { title: 'Tổ chức', dataIndex: 'organizationName', filterType: 'text' },
            {
              title: 'Trạng thái', dataIndex: 'status',
              filterType: 'select',
              filterOptions: [
                { value: 'ACTIVE', label: 'Hoạt động' },
                { value: 'INACTIVE', label: 'Không hoạt động' },
              ],
              render: (_: any, row: any) => (
                <div className="flex items-center gap-2">
                  <Switch checked={row.status === 'ACTIVE'} onChange={() => handleToggleStatus(row)} />
                  <span className={`text-xs font-medium ${row.status === 'ACTIVE' ? 'text-success' : 'text-neutral-500'}`}>
                    {row.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
              ),
            },
            {
              title: 'Thao tác', dataIndex: 'id',
              render: (_: any, row: any) => (
                <div className="flex items-center gap-2">
                  <button title="Sửa" onClick={() => handleOpenEdit(row)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"><Edit size={15} /></button>
                  <button title="Xóa" onClick={() => handleDelete(row)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={15} /></button>
                </div>
              ),
            },
          ]}
          isLoading={isLoading}
          showSearch={true}
          searchPlaceholder="Tìm kiếm nhanh phòng ban..."
        />
      )}

      {/* Modal Thêm / Sửa */}
      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Sửa thông tin phòng ban' : 'Thêm phòng ban mới'} maxWidth="4xl">
        <AppForm
          schema={depSchema}
          defaultValues={selectedItem ? { ...defaultFormValues, ...selectedItem, status: selectedItem.status === 'ACTIVE' } : defaultFormValues}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
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
    </div>
  )
}