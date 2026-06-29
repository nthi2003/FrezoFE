import { useState, useEffect, useMemo } from 'react'
import { Save, Building2, Settings, Clock, MapPin, DollarSign, Users, RefreshCw, FileText } from 'lucide-react'
import { Button } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { Select } from '@frezo/ui'
import { Switch } from '@frezo/ui'
import {
  useOrganizations,
  useSettingByOrg,
  useUpdateOrgSetting,
  useCreateOrgSetting,
} from '@/modules/qtht/hooks/useAttendanceSettings'

const defaultForm: SettingsForm = {
  orgId: '',
  isAttendance: true,
  isEmail: false,
  isSwap: false,
  isColor: false,
  allowLate: true,
  requireAvatar: false,
  requireCV: false,
  requireHealthCert: false,
  autoApproveArticle: false,
  requireManager: false,
  articleApprover: '',
  morningStart: '08:00',
  morningEnd: '12:00',
  afternoonStart: '13:00',
  afternoonEnd: '17:30',
  maxMembers: 100,
  maxPosts: 1000,
  details: {
    attendance: {
      standardHours: 8,
      halfDayThreshold: 4.5,
      lateThreshold: 0,
      earlyThreshold: 0,
      overtimeBeforeThreshold: 0,
      overtimeAfterThreshold: 0,
      isAutoAttendance: false,
      maxShiftsPerDay: 2,
      minGapBetweenShifts: 60,
    },
    payroll: {
      calculationStartDay: 1,
      standardWorkingDays: 22,
      latePenaltyPerMinute: 10000,
      overtimePayPerMinute: 20000,
      isAutoGeneratePayroll: false,
      isAutoUpdatePayroll: false,
      revenueType: 'NET',
    },
    geo: {
      officeLatitude: 10.8231,
      officeLongitude: 106.6297,
      allowedRadiusMeters: 300,
      allowedWifiSsids: '',
      allowedWifiBssids: '',
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
    } catch {}
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

function SectionHeader({ icon: Icon, title, description }: { icon: any; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
      <div className="p-2 rounded-lg bg-primary-50 text-primary-700">
        <Icon size={18} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
        {description && <p className="text-xs text-neutral-500">{description}</p>}
      </div>
    </div>
  )
}

function FormRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className || ''}`}>
      <label className="text-sm text-neutral-700 min-w-[180px] shrink-0">{label}</label>
      <div className="flex-1 max-w-xs">{children}</div>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        {description && <p className="text-xs text-neutral-500">{description}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  )
}

export function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>(defaultForm)
  const [selectedOrgId, setSelectedOrgId] = useState('')

  const { data: orgList } = useOrganizations()
  const { data: settingData, isLoading: loadingSetting } = useSettingByOrg(selectedOrgId || null)
  const updateSetting = useUpdateOrgSetting()
  const createSetting = useCreateOrgSetting()

  const orgOptions = useMemo(() => {
    if (!Array.isArray(orgList)) return []
    return orgList.map((o: any) => ({ value: o.value || o.id, label: o.label || o.name }))
  }, [orgList])

  useEffect(() => {
    if (settingData) {
      setForm(parseSetting(settingData))
    }
  }, [settingData])

  const updateField = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateDetailsField = (section: 'attendance' | 'payroll' | 'geo', key: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        [section]: {
          ...prev.details[section],
          [key]: value,
        },
      },
    }))
  }

  const isSaving = updateSetting.isPending || createSetting.isPending

  const handleSave = () => {
    const orgId = form.orgId || selectedOrgId

    const payload = {
      ...(settingData?.id && { id: settingData.id }),
      orgId,
      isAttendance: form.isAttendance,
      isEmail: form.isEmail,
      isSwap: form.isSwap,
      isColor: form.isColor,
      allowLate: form.allowLate,
      requireAvatar: form.requireAvatar,
      requireCV: form.requireCV,
      requireHealthCert: form.requireHealthCert,
      autoApproveArticle: form.autoApproveArticle,
      requireManager: form.requireManager,
      articleApprover: form.articleApprover,
      morningStart: form.morningStart,
      morningEnd: form.morningEnd,
      afternoonStart: form.afternoonStart,
      afternoonEnd: form.afternoonEnd,
      maxMembers: form.maxMembers,
      maxPosts: form.maxPosts,
      details: JSON.stringify(form.details),
    }

    if (settingData?.id) {
      updateSetting.mutate({ id: settingData.id, data: payload }, {
        onError: () => {},
      })
    } else {
      createSetting.mutate(payload, {
        onError: () => {},
      })
    }
  }

  const inputClass = 'h-9 text-sm'

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Settings className="text-primary-600" />
            Cài đặt Hệ thống
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Cấu hình toàn bộ tham số hệ thống cho tổ chức</p>
        </div>
        <Button onClick={handleSave} disabled={!selectedOrgId || isSaving} className="gap-2">
          <Save size={16} />
          {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </Button>
      </div>

      {/* Org Selector */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex items-center gap-4">
          <Building2 size={18} className="text-neutral-400" />
          <label className="text-sm font-medium text-neutral-700 min-w-[100px]">Tổ chức</label>
          <div className="w-72">
            <Select
              options={orgOptions}
              value={selectedOrgId}
              onChange={(v) => { setSelectedOrgId(v); setForm(defaultForm) }}
              placeholder="Chọn tổ chức..."
              showSearch
            />
          </div>
        </div>
      </div>

      {loadingSetting && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-neutral-500">Đang tải cấu hình...</span>
        </div>
      )}

      {!loadingSetting && selectedOrgId && (
        <div className="space-y-6">
          {/* 1. General Features */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-1">
            <SectionHeader icon={Settings} title="Tính năng chung" description="Bật/tắt các tính năng chính của hệ thống" />
            <div className="divide-y divide-neutral-100">
              <ToggleRow label="Chấm công" description="Cho phép nhân viên check-in/check-out" checked={form.isAttendance} onChange={(v) => updateField('isAttendance', v)} />
              <ToggleRow label="Email" description="Bật tính năng gửi email từ hệ thống" checked={form.isEmail} onChange={(v) => updateField('isEmail', v)} />
              <ToggleRow label="Đổi ca" description="Cho phép nhân viên đổi ca làm việc" checked={form.isSwap} onChange={(v) => updateField('isSwap', v)} />
              <ToggleRow label="Tùy chỉnh màu sắc" description="Cho phép tùy chỉnh giao diện màu sắc" checked={form.isColor} onChange={(v) => updateField('isColor', v)} />
              <ToggleRow label="Cho phép đi muộn" description="Không tính là vi phạm nếu check-in sau giờ bắt đầu" checked={form.allowLate} onChange={(v) => updateField('allowLate', v)} />
            </div>
          </div>

          {/* 2. Work Schedule */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <SectionHeader icon={Clock} title="Lịch làm việc" description="Khung giờ chấm công cho toàn hệ thống" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              <FormRow label="Giờ bắt đầu sáng">
                <Input type="time" value={form.morningStart} onChange={(e) => updateField('morningStart', e.target.value)} className={inputClass} />
              </FormRow>
              <FormRow label="Giờ kết thúc sáng">
                <Input type="time" value={form.morningEnd} onChange={(e) => updateField('morningEnd', e.target.value)} className={inputClass} />
              </FormRow>
              <FormRow label="Giờ bắt đầu chiều">
                <Input type="time" value={form.afternoonStart} onChange={(e) => updateField('afternoonStart', e.target.value)} className={inputClass} />
              </FormRow>
              <FormRow label="Giờ kết thúc chiều">
                <Input type="time" value={form.afternoonEnd} onChange={(e) => updateField('afternoonEnd', e.target.value)} className={inputClass} />
              </FormRow>
            </div>
          </div>

          {/* 3. Geo Attendance */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <SectionHeader icon={MapPin} title="Định vị chấm công" description="Cấu hình vị trí văn phòng để check-in qua GPS & WiFi" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              <FormRow label="Vĩ độ (Latitude)">
                <Input type="number" step="any" value={form.details.geo.officeLatitude} onChange={(e) => updateDetailsField('geo', 'officeLatitude', parseFloat(e.target.value) || 0)} className={inputClass} />
              </FormRow>
              <FormRow label="Kinh độ (Longitude)">
                <Input type="number" step="any" value={form.details.geo.officeLongitude} onChange={(e) => updateDetailsField('geo', 'officeLongitude', parseFloat(e.target.value) || 0)} className={inputClass} />
              </FormRow>
              <FormRow label="Bán kính cho phép (m)">
                <Input type="number" value={form.details.geo.allowedRadiusMeters} onChange={(e) => updateDetailsField('geo', 'allowedRadiusMeters', parseInt(e.target.value) || 0)} className={inputClass} />
              </FormRow>
              <FormRow label="WiFi SSID">
                <Input value={form.details.geo.allowedWifiSsids} onChange={(e) => updateDetailsField('geo', 'allowedWifiSsids', e.target.value)} className={inputClass} placeholder="SSID1, SSID2" />
              </FormRow>
              <FormRow label="WiFi BSSID" className="col-span-2">
                <Input value={form.details.geo.allowedWifiBssids} onChange={(e) => updateDetailsField('geo', 'allowedWifiBssids', e.target.value)} className={`${inputClass} max-w-md`} placeholder="AA:BB:CC:DD:EE:FF" />
              </FormRow>
            </div>
          </div>

          {/* 4. Attendance Rules */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <SectionHeader icon={RefreshCw} title="Quy tắc chấm công" description="Ngưỡng xác định đi muộn, nửa ngày, tăng ca" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              <FormRow label="Số giờ tiêu chuẩn/ngày">
                <Input type="number" value={form.details.attendance.standardHours} onChange={(e) => updateDetailsField('attendance', 'standardHours', parseInt(e.target.value) || 8)} className={inputClass} />
              </FormRow>
              <FormRow label="Ngưỡng nửa ngày (giờ)">
                <Input type="number" step="0.5" value={form.details.attendance.halfDayThreshold} onChange={(e) => updateDetailsField('attendance', 'halfDayThreshold', parseFloat(e.target.value) || 4.5)} className={inputClass} />
              </FormRow>
              <FormRow label="Delay đi muộn (phút)">
                <Input type="number" value={form.details.attendance.lateThreshold} onChange={(e) => updateDetailsField('attendance', 'lateThreshold', parseInt(e.target.value) || 0)} className={inputClass} />
              </FormRow>
              <FormRow label="Delay về sớm (phút)">
                <Input type="number" value={form.details.attendance.earlyThreshold} onChange={(e) => updateDetailsField('attendance', 'earlyThreshold', parseInt(e.target.value) || 0)} className={inputClass} />
              </FormRow>
              <FormRow label="OT trước giờ (phút)">
                <Input type="number" value={form.details.attendance.overtimeBeforeThreshold} onChange={(e) => updateDetailsField('attendance', 'overtimeBeforeThreshold', parseInt(e.target.value) || 0)} className={inputClass} />
              </FormRow>
              <FormRow label="OT sau giờ (phút)">
                <Input type="number" value={form.details.attendance.overtimeAfterThreshold} onChange={(e) => updateDetailsField('attendance', 'overtimeAfterThreshold', parseInt(e.target.value) || 0)} className={inputClass} />
              </FormRow>
              <FormRow label="Số ca tối đa/ngày">
                <Input type="number" value={form.details.attendance.maxShiftsPerDay} onChange={(e) => updateDetailsField('attendance', 'maxShiftsPerDay', parseInt(e.target.value) || 2)} className={inputClass} />
              </FormRow>
            </div>
          </div>

          {/* 5. Payroll Connection */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <SectionHeader icon={DollarSign} title="Liên kết bảng lương" description="Cấu hình cách dữ liệu chấm công ảnh hưởng đến tính lương" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              <FormRow label="Ngày công chuẩn/tháng">
                <Input type="number" value={form.details.payroll.standardWorkingDays} onChange={(e) => updateDetailsField('payroll', 'standardWorkingDays', parseInt(e.target.value) || 22)} className={inputClass} />
              </FormRow>
              <FormRow label="Ngày bắt đầu tính lương">
                <Input type="number" value={form.details.payroll.calculationStartDay} onChange={(e) => updateDetailsField('payroll', 'calculationStartDay', parseInt(e.target.value) || 1)} className={inputClass} />
              </FormRow>
              <FormRow label="Phạt đi muộn (VNĐ/phút)">
                <Input type="number" value={form.details.payroll.latePenaltyPerMinute} onChange={(e) => updateDetailsField('payroll', 'latePenaltyPerMinute', parseInt(e.target.value) || 0)} className={inputClass} />
              </FormRow>
              <FormRow label="Lương OT (VNĐ/phút)">
                <Input type="number" value={form.details.payroll.overtimePayPerMinute} onChange={(e) => updateDetailsField('payroll', 'overtimePayPerMinute', parseInt(e.target.value) || 0)} className={inputClass} />
              </FormRow>
              <div className="col-span-2 space-y-2">
                <ToggleRow label="Tự động tạo bảng lương" description="Tự động tính lương cuối kỳ" checked={form.details.payroll.isAutoGeneratePayroll} onChange={(v) => updateDetailsField('payroll', 'isAutoGeneratePayroll', v)} />
                <ToggleRow label="Tự động cập nhật lương" description="Cập nhật lương khi có thay đổi chấm công" checked={form.details.payroll.isAutoUpdatePayroll} onChange={(v) => updateDetailsField('payroll', 'isAutoUpdatePayroll', v)} />
              </div>
            </div>
          </div>

          {/* 6. HR Settings */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-1">
            <SectionHeader icon={Users} title="Nhân sự" description="Cấu hình yêu cầu hồ sơ nhân viên" />
            <div className="divide-y divide-neutral-100">
              <ToggleRow label="Yêu cầu ảnh đại diện" description="Bắt buộc nhân viên có ảnh đại diện" checked={form.requireAvatar} onChange={(v) => updateField('requireAvatar', v)} />
              <ToggleRow label="Yêu cầu CV" description="Bắt buộc tải lên CV" checked={form.requireCV} onChange={(v) => updateField('requireCV', v)} />
              <ToggleRow label="Yêu cầu giấy khám sức khỏe" description="Bắt buộc tải lên giấy khám sức khỏe" checked={form.requireHealthCert} onChange={(v) => updateField('requireHealthCert', v)} />
              <ToggleRow label="Yêu cầu quản lý duyệt" description="Cần quản lý phê duyệt một số thao tác" checked={form.requireManager} onChange={(v) => updateField('requireManager', v)} />
              <FormRow label="Số thành viên tối đa" className="py-3">
                <Input type="number" value={form.maxMembers} onChange={(e) => updateField('maxMembers', parseInt(e.target.value) || 0)} className={inputClass} />
              </FormRow>
              <FormRow label="Số bài viết tối đa" className="py-3">
                <Input type="number" value={form.maxPosts} onChange={(e) => updateField('maxPosts', parseInt(e.target.value) || 0)} className={inputClass} />
              </FormRow>
            </div>
          </div>

          {/* 7. Article Settings */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-1">
            <SectionHeader icon={FileText} title="Bài viết & CMS" description="Cấu hình duyệt bài viết" />
            <div className="divide-y divide-neutral-100">
              <ToggleRow label="Tự động duyệt bài viết" description="Bài viết được đăng ngay không cần duyệt" checked={form.autoApproveArticle} onChange={(v) => updateField('autoApproveArticle', v)} />
              <FormRow label="Người duyệt bài viết" className="py-3">
                <Input value={form.articleApprover} onChange={(e) => updateField('articleApprover', e.target.value)} className={inputClass} placeholder="ID người duyệt" />
              </FormRow>
            </div>
          </div>

          {/* Save Button Bottom */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!selectedOrgId || isSaving} className="gap-2 px-8">
              <Save size={16} />
              {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </Button>
          </div>
        </div>
      )}

      {!loadingSetting && !selectedOrgId && (
        <div className="bg-white rounded-xl border border-neutral-200 p-16 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-neutral-200" />
          <p className="text-neutral-500 text-lg">Chọn tổ chức để xem và chỉnh sửa cài đặt hệ thống</p>
        </div>
      )}

    </div>
  )
}
