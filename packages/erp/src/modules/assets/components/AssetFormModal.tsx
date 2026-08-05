// ============================================================
// AssetFormModal — Tạo / Sửa tài sản
// ============================================================

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { FormGrid, FormModal, FormSection, Select, VndInput } from '@frezo/ui'
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
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!open) return
    setDirty(false)
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

  const setF = <K extends keyof AssetSavePayload>(k: K, v: AssetSavePayload[K]) => {
    setDirty(true)
    setForm((f) => ({ ...f, [k]: v }))
  }

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!form.name || !form.name.trim()) e.name = 'Tên tài sản bắt buộc'
    if (!form.categoryCode) e.categoryCode = 'Chọn loại tài sản'
    if (form.purchasePrice != null && form.purchasePrice < 0) e.purchasePrice = 'Không hợp lệ'
    return e
  }, [form])

  const isSubmitting = create.isPending || update.isPending
  const canSubmit = Object.keys(errors).length === 0 && !isSubmitting

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.warning('Vui lòng điền đủ thông tin bắt buộc')
      return
    }
    const payload: AssetSavePayload = {
      ...form,
      name: form.name!.trim(),
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
    <FormModal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? `Sửa: ${editing?.code}` : 'Thêm tài sản mới'}
      size="lg"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitDisabled={!canSubmit}
      submitText={isEdit ? 'Cập nhật' : 'Tạo tài sản'}
      dirty={dirty}
    >
      <div className="space-y-6">
        <FormSection title="Thông tin tài sản">
          <FormGrid cols={3}>
            <Field label="Mã tài sản">
              <input
                type="text"
                value={form.code || ''}
                onChange={(e) => setF('code', e.target.value.toUpperCase())}
                disabled={isEdit}
                placeholder="Tự sinh AS-YYYY-####"
                className={inputCls + ' font-mono'}
              />
              <div className="mt-1 text-[11px] text-neutral-400">Để trống → hệ thống tự sinh</div>
            </Field>
            <Field label="Tên tài sản" required error={errors.name} className="md:col-span-2">
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => setF('name', e.target.value)}
                placeholder="VD: MacBook Pro 14 M3"
                className={inputCls}
              />
            </Field>
            <Field label="Loại" required error={errors.categoryCode}>
              <Select
                options={[
                  { value: '', label: '— Chọn loại —' },
                  ...categories.map((c) => ({ value: c.code, label: c.name })),
                ]}
                value={form.categoryCode || ''}
                onChange={(v) => setF('categoryCode', v || null)}
                placeholder="— Chọn loại —"
                aria-label="Loại tài sản"
              />
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
          </FormGrid>
        </FormSection>

        <FormSection title="Vị trí & định danh">
          <FormGrid cols={2}>
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
          </FormGrid>
        </FormSection>

        <FormSection title="Mua sắm & bảo hành">
          <FormGrid cols={3}>
            <Field label="Ngày mua">
              <input
                type="date"
                value={form.purchaseDate || ''}
                onChange={(e) => setF('purchaseDate', e.target.value || null)}
                className={inputCls}
              />
            </Field>
            <Field label="Giá mua (VND)" error={errors.purchasePrice}>
              <VndInput
                value={form.purchasePrice}
                onChange={(n) => setF('purchasePrice', n ?? null)}
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
            <Field label="Ghi chú" className="md:col-span-2 xl:col-span-3">
              <textarea
                value={form.note || ''}
                onChange={(e) => setF('note', e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="VD: Máy chính cho lead BE — kèm sạc + túi Bellroy"
                className={inputCls + ' h-auto resize-none py-2'}
              />
            </Field>
          </FormGrid>
        </FormSection>
      </div>
    </FormModal>
  )
}

const inputCls =
  'w-full h-10 px-3 rounded-lg border border-border bg-white text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100'

function Field({
  label,
  required,
  error,
  children,
  className,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-neutral-700">
        {label}
        {required ? <span className="ml-1 text-danger">*</span> : null}
      </label>
      {children}
      {error && (
        <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-danger">
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
