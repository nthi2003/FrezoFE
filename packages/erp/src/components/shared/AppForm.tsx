import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  Button,
  Input,
  Textarea,
  Label,
  Switch,
  MultiSelect,
  Select,
  RichTextEditor,
  ImageUploader,
} from '@frezo/ui'
import { uploadImage } from '@/lib/upload'

/**
 * AppForm — form CRUD chuẩn Frezo.
 *
 * Mỗi field: { name, label, type?, options?, placeholder?, required?, colSpan?, rows?, description? }
 * - `type`: 'text' (default) | 'number' | 'date' | 'textarea' | 'select' | 'multiselect' | 'switch'
 *            | 'richtext' | 'image'
 * - `colSpan`: 1 | 2 | 3 — span bao nhiêu cột trong grid 3-col (mặc định 1). VD `colSpan: 3` = full-width.
 * - `rows`: chiều cao textarea (mặc định 4). Chỉ dùng khi `type = 'textarea'`.
 * - `description`: text mô tả nhỏ dưới field (hint).
 * - `richtext` extra: `minHeight` (default 320), `placeholder`.
 * - `image` extra: `aspectRatio` (VD '16/9'), `onUpload?`, `folder?`, `hint`, `maxSizeMB`.
 *    Nếu không truyền `onUpload`, dùng generic `uploadImage` (endpoint chung MinIO)
 *    với `folder` để phân namespace (VD 'products', 'articles').
 */
export function AppForm({
  schema,
  defaultValues,
  onSubmit,
  fields,
  submitText = 'Xác nhận',
  isLoading,
  onCancel,
  hideFooter,
  formId,
}: any) {
  const sanitized = defaultValues
    ? Object.fromEntries(
        Object.entries(defaultValues).map(([k, v]) => [k, v ?? undefined]),
      )
    : defaultValues
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: sanitized,
  })

  const colSpanClass = (span?: number) => {
    switch (span) {
      case 3:
        return 'md:col-span-3'
      case 2:
        return 'md:col-span-2'
      default:
        return ''
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.map((f: any) => (
          <div
            key={f.name}
            className={`space-y-1.5 ${colSpanClass(f.colSpan)}`}
          >
            <Label
              htmlFor={f.name}
              className="text-sm font-medium text-neutral-700"
            >
              {f.label}
              {f.required ? <span className="ml-1 text-danger">*</span> : null}
            </Label>
            {f.type === 'switch' ? (
              <SwitchField name={f.name} control={control} setValue={setValue} />
            ) : f.type === 'multiselect' ? (
              <MultiSelectField
                name={f.name}
                control={control}
                setValue={setValue}
                options={f.options || []}
                placeholder={f.placeholder}
              />
            ) : f.type === 'select' ? (
              <SelectField
                name={f.name}
                control={control}
                setValue={setValue}
                options={f.options || []}
                placeholder={f.placeholder || '-- Chọn --'}
              />
            ) : f.type === 'textarea' ? (
              <Textarea
                id={f.name}
                rows={f.rows || 4}
                placeholder={f.placeholder}
                aria-invalid={errors[f.name] ? true : undefined}
                {...register(f.name)}
              />
            ) : f.type === 'richtext' ? (
              <RichTextField
                name={f.name}
                control={control}
                setValue={setValue}
                placeholder={f.placeholder}
                minHeight={f.minHeight ?? 320}
                onRequestImage={f.onRequestImage}
              />
            ) : f.type === 'image' ? (
              <ImageField
                name={f.name}
                control={control}
                setValue={setValue}
                hint={f.hint}
                aspectRatio={f.aspectRatio}
                maxSizeMB={f.maxSizeMB}
                onUpload={f.onUpload}
                folder={f.folder}
              />
            ) : (
              <Input
                id={f.name}
                type={
                  f.type === 'number'
                    ? 'number'
                    : f.type === 'date'
                      ? 'date'
                      : f.type === 'email'
                        ? 'email'
                        : f.type === 'url'
                          ? 'url'
                          : 'text'
                }
                placeholder={f.placeholder}
                aria-invalid={errors[f.name] ? true : undefined}
                {...register(f.name, { valueAsNumber: f.type === 'number' })}
              />
            )}
            {f.description && !errors[f.name] && (
              <p className="text-xs text-neutral-500">{f.description}</p>
            )}
            {errors[f.name] && (
              <span className="text-xs text-danger">
                {errors[f.name]?.message as string}
              </span>
            )}
          </div>
        ))}
      </div>
      {!hideFooter && (
        <div className="flex justify-end gap-2 pt-6">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Hủy
            </Button>
          )}
          <Button type="submit" variant="default" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? 'Đang xử lý...' : submitText}
          </Button>
        </div>
      )}
    </form>
  )
}

function SwitchField({ name, control, setValue }: any) {
  const value = useWatch({ control, name })
  return (
    <div className="flex items-center gap-3 pt-1">
      <Switch
        checked={!!value}
        onChange={(v) => setValue(name, v, { shouldValidate: true })}
      />
      <span className="text-sm text-neutral-500">{value ? 'Bật' : 'Tắt'}</span>
    </div>
  )
}

function SelectField({ name, control, setValue, options, placeholder }: any) {
  const value = String(useWatch({ control, name }) ?? '')
  return (
    <Select
      options={options}
      value={value}
      onChange={(v) => setValue(name, v, { shouldValidate: true })}
      placeholder={placeholder}
    />
  )
}

function MultiSelectField({ name, control, setValue, options, placeholder }: any) {
  const value = useWatch({ control, name })
  const safeValue = (Array.isArray(value) ? value : []) as string[]
  return (
    <MultiSelect
      options={options}
      value={safeValue}
      onChange={(v) => setValue(name, v, { shouldValidate: true })}
      placeholder={placeholder}
    />
  )
}

function RichTextField({ name, control, setValue, placeholder, minHeight, onRequestImage }: any) {
  const raw = useWatch({ control, name })
  const value = typeof raw === 'string' ? raw : ''
  return (
    <RichTextEditor
      value={value}
      onChange={(html) => setValue(name, html, { shouldValidate: true, shouldDirty: true })}
      placeholder={placeholder}
      minHeight={minHeight}
      onRequestImage={onRequestImage}
    />
  )
}

function ImageField({ name, control, setValue, hint, aspectRatio, maxSizeMB, onUpload, folder }: any) {
  const raw = useWatch({ control, name })
  const value = typeof raw === 'string' ? raw : ''
  const uploader = onUpload || ((file: File) => uploadImage(file, { folder, maxSizeMB }))
  return (
    <ImageUploader
      value={value}
      onChange={(url) => setValue(name, url, { shouldValidate: true, shouldDirty: true })}
      hint={hint}
      aspectRatio={aspectRatio}
      maxSizeMB={maxSizeMB}
      onUpload={uploader}
    />
  )
}
