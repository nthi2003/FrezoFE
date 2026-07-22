import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Save, RotateCw, CalendarRange } from 'lucide-react'
import { Button, PageHeader } from '@frezo/ui'
import {
  useAccountingSetting, useUpdateSetting, useSeedCoa, useEnsureYear,
} from '../hooks/useAccounting'
import type { AccountingStandard } from '../services/accountingApi'
import { usePermission } from '@/lib/hooks/usePermission'

const STRATEGY_OPTIONS = [
  { value: 'AGGREGATE_PERIOD', label: '1 bút toán tổng hợp / kỳ (Recommended)' },
  { value: 'PER_DEPT',         label: '1 bút toán / phòng ban / kỳ' },
  { value: 'PER_EMPLOYEE',     label: '1 bút toán / nhân viên / kỳ (chi tiết)' },
]

export function AccountingSettingsPage() {
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Cấu hình kế toán"
        description="Chọn chuẩn TT133/TT99, mapping tài khoản mặc định, khởi tạo COA và năm tài chính."
        actions={
          <Link to="/accounting/periods">
            <Button variant="outline" className="gap-2">
              <CalendarRange size={16} />
              Kỳ kế toán (khóa / mở)
            </Button>
          </Link>
        }
      />

      {/* Standard + Currency */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold text-neutral-900">Chuẩn kế toán</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-1 block">
              Thông tư áp dụng
            </label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.standard}
              onChange={(e) => setForm({ ...form, standard: e.target.value as AccountingStandard })}
            >
              <option value="TT133">TT 133/2016 — Doanh nghiệp nhỏ và vừa</option>
              <option value="TT99">TT 99/2025 — Áp dụng chung (thay thế TT 200)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-1 block">Tiền tệ</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.baseCurrency}
              onChange={(e) => setForm({ ...form, baseCurrency: e.target.value })}
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-neutral-700 mb-1 block">
              Chiến lược hạch toán bảng lương
            </label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.payrollPostingStrategy}
              onChange={(e) => setForm({ ...form, payrollPostingStrategy: e.target.value })}
            >
              {STRATEGY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* TK mapping */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold text-neutral-900">
          Mapping TK cho hạch toán Payroll
        </h3>
        <p className="text-sm text-neutral-500">
          Các TK dưới đây sẽ được dùng khi hạch toán bảng lương. Có thể sửa số hiệu để match COA thực tế.
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
              <label className="text-sm font-medium text-neutral-700 mb-1 block">{label}</label>
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
            Lưu + Seed COA theo chuẩn
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
            Chỉ Seed COA ({form.standard})
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
        <b>Ghi chú:</b> Seed COA là <b>idempotent</b> — chỉ thêm TK chưa có, không ghi đè. Nếu đã có TK
        {' '}<code className="text-neutral-700">6421</code> với tên khác, tài khoản đó vẫn giữ nguyên.
      </div>
    </div>
  )
}

