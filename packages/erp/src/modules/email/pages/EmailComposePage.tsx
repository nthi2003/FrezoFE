import { useState, useMemo, useCallback, useRef } from 'react'
import { Send, FileText, Users, Mail, ArrowRight, Check, ChevronLeft, ChevronRight, HelpCircle, X, Search, UserCheck } from 'lucide-react'
import { Button } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { Label } from '@frezo/ui'
import { TiptapEditor } from '@/components/shared/TiptapEditor'
import { useEmailTemplates, useEmailGroups } from '../hooks/useEmail'
import { useMutation, useQuery } from '@tanstack/react-query'
import axiosClient from '@/lib/axios/axiosClient'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import type { ApiResponse } from '@frezo/types'

type Step = 'compose' | 'review'

export function EmailComposePage() {
  const user = useAuthStore(s => s.user)

  const [step, setStep] = useState<Step>('compose')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipients, setRecipients] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [personKeyword, setPersonKeyword] = useState('')
  const [personOpen, setPersonOpen] = useState(false)
  const personRef = useRef<HTMLDivElement>(null)

  const { data: persons } = useQuery({
    queryKey: ['persons-combobox', personKeyword],
    queryFn: () =>
      axiosClient.get<ApiResponse<any[]>>('/qlns/person/combobox', {
        params: { keyword: personKeyword, activated: true, pageSize: 20 },
      }).then(r => r.data?.data ?? []),
    enabled: personKeyword.length >= 1,
  })

  const addPersonEmail = (email: string) => {
    const existing = recipients.split(',').map(s => s.trim()).filter(Boolean)
    if (!existing.includes(email)) {
      setRecipients([...existing, email].join(', '))
    }
    setPersonKeyword('')
    setPersonOpen(false)
  }

  const { data: templates, isLoading: templatesLoading } = useEmailTemplates()
  const { data: groups } = useEmailGroups()

  const filteredTemplates = useMemo(() => {
    if (!templates) return []
    if (!searchTerm) return templates
    const s = searchTerm.toLowerCase()
    return templates.filter((t: any) =>
      t.name?.toLowerCase().includes(s) || t.subject?.toLowerCase().includes(s)
    )
  }, [templates, searchTerm])

  const selectedTemplate = useMemo(() => {
    if (!templates || !selectedTemplateId) return null
    return templates.find((t: any) => t.id === selectedTemplateId) ?? null
  }, [templates, selectedTemplateId])

  const recipientEmails = useMemo(() => {
    return recipients.split(',').map(s => s.trim()).filter(Boolean)
  }, [recipients])

  const groupEmails = useMemo(() => {
    if (!selectedGroupId || !groups) return []
    const g = groups.find((g: any) => g.id === selectedGroupId)
    return g?.emails ?? []
  }, [selectedGroupId, groups])

  const allRecipients = useMemo(() => {
    const fromInput = recipientEmails
    const fromGroup = groupEmails
    return [...new Set([...fromInput, ...fromGroup])]
  }, [recipientEmails, groupEmails])

  const selectTemplate = useCallback((t: any) => {
    setSelectedTemplateId(t.id)
    setSubject(t.subject || '')
    setBody(t.content || '')
  }, [])

  const sendMutation = useMutation({
    mutationFn: (data: any) =>
      axiosClient.post<ApiResponse<any>>('/email/send/bulk', data).then(r => r.data),
    onSuccess: () => {
      toast.success('Gửi email thành công')
      setStep('compose')
      setSelectedTemplateId(null)
      setSubject('')
      setBody('')
      setRecipients('')
      setSelectedGroupId(null)
    },
    onError: () => toast.error('Gửi email thất bại'),
  })

  const handleSend = () => {
    if (allRecipients.length === 0) return
    sendMutation.mutate({
      templateCode: selectedTemplate?.code || null,
      subject,
      body,
      recipients: allRecipients,
      description: `Gửi bởi ${user?.fullName || user?.username || 'unknown'}`,
    })
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${step === 'compose' ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-400'}`}>
            1. Soạn thảo
          </span>
          <ChevronRight size={14} className="text-neutral-300" />
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${step === 'review' ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-400'}`}>
            2. Kiểm tra & Gửi
          </span>
        </div>
      </div>

      {step === 'compose' && (
        <div className="grid grid-cols-[320px_1fr] gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
                <FileText size={15} /> Mẫu email
              </h2>
              <button type="button" onClick={() => {
                const el = document.getElementById('email-compose-help')
                if (el) el.classList.toggle('hidden')
              }} className="text-neutral-400 hover:text-primary-600 transition-colors" title="Hướng dẫn">
                <HelpCircle size={14} />
              </button>
            </div>
            <div id="email-compose-help" className="hidden p-2.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800 space-y-1">
              <p className="font-medium">Hướng dẫn:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Chọn mẫu email bên trái</li>
                <li>Chỉnh sửa nội dung ở editor</li>
                <li>Nhập email người nhận hoặc chọn nhóm</li>
                <li>Bấm "Tiếp theo" để kiểm tra lại</li>
              </ul>
            </div>
            <Input
              placeholder="Tìm mẫu..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="text-sm"
            />
            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
              {templatesLoading ? (
                <div className="text-center py-8 text-xs text-neutral-400">Đang tải...</div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-400">Không có mẫu email</div>
              ) : filteredTemplates.map((t: any) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTemplate(t)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedTemplateId === t.id ? 'border-primary-400 bg-primary-50' : 'border-border hover:border-primary-200 hover:bg-neutral-50'}`}
                >
                  <div className="text-sm font-medium text-neutral-800 truncate">{t.name}</div>
                  <div className="text-[11px] text-neutral-400 truncate mt-0.5">{t.subject}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {selectedTemplate && (
              <div className="flex items-center gap-2 text-xs text-primary-600 bg-primary-50 px-3 py-1.5 rounded-md">
                <FileText size={13} />
                Đã chọn: <strong>{selectedTemplate.name}</strong>
                <button type="button" onClick={() => { setSelectedTemplateId(null); setSubject(''); setBody('') }}
                  className="ml-auto text-neutral-400 hover:text-red-500"><X size={13} /></button>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Tiêu đề</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Tiêu đề email" />
            </div>
            <div className="space-y-1.5">
              <Label>Nội dung</Label>
              <TiptapEditor value={body} onChange={setBody} placeholder="Nội dung email..." />
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Người nhận</Label>
                  <span className="text-xs text-neutral-400">{allRecipients.length} người</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {allRecipients.map((email, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
                      <Mail size={11} />
                      {email}
                      <button type="button" onClick={() => {
                        const list = recipients.split(',').map(s => s.trim()).filter(Boolean)
                        list.splice(list.indexOf(email), 1)
                        setRecipients(list.join(', '))
                      }} className="text-primary-400 hover:text-red-500"><X size={11} /></button>
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
                  <div className="space-y-1">
                    <Input
                      value={recipients}
                      onChange={e => setRecipients(e.target.value)}
                      placeholder="Nhập email, cách nhau bằng dấu phẩy"
                      disabled={!!selectedGroupId}
                      className="text-sm"
                    />
                  </div>

                  <div className="flex items-center text-xs text-neutral-300 pt-2">hoặc</div>

                  <div className="relative" ref={personRef}>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <Input
                        value={personKeyword}
                        onChange={e => { setPersonKeyword(e.target.value); setPersonOpen(true) }}
                        onFocus={() => setPersonOpen(true)}
                        placeholder="Tìm nhân sự..."
                        className="text-sm pl-9"
                      />
                    </div>
                    {personOpen && personKeyword.length >= 1 && (
                      <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {!persons || persons.length === 0 ? (
                          <div className="p-3 text-xs text-neutral-400 text-center">Không tìm thấy</div>
                        ) : persons.map((p: any) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => addPersonEmail(p.description?.split(' - ')[1] || '')}
                            className="w-full text-left px-3 py-2.5 hover:bg-primary-50 border-b border-border last:border-0 transition-colors"
                          >
                            <div className="text-sm font-medium text-neutral-800">{p.label}</div>
                            <div className="text-xs text-neutral-400">{p.description}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Label className="text-xs text-neutral-500">Hoặc chọn nhóm email</Label>
                  <select
                    value={selectedGroupId ?? ''}
                    onChange={e => { setSelectedGroupId(e.target.value || null); if (e.target.value) setRecipients('') }}
                    className="w-full h-9 border border-border rounded-md px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 mt-1"
                  >
                    <option value="">-- Chọn nhóm --</option>
                    {groups?.map((g: any) => (
                      <option key={g.id} value={g.id}>{g.name} ({g.emails?.length ?? 0} email)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep('review')}
                  disabled={allRecipients.length === 0}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  Tiếp theo <ArrowRight size={15} className="ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Check size={20} className="text-green-500" /> Kiểm tra trước khi gửi
            </h2>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-neutral-400">Mẫu email</Label>
                <p className="text-sm font-medium">{selectedTemplate?.name || '(Không dùng mẫu)'}</p>
              </div>
              <div>
                <Label className="text-xs text-neutral-400">Tiêu đề</Label>
                <p className="text-sm">{subject || '(Trống)'}</p>
              </div>
              <div>
                <Label className="text-xs text-neutral-400">Nội dung</Label>
                <div className="mt-1 p-3 bg-neutral-50 rounded border text-sm prose prose-sm max-w-none max-h-60 overflow-y-auto" dangerouslySetInnerHTML={{ __html: body }} />
              </div>
              <div>
                <Label className="text-xs text-neutral-400">
                  Người nhận <span className="text-neutral-300">({allRecipients.length} người)</span>
                </Label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {allRecipients.map((email, i) => (
                    <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                      {email}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('compose')}>
              <ChevronLeft size={15} className="mr-1.5" /> Quay lại
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendMutation.isPending || allRecipients.length === 0}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Send size={15} className="mr-1.5" />
              {sendMutation.isPending ? 'Đang gửi...' : `Gửi đến ${allRecipients.length} người`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}