// ============================================================
// FREZO — SettingsPage v2
// Vercel/GitHub-inspired: sticky sidebar + section cards + floating save bar
// ============================================================

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Save, Building2, Settings, Clock, MapPin, DollarSign, Users, RefreshCw, FileText,
  Sparkles, ChevronRight, Check, Loader2,
  type LucideIcon,
} from 'lucide-react'
import { Button, Input, Select, Switch } from '@frezo/ui'
import {
  useOrganizations, useSettingByOrg, useUpdateOrgSetting, useCreateOrgSetting,
} from '@/modules/qtht/hooks/useAttendanceSettings'

// ============================================================
// Types
// ============================================================

interface SettingsForm {
  orgId: string
  isAttendance: boolean
  isEmail: boolean
  isSwap: boolean
  isColor: boolean
  allowLate: boolean
  requireAvatar: boolean
  requireCV: boolean
  requireHealthCert: boolean
  autoApproveArticle: boolean
  requireManager: boolean
  articleApprover: string
  morningStart: string
  morningEnd: string
  afternoonStart: string
  afternoonEnd: string
  maxMembers: number
  maxPosts: number
  details: {
    attendance: {
      standardHours: number
      halfDayThreshold: number
      lateThreshold: number
      earlyThreshold: number
      overtimeBeforeThreshold: number
      overtimeAfterThreshold: number
      isAutoAttendance: boolean
      maxShiftsPerDay: number
      minGapBetweenShifts: number
    }
    payroll: {
      calculationStartDay: number
      standardWorkingDays: number
      latePenaltyPerMinute: number
      overtimePayPerMinute: number
      isAutoGeneratePayroll: boolean
      isAutoUpdatePayroll: boolean
      revenueType: string
    }
    geo: {
      officeLatitude: number
      officeLongitude: number
      allowedRadiusMeters: number
      allowedWifiSsids: string
      allowedWifiBssids: string
    }
  }
}

const defaultForm: SettingsForm = {
  orgId: '',
  isAttendance: true, isEmail: false, isSwap: false, isColor: false, allowLate: true,
  requireAvatar: false, requireCV: false, requireHealthCert: false, autoApproveArticle: false, requireManager: false,
  articleApprover: '',
  morningStart: '08:00', morningEnd: '12:00', afternoonStart: '13:00', afternoonEnd: '17:30',
  maxMembers: 100, maxPosts: 1000,
  details: {
    attendance: {
      standardHours: 8, halfDayThreshold: 4.5,
      lateThreshold: 0, earlyThreshold: 0,
      overtimeBeforeThreshold: 0, overtimeAfterThreshold: 0,
      isAutoAttendance: false, maxShiftsPerDay: 2, minGapBetweenShifts: 60,
    },
    payroll: {
      calculationStartDay: 1, standardWorkingDays: 22,
      latePenaltyPerMinute: 10000, overtimePayPerMinute: 20000,
      isAutoGeneratePayroll: false, isAutoUpdatePayroll: false, revenueType: 'NET',
    },
    geo: {
      officeLatitude: 10.8231, officeLongitude: 106.6297,
      allowedRadiusMeters: 300, allowedWifiSsids: '', allowedWifiBssids: '',
    },
  },
}

function parseSetting(data: any): SettingsForm {
  let details = defaultForm.details
  if (data?.details) {
    try {
      const parsed = typeof data.details === 'string' ? JSON.parse(data.details) : data.details
      details = {
        attendance: { ...defaultForm.details.attendance, ...parsed.attendance },
        payroll: { ...defaultForm.details.payroll, ...parsed.payroll },
        geo: { ...defaultForm.details.geo, ...parsed.geo },
      }
    } catch { /* keep default */ }
  }
  return {
    orgId: data?.orgId || '',
    isAttendance: data?.isAttendance ?? true,
    isEmail: data?.isEmail ?? false,
    isSwap: data?.isSwap ?? false,
    isColor: data?.isColor ?? false,
    allowLate: data?.allowLate ?? true,
    requireAvatar: data?.requireAvatar ?? false,
    requireCV: data?.requireCV ?? false,
    requireHealthCert: data?.requireHealthCert ?? false,
    autoApproveArticle: data?.autoApproveArticle ?? false,
    requireManager: data?.requireManager ?? false,
    articleApprover: data?.articleApprover || '',
    morningStart: data?.morningStart || '08:00',
    morningEnd: data?.morningEnd || '12:00',
    afternoonStart: data?.afternoonStart || '13:00',
    afternoonEnd: data?.afternoonEnd || '17:30',
    maxMembers: data?.maxMembers ?? 100,
    maxPosts: data?.maxPosts ?? 1000,
    details,
  }
}

