// Trạng thái hiển thị (presence) — FE-only, lưu localStorage

export type PresenceStatus = 'available' | 'working' | 'busy' | 'away'

export interface PresenceOption {
  value: PresenceStatus
  label: string
  /** Tailwind bg class cho chấm trạng thái */
  dotClass: string
  /** Hiệu ứng pulse nhẹ (vd. đang làm việc) */
  pulse?: boolean
}

export const PRESENCE_OPTIONS: PresenceOption[] = [
  { value: 'available', label: 'Sẵn sàng', dotClass: 'bg-primary-500' },
  { value: 'working', label: 'Đang làm việc', dotClass: 'bg-info', pulse: true },
  { value: 'busy', label: 'Bận', dotClass: 'bg-danger' },
  { value: 'away', label: 'Tạm vắng', dotClass: 'bg-warning' },
]

export const DEFAULT_PRESENCE: PresenceStatus = 'available'

const optionMap = new Map(PRESENCE_OPTIONS.map((o) => [o.value, o]))

export function getPresenceOption(status: PresenceStatus): PresenceOption {
  return optionMap.get(status) ?? PRESENCE_OPTIONS[0]
}
