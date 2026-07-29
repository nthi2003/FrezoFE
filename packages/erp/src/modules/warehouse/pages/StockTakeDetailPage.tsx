// ============================================================
// StockTakeDetailPage — object page: pipeline + đếm + post variance
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ClipboardCheck,
  Loader2,
  Play,
  Send,
  Scale,
} from 'lucide-react'
import {
  Button,
  PageHeader,
  EmptyState,
  ErrorState,
  ConfirmDialog,
  StatCard,
} from '@frezo/ui'
import { useWarehouses } from '../hooks/useReorderRules'
import { useProducts } from '@/modules/products/hooks/useProduct'
import {
  useStockTake,
  useStartStockTake,
  useSubmitCounted,
  usePostVariance,
} from '../hooks/useStockTake'
import {
  StatusPipelineStepper,
  STOCK_TAKE_PIPELINE,
  stockTakeStepIndex,
} from '../components/StatusPipelineStepper'
import { StockTakeStatusBadge } from '../components/StockTakeStatusBadge'
import {
  computeLineStats,
  formatVariance,
  varianceClass,
} from '../utils/stockTakeUtils'

export function StockTakeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: st, isLoading, isError, refetch, isFetching } = useStockTake(id)
  const { data: warehouses = [] } = useWarehouses()
  const { data: productsRaw } = useProducts()
  const start = useStartStockTake()
  const submit = useSubmitCounted()
  const postVar = usePostVariance()

  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [confirmStart, setConfirmStart] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [confirmPost, setConfirmPost] = useState(false)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const warehouseName = useMemo(() => {
    const w = (warehouses as { id: string; name?: string }[]).find(
      (x) => x.id === st?.warehouseId,
    )
    return w?.name || st?.warehouseId || '—'
  }, [warehouses, st?.warehouseId])

  const productMap = useMemo(() => {
    const list = productsRaw as Array<{ id: string; code?: string; name?: string }> | undefined
    const map = new Map<string, { code?: string; name?: string }>()
    for (const p of Array.isArray(list) ? list : []) {
      map.set(p.id, { code: p.code, name: p.name })
    }
    return map
  }, [productsRaw])

  useEffect(() => {
    if (!st?.lines) return
    const init: Record<string, string> = {}
    for (const ln of st.lines) {
      const key = ln.id || ln.productId
      init[key] = ln.countedQty != null ? String(ln.countedQty) : ''
    }
    setDrafts(init)
    inputRefs.current = []
  }, [st?.id, st?.lines])

  const status = (st?.status || '').toUpperCase()
  const canStart = status === 'DRAFT'
  const canCount = status === 'IN_PROGRESS' || status === 'DRAFT'
  const canPost = status === 'SUBMITTED'
  const lineStats = computeLineStats(st?.lines || [])
  const editableLineKeys = useMemo(
    () =>
      (st?.lines || [])
        .map((ln) => ln.id || ln.productId)
        .filter(Boolean),
    [st?.lines],
  )

  const handleSubmitCounted = useCallback(() => {
    if (!st) return
    const lines = (st.lines || []).map((ln) => {
      const key = ln.id || ln.productId
      return {
        id: ln.id,
        productId: ln.productId,
        countedQty: Number(drafts[key] ?? 0),
      }
    })
    submit.mutate(
      { id: st.id, lines },
      { onSettled: () => setConfirmSubmit(false) },
    )
  }, [st, drafts, submit])

  const focusInput = (index: number) => {
    const el = inputRefs.current[index]
    if (el) {
      el.focus()
      el.select()
    }
  }

  const onCountKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault()
      focusInput(index + 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusInput(index - 1)
    } else if (e.key === 'Tab' && !e.shiftKey && index === editableLineKeys.length - 1) {
      // default tab behavior
    }
  }

  if (!id) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Thiếu ID phiếu"
        description="/warehouse/stock-takes/:id"
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

  if (isError || !st) {
    return (
      <div className="p-6 space-y-4">
        <ErrorState
          title="Không tải được phiếu kiểm kê"
          message="Kiểm tra /warehouse/stock-takes/:id hoặc thử lại."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => nav('/warehouse/stock-takes')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  const nextCta =
    canStart
      ? {
          label: 'Bước kế: Bắt đầu đếm',
          onClick: () => setConfirmStart(true),
          disabled: start.isPending,
          loading: start.isPending,
        }
      : canCount && status === 'IN_PROGRESS'
        ? {
            label: 'Bước kế: Gửi số đếm',
            onClick: () => setConfirmSubmit(true),
            disabled: submit.isPending,
            loading: submit.isPending,
          }
        : canPost
          ? {
              label: 'Bước kế: Điều chỉnh tồn',
              onClick: () => setConfirmPost(true),
              disabled: postVar.isPending,
              loading: postVar.isPending,
            }
          : null

  return (
    <div className="pb-8 animate-fade-in">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-neutral-50/95 backdrop-blur border-b border-neutral-200/80 px-6 py-4 space-y-3">
        <PageHeader
          title={st.code || st.id}
          description={
            <>
              {warehouseName}
              {' · '}
              <StockTakeStatusBadge status={st.status} />
              {st.takeDate ? ` · ${st.takeDate}` : ''}
            </>
          }
          actions={
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                variant="outline"
                className="gap-1"
                onClick={() => nav('/warehouse/stock-takes')}
              >
                <ArrowLeft size={14} /> Danh sách
              </Button>
              {canStart && (
                <Button
                  className="gap-1"
                  disabled={start.isPending}
                  onClick={() => setConfirmStart(true)}
                >
                  <Play size={14} /> Bắt đầu đếm
                </Button>
              )}
              {canCount && status === 'IN_PROGRESS' && (
                <Button
                  variant="outline"
                  className="gap-1"
                  disabled={submit.isPending}
                  onClick={() => setConfirmSubmit(true)}
                >
                  <Send size={14} /> Gửi số đếm
                </Button>
              )}
              {canPost && (
                <Button
                  className="gap-1"
                  disabled={postVar.isPending}
                  onClick={() => setConfirmPost(true)}
                >
                  <Scale size={14} /> Điều chỉnh tồn
                </Button>
              )}
            </div>
          }
        />

        <StatusPipelineStepper
          steps={STOCK_TAKE_PIPELINE}
          currentIndex={stockTakeStepIndex(st.status)}
          nextCta={nextCta}
        />
      </div>

      <div className="px-6 pt-4 space-y-4 max-w-5xl">
        {st.note && (
          <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
            <span className="text-neutral-500">Ghi chú: </span>
            {st.note}
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Tổng dòng" value={lineStats.totalLines} />
          <StatCard label="Khớp" value={lineStats.matched} />
          <StatCard label="Thừa (+)" value={lineStats.surplus} />
          <StatCard label="Thiếu (−)" value={lineStats.shortage} />
          <StatCard
            label="Net lệch"
            value={formatVariance(lineStats.netVariance)}
          />
        </div>

        {canCount && status === 'IN_PROGRESS' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Nhập số lượng đếm thực tế. Dùng Tab hoặc Enter để chuyển dòng nhanh.
          </div>
        )}

        {canPost && lineStats.surplus + lineStats.shortage > 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Phiếu đã gửi — bấm <strong>Điều chỉnh tồn</strong> để ghi nhận{' '}
            {lineStats.surplus + lineStats.shortage} dòng chênh lệch.
          </div>
        )}

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-4 py-2 text-xs text-neutral-500 border-b bg-neutral-50/80">
            {st.lines?.length ?? 0} dòng hàng
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-left text-xs">
                <tr>
                  <th className="p-3 w-8">#</th>
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3 text-right">SL hệ thống</th>
                  <th className="p-3 text-right">SL đếm</th>
                  <th className="p-3 text-right">Chênh lệch</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(st.lines || []).map((ln, i) => {
                  const key = ln.id || ln.productId
                  const prod = productMap.get(ln.productId)
                  const draftVal = drafts[key] ?? ''
                  const previewVariance =
                    canCount && draftVal !== ''
                      ? Number(draftVal) - Number(ln.systemQty ?? 0)
                      : ln.varianceQty

                  return (
                    <tr
                      key={key}
                      className={
                        previewVariance != null && previewVariance !== 0
                          ? 'bg-amber-50/40'
                          : 'hover:bg-neutral-50/60'
                      }
                    >
                      <td className="p-3 text-neutral-400 tabular-nums">{i + 1}</td>
                      <td className="p-3">
                        <div className="font-medium text-neutral-800 text-sm">
                          {prod?.name || '—'}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400">
                          {prod?.code || ln.productId}
                        </div>
                      </td>
                      <td className="p-3 text-right tabular-nums text-neutral-700">
                        {ln.systemQty ?? '—'}
                      </td>
                      <td className="p-3 text-right">
                        {canCount ? (
                          <input
                            ref={(el) => {
                              inputRefs.current[i] = el
                            }}
                            type="number"
                            min={0}
                            step="any"
                            aria-label={`Số lượng đếm ${prod?.code || ln.productId}`}
                            className="w-24 border rounded px-2 py-1 text-sm tabular-nums text-right focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
                            value={draftVal}
                            onChange={(e) =>
                              setDrafts((d) => ({ ...d, [key]: e.target.value }))
                            }
                            onKeyDown={(e) => onCountKeyDown(e, i)}
                          />
                        ) : (
                          <span className="tabular-nums">{ln.countedQty ?? '—'}</span>
                        )}
                      </td>
                      <td
                        className={`p-3 text-right tabular-nums font-medium ${varianceClass(previewVariance)}`}
                      >
                        {formatVariance(previewVariance)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmStart}
        onClose={() => {
          if (!start.isPending) setConfirmStart(false)
        }}
        onConfirm={() => {
          start.mutate(st.id, { onSettled: () => setConfirmStart(false) })
        }}
        title="Bắt đầu kiểm kê?"
        message={`Phiếu ${st.code || st.id} chuyển Nháp → Đang đếm. SL hệ thống được chốt tại thời điểm này.`}
        confirmText="Bắt đầu đếm"
        cancelText="Huỷ"
        variant="warning"
        isLoading={start.isPending}
      />

      <ConfirmDialog
        isOpen={confirmSubmit}
        onClose={() => {
          if (!submit.isPending) setConfirmSubmit(false)
        }}
        onConfirm={handleSubmitCounted}
        title="Gửi số lượng đếm?"
        message="Hệ thống tính chênh lệch và chuyển phiếu sang trạng thái Đã gửi."
        confirmText="Gửi số đếm"
        cancelText="Huỷ"
        variant="warning"
        isLoading={submit.isPending}
      />

      <ConfirmDialog
        isOpen={confirmPost}
        onClose={() => {
          if (!postVar.isPending) setConfirmPost(false)
        }}
        onConfirm={() => {
          postVar.mutate(st.id, { onSettled: () => setConfirmPost(false) })
        }}
        title="Điều chỉnh tồn kho?"
        message={`Ghi nhận chênh lệch cho ${lineStats.surplus + lineStats.shortage} dòng (net ${formatVariance(lineStats.netVariance)}). Phiếu chuyển Hoàn tất.`}
        confirmText="Điều chỉnh tồn"
        cancelText="Huỷ"
        variant="warning"
        isLoading={postVar.isPending}
      />
    </div>
  )
}
