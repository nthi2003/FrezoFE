// ============================================================
// AssetsPage — Quản lý tài sản (QLTS)
// ------------------------------------------------------------
// Layout: PageHeader + KPI strip + Toolbar + Grid/Table view
// Actions: Create modal, Detail drawer, Assign modal
// ============================================================

import { useMemo, useState } from 'react'
import {
  Plus, Search, X, RefreshCw, Filter, LayoutGrid, List, Package,
  CheckCircle2, Wrench, DollarSign, Shield, Loader2, MapPin,
  UserCheck, ArrowRight, ClipboardCheck, type LucideIcon,
} from 'lucide-react'
import { Button, PageHeader, EmptyState, PageGuideButton } from '@frezo/ui'
import { useCategories } from '@/modules/qtht/hooks/useCategory'
import { useAssets, useAssetStats } from '../hooks/useAsset'
import { useTransferRequests } from '../hooks/useTransferRequest'
import type { AssetItem, AssetStatus } from '../services/assetApi'
import { STATUS_META, getCategoryIcon, fmtMoney, fmtDate, daysUntil } from '../constants/assetMeta'
import { ASSETS_GUIDE } from '../constants/assets.guide'
import { ASSETS_ASSIGN_GUIDE } from '../constants/assets-assign.guide'
import { AssetFormModal } from '../components/AssetFormModal'
import { AssetDetailDrawer } from '../components/AssetDetailDrawer'
import { AssetAssignModal } from '../components/AssetAssignModal'
import { TransferRequestsPanel } from '../components/TransferRequestsPanel'

type ViewMode = 'grid' | 'table'
type TabKey = 'assets' | 'requests'

