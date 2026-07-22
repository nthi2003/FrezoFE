import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Upload, Loader2, Award, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  AppModal, Button, Input, Textarea, Label, Select,
} from '@frezo/ui'
import { useQuery } from '@tanstack/react-query'
import { categoryApi } from '@/modules/qtht/services/categoryApi'
import { nccApi } from '@/modules/customers/services/customerApi'
import { nccFormSchema, type NccFormValues } from '../constants/ncc.schema'
import { NCC_CLASSIFICATION_TYPE } from '../constants/ncc.guide'

interface Props {
  isOpen: boolean
  ncc: any | null
  onClose: () => void
  onSubmit: (values: NccFormValues) => void
  isSubmitting: boolean
}

const CERTIFICATE_TYPES = [
  { value: 'VietGAP', label: 'VietGAP' },
  { value: 'GlobalGAP', label: 'GlobalGAP' },
  { value: 'HACCP', label: 'HACCP' },
  { value: 'ISO22000', label: 'ISO 22000' },
  { value: 'Organic', label: 'Hữu cơ (Organic)' },
  { value: 'Other', label: 'Khác' },
]

export function NccFormModal({ isOpen, ncc, onClose, onSubmit, isSubmitting }: Props) {
  const isEdit = !!ncc?.id

  const { data: classificationsData } = useQuery({
    queryKey: ['categories', NCC_CLASSIFICATION_TYPE],
    queryFn: () => categoryApi.getAll({ type: NCC_CLASSIFICATION_TYPE }),
    select: (res: any) => res?.data?.items ?? [],
  })
  const classifications = Array.isArray(classificationsData) ? classificationsData : []
  const classOptions = classifications.map((c: any) => ({ value: c.code || c.value, label: c.name || c.label }))

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NccFormValues>({
    resolver: zodResolver(nccFormSchema),
    defaultValues: getDefaults(ncc),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'certificates' })

  useEffect(() => {
    reset(getDefaults(ncc))
  }, [ncc, reset])

  const classCode = watch('classificationCode')

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
      description={
        isEdit
          ? 'Cập nhật thông tin, năng lực và chứng chỉ của NCC.'
          : 'Điền thông tin cơ bản. Có thể bổ sung chứng chỉ và năng lực sau.'
      }
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ==================== Section 1: Basic ==================== */}
        <FormSection
          title="Thông tin cơ bản"
          description="Tên, mã và người đại diện — bắt buộc cho mọi NCC"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Tên nhà cung cấp" required error={errors.name?.message}>
              <Input placeholder="VD: HTX Rau sạch Đà Lạt" {...register('name')} />
            </Field>
            <Field
              label="Mã NCC"
              hint={isEdit ? 'Không đổi được sau khi tạo' : 'Để trống để tự sinh (NCC001...)'}
            >
              <Input
                placeholder="VD: NCC001"
                {...register('code')}
                disabled={isEdit}
                className={isEdit ? 'bg-neutral-50' : ''}
              />
            </Field>
            <Field label="Phân loại">
              <Select
                options={classOptions}
                value={classCode || ''}
                onChange={(v) => setValue('classificationCode', v || '', { shouldValidate: true })}
                placeholder="-- Chọn phân loại --"
              />
            </Field>
            <Field label="Người đại diện">
              <Input placeholder="VD: Nguyễn Văn A" {...register('representative')} />
            </Field>
            <Field label="Số điện thoại">
              <Input placeholder="0912345678" {...register('phone')} />
            </Field>
            <div />
            <Field label="Địa chỉ" colSpan={3}>
              <Input placeholder="Địa chỉ đầy đủ..." {...register('address')} />
            </Field>
          </div>
        </FormSection>

        {/* ==================== Section 2: Capacity ==================== */}
        <FormSection
          title="Năng lực sản xuất"
          description="Số liệu để dự báo nguồn cung khi lập kế hoạch thu mua"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Diện tích canh tác (ha)"
              error={errors.growingArea?.message}
              hint="Đơn vị: hecta"
            >
              <Input
                type="number"
                step="0.01"
                min={0}
                placeholder="VD: 2.5"
                {...register('growingArea', { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Sản lượng tối đa (kg / tháng)"
              error={errors.maxCapacity?.message}
              hint="Ước lượng theo cao điểm mùa vụ"
            >
              <Input
                type="number"
                step="1"
                min={0}
                placeholder="VD: 5000"
                {...register('maxCapacity', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Điểm mạnh" colSpan={2} hint="Ví dụ: giao đúng hẹn, chất lượng đồng đều, ưu tiên khi có đơn gấp...">
              <Textarea
                rows={3}
                placeholder="Mô tả điểm mạnh, ghi chú thu mua..."
                {...register('strengths')}
              />
            </Field>
          </div>
        </FormSection>

        {/* ==================== Section 3: Certificates ==================== */}
        <FormSection
          title={`Chứng chỉ (${fields.length})`}
          description="Đính kèm VietGAP/GlobalGAP/HACCP... — file scan sẽ được lưu MinIO"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  certificateType: 'VietGAP',
                  fileUrl: '',
                  expiryDate: '',
                })
              }
              className="gap-1"
            >
              <Plus size={13} /> Thêm chứng chỉ
            </Button>
          }
        >
          {fields.length === 0 ? (
            <div className="py-6 text-center border-2 border-dashed border-neutral-200 rounded-xl">
              <Award className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-500">Chưa có chứng chỉ nào</p>
              <p className="text-xs text-neutral-400 mt-1">
                Bấm "Thêm chứng chỉ" để đính kèm VietGAP/HACCP...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((f, i) => (
                <CertificateFormRow
                  key={f.id}
                  index={i}
                  nccCode={watch('code') || 'temp'}
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  watch={watch}
                  onRemove={() => remove(i)}
                />
              ))}
            </div>
          )}
        </FormSection>

        {/* ==================== Footer ==================== */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100 sticky bottom-0 bg-white -mx-6 px-6 -mb-6 pb-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Huỷ
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary-600 hover:bg-primary-700 text-white gap-1 min-w-[140px] justify-center"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isSubmitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo NCC'}
          </Button>
        </div>
      </form>
    </AppModal>
  )
}

