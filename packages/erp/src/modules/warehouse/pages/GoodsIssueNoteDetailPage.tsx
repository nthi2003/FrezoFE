// ============================================================
// GoodsIssueNoteDetailPage — object page PXK + pipeline duyệt/xuất
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PackageMinus,
  Printer,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import {
  Button,
  PageHeader,
  EmptyState,
  ErrorState,
  ConfirmDialog,
  StatCard,
  PageGuideButton,
} from '@frezo/ui'
import { useProducts } from '@/modules/products/hooks/useProduct'
import {
  useGin,
  useConfirmGin,
  useCancelGin,
  usePrintGin,
  useSubmitGin,
  useApproveGin,
} from '../hooks/useGin'
import { usePermission } from '@/lib/hooks/usePermission'
import {
  StatusPipelineStepper,
  GIN_PIPELINE,
  ginStepIndex,
} from '../components/StatusPipelineStepper'
import { GrnGinStatusBadge } from '../components/GrnGinStatusBadge'
import { GIN_GUIDE } from '../constants/grn-gin.guide'
import {
  computeGinLineStats,
  formatVnd,
  issueTypeLabel,
} from '../utils/grnGinUtils'
import { formatWarehouseLabel } from '../utils/displayUtils'

export function GoodsIssueNoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: gin, isLoading, isError, refetch, isFetching } = useGin(id)
  const { data: productsRaw } = useProducts()
  const submit = useSubmitGin()
  const approve = useApproveGin()
  const confirm = useConfirmGin()
  const cancel = useCancelGin()
  const print = usePrintGin()
  const canUpdate = usePermission('WAREHOUSE.GIN.UPDATE')
  const canApprove = usePermission('WAREHOUSE.GIN.APPROVE')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [qtyDrafts, setQtyDrafts] = useState<Record<string, string>>({})

  const productMap = useMemo(() => {
    const list = productsRaw as Array<{ id: string; code?: string; name?: string }> | undefined
    const map = new Map<string, { code?: string; name?: string }>()
    for (const p of Array.isArray(list) ? list : []) {
      map.set(p.id, { code: p.code, name: p.name })
    }
    return map
  }, [productsRaw])

  useEffect(() => {
    if (!gin?.items) return
    const init: Record<string, string> = {}
    for (const ln of gin.items) {
      if (!ln.id) continue
      const qty =
        ln.qtyIssued && ln.qtyIssued > 0 ? ln.qtyIssued : ln.qtyRequested ?? 0
      init[ln.id] = String(qty)
    }
    setQtyDrafts(init)
  }, [gin?.id, gin?.items])

  if (!id) {
    return (
      <EmptyState
        icon={PackageMinus}
        title="Thiếu ID"
        description="/warehouse/gin/:id"
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

  if (isError || !gin) {
    return (
      <div className="p-6 space-y-4">
        <ErrorState
          title="Không tải được PXK"
          message="BE /warehouse/gin/:id"
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => nav('/warehouse/gin')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  const st = (gin.status || '').toUpperCase()
  const isDraft = st === 'DRAFT'
  const isPending = st === 'PENDING_APPROVAL'
  const isApproved = st === 'APPROVED'
  const canEditQty = isDraft || isApproved
  const lineStats = computeGinLineStats(gin.items || [])

  const nextCta =
    isDraft && canUpdate
      ? {
          label: 'Bước kế: Gửi duyệt',
          onClick: () => setSubmitOpen(true),
          disabled: submit.isPending,
          loading: submit.isPending,
        }
      : isPending && canApprove
        ? {
            label: 'Bước kế: Duyệt phiếu',
            onClick: () => setApproveOpen(true),
            disabled: approve.isPending,
            loading: approve.isPending,
          }
        : isApproved && canUpdate
          ? {
              label: 'Bước kế: Xác nhận xuất kho',
              onClick: () => setConfirmOpen(true),
              disabled: confirm.isPending,
              loading: confirm.isPending,
            }
          : null

  return (
    <div className="pb-8 animate-fade-in">
      <div className="sticky top-0 z-20 bg-neutral-50/95 backdrop-blur border-b border-neutral-200/80 px-6 py-4 space-y-3">
        <PageHeader
          title={gin.ginCode || gin.id}
          description={
            <>
              {formatWarehouseLabel(gin)}
              {' · '}
              {issueTypeLabel(gin.issueType)}
              {' · '}
              <GrnGinStatusBadge status={gin.status} />
            </>
          }
          actions={
            <div className="flex flex-wrap gap-2 items-center">
              <PageGuideButton guide={GIN_GUIDE} />
              <Button variant="outline" className="gap-1" onClick={() => nav('/warehouse/gin')}>
                <ArrowLeft size={14} /> Danh sách
              </Button>
              <Button
                variant="outline"
                className="gap-1"
                disabled={print.isPending}
                onClick={() => print.mutate(gin.id)}
              >
                <Printer size={14} /> In
              </Button>
              {isDraft && canUpdate && (
                <Button className="gap-1" onClick={() => setSubmitOpen(true)}>
                  <Send size={14} /> Gửi duyệt
                </Button>
              )}
              {isPending && canApprove && (
                <Button className="gap-1" onClick={() => setApproveOpen(true)}>
                  <ShieldCheck size={14} /> Duyệt
                </Button>
              )}
              {(isApproved || isDraft) && canUpdate && (
                <Button className="gap-1" onClick={() => setConfirmOpen(true)}>
                  <CheckCircle2 size={14} /> Xác nhận xuất
                </Button>
              )}
              {(isDraft || isPending || isApproved) && canUpdate && (
                <Button
                  variant="outline"
                  className="gap-1 text-rose-700"
                  onClick={() => setCancelOpen(true)}
                >
                  <XCircle size={14} /> Huỷ
                </Button>
              )}
            </div>
          }
        />

        <StatusPipelineStepper
          steps={GIN_PIPELINE}
          currentIndex={ginStepIndex(st)}
          nextCta={nextCta}
          showInboxLink={isPending}
        />
      </div>

      <div className="px-6 pt-4 space-y-4 max-w-5xl">
        {(isDraft || isPending) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {isDraft
              ? 'PXK nháp — gửi duyệt hoặc xác nhận xuất trực tiếp (nếu có quyền). Tồn chỉ giảm khi Xác nhận xuất.'
              : 'Đang chờ duyệt — kế toán/trưởng bộ phận duyệt trước khi thủ kho xác nhận xuất.'}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-4 space-y-2 text-sm">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Chứng từ xuất
            </h3>
            <dl className="grid grid-cols-[120px_1fr] gap-1">
              <dt className="text-neutral-500">Số CT/HĐ</dt>
              <dd className="font-mono">{gin.documentNo || '—'}</dd>
              <dt className="text-neutral-500">Ngày CT</dt>
              <dd>{gin.documentDate || '—'}</dd>
              <dt className="text-neutral-500">Khách hàng</dt>
              <dd>{gin.customerName || gin.customerId || '—'}</dd>
              {gin.transferWarehouseName && (
                <>
                  <dt className="text-neutral-500">Kho đích</dt>
                  <dd>{gin.transferWarehouseName}</dd>
                </>
              )}
              {gin.approvedBy && (
                <>
                  <dt className="text-neutral-500">Người duyệt</dt>
                  <dd>{gin.approvedBy}</dd>
                </>
              )}
            </dl>
          </div>
          <div className="grid grid-cols-2 gap-3 content-start">
            <StatCard label="Dòng hàng" value={lineStats.lineCount} />
            <StatCard label="Tổng SL" value={lineStats.totalQty} />
            <StatCard
              label="Giá trị"
              value={formatVnd(gin.totalValue ?? lineStats.totalValue)}
            />
            {gin.issuedAt && (
              <StatCard
                label="Ngày xuất"
                value={String(gin.issuedAt).slice(0, 10)}
              />
            )}
          </div>
        </div>

        {gin.note && (
          <div className="rounded-lg border bg-white px-4 py-3 text-sm">
            <span className="text-neutral-500">Ghi chú: </span>
            {gin.note}
          </div>
        )}

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-4 py-2 text-xs text-neutral-500 border-b bg-neutral-50/80">
            {gin.items?.length ?? 0} dòng hàng
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-left text-xs">
                <tr>
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3 text-right">Yêu cầu</th>
                  <th className="p-3 text-right">Xuất</th>
                  <th className="p-3 text-right">Đơn giá</th>
                  <th className="p-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(gin.items || []).map((ln, i) => {
                  const prod = productMap.get(ln.productId)
                  const qty = Number(qtyDrafts[ln.id!] ?? ln.qtyRequested ?? 0)
                  const lineVal = ln.unitCost != null ? qty * ln.unitCost : null
                  return (
                    <tr key={ln.id || i}>
                      <td className="p-3">
                        <div className="font-mono text-xs text-primary-700">
                          {prod?.code || ln.productId.slice(0, 8)}
                        </div>
                        {prod?.name && (
                          <div className="text-neutral-600 text-xs">{prod.name}</div>
                        )}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {ln.qtyRequested ?? '—'}
                      </td>
                      <td className="p-3 text-right">
                        {canEditQty && ln.id ? (
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
                          <span className="tabular-nums">{ln.qtyIssued ?? 0}</span>
                        )}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {formatVnd(ln.unitCost)}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {formatVnd(lineVal ?? undefined)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {isPending && (
          <p className="text-xs text-neutral-500">
            Hoặc duyệt qua{' '}
            <Link to="/approval/inbox" className="text-primary-700 hover:underline">
              Hộp thư duyệt
            </Link>
            .
          </p>
        )}
      </div>

      <ConfirmDialog
        isOpen={submitOpen}
        onClose={() => !submit.isPending && setSubmitOpen(false)}
        onConfirm={() =>
          submit.mutate(gin.id, { onSettled: () => setSubmitOpen(false) })
        }
        title="Gửi duyệt phiếu xuất?"
        message={`PXK ${gin.ginCode} chuyển sang Chờ duyệt.`}
        confirmText="Gửi duyệt"
        cancelText="Huỷ"
        variant="warning"
        isLoading={submit.isPending}
      />

      <ConfirmDialog
        isOpen={approveOpen}
        onClose={() => !approve.isPending && setApproveOpen(false)}
        onConfirm={() =>
          approve.mutate(gin.id, { onSettled: () => setApproveOpen(false) })
        }
        title="Duyệt phiếu xuất kho?"
        message="Sau khi duyệt, thủ kho có thể xác nhận xuất và trừ tồn."
        confirmText="Duyệt"
        cancelText="Huỷ"
        variant="warning"
        isLoading={approve.isPending}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => !confirm.isPending && setConfirmOpen(false)}
        onConfirm={() => {
          const items = (gin.items || [])
            .filter((ln) => ln.id)
            .map((ln) => ({
              itemId: ln.id!,
              qtyIssued: Number(qtyDrafts[ln.id!] ?? ln.qtyRequested ?? 0),
            }))
          confirm.mutate(
            { id: gin.id, body: { items } },
            { onSettled: () => setConfirmOpen(false) },
          )
        }}
        title="Xác nhận xuất kho?"
        message={`PXK ${gin.ginCode} sẽ chuyển sang Đã xuất và trừ stock.`}
        confirmText="Xác nhận xuất"
        cancelText="Huỷ"
        variant="warning"
        isLoading={confirm.isPending}
      />

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => !cancel.isPending && setCancelOpen(false)}
        onConfirm={() =>
          cancel.mutate({ id: gin.id }, { onSettled: () => setCancelOpen(false) })
        }
        title="Huỷ phiếu xuất kho?"
        message="Chỉ huỷ khi chưa xác nhận xuất."
        confirmText="Huỷ phiếu"
        cancelText="Đóng"
        variant="danger"
        isLoading={cancel.isPending}
      />
    </div>
  )
}
