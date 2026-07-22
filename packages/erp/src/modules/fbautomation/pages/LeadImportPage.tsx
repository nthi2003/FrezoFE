// ============================================================
// MKT · Nhập lead hàng loạt (CSV/Excel)
// ------------------------------------------------------------
// 4 bước UX:
//   1) Kéo-thả / chọn file (.csv, .xlsx)
//   2) Preview 20 dòng đầu — user check header có đúng không
//   3) Cấu hình (source name, dedupe on/off) → Import
//   4) Hiển thị kết quả batch + lịch sử các lần import
// ============================================================

import { useRef, useState } from 'react'
import {
  Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, Info,
  RotateCcw, Download, History, AlertCircle, FileCheck2,
} from 'lucide-react'
import { Button, PageHeader, EmptyState, Input, Label } from '@frezo/ui'
import { toast } from 'sonner'
import {
  useLeadImportHistory, usePreviewLeadImport, useUploadLeadImport, useRollbackLeadImport,
} from '../hooks/useMkt'

interface BatchRow {
  id: string
  filename: string
  source?: string
  rowCount?: number
  successCount?: number
  skippedCount?: number
  failedCount?: number
  errorLog?: string
  uploadedBy?: string
  uploadedAt?: string
  rolledBack?: boolean
}

const REQUIRED_COLUMNS = ['name', 'phone', 'email', 'address', 'subject', 'message', 'source']

const SAMPLE_CSV = `name,phone,email,address,subject,message,source
Nguyễn Văn A,0901234567,a@example.com,Hà Nội,Tư vấn phần mềm,Gọi lại sau 15h,LANDING
Trần Thị B,0912345678,b@example.com,HCM,Báo giá,Cần bảng giá gói doanh nghiệp,ZALO
`

