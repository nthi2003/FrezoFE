// ============================================================
// GinCreateModal — tạo PXK với bảng dòng hàng editable (chuẩn GRN)
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { AppModal, Button, Input, Label, Select, VndInput } from '@frezo/ui'
import { cn, parseVndInput } from '@frezo/utils'
import { GIN_ISSUE_TYPE_OPTIONS } from '../constants/warehouseStatus'
import type { GinCreateRequest } from '../services/ginApi'
import { formatVnd } from '../utils/grnGinUtils'
import { ProductCombobox } from './ProductCombobox'
import { WarehouseSelect } from './WarehouseSelect'

export interface GinLineDraft {
  key: string
  productId: string
  qty: string
  unitCost: string
}

export interface GinProductOption {
  id: string
  code?: string
  name?: string
  price?: number | null
}

export interface GinCreateModalProps {
  isOpen: boolean
  onClose: () => void
  warehouseOptions: Array<{ id: string; name?: string; code?: string }>
  products: GinProductOption[]
  productsError?: boolean
  productsLoading?: boolean
  defaultWarehouseId?: string
  onSubmit: (body: GinCreateRequest) => void
  isPending?: boolean
}

function newLine(): GinLineDraft {
  return { key: crypto.randomUUID(), productId: '', qty: '', unitCost: '' }
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="border-b border-neutral-200 pb-2.5 mb-4">
      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      {hint && <p className="text-xs text-neutral-500 mt-0.5">{hint}</p>}
    </div>
  )
}

