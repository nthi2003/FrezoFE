import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Send, Loader2, ArrowLeft, FileText, Upload, X, Bot, FileCheck, ScrollText, Building2, BadgeCheck, BookOpen, User, Briefcase, Save, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Button } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { Label } from '@frezo/ui'
import { Select } from '@frezo/ui'
import { AppModal } from '@frezo/ui'
import { TiptapEditor } from '@/components/shared/TiptapEditor'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractApi } from '@/modules/qlns/services/contractApi'
import { personApi } from '@/modules/qlns/services/personApi'
import { toast } from 'sonner'
import { cn } from '@frezo/utils'
import { useAuthStore } from '@/stores/authStore'
import { CONTRACT_TEMPLATES, CONTRACT_TYPES, PLACEHOLDER_PATTERNS } from '../constants/templates'
import { useContractTemplates, fetchTemplateContent } from '@/lib/hooks/useContractTemplates'
import { convertDocxToHtml } from '@/lib/utils/convertDocx'

function wrapPlaceholders(html: string) {
  let result = html
  PLACEHOLDER_PATTERNS.forEach(({ key, label }) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(
      regex,
      `<span class="contract-placeholder bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded border border-primary-200 font-semibold" data-placeholder="${key}">${label}</span>`
    )
  })
  return result
}

