// ============================================================
// WorkflowsPage — Trung tâm cấu hình quy trình duyệt
// ------------------------------------------------------------
// Admin dùng trang này để:
//   - Xem tất cả template quy trình đang có (nhóm theo module)
//   - Thêm quy trình mới hoặc sửa step cho quy trình có sẵn
//   - Bật/tắt / xoá quy trình
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus, Workflow, Search, X, RefreshCw,
  Layers, Building2, ClipboardList, Package, FileText, Briefcase,
  type LucideIcon, BookOpen, BookTemplate, PencilRuler, Info,
  ArrowUpDown,
} from 'lucide-react'
import {
  Button, PageHeader, EmptyState, PageGuideButton, ErrorState, Skeleton, ConfirmDialog,
  Select, RowActions,
} from '@frezo/ui'
import { FilterExportDrawer, FilterExportTrigger } from '@/components/shared/FilterExportDrawer'
import { downloadCsv } from '@/utils/csvExport'
import { toast } from 'sonner'
import { useWorkflowDefinitions, useDeleteWorkflowDefinition } from '../hooks/useWorkflow'
import type { WorkflowDefinition } from '../services/workflowApi'
import { WorkflowEditorDrawer } from '../components/WorkflowEditorDrawer'
import { WorkflowStepper } from '@/components/workflow/WorkflowStepper'
import { WORKFLOWS_GUIDE } from '../constants/workflows.guide'
import { usePermission } from '@/lib/hooks/usePermission'
import { pageRootClass } from '@/modules/approval/utils/pageEmbed'

type SortKey = 'name' | 'code' | 'module' | 'steps' | 'active'
type ActiveFilter = 'all' | 'on' | 'off'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name', label: 'Tên A→Z' },
  { value: 'code', label: 'Mã A→Z' },
  { value: 'module', label: 'Theo module' },
  { value: 'steps', label: 'Số bước (nhiều → ít)' },
  { value: 'active', label: 'Đang bật trước' },
]

const MODULE_META: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  ASSET:    { icon: Package,       label: 'Quản lý tài sản', color: 'text-warning-dark bg-warning-light border-warning/20' },
  LEAVE:    { icon: Briefcase,     label: 'Nghỉ phép',       color: 'text-primary-700 bg-primary-50 border-primary-100' },
  CONTRACT: { icon: FileText,      label: 'Hợp đồng',        color: 'text-neutral-700 bg-neutral-50 border-neutral-200' },
  DEFAULT:  { icon: Building2,     label: 'Khác',            color: 'text-neutral-600 bg-neutral-50 border-neutral-200' },
}

/** Module có runtime Approval Engine — gallery/visual không tự gắn đơn. */
const RUNTIME_VIA_APPROVAL_FLOWS: Record<string, string> = {
  LEAVE: 'Nghỉ phép',
  PAYROLL: 'Bảng lương',
  PURCHASE: 'Yêu cầu mua',
  PURCHASE_REQUEST: 'Yêu cầu mua',
}

type LocationEditState = { editWorkflowId?: string }

