import { useState, useMemo } from 'react'
import {
  Plus, Edit, Trash2, Eye, Building2, GitBranch,
  ChevronRight, ChevronDown, List, Search,
  CheckCircle, AlertCircle, Power,
  type LucideIcon,
} from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  AppModal, Button, ConfirmDialog, PageHeader, PageGuideButton,
  EmptyState, ErrorState, Select,
  IconActionButton, AppTooltip, StatusBadge, actionIconTone,
  type PageGuideConfig, type StatusConfig,
} from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import {
  useOrganizations, useCreateOrganization, useUpdateOrganization, useDeleteOrganization,
} from '../hooks/useQtht'
import { orgSchema } from '../constants/schema'
import { OrganizationDetailDrawer } from '../components/OrganizationDetailDrawer'

// ============================================================
// Constants
// ============================================================

const ORGANIZATIONS_GUIDE: PageGuideConfig = {
  title: 'Cơ cấu tổ chức',
  subtitle:
    'Quản lý pháp nhân, chi nhánh và đối tác theo hierarchy. Xem cây để hiểu quan hệ, hoặc bảng để lọc/tìm nhanh.',
  sections: [
    {
      heading: 'Cách sử dụng',
      type: 'steps',
      steps: [
        {
          title: 'Tạo công ty chủ quản',
          description:
            'Loại = Công ty, Cấp độ = Chủ quản, không chọn tổ chức cha. Đây là gốc — mọi chi nhánh sẽ trỏ về.',
        },
        {
          title: 'Thêm chi nhánh / đơn vị con',
          description:
            'Cấp độ = Chi nhánh, chọn tổ chức cha là công ty chủ quản. Có thể lồng nhiều tầng.',
        },
        {
          title: 'Đối tác / khách hàng / nhà cung cấp',
          description:
            'Đặt loại tương ứng, không cần tổ chức cha. Danh mục dùng chung với Hợp đồng và Kế toán.',
        },
      ],
    },
    {
      heading: 'Mẹo',
      type: 'tips',
      tips: [
        'Chuyển Cây / Danh sách bằng nút góc phải. Cây trực quan quan hệ; danh sách lọc/tìm mạnh hơn.',
        'Click node/hàng để mở drawer chi tiết — liên hệ và đơn vị con.',
        'Mã tổ chức viết HOA, không dấu (vd. ORG001, HN01). Không đổi mã sau khi đã có hợp đồng.',
      ],
    },
    {
      heading: 'Lưu ý',
      type: 'notes',
      notes:
        'Không xóa tổ chức đang có hợp đồng / nhân viên / tài sản. Tái cấu trúc → tạo bản ghi mới và đánh dấu bản cũ là Đã sáp nhập / Đã giải thể để giữ lịch sử.',
    },
  ],
}

const TYPE_OPTIONS = [
  { value: 'COMPANY', label: 'Công ty' },
  { value: 'DEPARTMENT', label: 'Phòng ban' },
  { value: 'BRANCH', label: 'Chi nhánh' },
  { value: 'AGENCY', label: 'Đại lý' },
  { value: 'PARTNER', label: 'Đối tác' },
  { value: 'CUSTOMER', label: 'Khách hàng' },
  { value: 'SUPPLIER', label: 'Nhà cung cấp' },
  { value: 'GOVERNMENT', label: 'Cơ quan nhà nước' },
  { value: 'EDUCATIONAL', label: 'Giáo dục' },
  { value: 'HOSPITAL', label: 'Bệnh viện' },
  { value: 'OTHER', label: 'Khác' },
]

const LEVEL_OPTIONS = [
  { value: '1', label: 'Công ty chủ quản' },
  { value: '2', label: 'Chi nhánh / Đơn vị con' },
]

const SCALE_OPTIONS = [
  { value: 'MICRO', label: 'Siêu nhỏ' },
  { value: 'SMALL', label: 'Nhỏ' },
  { value: 'MEDIUM', label: 'Vừa' },
  { value: 'LARGE', label: 'Lớn' },
  { value: 'ENTERPRISE', label: 'Doanh nghiệp' },
  { value: 'CORPORATION', label: 'Tập đoàn' },
]

