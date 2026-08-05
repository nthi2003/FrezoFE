// ============================================================
// RecognitionPage — Ví / Tặng / Lịch sử / Đổi thưởng / Duyệt
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Gift,
  Wallet,
  History,
  Coins,
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react'
import {
  Button,
  PageHeader,
  Dialog,
  DialogContent,
  EmptyState,
  ErrorState,
  ConfirmDialog,
  IconActionButton,
  StatusBadge,
  Select,
  Label,
  type StatusColor,
} from '@frezo/ui'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { useAnyPermission } from '@/lib/hooks/usePermission'
import { CelebrateModalShell } from '@/modules/common/components/CelebrateModalShell'
import {
  CoinsStackIllustration,
  GiftBoxIllustration,
} from '@/modules/common/components/CelebratoryIllustrations'
import { GiftTokenModal } from '../components/GiftTokenModal'
import { usePersonsCombobox } from '../hooks/usePerson'
import {
  useApproveRedeem,
  useCreateRedeem,
  useGiftToken,
  useMyTokenWallet,
  useRecognitionConfig,
  useRejectRedeem,
  useTokenRedeems,
  useTokenTransfers,
  useTokenWallets,
} from '../hooks/useRecognition'
import type { TokenRedeemDto, TokenTransferDto, TokenWalletDto } from '../services/recognitionApi'
import { pageRootClass } from '../utils/pageEmbed'

type TabKey = 'wallet' | 'gift' | 'history' | 'redeem' | 'approve'

const TABS: { key: TabKey; label: string; icon: typeof Wallet }[] = [
  { key: 'wallet', label: 'Ví của tôi', icon: Wallet },
  { key: 'gift', label: 'Tặng token', icon: Gift },
  { key: 'history', label: 'Lịch sử', icon: History },
  { key: 'redeem', label: 'Đổi thưởng', icon: Coins },
  { key: 'approve', label: 'Duyệt đổi thưởng', icon: CheckCircle2 },
]

const REDEEM_STATUS: Record<string, { label: string; color: StatusColor }> = {
  PENDING: { label: 'Chờ duyệt', color: 'warning' },
  APPROVED: { label: 'Đã duyệt', color: 'info' },
  REJECTED: { label: 'Từ chối', color: 'danger' },
  PAID: { label: 'Đã chi lương', color: 'success' },
}

function formatVnd(n?: number | null) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

