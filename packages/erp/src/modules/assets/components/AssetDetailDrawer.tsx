// ============================================================
// AssetDetailDrawer — Chi tiết tài sản + timeline + workflow actions
// ============================================================

import { useState } from 'react'
import {
  X, Hash, User, Calendar, MapPin, Shield, Package, DollarSign,
  Edit, UserPlus, UserMinus, Wrench, Ban, CheckCircle2, XCircle, Loader2,
  ArrowRight, Trash2, FileText, ArrowDownCircle, ArrowUpCircle, AlertTriangle,
} from 'lucide-react'
import { Button } from '@frezo/ui'
import type { AssetItem, AssetAssignmentItem } from '../services/assetApi'
import {
  useAssetHistory, useUnassignAsset, useStartMaintenance, useEndMaintenance,
  useDisposeAsset, useDeleteAsset,
} from '../hooks/useAsset'
import {
  STATUS_META, getCategoryIcon, fmtMoneyFull, fmtDate, daysUntil,
} from '../constants/assetMeta'
import { AssetDepreciationPanel } from './AssetDepreciationPanel'

interface Props {
  asset: AssetItem
  onClose: () => void
  onEdit: () => void
  onAssign: () => void
}

export function AssetDetailDrawer({ asset, onClose, onEdit, onAssign }: Props) {
  const history = useAssetHistory(asset.id)
  const unassign = useUnassignAsset()
  const startMaint = useStartMaintenance()
  const endMaint = useEndMaintenance()
  const dispose = useDisposeAsset()
  const del = useDeleteAsset()

  const [confirmMode, setConfirmMode] = useState<null | 'unassign' | 'dispose' | 'delete' | 'endMaint'>(null)
  const [note, setNote] = useState('')
  const [cost, setCost] = useState<string>('')
  const [tab, setTab] = useState<'info' | 'depreciation'>('info')

  const st = STATUS_META[asset.status] || STATUS_META.AVAILABLE
  const Icon = getCategoryIcon(asset.categoryCode)
  const warrantyDays = daysUntil(asset.warrantyEndDate)
  const warrantyExpiring = warrantyDays !== null && warrantyDays >= 0 && warrantyDays <= 30
  const warrantyExpired = warrantyDays !== null && warrantyDays < 0

  const doConfirm = () => {
    if (confirmMode === 'unassign') {
      unassign.mutate({ id: asset.id, note: note.trim() || undefined }, { onSuccess: onClose })
    } else if (confirmMode === 'dispose') {
      dispose.mutate({ id: asset.id, note: note.trim() || undefined }, { onSuccess: onClose })
    } else if (confirmMode === 'endMaint') {
      const c = cost ? Number(cost) : undefined
      endMaint.mutate({ id: asset.id, note: note.trim() || undefined, cost: c }, { onSuccess: onClose })
    } else if (confirmMode === 'delete') {
      del.mutate(asset.id, { onSuccess: onClose })
    }
  }
  const pending = unassign.isPending || dispose.isPending || endMaint.isPending || del.isPending

  return (
    <>
      <div className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 bg-gradient-to-br from-primary-50/60 to-white">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                <Icon size={22} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-mono text-neutral-500">{asset.code}</div>
                <div className="font-semibold text-neutral-900 truncate">{asset.name}</div>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${st.tone}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                  {asset.categoryName && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600">
                      {asset.categoryName}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 flex-1">
          <div className="flex gap-1 border-b border-neutral-100 pb-2">
            {([
              { key: 'info' as const, label: 'Thông tin' },
              { key: 'depreciation' as const, label: 'Khấu hao' },
            ]).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold ${
                  tab === t.key
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'depreciation' ? (
            <AssetDepreciationPanel assetId={asset.id} />
          ) : (
            <>
          {/* Warranty banner */}
          {(warrantyExpiring || warrantyExpired) && (
            <div className={`rounded-lg p-3 flex items-start gap-2 border ${
              warrantyExpired
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div className="text-xs">
                <b>Bảo hành {warrantyExpired ? 'đã hết' : 'sắp hết'}</b>{' '}
                {warrantyExpired
                  ? `${Math.abs(warrantyDays!)} ngày trước`
                  : `còn ${warrantyDays} ngày`} — {fmtDate(asset.warrantyEndDate)}
              </div>
            </div>
          )}

          {/* Assignment info */}
          {asset.assignedPersonName && (
            <section>
              <SectionTitle>Người đang giữ</SectionTitle>
              <div className="rounded-lg bg-blue-50/40 border border-blue-100 p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                  {asset.assignedPersonName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-neutral-900 truncate">{asset.assignedPersonName}</div>
                  {asset.assignedAt && (
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      Từ {fmtDate(asset.assignedAt)}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Info grid */}
          <section>
            <SectionTitle>Thông tin</SectionTitle>
            <InfoRow icon={Hash} label="Serial / IMEI" value={asset.serialNumber} mono />
            <InfoRow icon={Package} label="Hãng / Model" value={joinValue(asset.brand, asset.model)} />
            <InfoRow icon={MapPin} label="Vị trí" value={asset.location} />
            <InfoRow icon={Calendar} label="Ngày mua" value={fmtDate(asset.purchaseDate)} />
            <InfoRow icon={DollarSign} label="Giá mua" value={fmtMoneyFull(asset.purchasePrice)} mono />
            <InfoRow icon={DollarSign} label="Giá trị hiện tại" value={fmtMoneyFull(asset.currentValue)} mono />
            <InfoRow icon={Shield} label="Hết bảo hành" value={fmtDate(asset.warrantyEndDate)} />
          </section>

          {/* Note */}
          {asset.note && (
            <section>
              <SectionTitle>Ghi chú</SectionTitle>
              <div className="text-sm text-neutral-800 bg-neutral-50 rounded-lg p-3 leading-relaxed whitespace-pre-wrap border border-neutral-100">
                {asset.note}
              </div>
            </section>
          )}

          {/* Timeline */}
          <section>
            <SectionTitle>Lịch sử</SectionTitle>
            {history.isLoading ? (
              <div className="flex items-center justify-center py-6 text-neutral-400">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : (history.data || []).length === 0 ? (
              <div className="text-sm text-neutral-400 italic text-center py-6">
                Chưa có lịch sử biến động.
              </div>
            ) : (
              <Timeline items={history.data!} />
            )}
          </section>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white border-t border-neutral-100 p-4">
          {confirmMode ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
                <FileText size={12} /> {confirmLabel(confirmMode)}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                autoFocus
                placeholder="Ghi chú (không bắt buộc)"
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
              />
              {confirmMode === 'endMaint' && (
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="Chi phí bảo trì (VND)"
                  className="w-full h-9 px-3 rounded-lg border border-neutral-200 bg-white text-sm focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none tabular-nums"
                />
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setConfirmMode(null); setNote(''); setCost('') }} className="flex-1">
                  Huỷ
                </Button>
                <Button
                  onClick={doConfirm}
                  disabled={pending}
                  className={`flex-1 gap-1.5 text-white ${
                    confirmMode === 'delete' || confirmMode === 'dispose'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {pending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Xác nhận
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={onEdit} className="gap-1.5">
                <Edit size={13} /> Sửa
              </Button>

              {asset.status === 'AVAILABLE' && (
                <>
                  <Button onClick={onAssign} className="gap-1.5 bg-primary-600 hover:bg-primary-700 text-white">
                    <UserPlus size={13} /> Cấp phát
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmMode('dispose')} className="gap-1.5 text-neutral-600">
                    <Wrench size={13} /> Bảo trì
                  </Button>
                  <Button variant="outline" onClick={() => { setConfirmMode('delete'); setNote('') }} className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50">
                    <Trash2 size={13} /> Xoá
                  </Button>
                </>
              )}

              {asset.status === 'IN_USE' && (
                <>
                  <Button onClick={() => setConfirmMode('unassign')} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                    <UserMinus size={13} /> Thu hồi
                  </Button>
                </>
              )}

              {asset.status === 'MAINTENANCE' && (
                <Button onClick={() => setConfirmMode('endMaint')} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CheckCircle2 size={13} /> Kết thúc BT
                </Button>
              )}

              {asset.status !== 'DISPOSED' && (
                <Button variant="outline" onClick={() => setConfirmMode('dispose')} className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 col-span-2">
                  <Ban size={13} /> Thanh lý (không thể hoàn tác)
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ============================================================
// Timeline
// ============================================================

function Timeline({ items }: { items: AssetAssignmentItem[] }) {
  return (
    <ol className="relative border-l-2 border-neutral-200 ml-3 space-y-4 pt-1">
      {items.map((h) => (
        <TimelineItem key={h.id} h={h} />
      ))}
    </ol>
  )
}

const ACTION_META: Record<string, { title: string; icon: any; bg: string; iconColor: string }> = {
  ASSIGN:            { title: 'Cấp phát cho',          icon: ArrowDownCircle, bg: 'bg-blue-100',    iconColor: 'text-blue-700' },
  RETURN:            { title: 'Thu hồi từ',            icon: ArrowUpCircle,   bg: 'bg-amber-100',   iconColor: 'text-amber-700' },
  MAINTENANCE_START: { title: 'Bắt đầu bảo trì',       icon: Wrench,          bg: 'bg-amber-100',   iconColor: 'text-amber-700' },
  MAINTENANCE_END:   { title: 'Kết thúc bảo trì',      icon: CheckCircle2,    bg: 'bg-emerald-100', iconColor: 'text-emerald-700' },
  DISPOSE:           { title: 'Thanh lý',              icon: Ban,             bg: 'bg-rose-100',    iconColor: 'text-rose-700' },
  REPORT_LOST:       { title: 'Báo mất',               icon: XCircle,         bg: 'bg-rose-100',    iconColor: 'text-rose-700' },
  REPAIR:            { title: 'Sửa chữa',              icon: Wrench,          bg: 'bg-amber-100',   iconColor: 'text-amber-700' },
}

function TimelineItem({ h }: { h: AssetAssignmentItem }) {
  const meta = ACTION_META[h.action] || ACTION_META.ASSIGN
  const Icon = meta.icon
  return (
    <li className="ml-6">
      <span className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white ${meta.bg}`}>
        <Icon size={12} className={meta.iconColor} />
      </span>
      <div className="text-sm">
        <div className="font-semibold text-neutral-900">
          {meta.title}{h.personName ? <> <span className="text-primary-700">{h.personName}</span></> : ''}
        </div>
        <div className="text-xs text-neutral-500 mt-0.5">
          {fmtDate(h.actionDate)}
          {h.createdBy && <> · bởi <b>@{h.createdBy}</b></>}
          {h.cost != null && <> · Chi phí: <b className="text-rose-700">{fmtMoneyFull(h.cost)}</b></>}
        </div>
        {h.note && (
          <div className="mt-1.5 text-xs text-neutral-700 bg-neutral-50 rounded-md px-2.5 py-1.5 border border-neutral-100 whitespace-pre-wrap">
            {h.note}
          </div>
        )}
      </div>
    </li>
  )
}

// ============================================================
// Sub UI
// ============================================================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
      {children}
    </div>
  )
}

function InfoRow({
  icon: Icon, label, value, mono,
}: { icon: any; label: string; value?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      <Icon size={13} className="text-neutral-400 shrink-0" />
      <span className="text-neutral-500 w-32 text-xs shrink-0">{label}</span>
      <span className={`text-neutral-800 font-medium truncate ${mono ? 'font-mono tabular-nums' : ''}`}>
        {value || <span className="text-neutral-400 font-normal">—</span>}
      </span>
    </div>
  )
}

function joinValue(a?: string | null, b?: string | null): string | null {
  const parts = [a, b].filter(Boolean).map((x) => String(x).trim()).filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}

function confirmLabel(mode: 'unassign' | 'dispose' | 'delete' | 'endMaint'): string {
  if (mode === 'unassign') return 'Ghi chú thu hồi'
  if (mode === 'dispose') return 'Ghi chú thanh lý (không thể hoàn tác)'
  if (mode === 'delete') return 'Xoá vĩnh viễn — nhập lý do'
  return 'Kết thúc bảo trì'
}

// Unused imports warning suppress
void ArrowRight
