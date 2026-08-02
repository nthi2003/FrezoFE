// ============================================================
// AssetsPage — Quản lý tài sản (QLTS)
// Layout: PageHeader + KPI (StatCard) + sticky FilterBar + AppTable/Grid
// ============================================================

import { useMemo, useState } from 'react'
import {
  Plus,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  Package,
  CheckCircle2,
  Wrench,
  DollarSign,
  Shield,
  Loader2,
  MapPin,
  UserCheck,
  ArrowRight,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react'
import {
  Button,
  PageHeader,
  EmptyState,
  ErrorState,
  PageGuideButton,
  StatCard,
  StatusBadge,
} from '@frezo/ui'
import type { StatusColor } from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
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

const STATUS_BADGE: Record<AssetStatus, { label: string; color: StatusColor }> = {
  AVAILABLE: { label: 'Sẵn sàng', color: 'success' },
  IN_USE: { label: 'Đang dùng', color: 'info' },
  MAINTENANCE: { label: 'Bảo trì', color: 'warning' },
  BROKEN: { label: 'Hỏng', color: 'danger' },
  DISPOSED: { label: 'Thanh lý', color: 'neutral' },
  LOST: { label: 'Mất', color: 'danger' },
}

export function AssetsPage() {
  const [tab, setTab] = useState<TabKey>('assets')
  const [view, setView] = useState<ViewMode>('table')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AssetStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AssetItem | null>(null)
  const [activeAsset, setActiveAsset] = useState<AssetItem | null>(null)
  const [assignAsset, setAssignAsset] = useState<AssetItem | null>(null)

  const { data: pendingRequests } = useTransferRequests({ status: 'PENDING', size: 1 })
  const pendingCount = pendingRequests?.total || 0

  const {
    data: assetsRes,
    isLoading,
    isError,
    isFetching,
    error,
    refetch,
  } = useAssets({
    keyword: search.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    categoryCode: categoryFilter !== 'all' ? categoryFilter : undefined,
    page: 1,
    size: 200,
  })
  const items = assetsRes?.items || []
  const total = assetsRes?.total ?? items.length
  const { data: stats } = useAssetStats()
  const { data: categoriesRaw } = useCategories('LoaiTaiSan')
  const categories = (Array.isArray(categoriesRaw) ? categoriesRaw : []) as any[]

  const hasFilter = !!(search || statusFilter !== 'all' || categoryFilter !== 'all')
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCategoryFilter('all')
  }

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

  const goCreateAssignRequest = () => {
    setTab('assets')
    setStatusFilter('AVAILABLE')
    setSearch('')
  }

  const columns: AppTableColumn<AssetItem>[] = [
    {
      key: 'code',
      title: 'Mã',
      width: 110,
      render: (_, row) => (
        <button
          type="button"
          className="font-mono text-xs text-primary-700 hover:underline"
          onClick={() => setActiveAsset(row)}
        >
          {row.code || '—'}
        </button>
      ),
    },
    {
      key: 'name',
      title: 'Tên tài sản',
      render: (_, row) => {
        const Icon = getCategoryIcon(row.categoryCode)
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <Icon size={14} />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm text-neutral-900 truncate" title={row.name}>
                {row.name || '—'}
              </div>
              {(row.brand || row.model) && (
                <div className="text-[11px] text-neutral-500 truncate">
                  {[row.brand, row.model].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'category',
      title: 'Loại',
      width: 120,
      render: (_, row) => (
        <span className="text-sm text-neutral-700">{row.categoryName || '—'}</span>
      ),
    },
    {
      key: 'assigned',
      title: 'Đang giữ',
      render: (_, row) =>
        row.assignedPersonName ? (
          <span className="text-sm text-neutral-800">{row.assignedPersonName}</span>
        ) : (
          <span className="text-sm text-neutral-400">—</span>
        ),
    },
    {
      key: 'location',
      title: 'Vị trí',
      render: (_, row) => (
        <span className="text-sm text-neutral-700 truncate max-w-[160px] inline-block" title={row.location || ''}>
          {row.location || '—'}
        </span>
      ),
    },
    {
      key: 'value',
      title: 'Giá trị',
      align: 'right',
      width: 110,
      render: (_, row) => (
        <span className="tabular-nums text-sm text-neutral-900">
          {fmtMoney(row.currentValue ?? row.purchasePrice)}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: 120,
      render: (_, row) => {
        const b = STATUS_BADGE[row.status] || {
          label: STATUS_META[row.status]?.short || row.status,
          color: 'neutral' as StatusColor,
        }
        return <StatusBadge label={b.label} color={b.color} />
      },
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 110,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status === 'AVAILABLE' && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={(e) => {
                e.stopPropagation()
                openAssign(row)
              }}
            >
              Cấp phát
            </Button>
          )}
        </div>
      ),
    },
  ]

  const showKpi = !isLoading && !isError && !!stats && (total > 0 || (stats.total ?? 0) > 0)

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Quản lý tài sản"
        description="Kiểm kê, cấp phát, bảo trì và thanh lý tài sản doanh nghiệp."
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <PageGuideButton guide={tab === 'requests' ? ASSETS_ASSIGN_GUIDE : ASSETS_GUIDE} />
            {tab === 'assets' && (
              <Button
                variant="outline"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="gap-1.5"
              >
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
          </div>
        }
      />

      <div className="flex items-center gap-1 border-b border-neutral-200">
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
                Chọn tài sản <strong>Sẵn sàng</strong> → bấm <strong>Cấp phát</strong> trên bảng/thẻ
                (hoặc mở chi tiết) → chọn nhân viên nhận và gửi.
              </p>
            </div>
          )}

          {showKpi && stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Tổng" value={stats.total} icon={Package} className="!p-4" />
              <StatCard label="Đang dùng" value={stats.inUse} icon={UserCheck} className="!p-4" />
              <StatCard label="Sẵn sàng" value={stats.available} icon={CheckCircle2} className="!p-4" />
              <StatCard label="Đang bảo trì" value={stats.maintenance} icon={Wrench} className="!p-4" />
              <StatCard
                label="Sắp hết BH"
                value={stats.warrantyExpiringSoon}
                icon={Shield}
                hint={stats.warrantyExpiringSoon > 0 ? 'Cần theo dõi' : undefined}
                className="!p-4"
              />
              <StatCard
                label="Giá trị"
                value={fmtMoney(stats.totalValue)}
                icon={DollarSign}
                className="!p-4"
              />
            </div>
          )}

          <FilterBar
            selects={[
              {
                id: 'category',
                label: 'Loại tài sản',
                value: categoryFilter === 'all' ? '' : categoryFilter,
                onChange: (v) => setCategoryFilter(v || 'all'),
                options: [
                  { value: '', label: 'Tất cả loại' },
                  ...categories.map((c) => ({
                    value: c.code as string,
                    label: (c.name as string) || c.code,
                  })),
                ],
              },
              {
                id: 'status',
                label: 'Trạng thái',
                value: statusFilter === 'all' ? '' : statusFilter,
                onChange: (v) => setStatusFilter((v as AssetStatus) || 'all'),
                options: [
                  { value: '', label: 'Tất cả trạng thái' },
                  { value: 'AVAILABLE', label: 'Sẵn sàng' },
                  { value: 'IN_USE', label: 'Đang dùng' },
                  { value: 'MAINTENANCE', label: 'Bảo trì' },
                  { value: 'DISPOSED', label: 'Thanh lý' },
                  { value: 'BROKEN', label: 'Hỏng' },
                  { value: 'LOST', label: 'Mất' },
                ],
              },
            ]}
            hasActiveFilters={hasFilter}
            onClear={clearFilters}
            countLabel={`${items.length} tài sản${hasFilter ? ' (đã lọc)' : ''}`}
            extra={
              <>
                <input
                  type="search"
                  className="h-9 border rounded-md px-3 text-sm bg-white min-w-[200px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm mã, tên, hãng, serial…"
                  aria-label="Tìm kiếm tài sản"
                />
                <div className="inline-flex items-center rounded-md border bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setView('table')}
                    className={`h-8 px-2.5 rounded text-xs font-medium inline-flex items-center gap-1 ${
                      view === 'table'
                        ? 'bg-neutral-100 text-primary-700'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                    aria-label="Xem bảng"
                  >
                    <List size={13} /> Bảng
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('grid')}
                    className={`h-8 px-2.5 rounded text-xs font-medium inline-flex items-center gap-1 ${
                      view === 'grid'
                        ? 'bg-neutral-100 text-primary-700'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                    aria-label="Xem lưới"
                  >
                    <LayoutGrid size={13} /> Lưới
                  </button>
                </div>
              </>
            }
          />

          {isError ? (
            <div className="border rounded-xl bg-white">
              <ErrorState
                title="Không tải được danh sách tài sản"
                message={(error as Error)?.message || 'Kiểm tra kết nối hoặc thử lại.'}
                onRetry={() => void refetch()}
                isRetrying={isFetching}
              />
            </div>
          ) : !isLoading && items.length === 0 ? (
            <div className="border rounded-xl bg-white">
              <EmptyState
                icon={hasFilter ? Search : Package}
                title={hasFilter ? 'Không có tài sản khớp bộ lọc' : 'Chưa có tài sản nào'}
                description={
                  hasFilter
                    ? 'Thử đổi từ khoá, loại hoặc xoá lọc.'
                    : 'Bấm «Thêm tài sản» để bắt đầu quản lý inventory.'
                }
                action={
                  hasFilter
                    ? { label: 'Xoá lọc', onClick: clearFilters }
                    : { label: 'Thêm tài sản', onClick: openCreate }
                }
              />
            </div>
          ) : view === 'grid' ? (
            isLoading ? (
              <div className="border rounded-xl bg-white p-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
                <Loader2 size={22} className="animate-spin text-primary-500" />
                <span className="text-sm">Đang tải tài sản…</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {items.map((a) => (
                  <AssetCard
                    key={a.id}
                    asset={a}
                    onClick={() => setActiveAsset(a)}
                    onAssign={() => openAssign(a)}
                  />
                ))}
              </div>
            )
          ) : (
            <AppTable
              columns={columns}
              data={items}
              isLoading={isLoading}
              loadingRows={6}
              density="compact"
              showSearch={false}
              onRefresh={() => void refetch()}
              getRowProps={(row) => ({
                className: 'cursor-pointer',
                onClick: () => setActiveAsset(row),
              })}
            />
          )}
        </>
      )}

      <AssetFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} />
      <AssetAssignModal open={!!assignAsset} asset={assignAsset} onClose={() => setAssignAsset(null)} />
      {displayActive && (
        <AssetDetailDrawer
          asset={displayActive}
          onClose={() => setActiveAsset(null)}
          onEdit={() => {
            openEdit(displayActive)
          }}
          onAssign={() => openAssign(displayActive)}
        />
      )}
    </div>
  )
}

