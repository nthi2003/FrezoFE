import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Save, Building2, MapPin, Wifi, Clock, Settings, DollarSign, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/switch'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useOrganizations,
  useSettingByOrg,
  useUpdateOrgSetting,
  useCreateOrgSetting,
} from '@/modules/qtht/hooks/useAttendanceSettings'

interface SettingForm {
  orgId: string

  isAttendance: boolean
  allowLate: boolean

  morningStart: string
  morningEnd: string
  afternoonStart: string
  afternoonEnd: string

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

const defaultForm: SettingForm = {
  orgId: '',
  isAttendance: true,
  allowLate: true,
  morningStart: '08:00',
  morningEnd: '12:00',
  afternoonStart: '13:00',
  afternoonEnd: '17:30',
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

function parseSetting(data: any): SettingForm {
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
    allowLate: data?.allowLate ?? true,
    morningStart: data?.morningStart || '08:00',
    morningEnd: data?.morningEnd || '12:00',
    afternoonStart: data?.afternoonStart || '13:00',
    afternoonEnd: data?.afternoonEnd || '17:30',
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
      <label className="text-sm text-neutral-700 min-w-[160px] shrink-0">{label}</label>
      <div className="flex-1 max-w-xs">{children}</div>
    </div>
  )
}

export function AttendanceSettingsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orgIdParam = searchParams.get('orgId') || ''

  const [form, setForm] = useState<SettingForm>(defaultForm)
  const [selectedOrgId, setSelectedOrgId] = useState(orgIdParam)
  const [saving, setSaving] = useState(false)

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

