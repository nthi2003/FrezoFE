// ============================================================
// PurchaseRequestDetailPage — chi tiết + submit Approval
// ============================================================

import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, Loader2, Inbox, Package } from 'lucide-react'
import { Button, PageHeader, EmptyState } from '@frezo/ui'
import {
  usePurchaseRequest,
  useSubmitPurchaseRequest,
} from '../hooks/usePurchaseRequest'
import { useCreatePoFromPr } from '../hooks/usePurchaseOrder'
import { ApprovalTimeline } from '@/modules/approval/components/ApprovalTimeline'
import { SubjectType } from '@/modules/approval/types'

export function PurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: pr, isLoading, isError } = usePurchaseRequest(id)
  const submit = useSubmitPurchaseRequest()
  const createPo = useCreatePoFromPr()

  if (!id) {
    return (
      <EmptyState
        icon={Inbox}
        title="Thiếu ID"
        description="URL /warehouse/purchase-requests/:id"
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

  if (isError || !pr) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Inbox}
          title="Không tải được PR"
          description="BE có thể chưa sẵn — kiểm tra /warehouse/purchase-requests/:id"
          action={{ label: 'Quay lại', onClick: () => nav('/warehouse/purchase-requests') }}
        />
      </div>
    )
  }

  const status = (pr.status || '').toUpperCase()
  const isDraft = status === 'DRAFT'
  const isApproved = status === 'APPROVED'

  return (
    <div className="p-6 space-y-4 animate-fade-in max-w-3xl">
      <PageHeader
        title={pr.code || pr.id}
        description={`Supplier: ${pr.supplierName || pr.supplierId || '—'} · ${pr.status}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => nav('/warehouse/purchase-requests')}
            >
              <ArrowLeft size={14} /> Danh sách
            </Button>
            {isDraft && (
              <Button
                className="gap-1"
                disabled={submit.isPending}
                onClick={() =>
                  submit.mutate(pr.id, {
                    onSuccess: () => nav('/approval/inbox'),
                  })
                }
              >
                <Send size={14} /> Submit → Approval
              </Button>
            )}
            {isApproved && (
              <Button
                className="gap-1"
                disabled={createPo.isPending}
                onClick={() =>
                  createPo.mutate(pr.id, {
                    onSuccess: (po) =>
                      nav(
                        po?.id
                          ? `/warehouse/purchase-orders/${po.id}`
                          : '/warehouse/purchase-orders',
                      ),
                  })
                }
              >
                <Package size={14} /> Tạo PO
              </Button>
            )}
            <Link to="/approval/inbox">
              <Button variant="outline" className="gap-1">
                <Inbox size={14} /> Inbox
              </Button>
            </Link>
          </div>
        }
      />

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-xs text-neutral-500 text-left">
            <tr>
              <th className="p-3">SP</th>
              <th className="p-3 text-right">Qty</th>
              <th className="p-3 text-right">Đơn giá</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(pr.lines || []).map((ln, i) => (
              <tr key={ln.id || i}>
                <td className="p-3">
                  <div className="font-medium">
                    {ln.productName || ln.productId}
                  </div>
                  {ln.productCode && (
                    <div className="text-[11px] text-neutral-400 font-mono">
                      {ln.productCode}
                    </div>
                  )}
                </td>
                <td className="p-3 text-right tabular-nums">{ln.qty}</td>
                <td className="p-3 text-right tabular-nums">
                  {ln.unitPrice ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pr.note && (
        <p className="text-sm text-neutral-600 bg-neutral-50 border rounded-lg p-3">
          {pr.note}
        </p>
      )}

      <section className="bg-white border rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold mb-2">Luồng Approval</h3>
        <ApprovalTimeline
          subjectType={SubjectType.PURCHASE_REQUEST}
          subjectId={pr.id}
        />
      </section>
    </div>
  )
}
