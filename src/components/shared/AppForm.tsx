import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function AppForm({ schema, defaultValues, onSubmit, fields, submitText = 'Xác nhận', isLoading, onCancel }: any) {
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.map((f: any) => (
          <div key={f.name} className="space-y-2">
            <Label>{f.label}{f.required ? <span className="text-red-500 ml-1">*</span> : null}</Label>
            {f.type === 'switch' ? (
              <SwitchField name={f.name} control={control} setValue={setValue} />
            ) : f.type === 'select' ? (
              <select
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register(f.name)}
              >
                <option value="">-- Chọn --</option>
                {(f.options || []).map((opt: any) => (
                  <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                    {typeof opt === 'string' ? opt : opt.label}
                  </option>
                ))}
              </select>
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
