// ============================================================
// TransferRequestActionModal — modal xác nhận cho các action:
//   approve | reject | handover | cancel
// ------------------------------------------------------------
// Tách khỏi Panel để tái sử dụng trong Drawer detail + list.
// ============================================================

import { useEffect, useState } from 'react'
import { Loader2, ThumbsUp, ThumbsDown, PackageCheck, XCircle, AlertCircle } from 'lucide-react'
import { AppModal, Button } from '@frezo/ui'
import { toast } from 'sonner'
import {
  useApproveTransfer, useRejectTransfer, useHandoverTransfer, useCancelTransfer,
} from '../hooks/useTransferRequest'
import type { TransferRequestItem } from '../services/assetApi'

export type TransferAction = 'approve' | 'reject' | 'handover' | 'cancel'

interface Props {
  request: TransferRequestItem | null
  action: TransferAction | null
  onClose: () => void
}

export function TransferRequestActionModal({ request, action, onClose }: Props) {
  const [note, setNote] = useState('')

  const approve = useApproveTransfer()
  const reject = useRejectTransfer()
  const handover = useHandoverTransfer()
  const cancel = useCancelTransfer()

  useEffect(() => {
    if (!request || !action) return
    setNote('')
  }, [request, action])

  if (!request || !action) return null

  const cfg = ACTION_CFG[action]
  const pending = approve.isPending || reject.isPending || handover.isPending || cancel.isPending
  const noteRequired = action === 'reject'
  const canSubmit = !pending && (!noteRequired || note.trim().length > 0)

  const doSubmit = () => {
    if (!canSubmit) {
      if (noteRequired) toast.warning('Vui lòng nhập lý do từ chối')
      return
    }
    const opts = { onSuccess: () => onClose() }
    if (action === 'approve')  approve.mutate({ reqId: request.id, note: note.trim() || undefined }, opts)
    if (action === 'handover') handover.mutate({ reqId: request.id, note: note.trim() || undefined }, opts)
    if (action === 'cancel')   cancel.mutate(request.id, opts)
    if (action === 'reject')   reject.mutate({ reqId: request.id, reason: note.trim() }, opts)
  }

  return (
    <AppModal
      isOpen={!!action}
      onClose={onClose}
      title={cfg.title}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Ticket summary */}
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-sm">
          <div className="text-xs text-neutral-500 mb-1">Tài sản</div>
          <div className="font-semibold text-neutral-900">
            {request.assetName} <span className="font-mono text-neutral-500">· {request.assetCode}</span>
          </div>
          {request.personName && (
            <div className="text-xs text-neutral-600 mt-1">
              <b>{request.requestType === 'ASSIGN' ? 'Cấp cho:' : 'Thu hồi từ:'}</b> {request.personName}
            </div>
          )}
          {request.reason && (
            <div className="text-xs text-neutral-600 mt-1 italic">Lý do: {request.reason}</div>
          )}
        </div>

        {/* Note input (unless cancel) */}
        {action !== 'cancel' && (
          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
              {noteRequired ? (
                <>Lý do <span className="text-rose-500">*</span></>
              ) : (
                <>Ghi chú <span className="text-neutral-400 font-normal">(không bắt buộc)</span></>
              )}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={1000}
              autoFocus
              placeholder={cfg.placeholder}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
            />
          </div>
        )}

        {/* Warning */}
        {cfg.warning && (
          <div className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 inline-flex items-start gap-1.5">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{cfg.warning}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
          <Button variant="outline" onClick={onClose} disabled={pending}>Huỷ</Button>
          <Button
            onClick={doSubmit}
            disabled={!canSubmit}
            className={`gap-1.5 text-white ${cfg.btnClass}`}
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <cfg.icon size={14} />}
            {cfg.confirmLabel}
          </Button>
        </div>
      </div>
    </AppModal>
  )
}

const ACTION_CFG: Record<TransferAction, {
  title: string
  confirmLabel: string
  placeholder: string
  warning?: string
  icon: any
  iconColor: string
  btnClass: string
}> = {
  approve: {
    title: 'Duyệt yêu cầu',
    confirmLabel: 'Duyệt',
    placeholder: 'Ghi chú duyệt (VD: OK, chuyển bàn giao trong ngày)',
    icon: ThumbsUp,
    iconColor: 'text-primary-600',
    btnClass: 'bg-primary-600 hover:bg-primary-700',
  },
  reject: {
    title: 'Từ chối yêu cầu',
    confirmLabel: 'Từ chối',
    placeholder: 'VD: Nhân viên đã có laptop, không cần cấp thêm.',
    warning: 'Ticket bị từ chối sẽ chuyển sang trạng thái REJECTED và không thể mở lại. Requester phải tạo ticket mới nếu muốn.',
    icon: ThumbsDown,
    iconColor: 'text-rose-600',
    btnClass: 'bg-rose-600 hover:bg-rose-700',
  },
  handover: {
    title: 'Xác nhận bàn giao',
    confirmLabel: 'Đã bàn giao',
    placeholder: 'VD: Đã bàn giao kèm sạc + túi. Nhân viên ký nhận.',
    warning: 'Sau khi xác nhận, tài sản chuyển sang Đang dùng và được gắn cho người nhận. Không thể hoàn tác trực tiếp — phải qua luồng Thu hồi.',
    icon: PackageCheck,
    iconColor: 'text-emerald-600',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700',
  },
  cancel: {
    title: 'Huỷ yêu cầu',
    confirmLabel: 'Huỷ yêu cầu',
    placeholder: '',
    warning: 'Chỉ có thể huỷ khi yêu cầu còn ở trạng thái Chờ duyệt. Sau khi huỷ, phải tạo yêu cầu mới nếu muốn cấp phát lại.',
    icon: XCircle,
    iconColor: 'text-neutral-600',
    btnClass: 'bg-neutral-700 hover:bg-neutral-800',
  },
}
