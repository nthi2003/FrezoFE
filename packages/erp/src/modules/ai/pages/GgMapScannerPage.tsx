import { useMemo, useState } from 'react'
import {
  useGgMapScan, useGgMapResults, useImportGgMapResult, useImportAllGgMapResults,
} from '../hooks/useAI'
import { Button, Input, PageHeader, EmptyState, ErrorState, Label, Select, RowActions } from '@frezo/ui'
import {
  Search, Loader2, MapPin, Star, Phone, Download, CheckCircle, HelpCircle,
} from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn, BulkAction } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { toast } from 'sonner'

export function GgMapScannerPage() {
  const [keyword, setKeyword] = useState('')
  const [maxResults, setMaxResults] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'imported' | 'pending'>('ALL')

  const scanReq = useGgMapScan()
  const { data, isLoading, isError, isFetching, refetch } = useGgMapResults()
  const importReq = useImportGgMapResult()
  const importAllReq = useImportAllGgMapResults()

  const results = useMemo(() => {
    const raw = data?.results || data || []
    return Array.isArray(raw) ? raw : []
  }, [data])

  const filtered = useMemo(() => {
    let rows = results
    if (statusFilter === 'imported') rows = rows.filter((r: any) => r.status === 'imported')
    if (statusFilter === 'pending') rows = rows.filter((r: any) => r.status !== 'imported')
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter((r: any) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.address || '').toLowerCase().includes(q) ||
        (r.phone || '').toLowerCase().includes(q),
      )
    }
    return rows
  }, [results, search, statusFilter])

  const hasFilter = !!search.trim() || statusFilter !== 'ALL'
  const isFullyEmpty = !isLoading && !isError && results.length === 0
  const isFilteredEmpty = !isLoading && !isError && results.length > 0 && filtered.length === 0

  const handleScan = () => {
    if (!keyword.trim()) return
    scanReq.mutate({ keyword: keyword.trim(), maxResults })
  }

  const bulkActions: BulkAction<any>[] = [
    {
      key: 'import',
      label: 'Import đã chọn',
      icon: Download,
      onClick: async (rows) => {
        const ids = rows.filter((r) => r.status !== 'imported').map((r) => r.id)
        if (ids.length === 0) {
          toast.warning('Không có kết quả nào có thể import')
          return
        }
        await importAllReq.mutateAsync(ids)
      },
    },
  ]

  const columns: AppTableColumn<any>[] = [
    {
      key: 'name',
      title: 'Tên quán',
      render: (_, r) => (
        <div>
          <p className="font-medium text-neutral-900">{r.name}</p>
          {r.website && (
            <a
              href={r.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:underline"
              title={r.website}
            >
              {r.website}
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'address',
      title: 'Địa chỉ',
      render: (_, r) => (
        <span className="text-sm text-neutral-500 max-w-[220px] truncate block" title={r.address}>
          {r.address || '—'}
        </span>
      ),
    },
    {
      key: 'phone',
      title: 'SĐT',
      align: 'center',
      render: (_, r) =>
        r.phone ? (
          <span className="inline-flex items-center gap-1 text-sm">
            <Phone className="w-3 h-3 text-neutral-400" />
            {r.phone}
          </span>
        ) : (
          <span className="text-neutral-300">—</span>
        ),
    },
    {
      key: 'rating',
      title: 'Đánh giá',
      align: 'center',
      render: (_, r) =>
        r.rating ? (
          <span className="inline-flex items-center gap-1 text-sm font-medium">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            {r.rating}
          </span>
        ) : (
          <span className="text-neutral-300">—</span>
        ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      render: (_, r) =>
        r.status === 'imported' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3" />
            Đã import
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            Tiềm năng
          </span>
        ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: 120,
      render: (_, r) =>
        r.status !== 'imported' ? (
          <RowActions
            align="end"
            actions={[
              {
                key: 'import',
                icon: Download,
                tooltip: 'Import vào khách hàng tiềm năng',
                tone: 'primary',
                disabled: importReq.isPending,
                onClick: () => importReq.mutate(r.id),
              },
            ]}
          />
        ) : (
          <span className="text-xs text-emerald-600">Đã import</span>
        ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <MapPin className="w-6 h-6 text-red-500" />
            Quét Google Maps
          </span>
        }
        description="Tìm quán ăn, nhà hàng, cửa hàng trên Google Maps và import vào danh sách khách hàng tiềm năng."
        actions={
          results.length > 0 ? (
            <Button
              onClick={() => {
                const ids = results.map((r: any) => r.id)
                if (ids.length > 0) importAllReq.mutate(ids)
              }}
              disabled={importAllReq.isPending}
              variant="outline"
              className="border-primary-300 text-primary-700 hover:bg-primary-50 gap-1.5"
            >
              {importAllReq.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />}
              Import tất cả
            </Button>
          ) : undefined
        }
      />

      <div className="p-4 bg-white rounded-xl border border-neutral-200">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <Label className="mb-1 inline-flex items-center gap-1">
              Từ khoá
              <span title="VD: Quán ăn Đà Nẵng, Nhà hàng Hà Nội">
                <HelpCircle size={12} className="text-neutral-400" />
              </span>
            </Label>
            <Input
              placeholder="Nhập từ khoá…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            />
          </div>
          <div>
            <Label className="mb-1">Số kết quả</Label>
            <Select
              options={[
                { value: '10', label: '10 kết quả' },
                { value: '20', label: '20 kết quả' },
                { value: '50', label: '50 kết quả' },
              ]}
              value={String(maxResults)}
              onChange={(v) => setMaxResults(Number(v))}
              placeholder="Số kết quả"
              aria-label="Số kết quả"
              showSearch={false}
              className="w-36"
            />
          </div>
          <Button
            onClick={handleScan}
            disabled={scanReq.isPending || !keyword.trim()}
            className="bg-primary-600 hover:bg-primary-700 text-white whitespace-nowrap"
          >
            {scanReq.isPending
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Search className="w-4 h-4 mr-2" />}
            {scanReq.isPending ? 'Đang quét…' : 'Quét Maps'}
          </Button>
        </div>
      </div>

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => { setSearch(''); setStatusFilter('ALL') }}
        countLabel={`${filtered.length} kết quả${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="min-w-[150px]">
          <Select
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'pending', label: 'Tiềm năng' },
              { value: 'imported', label: 'Đã import' },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
            placeholder="Trạng thái"
            aria-label="Lọc trạng thái"
            showSearch={false}
          />
        </div>
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm tên, địa chỉ, SĐT…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm kết quả Maps"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được kết quả Maps"
            message="Kiểm tra kết nối AI service rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={MapPin}
            title={
              isFilteredEmpty
                ? 'Không có kết quả khớp bộ lọc'
                : scanReq.isPending
                  ? 'Đang quét Google Maps…'
                  : 'Chưa có dữ liệu'
            }
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi trạng thái.'
                : 'Nhập từ khoá và bấm Quét Maps để bắt đầu.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: () => { setSearch(''); setStatusFilter('ALL') } }
                : undefined
            }
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={() => void refetch()}
          selectable
          getRowId={(r) => String(r.id)}
          bulkActions={bulkActions}
        />
      )}
    </div>
  )
}
