import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search, Send, Landmark, DollarSign, MessageSquare, FileText, Plus, Trash2,
  Download, FileSpreadsheet, ChevronDown, Printer,
} from 'lucide-react'
import {
  Button, PageHeader, AppModal, ConfirmDialog, PageGuideButton,
  EmptyState, ErrorState, Select, Label, VndInput, AppTooltip, IconActionButton,
} from '@frezo/ui'
import { formatCurrency, formatDate, parseVndInput } from '@frezo/utils'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { useAnyPermission } from '@/lib/hooks/usePermission'
import { useAuthStore } from '@/stores/authStore'
import { useCustomers } from '@/modules/customers/hooks/useCustomer'
import { useProducts } from '@/modules/products/hooks/useProduct'
import { useCategories } from '@/modules/qtht/hooks/useCategory'
import {
  useInvoices, useCreateInvoice, useIssueInvoice, usePostInvoiceToGL, useRecordPayment,
} from '../hooks/useCrm'
import type { Invoice, InvoiceItem, InvoiceStatus } from '../services/crmApi'
import { CommentDrawer } from '@/components/shared/CommentThread'
import { SubjectType } from '@/modules/approval/types'
import { toast } from 'sonner'
import { downloadCsv, downloadExcel, type CsvColumn } from '@/lib/export'
import { StatusPipelineStepper } from '../../warehouse/components/StatusPipelineStepper'
import { ProductCombobox } from '../../warehouse/components/ProductCombobox'
import {
  REVENUE_PIPELINE,
  revenueStepIndexForInvoices,
} from '../../accounting/constants/accountingWorkflow'
import { REVENUE_GUIDE } from '../../accounting/constants/revenue.guide'
import { pageRootClass } from '@/modules/accounting/utils/pageEmbed'
import { InvoicePrintPreviewModal } from '../components/InvoicePrintPreviewModal'

type CatalogProduct = {
  id: string
  code?: string
  name?: string
  price?: number | null
  unit?: string
}

const STATUS_TONE: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  ISSUED: 'bg-info-light text-info-dark border-info/30',
  PARTIALLY_PAID: 'bg-warning-light text-warning-dark border-warning/30',
  PAID: 'bg-success-light text-success-dark border-success/30',
  VOID: 'bg-danger-light text-danger-dark border-danger/30',
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Nháp',
  ISSUED: 'Đã phát hành',
  PARTIALLY_PAID: 'Trả một phần',
  PAID: 'Đã thanh toán',
  VOID: 'Đã huỷ',
}

type LineDraft = {
  productId: string
  productCode: string
  productName: string
  quantity: string
  unit: string
  unitPrice: string
  taxRate: string
}

