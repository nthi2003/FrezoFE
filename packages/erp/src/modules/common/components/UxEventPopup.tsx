import type { ReactNode } from 'react'
import { Button, Dialog, DialogContent } from '@frezo/ui'
import { CelebrateModalShell } from '@/modules/common/components/CelebrateModalShell'
import {
  GiftBoxIllustration,
  MorningWelcomeIllustration,
  SuccessTrophyIllustration,
} from '@/modules/common/components/CelebratoryIllustrations'

export interface UxEventPopupProps {
  isOpen: boolean
  onClose: () => void
  title: string
  body?: string
  imageUrl?: string
  /** Nhãn nút đóng — mặc định "Đóng" */
  confirmLabel?: string
  /** 'success' = trophy; 'gift' = gift box; 'welcome' = morning; default celebrate */
  tone?: 'success' | 'gift' | 'celebrate' | 'welcome'
  /** Slot illustration tuỳ chỉnh — ưu tiên hơn tone / imageUrl */
  illustration?: ReactNode
}

/**
 * Modal chúc mừng / thông báo thành công giàu nội dung (không chỉ toast).
 * Nội dung lấy từ DB qua useUxPopup — không hardcode copy.
 */
export function UxEventPopup({
  isOpen,
  onClose,
  title,
  body,
  imageUrl,
  confirmLabel = 'Đóng',
  tone = 'celebrate',
  illustration,
}: UxEventPopupProps) {
  if (!title && !body) return null

  const DefaultIllust =
    tone === 'gift'
      ? GiftBoxIllustration
      : tone === 'welcome'
        ? MorningWelcomeIllustration
        : SuccessTrophyIllustration

  const panelTone = tone === 'welcome' ? 'morning' : tone === 'gift' ? 'amber' : 'forest'
  const showConfetti = tone === 'success' || tone === 'celebrate'

  const resolvedIllustration = illustration ? (
    illustration
  ) : imageUrl ? (
    <img
      src={imageUrl}
      alt=""
      className="max-h-36 w-full rounded-lg object-cover ring-1 ring-emerald-200/50"
    />
  ) : (
    <DefaultIllust aria-hidden />
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden border-0 p-0 shadow-xl sm:rounded-2xl">
        <CelebrateModalShell
          layout="celebrate"
          tone={panelTone}
          confetti={showConfetti && !imageUrl}
          illustration={resolvedIllustration}
          title={title}
          description={body}
          footer={
            <Button
              className="w-full bg-emerald-700 text-base text-white hover:bg-emerald-800"
              onClick={onClose}
            >
              {confirmLabel}
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  )
}

/** Alias theo tên BA — cùng component */
export const SuccessPopup = UxEventPopup
