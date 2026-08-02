import { useEffect, useState } from 'react'
import { Sparkles, Save, RotateCw, CalendarRange, HelpCircle } from 'lucide-react'
import { Button, PageHeader, Select, Label, AppTooltip } from '@frezo/ui'
import {
  useAccountingSetting, useUpdateSetting, useSeedCoa, useEnsureYear,
} from '../hooks/useAccounting'
import type { AccountingStandard } from '../services/accountingApi'
import { pageRootClass } from '../utils/pageEmbed'
import { usePermission } from '@/lib/hooks/usePermission'

const STANDARD_OPTIONS = [
  { value: 'TT133', label: 'TT 133/2016 — Doanh nghiệp nhỏ và vừa' },
  { value: 'TT99', label: 'TT 99/2025 — Áp dụng chung (thay thế TT 200)' },
]

const CURRENCY_OPTIONS = [
  { value: 'VND', label: 'VND' },
  { value: 'USD', label: 'USD' },
]

const STRATEGY_OPTIONS = [
  { value: 'AGGREGATE_PERIOD', label: '1 bút toán tổng hợp / kỳ (Khuyến nghị)' },
  { value: 'PER_DEPT',         label: '1 bút toán / phòng ban / kỳ' },
  { value: 'PER_EMPLOYEE',     label: '1 bút toán / nhân viên / kỳ (chi tiết)' },
]

/** Giải thích từng tham số — đối chiếu BE (PayrollGLPostingService, AccountService seed). */
const SETTING_HINTS = {
  standard:
    'Chọn TT133 (DN nhỏ/vừa) hoặc TT99 (thay TT200). Ảnh hưởng: bộ TK mẫu khi Seed COA, chuẩn gắn từng TK trên Hệ thống tài khoản, và TK lương/BHTN mặc định khi đổi chuẩn.',
  baseCurrency:
    'Tiền tệ gốc của sổ kế toán (ISO). Hiện lưu cấu hình; các màn Chứng từ, Sổ cái, Bảng cân đối hiển thị số tiền VND.',
  payrollPostingStrategy:
    'Quyết định số bút toán khi hạch toán lương sang GL. Hiện backend luôn gộp 1 bút toán/kỳ (AGGREGATE_PERIOD). PER_DEPT / PER_EMPLOYEE mới lưu cấu hình. Ảnh hưởng: QLNS → Bảng lương → Hạch toán → GL.',
  accSalaryExpense:
    'TK Nợ ghi tổng lương gộp kỳ. Ảnh hưởng: dòng Nợ bút toán nguồn PAYROLL khi bấm Hạch toán → GL trên Bảng lương (QLNS).',
  accSalaryPayable:
    'TK Có ghi phải trả lương thực nhận cho CBCNV (334). Ảnh hưởng: dòng Có bút toán lương QLNS → Chứng từ kế toán.',
  accBhxhPayable:
    'TK Có ghi BHXH khấu trừ từ lương NV (3383). Ảnh hưởng: dòng Có bút toán lương QLNS → GL.',
  accBhytPayable:
    'TK Có ghi BHYT khấu trừ từ lương NV (3384). Ảnh hưởng: dòng Có bút toán lương QLNS → GL.',
  accBhtnPayable:
    'TK Có ghi BHTN khấu trừ từ lương NV (TT133: 3385, TT99: 3386). Ảnh hưởng: dòng Có bút toán lương QLNS → GL.',
  accPitPayable:
    'TK Có ghi thuế TNCN khấu trừ từ lương (3335). Ảnh hưởng: dòng Có bút toán lương QLNS → GL.',
  accUnionFee:
    'TK Có ghi kinh phí công đoàn khấu trừ từ lương (3382). Ảnh hưởng: dòng Có bút toán lương QLNS → GL.',
} as const

