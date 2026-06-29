import { useEffect } from 'react'
import { LayoutTemplate, Loader2 } from 'lucide-react'
import { Button } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { Label } from '@frezo/ui'
import { useForm } from 'react-hook-form'
import { useLandingConfig, useUpdateLandingConfig } from '../hooks/useLandingConfig'

export function LandingConfigPage() {
  const { data, isLoading } = useLandingConfig()
  const updateReq = useUpdateLandingConfig()

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      title: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      facebookUrl: '',
      bannerImageUrl: ''
    }
  })

  useEffect(() => {
    if (data) {
      reset(data)
    }
  }, [data, reset])

  const onSubmit = (formData: any) => {
    updateReq.mutate(formData)
  }

  return (
    <div className="space-y-4 animate-fade-in p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <LayoutTemplate className="text-primary-600" />
          Cấu hình Landing Page
        </h2>
        <p className="text-sm text-neutral-500 mt-1">Tùy chỉnh nội dung hiển thị ở trang giới thiệu công ty</p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6 max-w-3xl shadow-sm">
        {isLoading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary-600" /></div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tiêu đề trang (Title)</Label>
                <Input {...register('title')} placeholder="VD: Frezo ERP - Quản trị toàn diện" />
              </div>
              <div className="space-y-2">
                <Label>Mô tả ngắn (Description)</Label>
                <Input {...register('description')} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email liên hệ</Label>
                  <Input {...register('contactEmail')} />
                </div>
                <div className="space-y-2">
                  <Label>SĐT Hotline</Label>
                  <Input {...register('contactPhone')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Link Fanpage Facebook</Label>
                <Input {...register('facebookUrl')} />
              </div>
              <div className="space-y-2">
                <Label>URL Ảnh Banner</Label>
                <Input {...register('bannerImageUrl')} placeholder="https://..." />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200">
              <Button type="submit" disabled={updateReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white min-w-[120px]">
                {updateReq.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : 'Lưu cấu hình'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
