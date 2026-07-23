// ============================================================
// OrganizationDetailDrawer — 360-view pháp nhân/chi nhánh
// Hero meta hierarchy (status → loại/quy mô → trực thuộc) + empty CTA + footer
// ============================================================

import { useMemo } from 'react'
import {
  Building2, Mail, Phone, Globe, MapPin, CreditCard, Users,
  Pencil, Power, Copy, GitBranch, ChevronRight, Layers, Plus,
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
  onAddChild?: (org: any) => void
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
  isOpen, org, allOrgs, onClose, onEdit, onDelete, onAddChild, onSelectChild,
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

  const contactFilled = useMemo(() => {
    if (!org) return 0
    return [org.taxCode, org.email, org.phone, org.website, org.address].filter(Boolean).length
  }, [org])

  const contactEmpty = contactFilled === 0

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
      {/* Hero — meta hierarchy SME */}
      <div className="px-5 pt-4 pb-3.5 border-b border-neutral-100 bg-gradient-to-b from-primary-50/40 to-white">
        <div className="flex items-start gap-3.5">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${pickTone(org.name)} flex items-center justify-center font-bold text-white text-lg shrink-0 ring-1 ring-black/5`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 leading-snug break-words">
                {org.name || 'Không tên'}
              </h2>
              {(org.nameEn || org.shortName) && (
                <div className="text-xs text-neutral-500 mt-0.5 truncate">
                  {org.nameEn || null}
                  {org.nameEn && org.shortName ? ' · ' : null}
                  {org.shortName ? (
                    <span className="font-mono text-neutral-500">{org.shortName}</span>
                  ) : null}
                </div>
              )}
            </div>

            {/* Tầng 1: trạng thái (semantic) + cờ chủ quản nếu có */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge label={statusCfg.label} color={statusCfg.color} icon={statusCfg.icon} />
              {Number(org.level) === 1 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-md">
                  ★ Chủ quản
                </span>
              )}
            </div>

            {/* Tầng 2: loại · quy mô — typography meta, không chồng badge */}
            {(typeLabel || scaleLabel) && (
              <div className="flex items-center gap-x-2.5 gap-y-1 flex-wrap text-xs text-neutral-700">
                {typeLabel && (
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Building2 size={12} className="text-primary-600 shrink-0" strokeWidth={2.25} />
                    {typeLabel}
                  </span>
                )}
                {typeLabel && scaleLabel && (
                  <span className="text-neutral-300 select-none" aria-hidden>|</span>
                )}
                {scaleLabel && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-neutral-600">
                    <Layers size={12} className="text-neutral-500 shrink-0" strokeWidth={2.25} />
                    Quy mô {scaleLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Trực thuộc — label rõ + link parent (không mờ) */}
        {parent && (
          <button
            type="button"
            onClick={() => onSelectChild?.(parent)}
            disabled={!onSelectChild}
            className="mt-3 w-full flex items-center gap-2 rounded-lg border border-primary-200/80 bg-white px-3 py-2 text-left transition hover:border-primary-300 hover:bg-primary-50/50 disabled:cursor-default disabled:hover:bg-white disabled:hover:border-primary-200/80 group"
          >
            <GitBranch size={14} className="text-primary-600 shrink-0" strokeWidth={2.25} />
            <span className="text-xs font-medium text-neutral-600 shrink-0">Trực thuộc</span>
            <span className="text-sm font-semibold text-primary-700 truncate group-hover:underline underline-offset-2">
              {parent.name}
            </span>
            {parent.code && (
              <span className="text-[11px] font-mono text-neutral-500 ml-auto shrink-0">{parent.code}</span>
            )}
            {onSelectChild && (
              <ChevronRight size={14} className="text-primary-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            )}
          </button>
        )}
      </div>

      {/* Liên hệ */}
      <Section
        title="Liên hệ"
        actionText={contactEmpty ? undefined : `${contactFilled}/5 đã cập nhật`}
        action={
          contactEmpty ? (
            <button
              type="button"
              onClick={() => onEdit(org)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 hover:text-primary-800"
            >
              <Pencil size={11} /> Cập nhật liên hệ
            </button>
          ) : undefined
        }
      >
        {contactEmpty ? (
          <EmptyBlock
            icon={Mail}
            title="Chưa có thông tin liên hệ"
            description="Bổ sung MST, email, điện thoại, website hoặc địa chỉ để vận hành dễ hơn."
            ctaLabel="Cập nhật liên hệ"
            ctaIcon={Pencil}
            onCta={() => onEdit(org)}
          />
        ) : (
          <div className="space-y-2">
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
          </div>
        )}
      </Section>

      {org.description && (
        <Section title="Mô tả">
          <p className="text-sm text-neutral-700 leading-relaxed">{org.description}</p>
        </Section>
      )}

      {/* Đơn vị trực thuộc */}
      <Section
        title={`Đơn vị trực thuộc (${children.length})`}
        actionText={
          children.length > 0 ? `${activeChildren} đang hoạt động` : undefined
        }
        action={
          onAddChild ? (
            <button
              type="button"
              onClick={() => onAddChild(org)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 hover:text-primary-800"
            >
              <Plus size={11} /> Thêm
            </button>
          ) : undefined
        }
      >
        {children.length === 0 ? (
          <EmptyBlock
            icon={Users}
            title="Chưa có đơn vị con"
            description="Thêm chi nhánh, phòng ban hoặc đơn vị trực thuộc dưới pháp nhân này."
            ctaLabel="Thêm đơn vị con"
            onCta={() => onAddChild?.(org)}
            ctaDisabled={!onAddChild}
          />
        ) : (
          <div className="space-y-1">
            {children.map((c) => {
              const cStatus = STATUS_CFG[c.status || 'ACTIVE'] || STATUS_CFG.ACTIVE
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectChild?.(c)}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/40 transition-all text-left group"
                >
                  <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${pickTone(c.name)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                    {getInitials(c.shortName || c.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-neutral-800 group-hover:text-primary-700 truncate">
                      {c.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-px text-[11px] text-neutral-500">
                      <span className="font-mono">{c.code}</span>
                      <span className="text-neutral-300">·</span>
                      <span>{TYPE_LABEL[c.type] || c.type}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border ${
                    cStatus.color === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                  }`}>
                    {cStatus.label}
                  </span>
                  <ChevronRight size={13} className="text-neutral-300 group-hover:text-primary-500 shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </Section>

      {(org.createdDate || org.updatedDate) && (
        <div className="px-5 py-2.5 border-t border-neutral-100 bg-neutral-50/50 text-[11px] text-neutral-400 flex flex-wrap gap-x-4 gap-y-0.5">
          {org.createdDate && <span>Tạo: {formatDateTime(org.createdDate)}</span>}
          {org.updatedDate && <span>Cập nhật: {formatDateTime(org.updatedDate)}</span>}
        </div>
      )}
    </Drawer>
  )
}

