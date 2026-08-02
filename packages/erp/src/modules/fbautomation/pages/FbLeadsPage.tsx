// ============================================================
// Inbox khách hàng — Multi-channel CSKH
// Gộp mọi lead từ Facebook Groups, Landing page, Zalo OA và nhập tay
// vào 1 mặt bằng duy nhất. Có filter theo nguồn/trạng thái, quick actions
// (Import → Customer, Assign, Xoá) và detail drawer.
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Trash2, Loader2, Download, CheckCircle, Inbox, Facebook, MessageCircle,
  Globe, User, Sparkles, Search, RefreshCw, ExternalLink,
  Phone, Mail, Clock, MapPin, X, HelpCircle,
} from 'lucide-react'
import { Button, PageHeader, EmptyState, ErrorState, Select, IconActionButton, AppTooltip } from '@frezo/ui'
import { toast } from 'sonner'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn, BulkAction } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import {
  useFbLeads, useDeleteFbLead, useImportLead, useImportBatchLeads, useAssignFbLead,
} from '../hooks/useFbAutomation'
import { usePersonsCombobox } from '@/modules/qlns/hooks/usePerson'

type SourceKey = 'all' | 'FACEBOOK' | 'LANDING' | 'ZALO' | 'MANUAL'
type StatusKey = 'all' | 'NEW' | 'ASSIGNED' | 'IMPORTED'

const SOURCE_META: Record<
  Exclude<SourceKey, 'all'>,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  FACEBOOK: {
    label: 'Facebook', icon: Facebook,
    color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200',
  },
  LANDING: {
    label: 'Landing page', icon: Globe,
    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',
  },
  ZALO: {
    label: 'Zalo', icon: MessageCircle,
    color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200',
  },
  MANUAL: {
    label: 'Nhập tay', icon: User,
    color: 'text-neutral-600', bg: 'bg-neutral-50', border: 'border-neutral-200',
  },
}

const STATUS_META: Record<
  Exclude<StatusKey, 'all'>,
  { label: string; color: string }
