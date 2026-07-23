// ============================================================
// DepreciationPostPage — Khấu hao định kỳ (CYCLE-DEP)
// ============================================================

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Landmark,
  Loader2,
  Calculator,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Button,
  PageHeader,
  PageGuideButton,
  EmptyState,
  ErrorState,
  ConfirmDialog,
  StatusBadge,
} from '@frezo/ui'
import type { StatusColor } from '@frezo/ui'
import { usePermission } from '@/lib/hooks/usePermission'
import {
  useDepreciationPostings,
  usePostDepreciation,
  useDepreciationSchedules,
  useDepreciationPreview,
} from '../hooks/useDepreciation'
import { fmtMoneyFull } from '../constants/assetMeta'
import { DEPRECIATION_GUIDE } from '../constants/depreciation.guide'

const now = new Date()

const POSTING_STATUS: Record<
  string,
  { label: string; color: StatusColor; icon: LucideIcon }
> = {
  PREVIEW: { label: 'Xem trước', color: 'info', icon: Eye },
  POSTED: { label: 'Đã ghi sổ', color: 'success', icon: CheckCircle2 },
  FAILED: { label: 'Thất bại', color: 'danger', icon: XCircle },
  REVERSED: { label: 'Đã đảo', color: 'neutral', icon: Clock },
}

function postingBadge(status?: string) {
  const key = (status || 'PREVIEW').toUpperCase()
  return POSTING_STATUS[key] ?? {
    label: status || '—',
    color: 'neutral' as StatusColor,
    icon: Clock,
  }
}

