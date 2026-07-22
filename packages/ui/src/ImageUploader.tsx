import * as React from 'react'
import { UploadCloud, X, Link2, ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@frezo/utils'
import { Button } from './button'
import { Input } from './input'

/**
 * ImageUploader — chọn / kéo-thả ảnh cho các field như coverImage, avatar, logo.
 *
 * Chuẩn dùng:
 * - `value` là URL string cuối (đã upload xong lên server / CDN / MinIO).
 * - `onUpload` async: nhận File → trả URL. Component tự lo preview + progress state.
 *   Nếu không truyền `onUpload`, component chỉ cho phép nhập URL trực tiếp (không upload).
 * - `aspectRatio` giữ tỉ lệ preview để user thấy đúng crop hiển thị thực tế.
 * - Ràng buộc: chỉ chấp nhận `accept` (default: image/*), tối đa `maxSizeMB` (default 5MB).
 *
 * KHÔNG chứa logic upload cụ thể (S3, MinIO...) — caller inject qua `onUpload`.
 */

export interface ImageUploaderProps {
  value?: string
  onChange?: (url: string) => void
  /** Async upload — nhận File, trả về URL public. Bắt buộc nếu muốn drag/drop file thật. */
  onUpload?: (file: File) => Promise<string>
  label?: string
  hint?: string
  accept?: string
  maxSizeMB?: number
  /** Tỉ lệ preview, VD "16/9", "1/1", "4/3". Default: "16/9". */
  aspectRatio?: string
  className?: string
  disabled?: boolean
}

export function ImageUploader({
  value,
  onChange,
  onUpload,
  label,
  hint = 'Kéo-thả ảnh hoặc bấm để chọn. Khuyến nghị 16:9, tối thiểu 1200×675, ≤ 5MB.',
  accept = 'image/png,image/jpeg,image/webp,image/gif',
  maxSizeMB = 5,
  aspectRatio = '16/9',
  className,
  disabled,
}: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setDragging] = React.useState(false)
  const [isUploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = React.useState(false)
  const [urlDraft, setUrlDraft] = React.useState(value || '')

  React.useEffect(() => {
    setUrlDraft(value || '')
  }, [value])

  const handleFiles = React.useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      setError(null)

      if (!file.type.startsWith('image/')) {
        setError('File không phải ảnh.')
        return
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Ảnh vượt quá ${maxSizeMB}MB.`)
        return
      }

      if (!onUpload) {
        // Không có upload handler — auto mở ô nhập URL để user không bị bí, đồng thời
        // pre-fill blob URL local để preview tạm (blob KHÔNG lưu được → chỉ để user thấy
        // ảnh đúng chưa, còn URL thực phải paste thủ công).
        try {
          const blobUrl = URL.createObjectURL(file)
          setUrlDraft(blobUrl)
        } catch {
          /* ignore blob failures */
        }
        setShowUrlInput(true)
        setError('Chưa có cấu hình upload cho trang này — dán URL ảnh (CDN/MinIO) vào ô bên dưới rồi bấm "Áp dụng".')
        return
      }

      try {
        setUploading(true)
        const url = await onUpload(file)
        onChange?.(url)
      } catch (err: any) {
        setError(err?.message || 'Upload thất bại.')
      } finally {
        setUploading(false)
      }
    },
    [maxSizeMB, onChange, onUpload],
  )

  const openFilePicker = () => {
    if (disabled || isUploading) return
    inputRef.current?.click()
  }

  const clear = () => {
    onChange?.('')
    setError(null)
  }

  const applyUrl = () => {
    const url = urlDraft.trim()
    if (!url) {
      onChange?.('')
      setShowUrlInput(false)
      return
    }
    onChange?.(url)
    setShowUrlInput(false)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-neutral-700">{label}</label>
      )}

      {value ? (
        <div className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
          <div style={{ aspectRatio }} className="w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="preview"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none'
                setError('Không thể tải ảnh — kiểm tra lại URL.')
              }}
            />
          </div>
          <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/40 to-transparent">
            <div className="flex gap-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={openFilePicker}
                disabled={disabled || isUploading}
                className="h-8"
              >
                Đổi ảnh
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={clear}
                disabled={disabled}
                className="h-8"
              >
                <X size={14} className="mr-1" /> Xoá
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              openFilePicker()
            }
          }}
          onClick={openFilePicker}
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            if (disabled) return
            handleFiles(e.dataTransfer.files)
          }}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
            'border-neutral-200 bg-neutral-50/50 text-neutral-500',
            'hover:border-primary-300 hover:bg-primary-50/40 hover:text-primary-700',
            isDragging && 'border-primary-400 bg-primary-50 text-primary-700',
            disabled && 'opacity-50 cursor-not-allowed hover:bg-neutral-50/50 hover:border-neutral-200',
          )}
          style={{ aspectRatio }}
        >
          {isUploading ? (
            <>
              <Loader2 size={28} className="animate-spin mb-2" />
              <p className="text-sm font-medium">Đang tải lên…</p>
            </>
          ) : (
            <>
              <UploadCloud size={28} className="mb-2" />
              <p className="text-sm font-medium">Kéo-thả ảnh hoặc bấm để chọn</p>
              <p className="text-xs mt-1 max-w-xs">{hint}</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-primary-600 transition-colors"
        >
          <Link2 size={12} />
          {showUrlInput ? 'Ẩn ô URL' : 'Hoặc dán URL trực tiếp'}
        </button>
        {value && (
          <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
            <ImageIcon size={12} />
            <span className="max-w-[220px] truncate" title={value}>
              {value}
            </span>
          </span>
        )}
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://cdn.example.com/cover.jpg"
            className="h-9"
          />
          <Button type="button" onClick={applyUrl} size="sm" className="h-9">
            Áp dụng
          </Button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