function AssetCard({
  asset,
  onClick,
  onAssign,
}: {
  asset: AssetItem
  onClick: () => void
  onAssign: () => void
}) {
  const Icon = getCategoryIcon(asset.categoryCode)
  const badge = STATUS_BADGE[asset.status] || {
    label: STATUS_META[asset.status]?.short || asset.status,
    color: 'neutral' as StatusColor,
  }
  const warrantyDays = daysUntil(asset.warrantyEndDate)
  const warrantyExpiring = warrantyDays !== null && warrantyDays >= 0 && warrantyDays <= 30

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border border-neutral-200 hover:border-primary-300 transition cursor-pointer overflow-hidden flex flex-col"
    >
      <div className="p-3 border-b border-neutral-100 flex items-center justify-between gap-2">
        <div className="text-[10px] font-mono text-neutral-500 tracking-tight truncate">
          {asset.code}
        </div>
        <StatusBadge label={badge.label} color={badge.color} compact />
      </div>

      <div className="p-4 flex-1">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-neutral-900 truncate group-hover:text-primary-700 transition">
              {asset.name}
            </div>
            {asset.brand && (
              <div className="text-xs text-neutral-500 truncate mt-0.5">
                {asset.brand}
                {asset.model ? ` · ${asset.model}` : ''}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-1 text-xs">
          {asset.assignedPersonName && (
            <div className="inline-flex items-center gap-1.5 text-neutral-700 bg-neutral-50 border border-neutral-200 rounded px-1.5 py-0.5">
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
            <div className="text-warning-dark inline-flex items-center gap-1 font-medium">
              <Shield size={11} /> BH còn {warrantyDays} ngày
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-2 border-t border-neutral-100 bg-neutral-50/40 flex items-center justify-between">
        <span className="text-xs tabular-nums text-neutral-700">
          {fmtMoney(asset.currentValue ?? asset.purchasePrice)}
        </span>
        {asset.status === 'AVAILABLE' ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAssign()
            }}
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

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean
  onClick: () => void
  icon: LucideIcon
  label: string
  badge?: number
}) {
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
        <span
          className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-bold rounded-full ${
            active ? 'bg-primary-600 text-white' : 'bg-warning-light text-warning-dark'
          }`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}
