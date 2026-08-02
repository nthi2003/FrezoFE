import { useMemo, useState } from 'react'
import {
  Plus,
  ShieldX,
  ShieldCheck,
  Server,
  RefreshCw,
  Search,
  X,
  Trash2,
  Unlock,
  Copy,
  HelpCircle,
} from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import {
  Button,
  ErrorState,
  EmptyState,
  PageHeader,
  PageGuideButton,
  AppModal,
  IconActionButton,
  AppTooltip,
  type PageGuideConfig,
} from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import * as z from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ipBlacklistApi, ipWhitelistApi, ipTrustApi } from '../services/securityApi'
import { toast } from 'sonner'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'

// ============================================================
// Schema & constants
// ============================================================

const IPV4_RE =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/

const ipSchema = z.object({
  ipAddress: z
    .string()
    .trim()
    .min(1, 'Nhập địa chỉ IP')
    .regex(IPV4_RE, 'IPv4 không hợp lệ (vd. 203.0.113.10)'),
  reason: z.string().optional(),
})

const trustSchema = z.object({
  ipAddress: z
    .string()
    .trim()
    .min(1, 'Nhập địa chỉ IP')
    .regex(IPV4_RE, 'IPv4 không hợp lệ (vd. 203.0.113.10)'),
  description: z.string().optional(),
})

type SecurityTab = 'blacklist' | 'whitelist' | 'trust'

const TAB_META: Record<
  SecurityTab,
  {
    label: string
    shortHint: string
    icon: typeof ShieldX
    emptyTitle: string
    emptyDesc: string
    addLabel: string
    tone: 'rose' | 'emerald' | 'sky'
    toneClasses: { active: string; idle: string; bar: string; iconBg: string; count: string }
  }
> = {
  blacklist: {
    label: 'Danh sách đen',
    shortHint: 'Chặn truy cập từ các IP này.',
    icon: ShieldX,
    emptyTitle: 'Chưa có IP trong danh sách đen',
    emptyDesc: 'Thêm IP để chặn truy cập hệ thống.',
    addLabel: 'Thêm IP vào danh sách đen',
    tone: 'rose',
    toneClasses: {
      active: 'bg-rose-50 text-rose-800 border-rose-200 ring-1 ring-rose-200/80',
      idle: 'bg-white text-neutral-700 border-neutral-200 hover:border-rose-200 hover:bg-rose-50/40',
      bar: 'bg-rose-500',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      count: 'text-rose-700',
    },
  },
  whitelist: {
    label: 'Danh sách trắng',
    shortHint: 'IP được phép khi bật chế độ chỉ whitelist.',
    icon: ShieldCheck,
    emptyTitle: 'Chưa có IP trong danh sách trắng',
    emptyDesc: 'Thêm IP được phép truy cập khi bật chế độ whitelist.',
    addLabel: 'Thêm IP vào danh sách trắng',
    tone: 'emerald',
    toneClasses: {
      active: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-200/80',
      idle: 'bg-white text-neutral-700 border-neutral-200 hover:border-emerald-200 hover:bg-emerald-50/40',
      bar: 'bg-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      count: 'text-emerald-700',
    },
  },
  trust: {
    label: 'IP tin cậy',
    shortHint: 'IP nội bộ / gateway — bỏ qua một số kiểm tra phụ.',
    icon: Server,
    emptyTitle: 'Chưa có IP tin cậy',
    emptyDesc: 'Thêm IP được tin cậy (bỏ qua một số kiểm tra bảo mật).',
    addLabel: 'Thêm IP tin cậy',
    tone: 'sky',
    toneClasses: {
      active: 'bg-sky-50 text-sky-800 border-sky-200 ring-1 ring-sky-200/80',
      idle: 'bg-white text-neutral-700 border-neutral-200 hover:border-sky-200 hover:bg-sky-50/40',
      bar: 'bg-sky-500',
      iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
      count: 'text-sky-700',
    },
  },
}

const SECURITY_GUIDE: PageGuideConfig = {
  title: 'Bảo mật hệ thống (IP)',
  subtitle: 'Quản lý danh sách đen, danh sách trắng và IP tin cậy.',
  sections: [
    {
      heading: 'Ba danh sách',
      type: 'steps',
      steps: [
        {
          title: 'Danh sách đen',
          description: 'Chặn IP — request từ IP này bị từ chối.',
        },
        {
          title: 'Danh sách trắng',
          description: 'Cho phép IP khi bật chế độ chỉ whitelist. Dùng khi khoá truy cập công khai.',
        },
        {
          title: 'IP tin cậy',
          description: 'IP nội bộ / gateway được tin cậy — bỏ qua một số kiểm tra phụ.',
        },
      ],
    },
    {
      heading: 'Mẹo',
      type: 'tips',
      tips: [
        'Nhập đúng IPv4 (vd. 203.0.113.10). Không chặn IP máy chủ / gateway nội bộ nếu chưa chắc.',
        'Gỡ chặn danh sách đen thay vì xoá nhầm whitelist khi đang khoá hệ thống.',
      ],
    },
  ],
}

