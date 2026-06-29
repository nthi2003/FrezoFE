import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, ChevronLeft, Send, Loader2, Eye, Upload } from 'lucide-react'
import { Button, Input, Label, Select } from '@frezo/ui'
import { TiptapEditor } from '@/components/shared/TiptapEditor'
import { ImageUploadModal } from '@/components/shared/ImageUploadModal'
import { useCreateArticle } from '@/modules/articles/hooks/useArticle'
import { toast } from 'sonner'
import { cn } from '@frezo/utils'

const TYPE_OPTIONS = [
  { value: 'news', label: 'Tin tức' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'blog', label: 'Blog' },
  { value: 'promotion', label: 'Khuyến mãi' },
  { value: 'recruitment', label: 'Tuyển dụng' },
]

export function NewsCreatePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState('news')
  const [tags, setTags] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createReq = useCreateArticle()

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Tiêu đề không được để trống'
    if (!content.trim()) errs.content = 'Nội dung không được để trống'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) setStep(2)
  }

  const handleSubmit = () => {
    createReq.mutate(
      { title, summary, content, type, tags, thumbnailUrl, status: 'PENDING' },
      { onSuccess: () => navigate('/qtht/tin-tuc') }
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/qtht/tin-tuc')} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tạo bài viết mới</h1>
          <p className="text-sm text-neutral-500">Soạn thảo nội dung và gửi lên phê duyệt</p>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-md mx-auto">
        <div className={cn('flex items-center gap-2', step >= 1 ? 'text-primary-700' : 'text-neutral-400')}>
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', step >= 1 ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-400')}>1</div>
          <span className="text-sm font-medium">Soạn thảo</span>
        </div>
        <div className={cn('flex-1 h-px mx-2', step >= 2 ? 'bg-primary-300' : 'bg-neutral-200')} />
        <div className={cn('flex items-center gap-2', step >= 2 ? 'text-primary-700' : 'text-neutral-400')}>
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', step >= 2 ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-400')}>2</div>
          <span className="text-sm font-medium">Xét duyệt</span>
        </div>
      </div>

      <ImageUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onUploaded={(url) => setThumbnailUrl(url)} />

      {step === 1 && (
        <div className="flex gap-6 items-start">
          <div className="w-80 shrink-0 space-y-4">
            <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-neutral-700 pb-2 border-b border-border">Thông tin bài viết</h3>

              <div className="space-y-1.5">
                <Label>Tiêu đề <span className="text-red-500">*</span></Label>
                <Input placeholder="Nhập tiêu đề..." value={title} onChange={e => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: '' })) }} />
                {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Tóm tắt</Label>
                <Input placeholder="Tóm tắt nội dung..." value={summary} onChange={e => setSummary(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Loại bài viết</Label>
                <Select options={TYPE_OPTIONS} value={type} onChange={setType} placeholder="Chọn loại..." />
              </div>

              <div className="space-y-1.5">
                <Label>Thẻ (tags)</Label>
                <Input placeholder="tag1, tag2, ..." value={tags} onChange={e => setTags(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Ảnh đại diện</Label>
                <div className="flex gap-2">
                  <Input placeholder="https://..." value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} className="flex-1" />
                  <Button variant="outline" size="icon" onClick={() => setShowUploadModal(true)} title="Upload ảnh lên MinIO">
                    <Upload size={16} />
                  </Button>
                </div>
                {thumbnailUrl && (
                  <img src={thumbnailUrl} alt="preview" className="w-full h-28 object-cover rounded mt-2 border border-border" onError={(e: any) => { e.target.style.display = 'none' }} />
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Nội dung <span className="text-red-500">*</span></Label>
              <span className="text-xs text-neutral-400"><Eye size={14} className="inline mr-1" />Xem trước bên phải</span>
            </div>
            <TiptapEditor value={content} onChange={setContent} placeholder="Nhập nội dung bài viết..." />
            {errors.content && <p className="text-xs text-red-500">{errors.content}</p>}
          </div>

          <div className="w-96 shrink-0">
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden sticky top-6">
              <div className="px-4 py-2.5 bg-neutral-50 border-b border-border flex items-center gap-2">
                <Eye size={15} className="text-primary-600" />
                <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Xem trước</span>
              </div>
              <div className="p-5 max-h-[700px] overflow-y-auto">
                {!title && !content ? (
                  <p className="text-sm text-neutral-400 text-center py-10">Nhập nội dung để xem trước</p>
                ) : (
                  <article className="prose prose-sm max-w-none">
                    {thumbnailUrl && (
                      <img src={thumbnailUrl} alt="" className="w-full h-40 object-cover rounded-lg mb-4" onError={(e: any) => { e.target.style.display = 'none' }} />
                    )}
                    {title && <h1 className="text-xl font-bold text-neutral-900 mb-2">{title}</h1>}
                    {summary && <p className="text-sm text-neutral-500 italic mb-4">{summary}</p>}
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  </article>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center py-12 space-y-6 bg-white rounded-xl border border-border shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
            <Send className="w-7 h-7 text-primary-600" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-neutral-800">Gửi bài viết đi xét duyệt</h3>
            <p className="text-sm text-neutral-500 mt-1">Sau khi gửi, bài viết sẽ được chuyển đến người phê duyệt</p>
          </div>
          <div className="w-full max-w-sm space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
              Bài viết sẽ được tạo với trạng thái <strong>Chờ duyệt</strong> và cần được phê duyệt trước khi xuất bản.
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={() => step === 1 ? navigate('/qtht/tin-tuc') : setStep(1)}>
          {step === 1 ? 'Hủy' : <><ChevronLeft size={15} className="mr-1" /> Quay lại</>}
        </Button>
        {step === 1 ? (
          <Button onClick={handleNext}>
            Tiếp theo <ChevronRight size={15} className="ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={createReq.isPending} className="gap-2">
            {createReq.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Gửi xét duyệt
          </Button>
        )}
      </div>
    </div>
  )
}
