// ============================================================
// Notification type → icon / label mapping (single source of truth)
// ============================================================

import {
  CheckCircle2, AlertCircle, Info, XCircle, Bell, Ticket as TicketIcon,
  UserPlus, UserMinus, RefreshCw, Wallet, HandCoins, CalendarClock,
  CalendarCheck2, FileText, Zap, Inbox, MessageCircle, Package,
  type LucideIcon,
} from 'lucide-react'

export interface NotificationTypeConfig {
  icon: LucideIcon
  bg: string
  text: string
}

export const NOTIFICATION_TYPE_CONFIG: Record<string, NotificationTypeConfig> = {
  SUCCESS: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  ERROR: { icon: XCircle, bg: 'bg-rose-50', text: 'text-rose-600' },
  WARNING: { icon: AlertCircle, bg: 'bg-amber-50', text: 'text-amber-600' },
  INFO: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-600' },
  TICKET_CREATED: { icon: TicketIcon, bg: 'bg-blue-50', text: 'text-blue-600' },
  TICKET_ASSIGNED: { icon: UserPlus, bg: 'bg-primary-50', text: 'text-primary-700' },
  TICKET_UNASSIGNED: { icon: UserMinus, bg: 'bg-neutral-100', text: 'text-neutral-600' },
  TICKET_ASSIGNED_TO_OTHER: { icon: UserPlus, bg: 'bg-blue-50', text: 'text-blue-600' },
  TICKET_STATUS_CHANGED: { icon: RefreshCw, bg: 'bg-violet-50', text: 'text-violet-600' },
  TICKET_COMMENTED: { icon: FileText, bg: 'bg-neutral-100', text: 'text-neutral-600' },
  TICKET_RESOLVED: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  PAYROLL_CONFIRMED: { icon: Wallet, bg: 'bg-blue-50', text: 'text-blue-600' },
  PAYROLL_PAID: { icon: HandCoins, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  PAYROLL_CALCULATED: { icon: Wallet, bg: 'bg-neutral-100', text: 'text-neutral-600' },
  LEAVE_REQUESTED: { icon: CalendarClock, bg: 'bg-amber-50', text: 'text-amber-600' },
  LEAVE_APPROVED: { icon: CalendarCheck2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  LEAVE_REJECTED: { icon: XCircle, bg: 'bg-rose-50', text: 'text-rose-600' },
  LEAD_NEW: { icon: Inbox, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  LEAD_ASSIGNED: { icon: UserPlus, bg: 'bg-primary-50', text: 'text-primary-700' },
  LEAD_IMPORTED: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  ZALO_MESSAGE: { icon: MessageCircle, bg: 'bg-sky-50', text: 'text-sky-600' },
  STOCK_ALERT: { icon: Package, bg: 'bg-amber-50', text: 'text-amber-600' },
  STOCK_LOW: { icon: Package, bg: 'bg-amber-50', text: 'text-amber-600' },
  STOCK_EXPIRY: { icon: AlertCircle, bg: 'bg-amber-50', text: 'text-amber-600' },
  LOW_STOCK: { icon: Package, bg: 'bg-amber-50', text: 'text-amber-600' },
  EXPIRY_SOON: { icon: AlertCircle, bg: 'bg-amber-50', text: 'text-amber-600' },
  URGENT: { icon: Zap, bg: 'bg-rose-100', text: 'text-rose-700' },
}

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  SUCCESS: 'Thành công',
  ERROR: 'Lỗi',
  WARNING: 'Cảnh báo',
  INFO: 'Thông tin',
  TICKET_CREATED: 'Ticket · tạo mới',
  TICKET_ASSIGNED: 'Ticket · giao việc',
  TICKET_UNASSIGNED: 'Ticket · huỷ giao',
  TICKET_ASSIGNED_TO_OTHER: 'Ticket · giao người khác',
  TICKET_STATUS_CHANGED: 'Ticket · đổi trạng thái',
  TICKET_COMMENTED: 'Ticket · bình luận',
  TICKET_RESOLVED: 'Ticket · giải quyết',
  PAYROLL_CONFIRMED: 'Lương · xác nhận',
  PAYROLL_PAID: 'Lương · đã trả',
  PAYROLL_CALCULATED: 'Lương · đã tính',
  LEAVE_REQUESTED: 'Nghỉ · yêu cầu',
  LEAVE_APPROVED: 'Nghỉ · duyệt',
  LEAVE_REJECTED: 'Nghỉ · từ chối',
  LEAD_NEW: 'Lead mới',
  LEAD_ASSIGNED: 'Lead · giao việc',
  LEAD_IMPORTED: 'Lead · import',
  ZALO_MESSAGE: 'Zalo OA',
}

export const DEFAULT_NOTIFICATION_TYPE_CONFIG: NotificationTypeConfig = {
  icon: Bell,
  bg: 'bg-neutral-100',
  text: 'text-neutral-500',
}