// ============================================================
// Certificate row
// ============================================================

function CertificateFormRow({
  index,
  nccCode,
  register,
  errors,
  setValue,
  watch,
  onRemove,
}: any) {
  const [uploading, setUploading] = useState(false)
  const fileUrl = watch(`certificates.${index}.fileUrl`)
  const certType = watch(`certificates.${index}.certificateType`)

  const handleFile = async (file: File) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File tối đa 10MB')
      return
    }
    setUploading(true)
    try {
      const res: any = await nccApi.uploadCertificate(nccCode, file)
      const url = res?.data ?? res
      if (typeof url === 'string' && url) {
        setValue(`certificates.${index}.fileUrl`, url, { shouldValidate: true, shouldDirty: true })
        toast.success('Đã upload file')
      } else {
        toast.error('Upload thất bại')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Lỗi upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-3 border border-neutral-200 rounded-xl bg-neutral-50/40 space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <Field
          label="Loại chứng chỉ"
          required
          error={errors?.certificates?.[index]?.certificateType?.message}
        >
          <Select
            options={CERTIFICATE_TYPES}
            value={certType || 'VietGAP'}
            onChange={(v) =>
              setValue(`certificates.${index}.certificateType`, v || 'VietGAP', {
                shouldValidate: true,
              })
            }
          />
        </Field>
        <Field label="Ngày hết hạn">
          <Input type="date" {...register(`certificates.${index}.expiryDate`)} />
        </Field>
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
          title="Xoá chứng chỉ này"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* File upload */}
      <div>
        <Label className="text-xs font-medium text-neutral-600 mb-1 block">File scan</Label>
        {fileUrl ? (
          <div className="flex items-center gap-2 p-2 bg-white border border-emerald-200 rounded-lg text-sm">
            <Award size={14} className="text-emerald-600" />
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary-600 hover:underline truncate flex-1"
            >
              {fileUrl.split('/').pop()}
            </a>
            <button
              type="button"
              onClick={() => setValue(`certificates.${index}.fileUrl`, '', { shouldValidate: true })}
              className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 p-3 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors text-sm">
            {uploading ? (
              <Loader2 size={14} className="animate-spin text-primary-500" />
            ) : (
              <Upload size={14} className="text-neutral-400" />
            )}
            <span className="text-neutral-500">
              {uploading ? 'Đang upload...' : 'Chọn file PDF/hình để upload'}
            </span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,image/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </label>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Layout helpers
// ============================================================

function FormSection({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-3 pb-2 border-b border-neutral-100">
        <div>
          <h3 className="text-sm font-bold text-neutral-800">{title}</h3>
          {description && (
            <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  required,
  error,
  hint,
  colSpan,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  colSpan?: number
  children: React.ReactNode
}) {
  const spanCls = colSpan === 2 ? 'md:col-span-2' : colSpan === 3 ? 'md:col-span-3' : ''
  return (
    <div className={`space-y-1.5 ${spanCls}`}>
      <Label className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-[11px] text-neutral-500">{hint}</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

function getDefaults(ncc: any | null): NccFormValues {
  if (!ncc) {
    return {
      name: '',
      code: '',
      representative: '',
      phone: '',
      address: '',
      classificationCode: '',
      growingArea: null,
      maxCapacity: null,
      strengths: '',
      certificates: [],
    }
  }
  return {
    name: ncc.name || '',
    code: ncc.code || '',
    representative: ncc.representative || '',
    phone: ncc.phone || '',
    address: ncc.address || '',
    classificationCode: ncc.classificationCode || '',
    growingArea: ncc.growingArea ?? null,
    maxCapacity: ncc.maxCapacity ?? null,
    strengths: ncc.strengths || '',
    certificates: Array.isArray(ncc.certificates) ? ncc.certificates : [],
  }
}
