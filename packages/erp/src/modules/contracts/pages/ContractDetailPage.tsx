// ============================================================
// ContractDetailPage — Object Page chi tiết HĐ (FE-1 / BA_CONTRACT_DETAIL_AC)
// Route: /qlns/contract/:id — KHÔNG modal
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle, ArrowLeft, CheckCircle, FileText, FileX2, Pencil,
} from 'lucide-react'
import {
  Button, EmptyState, ErrorState, ObjectPageHeader, Skeleton, StatusBadge, AppModal,
} from '@frezo/ui'
import { formatCurrency, formatDate } from '@frezo/utils'
import { toast } from 'sonner'
import { contractApi } from '@/modules/qlns/services/contractApi'
import { personApi } from '@/modules/qlns/services/personApi'
import { unwrapList } from '@frezo/utils'
import { AppForm } from '@/components/shared/AppForm'
import { contractRejectSchema } from '@/modules/qlns/constants/schema'
import { CONTRACT_STATUS_CONFIG, type ContractStatus } from '../constants/contractStatus'
import { CONTRACT_TYPES } from '../constants/templates'

function pickHtml(c: any): string {
  return (c?.htmlContract ?? c?.HtmlContract ?? '').toString().trim()
}

function sanitizeHtml(html: string): string {
  // Strip script/iframe/event handlers — đủ cho viewer nội bộ (không thêm dep DOMPurify)
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
}

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [rejectOpen, setRejectOpen] = useState(false)

  const {
    data: contract,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractApi.getById(id!),
    enabled: !!id,
    select: (res: any) => res?.data ?? res,
  })

  const { data: personOptions } = useQuery({
    queryKey: ['persons-combobox'],
    queryFn: () => personApi.getCombobox(),
    select: unwrapList,
  })

  const personName = useMemo(() => {
    if (!contract) return '—'
    if (contract.personName) return contract.personName
    const list = (personOptions || []) as any[]
    const hit = list.find((p) => (p.value || p.id) === contract.personId)
    return hit?.label || hit?.name || '—'
  }, [contract, personOptions])

  const approveContract = useMutation({
    mutationFn: () => contractApi.updateStatus(id!, { status: 'ACTIVE' }),
    onSuccess: () => {
      toast.success('Đã phê duyệt Hợp đồng — chuyển sang hiệu lực')
      queryClient.invalidateQueries({ queryKey: ['contract', id] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
    onError: () => toast.error('Duyệt thất bại'),
  })

  const rejectContract = useMutation({
    mutationFn: (data: any) => contractApi.reject(id!, data),
    onSuccess: () => {
      toast.success('Đã từ chối Hợp đồng')
      setRejectOpen(false)
      queryClient.invalidateQueries({ queryKey: ['contract', id] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })

  if (!id) {
    return (
      <div className="p-6">
        <EmptyState icon={FileText} title="Thiếu mã hợp đồng" description="URL phải có /qlns/contract/:id" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-surface border-b border-neutral-200 px-6 py-4 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-56" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>
        <div className="p-6 space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Không tải được hợp đồng"
          message="Lỗi mạng hoặc máy chủ. Thử lại hoặc quay về danh sách."
          onRetry={() => refetch()}
        />
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate('/qlns/contract')} className="gap-2">
            <ArrowLeft size={16} /> Danh sách HĐ
          </Button>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="p-6">
        <EmptyState
          icon={FileText}
          title="Không tìm thấy hợp đồng"
          description="HĐ có thể đã xoá hoặc bạn không có quyền xem."
          action={
            <Button variant="outline" onClick={() => navigate('/qlns/contract')}>
              Về danh sách
            </Button>
          }
        />
      </div>
    )
  }

  const statusRaw = (contract.status || contract.Status || 'DRAFT') as ContractStatus
  const statusCfg = CONTRACT_STATUS_CONFIG[statusRaw] || CONTRACT_STATUS_CONFIG.DRAFT
  const typeLabel =
    CONTRACT_TYPES.find((t) => t.value === contract.type || t.value === contract.typeContractId)?.label
    || contract.type
    || contract.typeContractId
    || '—'
  const html = pickHtml(contract)
  const activated = contract.activated === true
  const isDraft = statusRaw === 'DRAFT'
  const canApprove = statusRaw === 'PENDING_APPROVAL' || statusRaw === 'DRAFT'
  const effFrom = contract.effFrom ?? contract.startDate
  const effTo = contract.effTo ?? contract.endDate
  const value = contract.value ?? contract.basicSalary

  return (
    <div className="min-h-full bg-neutral-50/40">
      <ObjectPageHeader
        breadcrumb={[
          { label: 'Hợp đồng', onClick: () => navigate('/qlns/contract') },
          { label: contract.code || id },
        ]}
        title={contract.code || 'Chi tiết HĐ'}
        subtitle={`${typeLabel} — ${personName}`}
        statusBadge={<StatusBadge label={statusCfg.label} color={statusCfg.color} icon={statusCfg.icon} />}
        kpi={[
          { label: 'Hiệu lực từ', value: formatDate(effFrom) || '—' },
          { label: 'Hiệu lực đến', value: formatDate(effTo) || '—' },
          {
            label: 'Giá trị HĐ',
            value: value != null && value !== '' ? formatCurrency(Number(value)) : '—',
          },
          { label: 'Vị trí', value: contract.jobPosition || '—' },
          { label: 'Kích hoạt', value: activated ? 'Đã kích hoạt' : 'Chưa kích hoạt' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/qlns/contract')} className="gap-1.5">
              <ArrowLeft size={15} /> Danh sách
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => navigate('/qlns/contract/create')}
            >
              <Pencil size={15} /> Soạn / tạo mới
            </Button>
            {canApprove && (
              <>
                <Button
                  variant="outline"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5"
                  onClick={() => setRejectOpen(true)}
                >
                  <FileX2 size={15} /> Từ chối
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  disabled={approveContract.isPending}
                  onClick={() => approveContract.mutate()}
                >
                  <CheckCircle size={15} /> Duyệt
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="p-4 md:p-6 space-y-4 max-w-5xl">
        {/* AC-4 banners */}
        {isDraft && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" />
            <div>
              <div className="font-semibold">Hợp đồng đang ở trạng thái Nháp (DRAFT)</div>
              <div className="text-amber-800/80 text-xs mt-0.5">
                Chưa gửi duyệt / chưa có hiệu lực. Kiểm tra nội dung trước khi duyệt.
              </div>
            </div>
          </div>
        )}
        {!activated && !isDraft && (
          <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-orange-600" />
            <div>
              <div className="font-semibold">Hợp đồng chưa kích hoạt</div>
              <div className="text-orange-800/80 text-xs mt-0.5">
                Trường <code className="text-[11px]">activated</code> = false — phân biệt với trạng thái DRAFT.
              </div>
            </div>
          </div>
        )}

        {/* Meta */}
        <section className="rounded-xl border border-neutral-200 bg-white p-4 md:p-5">
          <h2 className="text-sm font-semibold text-neutral-800 mb-3">Thông tin chung</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm">
            <Meta label="Nhân sự" value={personName} />
            <Meta label="Loại HĐ" value={typeLabel} />
            <Meta label="Hiệu lực từ (effFrom)" value={formatDate(effFrom) || '—'} />
            <Meta label="Hiệu lực đến (effTo)" value={formatDate(effTo) || '—'} />
            <Meta
              label="Giá trị (value)"
              value={value != null && value !== '' ? formatCurrency(Number(value)) : '—'}
            />
            <Meta label="Công ty (Bên A)" value={contract.employerName || '—'} />
            <Meta label="Địa điểm làm việc" value={contract.workLocation || '—'} />
            <Meta label="Thử việc (ngày)" value={contract.probationDays ?? '—'} />
          </div>
          {contract.rejectReason && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
              <div className="text-xs font-semibold text-rose-700 mb-1 uppercase tracking-wider">
                Lý do từ chối
              </div>
              <div className="text-sm text-rose-900">{contract.rejectReason}</div>
            </div>
          )}
        </section>

        {/* AC-2 htmlContract viewer */}
        <section className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <div className="px-4 md:px-5 py-3 border-b border-neutral-100 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-neutral-800 inline-flex items-center gap-2">
              <FileText size={15} /> Nội dung hợp đồng
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate('/qlns/contract/create')}
            >
              <Pencil size={13} /> Sửa nội dung
            </Button>
          </div>
          {html ? (
            <div
              className="prose prose-sm max-w-none p-4 md:p-6 text-neutral-800 leading-relaxed overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
            />
          ) : (
            <div className="p-6">
              <EmptyState
                icon={FileText}
                title="Chưa có nội dung HTML"
                description="Hợp đồng chưa lưu htmlContract. Soạn nội dung từ màn tạo hợp đồng."
                action={
                  <Button onClick={() => navigate('/qlns/contract/create')} className="gap-1.5">
                    <Pencil size={14} /> Soạn hợp đồng
                  </Button>
                }
              />
            </div>
          )}
        </section>
      </div>

      <AppModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Từ chối Hợp đồng"
        description={contract.code ? `HĐ ${contract.code} — ${personName}` : undefined}
      >
        <AppForm
          schema={contractRejectSchema}
          defaultValues={{ reason: '' }}
          onSubmit={(values: any) => rejectContract.mutate(values)}
          fields={[
            {
              name: 'reason',
              label: 'Lý do từ chối',
              placeholder: 'Nhập lý do rõ ràng để nhân sự biết cần chỉnh sửa gì...',
            },
          ]}
          submitText="Xác nhận từ chối"
          isLoading={rejectContract.isPending}
        />
      </AppModal>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">{label}</div>
      <div className="text-neutral-800 font-medium mt-0.5">{value}</div>
    </div>
  )
}