// ============================================================
// Sub-components
// ============================================================

function Section({
  title, children, actionText, action,
}: {
  title: string
  children: React.ReactNode
  actionText?: string
  action?: React.ReactNode
}) {
  return (
    <div className="px-5 py-3.5 border-b border-neutral-100 last:border-b-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2 flex items-center justify-between gap-2">
        <span>{title}</span>
        <div className="flex items-center gap-2">
          {actionText && (
            <span className="text-neutral-400 normal-case font-normal tracking-normal">{actionText}</span>
          )}
          {action}
        </div>
      </div>
      {children}
    </div>
  )
}

function EmptyBlock({
  icon: Icon, title, description, ctaLabel, onCta, ctaDisabled, ctaIcon: CtaIcon = Plus,
}: {
  icon: LucideIcon
  title: string
  description: string
  ctaLabel: string
  onCta: () => void
  ctaDisabled?: boolean
  ctaIcon?: LucideIcon
}) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/60 px-3 py-4 text-center">
      <div className="mx-auto w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 mb-2">
        <Icon size={14} />
      </div>
      <div className="text-sm font-semibold text-neutral-700">{title}</div>
      <p className="text-xs text-neutral-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
        {description}
      </p>
      {!ctaDisabled && (
        <button
          type="button"
          onClick={onCta}
          className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white transition"
        >
          <CtaIcon size={12} /> {ctaLabel}
        </button>
      )}
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
    <div className="flex items-start gap-2.5">
      <div className="w-6 h-6 rounded-md bg-neutral-100 text-neutral-500 flex items-center justify-center shrink-0 mt-0.5">
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
    'from-primary-500 to-emerald-600',
    'from-teal-500 to-emerald-700',
    'from-emerald-600 to-green-700',
    'from-lime-600 to-emerald-600',
    'from-cyan-600 to-teal-700',
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