function FormField({
  label,
  required,
  error,
  hint,
  children,
  htmlFor,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
      {!error && hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}

export function GinCreateModal({
  isOpen,
  onClose,
  warehouseOptions,
  products,
  productsError = false,
  productsLoading = false,
  defaultWarehouseId = '',
  onSubmit,
  isPending = false,
}: GinCreateModalProps) {
  const [warehouseId, setWarehouseId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [issueType, setIssueType] = useState('SALES')
  const [documentNo, setDocumentNo] = useState('')
  const [documentDate, setDocumentDate] = useState('')
  const [transferWarehouseId, setTransferWarehouseId] = useState('')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState<GinLineDraft[]>([newLine()])
  const [submitted, setSubmitted] = useState(false)

  const resetForm = useCallback(() => {
    setWarehouseId(defaultWarehouseId || warehouseOptions[0]?.id || '')
    setCustomerId('')
    setIssueType('SALES')
    setDocumentNo('')
    setDocumentDate('')
    setTransferWarehouseId('')
    setNote('')
    setLines([newLine()])
    setSubmitted(false)
  }, [defaultWarehouseId, warehouseOptions])

  useEffect(() => {
    if (isOpen) resetForm()
  }, [isOpen, resetForm])

  const productMap = useMemo(() => {
    const map = new Map<string, GinProductOption>()
    for (const p of products ?? []) {
      if (p?.id) map.set(p.id, p)
    }
    return map
  }, [products])

  const hasProductOptions = (products ?? []).some((p) => !!p?.id)
  const isTransfer = issueType === 'INTERNAL_TRANSFER'

  const selectProduct = (lineKey: string, productId: string) => {
    const prod = productId ? productMap.get(productId) : undefined
    setLines((prev) =>
      prev.map((ln) => {
        if (ln.key !== lineKey) return ln
        const next: GinLineDraft = { ...ln, productId }
        if (
          prod &&
          !ln.unitCost &&
          prod.price != null &&
          !Number.isNaN(Number(prod.price))
        ) {
          next.unitCost = String(prod.price)
        }
        return next
      }),
    )
  }

  const updateLine = (key: string, patch: Partial<GinLineDraft>) => {
    setLines((prev) => prev.map((ln) => (ln.key === key ? { ...ln, ...patch } : ln)))
  }

  const addLine = () => setLines((prev) => [...prev, newLine()])

  const removeLine = (key: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((ln) => ln.key !== key)))
  }

  const validLines = useMemo(
    () =>
      lines.filter(
        (ln) => ln.productId && Number(ln.qty) > 0 && !Number.isNaN(Number(ln.qty)),
      ),
    [lines],
  )

  const rowErrors = useMemo(() => {
    const errs: Record<string, string> = {}
    for (const ln of lines) {
      const hasAny = ln.productId || ln.qty || ln.unitCost
      if (!hasAny) continue
      if (!ln.productId) {
        errs[ln.key] = 'Chọn sản phẩm'
      } else if (!ln.qty || Number(ln.qty) <= 0 || Number.isNaN(Number(ln.qty))) {
        errs[ln.key] = 'Số lượng phải lớn hơn 0'
      }
    }
    return errs
  }, [lines])

  const warehouseError =
    !warehouseId && (submitted || validLines.length > 0)
      ? 'Chọn kho xuất'
      : undefined
  const transferError =
    isTransfer && !transferWarehouseId && submitted
      ? 'Chọn kho đích khi chuyển kho nội bộ'
      : undefined
  const linesError =
    submitted && validLines.length === 0 ? 'Thêm ít nhất một dòng hàng hợp lệ' : undefined

  const totals = useMemo(() => {
    let totalQty = 0
    let totalValue = 0
    for (const ln of validLines) {
      const qty = Number(ln.qty) || 0
      const cost = Number(ln.unitCost) || 0
      totalQty += qty
      totalValue += qty * cost
    }
    return { totalQty, totalValue, lineCount: validLines.length }
  }, [validLines])

  const isValid =
    Boolean(warehouseId) &&
    validLines.length > 0 &&
    Object.keys(rowErrors).length === 0 &&
    (!isTransfer || Boolean(transferWarehouseId))

  const handleSubmit = () => {
    setSubmitted(true)
    if (!isValid) return
    onSubmit({
      warehouseId,
      customerId: customerId.trim() || undefined,
      issueType: issueType || undefined,
      documentNo: documentNo.trim() || undefined,
      documentDate: documentDate || undefined,
      transferWarehouseId: isTransfer ? transferWarehouseId || undefined : undefined,
      note: note.trim() || undefined,
      items: validLines.map((ln) => ({
        productId: ln.productId,
        qtyRequested: Number(ln.qty),
        unitCost: ln.unitCost ? Number(ln.unitCost) : undefined,
      })),
    })
  }

  const issueTypeSelectOptions = GIN_ISSUE_TYPE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }))

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo phiếu xuất kho"
      description="Nhập thông tin chứng từ và thêm từng dòng hàng — sau khi lưu sẽ mở biên lai phiếu xuất."
      maxWidth="4xl"
    >
      <div className="space-y-6 pb-1">
        <section>
          <SectionHeader
            title="1. Thông tin chung"
            hint="Chọn kho xuất và loại xuất trước, rồi bổ sung chứng từ / khách nếu có."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Kho xuất" required error={warehouseError}>
              <WarehouseSelect
                warehouses={warehouseOptions ?? []}
                value={warehouseId}
                onChange={setWarehouseId}
                placeholder="— Chọn kho —"
                aria-invalid={Boolean(warehouseError)}
              />
            </FormField>

            <FormField label="Loại xuất">
              <Select
                options={issueTypeSelectOptions}
                value={issueType}
                onChange={setIssueType}
                showSearch={false}
                aria-label="Loại xuất"
              />
            </FormField>

            {isTransfer ? (
              <FormField label="Kho đích" required error={transferError}>
                <WarehouseSelect
                  warehouses={warehouseOptions ?? []}
                  value={transferWarehouseId}
                  onChange={setTransferWarehouseId}
                  placeholder="— Kho nhận —"
                  aria-invalid={Boolean(transferError)}
                />
              </FormField>
            ) : (
              <FormField label="Mã khách" hint="Tuỳ chọn">
                <Input
                  className="font-mono"
                  placeholder="KH003"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                />
              </FormField>
            )}

            <FormField label="Số chứng từ / HĐ xuất" hint="Tuỳ chọn">
              <Input
                placeholder="PX-2026-001"
                value={documentNo}
                onChange={(e) => setDocumentNo(e.target.value)}
              />
            </FormField>

            <FormField label="Ngày chứng từ">
              <Input
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />
            </FormField>

            <FormField label="Ghi chú" hint="Tuỳ chọn">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú nội bộ…"
              />
            </FormField>
          </div>
        </section>

        <section>
          <SectionHeader
            title="2. Dòng hàng"
            hint="Thêm từng sản phẩm — thành tiền tính tự động. Lô FEFO chọn ở màn chi tiết trước khi xác nhận xuất."
          />

          {productsError && (
            <p className="text-xs text-danger mb-3 -mt-1" role="alert">
              Không tải được danh sách sản phẩm. Kiểm tra quyền hoặc thử tải lại trang.
            </p>
          )}
          {!productsError && !productsLoading && !hasProductOptions && (
            <p className="text-xs text-amber-700 mb-3 -mt-1">
              Chưa có sản phẩm trong hệ thống — thêm sản phẩm ở module Sản phẩm trước khi tạo phiếu.
            </p>
          )}
          {productsLoading && !hasProductOptions && (
            <p className="text-xs text-neutral-500 mb-3 -mt-1">Đang tải danh sách sản phẩm…</p>
          )}

          {linesError && (
            <p className="text-xs text-danger mb-3 -mt-1">{linesError}</p>
          )}

          <div className="rounded-lg border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-neutral-50 text-left text-xs text-neutral-600">
                    <th className="px-3 py-2.5 font-medium w-[34%]">Mã SP</th>
                    <th className="px-3 py-2.5 font-medium w-[24%]">Tên SP</th>
                    <th className="px-3 py-2.5 font-medium w-[12%] text-right">SL</th>
                    <th className="px-3 py-2.5 font-medium w-[14%] text-right">Đơn giá</th>
                    <th className="px-3 py-2.5 font-medium w-[14%] text-right">Thành tiền</th>
                    <th className="px-2 py-2.5 w-10" aria-label="Xóa dòng" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {lines.map((ln) => {
                    const prod = ln.productId ? productMap.get(ln.productId) : undefined
                    const qty = Number(ln.qty) || 0
                    const cost = Number(ln.unitCost) || 0
                    const amount = qty * cost
                    const rowError =
                      submitted || ln.productId || ln.qty
                        ? rowErrors[ln.key]
                        : undefined

                    return (
                      <tr key={ln.key} className="align-top">
                        <td className="px-2 py-2">
                          <ProductCombobox
                            products={products ?? []}
                            value={ln.productId}
                            onChange={(v) => selectProduct(ln.key, v)}
                            placeholder={
                              productsError
                                ? 'Lỗi tải SP…'
                                : productsLoading
                                  ? 'Đang tải SP…'
                                  : !hasProductOptions
                                    ? 'Không có sản phẩm'
                                    : 'Tìm mã / tên SP…'
                            }
                            aria-invalid={Boolean(rowError && !ln.productId)}
                            aria-label="Mã sản phẩm"
                          />
                        </td>
                        <td className="px-3 py-3 text-neutral-600">
                          <span className="line-clamp-2 text-xs">
                            {prod?.name || (ln.productId ? '—' : '')}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            inputMode="decimal"
                            className={cn(
                              'text-right tabular-nums h-9',
                              rowError?.includes('Số lượng') && 'border-danger',
                            )}
                            value={ln.qty}
                            onChange={(e) => updateLine(ln.key, { qty: e.target.value })}
                            placeholder="0"
                            aria-invalid={Boolean(rowError?.includes('Số lượng'))}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <VndInput
                            className="text-right h-9"
                            value={parseVndInput(ln.unitCost)}
                            onChange={(n) =>
                              updateLine(ln.key, { unitCost: n == null ? '' : String(n) })
                            }
                            placeholder="0"
                          />
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-neutral-800 whitespace-nowrap">
                          {amount > 0 ? formatVnd(amount) : '—'}
                        </td>
                        <td className="px-1 py-2 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-neutral-400 hover:text-danger"
                            onClick={() => removeLine(ln.key)}
                            disabled={lines.length <= 1}
                            aria-label="Xóa dòng"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-50 border-t border-neutral-200">
                    <td colSpan={2} className="px-3 py-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={addLine}
                      >
                        <Plus size={14} /> Thêm dòng
                      </Button>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                      {totals.totalQty > 0 ? totals.totalQty : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-neutral-500">
                      Tổng
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-neutral-900">
                      {totals.totalValue > 0 ? formatVnd(totals.totalValue) : '—'}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {submitted && Object.keys(rowErrors).length > 0 && (
            <p className="text-xs text-danger mt-2">
              Kiểm tra các dòng chưa điền đủ sản phẩm hoặc số lượng.
            </p>
          )}
        </section>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-neutral-200">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {isPending ? 'Đang lưu…' : 'Lưu nháp'}
          </Button>
        </div>
      </div>
    </AppModal>
  )
}