  const updateField = <K extends keyof SettingForm>(key: K, value: SettingForm[K]) => {
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

  const handleSave = async () => {
    const orgId = form.orgId || selectedOrgId

    const payload = {
      ...(settingData?.id && { id: settingData.id }),
      orgId,
      isAttendance: form.isAttendance,
      isSwap: settingData?.isSwap ?? false,
      isEmail: settingData?.isEmail ?? false,
      isColor: settingData?.isColor ?? false,
      morningStart: form.morningStart,
      morningEnd: form.morningEnd,
      afternoonStart: form.afternoonStart,
      afternoonEnd: form.afternoonEnd,
      allowLate: form.allowLate,
      details: JSON.stringify(form.details),
      maxMembers: settingData?.maxMembers ?? 100,
      maxPosts: settingData?.maxPosts ?? 1000,
      requireAvatar: settingData?.requireAvatar ?? false,
      requireCV: settingData?.requireCV ?? false,
      requireHealthCert: settingData?.requireHealthCert ?? false,
      autoApproveArticle: settingData?.autoApproveArticle ?? false,
      articleApprover: settingData?.articleApprover ?? '',
      requireManager: settingData?.requireManager ?? false,
    }

    if (settingData?.id) {
      updateSetting.mutate({ id: settingData.id, data: payload })
    } else {
      createSetting.mutate(payload)
    }
  }

  const inputClass = 'h-9 text-sm'

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/attendance')} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <ArrowLeft size={18} className="text-neutral-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Cài đặt Chấm công</h1>
            <p className="text-sm text-neutral-500 mt-1">Cấu hình ca làm việc, định vị, quy tắc chấm công và kết nối bảng lương</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={!selectedOrgId || isSaving}
          className="gap-2"
        >
          <Save size={16} />
          {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </Button>
      </div>

      {/* Org Selector */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-neutral-700 min-w-[160px]">Chọn tổ chức</label>
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
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-neutral-500">Đang tải cấu hình...</span>
        </div>
      )}

      {!loadingSetting && selectedOrgId && (
        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <SectionHeader icon={Settings} title="Cài đặt chung" description="Bật/tắt tính năng chấm công và các tùy chọn cơ bản" />
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-800">Bật tính năng chấm công</p>
                  <p className="text-xs text-neutral-500">Cho phép nhân viên check-in/check-out qua ứng dụng</p>
                </div>
                <Switch checked={form.isAttendance} onChange={(v) => updateField('isAttendance', v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-800">Cho phép đi muộn</p>
                  <p className="text-xs text-neutral-500">Không tính là đi muộn nếu check-in sau giờ bắt đầu ca</p>
                </div>
                <Switch checked={form.allowLate} onChange={(v) => updateField('allowLate', v)} />
              </div>
            </div>
          </div>

          {/* Shift Times */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <SectionHeader icon={Clock} title="Khung giờ làm việc" description="Thiết lập giờ bắt đầu và kết thúc ca sáng, ca chiều" />
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

          {/* Geo Attendance Config */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <SectionHeader icon={MapPin} title="Định vị GPS & WiFi" description="Cấu hình vị trí văn phòng và mạng WiFi để check-in tự động" />
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
              <FormRow label="WiFi SSID (cách nhau bằng dấu phẩy)">
                <Input value={form.details.geo.allowedWifiSsids} onChange={(e) => updateDetailsField('geo', 'allowedWifiSsids', e.target.value)} className={inputClass} placeholder="SSID1, SSID2" />
              </FormRow>
              <FormRow label="WiFi BSSID (cách nhau bằng dấu phẩy)" className="col-span-2">
                <Input value={form.details.geo.allowedWifiBssids} onChange={(e) => updateDetailsField('geo', 'allowedWifiBssids', e.target.value)} className={`${inputClass} max-w-md`} placeholder="AA:BB:CC:DD:EE:FF, 11:22:33:44:55:66" />
              </FormRow>
            </div>
          </div>

          {/* Attendance Rules */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <SectionHeader icon={Clock} title="Quy tắc chấm công" description="Ngưỡng xác định đi muộn, nửa ngày, tăng ca" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              <FormRow label="Số giờ tiêu chuẩn/ngày">
                <Input type="number" value={form.details.attendance.standardHours} onChange={(e) => updateDetailsField('attendance', 'standardHours', parseInt(e.target.value) || 8)} className={inputClass} />
              </FormRow>
              <FormRow label="Ngưỡng nửa ngày (giờ)">
                <Input type="number" step="0.5" value={form.details.attendance.halfDayThreshold} onChange={(e) => updateDetailsField('attendance', 'halfDayThreshold', parseFloat(e.target.value) || 4.5)} className={inputClass} />
              </FormRow>
              <FormRow label="Phút delay cho phép (đi muộn)">
                <Input type="number" value={form.details.attendance.lateThreshold} onChange={(e) => updateDetailsField('attendance', 'lateThreshold', parseInt(e.target.value) || 0)} className={inputClass} />
              </FormRow>
              <FormRow label="Phút delay cho phép (về sớm)">
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

          {/* Payroll Connection */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <SectionHeader icon={DollarSign} title="Kết nối Bảng lương" description="Cấu hình cách chấm công ảnh hưởng đến tính lương" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              <FormRow label="Số ngày công chuẩn/tháng">
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
              <div className="flex items-center justify-between col-span-2">
                <div>
                  <p className="text-sm font-medium text-neutral-800">Tự động tạo bảng lương</p>
                  <p className="text-xs text-neutral-500">Tự động tính lương khi kết thúc kỳ</p>
                </div>
                <Switch checked={form.details.payroll.isAutoGeneratePayroll} onChange={(v) => updateDetailsField('payroll', 'isAutoGeneratePayroll', v)} />
              </div>
              <div className="flex items-center justify-between col-span-2">
                <div>
                  <p className="text-sm font-medium text-neutral-800">Tự động cập nhật bảng lương</p>
                  <p className="text-xs text-neutral-500">Cập nhật lương khi có thay đổi chấm công</p>
                </div>
                <Switch checked={form.details.payroll.isAutoUpdatePayroll} onChange={(v) => updateDetailsField('payroll', 'isAutoUpdatePayroll', v)} />
              </div>
            </div>
          </div>

          {/* Save Button Bottom */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!selectedOrgId || isSaving}
              className="gap-2 px-8"
            >
              <Save size={16} />
              {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </Button>
          </div>
        </div>
      )}

      {!loadingSetting && !selectedOrgId && (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
          <p className="text-neutral-500">Vui lòng chọn tổ chức để xem và chỉnh sửa cài đặt chấm công</p>
        </div>
      )}
    </div>
  )
}
