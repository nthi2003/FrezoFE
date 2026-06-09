import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AppForm({ schema, defaultValues, onSubmit, fields, submitText = 'Lưu', isLoading }: any) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {fields.map((f: any) => (
        <div key={f.name} className="space-y-2">
          <Label>{f.label}</Label>
          <Input type={f.type || 'text'} placeholder={f.placeholder} {...register(f.name, { valueAsNumber: f.type === 'number' })} />
          {errors[f.name] && <span className="text-xs text-red-500">{errors[f.name]?.message as string}</span>}
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading} className="bg-primary-600 hover:bg-primary-700 text-white">
          {isLoading ? 'Đang xử lý...' : submitText}
        </Button>
      </div>
    </form>
  )
}