export function LeadImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [source, setSource] = useState('MANUAL_IMPORT')
  const [dedupe, setDedupe] = useState(true)
  const [preview, setPreview] = useState<string[][] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const previewMut = usePreviewLeadImport()
  const uploadMut = useUploadLeadImport()
  const rollbackMut = useRollbackLeadImport()
  const { data: history } = useLeadImportHistory()

  const chooseFile = (f: File | null) => {
    setPreview(null)
    setFile(f)
    if (f) {
      previewMut.mutate(f, {
        onSuccess: (rows: string[][]) => setPreview(rows),
      })
    }
  }

  const submit = () => {
    if (!file) {
      toast.error('Chưa chọn file')
      return
    }
    uploadMut.mutate(
      { file, source, dedupe },
      {
        onSuccess: () => {
          setFile(null)
          setPreview(null)
          if (inputRef.current) inputRef.current.value = ''
        },
      },
    )
  }

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lead_import_mau.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('Đã tải file mẫu')
  }

  const header = preview?.[0] || []
  const body = preview?.slice(1) || []

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        <PageHeader
          title="Nhập lead hàng loạt"
          description="Upload file CSV hoặc Excel (.xlsx) — hệ thống tự parse, dedupe theo SĐT/email và tạo lead."
          actions={
            <Button variant="outline" onClick={downloadSample}>
              <Download size={16} className="mr-2" />
              Tải file mẫu
            </Button>
          }
        />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ==== LEFT: UPLOADER ==== */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer.files?.[0]
                  if (f) chooseFile(f)
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                  file ? 'border-primary-300 bg-primary-50/30' : 'border-neutral-300 hover:border-primary-300'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => chooseFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileCheck2 size={40} className="text-emerald-500" />
                    <div className="font-semibold text-neutral-900">{file.name}</div>
                    <div className="text-xs text-neutral-500">{(file.size / 1024).toFixed(1)} KB</div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" onClick={() => inputRef.current?.click()}>
                        Chọn file khác
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFile(null)
                          setPreview(null)
                          if (inputRef.current) inputRef.current.value = ''
                        }}
                      >
                        Bỏ chọn
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload size={40} className="text-neutral-400" />
                    <div>
                      <div className="font-semibold text-neutral-900">Kéo-thả file vào đây</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        hoặc bấm chọn file — chấp nhận .csv / .xlsx (tối đa 50MB)
                      </div>
                    </div>
                    <Button onClick={() => inputRef.current?.click()}>
                      <Upload size={16} className="mr-2" />
                      Chọn file
                    </Button>
                  </div>
                )}
              </div>

              {/* Config */}
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Nguồn (gán cho tất cả lead trong file)</Label>
                  <Input
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="VD: LANDING_TET_2026"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer h-10 select-none">
                    <input
                      type="checkbox"
                      checked={dedupe}
                      onChange={(e) => setDedupe(e.target.checked)}
                      className="w-4 h-4 accent-primary-600"
                    />
                    <span className="text-sm">
                      Bỏ qua lead trùng SĐT/email (khuyên bật)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Preview */}
            {previewMut.isPending && (
              <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
                <Loader2 size={20} className="animate-spin mx-auto text-primary-600" />
                <div className="mt-2 text-sm text-neutral-500">Đang đọc file...</div>
              </div>
            )}
            {preview && preview.length > 0 && (
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-primary-600" />
                    <span className="font-semibold text-sm">Preview 20 dòng đầu</span>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {body.length} dòng dữ liệu · {header.length} cột
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-xs">
                    <thead className="bg-neutral-50 sticky top-0">
                      <tr>
                        {header.map((h, i) => (
                          <th
                            key={i}
                            className={`px-3 py-2 text-left border-r border-neutral-100 font-semibold ${
                              REQUIRED_COLUMNS.some(
                                (c) =>
                                  h?.toLowerCase().replace(/[^a-z0-9]/g, '').includes(c),
                              )
                                ? 'text-primary-700 bg-primary-50/50'
                                : 'text-neutral-600'
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {body.map((row, i) => (
                        <tr key={i} className="hover:bg-neutral-50/50">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-1.5 border-r border-neutral-50 truncate max-w-[200px]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setFile(null); setPreview(null) }}>
                    Huỷ
                  </Button>
                  <Button onClick={submit} disabled={uploadMut.isPending}>
                    {uploadMut.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Upload size={16} className="mr-2" />}
                    Import {body.length} dòng
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ==== RIGHT: HELP + HISTORY ==== */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <div className="font-semibold mb-2">Cột chấp nhận</div>
                  <div className="text-xs text-blue-700 mb-2">
                    Tên cột không phân biệt hoa/thường/dấu. Hỗ trợ cả tiếng Anh và tiếng Việt:
                  </div>
                  <ul className="text-xs space-y-1 text-blue-800">
                    <li>• <code>name</code> / <code>Họ tên</code></li>
                    <li>• <code>phone</code> / <code>SĐT</code> / <code>Điện thoại</code></li>
                    <li>• <code>email</code></li>
                    <li>• <code>address</code> / <code>Địa chỉ</code></li>
                    <li>• <code>subject</code> / <code>Chủ đề</code> / <code>Dịch vụ</code></li>
                    <li>• <code>message</code> / <code>Nội dung</code> / <code>Ghi chú</code></li>
                    <li>• <code>source</code> / <code>Nguồn</code></li>
                  </ul>
                  <div className="mt-2 text-xs text-blue-700">
                    ⚠️ Bắt buộc có ít nhất 1 trong 2 cột <b>phone</b> hoặc <b>email</b>.
                  </div>
                </div>
              </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-lg border border-neutral-200">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200">
                <History size={16} className="text-neutral-500" />
                <span className="font-semibold text-sm">Lịch sử upload</span>
              </div>
              {!history?.length ? (
                <div className="p-6 text-center text-sm text-neutral-400">Chưa có batch nào</div>
              ) : (
                <div className="divide-y divide-neutral-100 max-h-[500px] overflow-y-auto">
                  {history.map((b: BatchRow) => (
                    <BatchCard
                      key={b.id}
                      batch={b}
                      onRollback={() => {
                        if (confirm(`Rollback batch "${b.filename}"? Toàn bộ lead trong batch sẽ bị xoá mềm.`)) {
                          rollbackMut.mutate(b.id)
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Batch card
// ============================================================
function BatchCard({ batch, onRollback }: { batch: BatchRow; onRollback: () => void }) {
  const total = batch.rowCount || 0
  const ok = batch.successCount || 0
  const skip = batch.skippedCount || 0
  const fail = batch.failedCount || 0

  return (
    <div className={`p-4 ${batch.rolledBack ? 'bg-neutral-50 opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm text-neutral-900 truncate">{batch.filename}</div>
          <div className="text-xs text-neutral-500 mt-0.5">
            {batch.source} · {batch.uploadedBy} · {batch.uploadedAt ? new Date(batch.uploadedAt).toLocaleString('vi-VN') : '—'}
          </div>
        </div>
        {batch.rolledBack ? (
          <span className="text-[10px] px-2 py-0.5 bg-neutral-200 text-neutral-600 rounded font-bold">
            ROLLED BACK
          </span>
        ) : (
          <button
            onClick={onRollback}
            className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded text-neutral-500"
            title="Rollback batch này"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="text-center bg-neutral-50 rounded p-1.5">
          <div className="font-bold text-neutral-900">{total}</div>
          <div className="text-neutral-500">Tổng</div>
        </div>
        <div className="text-center bg-emerald-50 rounded p-1.5">
          <div className="font-bold text-emerald-700">{ok}</div>
          <div className="text-emerald-600">OK</div>
        </div>
        <div className="text-center bg-amber-50 rounded p-1.5">
          <div className="font-bold text-amber-700">{skip}</div>
          <div className="text-amber-600">Trùng</div>
        </div>
        <div className="text-center bg-rose-50 rounded p-1.5">
          <div className="font-bold text-rose-700">{fail}</div>
          <div className="text-rose-600">Lỗi</div>
        </div>
      </div>
      {fail > 0 && batch.errorLog && batch.errorLog !== '[]' && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer text-rose-600 flex items-center gap-1">
            <AlertCircle size={12} /> Xem chi tiết lỗi
          </summary>
          <pre className="mt-1 p-2 bg-rose-50 rounded text-[10px] overflow-x-auto max-h-32">
            {batch.errorLog}
          </pre>
        </details>
      )}
    </div>
  )
}

export default LeadImportPage
