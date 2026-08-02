// ============================================================
// Config maps chung cho module Assets (QLTS)
// ============================================================
import type { LucideIcon } from 'lucide-react'
import {
  Laptop, Monitor, Smartphone, Printer, Armchair, Car, HardDrive, Package,
  Archive,
} from 'lucide-react'
import { formatCurrency } from '@frezo/utils'
import type { AssetStatus, TransferStatus, TransferType } from '../services/assetApi'

// ---- Status meta ----

export const STATUS_META: Record<
  AssetStatus,
  { label: string; short: string; tone: string; dot: string }
> = {
  AVAILABLE: {
    label: 'Sẵn sàng cấp phát', short: 'Sẵn sàng',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500',
  },
  IN_USE: {
    label: 'Đang sử dụng', short: 'Đang dùng',
    tone: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500',
  },
  MAINTENANCE: {
    label: 'Đang bảo trì', short: 'Bảo trì',
    tone: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500',
  },
  BROKEN: {
    label: 'Hỏng', short: 'Hỏng',
    tone: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500',
  },
  DISPOSED: {
    label: 'Đã thanh lý', short: 'Thanh lý',
    tone: 'bg-neutral-100 text-neutral-600 border-neutral-200', dot: 'bg-neutral-400',
  },
  LOST: {
    label: 'Mất', short: 'Mất',
    tone: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500',
  },
}

// ---- Category → icon mapping ----

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  LAPTOP: Laptop,
  PC: HardDrive,
  MONITOR: Monitor,
  PHONE: Smartphone,
  PRINTER: Printer,
  DESK: Package,
  CHAIR: Armchair,
  CABINET: Archive,
  VEHICLE: Car,
  OTHER: Package,
}

export function getCategoryIcon(code?: string | null): LucideIcon {
  if (!code) return Package
  return CATEGORY_ICONS[code] || Package
}

// ---- Money format (VND) — full dùng @frezo/utils; compact giữ B/M/K cho card ----

export function fmtMoney(value?: number | null): string {
  if (value == null) return '—'
  const v = Number(value)
  if (isNaN(v)) return '—'
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B ₫`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ₫`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K ₫`
  return formatCurrency(v)
}

export function fmtMoneyFull(value?: number | null): string {
  return formatCurrency(value)
}

// ---- Date format ----

export function fmtDate(iso?: string | null): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}

// ---- Workflow transfer meta ----

export const TRANSFER_STATUS_META: Record<
  TransferStatus,
  { label: string; short: string; tone: string; dot: string }
> = {
  PENDING: {
    label: 'Chờ duyệt', short: 'Chờ duyệt',
    tone: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500',
  },
  APPROVED: {
    label: 'Đã duyệt — chờ bàn giao', short: 'Chờ bàn giao',
    tone: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500',
  },
  HANDED_OVER: {
    label: 'Đã bàn giao', short: 'Đã bàn giao',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Từ chối', short: 'Từ chối',
    tone: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500',
  },
  CANCELLED: {
    label: 'Đã huỷ', short: 'Huỷ',
    tone: 'bg-neutral-100 text-neutral-600 border-neutral-200', dot: 'bg-neutral-400',
  },
}

export const TRANSFER_TYPE_LABEL: Record<TransferType, string> = {
  ASSIGN: 'Cấp phát',
  RETURN: 'Thu hồi',
}

export function daysUntil(iso?: string | null): number | null {
  if (!iso) return null
  try {
    const d = new Date(iso)
    return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}