> = {
  NEW: { label: 'Mới', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  ASSIGNED: { label: 'Đang xử lý', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  IMPORTED: { label: 'Đã import KH', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

export function FbLeadsPage() {
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight') || null

  const [source, setSource] = useState<SourceKey>('all')
  const [status, setStatus] = useState<StatusKey>('all')
  const [search, setSearch] = useState('')
  const [activeLead, setActiveLead] = useState<any | null>(null)

  const {
    data: leads, isLoading, isFetching, isError, refetch,
  } = useFbLeads(
    status === 'all' ? undefined : status,
    source === 'all' ? undefined : source,
  )

  useEffect(() => {
    if (!highlightId || !leads || activeLead) return
    const target = (leads as any[]).find((l) => l?.id === highlightId)
    if (target) setActiveLead(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, highlightId])

  const { options: personOptions } = usePersonsCombobox()

  const deleteReq = useDeleteFbLead()
  const importReq = useImportLead()
  const importBatchReq = useImportBatchLeads()
  const assignReq = useAssignFbLead()

  const list: any[] = useMemo(() => (Array.isArray(leads) ? leads : []), [leads])

  const filtered = useMemo(() => {
    if (!search.trim()) return list
    const q = search.trim().toLowerCase()
    return list.filter((l) => {
      const hay = [l.name, l.phone, l.email, l.message, l.subject]
        .filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [list, search])

  const stats = useMemo(() => {
    const acc: Record<string, number> = { all: list.length, NEW: 0, ASSIGNED: 0, IMPORTED: 0 }
    list.forEach((l) => {
      const s = l.status || 'NEW'
      acc[s] = (acc[s] || 0) + 1
    })
    return acc
  }, [list])

  const sourceCounts = useMemo(() => {
    const acc: Record<string, number> = {}
    list.forEach((l) => {
      const s = l.source || 'FACEBOOK'
      acc[s] = (acc[s] || 0) + 1
    })
    return acc
  }, [list])

  const clearFilters = () => {
    setSearch(''); setSource('all'); setStatus('all')
  }
  const hasFilter = !!search || source !== 'all' || status !== 'all'
  const isFullyEmpty = !isLoading && !isError && list.length === 0
  const isFilteredEmpty = !isLoading && !isError && list.length > 0 && filtered.length === 0

  const bulkActions: BulkAction<any>[] = [
    {
      key: 'import',
      label: 'Import vào KH',
      icon: Download,
      onClick: async (rows) => {
        const ids = rows.filter((r) => r.status !== 'IMPORTED').map((r) => r.id)
        if (ids.length === 0) {
          toast.warning('Không có lead nào có thể import')
          return
        }
        await importBatchReq.mutateAsync(ids)
      },
    },
  ]

  const columns: AppTableColumn<any>[] = [
    {
      key: 'customer',
      title: 'Khách hàng',
      render: (_, lead) => {
        const src = (lead.source || 'FACEBOOK') as keyof typeof SOURCE_META
        const srcMeta = SOURCE_META[src] ?? SOURCE_META.MANUAL
        return (
          <AppTooltip content="Xem chi tiết lead">
            <button
              type="button"
              onClick={() => setActiveLead(lead)}
              aria-label="Xem chi tiết lead"
              className="flex items-center gap-2.5 text-left"
            >
            <div className={`w-8 h-8 rounded-full ${srcMeta.bg} ${srcMeta.color} flex items-center justify-center font-semibold shrink-0 text-sm`}>
              {(lead.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-neutral-900 truncate max-w-[180px]">
                {lead.name || 'Khách chưa xác định'}
              </div>
              {lead.subject && (
                <div className="text-[11px] text-neutral-500 truncate max-w-[180px]">
                  {lead.subject}
                </div>
              )}
            </div>
          </button>
          </AppTooltip>
        )
      },
    },
    {
      key: 'contact',
      title: 'Liên hệ',
      render: (_, lead) => (
        <div className="flex flex-col gap-0.5 text-xs text-neutral-600">
          {lead.phone && (
            <span className="inline-flex items-center gap-1"><Phone size={11} />{lead.phone}</span>
          )}
          {lead.email && (
            <span className="inline-flex items-center gap-1 text-neutral-500"><Mail size={11} />{lead.email}</span>
          )}
          {!lead.phone && !lead.email && <span className="text-neutral-400">—</span>}
        </div>
      ),
    },
    {
      key: 'source',
      title: 'Nguồn',
      render: (_, lead) => {
        const src = (lead.source || 'FACEBOOK') as keyof typeof SOURCE_META
        const srcMeta = SOURCE_META[src] ?? SOURCE_META.MANUAL
        const SrcIcon = srcMeta.icon
        return (
          <div>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${srcMeta.bg} ${srcMeta.color} ${srcMeta.border} text-[11px] font-medium`}>
              <SrcIcon size={11} /> {srcMeta.label}
            </span>
            {lead.sourceGroupName && (
              <div className="text-[11px] text-neutral-400 truncate max-w-[140px] mt-0.5" title={lead.sourceGroupName}>
                {lead.sourceGroupName}
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'message',
      title: 'Nội dung',
      render: (_, lead) => (
        <div className="max-w-[220px]">
          <div className="text-xs text-neutral-600 line-clamp-2" title={lead.message || lead.note || ''}>
            {lead.message || lead.note || <span className="text-neutral-400">—</span>}
          </div>
          {lead.createdDate && (
            <div className="text-[10px] text-neutral-400 mt-0.5 inline-flex items-center gap-1">
              <Clock size={9} /> {formatDate(lead.createdDate)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'assigned',
      title: 'Xử lý',
      render: (_, lead) =>
        lead.assignedTo ? (
          <span className="inline-flex items-center gap-1 text-xs text-neutral-700">
            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-semibold">
              {lead.assignedTo.charAt(0).toUpperCase()}
            </div>
            {lead.assignedTo}
          </span>
        ) : (
          <AssignSelect
            options={personOptions}
            onSelect={(username) => assignReq.mutate({ id: lead.id, username })}
            loading={assignReq.isPending}
          />
        ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      render: (_, lead) => {
        const st = (lead.status || 'NEW') as keyof typeof STATUS_META
        const stMeta = STATUS_META[st] ?? STATUS_META.NEW
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${stMeta.color}`}>
            {st === 'IMPORTED' && <CheckCircle size={10} />}
            {stMeta.label}
          </span>
        )
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: 120,
      render: (_, lead) => {
        const disabled = lead.status === 'IMPORTED'
        return (
          <div className="flex items-center justify-end gap-1">
            {lead.profileUrl && (
              <AppTooltip content="Mở profile gốc">
                <a
                  href={lead.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Mở profile gốc"
                  className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-primary-600 inline-flex"
                >
                  <ExternalLink size={14} />
                </a>
              </AppTooltip>
            )}
            {!disabled && (
              <IconActionButton tooltip="Import vào Khách hàng" tone="emerald" onClick={() => importReq.mutate(lead.id)} disabled={importReq.isPending}>
                {importReq.isPending
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Download size={14} />}
              </IconActionButton>
            )}
            <IconActionButton
              tooltip="Xoá"
              tone="red"
              onClick={() =>
                askConfirm({
                  title: 'Xoá lead này?',
                  message: `Lead "${lead.name}" sẽ bị xoá.`,
                  confirmText: 'Xoá',
                  onConfirm: () => deleteReq.mutate(lead.id),
                })
              }
            >
              <Trash2 size={14} />
            </IconActionButton>
          </div>
        )
      },
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
              <Inbox size={16} />
            </span>
            Inbox khách hàng
          </span>
        }
        description="Gộp lead từ Facebook Groups · Landing page · Zalo OA · Nhập tay — xử lý & chuyển thành khách hàng."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/crm/leads')}
              className="gap-1.5"
              title="Chuyển sang CRM Leads (NEW → follow-up)"
            >
              <ExternalLink size={14} />
              CRM Leads
            </Button>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Làm mới
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiTile
          active={source === 'all'}
          onClick={() => setSource('all')}
          icon={Inbox}
          label="Tổng lead"
          value={list.length}
          tone="neutral"
        />
        {(['FACEBOOK', 'LANDING', 'ZALO', 'MANUAL'] as const).map((s) => {
          const meta = SOURCE_META[s]
          return (
            <KpiTile
              key={s}
              active={source === s}
              onClick={() => setSource(s)}
              icon={meta.icon}
              label={meta.label}
              value={sourceCounts[s] || 0}
              tone={s === 'FACEBOOK' ? 'blue' : s === 'LANDING' ? 'emerald' : s === 'ZALO' ? 'sky' : 'neutral'}
            />
          )
        })}
      </div>

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={clearFilters}
        countLabel={`${filtered.length} lead${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="min-w-[150px]">
          <Select
            options={[
              { value: 'all', label: `Tất cả trạng thái (${stats.all || 0})` },
              { value: 'NEW', label: `Mới (${stats.NEW || 0})` },
              { value: 'ASSIGNED', label: `Đang xử lý (${stats.ASSIGNED || 0})` },
              { value: 'IMPORTED', label: `Đã import KH (${stats.IMPORTED || 0})` },
            ]}
            value={status}
            onChange={(v) => setStatus(v as StatusKey)}
            placeholder="Trạng thái"
            aria-label="Lọc trạng thái"
            showSearch={false}
          />
        </div>
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm theo tên, SĐT, email, nội dung…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm lead"
          />
        </div>
        <span
          className="inline-flex items-center text-neutral-400"
          title="Chọn dòng để import hàng loạt vào Khách hàng"
        >
          <HelpCircle size={14} />
        </span>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được inbox"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={hasFilter ? Search : Inbox}
            title={hasFilter ? 'Không có lead khớp bộ lọc' : 'Inbox trống'}
            description={
              hasFilter
                ? 'Thử điều chỉnh từ khoá hoặc bỏ bớt bộ lọc.'
                : 'Chưa có lead nào. Khi khách gửi form landing, chat Zalo OA, hoặc bot crawl FB Groups — chúng sẽ hiện tại đây.'
            }
            action={
              hasFilter
                ? { label: 'Xoá tất cả bộ lọc', onClick: clearFilters }
                : undefined
            }
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={() => void refetch()}
          selectable
          getRowId={(r) => String(r.id)}
          bulkActions={bulkActions}
          getRowProps={(lead) =>
            highlightId === lead.id
              ? { className: 'bg-primary-50/60 ring-2 ring-primary-200 ring-inset' }
              : {}
          }
        />
      )}

      {activeLead && (
        <LeadDetailDrawer
          lead={activeLead}
          onClose={() => {
            setActiveLead(null)
            if (highlightId) {
              const next = new URLSearchParams(searchParams)
              next.delete('highlight')
              setSearchParams(next, { replace: true })
            }
          }}
          onImport={() => importReq.mutate(activeLead.id, {
            onSuccess: () => setActiveLead(null),
          })}
        />
      )}
      {confirmDialog}
    </div>
  )
}

function KpiTile({
  icon: Icon, label, value, tone, active, onClick,
}: {
  icon: any; label: string; value: number; tone: 'blue' | 'emerald' | 'sky' | 'neutral'
  active?: boolean; onClick?: () => void
}) {
  const toneMap = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    sky: 'text-sky-600 bg-sky-50 border-sky-200',
    neutral: 'text-neutral-700 bg-neutral-100 border-neutral-200',
  }[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-3 transition-all ${
        active
          ? 'border-primary-400 ring-2 ring-primary-100 bg-white shadow-sm'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${toneMap}`}>
          <Icon size={15} />
        </div>
        {active && <Sparkles size={12} className="text-primary-500" />}
      </div>
      <div className="text-2xl font-bold text-neutral-900 leading-none">{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{label}</div>
    </button>
  )
}

function AssignSelect({
  options, onSelect, loading,
}: { options: { value: string; label: string }[]; onSelect: (username: string) => void; loading: boolean }) {
  const [open, setOpen] = useState(false)
  if (loading) return <Loader2 size={14} className="animate-spin text-neutral-400" />
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
        title="Gán nhân viên CSKH"
      >
        + Gán CSKH
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 w-56 max-h-64 overflow-auto bg-white rounded-lg border border-neutral-200 shadow-lg py-1">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-neutral-400">Chưa có nhân viên</div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onSelect(opt.label); setOpen(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

function LeadDetailDrawer({
  lead, onClose, onImport,
}: { lead: any; onClose: () => void; onImport: () => void }) {
  const src = (lead.source || 'FACEBOOK') as keyof typeof SOURCE_META
  const srcMeta = SOURCE_META[src] ?? SOURCE_META.MANUAL
  const SrcIcon = srcMeta.icon
  const disabled = lead.status === 'IMPORTED'
  return (
    <>
      <div className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
        <div className={`p-5 border-b border-neutral-100 ${srcMeta.bg}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 rounded-xl bg-white ${srcMeta.color} flex items-center justify-center border ${srcMeta.border}`}>
                <SrcIcon size={20} />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-neutral-900 truncate">{lead.name || 'Khách chưa xác định'}</div>
                <div className="text-xs text-neutral-600 mt-0.5 inline-flex items-center gap-1">
                  Nguồn: <b>{srcMeta.label}</b>
                  {lead.createdDate && <><span>·</span><Clock size={10} />{formatDate(lead.createdDate)}</>}
                </div>
              </div>
            </div>
            <IconActionButton tooltip="Đóng" onClick={onClose}>
              <X size={16} />
            </IconActionButton>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <section>
            <SectionTitle>Liên hệ</SectionTitle>
            <InfoRow icon={Phone} label="SĐT" value={lead.phone} />
            <InfoRow icon={Mail} label="Email" value={lead.email} />
            <InfoRow icon={MapPin} label="Địa chỉ" value={lead.address} />
          </section>

          {(lead.message || lead.note || lead.subject) && (
            <section>
              <SectionTitle>Nội dung</SectionTitle>
              {lead.subject && (
                <div className="text-sm font-medium text-neutral-800 mb-1">{lead.subject}</div>
              )}
              <div className="text-sm text-neutral-700 bg-neutral-50 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                {lead.message || lead.note || '—'}
              </div>
            </section>
          )}

          <section>
            <SectionTitle>Kênh & Meta</SectionTitle>
            <InfoRow label="Trạng thái" value={STATUS_META[(lead.status || 'NEW') as keyof typeof STATUS_META]?.label} />
            <InfoRow label="Assign cho" value={lead.assignedTo} />
            <InfoRow label="Referer" value={lead.referer} />
            <InfoRow label="IP" value={lead.sourceIp} />
            {lead.profileUrl && (
              <div className="pt-2">
                <a
                  href={lead.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800"
                >
                  <ExternalLink size={12} /> Mở profile gốc
                </a>
              </div>
            )}
          </section>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-neutral-100 p-4 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Đóng</Button>
          {!disabled && (
            <Button onClick={onImport} className="flex-1 gap-1.5">
              <Download size={14} /> Import vào KH
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">
      {children}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon?: any; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      {Icon && <Icon size={13} className="text-neutral-400 shrink-0" />}
      <span className="text-neutral-500 w-20 text-xs shrink-0">{label}</span>
      <span className="text-neutral-800 font-medium truncate">{value || '—'}</span>
    </div>
  )
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch {
    return iso
  }
}
