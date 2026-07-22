// ============================================================
// PersonDetailDrawer — Employee 360-view (BambooHR / Workday-style)
// Đọc-nhanh, không edit inline. Sửa → chuyển sang modal edit riêng.
// ============================================================

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Mail, Phone, MapPin, CreditCard, Cake, User as UserIcon, Building2,
  Briefcase, Calendar, Pencil, FileText, Power, Copy, Sparkles,
  type LucideIcon, CheckCircle, Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Drawer, Button, StatusBadge } from '@frezo/ui'
import { contractApi } from '@/modules/qlns/services/contractApi'
import { unwrapList } from '@frezo/utils'

interface Props {
  isOpen: boolean
  person: any | null
  onClose: () => void
  onEdit?: (person: any) => void
  onToggleActive?: (person: any) => void
}

// ============================================================
// Component
// ============================================================

export function PersonDetailDrawer({ isOpen, person, onClose, onEdit, onToggleActive }: Props) {
  const { data: contractsData, isLoading: loadingContracts } = useQuery({
    queryKey: ['contracts', 'by-person', person?.id],
    queryFn: () => contractApi.getAll({ personId: person.id }),
    enabled: isOpen && !!person?.id,
    select: unwrapList,
  })

  const contracts: any[] = useMemo(() => {
    const list = Array.isArray(contractsData) ? contractsData : []
    // Sort mới nhất trước
    return [...list].sort((a: any, b: any) => {
      const da = a.startDate ? new Date(a.startDate).getTime() : 0
      const db = b.startDate ? new Date(b.startDate).getTime() : 0
      return db - da
    })
  }, [contractsData])

  const activeContract = contracts.find((c) => c.status === 'ACTIVE')

  if (!person) {
    return (
      <Drawer isOpen={isOpen} onClose={onClose} size="md" title="Chi tiết nhân viên" />
    )
  }

  const initials = getInitials(person.name)
  const age = person.birthDate ? calcAge(person.birthDate) : null
  const seniority = calcSeniority(activeContract?.startDate)

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={<span className="flex items-center gap-2">Hồ sơ nhân viên · <span className="font-mono text-sm text-neutral-500">{person.code}</span></span>}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
          {onToggleActive && (
            <Button
              variant="outline"
              onClick={() => onToggleActive(person)}
              className={person.activated ? 'text-rose-600 border-rose-200 hover:bg-rose-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}
            >
              <Power size={13} className="mr-1" />
              {person.activated ? 'Ngưng hoạt động' : 'Kích hoạt lại'}
            </Button>
          )}
          {onEdit && (
            <Button
              onClick={() => onEdit(person)}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Pencil size={13} className="mr-1" /> Chỉnh sửa
            </Button>
          )}
        </>
      }
    >
      {/* Hero header */}
      <div className="px-5 py-5 border-b border-neutral-100 bg-gradient-to-b from-primary-50/50 to-white">
        <div className="flex items-start gap-4">
          {person.avatar ? (
            <img
              src={person.avatar}
              alt={person.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
            />
          ) : (
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-md ring-2 ring-white ${
                person.gender === 'FEMALE'
                  ? 'bg-gradient-to-br from-pink-500 to-rose-600'
                  : 'bg-gradient-to-br from-primary-500 to-primary-700'
              }`}
            >
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-neutral-900 leading-tight truncate">
                {person.name || 'Chưa đặt tên'}
              </h3>
              {person.isAdmin && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded">
                  <Sparkles size={9} /> Admin
                </span>
              )}
            </div>
            {person.jobTitle && (
              <div className="text-sm text-neutral-600 font-medium mt-0.5 truncate flex items-center gap-1">
                <Briefcase size={12} className="text-neutral-400" />
                {person.jobTitle}
              </div>
            )}
            {(person.departmentName || person.orgName) && (
              <div className="text-xs text-neutral-500 mt-0.5 truncate flex items-center gap-1">
                <Building2 size={11} className="text-neutral-400" />
                {person.departmentName || person.orgName}
                {person.departmentName && person.orgName && (
                  <span className="text-neutral-300"> · {person.orgName}</span>
                )}
              </div>
            )}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <StatusBadge
                label={person.activated ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                color={person.activated ? 'success' : 'neutral'}
                icon={person.activated ? CheckCircle : Clock}
              />
              {seniority && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500">
                  <Calendar size={10} /> {seniority}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <Section title="Thông tin liên hệ">
        <InfoRow icon={Mail} label="Email">
          {person.email ? (
            <span className="inline-flex items-center gap-1.5">
              <a
                href={`mailto:${person.email}`}
                className="text-primary-600 hover:underline truncate max-w-[260px]"
                title={person.email}
              >
                {person.email}
              </a>
              <CopyButton value={person.email} />
            </span>
          ) : (
            <EmptyValue />
          )}
        </InfoRow>

        <InfoRow icon={Phone} label="Số điện thoại">
          {person.phone ? (
            <span className="inline-flex items-center gap-1.5 font-mono">
              <a href={`tel:${person.phone}`} className="text-primary-600 hover:underline">
                {person.phone}
              </a>
              <CopyButton value={person.phone} />
            </span>
          ) : (
            <EmptyValue />
          )}
        </InfoRow>

        <InfoRow icon={CreditCard} label="CCCD / CMND">
          {person.identityNumber ? (
            <span className="font-mono">{person.identityNumber}</span>
          ) : (
            <EmptyValue />
          )}
        </InfoRow>

        <InfoRow icon={MapPin} label="Địa chỉ">
          {person.address ? <span>{person.address}</span> : <EmptyValue />}
        </InfoRow>
      </Section>

      {/* Personal info */}
      <Section title="Thông tin cá nhân">
        <InfoRow icon={UserIcon} label="Giới tính">
          {person.gender ? formatGender(person.gender) : <EmptyValue />}
        </InfoRow>
        <InfoRow icon={Cake} label="Ngày sinh">
          {person.birthDate ? (
            <span>
              {formatDate(person.birthDate)}
              {age !== null && (
                <span className="text-neutral-400 ml-2">· {age} tuổi</span>
              )}
            </span>
          ) : (
            <EmptyValue />
          )}
        </InfoRow>
      </Section>

      {/* Active contract */}
      <Section title="Hợp đồng lao động">
        {loadingContracts ? (
          <div className="py-4 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-3 text-sm text-neutral-400 italic">
            Chưa có hợp đồng nào
          </div>
        ) : (
          <div className="space-y-2">
            {contracts.slice(0, 3).map((c) => (
              <ContractCard key={c.id} contract={c} isActive={c.id === activeContract?.id} />
            ))}
            {contracts.length > 3 && (
              <div className="text-xs text-neutral-400 text-center pt-1">
                + {contracts.length - 3} hợp đồng cũ hơn
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Footer meta */}
      {(person.createdDate || person.updatedDate) && (
        <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/40 text-[11px] text-neutral-400 space-y-0.5">
          {person.createdDate && (
            <div>Tạo lúc: {formatDateTime(person.createdDate)}</div>
          )}
          {person.updatedDate && (
            <div>Cập nhật: {formatDateTime(person.updatedDate)}</div>
          )}
        </div>
      )}
    </Drawer>
  )
}

// ============================================================
// Sub-components
// ============================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-b border-neutral-100">
      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
        {title}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  children,
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
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          {label}
        </div>
        <div className="text-sm text-neutral-800 font-medium mt-0.5 min-w-0 break-words">
          {children}
        </div>
      </div>
    </div>
  )
}

function ContractCard({ contract, isActive }: { contract: any; isActive: boolean }) {
  return (
    <div
      className={`p-3 rounded-xl border transition-colors ${
        isActive
          ? 'bg-emerald-50/50 border-emerald-200'
          : 'bg-white border-neutral-200 hover:border-neutral-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <FileText size={13} className={isActive ? 'text-emerald-600' : 'text-neutral-400'} />
            <span className="font-mono text-xs font-bold text-neutral-700 truncate">
              {contract.code || 'No code'}
            </span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5 truncate">
            {contract.type || 'Chưa xác định loại'}
          </div>
        </div>
        <ContractStatusBadge status={contract.status} />
      </div>
      <div className="flex items-center gap-3 text-[11px] text-neutral-500 pt-1.5 border-t border-neutral-100">
        <span className="inline-flex items-center gap-1">
          <Calendar size={9} />
          {formatDate(contract.startDate)}
          {contract.endDate ? ' → ' + formatDate(contract.endDate) : ' → nay'}
        </span>
        {contract.basicSalary != null && (
          <span className="ml-auto font-semibold text-neutral-700 tabular-nums">
            {Number(contract.basicSalary).toLocaleString('vi-VN')}₫
          </span>
        )}
      </div>
    </div>
  )
}

function ContractStatusBadge({ status }: { status?: string }) {
  const cfg: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: 'Hiệu lực', className: 'bg-emerald-100 text-emerald-700' },
    PENDING_APPROVAL: { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-700' },
    DRAFT: { label: 'Nháp', className: 'bg-neutral-100 text-neutral-600' },
    COMPLETED: { label: 'Kết thúc', className: 'bg-blue-100 text-blue-700' },
    CANCELLED: { label: 'Hủy', className: 'bg-rose-100 text-rose-700' },
  }
  const s = cfg[status || 'DRAFT'] || cfg.DRAFT
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${s.className}`}>
      {s.label}
    </span>
  )
}

function EmptyValue() {
  return <span className="text-neutral-300 italic text-sm">Chưa cập nhật</span>
}

function CopyButton({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value)
        toast.success('Đã copy')
      }}
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
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function calcAge(birthDate: string): number | null {
  try {
    const d = new Date(birthDate)
    if (isNaN(d.getTime())) return null
    const now = new Date()
    let age = now.getFullYear() - d.getFullYear()
    const m = now.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
    return age
  } catch {
    return null
  }
}

function calcSeniority(startDate?: string): string | null {
  if (!startDate) return null
  try {
    const d = new Date(startDate)
    if (isNaN(d.getTime())) return null
    const diffMs = Date.now() - d.getTime()
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (days < 0) return null
    if (days < 30) return `Vào làm ${days} ngày`
    const months = Math.floor(days / 30)
    if (months < 12) return `Thâm niên ${months} tháng`
    const years = (days / 365).toFixed(1)
    return `Thâm niên ${years} năm`
  } catch {
    return null
  }
}

function formatGender(g: string): string {
  const map: Record<string, string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' }
  return map[g] || g
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return String(iso)
  }
}

function formatDateTime(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(iso)
  }
}