export function WorkflowsPage({ embedded }: { embedded?: boolean } = {}) {
  const nav = useNavigate()
  const location = useLocation()
  const [, setSearchParams] = useSearchParams()
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('module')
  const [toolsOpen, setToolsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | 'NEW' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WorkflowDefinition | null>(null)
  const [cloneSource, setCloneSource] = useState<WorkflowDefinition | null>(null)

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

  const clearFilters = () => {
    setSearch('')
    setModuleFilter('all')
    setActiveFilter('all')
    setSortKey('module')
  }

  const hasFilter =
    !!search.trim() || moduleFilter !== 'all' || activeFilter !== 'all' || sortKey !== 'module'

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (moduleFilter !== 'all' ? 1 : 0) +
    (activeFilter !== 'all' ? 1 : 0) +
    (sortKey !== 'module' ? 1 : 0)

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...defs]
    if (moduleFilter !== 'all') list = list.filter((d) => d.moduleCode === moduleFilter)
    if (activeFilter === 'on') list = list.filter((d) => !!d.active)
    if (activeFilter === 'off') list = list.filter((d) => !d.active)
    if (search.trim()) {
      const s = search.trim().toLowerCase()
      list = list.filter((d) =>
        d.name.toLowerCase().includes(s) ||
        d.code.toLowerCase().includes(s) ||
        (d.description || '').toLowerCase().includes(s),
      )
    }
    list.sort((a, b) => {
      switch (sortKey) {
        case 'code':
          return a.code.localeCompare(b.code, 'vi')
        case 'module': {
          const mod = a.moduleCode.localeCompare(b.moduleCode, 'vi')
          return mod !== 0 ? mod : a.name.localeCompare(b.name, 'vi')
        }
        case 'steps':
          return (b.steps?.length || 0) - (a.steps?.length || 0)
        case 'active': {
          const av = Number(!!b.active) - Number(!!a.active)
          return av !== 0 ? av : a.name.localeCompare(b.name, 'vi')
        }
        case 'name':
        default:
          return a.name.localeCompare(b.name, 'vi')
      }
    })
    return list
  }, [defs, moduleFilter, activeFilter, search, sortKey])

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

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      toast.error('Không có quy trình để xuất')
      return
    }
    downloadCsv(
      'quy-trinh-workflow.csv',
      filtered.map((d) => ({
        code: d.code,
        name: d.name,
        moduleCode: d.moduleCode,
        moduleLabel: MODULE_META[d.moduleCode]?.label || d.moduleCode,
        active: d.active ? 'Bật' : 'Tắt',
        steps: (d.steps || []).length,
        description: d.description || '',
        editorMode: d.editorMode || '',
      })),
      [
        { key: 'code', label: 'Mã' },
        { key: 'name', label: 'Tên' },
        { key: 'moduleCode', label: 'Mã module' },
        { key: 'moduleLabel', label: 'Module' },
        { key: 'active', label: 'Trạng thái' },
        { key: 'steps', label: 'Số bước' },
        { key: 'description', label: 'Mô tả' },
        { key: 'editorMode', label: 'Chế độ' },
      ],
    )
    toast.success(`Đã xuất ${filtered.length} quy trình ra CSV`)
  }

  const goFlowsTab = () => {
    if (embedded) {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev)
          sp.delete('tab')
          return sp
        },
        { replace: true },
      )
      return
    }
    nav('/approval/flows')
  }

  const headerActions = (
    <div className="flex flex-wrap gap-2 items-center">
      <PageGuideButton guide={WORKFLOWS_GUIDE} />
      <FilterExportTrigger
        onClick={() => setToolsOpen(true)}
        activeCount={activeFilterCount}
      />
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
    </div>
  )

  return (
    <div className={pageRootClass(embedded)}>
      {!embedded && (
        <PageHeader
          title="Thiết kế template quy trình"
          description={
            <>
              Cấu hình bước duyệt cho từng module.
              <span className="text-neutral-400"> · </span>
              <b className="text-neutral-700">{stats.total}</b> quy trình
              <span className="text-neutral-400"> · </span>
              <b className="text-success">{stats.active}</b> đang bật
              <span className="text-neutral-400"> · </span>
              <b className="text-neutral-700">{stats.modules}</b> module
              {hasFilter && (
                <>
                  <span className="text-neutral-400"> · </span>
                  <span className="text-neutral-500 tabular-nums">
                    {filtered.length} đang hiển thị
                  </span>
                </>
              )}
            </>
          }
          actions={headerActions}
        />
      )}
      {embedded && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-neutral-600">
            <b className="text-neutral-800">{stats.total}</b> mẫu
            <span className="text-neutral-400"> · </span>
            <b className="text-success">{stats.active}</b> đang bật
            <span className="text-neutral-400"> · </span>
            <b className="text-neutral-800">{stats.modules}</b> module
            {hasFilter && (
              <>
                <span className="text-neutral-400"> · </span>
                <span className="tabular-nums">{filtered.length} đang hiển thị</span>
              </>
            )}
          </p>
          {headerActions}
        </div>
      )}

      {/* Designer ≠ hộp thư duyệt hàng ngày; runtime gắn ở tab Luồng đang chạy */}
      <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-950">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="leading-snug">
          Tab này chỉ <b>thiết kế mẫu</b>. Duyệt đơn hàng ngày ở{' '}
          <Link to="/approval/inbox" className="font-semibold underline underline-offset-2 hover:text-amber-800">
            Hộp thư duyệt
          </Link>
          {' '}· gắn luồng nghiệp vụ (nghỉ / mua / lương) ở tab{' '}
          <button
            type="button"
            onClick={goFlowsTab}
            className="font-semibold underline underline-offset-2 hover:text-amber-800"
          >
            Luồng đang chạy
          </button>
          .
        </p>
      </div>

      {/* Active filter chips — progressive disclosure, không chiếm FilterBar */}
      {hasFilter && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
          <span className="tabular-nums font-medium text-neutral-700">
            {filtered.length} quy trình (đã lọc)
          </span>
          {search.trim() && (
            <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1">
              Từ khoá: {search.trim()}
              <button type="button" onClick={() => setSearch('')} className="text-neutral-400 hover:text-neutral-700" aria-label="Xoá từ khoá">
                <X size={12} />
              </button>
            </span>
          )}
          {moduleFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1">
              Module: {MODULE_META[moduleFilter]?.label || moduleFilter}
              <button type="button" onClick={() => setModuleFilter('all')} className="text-neutral-400 hover:text-neutral-700" aria-label="Xoá lọc module">
                <X size={12} />
              </button>
            </span>
          )}
          {activeFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1">
              {activeFilter === 'on' ? 'Đang bật' : 'Đã tắt'}
              <button type="button" onClick={() => setActiveFilter('all')} className="text-neutral-400 hover:text-neutral-700" aria-label="Xoá lọc trạng thái">
                <X size={12} />
              </button>
            </span>
          )}
          {sortKey !== 'module' && (
            <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1">
              <ArrowUpDown size={11} /> {SORT_OPTIONS.find((o) => o.value === sortKey)?.label}
              <button type="button" onClick={() => setSortKey('module')} className="text-neutral-400 hover:text-neutral-700" aria-label="Đặt lại sắp xếp">
                <X size={12} />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={clearFilters}
            className="text-primary-700 hover:underline font-medium"
          >
            Xoá tất cả
          </button>
        </div>
      )}

      <FilterExportDrawer
        isOpen={toolsOpen}
        onClose={() => setToolsOpen(false)}
        hasActiveFilters={hasFilter}
        onClear={clearFilters}
        onExport={handleExportCsv}
        exportDisabled={filtered.length === 0}
        description="Lọc, sắp xếp danh sách template hoặc xuất CSV — không tách trang riêng."
      >
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Lọc</h3>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-600" htmlFor="wf-tools-search">Tìm kiếm</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="wf-tools-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tên, mã, mô tả…"
                className="w-full h-9 pl-8 pr-8 rounded-md border border-neutral-200 bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
                aria-label="Tìm quy trình"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                  aria-label="Xoá tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-600">Module</label>
            <Select
              options={[
                { value: 'all', label: 'Tất cả module' },
                ...availableModules.map((m) => ({
                  value: m,
                  label: MODULE_META[m]?.label || m,
                })),
              ]}
              value={moduleFilter}
              onChange={setModuleFilter}
              placeholder="Module"
              aria-label="Lọc theo module"
              showSearch={false}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-600">Trạng thái</label>
            <Select
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'on', label: 'Đang bật' },
                { value: 'off', label: 'Đã tắt' },
              ]}
              value={activeFilter}
              onChange={(v) => setActiveFilter(v as ActiveFilter)}
              placeholder="Trạng thái"
              aria-label="Lọc trạng thái"
              showSearch={false}
            />
          </div>
        </section>

        <details className="group rounded-lg border border-neutral-200 bg-neutral-50/60 open:bg-white">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-neutral-800 flex items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-1.5">
              <ArrowUpDown size={14} className="text-neutral-500" />
              Sắp xếp
            </span>
            <span className="text-xs font-normal text-neutral-500">
              {SORT_OPTIONS.find((o) => o.value === sortKey)?.label}
            </span>
          </summary>
          <div className="px-3 pb-3 space-y-1.5 border-t border-neutral-100 pt-2">
            <Select
              options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={sortKey}
              onChange={(v) => setSortKey(v as SortKey)}
              placeholder="Sắp xếp"
              aria-label="Sắp xếp danh sách"
              showSearch={false}
            />
          </div>
        </details>

        <p className="text-[11px] text-neutral-500 leading-snug">
          Xuất CSV dùng danh sách đang lọc ({filtered.length} dòng). Nút xuất ở cuối panel.
        </p>
      </FilterExportDrawer>

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
            title={hasFilter ? 'Không có bản ghi phù hợp bộ lọc' : 'Chưa có quy trình nào'}
            description={
              hasFilter
                ? 'Thử xoá bộ lọc hoặc từ khoá.'
                : 'Đọc hướng dẫn trước khi tạo — cấu hình sai sẽ ảnh hưởng duyệt đơn thật.'
            }
            action={
              hasFilter ? (
                {
                  label: 'Xoá lọc',
                  onClick: clearFilters,
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
  const hasActions = !!(onEdit || onClone || onDelete || onOpenDesigner)
  return (
    <div className="bg-white rounded-xl border border-neutral-200 hover:border-primary-200 hover:shadow-md transition p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className={`w-1.5 h-1.5 rounded-full ${def.active ? 'bg-success' : 'bg-neutral-300'}`} />
            <span className="text-[10px] font-mono text-neutral-500 tracking-tight">{def.code}</span>
            {!def.active && (
              <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1 rounded">TẮT</span>
            )}
            <ApplyBadge moduleCode={def.moduleCode} active={def.active} />
          </div>
          <div className="font-semibold text-neutral-900 truncate">{def.name}</div>
          {def.description && (
            <div className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{def.description}</div>
          )}
        </div>

        {hasActions && (
          <RowActions
            className="shrink-0"
            actions={[
              {
                key: 'designer',
                icon: PencilRuler,
                tooltip: 'Designer',
                tone: 'blue',
                hidden: !onOpenDesigner,
                onClick: () => onOpenDesigner?.(),
              },
              { kind: 'edit', hidden: !onEdit, onClick: () => onEdit?.() },
              { kind: 'copy', hidden: !onClone, onClick: () => onClone?.() },
              { kind: 'delete', hidden: !onDelete, onClick: () => onDelete?.() },
            ]}
          />
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

function ApplyBadge({ moduleCode, active }: { moduleCode: string; active: boolean }) {
  const runtimeLabel = RUNTIME_VIA_APPROVAL_FLOWS[moduleCode]
  if (runtimeLabel) {
    return (
      <Link
        to="/approval/flows"
        className="text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded hover:bg-amber-100"
        title="Runtime duyệt đơn — tab Luồng đang chạy"
      >
        Áp dụng: Chưa gắn runtime · {runtimeLabel} → Luồng đang chạy
      </Link>
    )
  }
  if (!active) {
    return (
      <span className="text-[10px] font-medium text-neutral-500 bg-neutral-50 border border-neutral-200 px-1.5 py-0.5 rounded">
        Chưa gắn — không tự chạy
      </span>
    )
  }
  return (
    <span className="text-[10px] font-medium text-neutral-600 bg-neutral-50 border border-neutral-200 px-1.5 py-0.5 rounded">
      Áp dụng: Template thiết kế
    </span>
  )
}