type CreateForm = {
  customerId: string
  customerName: string
  issuedDate: string
  dueDate: string
  notes: string
  salespersonUsername: string
  commissionRatePercent: string
  items: LineDraft[]
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function emptyLine(): LineDraft {
  return {
    productId: '',
    productCode: '',
    productName: '',
    quantity: '1',
    unit: 'cái',
    unitPrice: '',
    taxRate: '0',
  }
}

function emptyCreateForm(customerId = '', customerName = ''): CreateForm {
  return {
    customerId,
    customerName,
    issuedDate: todayIso(),
    dueDate: '',
    notes: '',
    salespersonUsername: '',
    commissionRatePercent: '',
    items: [emptyLine()],
  }
}

function canExportInvoice(inv: Invoice) {
  return inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID' || inv.status === 'PAID'
}

const INVOICE_EXPORT_COLUMNS: CsvColumn<Invoice>[] = [
  { header: 'Mã hoá đơn', accessor: 'code' },
  { header: 'Khách hàng', accessor: (r) => r.customerName || '' },
  {
    header: 'Ngày phát hành',
    accessor: 'issuedDate',
    format: (v) => (v ? formatDate(String(v)) : ''),
  },
  {
    header: 'Hạn thanh toán',
    accessor: 'dueDate',
    format: (v) => (v ? formatDate(String(v)) : ''),
  },
  {
    header: 'Tổng',
    accessor: 'total',
    format: (v) => (typeof v === 'number' ? v : Number(v) || 0),
  },
  {
    header: 'Đã trả',
    accessor: 'paidAmount',
    format: (v) => (typeof v === 'number' ? v : Number(v) || 0),
  },
  {
    header: 'Còn lại',
    accessor: (r) => (r.total || 0) - (r.paidAmount || 0),
  },
  {
    header: 'Trạng thái',
    accessor: 'status',
    format: (v) => STATUS_LABEL[v as InvoiceStatus] || String(v ?? ''),
  },
  {
    header: 'Đã hạch toán',
    accessor: (r) => (r.glJournalEntryId ? 'Có' : 'Không'),
  },
  { header: 'Ghi chú', accessor: (r) => r.notes || '' },
]

export function InvoicesPage({ embedded }: { embedded?: boolean } = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const authUser = useAuthStore((s) => s.user)
  const canCreate = useAnyPermission(['CRM.INVOICE.CREATE', 'CRM_INVOICE_CREATE'])
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL')
  const { data: rows, isLoading, isError, refetch, isFetching } = useInvoices(
    statusFilter === 'ALL' ? undefined : statusFilter,
  )
  const { data: customersRaw } = useCustomers()
  const { data: productsRaw } = useProducts()
  const { data: unitCategoriesRaw } = useCategories('DonVi')
  const create = useCreateInvoice()
  const issue = useIssueInvoice()
  const post = usePostInvoiceToGL()
  const pay = useRecordPayment()
  const [search, setSearch] = useState('')
  const [commentInv, setCommentInv] = useState<Invoice | null>(null)
  const [payTarget, setPayTarget] = useState<Invoice | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [postTarget, setPostTarget] = useState<Invoice | null>(null)
  const [postResult, setPostResult] = useState<{
    code: string
    journalEntryId?: string | null
    skipped?: boolean
    message?: string
  } | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateForm>(() => emptyCreateForm())
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [exportOpen, setExportOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const [printInvoiceId, setPrintInvoiceId] = useState<string | null>(null)

  const customerOptions = useMemo(() => {
    const list = (customersRaw as { id: string; name?: string }[] | undefined) ?? []
    return list.map((c) => ({
      value: c.id,
      label: c.name?.trim() || c.id,
    }))
  }, [customersRaw])

  const customerNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const o of customerOptions) map.set(o.value, o.label)
    return map
  }, [customerOptions])

  const products = useMemo(
    () => ((productsRaw as CatalogProduct[] | undefined) ?? []).filter((p) => !!p?.id),
    [productsRaw],
  )

  const productById = useMemo(() => {
    const map = new Map<string, CatalogProduct>()
    for (const p of products) map.set(p.id, p)
    return map
  }, [products])

  const unitCategories = useMemo(
    () =>
      (Array.isArray(unitCategoriesRaw) ? unitCategoriesRaw : []) as {
        code?: string
        name?: string
        shortName?: string
      }[],
    [unitCategoriesRaw],
  )

  const unitOptions = useMemo(
    () =>
      unitCategories
        .map((c) => {
          const label = c.name?.trim() || c.shortName?.trim() || c.code?.trim() || ''
          return { value: label, label }
        })
        .filter((o) => o.value),
    [unitCategories],
  )

  const resolveProductUnit = (raw?: string | null) => {
    const u = raw?.trim()
    if (!u) return undefined
    const match = unitCategories.find(
      (c) => c.code === u || c.name === u || c.shortName === u,
    )
    return match?.name?.trim() || match?.shortName?.trim() || u
  }

  const selectLineProduct = (idx: number, productId: string) => {
    const prod = productId ? productById.get(productId) : undefined
    const items = [...form.items]
    const prev = items[idx]
    const next: LineDraft = {
      ...prev,
      productId,
      productCode: prod?.code?.trim() || '',
      productName: prod?.name?.trim() || prod?.code?.trim() || '',
    }
    // Giá ăn theo catalog khi chọn SP; user vẫn sửa tay sau đó
    if (prod && prod.price != null && !Number.isNaN(Number(prod.price))) {
      next.unitPrice = String(prod.price)
    } else if (!productId) {
      next.unitPrice = ''
    }
    if (prod?.unit) {
      next.unit = resolveProductUnit(prod.unit) || prev.unit
    } else if (!productId) {
      next.unit = 'cái'
    }
    items[idx] = next
    setForm({ ...form, items })
  }

  const openCreate = (customerId = '', customerName = '') => {
    const name = customerName || (customerId ? customerNameById.get(customerId) || '' : '')
    setForm(emptyCreateForm(customerId, name))
    setFieldErrors({})
    setShowCreate(true)
  }

  const closeCreate = () => {
    setShowCreate(false)
    setFieldErrors({})
    setForm(emptyCreateForm())
  }

  // Deep-link: ?create=1&customerId= → mở form prefill (đợi auth hydrate)
  useEffect(() => {
    if (searchParams.get('create') !== '1') return
    if (!authUser) return
    if (!canCreate) {
      const next = new URLSearchParams(searchParams)
      next.delete('create')
      next.delete('customerId')
      setSearchParams(next, { replace: true })
      return
    }
    const cid = searchParams.get('customerId') || ''
    openCreate(cid)
    const next = new URLSearchParams(searchParams)
    next.delete('create')
    next.delete('customerId')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi query create / auth đổi
  }, [searchParams, canCreate, authUser])

  // Prefill tên KH khi list khách load xong sau deep-link
  useEffect(() => {
    if (!showCreate || !form.customerId || form.customerName) return
    const name = customerNameById.get(form.customerId)
    if (name) setForm((f) => ({ ...f, customerName: name }))
  }, [showCreate, form.customerId, form.customerName, customerNameById])

  // Đóng dropdown Xuất khi click ngoài / Esc
  useEffect(() => {
    if (!exportOpen) return
    const onClick = (e: MouseEvent) => {
      if (!exportMenuRef.current?.contains(e.target as Node)) setExportOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExportOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [exportOpen])

  const list = (rows as Invoice[]) ?? []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((v: Invoice) =>
      v.code.toLowerCase().includes(q) || (v.customerName || '').toLowerCase().includes(q))
  }, [list, search])

  const exportList = (format: 'csv' | 'excel') => {
    if (filtered.length === 0) {
      toast.error('Không có hoá đơn để xuất')
      setExportOpen(false)
      return
    }
    const stamp = new Date().toISOString().slice(0, 10)
    const name = `hoa-don-${stamp}`
    try {
      if (format === 'csv') {
        downloadCsv(name, filtered, INVOICE_EXPORT_COLUMNS)
      } else {
        downloadExcel(name, filtered, INVOICE_EXPORT_COLUMNS)
      }
      toast.success(
        format === 'csv'
          ? `Đã xuất ${filtered.length} hoá đơn ra CSV`
          : `Đã xuất ${filtered.length} hoá đơn ra Excel`,
      )
    } catch {
      toast.error('Xuất file thất bại')
    }
    setExportOpen(false)
  }

  const hasFilter = !!search.trim() || statusFilter !== 'ALL'
  const isFilteredEmpty = !isLoading && !isError && list.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && list.length === 0

  const totalReceivable = useMemo(
    () => list.filter((i: Invoice) => i.status === 'ISSUED' || i.status === 'PARTIALLY_PAID')
      .reduce((s, i: Invoice) => s + (i.total - i.paidAmount), 0),
    [list],
  )

  const revenueStepIndex = useMemo(
    () => revenueStepIndexForInvoices(list as Invoice[]),
    [list],
  )

  const validateCreate = (): { ok: true; items: InvoiceItem[] } | { ok: false } => {
    const errors: Record<string, string> = {}
    if (!form.customerId.trim()) {
      errors.customerId = 'Chọn khách hàng'
    }

    const items: InvoiceItem[] = []
    let hasLineError = false
    form.items.forEach((line, idx) => {
      const name = line.productName.trim()
      const qty = Number(line.quantity)
      const price = parseVndInput(line.unitPrice)
      const tax = line.taxRate.trim() === '' ? 0 : Number(line.taxRate)
      const blank = !name && !line.unitPrice.trim() && (!line.quantity.trim() || line.quantity === '1')
      if (blank && form.items.length > 1) return
      if (!name) {
        errors[`item_${idx}_name`] = 'Chọn sản phẩm'
        hasLineError = true
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        errors[`item_${idx}_qty`] = 'SL phải > 0'
        hasLineError = true
      }
      if (price == null || price < 0) {
        errors[`item_${idx}_price`] = 'Đơn giá không hợp lệ'
        hasLineError = true
      }
      if (!Number.isFinite(tax) || tax < 0) {
        errors[`item_${idx}_tax`] = 'Thuế không hợp lệ'
        hasLineError = true
      }
      if (name && Number.isFinite(qty) && qty > 0 && price != null && price >= 0) {
        items.push({
          productCode: line.productCode.trim() || undefined,
          productName: name,
          quantity: qty,
          unit: line.unit.trim() || 'cái',
          unitPrice: price,
          taxRate: Number.isFinite(tax) ? tax : 0,
        })
      }
    })

    if (!hasLineError && items.length === 0) {
      errors.items = 'Thêm ít nhất 1 dòng hàng hợp lệ'
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return { ok: false }
    return { ok: true, items }
  }

  const onCreate = () => {
    const result = validateCreate()
    if (!result.ok) return
    create.mutate(
      {
        customerId: form.customerId,
        customerName: form.customerName || customerNameById.get(form.customerId),
        issuedDate: form.issuedDate || undefined,
        dueDate: form.dueDate || undefined,
        notes: form.notes.trim() || undefined,
        salespersonUsername: form.salespersonUsername.trim() || undefined,
        commissionRatePercent: form.commissionRatePercent.trim()
          ? Number(form.commissionRatePercent)
          : undefined,
        status: 'DRAFT',
        items: result.items,
      },
      {
        onSuccess: () => closeCreate(),
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
            || (err as { message?: string })?.message
            || 'Tạo hoá đơn thất bại'
          toast.error(msg)
        },
      },
    )
  }

  const columns: AppTableColumn<Invoice>[] = [
    {
      key: 'code',
      title: 'Mã hoá đơn',
      render: (_, inv) => (
        <span className="font-mono font-semibold text-primary-700">{inv.code}</span>
      ),
    },
    {
      key: 'customerName',
      title: 'Khách hàng',
      render: (_, inv) => inv.customerName || '—',
    },
    {
      key: 'issuedDate',
      title: 'Phát hành',
      render: (_, inv) => (
        <span className="text-neutral-600">{inv.issuedDate ? formatDate(inv.issuedDate) : '—'}</span>
      ),
    },
    {
      key: 'dueDate',
      title: 'Hạn',
      render: (_, inv) => (
        <span className="text-neutral-600">{inv.dueDate ? formatDate(inv.dueDate) : '—'}</span>
      ),
    },
    {
      key: 'total',
      title: 'Tổng',
      align: 'right',
      render: (_, inv) => (
        <span className="font-mono tabular-nums">{formatCurrency(inv.total)}</span>
      ),
    },
    {
      key: 'salespersonUsername',
      title: 'Sale / HH',
      render: (_, inv) => (
        <div className="text-xs">
          <div className="font-mono text-neutral-700">{inv.salespersonUsername || '—'}</div>
          {inv.commissionAmount != null && (
            <div className="text-emerald-700 tabular-nums">
              {formatCurrency(Number(inv.commissionAmount))}
              {inv.commissionRatePercent != null ? ` (${Number(inv.commissionRatePercent).toFixed(1)}%)` : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'paidAmount',
      title: 'Đã trả',
      align: 'right',
      render: (_, inv) => (
        <span className="font-mono tabular-nums text-success-dark">{formatCurrency(inv.paidAmount)}</span>
      ),
    },
    {
      key: 'remain',
      title: 'Còn lại',
      align: 'right',
      render: (_, inv) => {
        const remain = inv.total - (inv.paidAmount || 0)
        const paidPct = inv.total > 0
          ? Math.min(100, Math.round(((inv.paidAmount || 0) / inv.total) * 100))
          : 0
        return (
          <div>
            <span className="font-mono font-semibold tabular-nums text-warning-dark">
              {formatCurrency(remain)}
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden min-w-[48px]">
                <div
                  className={`h-full transition-all ${
                    paidPct === 100
                      ? 'bg-success'
                      : paidPct > 0
                        ? 'bg-warning'
                        : 'bg-neutral-300'
                  }`}
                  style={{ width: `${paidPct}%` }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-neutral-500 shrink-0">
                {paidPct}%
              </span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      render: (_, inv) => (
        <div>
          <span className={`inline-flex px-2 py-0.5 rounded-md text-xs border ${STATUS_TONE[inv.status]}`}>
            {STATUS_LABEL[inv.status]}
          </span>
          {inv.glJournalEntryId && (
            <div className="text-[10px] text-neutral-500 mt-1">Đã hạch toán</div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 280,
      render: (_, inv) => {
        const remain = inv.total - (inv.paidAmount || 0)
        const canIssue = inv.status === 'DRAFT'
        const canPost = (inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID' || inv.status === 'PAID')
          && !inv.glJournalEntryId
        const canPay = inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID'
        const canPrint = canExportInvoice(inv)
        return (
          <div className="flex flex-wrap justify-end gap-1">
            <IconActionButton
              tooltip="Bình luận"
              onClick={() => setCommentInv(inv)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-primary-50 hover:text-primary-700"
            >
              <MessageSquare size={12} />
            </IconActionButton>
            {canPrint && (
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-white text-neutral-700 border border-neutral-200 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200"
                onClick={() => setPrintInvoiceId(inv.id)}
                title="Xuất hoá đơn (PDF / In)"
              >
                <Printer size={12} /> Xuất
              </button>
            )}
            {canIssue && (
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-info-light text-info-dark border border-info/30 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={issue.isPending}
                title="Phát hành hoá đơn nháp"
                onClick={() => issue.mutate(inv.id)}
              >
                <Send size={12} /> {issue.isPending ? 'Đang phát hành…' : 'Phát hành'}
              </button>
            )}
            {canPay && (
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-success-light text-success-dark border border-success/30 hover:opacity-90"
                onClick={() => {
                  setPayTarget(inv)
                  setPayAmount(String(remain))
                }}
              >
                <DollarSign size={12} /> Thu tiền
              </button>
            )}
            {canPost && (
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100"
                onClick={() => setPostTarget(inv)}
              >
                <Landmark size={12} /> Hạch toán
              </button>
            )}
          </div>
        )
      },
    },
  ]

  const headerActions = (
    <div className="flex items-center gap-2">
      <PageGuideButton guide={REVENUE_GUIDE} />
      <div ref={exportMenuRef} className="relative">
        <AppTooltip content="Xuất danh sách theo bộ lọc hiện tại">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={isLoading || isError || filtered.length === 0}
            onClick={() => setExportOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={exportOpen}
            aria-label="Xuất danh sách"
          >
            <Download size={16} /> Xuất
            <ChevronDown size={12} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
          </Button>
        </AppTooltip>
        {exportOpen && (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 min-w-[220px] bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden animate-fade-in"
          >
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-primary-50 hover:text-primary-800 transition-colors"
              onClick={() => exportList('csv')}
            >
              <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center shrink-0">
                <FileText size={12} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-neutral-800">CSV (.csv)</div>
                <div className="text-[10px] text-neutral-400">Danh sách theo bộ lọc hiện tại</div>
              </div>
            </button>
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-primary-50 hover:text-primary-800 transition-colors border-t border-neutral-100"
              onClick={() => exportList('excel')}
            >
              <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={12} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-neutral-800">Excel (.xls)</div>
                <div className="text-[10px] text-neutral-400">Mở bằng Excel / LibreOffice</div>
              </div>
            </button>
          </div>
        )}
      </div>
      {canCreate && (
        <Button className="gap-2" onClick={() => openCreate()}>
          <Plus size={16} /> Tạo hoá đơn
        </Button>
      )}
    </div>
  )

  return (
    <div className={pageRootClass(embedded)}>
      {embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-neutral-600">
            Hoá đơn bán — thu tiền & hạch toán.
            <span className="ml-2 text-xs text-neutral-400 tabular-nums">
              Phải thu {formatCurrency(totalReceivable)}
            </span>
          </p>
          {headerActions}
        </div>
      ) : (
        <PageHeader
          title="Hoá đơn"
          description={`Quản lý hoá đơn bán hàng, thu tiền và hạch toán sổ cái. Tổng phải thu: ${formatCurrency(totalReceivable)}`}
          actions={headerActions}
        />
      )}

      <StatusPipelineStepper steps={REVENUE_PIPELINE} currentIndex={revenueStepIndex} />

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => {
          setSearch('')
          setStatusFilter('ALL')
        }}
        countLabel={`${filtered.length} hoá đơn${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm mã hoá đơn hoặc khách hàng…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm hoá đơn"
          />
        </div>
        <div className="flex gap-1 border rounded-md p-0.5 bg-white flex-wrap">
          {(['ALL', 'DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {s === 'ALL' ? 'Tất cả' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được hoá đơn"
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={FileText}
            title={isFilteredEmpty ? 'Không có hoá đơn khớp bộ lọc' : 'Chưa có hoá đơn'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi trạng thái.'
                : 'Tạo hoá đơn nháp cho khách hàng, rồi phát hành.'
            }
            action={
              isFilteredEmpty
                ? {
                    label: 'Xoá lọc',
                    onClick: () => {
                      setSearch('')
                      setStatusFilter('ALL')
                    },
                  }
                : canCreate
                  ? { label: 'Tạo hoá đơn', onClick: () => openCreate() }
                  : undefined
            }
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          onRefresh={() => void refetch()}
        />
      )}

      <AppModal
        isOpen={showCreate}
        onClose={closeCreate}
        title="Tạo hoá đơn"
        description="Tạo hoá đơn nháp (DRAFT). Phát hành và thu tiền ở bước sau."
        maxWidth="3xl"
      >
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Khách hàng *</Label>
            <Select
              options={customerOptions}
              value={form.customerId}
              onChange={(v) => {
                const id = v || ''
                setForm({
                  ...form,
                  customerId: id,
                  customerName: customerNameById.get(id) || '',
                })
                if (fieldErrors.customerId) {
                  setFieldErrors((prev) => {
                    const next = { ...prev }
                    delete next.customerId
                    return next
                  })
                }
              }}
              placeholder="Chọn khách hàng…"
              showSearch={customerOptions.length > 5}
              aria-label="Khách hàng"
              aria-invalid={!!fieldErrors.customerId}
            />
            {fieldErrors.customerId && (
              <p className="mt-1 text-xs text-danger-dark">{fieldErrors.customerId}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-neutral-700 mb-1 block">Ngày phát hành</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.issuedDate}
                onChange={(e) => setForm({ ...form, issuedDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-neutral-700 mb-1 block">Hạn thanh toán</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Sale phụ trách (username)</Label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm font-mono"
                placeholder="vd: sale01 — trống = lấy từ Deal"
                value={form.salespersonUsername}
                onChange={(e) => setForm({ ...form, salespersonUsername: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1 block">% hoa hồng (override)</Label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="Trống = dùng mức đã cài"
                value={form.commissionRatePercent}
                onChange={(e) => setForm({ ...form, commissionRatePercent: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-neutral-700">Dòng hàng *</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setForm({ ...form, items: [...form.items, emptyLine()] })}
              >
                <Plus size={14} /> Thêm dòng
              </Button>
            </div>
            {fieldErrors.items && (
              <p className="mb-1.5 text-xs text-danger-dark">{fieldErrors.items}</p>
            )}
            <div className="space-y-2 border rounded-lg p-2 bg-neutral-50/60">
              {form.items.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1.5 items-start">
                  <div className="col-span-4">
                    <ProductCombobox
                      products={products}
                      value={line.productId}
                      onChange={(productId) => selectLineProduct(idx, productId)}
                      placeholder="Chọn SP *"
                      className="w-full"
                      showSearch
                      showClear
                      aria-label={`Sản phẩm dòng ${idx + 1}`}
                      aria-invalid={Boolean(fieldErrors[`item_${idx}_name`])}
                    />
                    {fieldErrors[`item_${idx}_name`] && (
                      <p className="mt-0.5 text-[10px] text-danger-dark">{fieldErrors[`item_${idx}_name`]}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className="w-full border rounded-md px-2 py-1.5 text-sm bg-white tabular-nums"
                      placeholder="SL"
                      value={line.quantity}
                      onChange={(e) => {
                        const items = [...form.items]
                        items[idx] = { ...items[idx], quantity: e.target.value }
                        setForm({ ...form, items })
                      }}
                      aria-label={`Số lượng dòng ${idx + 1}`}
                    />
                    {fieldErrors[`item_${idx}_qty`] && (
                      <p className="mt-0.5 text-[10px] text-danger-dark">{fieldErrors[`item_${idx}_qty`]}</p>
                    )}
                  </div>
                  <div className="col-span-1">
                    <Select
                      options={unitOptions}
                      value={line.unit}
                      onChange={(v) => {
                        const items = [...form.items]
                        items[idx] = { ...items[idx], unit: v || 'cái' }
                        setForm({ ...form, items })
                      }}
                      placeholder="ĐVT"
                      aria-label={`Đơn vị dòng ${idx + 1}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <VndInput
                      className="w-full border rounded-md px-2 py-1.5 text-sm bg-white h-auto"
                      placeholder="Đơn giá"
                      value={parseVndInput(line.unitPrice)}
                      onChange={(n) => {
                        const items = [...form.items]
                        items[idx] = { ...items[idx], unitPrice: n == null ? '' : String(n) }
                        setForm({ ...form, items })
                      }}
                      aria-label={`Đơn giá dòng ${idx + 1}`}
                      aria-invalid={Boolean(fieldErrors[`item_${idx}_price`])}
                    />
                    {fieldErrors[`item_${idx}_price`] && (
                      <p className="mt-0.5 text-[10px] text-danger-dark">{fieldErrors[`item_${idx}_price`]}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className="w-full border rounded-md px-2 py-1.5 text-sm bg-white tabular-nums"
                      placeholder="% thuế"
                      value={line.taxRate}
                      onChange={(e) => {
                        const items = [...form.items]
                        items[idx] = { ...items[idx], taxRate: e.target.value }
                        setForm({ ...form, items })
                      }}
                      aria-label={`Thuế dòng ${idx + 1}`}
                    />
                    {fieldErrors[`item_${idx}_tax`] && (
                      <p className="mt-0.5 text-[10px] text-danger-dark">{fieldErrors[`item_${idx}_tax`]}</p>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end pt-1">
                    <IconActionButton
                      tooltip="Xoá dòng"
                      tone="rose"
                      disabled={form.items.length <= 1}
                      onClick={() => {
                        if (form.items.length <= 1) return
                        setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
                      }}
                      aria-label={`Xoá dòng ${idx + 1}`}
                    >
                      <Trash2 size={14} />
                    </IconActionButton>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-neutral-700 mb-1 block">Ghi chú</label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Tuỳ chọn"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeCreate}>Huỷ</Button>
            <Button onClick={onCreate} disabled={create.isPending}>
              {create.isPending ? 'Đang lưu…' : 'Lưu nháp'}
            </Button>
          </div>
        </div>
      </AppModal>

      <AppModal
        isOpen={!!payTarget}
        onClose={() => { setPayTarget(null); setPayAmount('') }}
        title="Thu tiền hoá đơn"
        description={
          payTarget
            ? `${payTarget.code} — còn ${formatCurrency((payTarget.total || 0) - (payTarget.paidAmount || 0))}`
            : undefined
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm text-neutral-700 mb-1 block">Số tiền thanh toán *</label>
            <VndInput
              className="w-full border rounded-md px-3 py-2 text-sm h-auto"
              placeholder="0"
              value={parseVndInput(payAmount)}
              onChange={(n) => setPayAmount(n == null ? '' : String(n))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setPayTarget(null); setPayAmount('') }}>Huỷ</Button>
            <Button
              disabled={pay.isPending}
              onClick={() => {
                if (!payTarget) return
                const remain = (payTarget.total || 0) - (payTarget.paidAmount || 0)
                const amt = parseVndInput(payAmount)
                if (!amt || amt <= 0) {
                  toast.error('Nhập số tiền hợp lệ')
                  return
                }
                if (amt > remain) {
                  toast.error(`Số tiền không được vượt quá còn lại (${formatCurrency(remain)})`)
                  return
                }
                pay.mutate(
                  { id: payTarget.id, amount: amt },
                  { onSuccess: () => { setPayTarget(null); setPayAmount('') } },
                )
              }}
            >
              Xác nhận thu tiền
            </Button>
          </div>
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={!!postTarget}
        onClose={() => setPostTarget(null)}
        onConfirm={() => {
          if (!postTarget) return
          const code = postTarget.code
          post.mutate(postTarget.id, {
            onSuccess: (res: any) => {
              setPostTarget(null)
              const data = res?.data ?? res
              const journalEntryId =
                data?.journalEntryId ??
                data?.glJournalEntryId ??
                data?.id ??
                null
              const skipped = !!(data?.skipped || data?.alreadyPosted)
              setPostResult({
                code,
                journalEntryId,
                skipped,
                message: data?.message || (skipped
                  ? 'Kỳ đã hạch toán trước đó — không ghi đôi.'
                  : 'Đã hạch toán sổ cái thành công.'),
              })
            },
            onError: (err: any) => {
              setPostTarget(null)
              setPostResult({
                code,
                message:
                  err?.response?.data?.message ||
                  err?.message ||
                  'Hạch toán thất bại. Kiểm tra kỳ kế toán / ánh xạ tài khoản.',
              })
            },
          })
        }}
        title="Hạch toán vào sổ cái?"
        message={`Hoá đơn ${postTarget?.code || ''} sẽ được ghi sổ cái. Hệ thống tránh ghi trùng nếu đã hạch toán.`}
        confirmText="Hạch toán"
        variant="warning"
        isLoading={post.isPending}
      />

      <AppModal
        isOpen={!!postResult}
        onClose={() => setPostResult(null)}
        title="Kết quả hạch toán"
        description={postResult ? `Hoá đơn ${postResult.code}` : undefined}
      >
        <div className="space-y-3 text-sm">
          <p className="text-neutral-700">
            {postResult?.message || 'Đã xử lý yêu cầu hạch toán.'}
          </p>
          {postResult?.journalEntryId ? (
            <p className="text-neutral-600">
              Mã bút toán:{' '}
              <code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">
                {postResult.journalEntryId}
              </code>
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPostResult(null)}>
              Đóng
            </Button>
            <Button asChild>
              <Link to="/accounting/journals" onClick={() => setPostResult(null)}>
                Mở sổ nhật ký
              </Link>
            </Button>
          </div>
        </div>
      </AppModal>

      <CommentDrawer
        open={!!commentInv}
        onClose={() => setCommentInv(null)}
        subjectType={SubjectType.INVOICE}
        subjectId={commentInv?.id || ''}
        title={commentInv?.code || 'Hoá đơn'}
        subtitle={commentInv?.customerName}
      />

      <InvoicePrintPreviewModal
        open={!!printInvoiceId}
        invoiceId={printInvoiceId}
        onClose={() => setPrintInvoiceId(null)}
      />
    </div>
  )
}
