// ============================================================
// GoodsIssueNoteDetailPage — object page PXK + pipeline duyệt/xuất
// ============================================================

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CheckCircle2,
  PackageMinus,
  Printer,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { Button, ConfirmDialog, PageGuideButton } from '@frezo/ui'
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
import { WarehouseDetailShell } from '../components/WarehouseDetailShell'
import { FefoSuggestPanel } from '../components/FefoSuggestPanel'
import { GIN_GUIDE } from '../constants/grn-gin.guide'
import {
  computeGinLineStats,
  formatGinDate,
  formatVnd,
  issueTypeLabel,
} from '../utils/grnGinUtils'
import { formatProductLabel, formatWarehouseLabel } from '../utils/displayUtils'
import type { FefoBatchSuggestion } from '../services/batchApi'
import type { GinItemDto } from '../services/ginApi'

function lineProductLabel(
  ln: GinItemDto,
  productMap: Map<string, { code?: string; name?: string }>,
) {
  const prod = productMap.get(ln.productId)
  if (prod) return formatProductLabel({ ...prod, productId: ln.productId })
  return ln.productId
}

function lineProductCode(
  ln: GinItemDto,
  productMap: Map<string, { code?: string; name?: string }>,
) {
  return productMap.get(ln.productId)?.code || ln.productId
}

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
  const [batchDrafts, setBatchDrafts] = useState<Record<string, string>>({})
  const [expandedLineId, setExpandedLineId] = useState<string | null>(null)

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
    const batchInit: Record<string, string> = {}
    for (const ln of gin.items) {
      if (ln.id && ln.batchId) batchInit[ln.id] = ln.batchId
    }
    setBatchDrafts(batchInit)
  }, [gin?.id, gin?.items])

  const st = (gin?.status || '').toUpperCase()
  const isDraft = st === 'DRAFT'
  const isPending = st === 'PENDING_APPROVAL'
  const isApproved = st === 'APPROVED'
  const isConfirmed = st === 'CONFIRMED'
  const isCancelled = st === 'CANCELLED'
  const canEditQty = (isDraft || isApproved) && !isCancelled
  const lineStats = computeGinLineStats(gin?.items || [])

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

  const handleConfirm = () => {
    if (!gin) return
    const items = (gin.items || [])
      .filter((ln) => ln.id)
      .map((ln) => ({
        itemId: ln.id!,
        qtyIssued: Number(qtyDrafts[ln.id!] ?? ln.qtyRequested ?? 0),
        batchId: batchDrafts[ln.id!] || ln.batchId,
      }))
    confirm.mutate(
      { id: gin.id, body: { items } },
      { onSettled: () => setConfirmOpen(false) },
    )
  }

  return (
    <>
      <WarehouseDetailShell
        missingIdTitle={!id ? 'Thiếu ID phiếu xuất' : undefined}
        missingIdDescription={!id ? '/warehouse/gin/:id' : undefined}
        missingIcon={!id ? PackageMinus : undefined}
        breadcrumb={
          gin
            ? [
                { label: 'Kho', onClick: () => nav('/warehouse') },
                { label: 'Phiếu xuất kho', onClick: () => nav('/warehouse/gin') },
                { label: gin.ginCode || id! },
              ]
            : undefined
        }
        title={gin?.ginCode || id || '—'}
        subtitle={
          gin
            ? `${formatWarehouseLabel(gin)} · ${issueTypeLabel(gin.issueType)} · ${formatGinDate(gin)}`
            : undefined
        }
        statusBadge={gin ? <GrnGinStatusBadge status={gin.status} /> : undefined}
        kpi={
          gin
            ? [
                { label: 'Tổng SL', value: lineStats.totalQty },
                { label: 'Số dòng', value: lineStats.lineCount },
                {
                  label: 'Giá trị',
                  value: formatVnd(gin.totalValue ?? lineStats.totalValue),
                },
                ...(gin.issuedAt
                  ? [{ label: 'Ngày xuất', value: String(gin.issuedAt).slice(0, 10) }]
                  : []),
              ]
            : undefined
        }
        actions={
          gin ? (
            <div className="flex flex-wrap gap-2 items-center">
              <PageGuideButton guide={GIN_GUIDE} />
              <Button
                variant="outline"
                className="gap-1 no-print"
                disabled={print.isPending}
                onClick={() => print.mutate(gin.id)}
              >
                <Printer size={14} /> In phiếu
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
          ) : undefined
        }
        isLoading={isLoading}
        isError={isError || (!isLoading && !gin)}
        isFetching={isFetching}
        onRetry={refetch}
        errorTitle="Không tải được phiếu xuất kho"
        backHref="/warehouse/gin"
        backLabel="Danh sách phiếu xuất kho"
        pipeline={
          gin ? (
            <StatusPipelineStepper
              steps={GIN_PIPELINE}
              currentIndex={ginStepIndex(st)}
              nextCta={nextCta}
              showInboxLink={isPending}
            />
          ) : undefined
        }
        alert={
          gin && (isDraft || isPending) ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {isDraft
                ? 'Phiếu xuất nháp — gửi duyệt hoặc xác nhận xuất trực tiếp (nếu có quyền). Tồn chỉ giảm khi Xác nhận xuất.'
                : 'Đang chờ duyệt — kế toán/trưởng bộ phận duyệt trước khi thủ kho xác nhận xuất.'}
            </div>
          ) : undefined
        }
      >
        {gin && (
          <>
            {/* Thông tin chứng từ */}
            <section className="rounded-xl border bg-white overflow-hidden">
              <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide border-b bg-neutral-50/80">
                Thông tin chứng từ
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <dl className="space-y-2">
                  <div className="grid grid-cols-[120px_1fr] gap-1">
                    <dt className="text-neutral-500">Loại xuất</dt>
                    <dd className="font-medium">{issueTypeLabel(gin.issueType)}</dd>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-1">
                    <dt className="text-neutral-500">Số CT/HĐ</dt>
                    <dd className="font-mono">{gin.documentNo || '—'}</dd>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-1">
                    <dt className="text-neutral-500">Ngày CT</dt>
                    <dd>{gin.documentDate || '—'}</dd>
                  </div>
                </dl>
                <dl className="space-y-2">
                  <div className="grid grid-cols-[120px_1fr] gap-1">
                    <dt className="text-neutral-500">Khách hàng</dt>
                    <dd>{gin.customerName || gin.customerId || '—'}</dd>
                  </div>
                  {gin.transferWarehouseName && (
                    <div className="grid grid-cols-[120px_1fr] gap-1">
                      <dt className="text-neutral-500">Kho đích</dt>
                      <dd>{gin.transferWarehouseName}</dd>
                    </div>
                  )}
                  {gin.approvedBy && (
                    <div className="grid grid-cols-[120px_1fr] gap-1">
                      <dt className="text-neutral-500">Người duyệt</dt>
                      <dd>{gin.approvedBy}</dd>
                    </div>
                  )}
                  {gin.note && (
                    <div className="grid grid-cols-[120px_1fr] gap-1">
                      <dt className="text-neutral-500">Ghi chú</dt>
                      <dd>{gin.note}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </section>

            {/* Dòng hàng */}
            <section className="bg-white border rounded-xl overflow-hidden">
              <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide border-b bg-neutral-50/80 flex justify-between">
                <span>Dòng hàng</span>
                <span className="font-normal normal-case">{gin.items?.length ?? 0} dòng</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600 text-left text-xs">
                    <tr>
                      <th className="p-3 w-8">#</th>
                      <th className="p-3">Sản phẩm</th>
                      <th className="p-3 text-right">SL yêu cầu</th>
                      <th className="p-3 text-right">SL xuất</th>
                      <th className="p-3">Mã lô</th>
                      <th className="p-3 text-right">Đơn giá</th>
                      <th className="p-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(gin.items || []).filter(Boolean).map((ln, i) => {
                      const qty = Number(qtyDrafts[ln.id!] ?? ln.qtyRequested ?? 0)
                      const lineVal = ln.unitCost != null ? qty * ln.unitCost : null
                      const isExpanded = expandedLineId === ln.id
                      return (
                        <Fragment key={ln.id || `${ln.productId}-${i}`}>
                          <tr className="hover:bg-neutral-50/60">
                            <td className="p-3 text-neutral-400 tabular-nums">{i + 1}</td>
                            <td className="p-3">
                              <div className="font-medium text-neutral-800 text-sm">
                                {lineProductLabel(ln, productMap)}
                              </div>
                              <div className="text-[11px] font-mono text-neutral-400">
                                {lineProductCode(ln, productMap)}
                              </div>
                            </td>
                            <td className="p-3 text-right tabular-nums text-neutral-700">
                              {ln.qtyRequested ?? '—'}
                            </td>
                            <td className="p-3 text-right">
                              {canEditQty && ln.id ? (
                                <input
                                  type="number"
                                  min={0}
                                  step="any"
                                  aria-label={`SL xuất ${lineProductCode(ln, productMap)}`}
                                  className="w-24 border rounded px-2 py-1 text-sm tabular-nums text-right focus:ring-2 focus:ring-primary-400 outline-none"
                                  value={qtyDrafts[ln.id] ?? ''}
                                  onChange={(e) =>
                                    setQtyDrafts((d) => ({
                                      ...d,
                                      [ln.id!]: e.target.value,
                                    }))
                                  }
                                />
                              ) : (
                                <span className="tabular-nums">
                                  {isConfirmed ? (ln.qtyIssued ?? 0) : qty}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {canEditQty && ln.id ? (
                                <button
                                  type="button"
                                  className="text-xs text-primary-700 hover:underline font-mono"
                                  onClick={() =>
                                    setExpandedLineId(isExpanded ? null : ln.id!)
                                  }
                                >
                                  {batchDrafts[ln.id]
                                    ? `${batchDrafts[ln.id].slice(0, 12)}…`
                                    : 'Chọn lô FEFO'}
                                </button>
                              ) : (
                                <span className="font-mono text-xs">
                                  {ln.batchId?.slice(0, 12) || '—'}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right tabular-nums">
                              {formatVnd(ln.unitCost)}
                            </td>
                            <td className="p-3 text-right tabular-nums">
                              {formatVnd(lineVal ?? undefined)}
                            </td>
                          </tr>
                          {isExpanded && ln.id && canEditQty && (
                            <tr>
                              <td colSpan={7} className="p-3 bg-neutral-50/80">
                                <FefoSuggestPanel
                                  warehouseId={gin.warehouseId}
                                  productId={ln.productId}
                                  qty={qty}
                                  selectedBatchId={batchDrafts[ln.id]}
                                  onSelectBatch={(batchId) =>
                                    setBatchDrafts((d) => ({ ...d, [ln.id!]: batchId }))
                                  }
                                  onApplyFefo={(suggestions: FefoBatchSuggestion[]) => {
                                    const first = suggestions[0]
                                    if (first) {
                                      setBatchDrafts((d) => ({
                                        ...d,
                                        [ln.id!]: first.batchId,
                                      }))
                                    }
                                  }}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {isPending && (
              <p className="text-xs text-neutral-500">
                Hoặc duyệt qua{' '}
                <Link to="/approval/inbox" className="text-primary-700 hover:underline">
                  Hộp thư duyệt
                </Link>
                .
              </p>
            )}
          </>
        )}
      </WarehouseDetailShell>

      <ConfirmDialog
        isOpen={submitOpen}
        onClose={() => !submit.isPending && setSubmitOpen(false)}
        onConfirm={() =>
          gin && submit.mutate(gin.id, { onSettled: () => setSubmitOpen(false) })
        }
        title="Gửi duyệt phiếu xuất?"
        message={`Phiếu ${gin?.ginCode} chuyển sang Chờ duyệt.`}
        confirmText="Gửi duyệt"
        cancelText="Huỷ"
        variant="warning"
        isLoading={submit.isPending}
      />

      <ConfirmDialog
        isOpen={approveOpen}
        onClose={() => !approve.isPending && setApproveOpen(false)}
        onConfirm={() =>
          gin && approve.mutate(gin.id, { onSettled: () => setApproveOpen(false) })
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
        onConfirm={handleConfirm}
        title="Xác nhận xuất kho?"
        message={`Phiếu ${gin?.ginCode} sẽ chuyển sang Đã xuất và trừ stock.`}
        confirmText="Xác nhận xuất"
        cancelText="Huỷ"
        variant="warning"
        isLoading={confirm.isPending}
      />

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => !cancel.isPending && setCancelOpen(false)}
        onConfirm={() =>
          gin && cancel.mutate({ id: gin.id }, { onSettled: () => setCancelOpen(false) })
        }
        title="Huỷ phiếu xuất kho?"
        message="Chỉ huỷ khi chưa xác nhận xuất."
        confirmText="Huỷ phiếu"
        cancelText="Đóng"
        variant="danger"
        isLoading={cancel.isPending}
      />
    </>
  )
}
