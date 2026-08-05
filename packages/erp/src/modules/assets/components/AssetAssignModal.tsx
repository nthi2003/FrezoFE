// ============================================================
// AssetAssignModal — Tạo YÊU CẦU cấp phát tài sản (ticket workflow)
// ------------------------------------------------------------
// Không assign trực tiếp — tạo ticket PENDING, phải qua duyệt +
// xác nhận bàn giao. Preview steps lấy từ WF definition (ASSET /
// ASSET_TRANSFER*) — không hardcode "Admin / HR".
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { Loader2, AlertCircle, ClipboardCheck, ExternalLink } from 'lucide-react'
import { FormModal, Select, ConfirmDialog } from '@frezo/ui'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { usePersonsCombobox } from '@/modules/qlns/hooks/usePerson'
import {
  useWorkflowDefinitionByCode,
  useWorkflowDefinitions,
} from '@/modules/workflow/hooks/useWorkflow'
import type { ApproverType, WorkflowDefinition, WorkflowStep } from '@/modules/workflow/services/workflowApi'
import { useCreateTransferRequest } from '../hooks/useTransferRequest'
import type { AssetItem } from '../services/assetApi'
import { getCategoryIcon } from '../constants/assetMeta'
import { WorkflowStepper, type WorkflowStepItem } from '@/components/workflow/WorkflowStepper'

const DEFAULT_TRANSFER_CODE = 'ASSET_TRANSFER_DEFAULT'

interface Props {
  open: boolean
  asset: AssetItem | null
  onClose: () => void
}

