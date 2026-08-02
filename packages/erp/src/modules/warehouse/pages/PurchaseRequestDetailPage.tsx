// ============================================================
// PurchaseRequestDetailPage — WarehouseDetailShell + pipeline + ConfirmDialog
// ============================================================

import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Inbox, Package, Send } from 'lucide-react'
import { Button, ConfirmDialog, PageGuideButton } from '@frezo/ui'
import { useProducts } from '@/modules/products/hooks/useProduct'
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
import { WarehouseDetailShell } from '../components/WarehouseDetailShell'
import { WarehouseStatusBadge } from '../components/WarehouseStatusBadge'
import { isPendingApprovalStatus } from '../constants/warehouseStatus'
import { PURCHASE_REQUESTS_GUIDE } from '../constants/purchase.guide'
import {
  formatProductLabel,
  formatSupplierLabel,
  formatWarehouseLabel,
} from '../utils/displayUtils'
import type { PurchaseRequestLineDto } from '../services/purchaseRequestApi'

function lineProductLabel(
  ln: PurchaseRequestLineDto,
  productMap: Map<string, { code?: string; name?: string }>,
) {
  if (ln.productName || ln.productCode) {
    return formatProductLabel(ln)
  }
  const prod = productMap.get(ln.productId)
  if (prod) return formatProductLabel({ ...prod, productId: ln.productId })
  return ln.productId || '—'
}

