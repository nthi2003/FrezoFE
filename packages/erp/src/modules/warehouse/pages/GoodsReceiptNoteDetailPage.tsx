// ============================================================
// GoodsReceiptNoteDetailPage — chi tiết PNK + confirm/cancel/print
// ============================================================

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PackagePlus,
  Printer,
  XCircle,
  Inbox,
} from 'lucide-react'
import {
  Button,
  PageHeader,
  EmptyState,
  ErrorState,
  ConfirmDialog,
} from '@frezo/ui'
import {
  useGrn,
  useConfirmGrn,
  useCancelGrn,
  usePrintGrn,
} from '../hooks/useGrn'
import { usePermission } from '@/lib/hooks/usePermission'
import {
  StatusPipelineStepper,
  GRN_PIPELINE,
  grnStepIndex,
} from '../components/StatusPipelineStepper'

export function GoodsReceiptNoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: grn, isLoading, isError, refetch, isFetching } = useGrn(id)
  const confirm = useConfirmGrn()
  const cancel = useCancelGrn()
  const print = usePrintGrn()
  const canUpdate = usePermission('WAREHOUSE.GRN.UPDATE')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [qtyDrafts, setQtyDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!grn?.items) return
    const init: Record<string, string> = {}
    for (const ln of grn.items) {
      if (!ln.id) continue
      const qty =
        ln.qtyReceived && ln.qtyReceived > 0
          ? ln.qtyReceived
          : ln.qtyExpected ?? 0
      init[ln.id] = String(qty)
    }
    setQtyDrafts(init)
  }, [grn?.id, grn?.items])

  if (!id) {
    return (
      <EmptyState
        icon={PackagePlus}
        title="Thiếu ID"
        description="/warehouse/grn/:id"
      />
    )
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
      </div>
    )
  }

  if (isError || !grn) {
    return (
      <div className="p-6">
        <ErrorState
          title="Không tải được PNK"
          message="BE /warehouse/grn/:id"
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
        <div className="flex justify-center mt-2">
          <Button variant="outline" onClick={() => nav('/warehouse/grn')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  const st = (grn.status || '').toUpperCase()
  const isDraft = st === 'DRAFT'

  return (
    <div className="p-6 space-y-4 animate-fade-in max-w-3xl">
      <PageHeader
        title={grn.grnCode || grn.id}
        description={`Kho ${grn.warehouseId} · ${grn.status}${
          grn.purchaseOrderId ? ` · PO ${grn.purchaseOrderId}` : ''
        }`}
        actions={
          <div className="flex gap-2 items-center flex-wrap">
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => nav('/warehouse/grn')}
            >
              <ArrowLeft size={14} /> Danh sách
            </Button>
            <Button
              variant="outline"
              className="gap-1"
              disabled={print.isPending}
              onClick={() => print.mutate(grn.id)}
            >
              <Printer size={14} /> In
            </Button>
            {grn.purchaseOrderId && (
              <Link to={`/warehouse/purchase-orders/${grn.purchaseOrderId}`}>
                <Button variant="outline" size="sm">
                  Xem PO
                </Button>
              </Link>
            )}
            <Link to="/approval/inbox">
              <Button variant="outline" className="gap-1" size="sm">
                <Inbox size={14} /> Approval
              </Button>
            </Link>
            {isDraft && canUpdate && (
              <>
                <Button
                  className="gap-1"
                  disabled={confirm.isPending}
                  onClick={() => setConfirmOpen(true)}
                >
                  <CheckCircle2 size={14} /> Confirm nhập
                </Button>
                <Button
                  variant="outline"
                  className="gap-1 text-rose-700"
                  disabled={cancel.isPending}
                  onClick={() => setCancelOpen(true)}
                >
                  <XCircle size={14} /> Huỷ
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* FR-UX-15 pipeline */}
      <StatusPipelineStepper
        steps={GRN_PIPELINE}
        currentIndex={grnStepIndex(st)}
        nextCta={
          isDraft && canUpdate
            ? {
                label: 'Bước kế: Confirm nhập kho',
                onClick: () => setConfirmOpen(true),
                disabled: confirm.isPending,
                loading: confirm.isPending,
              }
            : null
        }
      />

      {isDraft && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          PNK ở trạng thái DRAFT. Confirm sẽ ghi sổ tồn. Luồng mua hàng liên
          quan Approval nằm ở PR → Hộp thư duyệt (không tạo engine duyệt riêng
          cho GRN).
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-xs text-neutral-500 text-left">
            <tr>
              <th className="p-3">SP</th>
              <th className="p-3 text-right">Dự kiến</th>
              <th className="p-3 text-right">Nhận</th>
              <th className="p-3 text-right">Đơn giá</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(grn.items || []).map((ln, i) => (
              <tr key={ln.id || i}>
                <td className="p-3 font-mono text-xs">{ln.productId}</td>
                <td className="p-3 text-right tabular-nums">
                  {ln.qtyExpected ?? '—'}
                </td>
                <td className="p-3 text-right">
                  {isDraft && ln.id ? (
                    <input
                      type="number"
                      min={0}
                      className="w-24 border rounded px-2 py-1 text-sm tabular-nums text-right"
                      value={qtyDrafts[ln.id] ?? ''}
                      onChange={(e) =>
                        setQtyDrafts((d) => ({
                          ...d,
                          [ln.id!]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <span className="tabular-nums">{ln.qtyReceived ?? 0}</span>
                  )}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {ln.unitCost ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          if (!confirm.isPending) setConfirmOpen(false)
        }}
        onConfirm={() => {
          const items = (grn.items || [])
            .filter((ln) => ln.id)
            .map((ln) => ({
              itemId: ln.id!,
              qtyReceived: Number(qtyDrafts[ln.id!] ?? ln.qtyExpected ?? 0),
            }))
          confirm.mutate(
            { id: grn.id, body: { items } },
            { onSettled: () => setConfirmOpen(false) },
          )
        }}
        title="Xác nhận nhập kho?"
        message={`PNK ${grn.grnCode || grn.id} sẽ chuyển DRAFT → CONFIRMED và cập nhật stock.`}
        confirmText="Confirm"
        cancelText="Huỷ"
        variant="warning"
        isLoading={confirm.isPending}
      />

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => {
          if (!cancel.isPending) setCancelOpen(false)
        }}
        onConfirm={() => {
          cancel.mutate(
            { id: grn.id },
            { onSettled: () => setCancelOpen(false) },
          )
        }}
        title="Huỷ phiếu nhập kho?"
        message="Chỉ nên huỷ khi chưa Confirm."
        confirmText="Huỷ phiếu"
        cancelText="Đóng"
        variant="danger"
        isLoading={cancel.isPending}
      />
    </div>
  )
}