export function AssetsPage() {
  const [tab, setTab] = useState<TabKey>('assets')
  const [view, setView] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AssetStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AssetItem | null>(null)
  const [activeAsset, setActiveAsset] = useState<AssetItem | null>(null)
  const [assignAsset, setAssignAsset] = useState<AssetItem | null>(null)

  // Badge count cho tab "Yêu cầu" — nhẹ, chỉ đếm PENDING (auto-refetch mỗi 30s trong hook)
  const { data: pendingRequests } = useTransferRequests({ status: 'PENDING', size: 1 })
  const pendingCount = pendingRequests?.total || 0

  // ---- Data ----
  const { data: assetsRes, isLoading, isFetching, refetch } = useAssets({
    keyword: search.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    categoryCode: categoryFilter !== 'all' ? categoryFilter : undefined,
    page: 1,
    size: 200, // client-side filter cho SMB (< 500 asset)
  })
  const items = assetsRes?.items || []
  const { data: stats } = useAssetStats()
  // Loại tài sản được quản lý ở /admin/category-management dưới group `LoaiTaiSan`
  const { data: categoriesRaw } = useCategories('LoaiTaiSan')
  const categories = (Array.isArray(categoriesRaw) ? categoriesRaw : []) as any[]

  const hasFilter = search || statusFilter !== 'all' || categoryFilter !== 'all'
  const clearFilters = () => {
    setSearch(''); setStatusFilter('all'); setCategoryFilter('all')
  }

  // Keep drawer sync với data mới sau mutation
  const displayActive = useMemo(() => {
    if (!activeAsset) return null
    const fresh = items.find((a) => a.id === activeAsset.id)
    return fresh || activeAsset
  }, [activeAsset, items])

  const openEdit = (a: AssetItem) => {
    setEditing(a)
    setFormOpen(true)
  }
  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openAssign = (a: AssetItem) => setAssignAsset(a)

  /** Từ tab Yêu cầu → sang tab Tài sản, sẵn sàng lọc Sẵn sàng để bấm Cấp phát. */
  const goCreateAssignRequest = () => {
    setTab('assets')
    setStatusFilter('AVAILABLE')
    setSearch('')
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
              <Package size={16} />
            </span>
            Quản lý tài sản
          </span>
        }
        description="Kiểm kê, cấp phát, bảo trì và thanh lý tài sản của doanh nghiệp"
        actions={
          <>
            <PageGuideButton guide={tab === 'requests' ? ASSETS_ASSIGN_GUIDE : ASSETS_GUIDE} />
            {tab === 'assets' && (
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
                <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                Làm mới
              </Button>
            )}
            {tab === 'requests' && (
              <Button variant="outline" onClick={goCreateAssignRequest} className="gap-1.5">
                <ArrowRight size={14} /> Gửi yêu cầu cấp phát
              </Button>
            )}
            <Button onClick={openCreate} className="gap-1.5">
              <Plus size={14} /> Thêm tài sản
            </Button>
          </>
        }
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-neutral-200 -mt-3">
        <TabButton active={tab === 'assets'} onClick={() => setTab('assets')} icon={Package} label="Tài sản" />
        <TabButton
          active={tab === 'requests'}
          onClick={() => setTab('requests')}
          icon={ClipboardCheck}
          label="Yêu cầu cấp phát"
          badge={pendingCount > 0 ? pendingCount : undefined}
        />
      </div>

      {tab === 'requests' ? (
        <TransferRequestsPanel onGoCreateRequest={goCreateAssignRequest} />
      ) : (
        <>

      {statusFilter === 'AVAILABLE' && (
        <div className="rounded-xl border border-primary-200 bg-primary-50/70 px-4 py-3 text-sm text-primary-900">
          <p className="font-semibold">Gửi yêu cầu cấp phát</p>
          <p className="mt-1 text-primary-800/90">
            Chọn một tài sản <strong>Sẵn sàng</strong> bên dưới → bấm <strong>Cấp phát</strong> trên thẻ
            (hoặc mở chi tiết → <strong>Cấp phát</strong>) → chọn nhân viên nhận và gửi.
          </p>
        </div>
      )}

      {/* KPI strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <KpiCard icon={Package}       label="Tổng"           value={String(stats.total)}          tone="neutral" />
          <KpiCard icon={UserCheck}     label="Đang dùng"      value={String(stats.inUse)}          tone="blue" />
          <KpiCard icon={CheckCircle2}  label="Sẵn sàng"       value={String(stats.available)}      tone="emerald" />
          <KpiCard icon={Wrench}        label="Đang bảo trì"   value={String(stats.maintenance)}    tone="amber" />
          <KpiCard icon={Shield}        label="Sắp hết BH"     value={String(stats.warrantyExpiringSoon)} tone={stats.warrantyExpiringSoon > 0 ? 'rose' : 'neutral'} />
          <KpiCard icon={DollarSign}    label="Giá trị"        value={fmtMoney(stats.totalValue)}   tone="violet" />
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-3 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã, tên, hãng, serial..."
            className="w-full h-9 pl-9 pr-9 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-neutral-200 bg-white text-sm focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none"
        >
          <option value="all">Tất cả loại</option>
          {categories.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>

        {/* Status chips */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 inline-flex items-center gap-1 mr-1">
            <Filter size={11} /> Trạng thái:
          </span>
          <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} label="Tất cả" />
          <FilterChip active={statusFilter === 'AVAILABLE'} onClick={() => setStatusFilter('AVAILABLE')} label="Sẵn sàng" tone="emerald" />
          <FilterChip active={statusFilter === 'IN_USE'} onClick={() => setStatusFilter('IN_USE')} label="Đang dùng" tone="blue" />
          <FilterChip active={statusFilter === 'MAINTENANCE'} onClick={() => setStatusFilter('MAINTENANCE')} label="Bảo trì" tone="amber" />
          <FilterChip active={statusFilter === 'DISPOSED'} onClick={() => setStatusFilter('DISPOSED')} label="Thanh lý" tone="neutral" />
        </div>

        {hasFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          >
            <X size={12} /> Xoá lọc
          </button>
        )}

        {/* View toggle */}
        <div className="ml-auto flex items-center bg-neutral-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setView('grid')}
            className={`px-2.5 h-8 rounded text-xs font-semibold inline-flex items-center gap-1 transition ${
              view === 'grid' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500'
            }`}
          >
            <LayoutGrid size={13} /> Grid
          </button>
          <button
            type="button"
            onClick={() => setView('table')}
            className={`px-2.5 h-8 rounded text-xs font-semibold inline-flex items-center gap-1 transition ${
              view === 'table' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500'
            }`}
          >
            <List size={13} /> Bảng
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-16 bg-white rounded-xl border border-neutral-200 flex flex-col items-center justify-center gap-3 text-neutral-400">
          <Loader2 size={22} className="animate-spin text-primary-500" />
          <span className="text-sm">Đang tải tài sản...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200">
          <EmptyState
            icon={hasFilter ? Search : Package}
            title={hasFilter ? 'Không có tài sản khớp bộ lọc' : 'Chưa có tài sản nào'}
            description={
              hasFilter
                ? 'Thử điều chỉnh từ khoá hoặc bỏ bớt filter.'
                : 'Bấm "Thêm tài sản" ở góc trên để bắt đầu quản lý inventory.'
            }
            action={hasFilter
              ? { label: 'Xoá lọc', onClick: clearFilters }
              : { label: 'Thêm tài sản đầu tiên', onClick: openCreate }
            }
          />
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map((a) => (
            <AssetCard key={a.id} asset={a} onClick={() => setActiveAsset(a)} onAssign={() => openAssign(a)} />
          ))}
        </div>
      ) : (
        <AssetTable items={items} onRowClick={setActiveAsset} />
      )}

        </>
      )}

      {/* Modals & Drawer */}
      <AssetFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} />
      <AssetAssignModal open={!!assignAsset} asset={assignAsset} onClose={() => setAssignAsset(null)} />
      {displayActive && (
        <AssetDetailDrawer
          asset={displayActive}
          onClose={() => setActiveAsset(null)}
          onEdit={() => { setEditing(displayActive); setFormOpen(true) }}
          onAssign={() => openAssign(displayActive)}
        />
      )}
    </div>
  )
}