// ============================================================
// Nav items (Vercel-style categories)
// ============================================================

interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  description: string
}
interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Chung',
    items: [
      { id: 'general',  label: 'Tính năng',      icon: Sparkles,   description: 'Bật/tắt module' },
      { id: 'schedule', label: 'Lịch làm việc',  icon: Clock,      description: 'Khung giờ chuẩn' },
    ],
  },
  {
    label: 'Chấm công & Lương',
    items: [
      { id: 'attendance', label: 'Chấm công', icon: RefreshCw, description: 'Đi muộn, OT' },
      { id: 'geo',        label: 'Định vị',   icon: MapPin,    description: 'GPS & WiFi' },
      { id: 'payroll',    label: 'Bảng lương',icon: DollarSign,description: 'Kỳ lương, phạt/OT' },
    ],
  },
  {
    label: 'Nhân sự & Bài viết',
    items: [
      { id: 'hr',      label: 'Hồ sơ nhân sự', icon: Users,    description: 'Yêu cầu bắt buộc' },
      { id: 'article', label: 'Bài viết & CMS',icon: FileText, description: 'Duyệt bài' },
    ],
  },
]
const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)

// ============================================================
// Page
// ============================================================

export function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>(defaultForm)
  const [initialForm, setInitialForm] = useState<SettingsForm>(defaultForm)
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [activeTab, setActiveTab] = useState('general')

  const { data: orgList } = useOrganizations()
  const { data: settingData, isLoading: loadingSetting } = useSettingByOrg(selectedOrgId || null)
  const updateSetting = useUpdateOrgSetting()
  const createSetting = useCreateOrgSetting()

  const orgOptions = useMemo(() => {
    if (!Array.isArray(orgList)) return []
    return orgList.map((o: any) => ({ value: o.value || o.id, label: o.label || o.name }))
  }, [orgList])

  const selectedOrg = useMemo(
    () => orgOptions.find((o) => o.value === selectedOrgId),
    [orgOptions, selectedOrgId],
  )

  useEffect(() => {
    if (settingData) {
      const parsed = parseSetting(settingData)
      setForm(parsed)
      setInitialForm(parsed)
    } else if (selectedOrgId) {
      // No existing setting → start with defaults but keep orgId
      const withOrg = { ...defaultForm, orgId: selectedOrgId }
      setForm(withOrg)
      setInitialForm(withOrg)
    }
  }, [settingData, selectedOrgId])

  // Detect dirty
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm])

  const isSaving = updateSetting.isPending || createSetting.isPending

  // Field updates
  const updateField = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }
  const updateDetailsField = (section: 'attendance' | 'payroll' | 'geo', key: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      details: { ...prev.details, [section]: { ...prev.details[section], [key]: value } },
    }))
  }

  const handleSave = () => {
    const orgId = form.orgId || selectedOrgId
    const payload = {
      ...(settingData?.id && { id: settingData.id }),
      orgId,
      isAttendance: form.isAttendance, isEmail: form.isEmail, isSwap: form.isSwap, isColor: form.isColor,
      allowLate: form.allowLate,
      requireAvatar: form.requireAvatar, requireCV: form.requireCV, requireHealthCert: form.requireHealthCert,
      autoApproveArticle: form.autoApproveArticle, requireManager: form.requireManager,
      articleApprover: form.articleApprover,
      morningStart: form.morningStart, morningEnd: form.morningEnd,
      afternoonStart: form.afternoonStart, afternoonEnd: form.afternoonEnd,
      maxMembers: form.maxMembers, maxPosts: form.maxPosts,
      details: JSON.stringify(form.details),
    }
    if (settingData?.id) {
      updateSetting.mutate({ id: settingData.id, data: payload }, {
        onSuccess: () => setInitialForm(form),
      })
    } else {
      createSetting.mutate(payload, {
        onSuccess: () => setInitialForm(form),
      })
    }
  }

  const handleDiscard = () => {
    setForm(initialForm)
  }

  // Section refs for scroll-into-view
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollToSection = (id: string) => {
    setActiveTab(id)
    const el = sectionRefs.current[id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="min-h-[calc(100vh-64px)] bg-neutral-50/40">
      {/* ==================== Hero header ==================== */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1 inline-flex items-center gap-1">
                <Settings size={11} /> Cài đặt hệ thống
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 truncate">
                {selectedOrg?.label || 'Cấu hình toàn hệ thống'}
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                Quản lý cách hệ thống vận hành với từng tổ chức — chấm công, lương, hồ sơ nhân sự và tính năng chung.
              </p>
            </div>
            <div className="shrink-0 w-full max-w-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Tổ chức áp dụng
              </div>
              <Select
                options={orgOptions}
                value={selectedOrgId}
                onChange={(v) => setSelectedOrgId(v)}
                placeholder="Chọn tổ chức..."
                showSearch
              />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== Body ==================== */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {!selectedOrgId ? (
          <EmptyOrgState />
        ) : loadingSetting ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={22} className="animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
            {/* Sidebar (sticky) */}
            <aside className="sticky top-6 self-start space-y-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3 mb-1.5">
                    {group.label}
                  </div>
                  <nav className="space-y-0.5">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => scrollToSection(item.id)}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all group ${
                          activeTab === item.id
                            ? 'bg-primary-50 text-primary-800 font-semibold border border-primary-100'
                            : 'text-neutral-600 hover:bg-neutral-100 border border-transparent'
                        }`}
                      >
                        <item.icon
                          size={14}
                          className={activeTab === item.id ? 'text-primary-600' : 'text-neutral-400'}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        <ChevronRight
                          size={12}
                          className={activeTab === item.id ? 'text-primary-600' : 'text-transparent group-hover:text-neutral-300'}
                        />
                      </button>
                    ))}
                  </nav>
                </div>
              ))}
            </aside>

            {/* Content */}
            <div className="space-y-6 min-w-0 pb-24">
              {/* General — Features */}
              <Section
                id="general"
                icon={Sparkles}
                title="Tính năng chung"
                description="Bật/tắt các module chính. Tắt module sẽ ẩn menu và chức năng liên quan cho tất cả user thuộc tổ chức này."
                sectionRefs={sectionRefs}
              >
                <SwitchList>
                  <SwitchRow label="Chấm công"
                    description="Cho phép nhân viên check-in/check-out qua web/app"
                    checked={form.isAttendance} onChange={(v) => updateField('isAttendance', v)} />
                  <SwitchRow label="Email hệ thống"
                    description="Bật notification/marketing email từ Frezo"
                    checked={form.isEmail} onChange={(v) => updateField('isEmail', v)} />
                  <SwitchRow label="Đổi ca làm việc"
                    description="Nhân viên có thể tự xin đổi ca với đồng nghiệp"
                    checked={form.isSwap} onChange={(v) => updateField('isSwap', v)} />
                  <SwitchRow label="Tuỳ biến màu sắc"
                    description="Cho user chọn theme màu riêng"
                    checked={form.isColor} onChange={(v) => updateField('isColor', v)} />
                  <SwitchRow label="Cho phép đi muộn"
                    description="Không tính vi phạm khi check-in sau giờ bắt đầu"
                    checked={form.allowLate} onChange={(v) => updateField('allowLate', v)} />
                </SwitchList>
              </Section>

              {/* Schedule */}
              <Section
                id="schedule"
                icon={Clock}
                title="Lịch làm việc"
                description="Khung giờ chuẩn cho toàn tổ chức. Nhân viên đặc thù có thể có ca riêng."
                sectionRefs={sectionRefs}
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Bắt đầu sáng">
                    <Input type="time" value={form.morningStart} onChange={(e) => updateField('morningStart', e.target.value)} className="h-9 text-sm" />
                  </Field>
                  <Field label="Kết thúc sáng">
                    <Input type="time" value={form.morningEnd} onChange={(e) => updateField('morningEnd', e.target.value)} className="h-9 text-sm" />
                  </Field>
                  <Field label="Bắt đầu chiều">
                    <Input type="time" value={form.afternoonStart} onChange={(e) => updateField('afternoonStart', e.target.value)} className="h-9 text-sm" />
                  </Field>
                  <Field label="Kết thúc chiều">
                    <Input type="time" value={form.afternoonEnd} onChange={(e) => updateField('afternoonEnd', e.target.value)} className="h-9 text-sm" />
                  </Field>
                </div>
              </Section>

              {/* Attendance rules */}
              <Section
                id="attendance"
                icon={RefreshCw}
                title="Quy tắc chấm công"
                description="Ngưỡng xác định đi muộn, nửa ngày, tăng ca — ảnh hưởng trực tiếp đến lương."
                sectionRefs={sectionRefs}
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Số giờ tiêu chuẩn/ngày">
                    <NumberInput value={form.details.attendance.standardHours} onChange={(v) => updateDetailsField('attendance', 'standardHours', v)} min={1} max={24} />
                  </Field>
                  <Field label="Ngưỡng nửa ngày (giờ)">
                    <NumberInput step={0.5} value={form.details.attendance.halfDayThreshold} onChange={(v) => updateDetailsField('attendance', 'halfDayThreshold', v)} />
                  </Field>
                  <Field label="Trễ chấp nhận (phút)" hint="Ví dụ 5 → check-in trong 5 phút không tính muộn">
                    <NumberInput value={form.details.attendance.lateThreshold} onChange={(v) => updateDetailsField('attendance', 'lateThreshold', v)} />
                  </Field>
                  <Field label="Về sớm chấp nhận (phút)">
                    <NumberInput value={form.details.attendance.earlyThreshold} onChange={(v) => updateDetailsField('attendance', 'earlyThreshold', v)} />
                  </Field>
                  <Field label="OT trước giờ (phút)" hint="Tính OT nếu đến sớm ≥ ngưỡng">
                    <NumberInput value={form.details.attendance.overtimeBeforeThreshold} onChange={(v) => updateDetailsField('attendance', 'overtimeBeforeThreshold', v)} />
                  </Field>
                  <Field label="OT sau giờ (phút)">
                    <NumberInput value={form.details.attendance.overtimeAfterThreshold} onChange={(v) => updateDetailsField('attendance', 'overtimeAfterThreshold', v)} />
                  </Field>
                  <Field label="Số ca tối đa/ngày">
                    <NumberInput value={form.details.attendance.maxShiftsPerDay} onChange={(v) => updateDetailsField('attendance', 'maxShiftsPerDay', v)} min={1} max={5} />
                  </Field>
                  <Field label="Nghỉ giữa 2 ca (phút)">
                    <NumberInput value={form.details.attendance.minGapBetweenShifts} onChange={(v) => updateDetailsField('attendance', 'minGapBetweenShifts', v)} />
                  </Field>
                </div>
              </Section>

              {/* Geo */}
              <Section
                id="geo"
                icon={MapPin}
                title="Định vị chấm công"
                description="Giới hạn địa lý — nhân viên phải trong bán kính hoặc kết nối WiFi công ty để check-in hợp lệ. Chỉ Admin cấu hình."
                sectionRefs={sectionRefs}
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Vĩ độ văn phòng">
                    <NumberInput step="any" value={form.details.geo.officeLatitude} onChange={(v) => updateDetailsField('geo', 'officeLatitude', v)} />
                  </Field>
                  <Field label="Kinh độ văn phòng">
                    <NumberInput step="any" value={form.details.geo.officeLongitude} onChange={(v) => updateDetailsField('geo', 'officeLongitude', v)} />
                  </Field>
                  <Field label="Bán kính cho phép (m)" hint="Khuyến nghị 100–500m tuỳ diện tích văn phòng">
                    <NumberInput value={form.details.geo.allowedRadiusMeters} onChange={(v) => updateDetailsField('geo', 'allowedRadiusMeters', v)} />
                  </Field>
                  <Field label="WiFi SSID cho phép" hint="Tên WiFi công ty, cách nhau bằng dấu phẩy">
                    <Input value={form.details.geo.allowedWifiSsids} onChange={(e) => updateDetailsField('geo', 'allowedWifiSsids', e.target.value)} placeholder="Frezo-Office, Frezo-Guest" className="h-9 text-sm" />
                  </Field>
                  <div className="col-span-2">
                    <Field label="WiFi BSSID (MAC) — tuỳ chọn" hint="Chính xác hơn SSID, khó bị giả mạo">
                      <Input value={form.details.geo.allowedWifiBssids} onChange={(e) => updateDetailsField('geo', 'allowedWifiBssids', e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" className="h-9 text-sm font-mono" />
                    </Field>
                  </div>
                </div>

                {/* Preview bán kính + WiFi — giảm ticket Mobile check-in fail */}
                <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                  <div className="text-sm font-semibold text-neutral-800 mb-2">Preview rule check-in</div>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div
                      className="relative w-36 h-36 rounded-full border-2 border-dashed border-primary-300 bg-primary-50/40 shrink-0 flex items-center justify-center"
                      title={`Bán kính ${form.details.geo.allowedRadiusMeters || 0}m`}
                    >
                      <div className="w-3 h-3 rounded-full bg-primary-600 shadow" />
                      <span className="absolute bottom-2 text-[10px] font-semibold text-primary-700 tabular-nums">
                        r = {form.details.geo.allowedRadiusMeters || 0}m
                      </span>
                    </div>
                    <div className="text-xs text-neutral-600 space-y-1.5 flex-1">
                      <p>
                        Tâm: <span className="font-mono">{form.details.geo.officeLatitude || '—'}, {form.details.geo.officeLongitude || '—'}</span>
                      </p>
                      <p>
                        WiFi SSID:{' '}
                        <span className="font-medium">
                          {form.details.geo.allowedWifiSsids?.trim()
                            ? form.details.geo.allowedWifiSsids
                            : 'Chưa cấu hình — Mobile có thể từ chối nếu bắt buộc WiFi'}
                        </span>
                      </p>
                      <p className="text-neutral-500">
                        Mobile check-in hợp lệ khi trong bán kính <strong>hoặc</strong> khớp SSID/BSSID.
                        Hướng dẫn Admin:{' '}
                        <a href="/docs" className="text-primary-700 underline underline-offset-2 font-medium">
                          Docs Hub
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Payroll */}
              <Section
                id="payroll"
                icon={DollarSign}
                title="Bảng lương"
                description="Kỳ tính lương và hệ số quy đổi công/OT thành tiền."
                sectionRefs={sectionRefs}
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Ngày công chuẩn / tháng">
                    <NumberInput value={form.details.payroll.standardWorkingDays} onChange={(v) => updateDetailsField('payroll', 'standardWorkingDays', v)} min={1} max={31} />
                  </Field>
                  <Field label="Ngày bắt đầu kỳ lương" hint="1 = tính từ đầu tháng dương lịch">
                    <NumberInput value={form.details.payroll.calculationStartDay} onChange={(v) => updateDetailsField('payroll', 'calculationStartDay', v)} min={1} max={28} />
                  </Field>
                  <Field label="Phạt đi muộn (VNĐ/phút)">
                    <NumberInput value={form.details.payroll.latePenaltyPerMinute} onChange={(v) => updateDetailsField('payroll', 'latePenaltyPerMinute', v)} />
                  </Field>
                  <Field label="Lương OT (VNĐ/phút)">
                    <NumberInput value={form.details.payroll.overtimePayPerMinute} onChange={(v) => updateDetailsField('payroll', 'overtimePayPerMinute', v)} />
                  </Field>
                </div>
                <div className="mt-4">
                  <SwitchList compact>
                    <SwitchRow label="Tự động tạo bảng lương"
                      description="Tự động khởi tạo payroll draft khi hết chu kỳ"
                      checked={form.details.payroll.isAutoGeneratePayroll}
                      onChange={(v) => updateDetailsField('payroll', 'isAutoGeneratePayroll', v)} />
                    <SwitchRow label="Tự động cập nhật khi có thay đổi chấm công"
                      description="Recompute payroll khi có adjustment"
                      checked={form.details.payroll.isAutoUpdatePayroll}
                      onChange={(v) => updateDetailsField('payroll', 'isAutoUpdatePayroll', v)} />
                  </SwitchList>
                </div>
              </Section>

              {/* HR */}
              <Section
                id="hr"
                icon={Users}
                title="Hồ sơ nhân sự"
                description="Yêu cầu bắt buộc khi tạo/cập nhật hồ sơ nhân viên và giới hạn dung lượng."
                sectionRefs={sectionRefs}
              >
                <SwitchList>
                  <SwitchRow label="Ảnh đại diện"
                    description="Bắt buộc upload avatar khi tạo hồ sơ"
                    checked={form.requireAvatar} onChange={(v) => updateField('requireAvatar', v)} />
                  <SwitchRow label="CV / Sơ yếu lý lịch"
                    description="Bắt buộc upload file CV (PDF/DOCX)"
                    checked={form.requireCV} onChange={(v) => updateField('requireCV', v)} />
                  <SwitchRow label="Giấy khám sức khoẻ"
                    description="Bắt buộc chứng nhận y tế"
                    checked={form.requireHealthCert} onChange={(v) => updateField('requireHealthCert', v)} />
                  <SwitchRow label="Yêu cầu quản lý duyệt"
                    description="Một số thao tác nhạy cảm cần manager approve"
                    checked={form.requireManager} onChange={(v) => updateField('requireManager', v)} />
                </SwitchList>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
                  <Field label="Số nhân viên tối đa">
                    <NumberInput value={form.maxMembers} onChange={(v) => updateField('maxMembers', v)} />
                  </Field>
                  <Field label="Số bài viết tối đa">
                    <NumberInput value={form.maxPosts} onChange={(v) => updateField('maxPosts', v)} />
                  </Field>
                </div>
              </Section>

              {/* Article */}
              <Section
                id="article"
                icon={FileText}
                title="Bài viết & CMS"
                description="Quy trình đăng và duyệt bài viết trong hệ thống."
                sectionRefs={sectionRefs}
              >
                <SwitchList>
                  <SwitchRow label="Tự động duyệt bài viết"
                    description="Bài viết được publish ngay, không cần approval"
                    checked={form.autoApproveArticle} onChange={(v) => updateField('autoApproveArticle', v)} />
                </SwitchList>
                <div className="mt-3">
                  <Field label="Người duyệt bài mặc định" hint="ID hoặc username của user có quyền duyệt">
                    <Input value={form.articleApprover} onChange={(e) => updateField('articleApprover', e.target.value)} placeholder="username hoặc user ID" className="h-9 text-sm" />
                  </Field>
                </div>
              </Section>
            </div>
          </div>
        )}
      </div>

      {/* ==================== Floating save bar (Vercel-style) ==================== */}
      {selectedOrgId && isDirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
          <div className="bg-neutral-900 text-white rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-3 border border-neutral-800">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="text-sm font-medium">Bạn có thay đổi chưa lưu</span>
            <div className="w-px h-6 bg-neutral-700 mx-1" />
            <button
              type="button"
              onClick={handleDiscard}
              className="text-xs font-medium text-neutral-300 hover:text-white px-2 py-1 rounded transition"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 bg-white text-neutral-900 hover:bg-neutral-100 disabled:opacity-70 disabled:cursor-not-allowed rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            >
              {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Lưu thay đổi
            </button>
          </div>
        </div>
      )}

      {/* Success flash when saved */}
      {selectedOrgId && !isDirty && !loadingSetting && settingData && (
        <div className="fixed bottom-4 right-4 z-30 opacity-0 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg">
            <Check size={12} /> Đã lưu
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function EmptyOrgState() {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-16 text-center shadow-sm">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center mb-4">
        <Building2 size={30} className="text-neutral-400" />
      </div>
      <h3 className="text-base font-bold text-neutral-800">Chọn tổ chức để cấu hình</h3>
      <p className="text-sm text-neutral-500 mt-1">
        Mỗi tổ chức có bộ cài đặt riêng — chọn ở dropdown trên đầu để bắt đầu.
      </p>
    </div>
  )
}

interface SectionProps {
  id: string
  icon: LucideIcon
  title: string
  description?: string
  children: React.ReactNode
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}
function Section({ id, icon: Icon, title, description, children, sectionRefs }: SectionProps) {
  return (
    <div
      id={`section-${id}`}
      ref={(el) => { sectionRefs.current[id] = el }}
      className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden scroll-mt-24"
    >
      <div className="px-6 py-4 border-b border-neutral-100 flex items-start gap-3 bg-neutral-50/40">
        <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
          <Icon size={15} />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-neutral-900">{title}</h3>
          {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-neutral-700">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-neutral-400 mt-0.5">{hint}</p>}
    </div>
  )
}

function SwitchList({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`divide-y divide-neutral-100 ${compact ? '-mt-2 -mx-2' : ''}`}>
      {children}
    </div>
  )
}

interface SwitchRowProps {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}
function SwitchRow({ label, description, checked, onChange }: SwitchRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0 pr-3">
        <div className="text-sm font-semibold text-neutral-800">{label}</div>
        {description && <div className="text-xs text-neutral-500 mt-0.5">{description}</div>}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  )
}

interface NumberInputProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number | 'any'
}
function NumberInput({ value, onChange, min, max, step }: NumberInputProps) {
  return (
    <Input
      type="number"
      value={value}
      step={step as any}
      min={min}
      max={max}
      onChange={(e) => {
        const raw = e.target.value
        if (raw === '') return onChange(0)
        const n = parseFloat(raw)
        if (!isNaN(n)) onChange(n)
      }}
      className="h-9 text-sm tabular-nums font-mono"
    />
  )
}
