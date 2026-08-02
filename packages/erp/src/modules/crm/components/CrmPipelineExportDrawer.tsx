import { useMemo, useState } from 'react'
import { Label, Select } from '@frezo/ui'
import { formatCurrency, formatDate } from '@frezo/utils'
import { toast } from 'sonner'
import { FilterExportDrawer } from '@/components/shared/FilterExportDrawer'
import { downloadCsv, type CsvColumn } from '@/lib/export'
import { useCustomers } from '@/modules/customers/hooks/useCustomer'
import {
  useDealsByPipeline,
  usePipelineStages,
  usePipelines,
} from '../hooks/useCrm'
import type { Deal, Pipeline, Stage } from '../services/crmApi'

type Props = {
  isOpen: boolean
  onClose: () => void
}

const EXPORT_COLUMNS: CsvColumn<Deal & { stageName?: string; customerLabel?: string }>[] = [
  { header: 'Tiêu đề', accessor: (d) => d.title },
  { header: 'Khách hàng', accessor: (d) => d.customerLabel || d.customerName || '' },
  { header: 'Giai đoạn', accessor: (d) => d.stageName || '' },
  { header: 'Giá trị', accessor: (d) => formatCurrency(d.amount || 0) },
  { header: 'Trạng thái', accessor: (d) => d.status },
  { header: 'Ngày chốt dự kiến', accessor: (d) => (d.expectedCloseDate ? formatDate(d.expectedCloseDate) : '') },
]

export function CrmPipelineExportDrawer({ isOpen, onClose }: Props) {
  const { data: pipelines } = usePipelines({ enabled: isOpen })
  const pipelineList = useMemo(
    () => ((pipelines as Pipeline[] | undefined) ?? []),
    [pipelines],
  )
  const [pipelineId, setPipelineId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'WON' | 'LOST'>('ALL')

  const activePipelineId = pipelineId || pipelineList.find((p) => p.isDefault)?.id || pipelineList[0]?.id

  const { data: stages } = usePipelineStages(activePipelineId)
  const stageList = useMemo(
    () => ((stages as Stage[] | undefined) ?? []),
    [stages],
  )
  const stageNameById = useMemo(() => {
    const m = new Map<string, string>()
    stageList.forEach((s) => m.set(s.id, s.name))
    return m
  }, [stageList])

  const { data: customersRaw } = useCustomers()
  const customerNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of (customersRaw as { id: string; name?: string }[] | undefined) ?? []) {
      m.set(c.id, c.name?.trim() || c.id)
    }
    return m
  }, [customersRaw])

  const { data: deals } = useDealsByPipeline(activePipelineId)
  const dealList = useMemo(() => ((deals as Deal[] | undefined) ?? []), [deals])

  const filtered = useMemo(() => {
    let rows = dealList.map((d) => ({
      ...d,
      stageName: stageNameById.get(d.stageId),
      customerLabel: d.customerId ? customerNameById.get(d.customerId) : d.customerName,
    }))
    if (statusFilter !== 'ALL') rows = rows.filter((d) => d.status === statusFilter)
    return rows
  }, [dealList, stageNameById, customerNameById, statusFilter])

  const hasFilter = statusFilter !== 'ALL' || (!!pipelineId && pipelineList.length > 1)
  const activeFilterCount = (statusFilter !== 'ALL' ? 1 : 0) + (pipelineId && pipelineList.length > 1 ? 1 : 0)

  const pipelineOptions = useMemo(
    () => pipelineList.map((p) => ({ value: p.id, label: p.name })),
    [pipelineList],
  )

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error('Không có cơ hội để xuất')
      return
    }
    const pipelineName = pipelineList.find((p) => p.id === activePipelineId)?.name || 'pipeline'
    downloadCsv(`co-hoi-ban-${pipelineName}`, filtered, EXPORT_COLUMNS)
    toast.success(`Đã xuất ${filtered.length} cơ hội ra CSV`)
  }

  return (
    <FilterExportDrawer
      isOpen={isOpen}
      onClose={onClose}
      hasActiveFilters={hasFilter}
      onClear={() => {
        setStatusFilter('ALL')
        setPipelineId('')
      }}
      onExport={handleExport}
      exportDisabled={filtered.length === 0}
      exportTooltip="Xuất pipeline / deals CSV nâng cao"
      description="Lọc phễu và trạng thái trước khi xuất CSV."
    >
      {pipelineList.length > 1 && (
        <div className="space-y-1.5">
          <Label htmlFor="crm-export-pipeline" className="text-xs text-neutral-500">Phễu bán hàng</Label>
          <Select
            id="crm-export-pipeline"
            options={[{ value: '', label: 'Phễu mặc định' }, ...pipelineOptions]}
            value={pipelineId}
            onChange={(v) => setPipelineId(v || '')}
            placeholder="Chọn phễu…"
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="crm-export-status" className="text-xs text-neutral-500">Trạng thái deal</Label>
        <Select
          id="crm-export-status"
          options={[
            { value: 'ALL', label: 'Tất cả' },
            { value: 'OPEN', label: 'Đang mở' },
            { value: 'WON', label: 'Đã thắng' },
            { value: 'LOST', label: 'Đã thua' },
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter((v || 'ALL') as typeof statusFilter)}
        />
      </div>
      <p className="text-xs text-neutral-500 tabular-nums">
        {filtered.length} cơ hội khớp bộ lọc
        {activeFilterCount > 0 ? ` · ${activeFilterCount} bộ lọc đang bật` : ''}
      </p>
    </FilterExportDrawer>
  )
}
