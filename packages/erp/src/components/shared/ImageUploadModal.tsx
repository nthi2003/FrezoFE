import { useState, useRef } from 'react'
import { Upload, X, Loader2, Image as ImageIcon, Check, Link2 } from 'lucide-react'
import { Button, AppModal, Input, Label } from '@frezo/ui'
import { uploadApi } from '@/lib/upload/uploadApi'
import { toast } from 'sonner'
import { cn } from '@frezo/utils'

interface ImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploaded: (url: string) => void
  /** Tiêu đề modal. */
  title?: string
}

type Tab = 'upload' | 'url'

export function ImageUploadModal({
  isOpen,
  onClose,
  onUploaded,
  title = 'Chèn hình ảnh',
}: ImageUploadModalProps) {
  const [tab, setTab] = useState<Tab>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [urlDraft, setUrlDraft] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh vượt quá 5MB')
      return
    }
    setSelectedFile(file)
    setUploadedUrl(null)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setIsUploading(true)
    try {
      const res = await uploadApi.uploadImage(selectedFile)
      const url = res?.data?.url || res?.url
      if (url) {
        setUploadedUrl(url)
        toast.success('Upload ảnh thành công')
      } else {
        toast.error('Không lấy được URL ảnh')
      }
    } catch {
      toast.error('Upload ảnh thất bại')
    } finally {
      setIsUploading(false)
    }
  }

  const handleConfirmUpload = () => {
    if (!uploadedUrl) return
    onUploaded(uploadedUrl)
    handleReset()
    onClose()
  }

  const handleApplyUrl = () => {
    const url = urlDraft.trim()
    if (!url) {
      toast.error('Nhập URL hình ảnh')
      return
    }
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
      toast.error('URL không hợp lệ — bắt đầu bằng http(s):// hoặc /')
      return
    }
    onUploaded(url)
    handleReset()
    onClose()
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreview(null)
    setUploadedUrl(null)
    setUrlDraft('')
    setTab('upload')
    setIsUploading(false)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      description="Chọn file từ máy hoặc dán URL ảnh đã có."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              tab === 'upload'
                ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200'
                : 'text-neutral-500 hover:text-neutral-700',
            )}
          >
            <Upload size={14} strokeWidth={1.5} />
            Tải lên
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              tab === 'url'
                ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200'
                : 'text-neutral-500 hover:text-neutral-700',
            )}
          >
            <Link2 size={14} strokeWidth={1.5} />
            Dán URL
          </button>
        </div>

        {tab === 'upload' ? (
          <>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                preview
                  ? 'border-primary-300 bg-primary-50/30'
                  : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30',
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                  e.target.value = ''
                }}
              />
              {preview ? (
                <div className="relative inline-block">
                  <img src={preview} alt="preview" className="max-h-64 rounded-lg mx-auto" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReset()
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center hover:opacity-90"
                    title="Xoá ảnh đã chọn"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary-500" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-neutral-700">Kéo thả hoặc bấm để chọn ảnh</p>
                  <p className="text-xs text-neutral-500">JPG, PNG, GIF, WebP — tối đa 5MB</p>
                </div>
              )}
            </div>

            {uploadedUrl && (
              <div className="bg-success-light border border-success/30 rounded-lg p-3 flex items-center gap-3">
                <Check size={18} className="text-success shrink-0" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-success-dark">Đã upload thành công</p>
                  <p className="text-xs text-neutral-500 truncate">{uploadedUrl}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 justify-end pt-2 border-t border-neutral-200">
              <Button type="button" variant="outline" onClick={handleClose}>
                Hủy
              </Button>
              {!uploadedUrl ? (
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="gap-2"
                >
                  {isUploading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ImageIcon size={15} strokeWidth={1.5} />
                  )}
                  {isUploading ? 'Đang tải lên…' : 'Tải lên'}
                </Button>
              ) : (
                <Button type="button" onClick={handleConfirmUpload} className="gap-2">
                  <Check size={15} strokeWidth={1.5} />
                  Dùng ảnh này
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700">URL hình ảnh</Label>
              <Input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://cdn.example.com/image.jpg"
                className="h-10"
                autoFocus
              />
              <p className="text-xs text-neutral-500">
                Dùng khi ảnh đã có trên CDN/MinIO. Ưu tiên tab Tải lên nếu ảnh ở máy bạn.
              </p>
            </div>
            {urlDraft.trim() && (
              <img
                src={urlDraft.trim()}
                alt="preview"
                className="w-full max-h-48 object-contain rounded-lg border border-neutral-200 bg-neutral-50"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement
                  img.style.display = 'none'
                }}
              />
            )}
            <div className="flex items-center gap-3 justify-end pt-2 border-t border-neutral-200">
              <Button type="button" variant="outline" onClick={handleClose}>
                Hủy
              </Button>
              <Button type="button" onClick={handleApplyUrl} disabled={!urlDraft.trim()}>
                Áp dụng URL
              </Button>
            </div>
          </>
        )}
      </div>
    </AppModal>
  )
}