// ============================================================
// Helpers
// ============================================================

function asList(raw: unknown): any[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  const items = (raw as { items?: unknown }).items
  return Array.isArray(items) ? items : []
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function formatRelative(dateStr?: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'Vừa xong'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const day = Math.floor(h / 24)
  if (day < 7) return `${day} ngày trước`
  return d.toLocaleDateString('vi-VN')
}

function copyIp(ip: string) {
  navigator.clipboard.writeText(ip).then(
    () => toast.success('Đã copy IP'),
    () => toast.error('Không copy được'),
  )
}

// ============================================================
// Page
// ============================================================

export function SecurityPage() {
  const [tab, setTab] = useState<SecurityTab>('blacklist')
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const { askConfirm, confirmDialog } = useConfirmDialog()

  const {
    data: rawBlacklist,
    isLoading: loadingB,
    isError: errB,
    refetch: refetchB,
    isFetching: fetchB,
  } = useQuery({
    queryKey: ['ip_blacklist'],
    queryFn: () => ipBlacklistApi.getAll(),
    select: (res: any) => res?.data,
  })
  const {
    data: rawWhitelist,
    isLoading: loadingW,
    isError: errW,
    refetch: refetchW,
    isFetching: fetchW,
  } = useQuery({
    queryKey: ['ip_whitelist'],
    queryFn: () => ipWhitelistApi.getAll(),
    select: (res: any) => res?.data,
  })
  const {
    data: rawTrust,
    isLoading: loadingT,
    isError: errT,
    refetch: refetchT,
    isFetching: fetchT,
  } = useQuery({
    queryKey: ['ip_trust'],
    queryFn: () => ipTrustApi.getAll(),
    select: (res: any) => res?.data,
  })

  const banMutation = useMutation({
    mutationFn: (data: any) => ipBlacklistApi.ban(data),
    onSuccess: () => {
      toast.success('Đã chặn IP')
      queryClient.invalidateQueries({ queryKey: ['ip_blacklist'] })
      setModalOpen(false)
    },
  })
  const unbanMutation = useMutation({
    mutationFn: (id: string) => ipBlacklistApi.unban(id),
    onSuccess: () => {
      toast.success('Đã gỡ chặn IP')
      queryClient.invalidateQueries({ queryKey: ['ip_blacklist'] })
    },
  })

  const whiteMutation = useMutation({
    mutationFn: (data: any) => ipWhitelistApi.create(data),
    onSuccess: () => {
      toast.success('Đã thêm IP vào danh sách trắng')
      queryClient.invalidateQueries({ queryKey: ['ip_whitelist'] })
      setModalOpen(false)
    },
  })
  const unwhiteMutation = useMutation({
    mutationFn: (id: string) => ipWhitelistApi.delete(id),
    onSuccess: () => {
      toast.success('Đã xoá IP khỏi danh sách trắng')
      queryClient.invalidateQueries({ queryKey: ['ip_whitelist'] })
    },
  })

  const trustMutation = useMutation({
    mutationFn: (data: any) => ipTrustApi.create(data),
    onSuccess: () => {
      toast.success('Đã thêm IP tin cậy')
      queryClient.invalidateQueries({ queryKey: ['ip_trust'] })
      setModalOpen(false)
    },
  })
  const untrustMutation = useMutation({
    mutationFn: (id: string) => ipTrustApi.delete(id),
    onSuccess: () => {
      toast.success('Đã xoá IP khỏi danh sách tin cậy')
      queryClient.invalidateQueries({ queryKey: ['ip_trust'] })
    },
  })

  const lists = useMemo(
    () => ({
      blacklist: asList(rawBlacklist),
      whitelist: asList(rawWhitelist),
      trust: asList(rawTrust),
    }),
    [rawBlacklist, rawWhitelist, rawTrust],
  )

  const counts = useMemo(
    () => ({
      blacklist: lists.blacklist.length,
      whitelist: lists.whitelist.length,
      trust: lists.trust.length,
    }),
    [lists],
  )

  const data = lists[tab]
  const isLoading = tab === 'blacklist' ? loadingB : tab === 'whitelist' ? loadingW : loadingT
  const isError = tab === 'blacklist' ? errB : tab === 'whitelist' ? errW : errT
  const isFetching = tab === 'blacklist' ? fetchB : tab === 'whitelist' ? fetchW : fetchT
  const anyFetching = fetchB || fetchW || fetchT

  const refetchTab = () => {
    if (tab === 'blacklist') void refetchB()
    else if (tab === 'whitelist') void refetchW()
    else void refetchT()
  }

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['ip_blacklist'] })
    void queryClient.invalidateQueries({ queryKey: ['ip_whitelist'] })
    void queryClient.invalidateQueries({ queryKey: ['ip_trust'] })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data
    return data.filter((row) => {
      const ip = String(row.ipAddress || '').toLowerCase()
      const note = String(
        tab === 'trust' ? row.description || '' : row.reason || '',
      ).toLowerCase()
      return ip.includes(q) || note.includes(q)
    })
  }, [data, search, tab])

  const hasFilter = !!search.trim()
  const isFullyEmpty = !isLoading && !isError && data.length === 0
  const isFilteredEmpty = !isLoading && !isError && data.length > 0 && filtered.length === 0

  const meta = TAB_META[tab]
  const noteKey = tab === 'trust' ? 'description' : 'reason'

  const columns: AppTableColumn<any>[] = useMemo(
    () => [
      {
        key: 'ipAddress',
        title: 'Địa chỉ IP',
        dataIndex: 'ipAddress',
        width: 200,
        render: (val: string) => (
          <div className="flex items-center gap-1.5 min-w-0 group">
            <code className="text-xs font-mono font-semibold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 truncate">
              {val || '—'}
            </code>
            {val ? (
              <IconActionButton
                tooltip="Copy IP"
                size="sm"
                tone="neutral"
                className="opacity-0 group-hover:opacity-100 focus:opacity-100"
                onClick={() => copyIp(val)}
              >
                <Copy size={13} />
              </IconActionButton>
            ) : null}
          </div>
        ),
      },
      {
        key: noteKey,
        title: tab === 'trust' ? 'Mô tả' : 'Lý do / Ghi chú',
        dataIndex: noteKey,
        render: (val: string) =>
          val ? (
            <span className="text-sm text-neutral-700 line-clamp-2" title={val}>
              {val}
            </span>
          ) : (
            <span className="text-xs text-neutral-400 italic">—</span>
          ),
      },
      {
        key: 'createdAt',
        title: 'Ngày tạo',
        dataIndex: 'createdAt',
        width: 160,
        render: (val: string) => (
          <div className="space-y-0.5" title={formatDateTime(val)}>
            <div className="text-xs font-medium text-neutral-800">{formatRelative(val)}</div>
            <div className="text-[10px] text-neutral-400 tabular-nums">{formatDateTime(val)}</div>
          </div>
        ),
      },
      {
        key: 'actions',
        title: 'Thao tác',
        dataIndex: 'id',
        width: 72,
        align: 'right' as const,
        render: (_: unknown, row: any) => {
          const isBan = tab === 'blacklist'
          return (
            <IconActionButton
              tooltip={isBan ? 'Gỡ chặn' : 'Xoá'}
              tone={isBan ? 'emerald' : 'red'}
              size="sm"
              onClick={() => {
                askConfirm({
                  title: isBan ? 'Gỡ chặn IP này?' : 'Xoá IP này?',
                  message: `IP ${row.ipAddress || ''} sẽ bị ${
                    isBan ? 'gỡ chặn' : 'xoá'
                  } khỏi danh sách.`,
                  confirmText: isBan ? 'Gỡ chặn' : 'Xoá',
                  onConfirm: () => {
                    if (tab === 'blacklist') unbanMutation.mutate(row.id)
                    if (tab === 'whitelist') unwhiteMutation.mutate(row.id)
                    if (tab === 'trust') untrustMutation.mutate(row.id)
                  },
                })
              }}
            >
              {isBan ? <Unlock size={14} /> : <Trash2 size={14} />}
            </IconActionButton>
          )
        },
      },
    ],
    [tab, noteKey, askConfirm, unbanMutation, unwhiteMutation, untrustMutation],
  )

  const totalIps = counts.blacklist + counts.whitelist + counts.trust

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Bảo mật hệ thống"
        description="Quản lý IP danh sách đen, danh sách trắng và IP tin cậy — chặn / cho phép truy cập."
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <AppTooltip content="IPv4 dạng 203.0.113.10. Không chặn gateway nội bộ nếu chưa chắc.">
              <span
                className="inline-flex items-center text-neutral-400 hover:text-primary-600 cursor-help"
                aria-label="Gợi ý bảo mật IP"
              >
                <HelpCircle size={16} strokeWidth={2} />
              </span>
            </AppTooltip>
            <PageGuideButton guide={SECURITY_GUIDE} />
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={anyFetching}
              className="gap-1.5"
            >
              <RefreshCw size={14} className={anyFetching ? 'animate-spin' : ''} />
              Làm mới
            </Button>
            <Button onClick={() => setModalOpen(true)} className="gap-2">
              <Plus size={16} /> {meta.addLabel}
            </Button>
          </div>
        }
      />

      {/* Overview — click to switch list (counts from real APIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.keys(TAB_META) as SecurityTab[]).map((key) => {
          const t = TAB_META[key]
          const Icon = t.icon
          const active = tab === key
          const count = counts[key]
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key)
                setSearch('')
              }}
              aria-pressed={active}
              aria-label={`${t.label}: ${count} IP`}
              className={`relative text-left rounded-xl border overflow-hidden transition ${
                active ? t.toneClasses.active : t.toneClasses.idle
              }`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${t.toneClasses.bar}`} />
              <div className="p-3.5 pl-4 flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${t.toneClasses.iconBg}`}
                >
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      {t.label}
                    </span>
                    <span className={`text-xl font-bold tabular-nums leading-none ${t.toneClasses.count}`}>
                      {count}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">{t.shortHint}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-2 bg-neutral-50/95 backdrop-blur border-y border-neutral-200/80">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              className="h-9 w-full pl-8 pr-8 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder={`Tìm IP hoặc ${tab === 'trust' ? 'mô tả' : 'lý do'}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Tìm trong danh sách IP"
            />
            {search && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700"
                onClick={() => setSearch('')}
                aria-label="Xoá tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center bg-white border border-neutral-200 rounded-md p-0.5">
            {(Object.keys(TAB_META) as SecurityTab[]).map((key) => {
              const t = TAB_META[key]
              const Icon = t.icon
              const active = tab === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTab(key)
                    setSearch('')
                  }}
                  className={`px-2.5 h-8 rounded text-xs font-semibold inline-flex items-center gap-1 transition ${
                    active
                      ? key === 'blacklist'
                        ? 'bg-rose-50 text-rose-700'
                        : key === 'whitelist'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-sky-50 text-sky-700'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                  aria-label={t.label}
                  aria-pressed={active}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="tabular-nums text-[10px] opacity-80">{counts[key]}</span>
                </button>
              )
            })}
          </div>

          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
              <X size={12} className="mr-1" /> Xoá lọc
            </Button>
          )}

          <span className="text-xs text-neutral-500 tabular-nums">
            {filtered.length}/{data.length} · tổng {totalIps} IP
            {hasFilter ? ' (đã lọc)' : ''}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-neutral-500">{meta.shortHint}</p>
      </div>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được danh sách IP"
            message="Kiểm tra kết nối / quyền QTHT rồi thử lại."
            onRetry={refetchTab}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={isFilteredEmpty ? Search : meta.icon}
            title={isFilteredEmpty ? 'Không có IP khớp bộ lọc' : meta.emptyTitle}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi từ khoá tìm kiếm.'
                : meta.emptyDesc
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: () => setSearch('') }
                : { label: meta.addLabel, onClick: () => setModalOpen(true) }
            }
          />
        </div>
      ) : (
        <AppTable
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          showSearch={false}
          density="compact"
          loadingRows={6}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={handleRefresh}
        />
      )}

      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={meta.addLabel}>
        <p className="text-xs text-neutral-500 mb-3 -mt-1">{meta.shortHint}</p>
        <AppForm
          schema={tab === 'trust' ? trustSchema : ipSchema}
          defaultValues={{ ipAddress: '', reason: '', description: '' }}
          onSubmit={(v) => {
            if (tab === 'blacklist') banMutation.mutate(v)
            if (tab === 'whitelist') whiteMutation.mutate(v)
            if (tab === 'trust') trustMutation.mutate(v)
          }}
          fields={[
            {
              name: 'ipAddress',
              label: 'Địa chỉ IP',
              placeholder: 'VD: 203.0.113.10',
              description: 'Chỉ hỗ trợ IPv4.',
            },
            {
              name: tab === 'trust' ? 'description' : 'reason',
              label: tab === 'trust' ? 'Mô tả' : 'Lý do',
              placeholder:
                tab === 'trust'
                  ? 'VD: Gateway nội bộ DC-HN'
                  : tab === 'blacklist'
                    ? 'VD: Brute-force login'
                    : 'VD: Văn phòng Hà Nội',
            },
          ]}
          submitText="Xác nhận"
          isLoading={banMutation.isPending || whiteMutation.isPending || trustMutation.isPending}
        />
      </AppModal>
      {confirmDialog}
    </div>
  )
}
