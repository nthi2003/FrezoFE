// ============================================================
// PurchaseRequestsPage — danh sách yêu cầu mua
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Send, Eye } from 'lucide-react'
import { Button, ConfirmDialog } from '@frezo/ui'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { PURCHASE_REQUESTS_GUIDE } from '../constants/purchase.guide'
import { PR_STATUS_FILTER_OPTIONS } from '../constants/warehouseStatus'
import {
  usePurchaseRequests,
  useSubmitPurchaseRequest,
} from '../hooks/usePurchaseRequest'
import {
  applyWarehouseListFilters,
  useWarehouseFilters,
} from '../hooks/useWarehouseFilters'
import type { PurchaseRequestDto } from '../services/purchaseRequestApi'
import { formatSupplierLabel, formatWarehouseLabel } from '../utils/displayUtils'
import { WarehouseListShell } from '../components/WarehouseListShell'
import { WarehouseFilterBar } from '../components/WarehouseFilterBar'
import { WarehouseStatusBadge } from '../components/WarehouseStatusBadge'

export function PurchaseRequestsPage() {
  const nav = useNavigate()
  const filters = useWarehouseFilters({ statusOptions: PR_STATUS_FILTER_OPTIONS })
  const { data: list = [], isLoading, isError, isFetching, refetch } = usePurchaseRequests()
  const submit = useSubmitPurchaseRequest()
  const [submitTarget, setSubmitTarget] = useState<PurchaseRequestDto | null>(null)

  const filteredList = useMemo(() => {
    let result = applyWarehouseListFilters(list, filters.warehouseId, '')
    if (filters.status) {
      const s = filters.status.toUpperCase()
      if (s === 'PENDING') {
        result = result.filter((pr) =>
          ['PENDING', 'SUBMITTED', 'IN_APPROVAL', 'WAITING_APPROVAL'].includes(
            (pr.status || '').toUpperCase(),
          ),
        )
      } else {
        result = result.filter((pr) => (pr.status || '').toUpperCase() === s)
      }
    }
    return result
  }, [list, filters.warehouseId, filters.status])

  const columns: AppTableColumn<PurchaseRequestDto>[] = [
    {
      key: 'code',
      title: 'Mã yêu cầu',
      render: (_, row) => (
        <button
          type="button"
          className="font-mono text-xs text-primary-700 hover:underline text-left"
          onClick={() => nav(`/warehouse/purchase-requests/${row.id}`)}
        >
          {row.code || row.id}
        </button>
      ),
    },
    {
      key: 'warehouse',
      title: 'Kho',
      render: (_, row) => formatWarehouseLabel(row),
    },
    {
      key: 'supplier',
      title: 'NCC',
      render: (_, row) => formatSupplierLabel(row),
    },
    {
      key: 'lines',
      title: 'Dòng',
      align: 'right',
      render: (_, row) => (
        <span className="tabular-nums">{row.lines?.length || 0}</span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (_, row) => <WarehouseStatusBadge status={row.status} kind="pr" />,
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 180,
      render: (_, pr) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => nav(`/warehouse/purchase-requests/${pr.id}`)}
          >
            <Eye size={12} /> Chi tiết
          </Button>
          {(pr.status || '').toUpperCase() === 'DRAFT' && (
            <Button
              size="sm"
              className="gap-1"
              disabled={submit.isPending}
              onClick={() => setSubmitTarget(pr)}
            >
              <Send size={12} /> Gửi duyệt
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <WarehouseListShell
      title="Yêu cầu mua hàng (PR)"
      description="Tạo từ cảnh báo tồn — gửi duyệt trước khi đặt mua với NCC."
      guide={PURCHASE_REQUESTS_GUIDE}
      headerActions={
        <Button variant="outline" onClick={() => nav('/warehouse/stock-alerts')}>
          Từ cảnh báo tồn
        </Button>
      }
      filterBar={
        <WarehouseFilterBar
          selects={[
            {
              id: 'warehouse',
              label: 'Lọc theo kho',
              value: filters.warehouseId,
              onChange: filters.setWarehouseId,
              options: [
                { value: '', label: 'Tất cả kho' },
                ...filters.warehouses.map((w) => ({
                  value: w.id,
                  label: w.name || w.id,
                })),
              ],
            },
            {
              id: 'status',
              label: 'Lọc theo trạng thái',
              value: filters.status,
              onChange: filters.setStatus,
              options: PR_STATUS_FILTER_OPTIONS,
            },
          ]}
          hasActiveFilters={filters.hasActiveFilters}
          onClear={filters.clearFilters}
          countLabel={`${filteredList.length} yêu cầu${filters.hasActiveFilters ? ' (đã lọc)' : ''}`}
        />
      }
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      onRetry={refetch}
      errorTitle="Không tải được yêu cầu mua hàng"
      totalCount={list.length}
      filteredCount={filteredList.length}
      emptyIcon={FileText}
      emptyTitle="Chưa có yêu cầu mua hàng"
      emptyDescription="Chọn cảnh báo tồn cùng NCC trên trang Cảnh báo tồn rồi Tạo yêu cầu mua."
      emptyAction={{
        label: 'Mở cảnh báo tồn',
        onClick: () => nav('/warehouse/stock-alerts'),
      }}
      columns={columns}
      data={filteredList}
      onRefresh={refetch}
    >
      <ConfirmDialog
        isOpen={!!submitTarget}
        onClose={() => setSubmitTarget(null)}
        onConfirm={() => {
          if (!submitTarget) return
          submit.mutate(submitTarget.id, {
            onSuccess: () => setSubmitTarget(null),
          })
        }}
        title={`Gửi duyệt ${submitTarget?.code || submitTarget?.id || ''}?`}
        message="Yêu cầu mua sẽ chuyển sang Hộp thư duyệt — chờ quản lý phê duyệt."
        confirmText="Gửi duyệt"
        cancelText="Huỷ"
        variant="default"
        isLoading={submit.isPending}
      />
    </WarehouseListShell>
  )
}
