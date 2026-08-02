import { useState, useMemo } from 'react'
import {
  Plus, Building2, Sprout, Weight, Award, Search, LayoutGrid, List,
  AlertTriangle, type LucideIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  Button, PageHeader, PageGuideButton, Select, ConfirmDialog, Skeleton, EmptyState,
} from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { categoryApi } from '@/modules/qtht/services/categoryApi'
import {
  useNccList, useCreateNcc, useUpdateNcc, useDeleteNcc,
} from '../hooks/useNcc'
import { NCC_GUIDE, NCC_CLASSIFICATION_TYPE } from '../constants/ncc.guide'
import { NccCard } from '../components/NccCard'
import { NccFormModal } from '../components/NccFormModal'
import { NccDetailDrawer } from '../components/NccDetailDrawer'

export function NccPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [searchText, setSearchText] = useState('')
  const [classFilter, setClassFilter] = useState<string>('')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingNcc, setEditingNcc] = useState<any | null>(null)
  const [detailNcc, setDetailNcc] = useState<any | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)

  const { data, isLoading } = useNccList()
  const createReq = useCreateNcc()
  const updateReq = useUpdateNcc()
  const deleteReq = useDeleteNcc()

  const { data: classificationsData } = useQuery({
    queryKey: ['categories', NCC_CLASSIFICATION_TYPE],
    queryFn: () => categoryApi.getAll({ type: NCC_CLASSIFICATION_TYPE }),
    select: (res: any) => res?.data?.items ?? [],
  })
  const classifications = Array.isArray(classificationsData) ? classificationsData : []
  const classOptions = [
    { value: '', label: 'Tất cả phân loại' },
    ...classifications.map((c: any) => ({ value: c.code || c.value, label: c.name || c.label })),
  ]

  // rawData is a Map with items+total → unwrapList tries to normalise. Fallback for object shape.
  const nccList: any[] = useMemo(() => {
    if (Array.isArray(data)) return data
    if ((data as any)?.items) return (data as any).items
    return []
  }, [data])

  // Client filter
  const filteredList = useMemo(() => {
    let list = nccList
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim()
      list = list.filter(
        (n) =>
          (n.name || '').toLowerCase().includes(q) ||
          (n.code || '').toLowerCase().includes(q) ||
          (n.representative || '').toLowerCase().includes(q) ||
          (n.phone || '').includes(q),
      )
    }
    if (classFilter) {
      list = list.filter((n) => n.classificationCode === classFilter)
    }
    return list
  }, [nccList, searchText, classFilter])

  // Stats
  const stats = useMemo(() => {
    const total = nccList.length
    const totalArea = nccList.reduce((s, n) => s + (Number(n.growingArea) || 0), 0)
    const totalCapacity = nccList.reduce((s, n) => s + (Number(n.maxCapacity) || 0), 0)
    const totalCerts = nccList.reduce((s, n) => s + (n.certificates?.length || 0), 0)
    const expiringSoon = nccList.reduce((s, n) => {
      const cnt = (n.certificates || []).filter((c: any) => {
        if (!c.expiryDate) return false
        const days = Math.floor((new Date(c.expiryDate).getTime() - Date.now()) / 86400000)
        return days >= 0 && days < 30
      }).length
      return s + cnt
    }, 0)
    return { total, totalArea, totalCapacity, totalCerts, expiringSoon }
  }, [nccList])

  const handleOpenCreate = () => {
    setEditingNcc(null)
    setFormModalOpen(true)
  }
  const handleOpenEdit = (ncc: any) => {
    setDetailNcc(null)
    setEditingNcc(ncc)
    setFormModalOpen(true)
  }
  const handleSubmit = (values: any) => {
    if (editingNcc?.id) {
      updateReq.mutate(
        { id: editingNcc.id, data: values },
        { onSuccess: () => setFormModalOpen(false) },
      )
    } else {
      createReq.mutate(values, { onSuccess: () => setFormModalOpen(false) })
    }
  }
  const handleDelete = () => {
    if (confirmDelete?.id) {
      deleteReq.mutate(confirmDelete.id, {
        onSuccess: () => setConfirmDelete(null),
      })
    }
  }

  const isSubmitting = createReq.isPending || updateReq.isPending
  const hasActiveFilters = Boolean(searchText.trim()) || !!classFilter

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <PageHeader
        title="Nhà cung cấp (NCC)"
        description="Danh bạ nhà cung cấp nông sản — năng lực, chứng chỉ và điểm mạnh"
        actions={
          <>
            <PageGuideButton guide={NCC_GUIDE} />
            <Button
              onClick={handleOpenCreate}
              className="gap-2 bg-primary-700 hover:bg-primary-800 text-white shadow-sm"
            >
              <Plus size={16} /> Thêm NCC
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard
          icon={Building2}
          label="Tổng NCC"
          value={String(stats.total)}
          tone="neutral"
        />
        <KpiCard
          icon={Sprout}
          label="Tổng diện tích"
          value={`${stats.totalArea.toFixed(1)} ha`}
          tone="green"
        />
        <KpiCard
          icon={Weight}
          label="Sản lượng tối đa"
          value={`${(stats.totalCapacity / 1000).toFixed(1)}T`}
          hint="tấn / tháng"
          tone="blue"
        />
        <KpiCard
          icon={Award}
          label="Chứng chỉ"
          value={String(stats.totalCerts)}
          tone="violet"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Sắp hết hạn"
          value={String(stats.expiringSoon)}
          hint="< 30 ngày"
          tone={stats.expiringSoon > 0 ? 'orange' : 'neutral'}
        />
      </div>

      <FilterBar
        hasActiveFilters={hasActiveFilters}
        onClear={() => {
          setSearchText('')
          setClassFilter('')
        }}
        countLabel={`${filteredList.length} NCC${hasActiveFilters ? ' (đã lọc)' : ''}`}
      >
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm tên, mã, đại diện, SĐT…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-9 w-full pl-9 pr-3 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
            aria-label="Tìm NCC"
          />
        </div>
        <div className="w-56">
          <Select
            options={classOptions}
            value={classFilter}
            onChange={(v) => setClassFilter(v || '')}
            placeholder="Tất cả phân loại"
          />
        </div>
        <div className="inline-flex items-center rounded-md border border-neutral-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setView('grid')}
            className={`px-2.5 h-8 rounded text-xs font-semibold inline-flex items-center gap-1 transition ${
              view === 'grid' ? 'bg-primary-50 text-primary-700' : 'text-neutral-500'
            }`}
            aria-label="Chế độ lưới"
          >
            <LayoutGrid size={13} /> Lưới
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-2.5 h-8 rounded text-xs font-semibold inline-flex items-center gap-1 transition ${
              view === 'list' ? 'bg-primary-50 text-primary-700' : 'text-neutral-500'
            }`}
            aria-label="Chế độ bảng"
          >
            <List size={13} /> Bảng
          </button>
        </div>
      </FilterBar>

      {/* Content */}
      {isLoading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[280px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="p-6"><Skeleton className="h-[400px] rounded-xl" /></div>
        )
      ) : filteredList.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Building2}
            title={nccList.length === 0 ? 'Chưa có NCC nào' : 'Không tìm thấy kết quả'}
            description={
              nccList.length === 0
                ? 'Thêm NCC đầu tiên để bắt đầu quản lý danh bạ nhà cung cấp nông sản.'
                : 'Thử điều chỉnh bộ lọc hoặc từ khoá tìm kiếm.'
            }
            action={
              nccList.length === 0
                ? { label: 'Thêm NCC đầu tiên', onClick: handleOpenCreate }
                : { label: 'Xoá lọc', onClick: () => { setSearchText(''); setClassFilter('') } }
            }
          />
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredList.map((n) => (
            <NccCard
              key={n.id}
              ncc={n}
              onView={setDetailNcc}
              onEdit={handleOpenEdit}
              onDelete={setConfirmDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <AppTable
            data={filteredList}
            isLoading={false}
            showSearch={false}
            density="compact"
            pageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
            columns={[
              {
                title: 'NCC',
                dataIndex: 'name',
                render: (_: any, row: any) => (
                  <button
                    onClick={() => setDetailNcc(row)}
                    className="text-left group"
                  >
                    <div className="font-semibold text-neutral-800 group-hover:text-primary-700 transition-colors">
                      {row.name || '—'}
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono">{row.code}</div>
                  </button>
                ),
              },
              {
                title: 'Phân loại',
                dataIndex: 'classificationName',
                render: (v: string) =>
                  v ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200 rounded">
                      {v}
                    </span>
                  ) : (
                    <span className="text-neutral-300">—</span>
                  ),
              },
              { title: 'Đại diện', dataIndex: 'representative', render: (v: string) => v || '—' },
              {
                title: 'SĐT',
                dataIndex: 'phone',
                render: (v: string) => (v ? <span className="font-mono">{v}</span> : '—'),
              },
              {
                title: 'Diện tích',
                dataIndex: 'growingArea',
                render: (v: any) => (v != null ? <span className="tabular-nums text-emerald-600 font-medium">{v} ha</span> : '—'),
              },
              {
                title: 'SL max/tháng',
                dataIndex: 'maxCapacity',
                render: (v: any) =>
                  v != null ? (
                    <span className="tabular-nums text-blue-600 font-medium">
                      {Number(v).toLocaleString('vi-VN')} kg
                    </span>
                  ) : (
                    '—'
                  ),
              },
              {
                title: 'CC',
                dataIndex: 'certificates',
                render: (v: any[]) => (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600">
                    <Award size={11} /> {v?.length || 0}
                  </span>
                ),
              },
              {
                title: 'Thao tác',
                dataIndex: 'id',
                width: 140,
                render: (_: any, row: any) => (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailNcc(row)}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50"
                    >
                      Xem
                    </button>
                    <button
                      onClick={() => handleOpenEdit(row)}
                      className="text-xs font-medium text-neutral-600 hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => setConfirmDelete(row)}
                      className="text-xs font-medium text-rose-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50"
                    >
                      Xoá
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* Modals */}
      <NccFormModal
        isOpen={formModalOpen}
        ncc={editingNcc}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <NccDetailDrawer
        isOpen={!!detailNcc}
        nccId={detailNcc?.id || null}
        fallback={detailNcc}
        onClose={() => setDetailNcc(null)}
        onEdit={handleOpenEdit}
      />

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Xoá nhà cung cấp"
        message={
          confirmDelete
            ? `Xoá NCC "${confirmDelete.name}"? Toàn bộ chứng chỉ đính kèm sẽ bị xoá luôn. Hành động không thể hoàn tác.`
            : ''
        }
        variant="danger"
        confirmText="Xoá NCC"
        cancelText="Huỷ"
      />
    </div>
  )
}

// ============================================================
// KPI Card
// ============================================================

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  tone: 'neutral' | 'green' | 'blue' | 'violet' | 'orange'
}

function KpiCard({ icon: Icon, label, value, hint, tone }: KpiCardProps) {
  const toneMap = {
    neutral: 'bg-white border-neutral-200 [&_.ico]:bg-neutral-100 [&_.ico]:text-neutral-600',
    green: 'bg-emerald-50/60 border-emerald-200 [&_.ico]:bg-emerald-100 [&_.ico]:text-emerald-600',
    blue: 'bg-blue-50/60 border-blue-200 [&_.ico]:bg-blue-100 [&_.ico]:text-blue-600',
    violet: 'bg-violet-50/60 border-violet-200 [&_.ico]:bg-violet-100 [&_.ico]:text-violet-600',
    orange: 'bg-orange-50/60 border-orange-200 [&_.ico]:bg-orange-100 [&_.ico]:text-orange-600',
  }[tone]
  return (
    <div className={`p-3 rounded-xl border flex items-center gap-3 ${toneMap}`}>
      <div className="ico w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 truncate">
          {label}
        </div>
        <div className="text-lg font-bold text-neutral-900 tabular-nums leading-none mt-0.5">
          {value}
        </div>
        {hint && <div className="text-[10px] text-neutral-400 mt-0.5">{hint}</div>}
      </div>
    </div>
  )
}