// ============================================================
// KpiCard
// ============================================================

interface KpiProps { icon: LucideIcon; label: string; value: string; tone: 'neutral' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' }
function KpiCard({ icon: Icon, label, value, tone }: KpiProps) {
  const tones = {
    neutral: 'bg-white border-neutral-200 [&_.ico]:bg-neutral-100 [&_.ico]:text-neutral-600',
    blue: 'bg-blue-50/60 border-blue-200 [&_.ico]:bg-blue-100 [&_.ico]:text-blue-600',
    emerald: 'bg-emerald-50/60 border-emerald-200 [&_.ico]:bg-emerald-100 [&_.ico]:text-emerald-600',
    amber: 'bg-amber-50/60 border-amber-200 [&_.ico]:bg-amber-100 [&_.ico]:text-amber-600',
    rose: 'bg-rose-50/60 border-rose-200 [&_.ico]:bg-rose-100 [&_.ico]:text-rose-600',
    violet: 'bg-violet-50/60 border-violet-200 [&_.ico]:bg-violet-100 [&_.ico]:text-violet-600',
  }[tone]
  return (
    <div className={`p-3 rounded-xl border flex items-center gap-3 ${tones}`}>
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

// ============================================================
// Card view
// ============================================================

function AssetCard({ asset, onClick, onAssign }: { asset: AssetItem; onClick: () => void; onAssign: () => void }) {
  const Icon = getCategoryIcon(asset.categoryCode)
  const st = STATUS_META[asset.status] || STATUS_META.AVAILABLE
  const warrantyDays = daysUntil(asset.warrantyEndDate)
  const warrantyExpiring = warrantyDays !== null && warrantyDays >= 0 && warrantyDays <= 30

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:shadow-md transition cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Header — status badge */}
      <div className="p-3 border-b border-neutral-100 flex items-center justify-between">
        <div className="text-[10px] font-mono text-neutral-500 tracking-tight">{asset.code}</div>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${st.tone}`}>
          <span className={`w-1 h-1 rounded-full ${st.dot}`} />
          {st.short}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex-1">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition">
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-neutral-900 truncate group-hover:text-primary-700 transition">
              {asset.name}
            </div>
            {asset.brand && (
              <div className="text-xs text-neutral-500 truncate mt-0.5">
                {asset.brand}{asset.model ? ` · ${asset.model}` : ''}
              </div>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="mt-3 space-y-1 text-xs">
          {asset.assignedPersonName && (
            <div className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">
              <UserCheck size={11} />
              <span className="truncate max-w-[180px]">{asset.assignedPersonName}</span>
            </div>
          )}
          {asset.location && (
            <div className="text-neutral-500 truncate inline-flex items-center gap-1">
              <MapPin size={11} /> {asset.location}
            </div>
          )}
          {warrantyExpiring && (
            <div className="text-amber-700 inline-flex items-center gap-1 font-medium">
              <Shield size={11} /> BH còn {warrantyDays} ngày
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-neutral-100 bg-neutral-50/40 flex items-center justify-between">
        <span className="text-xs font-mono text-neutral-600 tabular-nums">
          {fmtMoney(asset.currentValue ?? asset.purchasePrice)}
        </span>
        {asset.status === 'AVAILABLE' ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAssign() }}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:text-primary-800"
          >
            Cấp phát <ArrowRight size={11} />
          </button>
        ) : (
          <span className="text-[11px] text-neutral-400">{fmtDate(asset.purchaseDate)}</span>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Table view
// ============================================================

function AssetTable({ items, onRowClick }: { items: AssetItem[]; onRowClick: (a: AssetItem) => void }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50/70 border-b border-neutral-200">
            <tr className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
              <th className="text-left px-4 py-3">Mã</th>
              <th className="text-left px-4 py-3">Tên</th>
              <th className="text-left px-4 py-3">Loại</th>
              <th className="text-left px-4 py-3">Đang giữ</th>
              <th className="text-left px-4 py-3">Vị trí</th>
              <th className="text-right px-4 py-3">Giá trị</th>
              <th className="text-right px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((a) => {
              const Icon = getCategoryIcon(a.categoryCode)
              const st = STATUS_META[a.status] || STATUS_META.AVAILABLE
              return (
                <tr
                  key={a.id}
                  onClick={() => onRowClick(a)}
                  className="cursor-pointer hover:bg-neutral-50/60 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600">{a.code}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-neutral-900 truncate max-w-[220px]">{a.name}</div>
                        {a.brand && (
                          <div className="text-[11px] text-neutral-500 truncate max-w-[220px]">{a.brand} · {a.model}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">{a.categoryName || '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {a.assignedPersonName ? (
                      <span className="text-blue-700 font-medium">{a.assignedPersonName}</span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600 truncate max-w-[180px]">{a.location || '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono text-xs text-neutral-800">
                    {fmtMoney(a.currentValue ?? a.purchasePrice)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${st.tone}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.short}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// FilterChip
// ============================================================

// ============================================================
// TabButton — chuyển giữa tab "Tài sản" và "Yêu cầu cấp phát"
// ============================================================

function TabButton({
  active, onClick, icon: Icon, label, badge,
}: { active: boolean; onClick: () => void; icon: LucideIcon; label: string; badge?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-10 px-4 inline-flex items-center gap-2 text-sm font-semibold transition border-b-2 -mb-px ${
        active
          ? 'text-primary-700 border-primary-500'
          : 'text-neutral-500 hover:text-neutral-800 border-transparent hover:border-neutral-200'
      }`}
    >
      <Icon size={14} />
      {label}
      {badge != null && badge > 0 && (
        <span className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-bold rounded-full ${
          active ? 'bg-primary-600 text-white' : 'bg-amber-100 text-amber-700'
        }`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}

function FilterChip({
  active, onClick, label, tone,
}: { active: boolean; onClick: () => void; label: string; tone?: 'emerald' | 'blue' | 'amber' | 'neutral' }) {
  const activeCls = {
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  }[tone || 'blue']
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-7 px-2.5 rounded-md text-xs font-medium transition border ${
        active
          ? tone ? activeCls : 'bg-primary-50 text-primary-700 border-primary-200'
          : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 border-transparent'
      }`}
    >
      {label}
    </button>
  )
}
