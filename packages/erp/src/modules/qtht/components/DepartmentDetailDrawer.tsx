// ============================================================
// DepartmentDetailDrawer — 360-view của phòng ban
// Hero + Manager/Deputy + Staff list + Sub-departments
// ============================================================

import { useMemo } from 'react'
import {
  Users, Mail, Phone, MapPin, Pencil, Power, Building2, Shield,
  UserCheck, ChevronRight, Crown, Star,
  type LucideIcon,
} from 'lucide-react'
import { Drawer, Button, StatusBadge } from '@frezo/ui'

interface Props {
  isOpen: boolean
  dept: any | null
  allDepts: any[]
  persons: any[]
  onClose: () => void
  onEdit: (d: any) => void
  onToggleStatus?: (d: any) => void
  onSelectChild?: (d: any) => void
}

export function DepartmentDetailDrawer({
  isOpen, dept, allDepts, persons, onClose, onEdit, onToggleStatus, onSelectChild,
}: Props) {
  // Members of this dept
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

  // Parent dept
  const parent = useMemo(
    () => (dept?.parentId ? allDepts.find((d) => d.id === dept.parentId) : null),
    [dept, allDepts],
  )

  // Sub-departments
  const subDepts = useMemo(
    () => (dept ? allDepts.filter((d) => d.parentId === dept.id) : []),
    [dept, allDepts],
  )

  if (!dept) return <Drawer isOpen={isOpen} onClose={onClose} size="md" title="Chi tiết phòng ban" />

  const isActive = dept.status === 'ACTIVE'

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
          {onToggleStatus && (
            <Button
              variant="outline"
              onClick={() => onToggleStatus(dept)}
              className={isActive ? 'text-neutral-600' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}
            >
              <Power size={13} className="mr-1" />
              {isActive ? 'Ngừng hoạt động' : 'Kích hoạt lại'}
            </Button>
          )}
          <Button
            onClick={() => onEdit(dept)}
            className="bg-primary-700 hover:bg-primary-800 text-white gap-1"
          >
            <Pencil size={13} /> Chỉnh sửa
          </Button>
        </>
      }
    >
      {/* Hero */}
      <div className="px-5 py-5 border-b border-neutral-100 bg-gradient-to-b from-emerald-50/40 to-white">
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pickTone(dept.name)} flex items-center justify-center font-bold text-white text-lg shadow-md ring-2 ring-white shrink-0`}>
            {getInitials(dept.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-neutral-900 leading-tight break-words">
              {dept.name}
            </h2>
            {dept.organizationName && (
              <div className="text-xs text-neutral-500 mt-0.5 inline-flex items-center gap-1">
                <Building2 size={11} /> {dept.organizationName}
              </div>
            )}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <StatusBadge
                label={isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                color={isActive ? 'success' : 'neutral'}
              />
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded">
                <Users size={9} /> {deptMembers.length} thành viên
              </span>
              {subDepts.length > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200 rounded">
                  {subDepts.length} phòng con
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Parent context */}
        {parent && (
          <div className="mt-4 flex items-center gap-2 text-xs bg-white border border-neutral-200 rounded-lg px-3 py-2">
            <Building2 size={11} className="text-neutral-400 shrink-0" />
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
        <InfoRow icon={Mail} label="Email">
          {dept.email ? (
            <a href={`mailto:${dept.email}`} className="text-primary-600 hover:underline truncate inline-block max-w-[240px]">
              {dept.email}
            </a>
          ) : (
            <Empty />
          )}
        </InfoRow>
        <InfoRow icon={Phone} label="Số điện thoại">
          {dept.phone ? (
            <a href={`tel:${dept.phone}`} className="text-primary-600 hover:underline font-mono">
              {dept.phone}
            </a>
          ) : (
            <Empty />
          )}
        </InfoRow>
        <InfoRow icon={MapPin} label="Địa chỉ">
          {dept.address || <Empty />}
        </InfoRow>
      </Section>

      {/* Leadership */}
      <Section title="Ban lãnh đạo">
        {!manager && !deputy ? (
          <div className="py-2 text-sm text-neutral-400 italic flex items-center gap-2">
            <Shield size={12} /> Chưa gán trưởng/phó phòng
          </div>
        ) : (
          <div className="space-y-2">
            {manager && <LeaderCard person={manager} role="Trưởng phòng" icon={Crown} tone="amber" />}
            {deputy && <LeaderCard person={deputy} role="Phó phòng" icon={Star} tone="blue" />}
          </div>
        )}
      </Section>

      {/* Staff list */}
      <Section
        title={`Nhân viên (${staff.length})`}
        actionText={
          deptMembers.length > 0 ? `Tổng ${deptMembers.length} người` : undefined
        }
      >
        {staff.length === 0 ? (
          <div className="py-2 text-sm text-neutral-400 italic flex items-center gap-2">
            <Users size={12} /> Chưa có nhân viên nào
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto -mx-1 pr-1 space-y-1">
            {staff.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${pickTone(p.name)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
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

      {/* Sub-departments */}
      {subDepts.length > 0 && (
        <Section title={`Phòng ban trực thuộc (${subDepts.length})`}>
          <div className="space-y-1.5">
            {subDepts.map((d) => (
              <button
                key={d.id}
                onClick={() => onSelectChild?.(d)}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all text-left group"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${pickTone(d.name)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                  {getInitials(d.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-neutral-800 group-hover:text-primary-700 truncate">
                    {d.name}
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono">{d.code}</div>
                </div>
                <StatusBadge
                  label={d.status === 'ACTIVE' ? 'Bật' : 'Tắt'}
                  color={d.status === 'ACTIVE' ? 'success' : 'neutral'}
                />
                <ChevronRight size={13} className="text-neutral-300 group-hover:text-primary-500" />
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Description */}
      {dept.description && (
        <Section title="Mô tả">
          <p className="text-sm text-neutral-700 leading-relaxed">{dept.description}</p>
        </Section>
      )}

      {/* Metadata */}
      {(dept.createdDate || dept.updatedDate) && (
        <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/40 text-[11px] text-neutral-400 space-y-0.5">
          {dept.createdDate && <div>Tạo: {formatDateTime(dept.createdDate)}</div>}
          {dept.updatedDate && <div>Cập nhật: {formatDateTime(dept.updatedDate)}</div>}
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
        {actionText && (
          <span className="text-neutral-400 normal-case font-normal">{actionText}</span>
        )}
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

interface LeaderCardProps {
  person: any
  role: string
  icon: LucideIcon
  tone: 'amber' | 'blue'
}
function LeaderCard({ person, role, icon: Icon, tone }: LeaderCardProps) {
  const toneMap = {
    amber: 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 [&_.badge]:bg-amber-100 [&_.badge]:text-amber-700',
    blue:  'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 [&_.badge]:bg-blue-100 [&_.badge]:text-blue-700',
  }[tone]
  return (
    <div className={`p-3 rounded-xl border ${toneMap}`}>
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${pickTone(person.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
          {getInitials(person.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
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
  const tones = [
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-orange-500 to-rose-600',
    'from-pink-500 to-fuchsia-600',
    'from-cyan-500 to-blue-600',
    'from-amber-500 to-orange-600',
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