const STATUS_CONFIG: Record<string, StatusConfig & { icon?: LucideIcon }> = {
  ACTIVE:     { label: 'Hoạt động',       color: 'success', icon: CheckCircle },
  INACTIVE:   { label: 'Ngừng hoạt động', color: 'neutral', icon: Power },
  SUSPENDED:  { label: 'Tạm ngưng',       color: 'warning', icon: AlertCircle },
  MERGED:     { label: 'Đã sáp nhập',     color: 'info',    icon: GitBranch },
  ACQUIRED:   { label: 'Đã mua lại',      color: 'info',    icon: GitBranch },
  DISSOLVED:  { label: 'Đã giải thể',     color: 'danger',  icon: AlertCircle },
  LIQUIDATED: { label: 'Đã thanh lý',     color: 'danger',  icon: AlertCircle },
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
  { value: 'SUSPENDED', label: 'Tạm ngưng' },
  { value: 'MERGED', label: 'Đã sáp nhập' },
  { value: 'DISSOLVED', label: 'Đã giải thể' },
]

const defaultFormValues = {
  code: '', name: '', nameEn: '', shortName: '', taxCode: '',
  email: '', phone: '', website: '', address: '',
  level: 1, type: '', status: true, scale: '', parentId: '',
  description: '', orderIndex: 0,
}

// ============================================================
// Page
// ============================================================