export function DepreciationPostPage() {
  const canView = usePermission('ASSET.DEPRECIATION.VIEW')
  const canPost = usePermission('ASSET.DEPRECIATION.UPDATE')

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [previewOn, setPreviewOn] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const {
    data: postings = [],
    isLoading,
    isError: postingsError,
    isFetching: postingsFetching,
    refetch: refetchPostings,
  } = useDepreciationPostings()
  const { data: schedules = [] } = useDepreciationSchedules()
  const {
    data: preview,
    isFetching: previewLoading,
    isError: previewError,
    refetch: refetchPreview,
  } = useDepreciationPreview(year, month, previewOn && canView)
  const post = usePostDepreciation()

  const periodLabel = `${String(month).padStart(2, '0')}/${year}`

  const existingPosted = useMemo(
    () =>
      postings.find(
        (p) =>
          p.periodYear === year &&
          p.periodMonth === month &&
          p.status === 'POSTED',
      ),
    [postings, year, month],
  )

  const displayStatus = existingPosted?.status || preview?.status || 'PREVIEW'
  const badge = postingBadge(displayStatus)

  if (!canView) {
    return (
      <div className="p-6 animate-fade-in max-w-3xl">
        <PageHeader
          title="Khấu hao định kỳ"
          description="Chọn kỳ, xem trước tổng chi phí, xác nhận rồi ghi sổ kế toán."
          actions={<PageGuideButton guide={DEPRECIATION_GUIDE} />}
        />
        <div className="mt-4 border rounded-xl bg-white">
          <EmptyState
            icon={Landmark}
            title="Bạn không có quyền xem khấu hao"
            description="Liên hệ quản trị để được cấp quyền xem khấu hao định kỳ."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in max-w-3xl">
      <PageHeader
        title="Khấu hao định kỳ"
        description="Chọn kỳ, xem trước tổng chi phí, xác nhận rồi ghi sổ kế toán. Chạy lại cùng kỳ không ghi đôi."
        actions={
          <>
            <PageGuideButton guide={DEPRECIATION_GUIDE} />
            <Link to="/admin/qlts">
              <Button variant="outline">Danh sách tài sản</Button>
            </Link>
          </>
        }
      />

      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-neutral-500 space-y-1">
            Năm
            <input
              type="number"
              className="block w-28 border rounded-md px-3 py-2 text-sm"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            Tháng
            <select
              className="block w-28 border rounded-md px-3 py-2 text-sm"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={previewLoading}
            onClick={() => {
              setPreviewOn(true)
              void refetchPreview()
            }}
          >
            {previewLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Eye size={14} />
            )}
            Xem trước
          </Button>
          {canPost && (
            <Button
              className="gap-1.5"
              disabled={post.isPending || !!existingPosted}
              onClick={() => setConfirmOpen(true)}
            >
              {post.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Landmark size={14} />
              )}
              Ghi sổ
            </Button>
          )}
        </div>

        {previewError ? (
          <ErrorState
            title="Không tải được xem trước"
            message="Vui lòng thử lại. Nếu lỗi tiếp diễn, kiểm tra kết nối hoặc quyền truy cập."
            onRetry={() => void refetchPreview()}
            isRetrying={previewLoading}
          />
        ) : preview ? (
          <div className="rounded-lg border border-primary-100 bg-primary-50/40 px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-primary-900">
                Kỳ {String(preview.periodMonth ?? month).padStart(2, '0')}/
                {preview.periodYear ?? year}
              </span>
              <StatusBadge
                label={badge.label}
                color={badge.color}
                icon={badge.icon}
              />
            </div>
            <div className="text-xs text-primary-800 mt-1 flex flex-wrap gap-3">
              <span>
                Tổng:{' '}
                <b className="tabular-nums">{fmtMoneyFull(preview.totalAmount)}</b>
              </span>
              <span>
                Số lịch: <b>{preview.scheduleCount ?? 0}</b>
              </span>
            </div>
            {existingPosted && (
              <p className="text-xs text-success-dark mt-1">
                Kỳ này đã ghi sổ
                {existingPosted.journalEntryId
                  ? ` · JE ${existingPosted.journalEntryId}`
                  : ''}
                . Nút Ghi sổ đã khoá — không ghi lại từ UI.
              </p>
            )}
            {preview.errorMessage && (
              <p className="text-xs text-rose-600 mt-1">{preview.errorMessage}</p>
            )}
          </div>
        ) : null}

        <p className="text-xs text-neutral-500">
          {schedules.length} lịch khấu hao đang có trong hệ thống.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-2">
          Lịch sử ghi sổ
        </h2>
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
        ) : postingsError ? (
          <div className="border rounded-xl bg-white">
            <ErrorState
              title="Không tải được lịch sử ghi sổ"
              message="Vui lòng thử lại. Nếu lỗi tiếp diễn, kiểm tra kết nối hoặc quyền truy cập."
              onRetry={() => void refetchPostings()}
              isRetrying={postingsFetching}
            />
          </div>
        ) : postings.length === 0 ? (
          <div className="border rounded-xl bg-white">
            <EmptyState
              icon={Calculator}
              title="Chưa có lần ghi sổ nào"
              description="Chọn kỳ rồi Xem trước, sau đó Ghi sổ để tạo lần ghi đầu tiên."
              action={{
                label: 'Xem trước kỳ này',
                onClick: () => {
                  setPreviewOn(true)
                  void refetchPreview()
                },
              }}
            />
            <div className="px-4 pb-4 -mt-2">
              <Link
                to="/admin/qlts"
                className="text-xs text-primary-700 underline underline-offset-2"
              >
                Mở danh sách tài sản để sinh lịch
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-xl bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-xs text-neutral-500 text-left">
                <tr>
                  <th className="p-3">Kỳ</th>
                  <th className="p-3 text-right">Số tiền</th>
                  <th className="p-3">Số lịch</th>
                  <th className="p-3">JE</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {postings.map((p) => {
                  const rowBadge = postingBadge(p.status)
                  return (
                    <tr key={p.id}>
                      <td className="p-3 font-mono text-xs">
                        {String(p.periodMonth).padStart(2, '0')}/{p.periodYear}
                      </td>
                      <td className="p-3 text-right tabular-nums font-semibold">
                        {fmtMoneyFull(p.totalAmount)}
                      </td>
                      <td className="p-3 tabular-nums">
                        {p.scheduleCount ?? '—'}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {p.journalEntryId ? (
                          <Link
                            to="/accounting/journals"
                            className="text-primary-700 underline underline-offset-2"
                            title="Mở sổ nhật ký"
                          >
                            {p.journalEntryId}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3">
                        <StatusBadge
                          label={rowBadge.label}
                          color={rowBadge.color}
                          icon={rowBadge.icon}
                        />
                        {p.errorMessage && (
                          <div className="text-[10px] text-rose-600 mt-1">
                            {p.errorMessage}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          post.mutate(
            { year, month },
            { onSettled: () => setConfirmOpen(false) },
          )
        }}
        title={`Ghi sổ khấu hao kỳ ${periodLabel}?`}
        message={
          <span>
            {existingPosted ? (
              <>
                Kỳ này <strong>đã ghi sổ</strong>
                {existingPosted.journalEntryId
                  ? ` (JE ${existingPosted.journalEntryId})`
                  : ''}
                . Chạy lại sẽ trả JE cũ — <strong>không double</strong> (idempotent DEP-YYYY-MM).
              </>
            ) : (
              <>
                Tổng dự kiến:{' '}
                <strong className="tabular-nums">
                  {fmtMoneyFull(preview?.totalAmount)}
                </strong>
                {' · '}
                {preview?.scheduleCount ?? 0} lịch.
                <br />
                Không hoàn tác dễ — kiểm tra kỳ trước khi xác nhận.
              </>
            )}
          </span>
        }
        confirmText={existingPosted ? 'Ghi sổ lại (idempotent)' : 'Ghi sổ'}
        cancelText="Huỷ"
        variant="warning"
        isLoading={post.isPending}
      />
    </div>
  )
}
