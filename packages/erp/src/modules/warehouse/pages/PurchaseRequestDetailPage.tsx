// ============================================================
// PurchaseRequestDetailPage — chi tiết + submit Approval (LNK-05)
// ============================================================

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, Loader2, Inbox, Package } from 'lucide-react'
import { Button, ConfirmDialog, StatusBadge } from '@frezo/ui'
import {
  usePurchaseRequest,
  useSubmitPurchaseRequest,
} from '../hooks/usePurchaseRequest'
import { useCreatePoFromPr } from '../hooks/usePurchaseOrder'
import { ApprovalTimeline } from '@/modules/approval/components/ApprovalTimeline'
import { SubjectType } from '@/modules/approval/types'
import {
  StatusPipelineStepper,
  PR_PIPELINE,
  prStepIndex,
} from '../components/StatusPipelineStepper'
import {
  isPendingApprovalStatus,
  resolveWarehouseStatus,
} from '../constants/warehouseStatus'
import { formatSupplierLabel, formatWarehouseLabel } from '../utils/displayUtils'

export function PurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: pr, isLoading, isError, refetch, isFetching } = usePurchaseRequest(id)
  const submit = useSubmitPurchaseRequest()
  const createPo = useCreatePoFromPr()
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false)

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
        <ErrorState
          title="Không tải được PR"
          message="BE có thể chưa sẵn — kiểm tra /warehouse/purchase-requests/:id"
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => nav('/warehouse/purchase-requests')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  const status = (pr.status || '').toUpperCase()
  const isDraft = status === 'DRAFT'
  const isApproved = status === 'APPROVED'
  const pending = isPendingApprovalStatus(status)
  const statusCfg = resolveWarehouseStatus(status, 'pr')

  return (
    <div className="p-6 space-y-4 animate-fade-in max-w-3xl">
      <PageHeader
        title={pr.code || pr.id}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span>Kho: {formatWarehouseLabel(pr)} · NCC: {formatSupplierLabel(pr)}</span>
            <StatusBadge label={statusCfg.label} color={statusCfg.color} />
          </span>
        }
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
                onClick={() => setSubmitConfirmOpen(true)}
              >
                <Send size={14} /> Gửi duyệt
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
            {pending ? (
              <Link to="/approval/inbox">
                <Button className="gap-1">
                  <Inbox size={14} /> Mở Hộp thư duyệt
                </Button>
              </Link>
            ) : (
              <Link to="/approval/inbox">
                <Button variant="outline" className="gap-1">
                  <Inbox size={14} /> Inbox
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* FR-UX-15 pipeline */}
      <StatusPipelineStepper
        steps={PR_PIPELINE}
        currentIndex={prStepIndex(status)}
        showInboxLink={pending}
        nextCta={
          isDraft
            ? {
                label: 'Bước kế: Gửi duyệt',
                onClick: () => setSubmitConfirmOpen(true),
                disabled: submit.isPending,
                loading: submit.isPending,
              }
            : isApproved
              ? {
                  label: 'Bước kế: Tạo PO',
                  onClick: () =>
                    createPo.mutate(pr.id, {
                      onSuccess: (po) =>
                        nav(
                          po?.id
                            ? `/warehouse/purchase-orders/${po.id}`
                            : '/warehouse/purchase-orders',
                        ),
                    }),
                  disabled: createPo.isPending,
                  loading: createPo.isPending,
                }
              : pending
                ? { label: 'Mở Hộp thư duyệt', href: '/approval/inbox' }
                : null
        }
      />

      {pending && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex flex-wrap items-center gap-3">
          <span className="flex-1 min-w-0">
            PR đang <strong>chờ duyệt</strong>. Theo dõi / duyệt tại Hộp thư duyệt — không
            cấu hình lại trên Workflow designer.
          </span>
          <Link to="/approval/inbox">
            <Button size="sm" className="gap-1 shrink-0">
              <Inbox size={14} /> Hộp thư duyệt
            </Button>
          </Link>
        </div>
      )}

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

      <ConfirmDialog
        isOpen={submitConfirmOpen}
        onClose={() => setSubmitConfirmOpen(false)}
        onConfirm={() => {
          submit.mutate(pr.id, {
            onSuccess: () => {
              setSubmitConfirmOpen(false)
              nav('/approval/inbox')
            },
          })
        }}
        title={`Gửi duyệt PR ${pr.code || pr.id}?`}
        message="PR sẽ vào Hộp thư duyệt. Bạn có thể theo dõi trạng thái tại đó."
        confirmText="Gửi duyệt"
        cancelText="Huỷ"
        variant="warning"
        isLoading={submit.isPending}
      />
    </div>
  )
}