export function ContractCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'template' | 'upload' | 'manual'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [personDetails, setPersonDetails] = useState<any>(null)
  const [formTab, setFormTab] = useState<'employee' | 'employer' | 'salary'>('employee')
  const editorRef = useRef<any>(null)

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
    basicSalary: '',
    kpiAmount: '',
    personName: '',
    bhxhBase: '',
  })
  const [baseContent, setBaseContent] = useState('')
  const isSyncingToEditor = useRef(false)

  const MIN_SI_BASE = 4960000

  const netSalary = useMemo(() => {
    const base = Number(formData.basicSalary) || 0
    const kpi = Number(formData.kpiAmount) || 0
    return base + kpi
  }, [formData.basicSalary, formData.kpiAmount])

  const siBase = useMemo(() => {
    const b = Number(formData.bhxhBase) || MIN_SI_BASE
    return Math.max(b, MIN_SI_BASE)
  }, [formData.bhxhBase])

  const insurance = useMemo(() => {
    const salary = Number(formData.basicSalary) || 0
    const base = Math.max(salary, siBase)
    return {
      bhxh: base * 0.08,
      bhyt: base * 0.015,
      bhtn: base * 0.01,
      total: base * 0.105,
    }
  }, [formData.basicSalary, siBase])

  const salaryAfterInsurance = useMemo(() => {
    return netSalary - insurance.total
  }, [netSalary, insurance.total])

  const [approverId, setApproverId] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const { templates: savedTemplates, addTemplate, removeTemplate } = useContractTemplates()
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; id: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      let localHtml = ''
      if (file.name.endsWith('.docx')) {
        try {
          localHtml = await convertDocxToHtml(await file.arrayBuffer())
        } catch (_) {}
      }
      const res = await contractApi.uploadAndExtract(file)
      return { apiResult: res, localHtml }
    },
    onSuccess: (res: any) => {
      const data = res?.apiResult?.data
      if (data) {
        setUploadedFiles(prev => [...prev, { name: data.fileName || data.name || 'document', url: data.fileUrl || data.url, id: data.id || crypto.randomUUID() }])
        if (data.code) setFormData(prev => ({ ...prev, code: data.code }))
        if (data.type) {
          const matched = CONTRACT_TYPES.find(t => t.label.toLowerCase().includes(data.type.toLowerCase()) || data.type.toLowerCase().includes(t.label.toLowerCase()))
          if (matched) setFormData(prev => ({ ...prev, type: matched.value }))
        }
        if (data.startDate) setFormData(prev => ({ ...prev, startDate: data.startDate }))
        if (data.endDate) setFormData(prev => ({ ...prev, endDate: data.endDate }))
        if (res.localHtml) setFormData(prev => ({ ...prev, content: res.localHtml }))
        else if (data.html) setFormData(prev => ({ ...prev, content: data.html }))
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

  const { data: personDetail } = useQuery({
    queryKey: ['person-detail', formData.personId],
    queryFn: () => personApi.getById(formData.personId),
    enabled: !!formData.personId,
    select: (res: any) => res?.data,
  })

  useEffect(() => {
    if (!personDetail) return
    setFormData(prev => ({
      ...prev,
      personName: personDetail.name || prev.personName,
      employeeDob: personDetail.dob ? personDetail.dob.toString() : prev.employeeDob,
      employeeIdNumber: personDetail.idNumber || prev.employeeIdNumber,
      jobPosition: personDetail.jobTitle || prev.jobPosition,
      workLocation: personDetail.address || prev.workLocation,
      employerName: personDetail.orgName || prev.employerName,
    }))
  }, [personDetail])

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

  const handleSelectTemplate = async (tplId: string) => {
    const builtin = CONTRACT_TEMPLATES.find(t => t.id === tplId)
    if (builtin) {
      setSelectedTemplate(tplId)
      const wrapped = wrapPlaceholders(builtin.content)
      setBaseContent(wrapped)
      setFormData(prev => ({ ...prev, type: builtin.type, content: wrapped }))
      setActiveTab('template')
      return
    }
    const saved = savedTemplates.find(t => t.id === tplId)
    if (!saved) return
    setSelectedTemplate(tplId)
    setFormData(prev => ({ ...prev, type: saved.type }))
    setActiveTab('template')
    if (saved.fileUrl) {
      setLoadingTemplate(true)
      try {
        const content = await fetchTemplateContent(saved.fileUrl)
        const wrapped = wrapPlaceholders(content)
        setBaseContent(wrapped)
        setFormData(prev => ({ ...prev, content: wrapped }))
      } catch {
        toast.error('Không thể tải nội dung mẫu')
      } finally {
        setLoadingTemplate(false)
      }
    }
  }

  const validateStep1 = () => {
    const errors: Record<string, string> = {}
    if (!formData.code.trim()) errors.code = 'Mã hợp đồng bắt buộc'
    if (!formData.personId) errors.personId = 'Vui lòng chọn nhân sự'
    if (!formData.type) errors.type = 'Vui lòng chọn loại hợp đồng'
    if (!formData.startDate) errors.startDate = 'Ngày bắt đầu bắt buộc'
    const salary = Number(formData.basicSalary) || 0
    if (salary > 0 && salary < MIN_SI_BASE) {
      errors.basicSalary = `Lương cơ bản tối thiểu để đóng BHXH là ${MIN_SI_BASE.toLocaleString('vi-VN')} VNĐ`
    }
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

  const insertPlaceholder = (key: string, label: string) => {
    editorRef.current?.insertHtml(
      `<span class="contract-placeholder bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded border border-primary-200 font-semibold" data-placeholder="${key}">${label}</span>`
    )
  }

  useEffect(() => {
    let content = formData.content
    if (!content) return

    let updated = false
    const textFields: Record<string, string> = {
      personName: formData.personName,
      code: formData.code,
      employerName: formData.employerName,
      employerAddress: formData.employerAddress,
      employeeIdNumber: formData.employeeIdNumber,
      employeeDob: formData.employeeDob,
      jobPosition: formData.jobPosition,
      workLocation: formData.workLocation,
      probationDays: formData.probationDays,
      allowance: formData.allowance,
      startDate: formData.startDate,
      endDate: formData.endDate,
    }

    const base = Number(formData.basicSalary) || 0
    const kpiAmt = Number(formData.kpiAmount) || 0
    const net = base + kpiAmt

    const valuesMap: Record<string, string> = {}
    for (const [key, val] of Object.entries(textFields)) {
      valuesMap[key] = val || PLACEHOLDER_PATTERNS.find(p => p.key === key)?.label || ''
    }
    valuesMap['basicSalary'] = base ? base.toLocaleString('vi-VN') + ' VNĐ' : 'Lương cơ bản'
    valuesMap['kpiAmount'] = kpiAmt ? kpiAmt.toLocaleString('vi-VN') + ' VNĐ' : 'Thưởng KPI'
    valuesMap['netSalary'] = net ? net.toLocaleString('vi-VN') + ' VNĐ' : 'Tổng lương net'
    valuesMap['bhxh'] = insurance.bhxh ? Math.round(insurance.bhxh).toLocaleString('vi-VN') + ' VNĐ' : 'BHXH'
    valuesMap['bhyt'] = insurance.bhyt ? Math.round(insurance.bhyt).toLocaleString('vi-VN') + ' VNĐ' : 'BHYT'
    valuesMap['bhtn'] = insurance.bhtn ? Math.round(insurance.bhtn).toLocaleString('vi-VN') + ' VNĐ' : 'BHTN'
    valuesMap['totalInsurance'] = insurance.total ? Math.round(insurance.total).toLocaleString('vi-VN') + ' VNĐ' : 'Tổng khấu trừ BH'

    for (const [key, val] of Object.entries(valuesMap)) {
      const regex = new RegExp(`(<span[^>]*data-placeholder="${key}"[^>]*>)(.*?)(</span>)`, 'gi')
      if (regex.test(content)) {
        const matches = content.match(regex)
        if (matches) {
          const testMatch = new RegExp(`(<span[^>]*data-placeholder="${key}"[^>]*>)(.*?)(</span>)`, 'gi').exec(content)
          if (testMatch && testMatch[2] !== val) {
            content = content.replace(regex, `$1${val}$3`)
            updated = true
          }
        }
      }
    }

    if (updated && content !== formData.content) {
      setFormData(prev => ({ ...prev, content }))
    }
  }, [
    formData.personName, formData.code, formData.employerName, formData.employerAddress,
    formData.employeeIdNumber, formData.employeeDob, formData.jobPosition, formData.workLocation,
    formData.probationDays, formData.allowance, formData.basicSalary, formData.kpiAmount,
    formData.startDate, formData.endDate, formData.content, insurance
  ])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/qlns/contract')} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tạo hợp đồng mới</h1>
          <p className="text-sm text-neutral-500">Chọn mẫu, tải lên hoặc soạn thảo hợp đồng từ đầu</p>
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

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Template / Upload / Manual tabs */}
          <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl w-fit">
            {[
              { id: 'template' as const, label: 'Chọn mẫu có sẵn', icon: FileCheck },
              { id: 'upload' as const, label: 'Tải file lên', icon: Upload },
              { id: 'manual' as const, label: 'Tự soạn thảo', icon: ScrollText },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id !== 'template') setSelectedTemplate(null) }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-white text-primary-700 shadow-sm border border-neutral-200'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'template' && (
            <div className="space-y-6">
              {savedTemplates.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-neutral-400">
                  <FileText size={48} className="mb-4 text-neutral-200" />
                  <p className="text-sm font-medium">Chưa có mẫu nào</p>
                  <p className="text-xs mt-1">Soạn nội dung hợp đồng rồi bấm "Lưu mẫu" để lưu lại</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Mẫu đã lưu</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {savedTemplates.map(tpl => {
                      const isActive = selectedTemplate === tpl.id
                      const typeLabel = CONTRACT_TYPES.find(t => t.value === tpl.type)?.label || tpl.type
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => handleSelectTemplate(tpl.id)}
                          className={cn(
                            'bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md group',
                            isActive
                              ? 'border-primary-500 shadow-md ring-2 ring-primary-100'
                              : 'border-neutral-200 hover:border-primary-200'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className={cn(
                              'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
                              isActive ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500'
                            )}>
                              <FileText size={24} />
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeTemplate.mutate(tpl.id) }}
                              className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                              title="Xóa mẫu"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <h3 className="font-semibold text-neutral-800 text-sm">{tpl.name}</h3>
                          <p className="text-xs text-neutral-400 mt-1">{typeLabel}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('!border-primary-300', '!bg-primary-50/30') }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('!border-primary-300', '!bg-primary-50/30') }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('!border-primary-300', '!bg-primary-50/30')
                  const file = e.dataTransfer.files?.[0]
                  if (file) uploadMutation.mutate(file)
                }}
                onClick={() => fileInputRef.current?.click()}
                className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center hover:border-primary-300 hover:bg-primary-50/30 transition-colors cursor-pointer group"
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
                {uploadMutation.isPending ? (
                  <div className="flex flex-col items-center py-4">
                    <Loader2 size={40} className="animate-spin text-primary-500 mb-4" />
                    <p className="text-sm font-semibold text-neutral-700">Đang xử lý...</p>
                    <p className="text-xs text-neutral-400 mt-1">Trích xuất dữ liệu từ file</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                      <Upload className="w-8 h-8 text-primary-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                    <p className="text-sm font-semibold text-neutral-700">Tải tài liệu lên</p>
                    <p className="text-xs text-neutral-400 mt-1">Kéo thả hoặc click để chọn file</p>
                    <p className="text-xs text-neutral-300 mt-2">Hỗ trợ .doc .docx .pdf</p>
                  </div>
                )}
              </div>

              {uploadedFiles.length > 0 && (
                <div className="bg-white rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Đã tải lên ({uploadedFiles.length})</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setActiveTab('manual')}
                    >
                      Soạn thảo
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {uploadedFiles.map((f) => {
                      const isWord = /\.docx?$/i.test(f.name)
                      return (
                        <div key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs group/file">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', isWord ? 'bg-blue-100' : 'bg-red-100')}>
                            <FileText size={16} className={isWord ? 'text-blue-600' : 'text-red-500'} />
                          </div>
                          <span className="flex-1 truncate text-neutral-700 font-medium min-w-0">{f.name}</span>
                          <button
                            onClick={() => setUploadedFiles(prev => prev.filter(x => x.id !== f.id))}
                            className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-red-500 transition-colors opacity-0 group-hover/file:opacity-100 shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && selectedTemplate && (
            <div className="flex items-center gap-3 px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-sm text-primary-800">
              <FileCheck size={18} className="shrink-0" />
              <span>Đang sử dụng mẫu: <strong>{CONTRACT_TEMPLATES.find(t => t.id === selectedTemplate)?.name || savedTemplates.find(t => t.id === selectedTemplate)?.name}</strong></span>
              <button onClick={() => setSelectedTemplate(null)} className="ml-auto text-xs text-primary-600 hover:text-primary-800 underline">
                Bỏ chọn mẫu
              </button>
            </div>
          )}

          {/* Form + Editor */}
          <div className="flex gap-6 items-start">
            {/* Left: Form fields with Tabs */}
            <div className="w-[420px] shrink-0 flex flex-col gap-4">
              {/* Tab navigation */}
              <div className="bg-neutral-100 p-1 rounded-xl flex gap-1 border border-border">
                {[
                  { id: 'employee' as const, label: 'Nhân sự & HĐ' },
                  { id: 'employer' as const, label: 'Doanh nghiệp' },
                  { id: 'salary' as const, label: 'Lương & BH' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormTab(t.id)}
                    className={cn(
                      'flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all',
                      formTab === t.id
                        ? 'bg-white text-primary-700 shadow-sm border border-neutral-200'
                        : 'text-neutral-500 hover:text-neutral-700'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-xl border border-border p-5 shadow-sm min-h-[460px]">
                {formTab === 'employee' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-neutral-700 pb-2 border-b border-border flex items-center gap-2">
                      <User size={15} className="text-primary-500" />
                      Thông tin hợp đồng & Nhân sự
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="space-y-1.5 col-span-2">
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
                        <Label>Mã hợp đồng <span className="text-red-500">*</span></Label>
                        <Input
                          placeholder="VD: HĐ-001"
                          value={formData.code}
                          onChange={(e) => updateField('code', e.target.value)}
                        />
                        {formErrors.code && <p className="text-xs text-red-500">{formErrors.code}</p>}
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
                      <div className="space-y-1.5 col-span-2">
                        <Label>Họ tên người lao động</Label>
                        <Input
                          placeholder="Tự động điền khi chọn nhân sự..."
                          value={formData.personName}
                          onChange={(e) => updateField('personName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>CCCD / Hộ chiếu</Label>
                        <Input
                          placeholder="Số CCCD..."
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
                    </div>
                  </div>
                )}

                {formTab === 'employer' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-neutral-700 pb-2 border-b border-border flex items-center gap-2">
                      <Building2 size={15} className="text-primary-500" />
                      Thông tin doanh nghiệp & Công việc
                    </h3>
                    <div className="space-y-3">
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
                      <div className="grid grid-cols-2 gap-3">
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
                      </div>
                      <div className="grid grid-cols-2 gap-3">
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
                  </div>
                )}

                {formTab === 'salary' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-neutral-700 pb-2 border-b border-border flex items-center gap-2">
                      <Briefcase size={15} className="text-primary-500" />
                      Thông tin lương & Bảo hiểm
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Lương cơ bản (VNĐ)</Label>
                          <Input
                            type="number"
                            placeholder="10,000,000"
                            value={formData.basicSalary}
                            onChange={(e) => updateField('basicSalary', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Thưởng KPI (VNĐ)</Label>
                          <Input
                            type="number"
                            placeholder="2,000,000"
                            value={formData.kpiAmount}
                            onChange={(e) => updateField('kpiAmount', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2 bg-primary-50 border border-primary-200 rounded-xl">
                        <span className="text-xs font-semibold text-primary-800">Tổng lương net</span>
                        <span className="text-sm font-bold text-primary-700">
                          {netSalary > 0 ? netSalary.toLocaleString('vi-VN') + ' VNĐ' : '---'}
                        </span>
                      </div>
                      <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                        <Label>Mức lương đóng BH (VNĐ)</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder={MIN_SI_BASE.toLocaleString('vi-VN')}
                            value={formData.bhxhBase}
                            onChange={(e) => updateField('bhxhBase', e.target.value)}
                            className="flex-1 text-xs"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 text-[10px] h-8 px-2"
                            onClick={() => updateField('bhxhBase', String(netSalary))}
                            disabled={netSalary <= 0}
                          >
                            Đóng full
                          </Button>
                        </div>
                      </div>
                      {Number(formData.basicSalary) > 0 && (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between px-2.5 py-1 bg-neutral-50 rounded-lg">
                            <span className="text-neutral-500">BHXH (8%)</span>
                            <span className="font-semibold text-neutral-800">{Math.round(insurance.bhxh).toLocaleString('vi-VN')} VNĐ</span>
                          </div>
                          <div className="flex items-center justify-between px-2.5 py-1 bg-neutral-50 rounded-lg">
                            <span className="text-neutral-500">BHYT (1.5%)</span>
                            <span className="font-semibold text-neutral-800">{Math.round(insurance.bhyt).toLocaleString('vi-VN')} VNĐ</span>
                          </div>
                          <div className="flex items-center justify-between px-2.5 py-1 bg-neutral-50 rounded-lg">
                            <span className="text-neutral-500">BHTN (1%)</span>
                            <span className="font-semibold text-neutral-800">{Math.round(insurance.bhtn).toLocaleString('vi-VN')} VNĐ</span>
                          </div>
                          <div className="flex items-center justify-between px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg font-semibold text-green-800">
                            <span>Thực nhận (Net - BH)</span>
                            <span>{Math.round(salaryAfterInsurance).toLocaleString('vi-VN')} VNĐ</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: AI button + Placeholders + Editor */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium flex items-center gap-2">
                  <FileText size={15} className="text-primary-500" />
                  Nội dung hợp đồng
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={() => {
                      if (!formData.content) {
                        toast.error('Vui lòng nhập nội dung trước khi lưu')
                        return
                      }
                      const typeLabel = CONTRACT_TYPES.find(t => t.value === formData.type)?.label || ''
                      setTemplateName(typeLabel)
                      setSaveModalOpen(true)
                    }}
                  >
                    <Save size={15} />
                    Lưu mẫu
                  </Button>
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
              </div>

              {/* Placeholders Quick Insert Panel */}
              <div className="space-y-2 bg-neutral-50/50 p-4 rounded-xl border border-border">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Chèn nhanh mẫu liên kết (Click để đưa vào hợp đồng):</p>
                <div className="flex flex-wrap gap-1.5">
                  {PLACEHOLDER_PATTERNS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => insertPlaceholder(p.key, p.label)}
                      className="px-2.5 py-1 text-xs bg-white border border-border rounded-lg text-neutral-600 hover:text-primary-700 hover:border-primary-300 hover:bg-primary-50 transition-all font-medium shadow-sm"
                    >
                      {`{${p.label}}`}
                    </button>
                  ))}
                </div>
              </div>

              <TiptapEditor
                ref={editorRef}
                value={formData.content}
                onChange={(html) => updateField('content', html)}
                placeholder="Nhập nội dung hợp đồng..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      <AppModal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} title="Lưu mẫu hợp đồng" description="Đặt tên cho mẫu hợp đồng này để sử dụng sau" maxWidth="sm">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tên mẫu</Label>
            <Input
              placeholder="VD: Hợp đồng thử việc mới"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setSaveModalOpen(false)}>Hủy</Button>
            <Button
              size="sm"
              onClick={() => {
                if (!templateName.trim()) {
                  toast.error('Vui lòng nhập tên mẫu')
                  return
                }
                addTemplate.mutate({ name: templateName.trim(), type: formData.type, content: formData.content })
                setSaveModalOpen(false)
              }}
            >
              Lưu
            </Button>
          </div>
        </div>
      </AppModal>

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
