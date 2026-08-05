import { useState, useMemo, useCallback, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus, Search, ChevronRight, ChevronDown, FolderTree, FileText, AlertTriangle,
  ExpandIcon, MinusSquare, ExternalLink, EyeOff, Copy, Info, Sparkles,
} from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  Input,
  Label,
  Select,
  Switch,
  PageHeader,
  PageGuideButton,
  IconPicker,
  IconPreview,
  StatusBadge,
  RowActions,
  type PageGuideConfig,
} from '@frezo/ui'

import { useAllMenus, useCreateMenu, useUpdateMenu, useDeleteMenu } from '../hooks/useMenus'
import type { MenuResponseItem, MenuTreeNode } from '../types/menu.types'
import { menuFormSchema, type MenuFormValues } from '../constants/schema'

// ============================================================
// Page Guide
// ============================================================

const MENUS_GUIDE: PageGuideConfig = {
  title: 'Quản lý Menu hệ thống',
  subtitle: 'Cây menu điều hướng sidebar — cấu trúc cha/con và ánh xạ đường dẫn frontend.',
  sections: [
    {
      heading: 'Menu Nhóm vs Menu Chức năng',
      type: 'tips',
      tips: [
        'Menu Nhóm: chỉ để gom các menu con — KHÔNG có URL frontend. VD: "Hệ thống", "Nhân sự".',
        'Menu Chức năng: BẮT BUỘC có URL frontend khớp với route đã khai báo. VD: "/qtht/users".',
        'Nếu URL không khớp route FE, user click sẽ nhận 404.',
      ],
    },
    {
      heading: 'Quy trình thêm mới',
      type: 'steps',
      steps: [
        {
          title: 'Chọn menu cha (nếu có)',
          description: 'Bấm vào node trong tree bên trái, hoặc để trống parent nếu tạo menu gốc.',
        },
        {
          title: 'Nhấn "Thêm mới"',
          description: 'Điền mã (UPPER_SNAKE_CASE, không đổi được sau khi tạo), tên hiển thị, chọn icon từ picker.',
        },
        {
          title: 'Gán vào Vai trò',
          description: 'Menu mới KHÔNG tự động cho user thấy — cần vào "Vai trò" và tick menu cho role tương ứng.',
        },
      ],
    },
    {
      heading: 'Cảnh báo',
      type: 'notes',
      notes: (
        <>
          Xóa menu sẽ <strong>gỡ khỏi mọi vai trò</strong> đang gán và menu con của nó. User đang ở URL đó sẽ nhận 404 khi refresh — hãy migrate/thông báo trước.
        </>
      ),
    },
  ],
}

// ============================================================
// Tree builder
// ============================================================

