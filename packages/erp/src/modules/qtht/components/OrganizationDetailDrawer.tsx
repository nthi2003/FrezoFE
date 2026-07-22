// ============================================================
// OrganizationDetailDrawer — 360-view của 1 pháp nhân/chi nhánh
// Hero + Info sections + Danh sách phòng ban con
// ============================================================

import { useMemo } from 'react'
import {
  Building2, Mail, Phone, Globe, MapPin, CreditCard, Users,
  Pencil, Power, Copy, GitBranch, ChevronRight, Layers,
  type LucideIcon, CheckCircle, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Drawer, Button, StatusBadge } from '@frezo/ui'

interface Props {
  isOpen: boolean
  org: any | null
  allOrgs: any[]
  onClose: () => void
  onEdit: (org: any) => void
  onDelete?: (org: any) => void
  onSelectChild?: (child: any) => void
}

const TYPE_LABEL: Record<string, string> = {
  COMPANY: 'Công ty',
  DEPARTMENT: 'Phòng ban',
  BRANCH: 'Chi nhánh',
  AGENCY: 'Đại lý',
  PARTNER: 'Đối tác',
  CUSTOMER: 'Khách hàng',
  SUPPLIER: 'Nhà cung cấp',
  GOVERNMENT: 'Cơ quan nhà nước',
  EDUCATIONAL: 'Giáo dục',
  HOSPITAL: 'Bệnh viện',
  OTHER: 'Khác',
}

const SCALE_LABEL: Record<string, string> = {
  MICRO: 'Siêu nhỏ',
  SMALL: 'Nhỏ',
  MEDIUM: 'Vừa',
  LARGE: 'Lớn',
  ENTERPRISE: 'Doanh nghiệp',
  CORPORATION: 'Tập đoàn',
}

const STATUS_CFG: Record<string, { label: string; color: any; icon: LucideIcon }> = {
  ACTIVE:     { label: 'Hoạt động',   color: 'success', icon: CheckCircle },
  INACTIVE:   { label: 'Ngừng hoạt động', color: 'neutral', icon: Power },
  SUSPENDED:  { label: 'Tạm ngưng',   color: 'warning', icon: AlertCircle },
  MERGED:     { label: 'Đã sáp nhập', color: 'info',    icon: GitBranch },
  ACQUIRED:   { label: 'Đã mua lại',  color: 'info',    icon: GitBranch },
  DISSOLVED:  { label: 'Đã giải thể', color: 'danger',  icon: AlertCircle },
  LIQUIDATED: { label: 'Đã thanh lý', color: 'danger',  icon: AlertCircle },
}

// ============================================================
// Component
// ============================================================