function SettingHintIcon({ label, hint }: { label: string; hint: string }) {
  return (
    <AppTooltip content={hint} contentClassName="max-w-sm">
      <button
        type="button"
        className="inline-flex shrink-0 text-neutral-400 hover:text-primary-600 cursor-help"
        aria-label={`Giải thích: ${label}`}
      >
        <HelpCircle size={14} strokeWidth={2} />
      </button>
    </AppTooltip>
  )
}

function SettingLabel({
  htmlFor,
  label,
  hint,
  className,
}: {
  htmlFor?: string
  label: string
  hint: string
  className?: string
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className ?? ''}`}>
      {htmlFor ? <Label htmlFor={htmlFor}>{label}</Label> : (
        <span className="text-sm font-medium text-neutral-700">{label}</span>
      )}
      <SettingHintIcon label={label} hint={hint} />
    </div>
  )
}

export function AccountingSettingsPage({
  embedded,
  onOpenPeriods,
}: {
  embedded?: boolean
  onOpenPeriods?: () => void
} = {}) {
  const { data: setting, isLoading } = useAccountingSetting()
  const updateSetting = useUpdateSetting()
  const seedCoa = useSeedCoa()
  const ensureYear = useEnsureYear()
  const canUpdateSetting = usePermission('ACCOUNTING.SETTING.UPDATE')
  const canCreateAccount = usePermission('ACCOUNTING.ACCOUNTS.CREATE')
  const canCreatePeriod = usePermission('ACCOUNTING.PERIODS.CREATE')

  const [form, setForm] = useState({
    standard: 'TT133' as AccountingStandard,
    baseCurrency: 'VND',
    payrollPostingStrategy: 'AGGREGATE_PERIOD',
    accSalaryExpense: '6421',
    accSalaryPayable: '334',
    accBhxhPayable: '3383',
    accBhytPayable: '3384',
    accBhtnPayable: '3385',
    accPitPayable: '3335',
    accUnionFee: '3382',
  })

  useEffect(() => {
    if (setting) setForm((prev) => ({ ...prev, ...setting }))
  }, [setting])

  const onSave = () => {
    updateSetting.mutate({ ...form, seedCoa: false })
  }

  const onSaveAndSeed = () => {
    updateSetting.mutate({ ...form, seedCoa: true })
  }

  const onEnsureCurrentYear = () => {
    ensureYear.mutate(new Date().getFullYear())
  }

  return (
    <div className={pageRootClass(embedded, 'max-w-5xl mx-auto space-y-6')}>
      {!embedded && (
      <PageHeader
        title="Cấu hình kế toán"
        description="Chọn chuẩn TT133/TT99, mapping tài khoản mặc định, khởi tạo COA và năm tài chính."
        actions={
          onOpenPeriods ? (
            <Button variant="outline" className="gap-2" onClick={onOpenPeriods}>
              <CalendarRange size={16} />
              Kỳ kế toán (khóa / mở)
            </Button>
          ) : undefined
        }
      />
      )}

      {embedded && onOpenPeriods && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="gap-2 h-9" onClick={onOpenPeriods}>
            <CalendarRange size={15} />
            Kỳ kế toán
          </Button>
        </div>
      )}

      {/* Standard + Currency */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold text-neutral-900">Chuẩn kế toán</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <SettingLabel
              htmlFor="acc-setting-standard"
              label="Thông tư áp dụng"
              hint={SETTING_HINTS.standard}
            />
            <Select
              id="acc-setting-standard"
              options={STANDARD_OPTIONS}
              value={form.standard}
              onChange={(v) =>
                setForm({ ...form, standard: (v as AccountingStandard) || 'TT133' })
              }
              placeholder="Chọn thông tư…"
              showSearch={false}
              aria-label="Thông tư áp dụng"
            />
          </div>
          <div className="space-y-1.5">
            <SettingLabel
              htmlFor="acc-setting-currency"
              label="Tiền tệ"
              hint={SETTING_HINTS.baseCurrency}
            />
            <Select
              id="acc-setting-currency"
              options={CURRENCY_OPTIONS}
              value={form.baseCurrency}
              onChange={(v) => setForm({ ...form, baseCurrency: v || 'VND' })}
              placeholder="Chọn tiền tệ…"
              showSearch={false}
              aria-label="Tiền tệ"
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <SettingLabel
              htmlFor="acc-setting-payroll-strategy"
              label="Chiến lược hạch toán bảng lương"
              hint={SETTING_HINTS.payrollPostingStrategy}
            />
            <Select
              id="acc-setting-payroll-strategy"
              options={STRATEGY_OPTIONS}
              value={form.payrollPostingStrategy}
              onChange={(v) =>
                setForm({ ...form, payrollPostingStrategy: v || 'AGGREGATE_PERIOD' })
              }
              placeholder="Chọn chiến lược…"
              showSearch={false}
              aria-label="Chiến lược hạch toán bảng lương"
            />
          </div>
        </div>
      </section>

      {/* TK mapping */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold text-neutral-900">
          Mapping TK cho hạch toán Payroll
        </h3>
        <p className="text-sm text-neutral-500">
          Các TK dưới đây sẽ được dùng khi hạch toán bảng lương. Có thể sửa số hiệu cho khớp danh mục TK thực tế.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['accSalaryExpense', 'TK chi phí lương (Nợ)', 'VD 6421 / 641 / 642'],
            ['accSalaryPayable', 'TK phải trả CBCNV (Có)', '334'],
            ['accBhxhPayable', 'TK BHXH (Có)', '3383'],
            ['accBhytPayable', 'TK BHYT (Có)', '3384'],
            ['accBhtnPayable', 'TK BHTN (Có)', '3385 / 3386'],
            ['accPitPayable', 'TK thuế TNCN (Có)', '3335'],
            ['accUnionFee', 'TK KPCĐ (Có)', '3382'],
          ].map(([field, label, hint]) => (
            <div key={field}>
              <SettingLabel
                label={label}
                hint={SETTING_HINTS[field as keyof typeof SETTING_HINTS]}
                className="mb-1"
              />
              <input
                className="w-full border rounded-md px-3 py-2 text-sm font-mono"
                value={(form as any)[field] || ''}
                onChange={(e) => setForm({ ...form, [field]: e.target.value } as any)}
                placeholder={hint}
              />
              <div className="text-xs text-neutral-500 mt-1">{hint}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {canUpdateSetting && (
          <Button onClick={onSave} disabled={updateSetting.isPending} className="gap-2">
            <Save size={16} />
            Lưu cấu hình
          </Button>
        )}
        {canUpdateSetting && canCreateAccount && (
          <Button
            variant="outline"
            onClick={onSaveAndSeed}
            disabled={updateSetting.isPending || seedCoa.isPending}
            className="gap-2"
          >
            <Sparkles size={16} />
            Lưu + nạp danh mục TK mẫu
          </Button>
        )}
        {canCreateAccount && (
          <Button
            variant="outline"
            onClick={() => seedCoa.mutate(form.standard)}
            disabled={seedCoa.isPending}
            className="gap-2"
          >
            <Sparkles size={16} />
            Chỉ nạp danh mục TK ({form.standard})
          </Button>
        )}
        {canCreatePeriod && (
          <Button
            variant="outline"
            onClick={onEnsureCurrentYear}
            disabled={ensureYear.isPending}
            className="gap-2"
          >
            <RotateCw size={16} />
            Tạo năm tài chính {new Date().getFullYear()} + 12 kỳ
          </Button>
        )}
        {isLoading && <span className="text-sm text-neutral-500">Đang tải…</span>}
      </div>

      <div className="text-xs text-neutral-500 leading-relaxed border-t pt-4">
        <b>Ghi chú:</b> Nạp danh mục TK là <b>idempotent</b> — chỉ thêm TK chưa có, không ghi đè. Nếu đã có TK
        {' '}<code className="text-neutral-700">6421</code> với tên khác, tài khoản đó vẫn giữ nguyên.
      </div>
    </div>
  )
}
