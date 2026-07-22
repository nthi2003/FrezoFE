import {
  Building2, Phone, User, MapPin, Sprout, Weight, Award, Star,
  Calendar, ExternalLink, Copy, FileText, Pencil,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Drawer, Button } from '@frezo/ui'
import { useNccDetail } from '../hooks/useNcc'

interface Props {
  isOpen: boolean
  nccId: string | null
  fallback?: any
  onClose: () => void
  onEdit: (ncc: any) => void
}

export function NccDetailDrawer({ isOpen, nccId, fallback, onClose, onEdit }: Props) {
  const { data: fetched, isLoading } = useNccDetail(nccId)
  const ncc = fetched || fallback

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <Building2 size={16} className="text-primary-600" />
          Nhà cung cấp
        </span>
      }
      description={ncc?.name}
      footer={
        ncc && (
          <>
            <Button variant="outline" onClick={onClose}>Đóng</Button>
            <Button
              onClick={() => onEdit(ncc)}
              className="bg-primary-600 hover:bg-primary-700 text-white gap-1"
            >
              <Pencil size={13} /> Chỉnh sửa
            </Button>
          </>
        )
      }
    >
      {isLoading || !ncc ? (
        <div className="py-16 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="px-5 py-5 border-b border-neutral-100 bg-gradient-to-b from-primary-50/50 to-white">
            <div className="flex items-start gap-4">
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${pickTone(ncc.name)} flex items-center justify-center font-bold text-white text-2xl shadow-lg ring-2 ring-white shrink-0`}
              >
                {getInitials(ncc.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-neutral-900 leading-tight truncate">
                  {ncc.name || 'Không tên'}
                </h2>
                <div className="text-sm text-neutral-500 mt-0.5 font-mono">
                  {ncc.code || 'No code'}
                </div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {ncc.classificationName && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200 rounded">
                      <Building2 size={9} /> {ncc.classificationName}
                    </span>
                  )}
                  {(ncc.certificates?.length || 0) > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                      <Award size={9} /> {ncc.certificates.length} chứng chỉ
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 border-b border-neutral-100">
            <BigMetric
              icon={Sprout}
              label="Diện tích canh tác"
              value={ncc.growingArea != null ? `${ncc.growingArea} ha` : '—'}
              tone="green"
            />
            <BigMetric
              icon={Weight}
              label="Sản lượng tối đa / tháng"
              value={ncc.maxCapacity != null ? `${Number(ncc.maxCapacity).toLocaleString('vi-VN')} kg` : '—'}
              tone="blue"
            />
          </div>

          {/* Contact */}
          <Section title="Liên hệ">
            <InfoRow icon={User} label="Đại diện">
              {ncc.representative || <EmptyValue />}
            </InfoRow>
            <InfoRow icon={Phone} label="Số điện thoại">
              {ncc.phone ? (
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <a href={`tel:${ncc.phone}`} className="text-primary-600 hover:underline">
                    {ncc.phone}
                  </a>
                  <CopyButton value={ncc.phone} />
                </span>
              ) : (
                <EmptyValue />
              )}
            </InfoRow>
            <InfoRow icon={MapPin} label="Địa chỉ">
              {ncc.address || <EmptyValue />}
            </InfoRow>
          </Section>

          {/* Strengths */}
          {ncc.strengths && (
            <Section title="Điểm mạnh">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Star size={12} />
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed flex-1">
                  {ncc.strengths}
                </p>
              </div>
            </Section>
          )}

          {/* Certificates */}
          <Section title={`Chứng chỉ (${ncc.certificates?.length || 0})`}>
            {!ncc.certificates || ncc.certificates.length === 0 ? (
              <div className="py-3 text-sm text-neutral-400 italic">
                Chưa có chứng chỉ nào — thêm ở form chỉnh sửa
              </div>
            ) : (
              <div className="space-y-2">
                {ncc.certificates.map((cert: any) => (
                  <CertificateRow key={cert.id || cert.certificateType} cert={cert} />
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </Drawer>
  )
}

// ============================================================
// Sub-components
// ============================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-b border-neutral-100 last:border-b-0">
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

function BigMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  tone: 'green' | 'blue'
}) {
  const toneMap = {
    green: 'from-emerald-50 to-white text-emerald-600',
    blue: 'from-blue-50 to-white text-blue-600',
  }[tone]
  return (
    <div className={`px-5 py-4 bg-gradient-to-b ${toneMap} border-r last:border-r-0 border-neutral-100`}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
        <Icon size={12} />
        {label}
      </div>
      <div className="text-2xl font-bold text-neutral-900 tabular-nums mt-1">{value}</div>
    </div>
  )
}

function CertificateRow({ cert }: { cert: any }) {
  const daysToExpiry = cert.expiryDate
    ? Math.floor((new Date(cert.expiryDate).getTime() - Date.now()) / 86400000)
    : null
  const expiryTone =
    daysToExpiry === null
      ? { label: '', className: 'text-neutral-400' }
      : daysToExpiry < 0
        ? { label: 'Đã hết hạn', className: 'text-rose-600 bg-rose-50 border-rose-200' }
        : daysToExpiry < 30
          ? { label: `Còn ${daysToExpiry} ngày`, className: 'text-amber-700 bg-amber-50 border-amber-200' }
          : { label: `Còn ${daysToExpiry} ngày`, className: 'text-emerald-700 bg-emerald-50 border-emerald-200' }

  return (
    <div className="p-3 bg-white border border-neutral-200 rounded-xl hover:border-neutral-300 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-neutral-800 truncate">
              {cert.certificateType}
            </div>
            {cert.expiryDate && (
              <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                <Calendar size={10} />
                Hết hạn: {formatDate(cert.expiryDate)}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {expiryTone.label && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${expiryTone.className}`}>
              {expiryTone.label}
            </span>
          )}
          {cert.fileUrl && (
            <a
              href={cert.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded"
              title="Xem file"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
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
  ]
  const s = (seed || '?').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return tones[s % tones.length]
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('vi-VN')
  } catch {
    return String(iso)
  }
}
