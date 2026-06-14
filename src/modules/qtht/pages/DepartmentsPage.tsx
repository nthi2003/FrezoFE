import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Edit, Trash2, ChevronRight, ChevronDown, List, GitFork } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { organizationApi } from '@/modules/qtht/services/qthtApi'
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
  status: true,
}

export function DepartmentsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree')

  const queryClient = useQueryClient()
  const { data: rawData, isLoading } = useDepartments()
  const { data: orgList } = useQuery({
    queryKey: ['organizations-combobox'],
    queryFn: () => organizationApi.getCombobox(),
  })
  const createReq = useCreateDepartment()
  const updateReq = useUpdateDepartment()
  const deleteReq = useDeleteDepartment()
  const activateReq = useActivateDepartment()
  const deactivateReq = useDeactivateDepartment()

  const orgOptions = Array.isArray(orgList) ? orgList.map((o: any) => ({ value: o.value, label: o.label })) : []
  const dataList = rawData || []

  // Build tree from flat list
  const treeData = useMemo(() => {
    const map = new Map<string, any>()
    const roots: any[] = []
    dataList.forEach((item: any) => { map.set(item.id, { ...item, children: [] }) })
    dataList.forEach((item: any) => {
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
  }, [dataList])

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
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

  // Render a tree node recursively
  const renderNode = (node: any, level: number): React.ReactNode => {
    const hasChildren = node.children?.length > 0
    const isExpanded = expandedIds.has(node.id)
    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-2 py-2.5 border-b border-border hover:bg-neutral-50 transition-colors ${level > 0 ? 'ml-6' : ''}`}
          style={{ paddingLeft: 12 + level * 24 }}
        >
          <button
            className={`w-5 h-5 flex items-center justify-center rounded hover:bg-neutral-200 transition-colors ${hasChildren ? '' : 'invisible'}`}
            onClick={() => toggleExpand(node.id)}
          >
            {isExpanded ? <ChevronDown size={14} className="text-neutral-500" /> : <ChevronRight size={14} className="text-neutral-500" />}
          </button>
          <span className="w-[120px] text-sm font-mono text-neutral-600 truncate">{node.code}</span>
          <span className="flex-1 text-sm font-medium text-neutral-900 truncate">{node.name}</span>
          <span className="w-[180px] text-sm text-neutral-500 truncate hidden md:block">{node.email || '—'}</span>
          <span className="w-[140px] text-sm text-neutral-500 truncate hidden lg:block">{node.organizationName || '—'}</span>
          <div className="w-[120px] flex items-center gap-2">
            <Switch
              checked={node.status === 'ACTIVE'}
              onChange={() => handleToggleStatus(node)}
            />
            <span className={`text-xs font-medium ${node.status === 'ACTIVE' ? 'text-success' : 'text-neutral-500'}`}>
              {node.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button title="Sửa" onClick={() => { setSelectedItem(node); setModalOpen(true) }} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors">
              <Edit size={15} />
            </button>
            <button title="Xóa" onClick={() => { if(confirm('Xóa?')) deleteReq.mutate(node.id) }} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && node.children.map((child: any) => renderNode(child, level + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Phòng ban</h2>
          <p className="text-sm text-neutral-500 mt-1">Quản lý danh sách phòng ban trong hệ thống</p>
        </div>
        <Button onClick={() => { setSelectedItem(null); setModalOpen(true) }} className="gap-2 bg-primary-700 hover:bg-primary-800 text-white shadow-sm">
           <Plus size={16} /> Thêm mới
        </Button>
      </div>
      <div className="p-4 rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input placeholder="Tìm theo tên, mã phòng ban..." className="pl-9" />
          </div>
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'tree' ? 'bg-white shadow-sm text-primary-600 font-medium' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <GitFork size={15} className="inline mr-1" />Cây
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-primary-600 font-medium' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <List size={15} className="inline mr-1" />Bảng
            </button>
          </div>
        </div>
      </div>
      {viewMode === 'tree' ? (
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          {/* Tree header */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50/80 border-b border-border text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            <span className="w-5" />
            <span className="w-[120px]">Mã</span>
            <span className="flex-1">Tên phòng ban</span>
            <span className="w-[180px] hidden md:block">Email</span>
            <span className="w-[140px] hidden lg:block">Tổ chức</span>
            <span className="w-[120px]">Trạng thái</span>
            <span className="w-16 shrink-0">Thao tác</span>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-neutral-400">Đang tải...</div>
          ) : treeData.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">Không có dữ liệu</div>
          ) : (
            treeData.map(node => renderNode(node, 0))
          )}
        </div>
      ) : (
        <AppTable
          data={dataList}
          columns={[
            { title: 'Mã Phòng Ban', dataIndex: 'code' },
            { title: 'Tên Phòng Ban', dataIndex: 'name' },
            { title: 'Email', dataIndex: 'email' },
            { title: 'Tổ chức', dataIndex: 'organizationName' },
            {
              title: 'Trạng thái', dataIndex: 'status',
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
                  <button title="Sửa" onClick={() => { setSelectedItem(row); setModalOpen(true) }} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"><Edit size={15} /></button>
                  <button title="Xóa" onClick={() => { if(confirm('Xóa?')) deleteReq.mutate(row.id) }} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={15} /></button>
                </div>
              ),
            },
          ]}
          isLoading={isLoading}
        />
      )}
      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Sửa phòng ban' : 'Thêm phòng ban'} maxWidth="4xl">
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