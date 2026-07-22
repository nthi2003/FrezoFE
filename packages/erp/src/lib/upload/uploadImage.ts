// ============================================================
// Generic image upload helper
// ------------------------------------------------------------
// Dùng chung cho mọi ImageUploader trong app (article thumbnail, product image,
// avatar, banner, cover...) — tránh mỗi trang phải wire lại toast + response
// parsing. Chỉ 1 endpoint đích để mai này refactor sang /media/upload không
// phải sửa từng chỗ.
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'
import { toast } from 'sonner'

/**
 * Response shape BE trả về:
 * `{ code, message, data: { url: string, fileName: string } }`
 * — cùng chuẩn với productApi.uploadImage (backend đã có endpoint /product/upload-image,
 * tạm dùng chung cho tất cả use-case cho tới khi có /media/upload chuyên biệt).
 */
interface UploadResponse {
  url?: string
  fileName?: string
}

/**
 * Endpoint upload chung — điểm duy nhất phải đổi khi BE tách endpoint riêng.
 * Query param `folder` cho phép phân loại (VD `?folder=articles`, `?folder=products`)
 * — BE hiện đang bỏ qua nhưng không phá; sẵn sàng cho future refactor.
 */
const UPLOAD_ENDPOINT = '/product/upload-image'

export interface UploadImageOptions {
  /** Namespace lưu file (products / articles / avatars / banners...) — BE dùng làm prefix key. */
  folder?: string
  /** Silent = không show toast (khi caller đã có UX riêng). */
  silent?: boolean
  /** Max size MB override (mặc định 10MB cho generic). */
  maxSizeMB?: number
}

/**
 * Upload 1 file ảnh, trả về URL public.
 * <p>
 * - Validate mime + size trước khi POST → tiết kiệm bandwidth.
 * - Hiển thị toast success/error tự động (trừ khi `silent: true`).
 * - Throw Error để caller (VD ImageUploader) hiển thị message lỗi ngay tại field.
 */
export async function uploadImage(
  file: File,
  { folder, silent = false, maxSizeMB = 10 }: UploadImageOptions = {},
): Promise<string> {
  // ---- Validate client-side ----
  if (!file.type.startsWith('image/')) {
    const msg = 'File không phải ảnh — chỉ chấp nhận PNG, JPG, WebP, GIF.'
    if (!silent) toast.error(msg)
    throw new Error(msg)
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    const msg = `Ảnh vượt quá ${maxSizeMB}MB.`
    if (!silent) toast.error(msg)
    throw new Error(msg)
  }

  // ---- Upload ----
  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await axiosClient.post<ApiResponse<UploadResponse>>(
      UPLOAD_ENDPOINT,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: folder ? { folder } : undefined,
      },
    )
    const url = res.data?.data?.url
    if (!url) {
      const msg = 'Server không trả URL — kiểm tra cấu hình MinIO.'
      if (!silent) toast.error(msg)
      throw new Error(msg)
    }
    if (!silent) toast.success('Upload ảnh thành công')
    return url
  } catch (err: any) {
    // Axios error hoặc validation error ở trên đều rơi vào đây
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      'Upload thất bại — thử lại hoặc dán URL trực tiếp.'
    if (!silent) toast.error(msg)
    throw new Error(msg)
  }
}

/**
 * Factory tạo `onUpload` closure với folder cố định.
 * Dùng cho các trang mà tất cả ảnh cùng namespace, VD:
 *   const onUpload = makeImageUploader({ folder: 'articles' })
 *   <ImageUploader onUpload={onUpload} />
 */
export function makeImageUploader(defaults: UploadImageOptions = {}) {
  return (file: File) => uploadImage(file, defaults)
}

/**
 * Mở file picker (invisible `<input type="file">`) → upload → return URL.
 * Dùng cho `RichTextEditor.onRequestImage` để user có thể chèn ảnh trong-nội-dung
 * mà không phải copy URL bên ngoài. Resolve `null` nếu user hủy chọn file.
 */
export function pickAndUploadImage(options: UploadImageOptions = {}): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/webp,image/gif'
    input.style.display = 'none'

    let settled = false
    const finish = (val: string | null) => {
      if (settled) return
      settled = true
      resolve(val)
      // Dọn DOM sau khi resolve — tránh leak input node.
      setTimeout(() => input.remove(), 0)
    }

    input.addEventListener('change', async () => {
      const file = input.files?.[0]
      if (!file) return finish(null)
      try {
        const url = await uploadImage(file, options)
        finish(url)
      } catch {
        finish(null)
      }
    })
    // Nếu user đóng dialog picker bằng ESC/Cancel, `change` không fire →
    // dùng `cancel` event (supported từ Chrome 113+) để giải phóng Promise.
    input.addEventListener('cancel', () => finish(null))

    document.body.appendChild(input)
    input.click()
  })
}
