// ============================================================
// WorkflowsPage — Trung tâm cấu hình quy trình duyệt
// ------------------------------------------------------------
// Admin dùng trang này để:
//   - Xem tất cả template quy trình đang có (nhóm theo module)
//   - Thêm quy trình mới hoặc sửa step cho quy trình có sẵn
//   - Bật/tắt / xoá quy trình
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Plus, Workflow, Search, X, RefreshCw, Edit3, Trash2,
  Layers, Building2, ClipboardList, Package, FileText, Briefcase,
  type LucideIcon, MoreVertical, Copy, BookOpen, BookTemplate, PencilRuler,
} from 'lucide-react'
import {
  Button, PageHeader, EmptyState, PageGuideButton, ErrorState, Skeleton, ConfirmDialog,
} from '@frezo/ui'
import { toast } from 'sonner'
import { useWorkflowDefinitions, useDeleteWorkflowDefinition } from '../hooks/useWorkflow'
import type { WorkflowDefinition } from '../services/workflowApi'
import { WorkflowEditorDrawer } from '../components/WorkflowEditorDrawer'
import { WorkflowStepper } from '@/components/workflow/WorkflowStepper'
import { WORKFLOWS_GUIDE } from '../constants/workflows.guide'
import { usePermission } from '@/lib/hooks/usePermission'

const MODULE_META: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  ASSET:    { icon: Package,       label: 'Quản lý tài sản', color: 'text-warning-dark bg-warning-light border-warning/20' },
  LEAVE:    { icon: Briefcase,     label: 'Nghỉ phép',       color: 'text-primary-700 bg-primary-50 border-primary-100' },
  CONTRACT: { icon: FileText,      label: 'Hợp đồng',        color: 'text-neutral-700 bg-neutral-50 border-neutral-200' },
  DEFAULT:  { icon: Building2,     label: 'Khác',            color: 'text-neutral-600 bg-neutral-50 border-neutral-200' },
}

type LocationEditState = { editWorkflowId?: string }