export function RecognitionPage({ embedded }: { embedded?: boolean } = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: config } = useRecognitionConfig()
  const { data: myWallet, isLoading: walletLoading, isError: walletError, refetch: refetchWallet } =
    useMyTokenWallet()
  const { data: wallets = [] } = useTokenWallets()
  const { data: transfers = [], isLoading: histLoading, isError: histError, refetch: refetchHist } =
    useTokenTransfers()
  const { data: redeems = [], isLoading: redeemLoading, isError: redeemError, refetch: refetchRedeem } =
    useTokenRedeems()
  const gift = useGiftToken()
  const createRedeem = useCreateRedeem()
  const approve = useApproveRedeem()
  const reject = useRejectRedeem()
  const { options: personOptions } = usePersonsCombobox()

  const canApprove = useAnyPermission([
    'QLNS_RECOGNITION_REDEEM_ID_APPROVE',
    'QLNS.RECOGNITION.REDEEM.APPROVE',
  ])

  const rawTab = searchParams.get('tab') as TabKey | null
  const tab: TabKey = TABS.some((t) => t.key === rawTab) ? (rawTab as TabKey) : 'wallet'

  const setTab = (key: TabKey) => {
    const next = new URLSearchParams(searchParams)
    if (key === 'wallet') next.delete('tab')
    else next.set('tab', key)
    setSearchParams(next, { replace: true })
  }

  const [giftOpen, setGiftOpen] = useState(false)
  const [giftSuccess, setGiftSuccess] = useState(false)
  const [toPersonId, setToPersonId] = useState('')
  const [giftAmount, setGiftAmount] = useState(5)
  const [giftNote, setGiftNote] = useState('')
  const [sourceId, setSourceId] = useState<string | undefined>()
  const [sourceType, setSourceType] = useState<'MANUAL' | 'TASK'>('MANUAL')
  const [lastGiftSnapshot, setLastGiftSnapshot] = useState<{ amount: number; label: string } | null>(
    null,
  )

  const [redeemOpen, setRedeemOpen] = useState(false)
  const [redeemAmount, setRedeemAmount] = useState(10)
  const [redeemNote, setRedeemNote] = useState('')

  const [rejectTarget, setRejectTarget] = useState<TokenRedeemDto | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [approveTarget, setApproveTarget] = useState<TokenRedeemDto | null>(null)

  const [search, setSearch] = useState('')

  const tokenToVnd = config?.tokenToVnd ?? myWallet?.tokenToVnd ?? 1000
  const maxGift = config?.maxGiftAmount ?? 100

  // Prefill from Task deep-link: ?personId=&ticketId=&action=gift
  useEffect(() => {
    const personId = searchParams.get('personId')
    const ticketId = searchParams.get('ticketId')
    const action = searchParams.get('action')
    if (action === 'gift' && personId) {
      setToPersonId(personId)
      setSourceId(ticketId || undefined)
      setSourceType(ticketId ? 'TASK' : 'MANUAL')
      setGiftSuccess(false)
      setGiftOpen(true)
      setTab('gift')
      const next = new URLSearchParams(searchParams)
      next.delete('action')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pendingRedeems = useMemo(
    () => redeems.filter((r) => (r.status || '').toUpperCase() === 'PENDING'),
    [redeems],
  )

  const filteredTransfers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return transfers
    return transfers.filter(
      (t) =>
        (t.fromPersonName || '').toLowerCase().includes(q) ||
        (t.toPersonName || '').toLowerCase().includes(q) ||
        (t.note || '').toLowerCase().includes(q) ||
        (t.sourceType || '').toLowerCase().includes(q),
    )
  }, [transfers, search])

  const walletColumns: AppTableColumn<TokenWalletDto>[] = useMemo(
    () => [
      {
        key: 'personName',
        title: 'Nhân sự',
        render: (_, r) => (
          <div className="min-w-0">
            <div className="font-medium truncate max-w-[220px]">{r.personName || r.personId}</div>
            <div className="text-[11px] text-neutral-500 font-mono truncate">{r.personId}</div>
          </div>
        ),
      },
      {
        key: 'balance',
        title: 'Số dư token',
        align: 'right',
        render: (_, r) => <span className="tabular-nums font-semibold">{r.balance}</span>,
      },
      {
        key: 'estimatedVnd',
        title: 'Ước tính VND',
        align: 'right',
        render: (_, r) => (
          <span className="tabular-nums text-neutral-700">{formatVnd(r.estimatedVnd)}</span>
        ),
      },
    ],
    [],
  )

  const transferColumns: AppTableColumn<TokenTransferDto>[] = useMemo(
    () => [
      {
        key: 'createdDate',
        title: 'Thời gian',
        render: (_, r) => (
          <span className="text-xs text-neutral-600">{r.createdDate?.replace('T', ' ').slice(0, 16) || '—'}</span>
        ),
      },
      {
        key: 'from',
        title: 'Người tặng',
        render: (_, r) => r.fromPersonName || r.fromPersonId,
      },
      {
        key: 'to',
        title: 'Người nhận',
        render: (_, r) => r.toPersonName || r.toPersonId,
      },
      {
        key: 'amount',
        title: 'Token',
        align: 'right',
        render: (_, r) => <span className="tabular-nums font-semibold">{r.amount}</span>,
      },
      {
        key: 'sourceType',
        title: 'Nguồn',
        render: (_, r) => (
          <StatusBadge
            label={r.sourceType === 'TASK' ? 'Task' : 'Thủ công'}
            color={r.sourceType === 'TASK' ? 'info' : 'neutral'}
          />
        ),
      },
      {
        key: 'note',
        title: 'Ghi chú',
        render: (_, r) => (
          <span className="text-sm text-neutral-600 truncate max-w-[200px] block">{r.note || '—'}</span>
        ),
      },
    ],
    [],
  )

  const redeemColumns: AppTableColumn<TokenRedeemDto>[] = useMemo(
    () => [
      {
        key: 'personName',
        title: 'Nhân sự',
        render: (_, r) => r.personName || r.personId,
      },
      {
        key: 'amount',
        title: 'Token',
        align: 'right',
        render: (_, r) => <span className="tabular-nums font-semibold">{r.amount}</span>,
      },
      {
        key: 'cashValue',
        title: 'VND',
        align: 'right',
        render: (_, r) => <span className="tabular-nums">{formatVnd(r.cashValue)}</span>,
      },
      {
        key: 'status',
        title: 'Trạng thái',
        align: 'center',
        render: (_, r) => {
          const st = (r.status || '').toUpperCase()
          const meta = REDEEM_STATUS[st] || { label: r.status || '—', color: 'neutral' as StatusColor }
          return <StatusBadge label={meta.label} color={meta.color} />
        },
      },
      {
        key: 'period',
        title: 'Kỳ lương',
        render: (_, r) =>
          r.targetMonth && r.targetYear ? `${r.targetMonth}/${r.targetYear}` : '—',
      },
      {
        key: 'actions',
        title: 'Thao tác',
        align: 'right',
        width: 100,
        render: (_, r) => {
          // UI luôn hiện nút trên PENDING — BE gate 403 nếu thiếu quyền
          if ((r.status || '').toUpperCase() !== 'PENDING') return null
          return (
            <div className="inline-flex items-center justify-end gap-0.5">
              <IconActionButton
                tooltip="Duyệt"
                tone="blue"
                size="sm"
                disabled={approve.isPending}
                onClick={() => setApproveTarget(r)}
              >
                <CheckCircle2 size={14} />
              </IconActionButton>
              <IconActionButton
                tooltip="Từ chối"
                tone="rose"
                size="sm"
                disabled={reject.isPending}
                onClick={() => {
                  setRejectReason('')
                  setRejectTarget(r)
                }}
              >
                <XCircle size={14} />
              </IconActionButton>
            </div>
          )
        },
      },
    ],
    [approve.isPending, reject.isPending],
  )

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={() => {
          setGiftNote('')
          setGiftAmount(5)
          setGiftSuccess(false)
          setGiftOpen(true)
          setTab('gift')
        }}
      >
        <Gift size={16} /> Tặng token
      </Button>
      <Button variant="outline" className="gap-1.5" onClick={() => setRedeemOpen(true)}>
        <Coins size={16} /> Đổi thưởng
      </Button>
    </div>
  )

  return (
    <div className={pageRootClass(embedded)}>
      {!embedded && (
        <PageHeader
          title="Ghi nhận"
          description="Tặng token ghi nhận đóng góp · đổi thưởng · nghiệm thu kế toán."
          actions={toolbar}
        />
      )}
      {embedded && <div className="flex justify-end gap-2 mb-3">{toolbar}</div>}

      {/* My wallet summary */}
      <div className="mb-4 rounded-xl border border-neutral-200 bg-gradient-to-br from-amber-50/80 to-white px-4 py-3 flex flex-wrap items-center gap-6">
        <div>
          <div className="text-xs text-neutral-500 uppercase tracking-wide">Ví của tôi</div>
          <div className="text-2xl font-semibold tabular-nums text-neutral-900">
            {walletLoading ? '…' : myWallet?.balance ?? 0}{' '}
            <span className="text-sm font-normal text-neutral-500">token</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">Ước tính</div>
          <div className="text-lg font-medium tabular-nums">{formatVnd(myWallet?.estimatedVnd)}</div>
        </div>
        <div className="text-xs text-neutral-500 ml-auto">
          1 token = {formatVnd(tokenToVnd)} · Max tặng / lần: {maxGift}
        </div>
      </div>

      {/* Internal tabs — luôn hiện đủ 5 tab để review UI */}
      <div className="flex flex-wrap gap-1 border-b border-neutral-200 mb-4">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-primary-600 text-primary-700 font-medium'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Icon size={14} />
              {t.label}
              {t.key === 'approve' && pendingRedeems.length > 0 && (
                <span className="ml-1 text-[10px] bg-amber-100 text-amber-800 rounded-full px-1.5">
                  {pendingRedeems.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {walletError && tab === 'wallet' && (
        <ErrorState title="Không tải được ví" onRetry={() => refetchWallet()} />
      )}

      {tab === 'wallet' && !walletError && (
        wallets.length === 0 && !myWallet && !walletLoading ? (
          <EmptyState title="Chưa có ví token" description="Ví được tạo khi bạn mở module hoặc nhận token." />
        ) : (
          <AppTable
            columns={walletColumns}
            data={wallets.length ? wallets : myWallet ? [myWallet] : []}
            isLoading={walletLoading}
            showSearch={false}
            pageSize={10}
            pageSizeOptions={[10]}
          />
        )
      )}

      {tab === 'gift' && (
        <div className="max-w-lg overflow-hidden rounded-2xl border border-amber-100/80 bg-[#FFFCFA] shadow-sm">
          <div className="relative grid gap-0 border-b border-amber-100/70 sm:grid-cols-[7.5rem_1fr] bg-[linear-gradient(145deg,#FFF7ED_0%,#FEF3C7_42%,#ECFDF5_100%)]">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-500 to-emerald-700" aria-hidden />
            <div className="flex items-center justify-center px-3 py-4">
              <div className="w-[5.5rem]">
                <GiftBoxIllustration aria-hidden />
              </div>
            </div>
            <div className="flex flex-col justify-center px-5 py-4 sm:pl-1">
              <h3 className="text-lg font-semibold text-neutral-900">Tặng token</h3>
              <p className="mt-0.5 text-base text-neutral-600">
                Chọn người nhận và số token. Số dư trừ ngay khi gửi.
              </p>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <Label className="text-base font-medium text-neutral-800">Người nhận</Label>
              <div className="mt-1.5">
                <Select
                  options={[{ value: '', label: '— Chọn nhân viên —' }, ...personOptions]}
                  value={toPersonId}
                  onChange={(v) => setToPersonId(v)}
                  placeholder="Chọn nhân viên"
                  showSearch
                  showClear
                />
              </div>
            </div>
            <div>
              <Label className="text-base font-medium text-neutral-800">
                Số token <span className="font-normal text-neutral-500">(max {maxGift})</span>
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[5, 10, 20]
                  .filter((n) => n <= maxGift)
                  .map((n) => {
                    const active = giftAmount === n
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setGiftAmount(n)}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium tabular-nums transition-colors ${
                          active
                            ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-amber-300 hover:bg-amber-50/50'
                        }`}
                      >
                        {n}
                      </button>
                    )
                  })}
              </div>
              <input
                type="number"
                min={1}
                max={maxGift}
                value={giftAmount}
                onChange={(e) => setGiftAmount(Number(e.target.value) || 0)}
                className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-base tabular-nums focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
              <p className="mt-1.5 text-sm text-neutral-500">
                ≈ <span className="font-medium text-emerald-700">{formatVnd(giftAmount * tokenToVnd)}</span>
              </p>
            </div>
            <div>
              <Label className="text-base font-medium text-neutral-800">Ghi chú / lý do</Label>
              <textarea
                rows={3}
                value={giftNote}
                onChange={(e) => setGiftNote(e.target.value)}
                placeholder="Ví dụ: Hỗ trợ deploy gấp, review PR tốt…"
                className="mt-1.5 w-full resize-none rounded-lg border border-neutral-200 px-3 py-2.5 text-base focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            {sourceId && (
              <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                Nguồn: Task / Ticket <span className="font-mono text-neutral-700">{sourceId}</span>
              </p>
            )}
            <Button
              disabled={!toPersonId || giftAmount <= 0 || gift.isPending}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() =>
                gift.mutate(
                  {
                    toPersonId,
                    amount: giftAmount,
                    note: giftNote || undefined,
                    sourceType,
                    sourceId,
                  },
                  {
                    onSuccess: () => {
                      setGiftNote('')
                      setSourceId(undefined)
                      setSourceType('MANUAL')
                      setTab('history')
                    },
                  },
                )
              }
            >
              <Gift size={16} />
              {gift.isPending ? 'Đang gửi…' : 'Gửi token'}
            </Button>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <>
          <FilterBar
            className="mb-3"
            hasActiveFilters={!!search.trim()}
            onClear={() => setSearch('')}
            countLabel={`${filteredTransfers.length} giao dịch`}
          >
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
                placeholder="Tìm theo tên / ghi chú…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </FilterBar>
          {histError ? (
            <ErrorState title="Không tải được lịch sử" onRetry={() => refetchHist()} />
          ) : filteredTransfers.length === 0 && !histLoading ? (
            <EmptyState title="Chưa có giao dịch" />
          ) : (
            <AppTable
              columns={transferColumns}
              data={filteredTransfers}
              isLoading={histLoading}
              showSearch={false}
              pageSize={10}
              pageSizeOptions={[10]}
            />
          )}
        </>
      )}

      {tab === 'redeem' && (
        <>
          <div className="mb-3 flex justify-end">
            <Button variant="outline" className="gap-1.5" onClick={() => setRedeemOpen(true)}>
              <Coins size={16} /> Tạo yêu cầu đổi
            </Button>
          </div>
          {redeemError ? (
            <ErrorState title="Không tải được yêu cầu" onRetry={() => refetchRedeem()} />
          ) : redeems.length === 0 && !redeemLoading ? (
            <EmptyState title="Chưa có yêu cầu đổi thưởng" />
          ) : (
            <AppTable
              columns={redeemColumns}
              data={redeems}
              isLoading={redeemLoading}
              showSearch={false}
              pageSize={10}
              pageSizeOptions={[10]}
            />
          )}
        </>
      )}

      {tab === 'approve' && (
        <>
          {!canApprove && (
            <p className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Tab kế toán — cần quyền APPROVE. Admin/Manager vẫn thao tác được sau khi seed permission.
            </p>
          )}
          {redeemError ? (
            <ErrorState title="Không tải được hàng đợi duyệt" onRetry={() => refetchRedeem()} />
          ) : pendingRedeems.length === 0 && !redeemLoading ? (
            <EmptyState
              title="Không có yêu cầu chờ duyệt"
              description="Khi EU gửi Đổi thưởng, yêu cầu PENDING sẽ hiện ở đây."
            />
          ) : (
            <AppTable
              columns={redeemColumns}
              data={pendingRedeems}
              isLoading={redeemLoading}
              showSearch={false}
              pageSize={10}
              pageSizeOptions={[10]}
            />
          )}
        </>
      )}

      <GiftTokenModal
        isOpen={giftOpen}
        onClose={() => {
          setGiftOpen(false)
          setGiftSuccess(false)
        }}
        personOptions={personOptions}
        toPersonId={toPersonId}
        onToPersonIdChange={setToPersonId}
        giftAmount={giftAmount}
        onGiftAmountChange={setGiftAmount}
        giftNote={giftNote}
        onGiftNoteChange={setGiftNote}
        maxGift={maxGift}
        tokenToVnd={tokenToVnd}
        sourceId={sourceId}
        isPending={gift.isPending}
        showSuccess={giftSuccess}
        successAmount={lastGiftSnapshot?.amount}
        successRecipientLabel={lastGiftSnapshot?.label}
        onSubmit={() => {
          const label =
            personOptions.find((p) => p.value === toPersonId)?.label || toPersonId
          const amount = giftAmount
          gift.mutate(
            {
              toPersonId,
              amount,
              note: giftNote || undefined,
              sourceType,
              sourceId,
            },
            {
              onSuccess: () => {
                setLastGiftSnapshot({ amount, label })
                setGiftSuccess(true)
                setGiftNote('')
                setSourceId(undefined)
                setSourceType('MANUAL')
              },
            },
          )
        }}
      />

      <Dialog open={redeemOpen} onOpenChange={(open) => !open && setRedeemOpen(false)}>
        <DialogContent className="max-w-md overflow-hidden border-0 p-0 shadow-xl sm:rounded-2xl">
          <CelebrateModalShell
            layout="form"
            tone="amber"
            illustration={<CoinsStackIllustration aria-hidden />}
            title="Đổi thưởng"
            description="Token tạm giữ khi gửi yêu cầu. Kế toán duyệt xong xếp vào kỳ lương hiện tại."
            footer={
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setRedeemOpen(false)}>
                  Huỷ
                </Button>
                <Button
                  disabled={redeemAmount <= 0 || createRedeem.isPending}
                  className="bg-emerald-700 text-white hover:bg-emerald-800"
                  onClick={() =>
                    createRedeem.mutate(
                      { amount: redeemAmount, note: redeemNote || undefined },
                      {
                        onSuccess: () => {
                          setRedeemOpen(false)
                          setTab('redeem')
                        },
                      },
                    )
                  }
                >
                  {createRedeem.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}
                </Button>
              </div>
            }
          >
            <div>
              <Label className="text-base font-medium text-neutral-800">Số token</Label>
              <input
                type="number"
                min={1}
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(Number(e.target.value) || 0)}
                className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-base tabular-nums focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
              <p className="mt-1.5 text-base text-neutral-500">
                ≈ {formatVnd(redeemAmount * tokenToVnd)} · Số dư:{' '}
                <span className="font-medium text-emerald-700">{myWallet?.balance ?? 0}</span>
              </p>
            </div>
            <div>
              <Label className="text-base font-medium text-neutral-800">Ghi chú</Label>
              <textarea
                rows={2}
                value={redeemNote}
                onChange={(e) => setRedeemNote(e.target.value)}
                className="mt-1.5 w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-base focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </CelebrateModalShell>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        title="Duyệt đổi thưởng?"
        message={
          approveTarget
            ? `Cộng ${formatVnd(approveTarget.cashValue)} vào kỳ lương ${new Date().getMonth() + 1}/${new Date().getFullYear()} cho ${approveTarget.personName || approveTarget.personId}.`
            : ''
        }
        confirmText="Duyệt"
        variant="default"
        isLoading={approve.isPending}
        onConfirm={() => {
          if (!approveTarget) return
          approve.mutate(approveTarget.id, { onSuccess: () => setApproveTarget(null) })
        }}
      />

      <AppModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Từ chối đổi thưởng"
        maxWidth="sm"
      >
        <div className="space-y-3">
          <Label>Lý do</Label>
          <textarea
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Huỷ
            </Button>
            <Button
              className="bg-red-600 text-white"
              disabled={reject.isPending}
              onClick={() => {
                if (!rejectTarget) return
                reject.mutate(
                  { id: rejectTarget.id, reason: rejectReason },
                  { onSuccess: () => setRejectTarget(null) },
                )
              }}
            >
              Từ chối
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}
