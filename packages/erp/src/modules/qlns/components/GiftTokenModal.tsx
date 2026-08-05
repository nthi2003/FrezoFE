// ============================================================
// GiftTokenModal — Tặng token với shell asymmetrical + illustration
// ============================================================

import {
  Button,
  Dialog,
  DialogContent,
  Label,
  Select,
  type SelectOption,
} from '@frezo/ui'
import { CelebrateModalShell } from '@/modules/common/components/CelebrateModalShell'
import {
  GiftBoxIllustration,
  SuccessTrophyIllustration,
} from '@/modules/common/components/CelebratoryIllustrations'

const QUICK_AMOUNTS = [5, 10, 20] as const

function formatVnd(n?: number | null) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

function isSelectDropdownTarget(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('[data-frezo-select-dropdown]')
}

export type GiftTokenModalProps = {
  isOpen: boolean
  onClose: () => void
  personOptions: SelectOption[]
  toPersonId: string
  onToPersonIdChange: (id: string) => void
  giftAmount: number
  onGiftAmountChange: (n: number) => void
  giftNote: string
  onGiftNoteChange: (note: string) => void
  maxGift: number
  tokenToVnd: number
  sourceId?: string
  isPending: boolean
  onSubmit: () => void
  /** Khi true — hiện success view (caller set sau mutate success) */
  showSuccess?: boolean
  successAmount?: number
  successRecipientLabel?: string
}

export function GiftTokenModal({
  isOpen,
  onClose,
  personOptions,
  toPersonId,
  onToPersonIdChange,
  giftAmount,
  onGiftAmountChange,
  giftNote,
  onGiftNoteChange,
  maxGift,
  tokenToVnd,
  sourceId,
  isPending,
  onSubmit,
  showSuccess = false,
  successAmount,
  successRecipientLabel,
}: GiftTokenModalProps) {
  const chips = QUICK_AMOUNTS.filter((a) => a <= maxGift)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-lg overflow-hidden border-0 p-0 shadow-xl sm:rounded-2xl"
        onPointerDownOutside={(e) => {
          if (isSelectDropdownTarget(e.target)) e.preventDefault()
        }}
        onInteractOutside={(e) => {
          if (isSelectDropdownTarget(e.target)) e.preventDefault()
        }}
        onFocusOutside={(e) => {
          if (isSelectDropdownTarget(e.target)) e.preventDefault()
        }}
      >
        {showSuccess ? (
          <CelebrateModalShell
            layout="celebrate"
            tone="forest"
            confetti
            illustration={<SuccessTrophyIllustration aria-hidden />}
            title="Gửi thành công"
            description={
              successAmount != null && successRecipientLabel
                ? `${successAmount} token → ${successRecipientLabel}`
                : 'Token đã được chuyển.'
            }
            footer={
              <Button
                className="w-full bg-emerald-700 text-base text-white hover:bg-emerald-800"
                onClick={onClose}
              >
                Xong
              </Button>
            }
          />
        ) : (
          <CelebrateModalShell
            layout="form"
            tone="amber"
            illustration={<GiftBoxIllustration aria-hidden />}
            title="Tặng điểm ghi nhận"
            description="Trừ số dư ngay khi gửi."
            footer={
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={onClose} disabled={isPending}>
                  Huỷ
                </Button>
                <Button
                  disabled={!toPersonId || giftAmount <= 0 || isPending}
                  className="bg-emerald-700 text-white hover:bg-emerald-800"
                  onClick={onSubmit}
                >
                  {isPending ? 'Đang gửi…' : 'Gửi token'}
                </Button>
              </div>
            }
          >
            <div>
              <Label className="text-base font-medium text-neutral-800">Người nhận</Label>
              <div className="mt-1.5">
                <Select
                  options={[{ value: '', label: '— Chọn nhân viên —' }, ...personOptions]}
                  value={toPersonId}
                  onChange={onToPersonIdChange}
                  showSearch
                  showClear
                  placeholder="Chọn nhân viên"
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-medium text-neutral-800">
                Số token <span className="font-normal text-neutral-500">(max {maxGift})</span>
              </Label>
              {chips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {chips.map((n) => {
                    const active = giftAmount === n
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => onGiftAmountChange(n)}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium tabular-nums transition-colors ${
                          active
                            ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-amber-300 hover:bg-amber-50/50'
                        }`}
                      >
                        {n}
                      </button>
                    )
                  })}
                </div>
              )}
              <input
                type="number"
                min={1}
                max={maxGift}
                value={giftAmount}
                onChange={(e) => onGiftAmountChange(Number(e.target.value) || 0)}
                className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-base tabular-nums focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
              <p className="mt-1.5 text-base text-neutral-500">
                ≈ <span className="font-medium text-emerald-700">{formatVnd(giftAmount * tokenToVnd)}</span>
              </p>
            </div>

            <div>
              <Label className="text-base font-medium text-neutral-800">Ghi chú</Label>
              <textarea
                rows={2}
                value={giftNote}
                onChange={(e) => onGiftNoteChange(e.target.value)}
                placeholder="Lý do tặng (tuỳ chọn)"
                className="mt-1.5 w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-base focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>

            {sourceId && (
              <p className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
                Nguồn: Task / Ticket <span className="font-mono text-neutral-700">{sourceId}</span>
              </p>
            )}
          </CelebrateModalShell>
        )}
      </DialogContent>
    </Dialog>
  )
}