export function WorkflowsPage() {
  const nav = useNavigate()
  const location = useLocation()
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | 'NEW' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WorkflowDefinition | null>(null)

  const {
    data: defs = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useWorkflowDefinitions()
  const del = useDeleteWorkflowDefinition()
  const canCreate = usePermission('WF.DEFINITIONS.CREATE')
  const canDelete = usePermission('WF.DEFINITIONS.DELETE')
  const canUpdateVisual = usePermission('WORKFLOWS.DEFINITIONS.UPDATE')

  // Path A: Designer CTA → mở drawer Chỉnh sửa từ list
  useEffect(() => {
    const editId = (location.state as LocationEditState | null)?.editWorkflowId
    if (!editId) return
    setEditingId(editId)
    nav(location.pathname, { replace: true, state: {} })
  }, [location.state, location.pathname, nav])

  // Filter
  const filtered = useMemo(() => {
    let list = [...defs]
    if (moduleFilter !== 'all') list = list.filter((d) => d.moduleCode === moduleFilter)
    if (search.trim()) {
      const s = search.trim().toLowerCase()
      list = list.filter((d) =>
        d.name.toLowerCase().includes(s) ||
        d.code.toLowerCase().includes(s) ||
        (d.description || '').toLowerCase().includes(s),
      )
    }
    return list
  }, [defs, moduleFilter, search])

  // Group by module for display
  const groups = useMemo(() => {
    const g = new Map<string, WorkflowDefinition[]>()
    filtered.forEach((d) => {
      if (!g.has(d.moduleCode)) g.set(d.moduleCode, [])
      g.get(d.moduleCode)!.push(d)
    })
    return Array.from(g.entries())
  }, [filtered])

  const availableModules = useMemo(() => {
    const s = new Set(defs.map((d) => d.moduleCode))
    return Array.from(s)
  }, [defs])

  const stats = useMemo(() => {
    return {
      total: defs.length,
      active: defs.filter((d) => d.active).length,
      modules: availableModules.length,
    }
  }, [defs, availableModules])

  const handleConfirmDelete = () => {
    if (!deleteTarget?.id) return
    del.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  const handleClone = (d: WorkflowDefinition) => {
    toast.info('Đã copy — điều chỉnh mã & tên rồi lưu')
    setCloneSource(d)
    setEditingId('NEW')
  }

  const [cloneSource, setCloneSource] = useState<WorkflowDefinition | null>(null)

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
              <Workflow size={16} />
            </span>
            Thiết kế template quy trình
          </span>
        }
        description={
          <>
            Cấu hình bước duyệt cho từng module.
            <span className="text-neutral-400"> · </span>
            <b className="text-neutral-700">{stats.total}</b> quy trình
            <span className="text-neutral-400"> · </span>
            <b className="text-success">{stats.active}</b> đang bật
            <span className="text-neutral-400"> · </span>
            <b className="text-neutral-700">{stats.modules}</b> module
          </>
        }
        actions={
          <>
            <PageGuideButton guide={WORKFLOWS_GUIDE} />
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => nav('/qtht/workflows/templates')}
            >
              <BookTemplate size={14} /> Thư viện mẫu
            </Button>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Làm mới
            </Button>
            {canCreate && (
              <Button onClick={() => { setCloneSource(null); setEditingId('NEW') }} className="gap-1.5">
                <Plus size={14} /> Thêm quy trình
              </Button>
            )}
          </>
        }
      />

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã, mô tả..."
            className="w-full h-9 pl-9 pr-9 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <ModuleChip active={moduleFilter === 'all'} onClick={() => setModuleFilter('all')} label="Tất cả module" />
          {availableModules.map((m) => (
            <ModuleChip key={m} active={moduleFilter === m}
              onClick={() => setModuleFilter(m)}
              label={MODULE_META[m]?.label || m} />
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <WorkflowsCardSkeleton />
      ) : isError ? (
        <div className="bg-white rounded-xl border border-neutral-200">
          <ErrorState
            title="Không tải được quy trình"
            message="Vui lòng thử lại. Nếu lỗi tiếp diễn, kiểm tra kết nối hoặc quyền truy cập."
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200">
          <EmptyState
            icon={Workflow}
            title={search || moduleFilter !== 'all' ? 'Không có quy trình khớp bộ lọc' : 'Chưa có quy trình nào'}
            description={
              search || moduleFilter !== 'all'
                ? 'Thử xoá bộ lọc hoặc từ khoá.'
                : 'Đọc hướng dẫn trước khi tạo — cấu hình sai sẽ ảnh hưởng duyệt đơn thật.'
            }
            action={
              search || moduleFilter !== 'all' ? (
                {
                  label: 'Xoá bộ lọc',
                  onClick: () => {
                    setSearch('')
                    setModuleFilter('all')
                  },
                }
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => nav('/docs/guide-workflows')}
                  >
                    <BookOpen size={14} /> Đọc hướng dẫn trước
                  </Button>
                  {canCreate && (
                    <Button
                      className="gap-1.5"
                      onClick={() => {
                        setCloneSource(null)
                        setEditingId('NEW')
                      }}
                    >
                      <Plus size={14} /> Tạo quy trình
                    </Button>
                  )}
                </div>
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([moduleCode, defsInModule]) => {
            const meta = MODULE_META[moduleCode] || MODULE_META.DEFAULT
            const Icon = meta.icon
            return (
              <section key={moduleCode}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-semibold ${meta.color}`}>
                    <Icon size={12} /> {meta.label}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">{moduleCode}</span>
                  <span className="text-xs text-neutral-500">· {defsInModule.length} quy trình</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {defsInModule.map((d) => (
                    <DefinitionCard
                      key={d.id}
                      def={d}
                      onEdit={canCreate || canUpdateVisual ? () => setEditingId(d.id!) : undefined}
                      onDelete={canDelete ? () => setDeleteTarget(d) : undefined}
                      onClone={canCreate ? () => handleClone(d) : undefined}
                      onOpenDesigner={
                        canUpdateVisual
                          ? () => nav(`/qtht/workflows/${d.id}/designer`)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {editingId && (
        <WorkflowEditorDrawer
          key={editingId + (cloneSource?.id || '')}
          definitionId={editingId === 'NEW' ? null : editingId}
          cloneFrom={editingId === 'NEW' ? cloneSource : null}
          onClose={() => { setEditingId(null); setCloneSource(null) }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Xoá quy trình "${deleteTarget?.name || ''}"?`}
        message="Các instance đang chạy vẫn giữ steps cũ. Hành động này không hoàn tác từ danh sách."
        confirmText="Xoá quy trình"
        cancelText="Huỷ"
        variant="danger"
        isLoading={del.isPending}
      />
    </div>
  )
}

function WorkflowsCardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Đang tải quy trình">
      {[0, 1].map((g) => (
        <section key={g}>
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-6 w-32 rounded-md" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[0, 1, 2, 3].slice(0, g === 0 ? 4 : 2).map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                  <Skeleton className="h-7 w-7 rounded-lg" />
                </div>
                <div className="border-t border-neutral-100 pt-3 space-y-2">
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

// ============================================================
// DefinitionCard
// ============================================================

function DefinitionCard({
  def, onEdit, onDelete, onClone, onOpenDesigner,
}: {
  def: WorkflowDefinition
  onEdit?: () => void
  onDelete?: () => void
  onClone?: () => void
  onOpenDesigner?: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const hasMenu = !!(onEdit || onClone || onDelete)
  return (
    <div className="bg-white rounded-xl border border-neutral-200 hover:border-primary-200 hover:shadow-md transition p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full ${def.active ? 'bg-success' : 'bg-neutral-300'}`} />
            <span className="text-[10px] font-mono text-neutral-500 tracking-tight">{def.code}</span>
            {!def.active && (
              <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1 rounded">TẮT</span>
            )}
          </div>
          <div className="font-semibold text-neutral-900 truncate">{def.name}</div>
          {def.description && (
            <div className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{def.description}</div>
          )}
        </div>

        {/* Menu */}
        {hasMenu && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 text-sm">
                  {onEdit && (
                    <button type="button" onClick={() => { setMenuOpen(false); onEdit() }} className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 inline-flex items-center gap-2">
                      <Edit3 size={12} /> Sửa
                    </button>
                  )}
                  {onClone && (
                    <button type="button" onClick={() => { setMenuOpen(false); onClone() }} className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 inline-flex items-center gap-2">
                      <Copy size={12} /> Copy
                    </button>
                  )}
                  {onDelete && (
                    <button type="button" onClick={() => { setMenuOpen(false); onDelete() }} className="w-full text-left px-3 py-1.5 hover:bg-danger-light text-danger inline-flex items-center gap-2">
                      <Trash2 size={12} /> Xoá
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Steps preview */}
      <div className="border-t border-neutral-100 pt-3">
        {(def.steps || []).length === 0 ? (
          <div className="text-xs text-warning-dark bg-warning-light border border-warning/20 rounded px-2 py-1 inline-flex items-center gap-1">
            <ClipboardList size={11} /> Chưa có bước nào — bấm Sửa để thêm
          </div>
        ) : (
          <WorkflowStepper
            steps={(def.steps || []).map((s) => ({
              label: s.stepName,
              actor: describeActor(s.approverType, s.approverValue),
            }))}
            currentIndex={-1}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-auto gap-2">
        <span className="inline-flex items-center gap-1">
          <Layers size={11} /> {(def.steps || []).length} bước
        </span>
        <div className="flex items-center gap-2">
          {onOpenDesigner && (
            <button
              type="button"
              onClick={onOpenDesigner}
              className="inline-flex items-center gap-1 text-neutral-600 hover:text-primary-700 font-medium"
            >
              <PencilRuler size={11} /> Designer
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium"
            >
              <Edit3 size={11} /> Chỉnh sửa
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function describeActor(type: string, value?: string | null): string {
  if (type === 'USER') return value ? `@${value}` : 'Người cụ thể'
  if (type === 'ROLE') return value ? `Role: ${value}` : 'Role'
  if (type === 'MANAGER') return 'Quản lý'
  if (type === 'ADMIN') return 'Admin'
  return type
}

// ============================================================
// Module filter chip
// ============================================================

function ModuleChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-md text-xs font-medium transition ${
        active
          ? 'bg-primary-100 text-primary-700'
          : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
      }`}
    >
      {label}
    </button>
  )
}