export function OrganizationDetailDrawer({
  isOpen, org, allOrgs, onClose, onEdit, onDelete, onSelectChild,
}: Props) {
  const parent = useMemo(
    () => (org?.parentId ? allOrgs.find((o) => o.id === org.parentId) : null),
    [org, allOrgs],
  )

  const children = useMemo(
    () => (org ? allOrgs.filter((o) => o.parentId === org.id) : []),
    [org, allOrgs],
  )

  const activeChildren = children.filter((c) => c.status === 'ACTIVE').length

  if (!org) {
    return <Drawer isOpen={isOpen} onClose={onClose} size="md" title="Chi tiết tổ chức" />
  }

  const statusCfg = STATUS_CFG[org.status || 'ACTIVE'] || STATUS_CFG.ACTIVE
  const typeLabel = TYPE_LABEL[org.type] || org.type
  const scaleLabel = org.scale ? SCALE_LABEL[org.scale] || org.scale : null
  const initials = getInitials(org.shortName || org.name)

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <span className="flex items-center gap-2">
          <Building2 size={16} className="text-primary-600" />
          {typeLabel}
          <span className="text-neutral-400 font-mono text-sm">· {org.code}</span>
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
          {onDelete && (
            <Button
              variant="outline"
              onClick={() => onDelete(org)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              Xoá
            </Button>
          )}
          <Button
            onClick={() => onEdit(org)}
            className="bg-primary-600 hover:bg-primary-700 text-white gap-1"
          >
            <Pencil size={13} /> Chỉnh sửa
          </Button>
        </>
      }
    >
      {/* Hero */}
      <div className="px-5 py-5 border-b border-neutral-100 bg-gradient-to-b from-primary-50/40 to-white">
        <div className="flex items-start gap-4">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${pickTone(org.name)} flex items-center justify-center font-bold text-white text-xl shadow-md ring-2 ring-white shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-neutral-900 leading-tight break-words">
              {org.name || 'Không tên'}
            </h2>
            {org.nameEn && (
              <div className="text-sm text-neutral-500 italic mt-0.5 truncate">
                {org.nameEn}
              </div>
            )}
            {org.shortName && (
              <div className="text-xs text-neutral-400 mt-0.5">
                Viết tắt: <span className="font-mono font-medium">{org.shortName}</span>
              </div>
            )}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <StatusBadge label={statusCfg.label} color={statusCfg.color} icon={statusCfg.icon} />
              {typeLabel && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded">
                  <Building2 size={9} /> {typeLabel}
                </span>
              )}
              {scaleLabel && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200 rounded">
                  <Layers size={9} /> {scaleLabel}
                </span>
              )}
              {Number(org.level) === 1 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 rounded">
                  ★ Chủ quản
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Parent context */}
        {parent && (
          <div className="mt-4 flex items-center gap-2 text-xs bg-white border border-neutral-200 rounded-lg px-3 py-2">
            <GitBranch size={11} className="text-neutral-400 shrink-0" />
            <span className="text-neutral-500 shrink-0">Trực thuộc:</span>
            <button
              onClick={() => onSelectChild?.(parent)}
              className="font-semibold text-primary-700 hover:underline truncate"
            >
              {parent.name}
            </button>
            <span className="text-neutral-300 font-mono ml-auto shrink-0">{parent.code}</span>
          </div>
        )}
      </div>

      {/* Contact info */}
      <Section title="Liên hệ">
        <InfoRow icon={CreditCard} label="Mã số thuế">
          {org.taxCode ? <span className="font-mono">{org.taxCode}</span> : <Empty />}
        </InfoRow>
        <InfoRow icon={Mail} label="Email">
          {org.email ? (
            <span className="inline-flex items-center gap-1.5">
              <a href={`mailto:${org.email}`} className="text-primary-600 hover:underline truncate max-w-[240px]">
                {org.email}
              </a>
              <CopyButton value={org.email} />
            </span>
          ) : (
            <Empty />
          )}
        </InfoRow>
        <InfoRow icon={Phone} label="Số điện thoại">
          {org.phone ? (
            <span className="inline-flex items-center gap-1.5 font-mono">
              <a href={`tel:${org.phone}`} className="text-primary-600 hover:underline">{org.phone}</a>
              <CopyButton value={org.phone} />
            </span>
          ) : (
            <Empty />
          )}
        </InfoRow>
        <InfoRow icon={Globe} label="Website">
          {org.website ? (
            <a href={ensureHttp(org.website)} target="_blank" rel="noreferrer"
               className="text-primary-600 hover:underline truncate max-w-[240px] inline-block">
              {org.website}
            </a>
          ) : (
            <Empty />
          )}
        </InfoRow>
        <InfoRow icon={MapPin} label="Địa chỉ">
          {org.address || <Empty />}
        </InfoRow>
      </Section>

      {/* Description */}
      {org.description && (
        <Section title="Mô tả">
          <p className="text-sm text-neutral-700 leading-relaxed">{org.description}</p>
        </Section>
      )}

      {/* Children */}
      <Section
        title={`Đơn vị trực thuộc (${children.length})`}
        actionText={
          children.length > 0
            ? `${activeChildren} đang hoạt động`
            : undefined
        }
      >
        {children.length === 0 ? (
          <div className="py-3 text-sm text-neutral-400 italic flex items-center gap-2">
            <Users size={12} /> Chưa có đơn vị con nào trực thuộc
          </div>
        ) : (
          <div className="space-y-1.5">
            {children.map((c) => {
              const cStatus = STATUS_CFG[c.status || 'ACTIVE'] || STATUS_CFG.ACTIVE
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectChild?.(c)}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all text-left group"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${pickTone(c.name)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                    {getInitials(c.shortName || c.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-neutral-800 group-hover:text-primary-700 truncate">
                      {c.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-neutral-500">
                      <span className="font-mono">{c.code}</span>
                      <span className="text-neutral-300">·</span>
                      <span>{TYPE_LABEL[c.type] || c.type}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                    cStatus.color === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                  }`}>
                    {cStatus.label}
                  </span>
                  <ChevronRight size={13} className="text-neutral-300 group-hover:text-primary-500" />
                </button>
              )
            })}
          </div>
        )}
      </Section>

      {/* Metadata */}
      {(org.createdDate || org.updatedDate) && (
        <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/40 text-[11px] text-neutral-400 space-y-0.5">
          {org.createdDate && <div>Tạo: {formatDateTime(org.createdDate)}</div>}
          {org.updatedDate && <div>Cập nhật: {formatDateTime(org.updatedDate)}</div>}
        </div>
      )}
    </Drawer>
  )
}

// ============================================================
// Sub-components
// ============================================================

function Section({
  title, children, actionText,
}: {
  title: string
  children: React.ReactNode
  actionText?: string
}) {
  return (
    <div className="px-5 py-4 border-b border-neutral-100 last:border-b-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5 flex items-center justify-between">
        <span>{title}</span>
        {actionText && <span className="text-neutral-400 normal-case font-normal">{actionText}</span>}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function InfoRow({
  icon: Icon, label, children,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={12} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{label}</div>
        <div className="text-sm text-neutral-800 font-medium mt-0.5 min-w-0 break-words">{children}</div>
      </div>
    </div>
  )
}

function Empty() {
  return <span className="text-neutral-300 italic text-sm">Chưa cập nhật</span>
}

function CopyButton({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(value); toast.success('Đã copy') }}
      className="p-0.5 text-neutral-400 hover:text-primary-600 rounded"
      title="Copy"
    >
      <Copy size={11} />
    </button>
  )
}

// ============================================================
// Helpers
// ============================================================

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function pickTone(seed?: string): string {
  const tones = [
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-orange-500 to-rose-600',
    'from-pink-500 to-fuchsia-600',
    'from-cyan-500 to-blue-600',
    'from-amber-500 to-orange-600',
    'from-lime-500 to-emerald-600',
  ]
  const s = (seed || '?').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return tones[s % tones.length]
}

function ensureHttp(url: string): string {
  if (!url) return '#'
  return /^https?:\/\//.test(url) ? url : `https://${url}`
}

function formatDateTime(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return String(iso)
  }
}
