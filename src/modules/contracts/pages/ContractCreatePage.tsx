import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Send, Loader2, ArrowLeft, FileText, Upload, X, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/Select'
import { TiptapEditor } from '@/components/shared/TiptapEditor'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractApi } from '@/modules/qlns/services/contractApi'
import { personApi } from '@/modules/qlns/services/personApi'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

const CONTRACT_TYPES = [
  { value: 'THU_VIEC', label: 'Hợp đồng thử việc' },
  { value: 'CHINH_THUC', label: 'Hợp đồng chính thức' },
  { value: 'THOI_VU', label: 'Hợp đồng thời vụ' },
  { value: 'PART_TIME', label: 'Hợp đồng bán thời gian' },
]

export function ContractCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    personId: '',
    type: '',
    startDate: '',
    endDate: '',
    content: '',
    employerName: '',
    employerAddress: '',
    employeeIdNumber: '',
    employeeDob: '',
    jobPosition: '',
    workLocation: '',
    probationDays: '',
    allowance: '',
  })
  const [approverId, setApproverId] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; id: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: (file: File) => contractApi.uploadAndExtract(file),
    onSuccess: (res: any) => {
      const data = res?.data
      if (data) {
        setUploadedFiles(prev => [...prev, { name: data.fileName || data.name || 'document', url: data.fileUrl || data.url, id: data.id || crypto.randomUUID() }])
        if (data.code) setFormData(prev => ({ ...prev, code: data.code }))
        if (data.type) {
          const matched = CONTRACT_TYPES.find(t => t.label.toLowerCase().includes(data.type.toLowerCase()) || data.type.toLowerCase().includes(t.label.toLowerCase()))
          if (matched) setFormData(prev => ({ ...prev, type: matched.value }))
        }
        if (data.startDate) setFormData(prev => ({ ...prev, startDate: data.startDate }))
        if (data.endDate) setFormData(prev => ({ ...prev, endDate: data.endDate }))
        if (data.html) setFormData(prev => ({ ...prev, content: data.html }))
        else if (data.content) setFormData(prev => ({ ...prev, content: data.content }))
        if (data.employerName) setFormData(prev => ({ ...prev, employerName: data.employerName }))
        if (data.employerAddress) setFormData(prev => ({ ...prev, employerAddress: data.employerAddress }))
        if (data.employeeIdNumber) setFormData(prev => ({ ...prev, employeeIdNumber: data.employeeIdNumber }))
        if (data.employeeDob) setFormData(prev => ({ ...prev, employeeDob: data.employeeDob }))
        if (data.jobPosition) setFormData(prev => ({ ...prev, jobPosition: data.jobPosition }))
        if (data.workLocation) setFormData(prev => ({ ...prev, workLocation: data.workLocation }))
        if (data.probationDays) setFormData(prev => ({ ...prev, probationDays: data.probationDays }))
        if (data.allowance) setFormData(prev => ({ ...prev, allowance: data.allowance }))
        toast.success('Tải file và trích xuất dữ liệu thành công')
      }
    },
    onError: () => toast.error('Tải file thất bại'),
  })

  const aiEditMutation = useMutation({
    mutationFn: (text: string) => contractApi.aiEditText(text),
    onSuccess: (res: any) => {
      const edited = res?.data?.edited
      if (edited) {
        setFormData(prev => ({ ...prev, content: edited }))
        toast.success('Đã chỉnh sửa văn bản bằng AI')
      }
    },
    onError: () => toast.error('AI chỉnh sửa thất bại'),
  })

  const { data: personOptions } = useQuery({
    queryKey: ['persons-combobox'],
    queryFn: () => personApi.getCombobox(),
    select: (res: any) => res?.data ?? [],
  })

  const createContract = useMutation({
    mutationFn: async (data: any) => {
      const res = await contractApi.create(data)
      const contractId = res?.data?.id
      if (contractId && approverId) {
        await contractApi.assign(contractId, { approverId })
      }
      if (contractId && formData.content) {
        await contractApi.saveContent(contractId, formData.content)
      }
      return res
    },
    onSuccess: () => {
      toast.success('Tạo hợp đồng thành công')
      queryClient.invalidateQueries({ queryKey: ['persons_for_contracts'] })
      navigate('/qlns/contract')
    },
  })

  const validateStep1 = () => {
    const errors: Record<string, string> = {}
    if (!formData.code.trim()) errors.code = 'Mã hợp đồng bắt buộc'
    if (!formData.personId) errors.personId = 'Vui lòng chọn nhân sự'
    if (!formData.type) errors.type = 'Vui lòng chọn loại hợp đồng'
    if (!formData.startDate) errors.startDate = 'Ngày bắt đầu bắt buộc'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) setStep(2)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await createContract.mutateAsync({
        ...formData,
        endDate: formData.endDate || undefined,
        content: formData.content || undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setFormErrors(prev => ({ ...prev, [field]: '' }))
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/qlns/contract')} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tạo hợp đồng mới</h1>
          <p className="text-sm text-neutral-500">Soạn thảo và gửi hợp đồng lên cấp trên phê duyệt</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 max-w-md mx-auto">
        <div className={cn('flex items-center gap-2', step >= 1 ? 'text-primary-700' : 'text-neutral-400')}>
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', step >= 1 ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-400')}>1</div>
          <span className="text-sm font-medium">Soạn thảo</span>
        </div>
        <div className={cn('flex-1 h-px mx-2', step >= 2 ? 'bg-primary-300' : 'bg-neutral-200')} />
        <div className={cn('flex items-center gap-2', step >= 2 ? 'text-primary-700' : 'text-neutral-400')}>
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', step >= 2 ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-400')}>2</div>
          <span className="text-sm font-medium">Gửi duyệt</span>
        </div>
      </div>

      {/* Step 1: Editor + Form */}
      {step === 1 && (
        <div className="flex gap-6 items-start">
          {/* Left: Upload zone + Form fields */}
          <div className="w-80 shrink-0 space-y-4">
            {/* Upload Zone */}
            <div
              className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-6 text-center hover:border-primary-300 hover:bg-primary-50/30 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".doc,.docx,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadMutation.mutate(file)
                  e.target.value = ''
                }}
              />
              <div className="mx-auto w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
                <Upload className="w-7 h-7 text-primary-400 group-hover:text-primary-600 transition-colors" />
              </div>
              <p className="text-sm font-semibold text-neutral-700">Tải tài liệu lên</p>
              <p className="text-xs text-neutral-400 mt-1">Kéo thả hoặc click để chọn file</p>
              <p className="text-xs text-neutral-300 mt-2">Hỗ trợ .doc .docx .pdf</p>
            </div>

            {/* Uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-2">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Đã tải lên ({uploadedFiles.length})</p>
                {uploadedFiles.map((f) => {
                  const isWord = /\.docx?$/i.test(f.name)
                  return (
                    <div key={f.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs group/file">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', isWord ? 'bg-blue-100' : 'bg-red-100')}>
                        <FileText size={16} className={isWord ? 'text-blue-600' : 'text-red-500'} />
                      </div>
                      <span className="flex-1 truncate text-neutral-700 font-medium">{f.name}</span>
                      <button
                        onClick={() => setUploadedFiles(prev => prev.filter(x => x.id !== f.id))}
                        className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-red-500 transition-colors opacity-0 group-hover/file:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Form fields */}
            <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-neutral-700 pb-2 border-b border-border">Thông tin hợp đồng</h3>
              <div className="space-y-1.5">
                <Label>Mã hợp đồng <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="VD: HĐ-001"
                  value={formData.code}
                  onChange={(e) => updateField('code', e.target.value)}
                />
                {formErrors.code && <p className="text-xs text-red-500">{formErrors.code}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Nhân sự <span className="text-red-500">*</span></Label>
                <Select
                  options={personOptions || []}
                  value={formData.personId}
                  onChange={(v) => updateField('personId', v)}
                  placeholder="Chọn nhân sự..."
                />
                {formErrors.personId && <p className="text-xs text-red-500">{formErrors.personId}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Loại hợp đồng <span className="text-red-500">*</span></Label>
                <Select
                  options={CONTRACT_TYPES}
                  value={formData.type}
                  onChange={(v) => updateField('type', v)}
                  placeholder="Chọn loại..."
                />
                {formErrors.type && <p className="text-xs text-red-500">{formErrors.type}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Ngày bắt đầu <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                />
                {formErrors.startDate && <p className="text-xs text-red-500">{formErrors.startDate}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Ngày kết thúc</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                />
              </div>
            </div>

            {/* Employer / Employee details */}
            <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-neutral-700 pb-2 border-b border-border">Thông tin chi tiết</h3>
              <div className="space-y-1.5">
                <Label>Tên công ty</Label>
                <Input
                  placeholder="Công ty TNHH ..."
                  value={formData.employerName}
                  onChange={(e) => updateField('employerName', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Địa chỉ công ty</Label>
                <Input
                  placeholder="Địa chỉ..."
                  value={formData.employerAddress}
                  onChange={(e) => updateField('employerAddress', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>CCCD / Hộ chiếu</Label>
                <Input
                  placeholder="Số CCCD/Hộ chiếu..."
                  value={formData.employeeIdNumber}
                  onChange={(e) => updateField('employeeIdNumber', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày sinh</Label>
                <Input
                  type="date"
                  value={formData.employeeDob}
                  onChange={(e) => updateField('employeeDob', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Vị trí / Chức danh</Label>
                <Input
                  placeholder="Nhân viên kinh doanh..."
                  value={formData.jobPosition}
                  onChange={(e) => updateField('jobPosition', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Địa điểm làm việc</Label>
                <Input
                  placeholder="Văn phòng..."
                  value={formData.workLocation}
                  onChange={(e) => updateField('workLocation', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Thời hạn thử việc (ngày)</Label>
                <Input
                  type="number"
                  placeholder="60"
                  value={formData.probationDays}
                  onChange={(e) => updateField('probationDays', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phụ cấp</Label>
                <Input
                  placeholder="Mô tả phụ cấp..."
                  value={formData.allowance}
                  onChange={(e) => updateField('allowance', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Right: AI button + Editor */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={() => {
                  if (formData.content) aiEditMutation.mutate(formData.content)
                  else toast.error('Vui lòng nhập nội dung trước khi chỉnh sửa')
                }}
                disabled={aiEditMutation.isPending}
              >
                {aiEditMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Bot size={15} />}
                {aiEditMutation.isPending ? 'Đang xử lý...' : 'Biên tập bằng AI'}
              </Button>
            </div>
            <Label className="block font-medium">Nội dung hợp đồng</Label>
            <TiptapEditor
              value={formData.content}
              onChange={(html) => updateField('content', html)}
              placeholder="Nhập nội dung hợp đồng..."
            />
          </div>
        </div>
      )}

      {/* Step 2: Approver */}
      {step === 2 && (
        <div className="flex flex-col items-center py-12 space-y-6 bg-white rounded-xl border border-border shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
            <Send className="w-7 h-7 text-primary-600" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-neutral-800">Gửi hợp đồng đi duyệt</h3>
            <p className="text-sm text-neutral-500 mt-1">Chọn người phê duyệt để gửi hợp đồng lên cấp trên</p>
          </div>
          <div className="w-full max-w-sm space-y-1.5">
            <Label>Người phê duyệt</Label>
            <Select
              options={personOptions || []}
              value={approverId}
              onChange={setApproverId}
              placeholder="Chọn người phê duyệt..."
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={() => step === 1 ? navigate('/qlns/contract') : setStep(1)}>
          {step === 1 ? 'Hủy' : <><ChevronLeft size={15} className="mr-1" /> Quay lại</>}
        </Button>
        {step === 1 ? (
          <Button onClick={handleNext}>
            Tiếp theo <ChevronRight size={15} className="ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting || !approverId} className="gap-2">
            {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Gửi duyệt
          </Button>
        )}
      </div>
    </div>
  )
}