export function OrganizationsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [createPrefill, setCreatePrefill] = useState<Partial<typeof defaultFormValues> | null>(null)
  const [detailOrg, setDetailOrg] = useState<any | null>(null)
  const [confirmDel, setConfirmDel] = useState<any | null>(null)
  const [view, setView] = useState<'tree' | 'table'>('tree')
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: rawData, isLoading, isError, isFetching, refetch } = useOrganizations()
  const createReq = useCreateOrganization()
  const updateReq = useUpdateOrganization()
  const deleteReq = useDeleteOrganization()

  const dataList = useMemo(
    () => (Array.isArray(rawData) ? rawData : []) as any[],
    [rawData],
  )

  const filteredList = useMemo(() => {
    let list = dataList
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter)
    if (typeFilter !== 'all') list = list.filter((o) => o.type === typeFilter)
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim()
      list = list.filter((o) =>
        (o.name || '').toLowerCase().includes(q) ||
        (o.nameEn || '').toLowerCase().includes(q) ||
        (o.code || '').toLowerCase().includes(q) ||
        (o.email || '').toLowerCase().includes(q) ||
        (o.taxCode || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [dataList, searchText, typeFilter, statusFilter])

  const treeRoots = useMemo(() => buildTree(filteredList, dataList), [filteredList, dataList])

  const stats = useMemo(() => {
    const total = dataList.length
    const active = dataList.filter((o) => o.status === 'ACTIVE').length
    const companies = dataList.filter((o) => Number(o.level) === 1).length
    const branches = dataList.filter((o) => Number(o.level) !== 1).length
    return { total, active, companies, branches }
  }, [dataList])

  const parentOptions = useMemo(() => {
    const invalid = selectedItem?.id ? collectDescendants(selectedItem.id, dataList) : new Set<string>()
    return [
      { value: '', label: '— Không có (công ty chủ quản) —' },
      ...dataList
        .filter((o) => !invalid.has(o.id))
        .map((o) => ({ value: o.id, label: `${o.code} · ${o.name}` })),
    ]
  }, [dataList, selectedItem])

  const hasActiveFilters =
    Boolean(searchText.trim()) || typeFilter !== 'all' || statusFilter !== 'all'
  const isFullyEmpty = !isLoading && !isError && dataList.length === 0
  const isFilteredEmpty = !isLoading && !isError && dataList.length > 0 && filteredList.length === 0

  const clearFilters = () => {
    setSearchText('')
    setTypeFilter('all')
    setStatusFilter('all')
  }

  const handleOpenCreate = (parentId?: string) => {
    setSelectedItem(null)
    setCreatePrefill(parentId ? { parentId } : null)
    setModalOpen(true)
  }

  const handleOpenEdit = (org: any) => {
    setDetailOrg(null)
    setCreatePrefill(null)
    setSelectedItem(org)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedItem(null)
    setCreatePrefill(null)
  }

  const handleSubmit = (values: any) => {
    const payload: any = { ...values, status: values.status ? 'ACTIVE' : 'INACTIVE' }
    for (const key of Object.keys(payload)) if (payload[key] === '') payload[key] = null
    payload.level = Number(values.level)
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: payload }, { onSuccess: handleCloseModal })
    } else {
      createReq.mutate(payload, { onSuccess: handleCloseModal })
    }
  }

  const handleDelete = () => {
    if (confirmDel?.id) {
      deleteReq.mutate(confirmDel.id, { onSuccess: () => setConfirmDel(null) })
    }
  }

  const formDefaults = selectedItem?.id
    ? { ...defaultFormValues, ...selectedItem, status: selectedItem.status === 'ACTIVE' }
    : { ...defaultFormValues, ...createPrefill }

  const isSubmitting = createReq.isPending || updateReq.isPending

  const columns: AppTableColumn<any>[] = [
    {
      key: 'code',
      title: 'Mã',
      dataIndex: 'code',
      render: (v: string) => (
        <span className="font-mono text-xs font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
          {v}
        </span>
      ),
    },
    {
      key: 'name',
      title: 'Tên tổ chức',
      dataIndex: 'name',
      render: (_: any, row: any) => (
        <button type="button" onClick={() => setDetailOrg(row)} className="text-left group">
          <div className="font-semibold text-neutral-800 group-hover:text-primary-700 transition-colors">
            {row.name}
          </div>
          {row.nameEn && (
            <div className="text-[11px] text-neutral-400 italic">{row.nameEn}</div>
          )}
        </button>
      ),
    },
    {
      key: 'type',
      title: 'Loại',
      dataIndex: 'type',
      render: (v: string) => (
        <span className="text-xs text-neutral-600">
          {TYPE_OPTIONS.find((t) => t.value === v)?.label || v || '—'}
        </span>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      dataIndex: 'email',
      render: (v: string) => v || '—',
    },
    {
      key: 'taxCode',
      title: 'Mã số thuế',
      dataIndex: 'taxCode',
      render: (v: string) => (v ? <span className="font-mono text-xs">{v}</span> : '—'),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (v: string) => {
        const cfg = STATUS_CONFIG[v] || STATUS_CONFIG.INACTIVE
        return <StatusBadge {...cfg} />
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      dataIndex: 'id',
      width: 120,
      align: 'right',
      render: (_: any, row: any) => (
        <div className="flex items-center justify-end gap-1">
          <IconActionButton
            tooltip="Xem chi tiết"
            tone={actionIconTone.view}
            size="sm"
            onClick={() => setDetailOrg(row)}
          >
            <Eye size={14} />
          </IconActionButton>
          <IconActionButton
            tooltip="Sửa"
            tone={actionIconTone.edit}
            size="sm"
            onClick={() => handleOpenEdit(row)}
          >
            <Edit size={14} />
          </IconActionButton>
          <IconActionButton
            tooltip="Xoá"
            tone={actionIconTone.delete}
            size="sm"
            onClick={() => setConfirmDel(row)}
          >
            <Trash2 size={14} />
          </IconActionButton>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Cơ cấu tổ chức"
        description="Quản lý pháp nhân, chi nhánh, phòng ban và đối tác theo hierarchy."
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <PageGuideButton guide={ORGANIZATIONS_GUIDE} />
            <Button
              onClick={() => handleOpenCreate()}
              className="gap-2 bg-primary-600 hover:bg-primary-700 text-white h-9"
            >
              <Plus size={16} /> Thêm tổ chức
            </Button>
          </div>
        }
      />

      {!isLoading && !isError && dataList.length > 0 && (
        <p className="text-xs text-neutral-500 tabular-nums">
          {stats.total} tổ chức · {stats.active} hoạt động · {stats.companies} chủ quản · {stats.branches} chi nhánh
        </p>
      )}

      <FilterBar
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
        countLabel={`${filteredList.length} bản ghi${hasActiveFilters ? ' (đã lọc)' : ''}`}
        extra={
          <div className="flex items-center bg-white border border-neutral-200 rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setView('tree')}
              className={`px-2.5 h-8 rounded text-xs font-semibold inline-flex items-center gap-1 transition ${
                view === 'tree' ? 'bg-primary-50 text-primary-700' : 'text-neutral-500'
              }`}
              aria-label="Chế độ cây gia phả"
              aria-pressed={view === 'tree'}
            >
              <GitBranch size={13} /> Cây gia phả
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={`px-2.5 h-8 rounded text-xs font-semibold inline-flex items-center gap-1 transition ${
                view === 'table' ? 'bg-primary-50 text-primary-700' : 'text-neutral-500'
              }`}
              aria-label="Chế độ danh sách"
              aria-pressed={view === 'table'}
            >
              <List size={13} /> Danh sách
            </button>
          </div>
        }
      >
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="Tìm mã, tên, email, mã số thuế…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-9 w-full pl-8 pr-3 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
            aria-label="Tìm tổ chức"
          />
        </div>

        <div className="min-w-[140px]">
          <Select
            options={[
              { value: 'all', label: 'Tất cả loại' },
              ...TYPE_OPTIONS,
            ]}
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="Loại"
            aria-label="Lọc theo loại"
            showSearch={TYPE_OPTIONS.length > 8}
          />
        </div>

        <div className="min-w-[140px]">
          <Select
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Trạng thái"
            aria-label="Lọc theo trạng thái"
            showSearch={false}
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được tổ chức"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Building2}
            title={isFullyEmpty ? 'Chưa có tổ chức nào' : 'Không có bản ghi phù hợp bộ lọc'}
            description={
              isFullyEmpty
                ? 'Tạo công ty chủ quản đầu tiên để bắt đầu.'
                : 'Thử đổi bộ lọc hoặc xoá lọc.'
            }
            action={
              isFullyEmpty
                ? { label: 'Thêm công ty đầu tiên', onClick: () => handleOpenCreate() }
                : { label: 'Xoá lọc', onClick: clearFilters }
            }
          />
        </div>
      ) : view === 'tree' ? (
        isLoading ? (
          <div className="p-12 flex items-center justify-center bg-white border border-neutral-200 rounded-xl">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="px-3 py-3 bg-white border border-neutral-200 rounded-xl">
            <div className="org-tree">
              {treeRoots.map((node, idx) => (
                <OrgTreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  isLast={idx === treeRoots.length - 1}
                  onView={setDetailOrg}
                  onEdit={handleOpenEdit}
                  onAddChild={(parent) => handleOpenCreate(parent.id)}
                  onDelete={setConfirmDel}
                />
              ))}
            </div>
          </div>
        )
      ) : (
        <AppTable
          data={filteredList}
          columns={columns}
          isLoading={isLoading}
          showSearch={false}
          defaultDensity="comfortable"
          showDensityToggle
          pageSize={10}
          pageSizeOptions={[10]}
          onRefresh={() => void refetch()}
        />
      )}

      <AppModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={selectedItem?.id ? 'Chỉnh sửa tổ chức' : 'Thêm tổ chức mới'}
        description={selectedItem?.id ? undefined : 'Điền thông tin để đăng ký pháp nhân hoặc chi nhánh mới.'}
        maxWidth="4xl"
      >
        <AppForm
          key={selectedItem?.id || `new-${createPrefill?.parentId || 'root'}`}
          schema={orgSchema}
          defaultValues={formDefaults}
          onSubmit={handleSubmit}
          fields={[
            { name: 'code', label: 'Mã tổ chức', required: true, placeholder: 'VD: ORG001', description: 'Viết HOA, không dấu' },
            { name: 'name', label: 'Tên tổ chức', required: true, placeholder: 'VD: Công ty TNHH Frezo' },
            { name: 'nameEn', label: 'Tên tiếng Anh', placeholder: 'Frezo Co., Ltd' },
            { name: 'shortName', label: 'Tên viết tắt', placeholder: 'FREZO' },
            { name: 'type', label: 'Loại tổ chức', type: 'select', options: TYPE_OPTIONS, required: true },
            { name: 'level', label: 'Cấp độ', type: 'select', options: LEVEL_OPTIONS, required: true },
            { name: 'scale', label: 'Quy mô', type: 'select', options: SCALE_OPTIONS },
            { name: 'parentId', label: 'Tổ chức cha', type: 'select', options: parentOptions, description: 'Bỏ trống nếu là công ty chủ quản' },
            { name: 'status', label: 'Trạng thái', type: 'switch' },
            { name: 'taxCode', label: 'Mã số thuế', placeholder: '0312345678' },
            { name: 'email', label: 'Email', placeholder: 'contact@frezo.com' },
            { name: 'phone', label: 'Số điện thoại', placeholder: '0901234567' },
            { name: 'website', label: 'Website', placeholder: 'frezo.com', colSpan: 2 },
            { name: 'address', label: 'Địa chỉ', colSpan: 3 },
            { name: 'description', label: 'Mô tả', type: 'textarea', colSpan: 3 },
            { name: 'orderIndex', label: 'Thứ tự hiển thị', type: 'number' },
          ]}
          isLoading={isSubmitting}
          onCancel={handleCloseModal}
        />
      </AppModal>

      <OrganizationDetailDrawer
        isOpen={!!detailOrg}
        org={detailOrg}
        allOrgs={dataList}
        onClose={() => setDetailOrg(null)}
        onEdit={handleOpenEdit}
        onDelete={setConfirmDel}
        onAddChild={(parent) => handleOpenCreate(parent.id)}
        onSelectChild={(child) => setDetailOrg(child)}
      />

      <ConfirmDialog
        isOpen={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        title={`Xoá tổ chức "${confirmDel?.name || ''}"?`}
        message="Tổ chức sẽ bị xoá. Không nên xoá nếu đang có hợp đồng hoặc nhân viên tham chiếu — cân nhắc đánh dấu Ngừng hoạt động / Đã giải thể."
        variant="danger"
        confirmText="Xoá"
        cancelText="Huỷ"
        isLoading={deleteReq.isPending}
      />
    </div>
  )
}

// ============================================================
// Tree Node — connector lines + denser SME hierarchy
// ============================================================

interface OrgTreeNodeProps {
  node: any
  depth: number
  isLast: boolean
  onView: (o: any) => void
  onEdit: (o: any) => void
  onAddChild: (parent: any) => void
  onDelete: (o: any) => void
}

function OrgTreeNode({
  node, depth, isLast, onView, onEdit, onAddChild, onDelete,
}: OrgTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = Array.isArray(node.children) && node.children.length > 0
  const statusCfg = STATUS_CONFIG[node.status || 'ACTIVE'] || STATUS_CONFIG.ACTIVE
  const typeLabel = TYPE_OPTIONS.find((t) => t.value === node.type)?.label || node.type
  const isRoot = depth === 0

  return (
    <div className={`relative ${isRoot ? '' : 'pl-6'}`}>
      {!isRoot && (
        <>
          <span
            aria-hidden
            className={`pointer-events-none absolute left-0 top-0 w-px bg-neutral-300 ${
              isLast ? 'h-5' : 'bottom-0'
            }`}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-5 h-px w-6 bg-neutral-300"
          />
        </>
      )}

      <div
        className={`group relative flex items-center gap-1.5 rounded-md transition-colors ${
          isRoot
            ? 'bg-primary-50/60 hover:bg-primary-50 border border-primary-100 px-1.5'
            : 'hover:bg-neutral-50 pr-1'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) setExpanded((v) => !v)
          }}
          aria-label={hasChildren ? (expanded ? 'Thu gọn' : 'Mở rộng') : undefined}
          className={`w-5 h-5 shrink-0 flex items-center justify-center rounded ${
            hasChildren
              ? 'text-neutral-500 hover:text-primary-700 hover:bg-primary-100'
              : 'text-neutral-300 cursor-default'
          }`}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={14} strokeWidth={2.25} /> : <ChevronRight size={14} strokeWidth={2.25} />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
          )}
        </button>

        <AppTooltip content="Xem chi tiết">
          <button
            type="button"
            onClick={() => onView(node)}
            aria-label="Xem chi tiết"
            className={`w-7 h-7 rounded-md bg-gradient-to-br ${pickTone(node.name)} flex items-center justify-center text-white text-[10px] font-bold shrink-0 ring-1 ring-black/5`}
          >
            {getInitials(node.shortName || node.name)}
          </button>
        </AppTooltip>

        <button
          type="button"
          onClick={() => onView(node)}
          className="flex-1 min-w-0 flex items-center gap-2 py-1.5 pr-1 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[13px] font-semibold text-neutral-800 truncate group-hover:text-primary-700 transition-colors">
                {node.name}
              </span>
              <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                {node.code}
              </span>
              {Number(node.level) === 1 && (
                <span className="inline-flex items-center px-1 py-px text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 rounded shrink-0">
                  ★ Chủ quản
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-px text-[11px] text-neutral-500">
              <span>{typeLabel}</span>
              {hasChildren && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="text-primary-700 font-medium">
                    {node.children.length} đơn vị con
                  </span>
                </>
              )}
            </div>
          </div>
        </button>

        <StatusBadge {...statusCfg} compact />

        <div className="flex items-center gap-0.5 shrink-0 opacity-45 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <IconActionButton
            tooltip="Thêm đơn vị con"
            tone={actionIconTone.edit}
            size="sm"
            onClick={(e) => { e.stopPropagation(); onAddChild(node) }}
          >
            <Plus size={13} />
          </IconActionButton>
          <IconActionButton
            tooltip="Sửa"
            tone={actionIconTone.edit}
            size="sm"
            onClick={(e) => { e.stopPropagation(); onEdit(node) }}
          >
            <Edit size={13} />
          </IconActionButton>
          <IconActionButton
            tooltip="Xoá"
            tone={actionIconTone.delete}
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete(node) }}
          >
            <Trash2 size={13} />
          </IconActionButton>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="mt-0.5">
          {node.children.map((child: any, idx: number) => (
            <OrgTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isLast={idx === node.children.length - 1}
              onView={onView}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

function buildTree(filteredList: any[], allList: any[]): any[] {
  const nodeMap = new Map<string, any>()
  filteredList.forEach((item) => nodeMap.set(item.id, { ...item, children: [] }))

  filteredList.forEach((item) => {
    if (item.parentId && !nodeMap.has(item.parentId)) {
      const parent = allList.find((o) => o.id === item.parentId)
      if (parent) nodeMap.set(parent.id, { ...parent, children: [], _partial: true })
    }
  })

  const roots: any[] = []
  nodeMap.forEach((node) => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortTree = (nodes: any[]) => {
    nodes.sort((a, b) => {
      const oi = (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
      if (oi !== 0) return oi
      return String(a.name || '').localeCompare(String(b.name || ''), 'vi')
    })
    nodes.forEach((n) => sortTree(n.children))
  }
  sortTree(roots)
  return roots
}

function collectDescendants(id: string, allList: any[]): Set<string> {
  const set = new Set<string>([id])
  let changed = true
  while (changed) {
    changed = false
    for (const o of allList) {
      if (o.parentId && set.has(o.parentId) && !set.has(o.id)) {
        set.add(o.id)
        changed = true
      }
    }
  }
  return set
}

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function pickTone(seed?: string): string {
  const tones = [
    'from-emerald-500 to-teal-600',
    'from-primary-500 to-emerald-600',
    'from-teal-500 to-emerald-700',
    'from-emerald-600 to-green-700',
    'from-lime-600 to-emerald-600',
    'from-cyan-600 to-teal-700',
  ]
  const s = (seed || '?').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return tones[s % tones.length]
}