function buildTree(flatData: MenuResponseItem[]): MenuTreeNode[] {
  const nodeMap = new Map<string, MenuTreeNode>()
  const roots: MenuTreeNode[] = []

  flatData.forEach((item) => {
    nodeMap.set(item.code, {
      ...item,
      children: [],
      isGroup: !item.feUrl,
    } as MenuTreeNode)
  })

  flatData.forEach((item) => {
    const node = nodeMap.get(item.code)!
    if (item.parentCode && nodeMap.has(item.parentCode)) {
      nodeMap.get(item.parentCode)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortNodes = (nodes: MenuTreeNode[]) => {
    nodes.sort((a, b) => {
      const oa = a.orderIndex ?? 0
      const ob = b.orderIndex ?? 0
      if (oa !== ob) return oa - ob
      return (a.name || '').localeCompare(b.name || '')
    })
    nodes.forEach((n) => sortNodes(n.children))
  }
  sortNodes(roots)
  return roots
}

function collectAllCodes(nodes: MenuTreeNode[]): string[] {
  const codes: string[] = []
  const walk = (list: MenuTreeNode[]) => {
    list.forEach((n) => {
      codes.push(n.code)
      if (n.children?.length) walk(n.children)
    })
  }
  walk(nodes)
  return codes
}

function findParentPath(
  flatMenus: MenuResponseItem[],
  code: string,
): MenuResponseItem[] {
  const path: MenuResponseItem[] = []
  let cursor = flatMenus.find((m) => m.code === code)
  while (cursor) {
    path.unshift(cursor)
    if (!cursor.parentCode) break
    const nextItem: MenuResponseItem | undefined = flatMenus.find((m) => m.code === cursor!.parentCode)
    cursor = nextItem
  }
  return path
}

function countDescendants(node: MenuTreeNode): number {
  let n = 0
  const walk = (list: MenuTreeNode[]) => {
    list.forEach((c) => {
      n++
      if (c.children?.length) walk(c.children)
    })
  }
  walk(node.children || [])
  return n
}

// ============================================================
// Tree Node
// ============================================================

interface TreeNodeProps {
  node: MenuTreeNode
  level?: number
  selectedId: string
  expandedCodes: Set<string>
  toggleExpand: (code: string) => void
  onSelect: (node: MenuTreeNode) => void
  onAddChild: (parentCode: string) => void
  onDelete: (node: MenuTreeNode) => void
}

function TreeNode({
  node, level = 0, selectedId, expandedCodes, toggleExpand,
  onSelect, onAddChild, onDelete,
}: TreeNodeProps) {
  const isSelected = selectedId === node.id
  const hasChildren = node.children && node.children.length > 0
  const expanded = expandedCodes.has(node.code)
  const inactive = node.status === false
  const isGroup = !node.feUrl

  return (
    <div className="w-full relative">
      <div
        className={`flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-colors group border
          ${isSelected
            ? 'bg-primary-50 text-primary-700 border-primary-200'
            : 'hover:bg-neutral-50 border-transparent text-neutral-700'
          }
        `}
        style={{ marginLeft: `${level * 14}px` }}
        onClick={() => onSelect(node)}
      >
        {level > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 border-t border-neutral-200"
            style={{ left: '-10px' }}
          />
        )}

        <button
          type="button"
          className="w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-700 shrink-0"
          onClick={(e) => { e.stopPropagation(); toggleExpand(node.code) }}
          aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}
        >
          {hasChildren
            ? (expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />)
            : <span className="w-1 h-1 rounded-full bg-neutral-300" />
          }
        </button>

        {/* Icon (custom if set, else group/leaf default) */}
        <span className="shrink-0">
          {node.icon ? (
            <IconPreview name={node.icon} size={14} className={isSelected ? 'text-primary-600' : 'text-neutral-500'} />
          ) : isGroup ? (
            <FolderTree size={14} className={isSelected ? 'text-primary-600' : 'text-neutral-500'} />
          ) : (
            <FileText size={14} className="text-neutral-400" />
          )}
        </span>

        <span
          className={`text-sm select-none truncate flex-1 ${isSelected ? 'font-semibold' : 'font-medium text-neutral-700'} ${inactive ? 'line-through opacity-60' : ''}`}
          title={`${node.name} • ${node.code}${node.feUrl ? ' • ' + node.feUrl : ''}`}
        >
          {node.name}
        </span>

        {/* Status badges */}
        <div className="flex items-center gap-1 shrink-0">
          {inactive && (
            <span title="Đang tắt" className="text-neutral-400">
              <EyeOff size={11} />
            </span>
          )}
          {hasChildren && !inactive && (
            <span
              className="text-[10px] px-1.5 py-0 rounded-full bg-neutral-100 text-neutral-500 font-medium"
              title={`${node.children.length} menu con`}
            >
              {node.children.length}
            </span>
          )}
        </div>

        {/* Hover actions */}
        <RowActions
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-0.5"
          actions={[
            {
              key: 'add-child',
              icon: Plus,
              tooltip: 'Thêm menu con',
              tone: 'primary',
              onClick: () => onAddChild(node.code),
            },
            { kind: 'delete', tooltip: 'Xoá menu', onClick: () => onDelete(node) },
          ]}
        />
      </div>

      {expanded && hasChildren && (
        <div className="w-full relative">
          <div
            className="absolute border-l border-neutral-200 top-0 bottom-1"
            style={{ left: `${level * 14 + 9}px` }}
          />
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              expandedCodes={expandedCodes}
              toggleExpand={toggleExpand}
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

// ============================================================
// Main Page
// ============================================================

export function MenusPage() {
  const [search, setSearch] = useState('')
  const [selectedNode, setSelectedNode] = useState<MenuTreeNode | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<MenuTreeNode | null>(null)
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set())
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const { data: rawData, isLoading } = useAllMenus()
  const createReq = useCreateMenu()
  const updateReq = useUpdateMenu()
  const deleteReq = useDeleteMenu()

  const flatMenus = (rawData || []) as MenuResponseItem[]

  const {
    register, handleSubmit, reset, formState: { errors }, setValue, control,
  } = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: { appCode: 'QTHT', isPublic: false, status: true, orderIndex: 0 },
  })

  const watchedParent = useWatch({ control, name: 'parentCode' })
  const watchedIcon = useWatch({ control, name: 'icon' })
  const watchedIsPublic = useWatch({ control, name: 'isPublic' })
  const watchedStatus = useWatch({ control, name: 'status' })
  const watchedFeUrl = useWatch({ control, name: 'feUrl' })
  const parentValue = (watchedParent as string) || ''
  const iconValue = (watchedIcon as string) || ''
  const feUrlValue = (watchedFeUrl as string) || ''

  // Build tree (filtered) — nếu search thì auto-expand tất cả filtered nodes
  const treeData = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? flatMenus.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.code.toLowerCase().includes(q) ||
            (m.feUrl || '').toLowerCase().includes(q),
        )
      : flatMenus
    return buildTree(filtered)
  }, [flatMenus, search])

  // Expand default: chỉ root level. Khi search → expand tất cả kết quả.
  useEffect(() => {
    if (search.trim()) {
      setExpandedCodes(new Set(collectAllCodes(treeData)))
    } else if (expandedCodes.size === 0 && treeData.length > 0) {
      const rootCodes = treeData.map((n) => n.code)
      setExpandedCodes(new Set(rootCodes))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, treeData.length])

  const toggleExpand = useCallback((code: string) => {
    setExpandedCodes((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }, [])

  const expandAll = () => setExpandedCodes(new Set(collectAllCodes(treeData)))
  const collapseAll = () => setExpandedCodes(new Set())

  const getParentPath = useCallback(
    (code: string): string => {
      const path = findParentPath(flatMenus, code)
      return path.map((p) => p.name).join(' / ')
    },
    [flatMenus],
  )

  const parentOptions = useMemo(() => {
    // Loại bỏ chính node đang chỉnh + descendants của nó (tránh vòng lặp cha-con).
    const excludeSet = new Set<string>()
    if (selectedNode && !isCreating) {
      const collectSelfAndDesc = (n: MenuTreeNode) => {
        excludeSet.add(n.code)
        n.children?.forEach(collectSelfAndDesc)
      }
      // Tìm node trong tree đầy đủ
      const fullTree = buildTree(flatMenus)
      const walk = (list: MenuTreeNode[]) => {
        list.forEach((n) => {
          if (n.code === selectedNode.code) collectSelfAndDesc(n)
          walk(n.children || [])
        })
      }
      walk(fullTree)
    }
    return flatMenus
      .filter((m) => !excludeSet.has(m.code))
      .map((m) => ({ value: m.code, label: getParentPath(m.code) }))
  }, [flatMenus, getParentPath, selectedNode, isCreating])

  // Breadcrumb path của node đang chỉnh (context)
  const selectedPath = useMemo(() => {
    if (!selectedNode) return []
    return findParentPath(flatMenus, selectedNode.code)
  }, [flatMenus, selectedNode])

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
      orderIndex: node.orderIndex ?? 0,
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
    if (parentCode) {
      setExpandedCodes((prev) => new Set(prev).add(parentCode))
    }
  }

  const handleDelete = (node: MenuTreeNode) => {
    setConfirmDelete(node)
  }

  const handleConfirmDelete = () => {
    if (!confirmDelete) return
    deleteReq.mutate(confirmDelete.id)
    if (selectedNode?.id === confirmDelete.id) {
      setSelectedNode(null)
      setIsCreating(false)
      reset()
    }
    setConfirmDelete(null)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  const onSubmit = (data: MenuFormValues) => {
    if (isCreating) {
      createReq.mutate(data as any, {
        onSuccess: () => { setIsCreating(false); reset() },
      })
    } else if (selectedNode) {
      updateReq.mutate({ id: selectedNode.id, data: data as any })
    }
  }

  // Stats
  const totalMenus = flatMenus.length
  const groupCount = flatMenus.filter((m) => !m.feUrl).length
  const leafCount = totalMenus - groupCount
  const inactiveCount = flatMenus.filter((m) => m.status === false).length

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Quản lý Menu"
        description="Cấu hình cây menu điều hướng sidebar — cấu trúc, biểu tượng, URL và thứ tự hiển thị."
        actions={
          <>
            <PageGuideButton guide={MENUS_GUIDE} />
            <Button
              onClick={() => handleCreateNew()}
              className="h-9 gap-1.5 bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Plus size={16} /> Thêm menu gốc
            </Button>
          </>
        }
      />

      {/* KPI strip */}
      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm">
        <StatBlock label="Tổng menu" value={totalMenus} tone="neutral" />
        <Divider />
        <StatBlock label="Nhóm (không URL)" value={groupCount} tone="primary" />
        <Divider />
        <StatBlock label="Chức năng (có URL)" value={leafCount} tone="success" />
        <Divider />
        <StatBlock label="Đang tắt" value={inactiveCount} tone={inactiveCount > 0 ? 'warning' : 'neutral'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[calc(100vh-260px)]">

        {/* ═════════════════════════════ LEFT: Tree ═════════════════════════════ */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-neutral-200 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Tìm theo tên, mã hoặc URL…"
                className="pl-8 h-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={expandAll}
                className="flex-1 h-7 rounded-md text-xs text-neutral-600 hover:bg-neutral-100 inline-flex items-center justify-center gap-1"
                title="Mở tất cả"
              >
                <ExpandIcon size={12} /> Mở tất cả
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="flex-1 h-7 rounded-md text-xs text-neutral-600 hover:bg-neutral-100 inline-flex items-center justify-center gap-1"
                title="Thu gọn tất cả"
              >
                <MinusSquare size={12} /> Thu gọn
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : treeData.length === 0 ? (
              <div className="text-center p-6 text-sm text-neutral-500 space-y-2">
                <FolderTree className="w-8 h-8 mx-auto text-neutral-300" />
                <p>{search ? `Không có menu khớp "${search}"` : 'Chưa có menu nào'}</p>
                {!search && (
                  <Button size="sm" variant="outline" onClick={() => handleCreateNew()}>
                    <Plus size={12} className="mr-1" /> Tạo menu đầu tiên
                  </Button>
                )}
              </div>
            ) : (
              treeData.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  selectedId={selectedNode?.id || ''}
                  expandedCodes={expandedCodes}
                  toggleExpand={toggleExpand}
                  onSelect={handleSelectNode}
                  onAddChild={(pCode) => handleCreateNew(pCode)}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>

        {/* ═════════════════════════════ RIGHT: Form / Empty ═════════════════════════════ */}
        <div className="md:col-span-8 lg:col-span-9 bg-white border border-neutral-200 rounded-xl overflow-hidden flex flex-col">
          {!selectedNode && !isCreating ? (
            <EmptyStatePanel onCreate={() => handleCreateNew()} />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">

              {/* Sub-header: breadcrumb path + code chip + copy */}
              <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/60 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Breadcrumb path */}
                  {selectedPath.length > 1 && (
                    <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1 flex-wrap">
                      {selectedPath.slice(0, -1).map((p, idx) => (
                        <span key={p.code} className="flex items-center gap-1">
                          {idx > 0 && <ChevronRight size={10} className="text-neutral-300" />}
                          <span>{p.name}</span>
                        </span>
                      ))}
                      <ChevronRight size={10} className="text-neutral-300" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-lg font-bold text-neutral-800 truncate">
                      {isCreating
                        ? (parentValue ? `Thêm menu con của "${getParentPath(parentValue)}"` : 'Thêm menu gốc mới')
                        : selectedNode?.name}
                    </h2>
                    {!isCreating && selectedNode && (
                      <StatusBadge
                        label={watchedStatus ? 'Đang bật' : 'Đang tắt'}
                        color={watchedStatus ? 'success' : 'neutral'}
                      />
                    )}
                  </div>
                  {!isCreating && selectedNode && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => copyCode(selectedNode.code)}
                        className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-100 hover:bg-primary-100 transition-colors"
                        title="Bấm để copy mã"
                      >
                        {selectedNode.code}
                        {copiedCode === selectedNode.code ? (
                          <span className="text-green-600">✓ Đã copy</span>
                        ) : (
                          <Copy size={10} />
                        )}
                      </button>
                      {selectedNode.feUrl && (
                        <a
                          href={selectedNode.feUrl}
                          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-primary-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {selectedNode.feUrl} <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Form body — scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* Group / Leaf hint */}
                <div className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                  feUrlValue
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-primary-50 border-primary-200 text-primary-800'
                }`}>
                  {feUrlValue ? (
                    <FileText size={16} className="mt-0.5 shrink-0" />
                  ) : (
                    <FolderTree size={16} className="mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">
                      {feUrlValue ? 'Đây là Menu Chức năng (có URL)' : 'Đây là Menu Nhóm (không có URL)'}
                    </p>
                    <p className="text-xs opacity-80 mt-0.5">
                      {feUrlValue
                        ? 'User click sẽ điều hướng tới URL này — hãy chắc chắn route đã được khai báo ở frontend.'
                        : 'Menu nhóm chỉ để gom menu con; user click sẽ không đi đâu. Điền URL nếu muốn biến thành menu chức năng.'}
                    </p>
                  </div>
                </div>

                {/* Section 1: Định danh */}
                <SectionCard
                  index={1}
                  title="Định danh & Phân cấp"
                  hint="Mã và cha quyết định vị trí menu trong cây."
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Mã App" required error={errors.appCode?.message}>
                      <Input {...register('appCode')} placeholder="QTHT / QLNS / QLKH" className="bg-white" />
                    </Field>
                    <Field
                      label="Menu cha"
                      hint="Bỏ trống nếu là menu gốc"
                    >
                      <Select
                        options={parentOptions}
                        value={parentValue}
                        onChange={(v) => setValue('parentCode', v, { shouldValidate: true })}
                        placeholder="-- Menu gốc --"
                        showSearch
                        showClear
                      />
                    </Field>
                    <Field
                      label="Mã menu"
                      required
                      error={errors.code?.message}
                      hint="UPPER_SNAKE_CASE, không đổi được sau khi tạo"
                    >
                      <Input
                        {...register('code')}
                        disabled={!isCreating && !!selectedNode?.code}
                        placeholder="VD: MENU_USERS"
                        className="bg-white font-mono text-sm"
                      />
                    </Field>
                    <Field
                      label="Thứ tự"
                      hint="Nhỏ hiển thị trước"
                    >
                      <Input
                        type="number"
                        {...register('orderIndex', { valueAsNumber: true })}
                        className="bg-white"
                      />
                    </Field>
                  </div>
                </SectionCard>

                {/* Section 2: Hiển thị */}
                <SectionCard
                  index={2}
                  title="Hiển thị & Định tuyến"
                  hint="Cách menu xuất hiện trong sidebar và URL đích."
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Tên (Tiếng Việt)" required error={errors.name?.message}>
                      <Input {...register('name')} placeholder="VD: Quản lý người dùng" className="bg-white" />
                    </Field>
                    <Field label="Tên (Tiếng Anh)">
                      <Input {...register('nameEn')} placeholder="VD: User Management" className="bg-white" />
                    </Field>
                    <Field
                      label="URL Frontend"
                      hint={
                        <>
                          Để trống nếu là menu nhóm. Kebab-case, khớp route FE (VD: <code className="font-mono bg-neutral-100 px-1 rounded">/qtht/users</code>).
                        </>
                      }
                    >
                      <Input {...register('feUrl')} placeholder="/module/resource" className="bg-white font-mono text-sm" />
                    </Field>
                    <Field
                      label="Icon"
                      hint={
                        <span className="inline-flex items-center gap-1">
                          Preview: <IconPreview name={iconValue} size={14} /> {iconValue || <em className="text-neutral-400">chưa chọn</em>}
                        </span>
                      }
                    >
                      <IconPicker
                        value={iconValue}
                        onChange={(v) => setValue('icon', v, { shouldValidate: true, shouldDirty: true })}
                      />
                    </Field>
                  </div>
                </SectionCard>

                {/* Section 3: Trạng thái & Quyền */}
                <SectionCard
                  index={3}
                  title="Trạng thái & Quyền truy cập"
                  hint="Bật/tắt menu và cho phép user chưa đăng nhập thấy."
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleRow
                      label="Trạng thái hoạt động"
                      description="Tắt để ẩn menu khỏi tất cả user (kể cả admin)."
                      value={!!watchedStatus}
                      onChange={(v) => setValue('status', v, { shouldValidate: true, shouldDirty: true })}
                      onLabel="Bật"
                      offLabel="Tắt"
                    />
                    <ToggleRow
                      label="Menu công khai"
                      description="Bật để user chưa đăng nhập cũng thấy menu này (VD: About, Contact)."
                      value={!!watchedIsPublic}
                      onChange={(v) => setValue('isPublic', v, { shouldValidate: true, shouldDirty: true })}
                      onLabel="Công khai"
                      offLabel="Cần đăng nhập"
                    />
                  </div>
                </SectionCard>
              </div>

              {/* Footer actions */}
              <div className="border-t border-neutral-200 bg-neutral-50/60 px-6 py-3 flex items-center justify-between">
                <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                  <Info size={12} />
                  {isCreating
                    ? 'Menu mới sẽ ẩn với mọi user cho đến khi bạn gán vào Vai trò.'
                    : 'Thay đổi có hiệu lực ngay. User có thể cần đăng nhập lại để menu refresh.'}
                </div>
                <div className="flex items-center gap-2">
                  {isCreating && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setIsCreating(false); setSelectedNode(null); reset() }}
                    >
                      Hủy
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={createReq.isPending || updateReq.isPending}
                    className="bg-primary-600 hover:bg-primary-700 text-white min-w-[120px]"
                  >
                    {createReq.isPending || updateReq.isPending
                      ? 'Đang lưu…'
                      : isCreating ? 'Tạo mới' : 'Cập nhật'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Xoá menu"
        message={
          confirmDelete ? (
            <div className="space-y-2">
              <p>
                Bạn có chắc muốn xoá menu <strong>"{confirmDelete.name}"</strong> (
                <code className="font-mono text-xs">{confirmDelete.code}</code>)?
              </p>
              {countDescendants(confirmDelete) > 0 && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Menu này có <strong>{countDescendants(confirmDelete)} menu con</strong>. Toàn bộ sẽ bị gỡ khỏi mọi vai trò đang gán.
                  </span>
                </div>
              )}
            </div>
          ) : ''
        }
        variant="danger"
        confirmText="Xoá vĩnh viễn"
        cancelText="Hủy"
        isLoading={deleteReq.isPending}
      />
    </div>
  )
}

// ============================================================
// Small helpers
// ============================================================

function StatBlock({
  label, value, tone = 'neutral',
}: { label: string; value: number; tone?: 'neutral' | 'primary' | 'success' | 'warning' }) {
  const color = {
    neutral: 'text-neutral-900',
    primary: 'text-primary-700',
    success: 'text-green-700',
    warning: 'text-amber-600',
  }[tone]
  return (
    <div className="flex flex-col">
      <span className="text-neutral-500 font-medium">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  )
}

function Divider() {
  return <div className="w-px h-10 bg-neutral-200" aria-hidden="true" />
}

function SectionCard({
  index, title, hint, children,
}: {
  index: number
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div className="border-b border-neutral-100 bg-neutral-50/40 px-4 py-2.5 flex items-center gap-2">
        <span className="w-5 h-5 rounded-md bg-primary-100 text-primary-700 text-[11px] font-bold flex items-center justify-center">
          {index}
        </span>
        <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
        {hint && <span className="text-xs text-neutral-500 ml-auto">{hint}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Field({
  label, required, error, hint, children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-neutral-500 leading-snug">{hint}</p>
      ) : null}
    </div>
  )
}

function ToggleRow({
  label, description, value, onChange, onLabel = 'Bật', offLabel = 'Tắt',
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
  onLabel?: string
  offLabel?: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3">
      <Switch checked={value} onChange={onChange} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-800">
          {label} <span className="text-xs font-normal text-neutral-500">— {value ? onLabel : offLabel}</span>
        </p>
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

function EmptyStatePanel({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-10">
      <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center mb-4 relative">
        <FolderTree className="w-10 h-10 text-primary-500" />
        <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1" />
      </div>
      <h3 className="text-base font-semibold text-neutral-800">Chọn menu để chỉnh sửa</h3>
      <p className="text-sm text-neutral-500 mt-1 max-w-md">
        Bấm vào một menu trong cây bên trái để xem chi tiết và cập nhật cấu hình. Hoặc tạo menu mới ngay bây giờ.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <Button onClick={onCreate} className="bg-primary-600 hover:bg-primary-700 text-white">
          <Plus size={14} className="mr-1.5" /> Thêm menu gốc mới
        </Button>
      </div>
      <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 max-w-md text-left">
        <p className="text-xs font-semibold text-neutral-700 mb-2">Mẹo nhanh</p>
        <ul className="text-xs text-neutral-600 space-y-1.5 list-disc list-inside">
          <li>Menu <strong>Nhóm</strong> = không có URL (chỉ để gom con)</li>
          <li>Menu <strong>Chức năng</strong> = có URL khớp route FE</li>
          <li>Hover một menu trong cây để hiện nút <em>thêm con</em> / <em>xoá</em></li>
        </ul>
      </div>
    </div>
  )
}
