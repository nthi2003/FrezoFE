// ============================================================
// PurchaseRequestsPage — danh sách yêu cầu mua hàng (WarehouseListShell)
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Send, Package, Plus } from 'lucide-react'
import { Button, ConfirmDialog, RowActions } from '@frezo/ui'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { useProducts } from '@/modules/products/hooks/useProduct'
import { useNccList } from '@/modules/suppliers/hooks/useNcc'
import { PURCHASE_REQUESTS_GUIDE } from '../constants/purchase.guide'
import {
  isPendingApprovalStatus,
  PR_STATUS_FILTER_OPTIONS,
} from '../constants/warehouseStatus'
import {
  usePurchaseRequests,
  useSubmitPurchaseRequest,
  useCreatePurchaseRequest,
} from '../hooks/usePurchaseRequest'
import { useCreatePoFromPr } from '../hooks/usePurchaseOrder'
import {
  applyWarehouseListFilters,
  useWarehouseFilters,
} from '../hooks/useWarehouseFilters'
import type { PurchaseRequestDto } from '../services/purchaseRequestApi'
import {
  formatSupplierLabel,
  formatWarehouseLabel,
  warehouseSelectLabel,
} from '../utils/displayUtils'
import { WarehouseListShell } from '../components/WarehouseListShell'
import { WarehouseFilterBar } from '../components/WarehouseFilterBar'
import { WarehouseStatusBadge } from '../components/WarehouseStatusBadge'
import { PrCreateModal } from '../components/PrCreateModal'