export function AssetAssignModal({ open, asset, onClose }: Props) {
  const [personId, setPersonId] = useState('')
  const [reason, setReason] = useState('')
  const [plannedDate, setPlannedDate] = useState<string>('')
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false)

  const { options: personOptions, isLoading: personsLoading } = usePersonsCombobox()
  const createReq = useCreateTransferRequest()

  // Path A: load WF definition — ưu tiên by-code, fallback list module ASSET
  const { data: byCode, isLoading: byCodeLoading } = useWorkflowDefinitionByCode(
    open ? DEFAULT_TRANSFER_CODE : undefined,
  )
  const { data: assetDefs = [], isLoading: defsLoading } = useWorkflowDefinitions('ASSET', open)

  const transferDef = useMemo(
    () => pickAssetTransferDefinition(byCode, assetDefs),
    [byCode, assetDefs],
  )
  const defsReady = !byCodeLoading && !defsLoading

  useEffect(() => {
    if (!open) return
    setPersonId('')
    setReason('')
    setPlannedDate(todayIso())
  }, [open])

  const personName = useMemo(
    () => personOptions.find((p) => p.value === personId)?.label,
    [personId, personOptions],
  )

  const previewSteps = useMemo(
    () => buildPreviewSteps(transferDef?.steps, personName),
    [transferDef, personName],
  )

  const approverBanner = useMemo(() => formatApproverBanner(transferDef), [transferDef])

  const canSubmit = !!personId && !createReq.isPending

  const handleSubmit = () => {
    if (!asset || !canSubmit) {
      toast.warning('Vui lòng chọn nhân viên')
      return
    }
    setSubmitConfirmOpen(true)
  }

  const runSubmit = () => {
    if (!asset || !personId) return
    createReq.mutate(
      {
        assetId: asset.id,
        data: {
          requestType: 'ASSIGN',
          personId,
          personName,
          reason: reason.trim() || undefined,
          plannedDate: plannedDate || undefined,
        },
      },
      {
        onSuccess: () => {
          setSubmitConfirmOpen(false)
          onClose()
        },
      },
    )
  }

  if (!asset) return null
  const Icon = getCategoryIcon(asset.categoryCode)

  return (
    <>
    <FormModal
      isOpen={open}
      onClose={onClose}
      title="Tạo yêu cầu cấp phát tài sản"
      size="md"
      onSubmit={handleSubmit}
      isSubmitting={createReq.isPending}
      submitDisabled={!canSubmit}
      submitText="Gửi yêu cầu"
    >
      <div className="space-y-4">
        {/* Asset preview */}
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 shrink-0">
            <Icon size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-mono text-neutral-500">{asset.code}</div>
            <div className="font-semibold text-neutral-900 truncate">{asset.name}</div>
            {asset.brand && <div className="text-xs text-neutral-500">{asset.brand} · {asset.model}</div>}
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
              Cấp phát cho <span className="text-rose-500">*</span>
            </label>
            <Select
              options={personOptions}
              value={personId}
              onChange={setPersonId}
              placeholder={personsLoading ? 'Đang tải nhân viên…' : '— Chọn nhân viên —'}
              showSearch
              showClear
            />
            {personsLoading && (
              <div className="text-[11px] text-neutral-500 mt-1 inline-flex items-center gap-1">
                <Loader2 size={11} className="animate-spin" /> Đang tải danh sách nhân viên...
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-1.5">Ngày dự kiến bàn giao</label>
            <input
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
            Lý do cấp phát <span className="text-neutral-400 font-normal">(khuyến nghị để người duyệt hiểu context)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="VD: Nhân viên mới onboard vị trí Backend Developer, cần laptop phát triển từ tuần sau"
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
          />
        </div>

        {/* Workflow preview — từ definition, không hardcode Admin/HR */}
        <div className="rounded-lg border border-primary-100 bg-primary-50/40 p-3 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-primary-700 flex items-center gap-1">
            <ClipboardCheck size={11} /> Luồng xét duyệt
            {transferDef?.code && (
              <span className="ml-auto font-mono font-medium normal-case tracking-normal text-primary-600/80">
                {transferDef.code}
              </span>
            )}
          </div>

          {!defsReady ? (
            <div className="text-[11px] text-neutral-500 inline-flex items-center gap-1.5 py-2">
              <Loader2 size={12} className="animate-spin" /> Đang tải quy trình duyệt...
            </div>
          ) : (
            <>
              {approverBanner && (
                <div className="text-[11px] text-primary-900/80 bg-white/70 border border-primary-100 rounded-md px-2.5 py-1.5 leading-relaxed">
                  {approverBanner}
                </div>
              )}
              <WorkflowStepper steps={previewSteps} currentIndex={0} />
              <div className="text-[11px] text-neutral-600 leading-relaxed">
                Sau khi gửi, yêu cầu ở trạng thái <b>Chờ duyệt</b>. Người duyệt theo cấu hình quy trình;
                chỉ khi đủ bước và <b>xác nhận bàn giao</b>, tài sản mới chuyển <b>Đang dùng</b>.
                {' '}
                <Link
                  to="/approval/flows?tab=templates"
                  className="inline-flex items-center gap-0.5 text-primary-700 hover:text-primary-900 font-medium"
                >
                  Cấu hình tại Luồng duyệt → Mẫu quy trình <ExternalLink size={10} />
                </Link>
              </div>
            </>
          )}
        </div>

        {!personId && (
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 inline-flex items-start gap-1.5">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            Trong khi ticket chờ duyệt, tài sản vẫn ở trạng thái <b>Sẵn sàng</b> và không thể tạo ticket khác cho cùng tài sản.
          </div>
        )}
      </div>
    </FormModal>

    <ConfirmDialog
      isOpen={submitConfirmOpen}
      onClose={() => {
        if (!createReq.isPending) setSubmitConfirmOpen(false)
      }}
      onConfirm={runSubmit}
      title="Gửi yêu cầu cấp phát?"
      description={
        <span>
          Tài sản <strong>{asset.code}</strong> sẽ tạo ticket cấp phát cho{' '}
          <strong>{personName || 'nhân viên đã chọn'}</strong>. Cần duyệt trước khi bàn giao.
        </span>
      }
      confirmText="Gửi yêu cầu"
      cancelText="Huỷ"
      variant="warning"
      isLoading={createReq.isPending}
    />
    </>
  )
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function pickAssetTransferDefinition(
  byCode: WorkflowDefinition | undefined,
  defs: WorkflowDefinition[],
): WorkflowDefinition | undefined {
  if (byCode?.steps?.length) return byCode
  const active = defs.filter((d) => d.active !== false)
  return (
    active.find((d) => d.code === DEFAULT_TRANSFER_CODE) ||
    active.find((d) => /ASSET_TRANSFER/i.test(d.code || '')) ||
    active.find((d) => (d.steps || []).length > 0) ||
    defs.find((d) => /ASSET_TRANSFER/i.test(d.code || '')) ||
    defs[0]
  )
}

function describeApprover(type: ApproverType | string, value?: string | null): string {
  if (type === 'USER') return value?.trim() || 'Người cụ thể'
  if (type === 'ROLE') return value?.trim() ? `Role: ${value}` : 'Role'
  if (type === 'MANAGER') return 'Quản lý'
  if (type === 'ADMIN') return 'Admin'
  return String(type)
}

function buildPreviewSteps(
  wfSteps: WorkflowStep[] | undefined,
  personName?: string,
): WorkflowStepItem[] {
  const head: WorkflowStepItem = { label: 'Gửi yêu cầu', actor: 'Bạn' }
  if (wfSteps && wfSteps.length > 0) {
    return [
      head,
      ...wfSteps.map((s) => ({
        label: s.stepName,
        actor: describeApprover(s.approverType, s.approverValue),
      })),
    ]
  }
  // Fallback nhẹ khi chưa cấu hình WF — không ghi "Admin / HR"
  return [
    head,
    { label: 'Duyệt', actor: 'Theo workflow' },
    { label: 'Bàn giao', actor: personName || 'Nhân viên' },
  ]
}

function formatApproverBanner(def?: WorkflowDefinition): string | null {
  if (!def?.steps?.length) {
    return 'Chưa tìm thấy quy trình ASSET đang bật — cấu hình quy trình duyệt (module ASSET) trước khi gửi.'
  }
  const actors = def.steps.map((s) => {
    const who = describeApprover(s.approverType, s.approverValue)
    return `${s.stepName} (${who})`
  })
  const name = def.name || def.code
  return `Người duyệt theo 「${name}」: ${actors.join(' → ')}.`
}