export function PurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: pr, isLoading, isError, refetch, isFetching } = usePurchaseRequest(id)
  const { data: productsRaw } = useProducts()
  const submit = useSubmitPurchaseRequest()
  const createPo = useCreatePoFromPr()
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false)
  const [createPoConfirmOpen, setCreatePoConfirmOpen] = useState(false)

  const productMap = useMemo(() => {
    const list = productsRaw as Array<{ id: string; code?: string; name?: string }> | undefined
    const map = new Map<string, { code?: string; name?: string }>()
    for (const p of Array.isArray(list) ? list : []) {
      map.set(p.id, { code: p.code, name: p.name })
    }
    return map
  }, [productsRaw])

  const status = (pr?.status || '').toUpperCase()
  const isDraft = status === 'DRAFT'
  const isApproved = status === 'APPROVED'
  const pending = isPendingApprovalStatus(status)

  const totalQty = useMemo(
    () => (pr?.lines || []).reduce((sum, ln) => sum + (Number(ln.qty) || 0), 0),
    [pr?.lines],
  )

  const goCreatePo = () => {
    if (!pr) return
    createPo.mutate(pr.id, {
      onSuccess: (po) => {
        setCreatePoConfirmOpen(false)
        nav(
          po?.id
            ? `/warehouse/purchase-orders/${po.id}`
            : '/warehouse/purchase-orders',
        )
      },
    })
  }

  return (
    <>
      <WarehouseDetailShell
        missingIdTitle={!id ? 'Thiếu ID yêu cầu mua hàng' : undefined}
        missingIdDescription={!id ? '/warehouse/purchase-requests/:id' : undefined}
        missingIcon={!id ? Inbox : undefined}
        breadcrumb={
          pr
            ? [
                { label: 'Kho', onClick: () => nav('/warehouse') },
                {
                  label: 'Yêu cầu mua hàng',
                  onClick: () => nav('/warehouse/purchase-requests'),
                },
                { label: pr.code || id! },
              ]
            : undefined
        }
        title={pr?.code || id || '—'}
        subtitle={
          pr
            ? `${formatWarehouseLabel(pr)} · ${formatSupplierLabel(pr)}`
            : undefined
        }
        statusBadge={pr ? <WarehouseStatusBadge status={pr.status} kind="pr" /> : undefined}
        kpi={
          pr
            ? [
                { label: 'Số dòng', value: pr.lines?.length || 0 },
                { label: 'Tổng SL', value: totalQty },
                ...(pr.submittedAt
                  ? [{ label: 'Ngày gửi', value: String(pr.submittedAt).slice(0, 10) }]
                  : []),
              ]
            : undefined
        }
        actions={
          pr ? (
            <div className="flex flex-wrap gap-2 items-center">
              <PageGuideButton guide={PURCHASE_REQUESTS_GUIDE} />
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
                  onClick={() => setCreatePoConfirmOpen(true)}
                >
                  <Package size={14} /> Tạo đơn mua hàng
                </Button>
              )}
              <Link to="/approval/inbox">
                <Button variant={pending ? 'default' : 'outline'} className="gap-1">
                  <Inbox size={14} /> {pending ? 'Mở Hộp thư duyệt' : 'Hộp thư duyệt'}
                </Button>
              </Link>
            </div>
          ) : undefined
        }
        pipeline={
          pr ? (
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
                        label: 'Bước kế: Tạo đơn mua hàng',
                        onClick: () => setCreatePoConfirmOpen(true),
                        disabled: createPo.isPending,
                        loading: createPo.isPending,
                      }
                    : pending
                      ? { label: 'Mở Hộp thư duyệt', href: '/approval/inbox' }
                      : null
              }
            />
          ) : undefined
        }
        alert={
          pr ? (
            <>
              {isApproved && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Yêu cầu đã duyệt — bấm <strong>Tạo đơn mua hàng</strong> để đặt hàng với NCC,
                  sau đó nhận hàng bằng phiếu nhập kho.
                </div>
              )}
              {pending && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex flex-wrap items-center gap-3">
                  <span className="flex-1 min-w-0">
                    Yêu cầu mua đang <strong>chờ duyệt</strong>. Theo dõi / duyệt tại Hộp thư
                    duyệt — không cấu hình lại trên Workflow designer.
                  </span>
                  <Link to="/approval/inbox">
                    <Button size="sm" className="gap-1 shrink-0">
                      <Inbox size={14} /> Hộp thư duyệt
                    </Button>
                  </Link>
                </div>
              )}
            </>
          ) : undefined
        }
        isLoading={isLoading}
        isError={isError || (!isLoading && !pr && !!id)}
        isFetching={isFetching}
        onRetry={refetch}
        errorTitle="Không tải được yêu cầu mua hàng"
        backHref="/warehouse/purchase-requests"
      >
        {pr && (
          <>
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-xs text-neutral-500 text-left">
                  <tr>
                    <th className="p-3">Sản phẩm</th>
                    <th className="p-3 text-right">Số lượng</th>
                    <th className="p-3 text-right">Đơn giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(pr.lines || []).map((ln, i) => (
                    <tr key={ln.id || i}>
                      <td className="p-3">
                        <div className="font-medium">
                          {lineProductLabel(ln, productMap)}
                        </div>
                        {(ln.productCode || productMap.get(ln.productId)?.code) && (
                          <div className="text-[11px] text-neutral-400 font-mono">
                            {ln.productCode || productMap.get(ln.productId)?.code}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right tabular-nums">{ln.qty}</td>
                      <td className="p-3 text-right tabular-nums">
                        {ln.unitPrice ?? '—'}
                      </td>
                    </tr>
                  ))}
                  {(pr.lines || []).length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-neutral-500 text-sm">
                        Chưa có dòng hàng
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {pr.note && (
              <p className="text-sm text-neutral-600 bg-neutral-50 border rounded-lg p-3">
                {pr.note}
              </p>
            )}

            <section className="bg-white border rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-2">Luồng duyệt</h3>
              <ApprovalTimeline
                subjectType={SubjectType.PURCHASE_REQUEST}
                subjectId={pr.id}
              />
            </section>
          </>
        )}
      </WarehouseDetailShell>

      {pr && (
        <>
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
            title={`Gửi duyệt ${pr.code || 'yêu cầu'}?`}
            message="Yêu cầu mua sẽ vào Hộp thư duyệt. Bạn có thể theo dõi trạng thái tại đó."
            confirmText="Gửi duyệt"
            cancelText="Huỷ"
            variant="warning"
            isLoading={submit.isPending}
          />

          <ConfirmDialog
            isOpen={createPoConfirmOpen}
            onClose={() => {
              if (!createPo.isPending) setCreatePoConfirmOpen(false)
            }}
            onConfirm={goCreatePo}
            title={`Tạo đơn mua hàng từ ${pr.code || 'yêu cầu'}?`}
            message="Hệ thống tạo đơn mua hàng nháp từ các dòng của yêu cầu đã duyệt."
            confirmText="Tạo đơn mua hàng"
            cancelText="Huỷ"
            variant="default"
            isLoading={createPo.isPending}
          />
        </>
      )}
    </>
  )
}
