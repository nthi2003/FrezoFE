// ============================================================
// CommissionsPage — cấu hình mức HH theo sale + bảng phát sinh
// Hoa hồng = doanh số đã thu × % (EU cài theo sale / mặc định / override trên HĐ)
// ============================================================

import { useMemo, useState } from 'react'
import {
  Percent, Users, Receipt, Package, Plus, RefreshCw, Check, Banknote, Ban,
} from 'lucide-react'
import {
  Button, EmptyState, ErrorState, AppModal, Label, PageGuideButton, RowActions,
  type PageGuideConfig,
} from '@frezo/ui'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { formatCurrency } from '@frezo/utils'
import {
  useCommissionDashboard,
  useCommissionRules,
  useCommissionEntries,
  useUpsertCommissionRule,
  useDeleteCommissionRule,
  useCommissionEntryAction,
  type CommissionEntry,
  type CommissionRule,
} from '../hooks/useCrm'

const GUIDE: PageGuideConfig = {
  title: 'Hoa hồng bán hàng',
  subtitle: 'Cài mức % theo từng nhân viên bán — hoá đơn tự tính hoa hồng theo doanh số đã thu.',
  sections: [
    {
      heading: 'Cách hoạt động',
      type: 'steps',
      steps: [
        { title: 'Cài mức mặc định', description: 'Dòng tên đăng nhập = * là % áp dụng cho mọi nhân viên bán chưa có cấu hình riêng.' },
        { title: 'Cài theo nhân viên bán', description: 'Thêm tên đăng nhập + % riêng (ví dụ nhân viên A 7%, nhân viên B 3%).' },
        { title: 'Gắn trên hoá đơn', description: 'Khi tạo hoá đơn chọn nhân viên bán / ghi đè %. Thu tiền → hệ thống ghi bản ghi hoa hồng.' },
        { title: 'Theo dõi', description: 'Bảng tổng hợp: số đơn + tổng số lượng hàng + tiền hoa hồng theo từng nhân viên bán.' },
      ],
    },
    {
      heading: 'Công thức',
      type: 'notes',
      notes: 'Hoa hồng = số tiền đã thu trên hoá đơn × (% hoa hồng / 100). Không thay phiếu lương — duyệt/chi trả thủ công trên tab phát sinh.',
    },
  ],
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  PAID: 'Đã trả',
  VOID: 'Đã huỷ',
}

