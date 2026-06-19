import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Select } from '@/components/ui/Select'

export function AppForm({ schema, defaultValues, onSubmit, fields, submitText = 'Xác nhận', isLoading, onCancel, hideFooter, formId }: any) {
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues
  })

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.map((f: any) => (
          <div key={f.name} className="space-y-2">
            <Label>{f.label}{f.required ? <span className="text-red-500 ml-1">*</span> : null}</Label>
            {f.type === 'switch' ? (
              <SwitchField name={f.name} control={control} setValue={setValue} />
            ) : f.type === 'multiselect' ? (
              <MultiSelectField name={f.name} control={control} setValue={setValue} options={f.options || []} placeholder={f.placeholder} />
            ) : f.type === 'select' ? (
              <SelectField name={f.name} control={control} setValue={setValue} options={f.options || []} placeholder={f.placeholder || '-- Chọn --'} />
            ) : (
            <Input
              type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
              placeholder={f.placeholder}
              {...register(f.name, { valueAsNumber: f.type === 'number' })}
            />
            )}
            {errors[f.name] && <span className="text-xs text-red-500">{errors[f.name]?.message as string}</span>}
          </div>
        ))}
      </div>
      {!hideFooter && (
        <div className="flex justify-end gap-2 pt-6">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Hủy
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="bg-primary-600 hover:bg-primary-700 text-white">
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

