import { useState, useRef } from 'react'
import { Upload, X, Loader2, Image as ImageIcon, Check } from 'lucide-react'
import { Button, AppModal } from '@frezo/ui'
import { uploadApi } from '@/lib/upload/uploadApi'
import { toast } from 'sonner'
import { cn } from '@frezo/utils'

interface ImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploaded: (url: string) => void
}

export function ImageUploadModal({ isOpen, onClose, onUploaded }: ImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh')
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

  const handleConfirm = () => {
    if (uploadedUrl) {
      onUploaded(uploadedUrl)
      handleReset()
      onClose()
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreview(null)
    setUploadedUrl(null)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <AppModal isOpen={isOpen} onClose={handleClose} title="Upload hình ảnh" maxWidth="lg">
      <div className="space-y-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            preview ? 'border-primary-300 bg-primary-50/30' : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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
                onClick={(e) => { e.stopPropagation(); handleReset() }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center">
                <Upload className="w-7 h-7 text-primary-400" />
              </div>
              <p className="text-sm font-semibold text-neutral-700">Kéo thả hoặc click để chọn ảnh</p>
              <p className="text-xs text-neutral-400">Hỗ trợ JPG, PNG, GIF, WebP</p>
            </div>
          )}
        </div>

        {uploadedUrl && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
            <Check size={18} className="text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-700">Đã upload thành công</p>
              <p className="text-xs text-green-600 truncate">{uploadedUrl}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 justify-end pt-2 border-t border-border">
          <Button variant="outline" onClick={handleClose}>Hủy</Button>
          {!uploadedUrl ? (
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="gap-2">
              {isUploading ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
              {isUploading ? 'Đang upload...' : 'Upload lên MinIO'}
            </Button>
          ) : (
            <Button onClick={handleConfirm} className="gap-2 bg-green-600 hover:bg-green-700">
              <Check size={15} />
              Chọn ảnh này
            </Button>
          )}
        </div>
      </div>
    </AppModal>
  )
}
