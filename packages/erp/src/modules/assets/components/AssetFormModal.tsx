// ============================================================
// AssetFormModal — Tạo / Sửa tài sản
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { AppModal, Button } from '@frezo/ui'
import { toast } from 'sonner'
import { useCategories } from '@/modules/qtht/hooks/useCategory'
import { useCreateAsset, useUpdateAsset } from '../hooks/useAsset'
import type { AssetItem, AssetSavePayload } from '../services/assetApi'

interface Props {
  open: boolean
  editing?: AssetItem | null
  onClose: () => void
}

export function AssetFormModal({ open, editing, onClose }: Props) {
  const isEdit = !!editing
  const create = useCreateAsset()
  const update = useUpdateAsset()
  const { data: categoriesRaw } = useCategories('LoaiTaiSan')
  const categories = (Array.isArray(categoriesRaw) ? categoriesRaw : []) as any[]

  const [form, setForm] = useState<AssetSavePayload>(defaultForm())

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        code: editing.code,
        name: editing.name,
        categoryCode: editing.categoryCode,
        brand: editing.brand,
        model: editing.model,
        serialNumber: editing.serialNumber,
        purchaseDate: editing.purchaseDate,
        purchasePrice: editing.purchasePrice,
        currentValue: editing.currentValue,
        warrantyEndDate: editing.warrantyEndDate,
        status: editing.status,
        location: editing.location,
        imageUrl: editing.imageUrl,
        note: editing.note,
      })
    } else {
      setForm(defaultForm())
    }
  }, [open, editing])

  const setF = <K extends keyof AssetSavePayload>(k: K, v: AssetSavePayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!form.name || !form.name.trim()) e.name = 'Tên tài sản bắt buộc'
    if (!form.categoryCode) e.categoryCode = 'Chọn loại tài sản'
    if (form.purchasePrice != null && form.purchasePrice < 0) e.purchasePrice = 'Không hợp lệ'
    return e
  }, [form])

  const canSubmit = Object.keys(errors).length === 0 && !create.isPending && !update.isPending

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.warning('Vui lòng điền đủ thông tin bắt buộc')
      return
    }
    const payload: AssetSavePayload = {
      ...form,
      name: form.name!.trim(),
      // sanitize empty strings → null
      brand: form.brand?.trim() || null,
      model: form.model?.trim() || null,
      serialNumber: form.serialNumber?.trim() || null,
      location: form.location?.trim() || null,
      imageUrl: form.imageUrl?.trim() || null,
      note: form.note?.trim() || null,
    }
    if (isEdit && editing) {
      update.mutate({ id: editing.id, data: payload }, { onSuccess: () => onClose() })
    } else {
      create.mutate(payload, { onSuccess: () => onClose() })
    }
  }

  return (
    <AppModal isOpen={open} onClose={onClose} title={isEdit ? `Sửa: ${editing?.code}` : 'Thêm tài sản mới'} maxWidth="3xl">
      <div className="space-y-4">
        {/* Row 1: Code (read-only edit) + Name */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Mã tài sản">
            <input
              type="text"
              value={form.code || ''}
              onChange={(e) => setF('code', e.target.value.toUpperCase())}
              disabled={isEdit}
              placeholder="Tự sinh AS-YYYY-####"
              className={inputCls + ' font-mono'}
            />
            <div className="text-[11px] text-neutral-400 mt-1">Để trống → hệ thống tự sinh</div>
          </Field>
          <Field label="Tên tài sản *" error={errors.name} className="md:col-span-2">
            <input
              type="text"
              value={form.name || ''}
              onChange={(e) => setF('name', e.target.value)}
              placeholder="VD: MacBook Pro 14 M3"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Row 2: Category + Brand + Model */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Loại *" error={errors.categoryCode}>
            <select
              value={form.categoryCode || ''}
              onChange={(e) => setF('categoryCode', e.target.value || null)}
              className={inputCls}
            >
              <option value="">— Chọn loại —</option>
              {categories.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Hãng">
            <input
              type="text"
              value={form.brand || ''}
              onChange={(e) => setF('brand', e.target.value)}
              placeholder="Apple, Dell, Lenovo..."
              className={inputCls}
            />
          </Field>
          <Field label="Model">
            <input
              type="text"
              value={form.model || ''}
              onChange={(e) => setF('model', e.target.value)}
              placeholder="MBP14 M3 Pro"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Row 3: Serial + Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Serial / IMEI">
            <input
              type="text"
              value={form.serialNumber || ''}
              onChange={(e) => setF('serialNumber', e.target.value)}
              placeholder="C02XYZ001"
              className={inputCls + ' font-mono'}
            />
          </Field>
          <Field label="Vị trí lưu">
            <input
              type="text"
              value={form.location || ''}
              onChange={(e) => setF('location', e.target.value)}
              placeholder="Tầng 3, phòng Dev · Kho IT..."
              className={inputCls}
            />
          </Field>
        </div>

        {/* Row 4: Purchase date + price + warranty */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Ngày mua">
            <input
              type="date"
              value={form.purchaseDate || ''}
              onChange={(e) => setF('purchaseDate', e.target.value || null)}
              className={inputCls}
            />
          </Field>
          <Field label="Giá mua (VND)" error={errors.purchasePrice}>
            <input
              type="number"
              value={form.purchasePrice ?? ''}
              onChange={(e) => setF('purchasePrice', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="0"
              className={inputCls + ' tabular-nums'}
            />
          </Field>
          <Field label="Hết hạn bảo hành">
            <input
              type="date"
              value={form.warrantyEndDate || ''}
              onChange={(e) => setF('warrantyEndDate', e.target.value || null)}
              className={inputCls}
            />
          </Field>
        </div>

        {/* Note */}
        <Field label="Ghi chú">
          <textarea
            value={form.note || ''}
            onChange={(e) => setF('note', e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="VD: Máy chính cho lead BE — kèm sạc + túi Bellroy"
            className={inputCls + ' resize-none'}
          />
        </Field>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-1.5">
            {(create.isPending || update.isPending) && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Cập nhật' : 'Tạo tài sản'}
          </Button>
        </div>
      </div>
    </AppModal>
  )
}

// ============================================================
// Sub
// ============================================================

const inputCls =
  'w-full h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none'

function Field({
  label, error, children, className,
}: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold text-neutral-700 block mb-1.5">{label}</label>
      {children}
      {error && (
        <div className="text-[11px] text-rose-600 mt-1 inline-flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </div>
      )}
    </div>
  )
}

function defaultForm(): AssetSavePayload {
  return {
    code: '',
    name: '',
    categoryCode: null,
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: null,
    currentValue: null,
    warrantyEndDate: '',
    status: 'AVAILABLE',
    location: '',
    imageUrl: '',
    note: '',
  }
}
