// ============================================================
// PayslipDrawer — Phiếu lương chi tiết theo LUẬT LAO ĐỘNG VIỆT NAM
// ------------------------------------------------------------
// Nguồn tham chiếu (mọi công thức, tỉ lệ đều theo văn bản):
//   • BLLĐ 2019 (Luật số 45/2019/QH14) — Điều 90-98 (tiền lương)
//   • Luật BHXH 2014, Nghị định 143/2018/NĐ-CP — BHXH bắt buộc
//   • Luật Thuế TNCN 04/2007/QH12, sửa đổi 26/2012/QH13
//   • Nghị định 74/2024/NĐ-CP — Mức lương tối thiểu vùng (2024)
//   • Nghị quyết 954/2020/UBTVQH14 — Giảm trừ gia cảnh: 11tr/tháng bản thân, 4.4tr/tháng người phụ thuộc
// ============================================================

import { useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp, TrendingDown, Calendar, User, Building2,
  CheckCircle, Clock, PlusCircle, HandCoins, FileText, Sparkles,
  Wallet, Info, Shield, Landmark, Users, AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { Drawer, Button } from '@frezo/ui'
import { payrollApi } from '../services/payrollApi'
import { PAYROLL_STATUS_CONFIG } from '../constants/payrolls.guide'
import { ExportMenu } from '@/lib/export'

interface Props {
  isOpen: boolean
  payrollId: string | null
  onClose: () => void
  onAddBonus?: (id: string) => void
  onConfirm?: (id: string) => void
  onPay?: (id: string) => void
}

export function PayslipDrawer({ isOpen, payrollId, onClose, onAddBonus, onConfirm, onPay }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  const { data: detail, isLoading } = useQuery({
    queryKey: ['payroll', payrollId],
    queryFn: () => payrollApi.getById(payrollId!),
    enabled: isOpen && !!payrollId,
    select: (res: any) => res?.data ?? res,
  })

  const p: any = detail

  if (!payrollId) {
    return <Drawer isOpen={isOpen} onClose={onClose} size="xl" title="Chi tiết bảng lương" />
  }

  // v1.2: BE trả statusCode string; fallback lookup theo Integer status cho cũ
  const statusCode = (p?.statusCode ||
    (p?.status === 2 ? 'PAID' : p?.status === 1 ? 'CONFIRMED' : 'DRAFT')) as keyof typeof PAYROLL_STATUS_CONFIG
  const statusCfg = PAYROLL_STATUS_CONFIG[statusCode] || PAYROLL_STATUS_CONFIG.DRAFT

  const exportName = p
    ? `phieu-luong-${sanitizeFilename(p.personName || 'nv')}-${sanitizeFilename(p.period || '')}`
    : 'phieu-luong'
  const exportTitle = p ? `Phiếu lương ${p.personName || ''} - ${p.period || ''}`.trim() : 'Phiếu lương'

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <span className="flex items-center gap-2">
          <FileText size={16} className="text-primary-600" />
          Phiếu lương
          {p?.period && <span className="text-neutral-400 font-normal">· {p.period}</span>}
        </span>
      }
      description={p?.personName ? `${p.personName}${p.personCode ? ` · ${p.personCode}` : ''}` : undefined}
      footer={
        p && (
          <>
            <ExportMenu
              targetRef={printRef}
              filename={exportName}
              title={exportTitle}
              align="left"
              variant="outline"
              buttonLabel="Xuất / In"
            />
            <div className="flex-1" />
            {statusCode === 'DRAFT' && onAddBonus && (
              <Button
                variant="outline"
                onClick={() => onAddBonus(p.id)}
                className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <PlusCircle size={13} /> Thêm thưởng
              </Button>
            )}
            {statusCode === 'DRAFT' && onConfirm && (
              <Button
                onClick={() => {
                  onConfirm(p.id)
                  onClose()
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
              >
                <CheckCircle size={13} /> Chốt lương
              </Button>
            )}
            {statusCode === 'CONFIRMED' && onPay && (
              <Button
                onClick={() => {
                  onPay(p.id)
                  onClose()
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <HandCoins size={13} /> Đã thanh toán
              </Button>
            )}
          </>
        )
      }
    >
      {isLoading || !p ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div ref={printRef} className="bg-white">
          {/* ─── Print-only header ─── */}
          <div className="hidden print:block px-6 pt-6 pb-3 border-b border-neutral-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-neutral-500 font-bold">Phiếu lương</div>
                <div className="text-xl font-bold text-neutral-900">
                  {p.personName || ''} · Kỳ {p.period || ''}
                </div>
                {p.personCode && (
                  <div className="text-[11px] text-neutral-500 mt-0.5">Mã NV: {p.personCode}</div>
                )}
              </div>
              <div className="text-right text-[10px] text-neutral-500">
                <div>Xuất ngày: {new Date().toLocaleDateString('vi-VN')}</div>
                <div>Mã HĐ: {p.contractId?.slice(0, 8) || '—'}</div>
              </div>
            </div>
          </div>

          {/* ─── Status timeline ─── */}
          <div className="px-5 py-4 border-b border-neutral-100 bg-gradient-to-b from-neutral-50/60 to-white">
            <StatusTimeline status={statusCode} />
          </div>

          {/* ─── HERO: 3 số quan trọng (Gross / Net / Company cost) ─── */}
          <div className="px-5 py-5 border-b border-neutral-100 grid grid-cols-1 md:grid-cols-3 gap-3">
            <HeroCard
              tone="blue"
              label="Tổng thu nhập (Gross)"
              value={formatVND(p.grossSalary)}
              hint="Lương + Phụ cấp + OT + Thưởng − Phạt"
              icon={TrendingUp}
            />
            <HeroCard
              tone="emerald"
              label="Thực nhận (Net)"
              value={formatVND(p.totalNet ?? p.netSalary)}
              hint="Số tiền chuyển khoản cho NLĐ"
              featured
              icon={Wallet}
            />
            <HeroCard
              tone="violet"
              label="Chi phí công ty"
              value={formatVND(p.totalCompanyCost ?? p.grossSalary)}
              hint="Gross + BHXH/BHYT/BHTN NSDLĐ đóng"
              icon={Building2}
            />
          </div>

          {/* ─── Person + Period + Status ─── */}
          <div className="px-5 py-3 border-b border-neutral-100 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <User size={11} /> {p.personName || '—'}
            </span>
            {p.personCode && <>
              <span className="text-neutral-300">·</span>
              <span>Mã: {p.personCode}</span>
            </>}
            {p.period && <>
              <span className="text-neutral-300">·</span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={11} /> Kỳ {p.period}
              </span>
            </>}
            <span className="text-neutral-300">·</span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                statusCfg.color === 'emerald'
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                  : statusCfg.color === 'blue'
                    ? 'text-blue-700 bg-blue-50 border border-blue-200'
                    : 'text-amber-700 bg-amber-50 border border-amber-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
              {statusCfg.label}
            </span>
            {p.minimumWageCompliant === false && (
              <>
                <span className="text-neutral-300">·</span>
                <span className="inline-flex items-center gap-1 text-rose-600 text-[10px]">
                  <AlertTriangle size={10} /> Lương thấp hơn mức tối thiểu vùng {p.region || ''}
                </span>
              </>
            )}
          </div>

          {/* ─── SECTION 1: Cơ sở tính (thông tin công) ─── */}
          <Section title="Cơ sở tính lương" icon={Info} iconTone="neutral">
            <InfoGrid
              items={[
                { label: 'Lương cơ bản', value: formatVND(p.baseSalary) },
                { label: 'Lương đóng BH', value: formatVND(p.insuranceSalary), tooltip: 'Có thể khác lương cơ bản. Bị chặn trên bởi 20× lương cơ sở.' },
                { label: 'Ngày công chuẩn', value: `${p.standardWorkingDays ?? p.standardDays ?? '—'} ngày` },
                { label: 'Ngày làm thực tế', value: `${p.actualWorkingDays ?? '—'} ngày`, tone: 'blue' },
                { label: 'Nghỉ có lương', value: `${p.leavesPaid ?? 0} ngày` },
                { label: 'Nghỉ không lương', value: `${p.leavesUnpaid ?? 0} ngày`, tone: p.leavesUnpaid > 0 ? 'rose' : undefined },
                { label: 'Đi muộn', value: p.totalLateMinutes ? `${p.totalLateMinutes} phút` : '—', tone: p.totalLateMinutes ? 'amber' : undefined },
                { label: 'Số người phụ thuộc', value: `${p.dependentCount ?? 0} người`, tooltip: 'Mỗi NPT giảm 4,4tr/tháng khỏi thu nhập chịu thuế.' },
              ]}
            />
          </Section>

          {/* ─── SECTION 2: Thu nhập chi tiết ─── */}
          <Section title="Chi tiết thu nhập" icon={TrendingUp} iconTone="emerald">
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl overflow-hidden">
              <LineItem label="Lương theo ngày công" value={p.workingDaysAmount ?? p.baseSalary} tone="positive"
                hint={`${p.actualWorkingDays}/${p.standardWorkingDays || p.standardDays} × ${formatVND(p.baseSalary)}`} />
              {(p.overtimeHours ?? 0) > 0 && (
                <LineItem
                  label={`Tăng ca (${p.overtimeHours} giờ)`}
                  value={p.overtimeAmount ?? p.overtimePay}
                  tone="positive"
                  hint="OT ngày thường 150% · Cuối tuần 200% · Lễ 300% (Điều 98 BLLĐ)"
                />
              )}
              {(p.allowance ?? 0) > 0 && (
                <LineItem label="Phụ cấp (ăn, xăng, ...)" value={p.allowance} tone="positive" />
              )}
              {(p.bonusAmount ?? p.bonus ?? 0) > 0 && (
                <LineItem
                  label="Thưởng"
                  value={p.bonusAmount ?? p.bonus}
                  tone="positive"
                  icon={Sparkles}
                  hint={p.bonusReason || p.note || undefined}
                />
              )}
              {(p.latePenalty ?? 0) > 0 && (
                <LineItem label="Phạt đi muộn" value={p.latePenalty} tone="negative" />
              )}
              <LineItem label="Tổng thu nhập (Gross)" value={p.grossSalary} bold tone="positive" />
            </div>
          </Section>

          {/* ─── SECTION 3: NLĐ đóng vs NSDLĐ đóng (2-column) ─── */}
          <Section title="Bảo hiểm bắt buộc — Luật BHXH 2014" icon={Shield} iconTone="blue">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Cột 1: NLĐ đóng — 10.5% */}
              <div className="bg-rose-50/40 border border-rose-100 rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-rose-100 bg-rose-100/50 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                    NLĐ đóng (trừ vào lương)
                  </span>
                  <span className="text-[10px] font-semibold text-rose-700">−10.5%</span>
                </div>
                <InsuranceRow
                  label="BHXH"
                  rate={p.socialInsuranceRate ?? 0.08}
                  value={p.bhxh ?? p.socialInsurance}
                  base={p.insuranceSalary}
                />
                <InsuranceRow
                  label="BHYT"
                  rate={p.healthInsuranceRate ?? 0.015}
                  value={p.bhyt ?? p.healthInsurance}
                  base={p.insuranceSalary}
                />
                <InsuranceRow
                  label="BHTN"
                  rate={p.unemploymentInsuranceRate ?? 0.01}
                  value={p.bhtn ?? p.unemploymentInsurance}
                  base={p.insuranceSalary}
                />
                <div className="px-3 py-2 bg-rose-100/60 flex items-center justify-between font-semibold text-rose-900">
                  <span className="text-xs">Tổng NLĐ đóng</span>
                  <span className="text-sm tabular-nums">−{formatVND(p.totalInsurance)}</span>
                </div>
              </div>

              {/* Cột 2: NSDLĐ đóng — 21.5% (không trừ vào lương) */}
              <div className="bg-violet-50/40 border border-violet-100 rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-violet-100 bg-violet-100/50 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-violet-800">
                    Công ty đóng (không trừ NLĐ)
                  </span>
                  <span className="text-[10px] font-semibold text-violet-700">+21.5%</span>
                </div>
                <InsuranceRow
                  label="BHXH"
                  rate={p.employerSocialRate ?? 0.175}
                  value={p.employerSocialInsurance}
                  base={p.insuranceSalary}
                  tone="employer"
                />
                <InsuranceRow
                  label="BHYT"
                  rate={p.employerHealthRate ?? 0.03}
                  value={p.employerHealthInsurance}
                  base={p.insuranceSalary}
                  tone="employer"
                />
                <InsuranceRow
                  label="BHTN"
                  rate={p.employerUnemploymentRate ?? 0.01}
                  value={p.employerUnemploymentInsurance}
                  base={p.insuranceSalary}
                  tone="employer"
                />
                <InsuranceRow
                  label="BHTNLĐ-BNN"
                  rate={p.employerAccidentRate ?? 0.005}
                  value={p.employerAccidentInsurance}
                  base={p.insuranceSalary}
                  tone="employer"
                  hint="Tai nạn LĐ - Bệnh nghề nghiệp"
                />
                <div className="px-3 py-2 bg-violet-100/60 flex items-center justify-between font-semibold text-violet-900">
                  <span className="text-xs">Tổng Công ty đóng</span>
                  <span className="text-sm tabular-nums">
                    +{formatVND(p.totalEmployerContribution ?? 0)}
                  </span>
                </div>
              </div>
            </div>
            {p.maxInsuranceSalary && (
              <div className="mt-2 text-[10px] text-neutral-400 italic px-1">
                Ghi chú: Mức lương đóng BH bị chặn trên bởi <strong>{formatVND(p.maxInsuranceSalary)}</strong> (20× lương cơ sở).
              </div>
            )}
          </Section>

          {/* ─── SECTION 4: Thuế TNCN theo bậc lũy tiến ─── */}
          <Section title="Thuế Thu nhập cá nhân (TNCN)" icon={Landmark} iconTone="amber">
            <TaxBreakdown p={p} />
          </Section>

          {/* ─── SECTION 5: Khấu trừ khác ─── */}
          {((p.advanceDeduction ?? 0) > 0 ||
            (p.otherDeductions ?? p.otherDeduction ?? 0) > 0 ||
            (p.unionFee ?? 0) > 0) && (
            <Section title="Khấu trừ khác" icon={TrendingDown} iconTone="rose">
              <div className="bg-rose-50/40 border border-rose-100 rounded-xl overflow-hidden">
                {(p.unionFee ?? 0) > 0 && (
                  <LineItem label="Đoàn phí công đoàn" value={p.unionFee} tone="negative"
                    hint="1% lương, tối đa 10% lương cơ sở (Nghị định 191/2013)" />
                )}
                {(p.advanceDeduction ?? 0) > 0 && (
                  <LineItem label="Tạm ứng" value={p.advanceDeduction} tone="negative" />
                )}
                {(p.otherDeductions ?? p.otherDeduction ?? 0) > 0 && (
                  <LineItem label="Khấu trừ khác" value={p.otherDeductions ?? p.otherDeduction} tone="negative" />
                )}
              </div>
            </Section>
          )}

          {/* ─── SECTION 6: TỔNG THỰC NHẬN (final) ─── */}
          <div className="px-5 pb-5">
            <div className="p-5 bg-gradient-to-br from-primary-50 via-primary-50 to-primary-100/60 border-2 border-primary-200 rounded-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                    Thực nhận
                  </div>
                  <div className="text-[11px] text-primary-700">
                    Gross <span className="tabular-nums">{formatVND(p.grossSalary)}</span>
                    <br />− Tổng khấu trừ <span className="tabular-nums">{formatVND(p.totalDeduction ?? p.totalDeductions)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-900 tabular-nums">
                    {formatVND(p.totalNet ?? p.netSalary)}
                  </div>
                  <div className="text-[10px] text-primary-600 mt-0.5">VNĐ / kỳ</div>
                </div>
              </div>
              {/* Effective tax rate */}
              {p.grossSalary > 0 && (
                <div className="mt-3 pt-3 border-t border-primary-200/60 grid grid-cols-3 gap-2 text-[11px]">
                  <MicroStat
                    label="Tổng KT / Gross"
                    value={`${((Number(p.totalDeduction ?? p.totalDeductions ?? 0) / Number(p.grossSalary) * 100) || 0).toFixed(1)}%`}
                  />
                  <MicroStat
                    label="Thuế / Gross"
                    value={`${((Number(p.tax ?? p.taxIncome ?? 0) / Number(p.grossSalary) * 100) || 0).toFixed(1)}%`}
                  />
                  <MicroStat
                    label="Net / Gross"
                    value={`${((Number(p.totalNet ?? p.netSalary ?? 0) / Number(p.grossSalary) * 100) || 0).toFixed(1)}%`}
                    highlight
                  />
                </div>
              )}
            </div>
          </div>

          {/* ─── Metadata ─── */}
          {(p.createdDate || p.updatedDate || p.paidDate || p.paidAt) && (
            <div className="px-5 pb-5">
              <div className="pt-3 border-t border-neutral-100 space-y-1 text-[11px] text-neutral-400">
                {p.createdDate && <div>Tạo: {formatDateTime(p.createdDate)}</div>}
                {p.updatedDate && <div>Cập nhật: {formatDateTime(p.updatedDate)}</div>}
                {(p.paidDate || p.paidAt) && (
                  <div className="text-emerald-600 font-medium">
                    ✓ Đã thanh toán: {formatDateTime(p.paidDate ?? p.paidAt)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Print-only signature block */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-8 pb-6 px-6">
            <div className="text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">Người nhận</div>
              <div className="text-[10px] text-neutral-400 italic mt-0.5">(Ký, ghi rõ họ tên)</div>
              <div className="h-16" />
              <div className="text-sm font-semibold text-neutral-800">{p.personName || ''}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">Người lập bảng</div>
              <div className="text-[10px] text-neutral-400 italic mt-0.5">(Ký, ghi rõ họ tên)</div>
              <div className="h-16" />
              <div className="text-sm font-semibold text-neutral-800">Bộ phận HR</div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}

// ============================================================
// Sub-components
// ============================================================

function HeroCard({
  tone, label, value, hint, icon: Icon, featured,
}: {
  tone: 'blue' | 'emerald' | 'violet'
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  featured?: boolean
}) {
  const tones = {
    blue: 'from-blue-50 to-blue-100/50 border-blue-200 text-blue-900',
    emerald: 'from-emerald-50 to-emerald-100/50 border-emerald-200 text-emerald-900',
    violet: 'from-violet-50 to-violet-100/50 border-violet-200 text-violet-900',
  }
  const iconTones = {
    blue: 'bg-blue-500 text-white',
    emerald: 'bg-emerald-500 text-white',
    violet: 'bg-violet-500 text-white',
  }
  return (
    <div
      className={`p-4 rounded-2xl border bg-gradient-to-br ${tones[tone]} ${featured ? 'ring-2 ring-emerald-200 ring-offset-2 ring-offset-white shadow-sm' : ''}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconTones[tone]}`}>
          <Icon size={13} />
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</div>
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      {hint && <div className="text-[10px] opacity-70 mt-0.5">{hint}</div>}
    </div>
  )
}

function Section({
  title, icon: Icon, iconTone, children,
}: {
  title: string
  icon: LucideIcon
  iconTone: 'neutral' | 'emerald' | 'blue' | 'rose' | 'amber' | 'violet'
  children: React.ReactNode
}) {
  const toneClasses = {
    neutral: 'text-neutral-600 bg-neutral-100',
    emerald: 'text-emerald-600 bg-emerald-50',
    blue: 'text-blue-600 bg-blue-50',
    rose: 'text-rose-600 bg-rose-50',
    amber: 'text-amber-600 bg-amber-50',
    violet: 'text-violet-600 bg-violet-50',
  }
  return (
    <div className="px-5 py-4 border-b border-neutral-100">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${toneClasses[iconTone]}`}>
          <Icon size={12} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function InfoGrid({ items }: {
  items: Array<{ label: string; value: string; tone?: string; tooltip?: string }>
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {items.map((it, idx) => (
        <div
          key={idx}
          className="p-2.5 bg-neutral-50/50 border border-neutral-200 rounded-lg"
          title={it.tooltip}
        >
          <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mb-0.5 truncate flex items-center gap-1">
            {it.label}
            {it.tooltip && <Info size={9} className="text-neutral-400 shrink-0" />}
          </div>
          <div
            className={`text-sm font-bold tabular-nums truncate ${
              it.tone === 'blue' ? 'text-blue-700' :
              it.tone === 'rose' ? 'text-rose-700' :
              it.tone === 'amber' ? 'text-amber-700' :
              'text-neutral-800'
            }`}
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  )
}

function LineItem({
  label,
  value,
  tone,
  bold,
  icon: Icon,
  hint,
}: {
  label: string
  value?: number | null
  tone: 'positive' | 'negative'
  bold?: boolean
  icon?: LucideIcon
  hint?: string
}) {
  return (
    <div className={`flex items-center gap-3 px-3.5 py-2.5 border-b border-neutral-100 last:border-b-0 ${bold ? 'bg-white' : ''}`}>
      {Icon && <Icon size={12} className={tone === 'positive' ? 'text-emerald-500' : 'text-rose-500'} />}
      <div className="flex-1 min-w-0">
        <div className={`${bold ? 'text-sm font-semibold text-neutral-800' : 'text-sm text-neutral-700'} truncate`}>
          {label}
        </div>
        {hint && <div className="text-[10px] text-neutral-400 italic mt-0.5">{hint}</div>}
      </div>
      <div
        className={`${bold ? 'text-base font-bold' : 'text-sm font-medium'} tabular-nums shrink-0 ${
          tone === 'positive' ? 'text-emerald-700' : 'text-rose-700'
        }`}
      >
        {tone === 'positive' ? '+' : '−'}{formatVND(value)}
      </div>
    </div>
  )
}

function InsuranceRow({
  label, rate, value, base, tone = 'employee', hint,
}: {
  label: string
  rate?: number | null
  value?: number | null
  base?: number | null
  tone?: 'employee' | 'employer'
  hint?: string
}) {
  const sign = tone === 'employee' ? '−' : '+'
  const textColor = tone === 'employee' ? 'text-rose-800' : 'text-violet-800'
  const amountColor = tone === 'employee' ? 'text-rose-700' : 'text-violet-700'
  const pct = rate ? (Number(rate) * 100).toFixed(rate < 0.01 ? 2 : rate < 0.1 ? 1 : 0) : '—'
  return (
    <div className="px-3 py-2 border-b border-current/10 last:border-b-0 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className={`text-xs font-medium ${textColor} truncate`}>
          {label} <span className="text-[9px] opacity-60 font-normal">({pct}%)</span>
        </div>
        {hint && <div className="text-[9px] opacity-60 mt-0.5">{hint}</div>}
        {base && rate && Number(value) > 0 && (
          <div className="text-[9px] opacity-50 mt-0.5 tabular-nums">
            {formatVND(base)} × {pct}%
          </div>
        )}
      </div>
      <div className={`text-xs font-semibold ${amountColor} tabular-nums whitespace-nowrap`}>
        {sign}{formatVND(value)}
      </div>
    </div>
  )
}

function TaxBreakdown({ p }: { p: any }) {
  const taxable = Number(p.taxableIncome ?? 0)
  const brackets = Array.isArray(p.taxBrackets) ? p.taxBrackets : []
  const totalTax = Number(p.tax ?? p.taxIncome ?? 0)

  return (
    <div className="space-y-3">
      {/* Công thức thu nhập chịu thuế */}
      <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl">
        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1">
          <Info size={10} /> Thu nhập tính thuế
        </div>
        <div className="space-y-1 text-xs text-neutral-700 tabular-nums">
          <FormulaRow label="Gross" value={p.grossSalary} sign="+" />
          <FormulaRow label="− Bảo hiểm (10.5%)" value={p.totalInsurance} sign="−" />
          <FormulaRow label={`− Giảm trừ bản thân`} value={p.personalDeduction ?? 11000000} sign="−"
            hint="11 triệu/tháng (NQ 954/2020/UBTVQH14)" />
          {(p.dependentCount ?? 0) > 0 && (
            <FormulaRow
              label={`− Giảm trừ ${p.dependentCount} người phụ thuộc`}
              value={p.dependentDeduction ?? Number(p.dependentCount ?? 0) * 4400000}
              sign="−"
              hint="4,4 triệu/tháng/người"
            />
          )}
          {(p.unionFee ?? 0) > 0 && (
            <FormulaRow label="− Đoàn phí" value={p.unionFee} sign="−" />
          )}
          <div className="pt-1.5 mt-1.5 border-t border-amber-200 flex items-center justify-between text-sm font-bold text-amber-900">
            <span>= Thu nhập tính thuế</span>
            <span>{formatVND(taxable)}</span>
          </div>
        </div>
      </div>

      {/* Bảng bậc thuế */}
      {brackets.length > 0 ? (
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
              <tr>
                <th className="px-2 py-2 text-left">Bậc</th>
                <th className="px-2 py-2 text-left">Khoảng thu nhập/tháng</th>
                <th className="px-2 py-2 text-center">Thuế suất</th>
                <th className="px-2 py-2 text-right">TN trong bậc</th>
                <th className="px-2 py-2 text-right">Thuế trong bậc</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {brackets.map((b: any, idx: number) => (
                <tr key={idx} className="border-t border-neutral-100 hover:bg-amber-50/30">
                  <td className="px-2 py-1.5 font-semibold text-neutral-700">{b.bracket}</td>
                  <td className="px-2 py-1.5 text-neutral-600">
                    {formatCompactVND(b.fromAmount)}
                    {b.toAmount ? ` - ${formatCompactVND(b.toAmount)}` : ` trở lên`}
                  </td>
                  <td className="px-2 py-1.5 text-center font-semibold text-amber-700">
                    {(Number(b.rate) * 100).toFixed(0)}%
                  </td>
                  <td className="px-2 py-1.5 text-right text-neutral-700">
                    {formatVND(b.taxableInBracket)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-semibold text-rose-700">
                    {formatVND(b.taxInBracket)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-amber-300 bg-amber-50 font-bold">
                <td colSpan={4} className="px-2 py-2 text-right text-amber-900">Tổng thuế TNCN</td>
                <td className="px-2 py-2 text-right text-rose-800 tabular-nums">
                  {formatVND(totalTax)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl text-center">
          <CheckCircle size={16} className="text-emerald-600 mx-auto mb-1" />
          <div className="text-xs font-semibold text-emerald-800">
            Không phải nộp thuế TNCN
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">
            Thu nhập sau giảm trừ ≤ 0
          </div>
        </div>
      )}
    </div>
  )
}

function FormulaRow({ label, value, sign, hint }: {
  label: string; value?: number | null; sign: '+' | '−'; hint?: string
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <div className="truncate">{label}</div>
        {hint && <div className="text-[9px] italic text-neutral-400 mt-0.5">{hint}</div>}
      </div>
      <div className={`shrink-0 font-semibold ${sign === '+' ? 'text-neutral-700' : 'text-rose-700'}`}>
        {formatVND(value)}
      </div>
    </div>
  )
}

function MicroStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`text-center ${highlight ? 'font-bold' : ''}`}>
      <div className="text-primary-600/70 uppercase text-[9px] tracking-wider">{label}</div>
      <div className={`${highlight ? 'text-primary-900 text-sm' : 'text-primary-800 text-xs'} tabular-nums`}>
        {value}
      </div>
    </div>
  )
}

// ============================================================
// Status timeline
// ============================================================

function StatusTimeline({ status }: { status: keyof typeof PAYROLL_STATUS_CONFIG }) {
  const steps = ['DRAFT', 'CONFIRMED', 'PAID'] as const
  const currentIndex = steps.indexOf(status as any)
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const cfg = PAYROLL_STATUS_CONFIG[s]
        const done = i < currentIndex
        const active = i === currentIndex
        return (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                done
                  ? 'bg-emerald-500 text-white'
                  : active
                    ? `${cfg.dotColor} text-white ring-4 ring-offset-0 ${
                        cfg.color === 'blue'
                          ? 'ring-blue-100'
                          : cfg.color === 'amber'
                            ? 'ring-amber-100'
                            : 'ring-emerald-100'
                      }`
                    : 'bg-neutral-200 text-neutral-400'
              }`}
            >
              {done ? <CheckCircle size={14} /> : active ? <Clock size={12} /> : i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-xs font-bold truncate ${done ? 'text-emerald-700' : active ? 'text-neutral-800' : 'text-neutral-400'}`}>
                {cfg.label}
              </div>
              <div className="text-[10px] text-neutral-400 truncate">{cfg.description}</div>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-4 shrink-0 ${done ? 'bg-emerald-400' : 'bg-neutral-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

function formatVND(v?: number | null): string {
  if (v == null || Number.isNaN(Number(v))) return '—'
  return Number(v).toLocaleString('vi-VN') + '₫'
}

function formatCompactVND(v?: number | null): string {
  if (v == null) return '—'
  const n = Number(v)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}tr`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

function formatDateTime(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return String(iso)
  }
}

function sanitizeFilename(s: string): string {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}
