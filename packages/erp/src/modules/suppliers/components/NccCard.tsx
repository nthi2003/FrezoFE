import {
  Phone, MapPin, User, Sprout, Weight, Award, Building2,
} from 'lucide-react'
import { RowActions } from '@frezo/ui'

interface Props {
  ncc: any
  onView: (ncc: any) => void
  onEdit: (ncc: any) => void
  onDelete: (ncc: any) => void
}

export function NccCard({ ncc, onView, onEdit, onDelete }: Props) {
  const initials = getInitials(ncc.name)
  const certificatesCount = ncc.certificates?.length || 0
  const expiringCount = (ncc.certificates || []).filter((c: any) => {
    if (!c.expiryDate) return false
    const days = Math.floor((new Date(c.expiryDate).getTime() - Date.now()) / 86400000)
    return days >= 0 && days < 30
  }).length

  return (
    <div className="group relative bg-white border border-neutral-200/70 rounded-2xl shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 overflow-hidden">
      {/* Header — clickable */}
      <button
        type="button"
        onClick={() => onView(ncc)}
        className="w-full p-4 flex items-start gap-3 text-left"
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm ring-2 ring-white bg-gradient-to-br ${pickTone(ncc.name)}`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-neutral-900 truncate group-hover:text-primary-700 transition-colors">
                {ncc.name || 'Không tên'}
              </h3>
              <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                {ncc.code || 'No code'}
              </div>
            </div>
          </div>
          {ncc.classificationName && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
              <Building2 size={9} /> {ncc.classificationName}
            </span>
          )}
        </div>
      </button>

      {/* Row actions */}
      <RowActions
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
        actions={[
          { kind: 'view', onClick: () => onView(ncc) },
          { kind: 'edit', onClick: () => onEdit(ncc) },
          { kind: 'delete', onClick: () => onDelete(ncc) },
        ]}
      />

      {/* Body: contact info */}
      <div className="px-4 pb-3 space-y-1.5">
        {ncc.representative && (
          <InfoLine icon={User} text={ncc.representative} />
        )}
        {ncc.phone && (
          <InfoLine icon={Phone} text={ncc.phone} className="font-mono" />
        )}
        {ncc.address && (
          <InfoLine icon={MapPin} text={ncc.address} truncate />
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 border-t border-neutral-100 bg-neutral-50/40">
        <MetricCell
          icon={Sprout}
          label="Diện tích"
          value={ncc.growingArea != null ? `${ncc.growingArea} ha` : '—'}
          tone="green"
        />
        <MetricCell
          icon={Weight}
          label="SL tối đa/tháng"
          value={ncc.maxCapacity != null ? `${formatCompact(ncc.maxCapacity)}kg` : '—'}
          tone="blue"
        />
      </div>

      {/* Certificate strip */}
      {certificatesCount > 0 && (
        <div className="px-4 py-2 border-t border-neutral-100 flex items-center gap-1.5">
          <Award size={12} className={expiringCount > 0 ? 'text-amber-500' : 'text-emerald-500'} />
          <span className="text-[11px] font-medium text-neutral-600">
            {certificatesCount} chứng chỉ
          </span>
          {expiringCount > 0 && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 ml-auto">
              {expiringCount} sắp hết hạn
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function InfoLine({
  icon: Icon,
  text,
  className,
  truncate,
}: {
  icon: typeof User
  text: string
  className?: string
  truncate?: boolean
}) {
  return (
    <div className={`flex items-center gap-2 text-xs text-neutral-600 ${className || ''}`}>
      <Icon size={11} className="text-neutral-400 shrink-0" />
      <span className={truncate ? 'truncate' : ''}>{text}</span>
    </div>
  )
}

function MetricCell({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Sprout
  label: string
  value: string
  tone: 'green' | 'blue'
}) {
  const toneMap = {
    green: 'text-emerald-600',
    blue: 'text-blue-600',
  }[tone]
  return (
    <div className="p-3 border-r last:border-r-0 border-neutral-100">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
        <Icon size={9} className={toneMap} />
        {label}
      </div>
      <div className={`text-sm font-bold mt-0.5 tabular-nums ${toneMap}`}>{value}</div>
    </div>
  )
}

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
  ]
  const s = (seed || '?').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return tones[s % tones.length]
}

function formatCompact(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}