export function PurchaseRequestsPage() {
  const nav = useNavigate()
  const filters = useWarehouseFilters({ statusOptions: PR_STATUS_FILTER_OPTIONS })
  const { data: list = [], isLoading, isError, isFetching, refetch } = usePurchaseRequests()
  const submit = useSubmitPurchaseRequest()
  const createPr = useCreatePurchaseRequest()
  const createPo = useCreatePoFromPr()
  const { data: productsRaw, isError: productsError, isLoading: productsLoading } = useProducts()
  const { data: nccList = [] } = useNccList()

  const [openCreate, setOpenCreate] = useState(false)
  const [submitTarget, setSubmitTarget] = useState<PurchaseRequestDto | null>(null)
  const [createPoTarget, setCreatePoTarget] = useState<PurchaseRequestDto | null>(null)

  const products = useMemo(() => {
    const raw = productsRaw as
      | Array<{ id: string; code?: string; name?: string }>
      | undefined
    return Array.isArray(raw)
      ? raw.filter((p) => Boolean(p?.id)).map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
        }))
      : []
  }, [productsRaw])

  const supplierOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const ncc of nccList as Array<{ id?: string; name?: string; code?: string }>) {
      if (ncc?.id) map.set(ncc.id, ncc.name || ncc.code || ncc.id)
    }
    for (const pr of list) {
      if (pr.supplierId) {
        map.set(pr.supplierId, pr.supplierName || pr.supplierId)
      }
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }))
  }, [nccList, list])

  const filteredList = useMemo(() => {
    let result = applyWarehouseListFilters(list, filters.warehouseId, '')
    if (filters.status) {
      const s = filters.status.toUpperCase()
      if (s === 'PENDING') {
        result = result.filter((pr) => isPendingApprovalStatus(pr.status))
      } else {
        result = result.filter((pr) => (pr.status || '').toUpperCase() === s)
      }
    }
    return result
  }, [list, filters.warehouseId, filters.status])

  const stats = useMemo(() => {
    const base = filters.warehouseId
      ? list.filter((pr) => pr.warehouseId === filters.warehouseId)
      : list
    return [
      { label: 'Tổng yêu cầu', value: base.length },
      {
        label: 'Nháp',
        value: base.filter((pr) => (pr.status || '').toUpperCase() === 'DRAFT').length,
      },
      {
        label: 'Chờ duyệt',
        value: base.filter((pr) => isPendingApprovalStatus(pr.status)).length,
      },
      {
        label: 'Đã duyệt',
        value: base.filter((pr) => (pr.status || '').toUpperCase() === 'APPROVED').length,
      },
      {
        label: 'Từ chối / Huỷ',
        value: base.filter((pr) =>
          ['REJECTED', 'CANCELLED'].includes((pr.status || '').toUpperCase()),
        ).length,
      },
    ]
  }, [list, filters.warehouseId])

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
          {row.code || '—'}
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
      width: 280,
      render: (_, pr) => {
        const st = (pr.status || '').toUpperCase()
        return (
          <RowActions
            align="end"
            actions={[
              { kind: 'view', onClick: () => nav(`/warehouse/purchase-requests/${pr.id}`) },
              {
                key: 'submit',
                icon: Send,
                tooltip: 'Gửi duyệt',
                tone: 'primary',
                disabled: submit.isPending,
                hidden: st !== 'DRAFT',
                onClick: () => setSubmitTarget(pr),
              },
              {
                key: 'create-po',
                icon: Package,
                tooltip: 'Tạo đơn mua hàng',
                tone: 'primary',
                disabled: createPo.isPending,
                hidden: st !== 'APPROVED',
                onClick: () => setCreatePoTarget(pr),
              },
            ]}
          />
        )
      },
    },
  ]

  return (
    <WarehouseListShell
      title="Yêu cầu mua hàng"
      description="Tạo yêu cầu → gửi duyệt → tạo đơn mua hàng khi đã duyệt."
      guide={PURCHASE_REQUESTS_GUIDE}
      headerActions={
        <>
          <Button variant="outline" onClick={() => nav('/warehouse/stock-alerts')}>
            Từ cảnh báo tồn
          </Button>
          <Button className="gap-2 shadow-sm" onClick={() => setOpenCreate(true)}>
            <Plus size={16} strokeWidth={2.5} />
            Tạo yêu cầu mua hàng
          </Button>
        </>
      }
      stats={stats}
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
                  label: warehouseSelectLabel(w),
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
      emptyDescription="Tạo yêu cầu mới hoặc chọn cảnh báo tồn → tạo yêu cầu → duyệt → Tạo đơn mua hàng."
      emptyAction={{
        label: 'Tạo yêu cầu mua hàng',
        onClick: () => setOpenCreate(true),
      }}
      filteredEmptyTitle="Không có yêu cầu phù hợp bộ lọc"
      filteredEmptyDescription="Thử đổi kho hoặc trạng thái."
      columns={columns}
      data={filteredList}
      onRefresh={refetch}
    >
      <PrCreateModal
        isOpen={openCreate}
        onClose={() => setOpenCreate(false)}
        warehouseOptions={filters.warehouses}
        supplierOptions={supplierOptions}
        products={products}
        productsError={productsError}
        productsLoading={productsLoading}
        defaultWarehouseId={filters.warehouseId}
        isPending={createPr.isPending}
        onSubmit={(body) =>
          createPr.mutate(body, {
            onSuccess: (pr) => {
              setOpenCreate(false)
              if (pr?.id) nav(`/warehouse/purchase-requests/${pr.id}`)
            },
          })
        }
      />

      <ConfirmDialog
        isOpen={!!submitTarget}
        onClose={() => setSubmitTarget(null)}
        onConfirm={() => {
          if (!submitTarget) return
          submit.mutate(submitTarget.id, {
            onSuccess: () => setSubmitTarget(null),
          })
        }}
        title={`Gửi duyệt ${submitTarget?.code || 'yêu cầu'}?`}
        message="Yêu cầu mua sẽ chuyển sang Hộp thư duyệt — chờ quản lý phê duyệt."
        confirmText="Gửi duyệt"
        cancelText="Huỷ"
        variant="default"
        isLoading={submit.isPending}
      />

      <ConfirmDialog
        isOpen={!!createPoTarget}
        onClose={() => setCreatePoTarget(null)}
        onConfirm={() => {
          if (!createPoTarget) return
          createPo.mutate(createPoTarget.id, {
            onSuccess: (po) => {
              setCreatePoTarget(null)
              nav(
                po?.id
                  ? `/warehouse/purchase-orders/${po.id}`
                  : '/warehouse/purchase-orders',
              )
            },
          })
        }}
        title={`Tạo đơn mua hàng từ ${createPoTarget?.code || 'yêu cầu'}?`}
        message="Hệ thống tạo đơn mua hàng nháp từ các dòng của yêu cầu đã duyệt."
        confirmText="Tạo đơn mua hàng"
        cancelText="Huỷ"
        variant="default"
        isLoading={createPo.isPending}
      />
    </WarehouseListShell>
  )
}