export function CommissionsPage({ embedded }: { embedded?: boolean } = {}) {
  const dash = useCommissionDashboard()
  const rulesQ = useCommissionRules()
  const entriesQ = useCommissionEntries()
  const upsert = useUpsertCommissionRule()
  const delRule = useDeleteCommissionRule()
  const entryAction = useCommissionEntryAction()

  const [tab, setTab] = useState<'rules' | 'entries'>('rules')
  const [showRule, setShowRule] = useState(false)
  const [ruleForm, setRuleForm] = useState({ salespersonUsername: '', ratePercent: '5', note: '' })

  const rules = useMemo(() => (Array.isArray(rulesQ.data) ? rulesQ.data : []), [rulesQ.data])
  const entries = useMemo(() => (Array.isArray(entriesQ.data) ? entriesQ.data : []), [entriesQ.data])
  const d = dash.data

  const ruleColumns: AppTableColumn<CommissionRule>[] = [
    {
      key: 'salespersonUsername',
      title: 'Nhân viên bán',
      render: (_, r) => (
        <span className="font-mono text-sm font-semibold text-neutral-800">
          {r.salespersonUsername === '*' ? '* (mặc định)' : r.salespersonUsername}
        </span>
      ),
    },
    {
      key: 'ratePercent',
      title: '% hoa hồng',
      align: 'right',
      render: (_, r) => <span className="tabular-nums font-bold text-emerald-700">{Number(r.ratePercent).toFixed(2)}%</span>,
    },
    {
      key: 'active',
      title: 'Trạng thái',
      render: (_, r) => (
        <span className={`text-xs font-semibold ${r.active !== false ? 'text-emerald-600' : 'text-neutral-400'}`}>
          {r.active !== false ? 'Đang hiệu lực' : 'Tắt'}
        </span>
      ),
    },
    {
      key: 'note',
      title: 'Ghi chú',
      render: (_, r) => <span className="text-xs text-neutral-500 truncate max-w-[200px] block">{r.note || '—'}</span>,
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      render: (_, r) => (
        <RowActions
          align="end"
          actions={[
            {
              kind: 'delete',
              hidden: r.salespersonUsername === '*',
              onClick: () => delRule.mutate(r.id),
            },
          ]}
        />
      ),
    },
  ]

  const entryColumns: AppTableColumn<CommissionEntry>[] = [
    {
      key: 'invoiceCode',
      title: 'Hoá đơn',
      render: (_, e) => <span className="font-mono text-sm font-semibold text-primary-700">{e.invoiceCode || e.invoiceId}</span>,
    },
    {
      key: 'salespersonUsername',
      title: 'Nhân viên bán',
      render: (_, e) => <span className="font-mono text-xs">{e.salespersonUsername}</span>,
    },
    {
      key: 'itemQuantity',
      title: 'SL hàng',
      align: 'right',
      render: (_, e) => <span className="tabular-nums text-sm">{Number(e.itemQuantity ?? 0).toLocaleString('vi-VN')}</span>,
    },
    {
      key: 'baseAmount',
      title: 'Doanh số (đã thu)',
      align: 'right',
      render: (_, e) => <span className="tabular-nums text-sm">{formatCurrency(Number(e.baseAmount ?? 0))}</span>,
    },
    {
      key: 'ratePercent',
      title: '%',
      align: 'right',
      render: (_, e) => <span className="tabular-nums text-sm">{Number(e.ratePercent).toFixed(2)}%</span>,
    },
    {
      key: 'commissionAmount',
      title: 'Hoa hồng',
      align: 'right',
      render: (_, e) => (
        <span className="tabular-nums font-semibold text-emerald-700">
          {formatCurrency(Number(e.commissionAmount ?? 0))}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (_, e) => (
        <span className="text-xs font-semibold text-neutral-600">{STATUS_LABEL[e.status] || e.status}</span>
      ),
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      render: (_, e) => (
        <RowActions
          align="end"
          actions={[
            {
              key: 'approve',
              icon: Check,
              tooltip: 'Duyệt',
              tone: 'emerald',
              hidden: e.status !== 'PENDING',
              onClick: () => entryAction.mutate({ id: e.id, action: 'approve' }),
            },
            {
              key: 'mark-paid',
              icon: Banknote,
              tooltip: 'Đánh dấu đã trả',
              tone: 'blue',
              hidden: e.status !== 'PENDING' && e.status !== 'APPROVED',
              onClick: () => entryAction.mutate({ id: e.id, action: 'mark-paid' }),
            },
            {
              key: 'void',
              icon: Ban,
              tooltip: 'Huỷ',
              tone: 'rose',
              hidden: e.status === 'VOID' || e.status === 'PAID',
              onClick: () => entryAction.mutate({ id: e.id, action: 'void' }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className={`space-y-4 ${embedded ? '' : 'p-1'}`}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-neutral-900">Hoa hồng bán hàng</h1>
            <p className="text-sm text-neutral-500">Cấu hình % theo nhân viên bán · tự tính trên hoá đơn</p>
          </div>
          <PageGuideButton guide={GUIDE} />
        </div>
      )}
      {embedded && (
        <div className="flex justify-end">
          <PageGuideButton guide={GUIDE} />
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Percent} label="Tổng hoa hồng" value={formatCurrency(Number(d?.totalCommission ?? 0))} tone="emerald" />
        <Kpi icon={Receipt} label="Số hoá đơn" value={String(d?.totalInvoices ?? 0)} tone="blue" />
        <Kpi icon={Package} label="Tổng SL hàng" value={Number(d?.totalQuantity ?? 0).toLocaleString('vi-VN')} tone="amber" />
        <Kpi icon={Users} label="Số NV bán" value={String(d?.salespersonCount ?? 0)}
          hint={`Mặc định ${Number(d?.defaultRatePercent ?? 5).toFixed(1)}%`} tone="violet" />
      </div>

      {/* By salesperson */}
      {(d?.bySalesperson?.length ?? 0) > 0 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-bold text-neutral-800 mb-3">Theo từng nhân viên bán (số đơn + hoa hồng)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-neutral-400 border-b">
                  <th className="py-2 pr-3">Nhân viên bán</th>
                  <th className="py-2 pr-3 text-right">Số đơn</th>
                  <th className="py-2 pr-3 text-right">SL hàng</th>
                  <th className="py-2 pr-3 text-right">Doanh số</th>
                  <th className="py-2 text-right">Hoa hồng</th>
                </tr>
              </thead>
              <tbody>
                {d!.bySalesperson.map((row) => (
                  <tr key={row.salespersonUsername} className="border-b border-neutral-50">
                    <td className="py-2 pr-3 font-mono font-semibold">{row.salespersonUsername}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{row.invoiceCount}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{Number(row.totalQuantity).toLocaleString('vi-VN')}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatCurrency(Number(row.totalBase))}</td>
                    <td className="py-2 text-right tabular-nums font-semibold text-emerald-700">
                      {formatCurrency(Number(row.totalCommission))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 border-b border-neutral-200">
          {([
            { id: 'rules', label: 'Cấu hình mức %' },
            { id: 'entries', label: `Phát sinh (${entries.length})` },
          ] as const).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px ${
                tab === t.id ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-neutral-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm"
            onClick={() => { dash.refetch(); rulesQ.refetch(); entriesQ.refetch() }}>
            <RefreshCw size={14} /> Làm mới
          </Button>
          {tab === 'rules' && (
            <Button type="button" size="sm" onClick={() => {
              setRuleForm({ salespersonUsername: '', ratePercent: String(d?.defaultRatePercent ?? 5), note: '' })
              setShowRule(true)
            }}>
              <Plus size={14} /> Thêm mức sale
            </Button>
          )}
        </div>
      </div>

      {tab === 'rules' && (
        rulesQ.isError ? (
          <ErrorState title="Không tải cấu hình" onRetry={() => rulesQ.refetch()} />
        ) : rules.length === 0 ? (
          <EmptyState icon={Percent} title="Chưa có mức hoa hồng" description="Thêm mức mặc định (*) hoặc theo từng nhân viên bán." />
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <AppTable
              columns={ruleColumns}
              data={rules}
              getRowId={(r) => r.id}
              isLoading={rulesQ.isLoading}
              density="compact"
              showSearch={false}
            />
          </div>
        )
      )}

      {tab === 'entries' && (
        entriesQ.isError ? (
          <ErrorState title="Không tải phát sinh" onRetry={() => entriesQ.refetch()} />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Chưa có hoa hồng phát sinh"
            description="Thu tiền hoá đơn đã gắn sale → hệ thống tự tạo bản ghi."
          />
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <AppTable
              columns={entryColumns}
              data={entries}
              getRowId={(e) => e.id}
              isLoading={entriesQ.isLoading}
              density="compact"
              showSearch={false}
            />
          </div>
        )
      )}

      <AppModal
        isOpen={showRule}
        onClose={() => setShowRule(false)}
        title="Cài mức hoa hồng"
        description="Nhập tên đăng nhập nhân viên bán hoặc * cho mức mặc định toàn công ty."
      >
        <div className="space-y-3">
          <div>
            <Label className="mb-1 block">Tên đăng nhập (* = mặc định)</Label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm font-mono"
              value={ruleForm.salespersonUsername}
              onChange={(e) => setRuleForm({ ...ruleForm, salespersonUsername: e.target.value })}
              placeholder="vd: sale01 hoặc *"
            />
          </div>
          <div>
            <Label className="mb-1 block">% hoa hồng</Label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={ruleForm.ratePercent}
              onChange={(e) => setRuleForm({ ...ruleForm, ratePercent: e.target.value })}
            />
          </div>
          <div>
            <Label className="mb-1 block">Ghi chú</Label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={ruleForm.note}
              onChange={(e) => setRuleForm({ ...ruleForm, note: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowRule(false)}>Huỷ</Button>
            <Button
              type="button"
              disabled={upsert.isPending || !ruleForm.salespersonUsername.trim()}
              onClick={() => {
                upsert.mutate(
                  {
                    salespersonUsername: ruleForm.salespersonUsername.trim(),
                    ratePercent: Number(ruleForm.ratePercent),
                    active: true,
                    note: ruleForm.note || undefined,
                  },
                  { onSuccess: () => setShowRule(false) },
                )
              }}
            >
              Lưu
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}

function Kpi({
  icon: Icon, label, value, hint, tone,
}: {
  icon: typeof Percent
  label: string
  value: string
  hint?: string
  tone: 'emerald' | 'blue' | 'amber' | 'violet'
}) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
  }
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3.5 flex gap-2.5 items-start">
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</div>
        <div className="text-lg font-bold text-neutral-900 tabular-nums leading-tight">{value}</div>
        {hint && <div className="text-[10px] text-neutral-400">{hint}</div>}
      </div>
    </div>
  )
}
