// ============================================================
// DepartmentDetailDrawer — 360-view phòng ban
// Hero gọn + meta badges + Liên hệ CTA + Lãnh đạo + Nhân sự + Phòng con
// ============================================================

import { useMemo } from 'react'
import {
  Users, Mail, Phone, MapPin, Pencil, Power, Building2, Shield,
  UserCheck, ChevronRight, Crown, Star, Plus, GitBranch, Copy,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Drawer, Button, StatusBadge, IconActionButton } from '@frezo/ui'
import { resolveDepartmentStatus } from '../constants/departmentStatus'

interface Props {
  isOpen: boolean
  dept: any | null
  allDepts: any[]
  persons: any[]
  onClose: () => void
  onEdit: (d: any) => void
  onDelete?: (d: any) => void
  onAddChild?: (d: any) => void
  onToggleStatus?: (d: any) => void
  onSelectChild?: (d: any) => void
}

export function DepartmentDetailDrawer({
  isOpen, dept, allDepts, persons, onClose, onEdit, onDelete, onAddChild, onToggleStatus, onSelectChild,
}: Props) {
  const deptMembers = useMemo(
    () => (dept ? persons.filter((p) => p.departmentId === dept.id) : []),
    [dept, persons],
  )

  const manager = useMemo(
    () => (dept?.managerId ? deptMembers.find((p) => p.id === dept.managerId) : null),
    [deptMembers, dept],
  )
  const deputy = useMemo(
    () => (dept?.deputyManagerId ? deptMembers.find((p) => p.id === dept.deputyManagerId) : null),
    [deptMembers, dept],
  )
  const staff = useMemo(
    () =>
      deptMembers.filter(
        (p) => p.id !== dept?.managerId && p.id !== dept?.deputyManagerId,
      ),
    [deptMembers, dept],
  )

  const parent = useMemo(
    () => (dept?.parentId ? allDepts.find((d) => d.id === dept.parentId) : null),
    [dept, allDepts],
  )

  const subDepts = useMemo(
    () => (dept ? allDepts.filter((d) => d.parentId === dept.id) : []),
    [dept, allDepts],
  )

  const activeSubs = subDepts.filter((d) => d.status === 'ACTIVE').length

  const contactFilled = useMemo(() => {
    if (!dept) return 0
    return [dept.email, dept.phone, dept.address].filter(Boolean).length
  }, [dept])

  const contactEmpty = contactFilled === 0

  if (!dept) {
    return <Drawer isOpen={isOpen} onClose={onClose} size="md" title="Chi tiết phòng ban" />
  }

  const statusCfg = resolveDepartmentStatus(dept.status)

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <span className="flex items-center gap-2">
          <Building2 size={16} className="text-primary-600" />
          Phòng ban
          <span className="text-neutral-400 font-mono text-sm">· {dept.code}</span>
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
          {onDelete && (
            <Button
              variant="outline"
              onClick={() => onDelete(dept)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              Xoá
            </Button>
          )}
          <Button
            onClick={() => onEdit(dept)}
            className="bg-primary-600 hover:bg-primary-700 text-white gap-1"
          >
            <Pencil size={13} /> Chỉnh sửa
          </Button>
        </>
      }
    >
      {/* Hero — gọn */}
      <div className="px-5 py-4 border-b border-neutral-100 bg-gradient-to-b from-primary-50/50 to-white">
        <div className="flex items-start gap-3">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${pickTone(dept.name)} flex items-center justify-center font-bold text-white text-lg shrink-0 ring-1 ring-black/5`}>
            {getInitials(dept.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-neutral-900 leading-snug break-words">
              {dept.name || 'Không tên'}
            </h2>
            {dept.organizationName && (
              <div className="text-xs text-neutral-500 mt-0.5 inline-flex items-center gap-1 min-w-0">
                <Building2 size={11} className="shrink-0" />
                <span className="truncate">{dept.organizationName}</span>
              </div>
            )}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <StatusBadge {...statusCfg} />
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-200 rounded">
                <Users size={9} /> {deptMembers.length} thành viên
              </span>
              {subDepts.length > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  <GitBranch size={9} /> {subDepts.length} phòng con
                </span>
              )}
              {!parent && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 rounded">
                  ★ Root
                </span>
              )}
            </div>
          </div>
        </div>

        {parent && (
          <div className="mt-3 flex items-center gap-2 text-xs bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5">
            <GitBranch size={11} className="text-neutral-400 shrink-0" />
            <span className="text-neutral-500 shrink-0">Trực thuộc:</span>
            <button
              type="button"
              onClick={() => onSelectChild?.(parent)}
              className="font-semibold text-primary-700 hover:underline truncate"
            >
              {parent.name}
            </button>
            <span className="text-neutral-300 font-mono ml-auto shrink-0">{parent.code}</span>
          </div>
        )}

        {onToggleStatus && (
          <button
            type="button"
            onClick={() => onToggleStatus(dept)}
            className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold ${
              isActive ? 'text-neutral-500 hover:text-neutral-700' : 'text-emerald-700 hover:text-emerald-800'
            }`}
          >
            <Power size={11} />
            {isActive ? 'Ngừng hoạt động' : 'Kích hoạt lại'}
          </button>
        )}
      </div>

      {/* Liên hệ */}
      <Section
        title="Liên hệ"
        actionText={contactEmpty ? undefined : `${contactFilled}/3 đã cập nhật`}
        action={
          contactEmpty ? (
            <button
              type="button"
              onClick={() => onEdit(dept)}
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
            description="Bổ sung email, điện thoại hoặc địa chỉ để liên lạc nội bộ dễ hơn."
            ctaLabel="Cập nhật liên hệ"
            ctaIcon={Pencil}
            onCta={() => onEdit(dept)}
          />
        ) : (
          <div className="space-y-2">
            <InfoRow icon={Mail} label="Email">
              {dept.email ? (
                <span className="inline-flex items-center gap-1.5">
                  <a href={`mailto:${dept.email}`} className="text-primary-600 hover:underline truncate max-w-[240px]">
                    {dept.email}
                  </a>
                  <CopyButton value={dept.email} />
                </span>
              ) : (
                <Empty />
              )}
            </InfoRow>
            <InfoRow icon={Phone} label="Số điện thoại">
              {dept.phone ? (
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <a href={`tel:${dept.phone}`} className="text-primary-600 hover:underline">{dept.phone}</a>
                  <CopyButton value={dept.phone} />
                </span>
              ) : (
                <Empty />
              )}
            </InfoRow>
            <InfoRow icon={MapPin} label="Địa chỉ">
              {dept.address || <Empty />}
            </InfoRow>
          </div>
        )}
      </Section>

      {/* Ban lãnh đạo */}
      <Section title="Ban lãnh đạo">
        {!manager && !deputy ? (
          <EmptyBlock
            icon={Shield}
            title="Chưa gán trưởng/phó phòng"
            description="Gán lãnh đạo để phân quyền phê duyệt và hiển thị trên sơ đồ nhân sự."
            ctaLabel="Gán lãnh đạo"
            ctaIcon={Pencil}
            onCta={() => onEdit(dept)}
          />
        ) : (
          <div className="space-y-2">
            {manager && <LeaderCard person={manager} role="Trưởng phòng" icon={Crown} tone="amber" />}
            {deputy && <LeaderCard person={deputy} role="Phó phòng" icon={Star} tone="blue" />}
          </div>
        )}
      </Section>

      {/* Nhân viên */}
      <Section
        title={`Nhân viên (${staff.length})`}
        actionText={deptMembers.length > 0 ? `Tổng ${deptMembers.length} người` : undefined}
      >
        {staff.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/60 px-3 py-3 text-center">
            <div className="text-sm text-neutral-500 inline-flex items-center gap-1.5 justify-center">
              <Users size={13} /> Chưa có nhân viên (ngoài lãnh đạo)
            </div>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto -mx-1 pr-1 space-y-0.5">
            {staff.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${pickTone(p.name)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                  {getInitials(p.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-neutral-800 truncate">{p.name}</div>
                  <div className="text-[11px] text-neutral-500 truncate">
                    {p.jobTitle || 'Nhân viên'}{p.email ? ` · ${p.email}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Phòng ban trực thuộc */}
      <Section
        title={`Phòng ban trực thuộc (${subDepts.length})`}
        actionText={subDepts.length > 0 ? `${activeSubs} đang hoạt động` : undefined}
        action={
          onAddChild ? (
            <button
              type="button"
              onClick={() => onAddChild(dept)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 hover:text-primary-800"
            >
              <Plus size={11} /> Thêm
            </button>
          ) : undefined
        }
      >
        {subDepts.length === 0 ? (
          <EmptyBlock
            icon={GitBranch}
            title="Chưa có phòng ban con"
            description="Thêm phòng/ban trực thuộc để phản ánh cấu trúc tổ chức."
            ctaLabel="Thêm phòng ban con"
            onCta={() => onAddChild?.(dept)}
            ctaDisabled={!onAddChild}
          />
        ) : (
          <div className="space-y-1">
            {subDepts.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelectChild?.(d)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/40 transition-all text-left group"
              >
                <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${pickTone(d.name)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                  {getInitials(d.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-neutral-800 group-hover:text-primary-700 truncate">
                    {d.name}
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono">{d.code}</div>
                </div>
                <StatusBadge {...resolveDepartmentStatus(d.status)} compact />
                <ChevronRight size={13} className="text-neutral-300 group-hover:text-primary-500 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </Section>

      {dept.description && (
        <Section title="Mô tả">
          <p className="text-sm text-neutral-700 leading-relaxed">{dept.description}</p>
        </Section>
      )}

      {(dept.createdDate || dept.updatedDate) && (
        <div className="px-5 py-2.5 border-t border-neutral-100 bg-neutral-50/50 text-[11px] text-neutral-400 flex flex-wrap gap-x-4 gap-y-0.5">
          {dept.createdDate && <span>Tạo: {formatDateTime(dept.createdDate)}</span>}
          {dept.updatedDate && <span>Cập nhật: {formatDateTime(dept.updatedDate)}</span>}
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
    <IconActionButton
      tooltip="Sao chép"
      size="sm"
      className="p-0.5"
      onClick={() => { navigator.clipboard.writeText(value); toast.success('Đã copy') }}
    >
      <Copy size={11} />
    </IconActionButton>
  )
}

interface LeaderCardProps {
  person: any
  role: string
  icon: LucideIcon
  tone: 'amber' | 'blue'
}
function LeaderCard({ person, role, icon: Icon, tone }: LeaderCardProps) {
  const toneMap = {
    amber: 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 [&_.badge]:bg-amber-100 [&_.badge]:text-amber-700',
    blue:  'bg-gradient-to-r from-sky-50 to-cyan-50 border-sky-200 [&_.badge]:bg-sky-100 [&_.badge]:text-sky-700',
  }[tone]
  return (
    <div className={`p-2.5 rounded-lg border ${toneMap}`}>
      <div className="flex items-center gap-2.5">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${pickTone(person.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
          {getInitials(person.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="badge inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded">
              <Icon size={9} /> {role}
            </span>
            {person.jobTitle && (
              <span className="text-[10px] text-neutral-500">· {person.jobTitle}</span>
            )}
          </div>
          <div className="text-sm font-bold text-neutral-800 truncate mt-0.5">{person.name}</div>
          {person.email && (
            <div className="text-[11px] text-neutral-500 truncate inline-flex items-center gap-1 mt-0.5">
              <UserCheck size={10} /> {person.email}
            </div>
          )}
        </div>
      </div>
    </div>
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
  // Frezo green SME — tránh purple/pink lệch brand
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
