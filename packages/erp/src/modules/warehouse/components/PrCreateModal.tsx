// ============================================================
// PrCreateModal — tạo yêu cầu mua hàng với bảng dòng + product combobox
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { AppModal, Button, Input, Label, Select } from '@frezo/ui'
import { cn } from '@frezo/utils'
import type { PurchaseRequestSaveRequest } from '../services/purchaseRequestApi'
import { ProductCombobox } from './ProductCombobox'
import { WarehouseSelect } from './WarehouseSelect'

export interface PrLineDraft {
  key: string
  productId: string
  qty: string
}

export interface PrProductOption {
  id: string
  code?: string
  name?: string
}

export interface PrCreateModalProps {
  isOpen: boolean
  onClose: () => void
  warehouseOptions: Array<{ id: string; name?: string; code?: string }>
  supplierOptions: Array<{ id: string; label: string }>
  products: PrProductOption[]
  productsError?: boolean
  productsLoading?: boolean
  defaultWarehouseId?: string
  defaultSupplierId?: string
  onSubmit: (body: PurchaseRequestSaveRequest) => void
  isPending?: boolean
}

function newLine(): PrLineDraft {
  return { key: crypto.randomUUID(), productId: '', qty: '' }
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
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
      {!error && hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}

export function PrCreateModal({
  isOpen,
  onClose,
  warehouseOptions,
  supplierOptions,
  products,
  productsError = false,
  productsLoading = false,
  defaultWarehouseId = '',
  defaultSupplierId = '',
  onSubmit,
  isPending = false,
}: PrCreateModalProps) {
  const [warehouseId, setWarehouseId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState<PrLineDraft[]>([newLine()])
  const [submitted, setSubmitted] = useState(false)

  const resetForm = useCallback(() => {
    setWarehouseId(defaultWarehouseId || warehouseOptions[0]?.id || '')
    setSupplierId(defaultSupplierId || '')
    setNote('')
    setLines([newLine()])
    setSubmitted(false)
  }, [defaultWarehouseId, defaultSupplierId, warehouseOptions])

  useEffect(() => {
    if (isOpen) resetForm()
  }, [isOpen, resetForm])

  const productMap = useMemo(() => {
    const map = new Map<string, PrProductOption>()
    for (const p of products ?? []) {
      if (p?.id) map.set(p.id, p)
    }
    return map
  }, [products])

  const hasProductOptions = (products ?? []).some((p) => !!p?.id)

  const supplierSelectOptions = useMemo(
    () =>
      (supplierOptions ?? []).map((s) => ({
        value: s.id,
        label: s.label,
      })),
    [supplierOptions],
  )

  const updateLine = (key: string, patch: Partial<PrLineDraft>) => {
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
      const hasAny = ln.productId || ln.qty
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
    !warehouseId && (submitted || validLines.length > 0) ? 'Chọn kho' : undefined
  const linesError =
    submitted && validLines.length === 0 ? 'Thêm ít nhất một dòng hàng hợp lệ' : undefined

  const totalQty = useMemo(
    () => validLines.reduce((sum, ln) => sum + (Number(ln.qty) || 0), 0),
    [validLines],
  )

  const isValid =
    Boolean(warehouseId) &&
    validLines.length > 0 &&
    Object.keys(rowErrors).length === 0

  const handleSubmit = () => {
    setSubmitted(true)
    if (!isValid) return
    onSubmit({
      warehouseId,
      supplierId: supplierId || undefined,
      note: note.trim() || undefined,
      lines: validLines.map((ln) => ({
        productId: ln.productId,
        warehouseId,
        qty: Number(ln.qty),
      })),
    })
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo yêu cầu mua hàng"
      description="Chọn kho, NCC (nếu có) và thêm từng dòng sản phẩm — không nhập CSV."
      maxWidth="4xl"
    >
      <div className="space-y-6 pb-1">
        <section>
          <SectionHeader
            title="1. Thông tin chung"
            hint="Một yêu cầu nên gom hàng cùng một nhà cung cấp."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Kho" required error={warehouseError}>
              <WarehouseSelect
                warehouses={warehouseOptions}
                value={warehouseId}
                onChange={setWarehouseId}
                placeholder="— Chọn kho —"
                aria-invalid={Boolean(warehouseError)}
              />
            </FormField>
            <FormField label="Nhà cung cấp" hint="Tuỳ chọn — gõ để tìm NCC">
              <Select
                options={supplierSelectOptions}
                value={supplierId}
                onChange={setSupplierId}
                placeholder="— Chọn NCC —"
                showClear
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
            hint="Chọn sản phẩm từ danh mục — nhập số lượng cần mua."
          />

          {productsError && (
            <p className="text-xs text-danger mb-3 -mt-1" role="alert">
              Không tải được danh sách sản phẩm. Kiểm tra quyền hoặc thử tải lại trang.
            </p>
          )}
          {!productsError && !productsLoading && !hasProductOptions && (
            <p className="text-xs text-amber-700 mb-3 -mt-1">
              Chưa có sản phẩm trong hệ thống — thêm sản phẩm ở module Sản phẩm trước.
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
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="bg-neutral-50 text-left text-xs text-neutral-600">
                    <th className="px-3 py-2.5 font-medium w-[40%]">Sản phẩm</th>
                    <th className="px-3 py-2.5 font-medium w-[36%]">Tên</th>
                    <th className="px-3 py-2.5 font-medium w-[16%] text-right">Số lượng</th>
                    <th className="px-2 py-2.5 w-10" aria-label="Xóa dòng" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {lines.map((ln) => {
                    const prod = ln.productId ? productMap.get(ln.productId) : undefined
                    const rowError =
                      submitted || ln.productId || ln.qty
                        ? rowErrors[ln.key]
                        : undefined
                    return (
                      <tr key={ln.key} className="align-top">
                        <td className="px-2 py-2">
                          <ProductCombobox
                            products={products}
                            value={ln.productId}
                            onChange={(v) => updateLine(ln.key, { productId: v })}
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
                            aria-label="Sản phẩm"
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
                      {totalQty > 0 ? totalQty : '—'}
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
