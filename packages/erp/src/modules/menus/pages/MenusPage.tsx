import { useState, useMemo, useCallback } from 'react'
import { Plus, Search, ChevronRight, ChevronDown, Trash2, FolderTree, FileText } from 'lucide-react'
import { Button } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { Label } from '@frezo/ui'
import { Select } from '@frezo/ui'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { useAllMenus, useCreateMenu, useUpdateMenu, useDeleteMenu } from '../hooks/useMenus'
import type { MenuResponseItem, MenuTreeNode } from '../types/menu.types'
import { menuFormSchema, type MenuFormValues } from '../constants/schema'

// -- Tree Builder Helper --
function buildTree(flatData: MenuResponseItem[]): MenuTreeNode[] {
  const nodeMap = new Map<string, MenuTreeNode>()
  const roots: MenuTreeNode[] = []

  // Initialize nodes
  flatData.forEach((item) => {
    nodeMap.set(item.code, {
      ...item,
      children: [],
      isGroup: !item.feUrl || item.parentCode === null
    } as MenuTreeNode)
  })

  // Build structure
  flatData.forEach((item) => {
    const node = nodeMap.get(item.code)!
    if (item.parentCode && nodeMap.has(item.parentCode)) {
      nodeMap.get(item.parentCode)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  // Sort by orderIndex
  const sortNodes = (nodes: MenuTreeNode[]) => {
    nodes.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
    nodes.forEach(n => sortNodes(n.children))
  }
  sortNodes(roots)

  return roots
}

// -- Recursive Tree Component --
function TreeNode({ 
  node, 
  level = 0, 
  selectedId, 
  onSelect,
  onAddChild,
  onDelete
}: { 
  node: MenuTreeNode; 
  level?: number;
  selectedId: string;
  onSelect: (node: MenuTreeNode) => void;
  onAddChild: (parentCode: string) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(level < 1)
  const isSelected = selectedId === node.id
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="w-full relative">
      <div 
        className={`flex items-center gap-2 py-1.5 px-2.5 rounded-xl cursor-pointer transition-all duration-200 group relative my-0.5 border
          ${isSelected 
            ? 'bg-primary-50/80 text-primary-700 border-primary-100 shadow-sm' 
            : 'hover:bg-neutral-50 border-transparent text-neutral-700'
          }
        `}
        style={{ marginLeft: `${level * 16}px` }}
        onClick={() => onSelect(node)}
      >
        {/* Horizontal connector line for children */}
        {level > 0 && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 border-t-2 border-neutral-200"
            style={{ left: '-12px' }}
          />
        )}
        
        <button 
          className="w-5 h-5 flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors shrink-0"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
        >
          {hasChildren ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 mx-auto" />}
        </button>
        
        {node.isGroup ? (
          <FolderTree size={15} className={`shrink-0 ${isSelected ? 'text-primary-600' : 'text-neutral-500'}`} />
        ) : (
          <FileText size={15} className="shrink-0 text-neutral-400" />
        )}
        
        <span className={`text-sm select-none truncate flex-1 ${isSelected ? 'font-semibold' : 'font-medium text-neutral-600'}`}>
          {node.name}
        </span>

        {/* Hover Actions */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
          {node.isGroup && (
            <button 
              onClick={(e) => { e.stopPropagation(); onAddChild(node.code) }}
              className="p-1 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
              title="Thêm mới"
            >
              <Plus size={13} />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(node.id, node.name) }}
            className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa menu"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="w-full relative">
          {/* Vertical guide line spanning children */}
          <div 
            className="absolute border-l-2 border-neutral-100 top-2 bottom-3"
            style={{ left: `${level * 16 + 10}px` }}
          />
          {node.children.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              level={level + 1} 
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// -- Main Page --
export function MenusPage() {
  const [search, setSearch] = useState('')
  const [selectedNode, setSelectedNode] = useState<MenuTreeNode | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const { data: rawData, isLoading } = useAllMenus()
  const createReq = useCreateMenu()
  const updateReq = useUpdateMenu()
  const deleteReq = useDeleteMenu()

  const flatMenus = rawData || []

  // Form Setup (MUST be before useWatch)
  const { register, handleSubmit, reset, formState: { errors }, setValue, control } = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: { appCode: 'QTHT', isPublic: false, status: true, orderIndex: 0 }
  })

  const watchedParentCode = useWatch({ control, name: 'parentCode' })
  const parentValue = watchedParentCode || ''

  // Filter & Build Tree
  const treeData = useMemo(() => {
    let filtered = flatMenus
    if (search.trim()) {
      filtered = flatMenus.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase()))
    }
    return buildTree(filtered)
  }, [flatMenus, search])

  // Build parent path map for hierarchical labels
  const getParentPath = useCallback((code: string): string => {
    const item = flatMenus.find(m => m.code === code)
    if (!item) return code
    if (item.parentCode) {
      const parentPath = getParentPath(item.parentCode)
      return `${parentPath} / ${item.name}`
    }
    return item.name
  }, [flatMenus])

  const parentOptions = useMemo(() => {
    return flatMenus.map(m => ({
      value: m.code,
      label: getParentPath(m.code),
    }))
  }, [flatMenus, getParentPath])

  // Handlers
  const handleSelectNode = (node: MenuTreeNode) => {
    setIsCreating(false)
    setSelectedNode(node)
    reset({
      appCode: node.appCode || 'QTHT',
      code: node.code,
      name: node.name,
      nameEn: node.nameEn || '',
      parentCode: node.parentCode || '',
      feUrl: node.feUrl || '',
      icon: node.icon || '',
      orderIndex: node.orderIndex || 0,
      isPublic: node.isPublic || false,
      status: node.status ?? true,
    })
  }

  const handleCreateNew = (parentCode?: string) => {
    setSelectedNode(null)
    setIsCreating(true)
    reset({
      appCode: 'QTHT',
      code: '',
      name: '',
      nameEn: '',
      parentCode: parentCode || '',
      feUrl: '',
      icon: '',
      orderIndex: 0,
      isPublic: false,
      status: true,
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Xóa menu [${name}]?`)) {
      deleteReq.mutate(id)
      if (selectedNode?.id === id) {
        setSelectedNode(null)
        setIsCreating(false)
        reset()
      }
    }
  }

  const onSubmit = (data: MenuFormValues) => {
    if (isCreating) {
      createReq.mutate(data as any, { onSuccess: () => { setIsCreating(false); reset() } })
    } else if (selectedNode) {
      updateReq.mutate({ id: selectedNode.id, data: data as any })
    }
  }

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-neutral-900">Quản lý Menu</h1>
        <p className="text-sm text-neutral-500">Quản lý cấu trúc Menu hệ thống</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
        
        {/* L E F T   P A N E L (Tree) */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-neutral-200 space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input 
                placeholder="Tìm kiếm chức năng..." 
                className="pl-8 h-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button size="sm" className="w-full h-8 bg-primary-600 hover:bg-primary-700 text-white" onClick={() => handleCreateNew()}>
               <Plus size={14} className="mr-1" /> Thêm mới
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="text-center p-4 text-sm text-neutral-500">Đang tải...</div>
            ) : treeData.length === 0 ? (
              <div className="text-center p-4 text-sm text-neutral-500">Không tìm thấy menu</div>
            ) : (
              treeData.map(node => (
                <TreeNode 
                  key={node.id} 
                  node={node} 
                  selectedId={selectedNode?.id || ''}
                  onSelect={handleSelectNode}
                  onAddChild={(pCode) => handleCreateNew(pCode)}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>

        {/* R I G H T   P A N E L (Form) */}
        {/* R I G H T   P A N E L (Form) */}
        <div className="md:col-span-8 lg:col-span-9 bg-white border border-neutral-200 rounded-2xl p-6 overflow-y-auto shadow-sm">
          {(!selectedNode && !isCreating) ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
                <FolderTree className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-base font-semibold text-neutral-800">Cấu trúc Menu Hệ thống</h3>
              <p className="text-sm text-neutral-500 mt-1 max-w-sm">Chọn một menu hoặc chức năng ở danh sách bên trái để cấu hình chi tiết, hoặc bấm nút "+ Thêm mới" để tạo một menu cấp cao.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-800">
                    {isCreating ? 'Thêm mới chức năng' : `Chi tiết: ${selectedNode?.name}`}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {isCreating ? 'Tạo chức năng menu hoặc danh mục mới' : 'Xem và cập nhật thông tin cấu hình chức năng'}
                  </p>
                </div>
                {!isCreating && selectedNode && (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                    {selectedNode.code}
                  </span>
                )}
              </div>

              {/* Nhóm 1: Định danh & Phân cấp */}
              <div className="bg-neutral-50/50 rounded-xl p-5 border border-neutral-100 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">1. Định danh & Phân cấp</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-neutral-700">Mã hệ thống <span className="text-red-500">*</span></Label>
                    <Input {...register('appCode')} placeholder="VD: QTHT" className="bg-white" />
                    {errors.appCode && <span className="text-xs text-red-500">{errors.appCode.message}</span>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-neutral-700">Chức năng cha</Label>
                    <Select
                      options={parentOptions}
                      value={parentValue}
                      onChange={(v) => setValue('parentCode', v, { shouldValidate: true })}
                      placeholder="-- Chọn chức năng cha --"
                      showSearch
                      showClear
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-neutral-700">Mã Code chức năng <span className="text-red-500">*</span></Label>
                    <Input {...register('code')} disabled={!isCreating && !!selectedNode?.code} placeholder="VD: MENU_USERS" className="bg-white" />
                    {errors.code && <span className="text-xs text-red-500">{errors.code.message}</span>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-neutral-700">Thứ tự hiển thị</Label>
                    <Input type="number" {...register('orderIndex', { valueAsNumber: true })} className="bg-white" />
                  </div>
                </div>
              </div>

              {/* Nhóm 2: Nội dung hiển thị & Đường dẫn */}
              <div className="bg-neutral-50/50 rounded-xl p-5 border border-neutral-100 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">2. Nội dung hiển thị & Định tuyến</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-neutral-700">Tên chức năng (Tiếng Việt) <span className="text-red-500">*</span></Label>
                    <Input {...register('name')} placeholder="Ví dụ: Quản lý nhân viên" className="bg-white" />
                    {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-neutral-700">Tên chức năng (Tiếng Anh)</Label>
                    <Input {...register('nameEn')} placeholder="Ví dụ: User Management" className="bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-neutral-700">Đường dẫn Frontend (URL)</Label>
                    <Input {...register('feUrl')} placeholder="Ví dụ: /qtht/users" className="bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-neutral-700">Icon hiển thị (Tên Lucide Icon)</Label>
                    <Input {...register('icon')} placeholder="Ví dụ: Users, Folder, Settings..." className="bg-white" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
                <Button type="submit" disabled={createReq.isPending || updateReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white min-w-[120px] rounded-xl">
                  {isCreating ? 'Tạo mới' : 'Cập nhật'}
                </Button>
                {isCreating && (
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => {setIsCreating(false); setSelectedNode(null)}}>
                    Hủy
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

