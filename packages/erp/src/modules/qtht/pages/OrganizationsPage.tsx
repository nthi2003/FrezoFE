import { useState, useMemo } from 'react'
import {
  Plus, Edit, Trash2, Eye, Building2, GitBranch, Search,
  ChevronRight, ChevronDown, LayoutGrid, List, X, Filter,
} from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import {
  AppModal, Button, ConfirmDialog, PageHeader, PageGuideButton,
  type PageGuideConfig,
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
  title: 'Cơ cấu Tổ chức',
  subtitle:
    'Cây gia phả pháp nhân — công ty chủ quản, chi nhánh, phòng ban, đối tác. Xem hierarchical để hiểu quan hệ, hoặc bảng để lọc/tìm nhanh.',
  sections: [
    {
      heading: 'Cách sử dụng',
      type: 'steps',
      steps: [
        {
          title: 'Tạo công ty chủ quản',
          description:
            'Loại = Công ty, Cấp độ = Chủ quản, không có Tổ chức cha. Đây là gốc cây — mọi chi nhánh sẽ trỏ về.',
        },
        {
          title: 'Thêm chi nhánh / đơn vị con',
          description:
            'Cấp độ = Chi nhánh, chọn Tổ chức cha là công ty chủ quản. Có thể nesting nhiều tầng.',
        },
        {
          title: 'Đối tác / KH / NCC',
          description:
            'Đặt Loại tương ứng, không cần parent. Danh mục này dùng chung với module Hợp đồng và Kế toán.',
        },
      ],
    },
    {
      heading: 'Mẹo dùng',
      type: 'tips',
      tips: [
        'Chuyển giữa 2 chế độ Cây / Bảng bằng nút góc phải. Cây trực quan quan hệ, Bảng lọc/tìm mạnh hơn.',
        'Click vào bất kỳ node/hàng để mở drawer chi tiết 360° — có đầy đủ liên hệ + danh sách đơn vị con.',
        'Mã tổ chức UPPERCASE, không dấu, dạng ORG001, HN01, CN-DA-NANG. KHÔNG đổi mã sau khi tạo hợp đồng.',
      ],
    },
    {
      heading: 'Lưu ý',
      type: 'notes',
      notes:
        'Không xóa cứng tổ chức đang có hợp đồng / nhân viên / tài sản. Nếu tái cấu trúc → tạo record mới + đánh dấu record cũ là "Đã sáp nhập / Đã giải thể" để giữ audit trail.',
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

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  ACTIVE:     { text: 'Hoạt động',       className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  INACTIVE:   { text: 'Ngừng hoạt động', className: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
  SUSPENDED:  { text: 'Tạm ngưng',       className: 'bg-amber-50 text-amber-700 border-amber-200' },
  MERGED:     { text: 'Đã sáp nhập',     className: 'bg-blue-50 text-blue-700 border-blue-200' },
  ACQUIRED:   { text: 'Đã mua lại',      className: 'bg-blue-50 text-blue-700 border-blue-200' },
  DISSOLVED:  { text: 'Đã giải thể',     className: 'bg-rose-50 text-rose-700 border-rose-200' },
  LIQUIDATED: { text: 'Đã thanh lý',     className: 'bg-rose-50 text-rose-700 border-rose-200' },
}

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
  const [detailOrg, setDetailOrg] = useState<any | null>(null)
  const [confirmDel, setConfirmDel] = useState<any | null>(null)
  const [view, setView] = useState<'tree' | 'table'>('tree')
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const { data: rawData, isLoading } = useOrganizations()
  const createReq = useCreateOrganization()
  const updateReq = useUpdateOrganization()
  const deleteReq = useDeleteOrganization()

  const dataList: any[] = Array.isArray(rawData) ? rawData : []

  const filteredList = useMemo(() => {
    let list = dataList
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
    if (typeFilter !== 'all') list = list.filter((o) => o.type === typeFilter)
    return list
  }, [dataList, searchText, typeFilter])

  // Build tree for tree-view
  const treeRoots = useMemo(() => buildTree(filteredList, dataList), [filteredList, dataList])

  // Stats
  const stats = useMemo(() => {
    const total = dataList.length
    const active = dataList.filter((o) => o.status === 'ACTIVE').length
    const companies = dataList.filter((o) => Number(o.level) === 1).length
    const branches = dataList.filter((o) => Number(o.level) !== 1).length
    return { total, active, companies, branches }
  }, [dataList])

  // Options for parent select (chỉ hiện những org không phải chính nó & không phải con nó — tránh cycle)
  const parentOptions = useMemo(() => {
    const invalid = selectedItem?.id ? collectDescendants(selectedItem.id, dataList) : new Set<string>()
    return [
      { value: '', label: '— Không có (root) —' },
      ...dataList
        .filter((o) => !invalid.has(o.id))
        .map((o) => ({ value: o.id, label: `${o.code} · ${o.name}` })),
    ]
  }, [dataList, selectedItem])

  // ---- Handlers ----
  const handleOpenCreate = (parentId?: string) => {
    setSelectedItem(null)
    setModalOpen(true)
    if (parentId) {
      // pre-set parent via form default — we'll pass via a state trick
      setSelectedItem({ __prefillParent: parentId })
    }
  }
  const handleOpenEdit = (org: any) => {
    setDetailOrg(null)
    setSelectedItem(org)
    setModalOpen(true)
  }
  const handleSubmit = (values: any) => {
    const payload: any = { ...values, status: values.status ? 'ACTIVE' : 'INACTIVE' }
    for (const key of Object.keys(payload)) if (payload[key] === '') payload[key] = null
    payload.level = Number(values.level)
    delete payload.__prefillParent
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: payload }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }
  const handleDelete = () => {
    if (confirmDel?.id) {
      deleteReq.mutate(confirmDel.id, { onSuccess: () => setConfirmDel(null) })
    }
  }

  const formDefaults =
    selectedItem?.id
      ? { ...defaultFormValues, ...selectedItem, status: selectedItem.status === 'ACTIVE' }
      : { ...defaultFormValues, parentId: selectedItem?.__prefillParent || '' }

  const isSubmitting = createReq.isPending || updateReq.isPending

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <PageHeader
        title="Cơ cấu Tổ chức"
        description={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Cây gia phả pháp nhân — công ty, chi nhánh, phòng ban và đối tác.</span>
            <span className="text-neutral-300">·</span>
            <span className="tabular-nums">
              <b className="text-neutral-900">{stats.total}</b> tổ chức
            </span>
            <span className="text-neutral-300">·</span>
            <span className="tabular-nums">
              <b className="text-emerald-700">{stats.active}</b> đang hoạt động
            </span>
            <span className="text-neutral-300">·</span>
            <span className="tabular-nums">
              <b className="text-neutral-900">{stats.companies}</b> chủ quản
            </span>
            <span className="text-neutral-300">/</span>
            <span className="tabular-nums">
              <b className="text-neutral-900">{stats.branches}</b> chi nhánh
            </span>
          </span>
        }
        actions={
          <>
            <PageGuideButton guide={ORGANIZATIONS_GUIDE} />
            <Button
              onClick={() => handleOpenCreate()}
              className="gap-2 bg-primary-700 hover:bg-primary-800 text-white shadow-sm"
            >
              <Plus size={16} /> Thêm tổ chức
            </Button>
          </>
        }
      />

      {/* Filter + view toggle */}
      <div className="p-3 bg-white border border-neutral-200 rounded-2xl shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm mã, tên, email, MST..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-10 w-full pl-9 pr-3 text-sm bg-neutral-50 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all placeholder:text-neutral-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mr-1 inline-flex items-center gap-1">
            <Filter size={11} /> Loại:
          </span>
          {[{ value: 'all', label: 'Tất cả' }, ...TYPE_OPTIONS.slice(0, 6)].map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTypeFilter(t.value)}
              className={`h-7 px-2.5 rounded-full text-xs font-medium border transition ${
                typeFilter === t.value
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {(searchText || typeFilter !== 'all') && (
          <button
            type="button"
            onClick={() => { setSearchText(''); setTypeFilter('all') }}
            className="inline-flex items-center gap-1 h-8 px-2 rounded-md text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"
          >
            <X size={12} /> Xoá lọc
          </button>
        )}

        <div className="ml-auto flex items-center bg-neutral-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setView('tree')}
            className={`px-2.5 h-8 rounded text-xs font-semibold inline-flex items-center gap-1 transition ${
              view === 'tree' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500'
            }`}
          >
            <GitBranch size={13} /> Cây gia phả
          </button>
          <button
            type="button"
            onClick={() => setView('table')}
            className={`px-2.5 h-8 rounded text-xs font-semibold inline-flex items-center gap-1 transition ${
              view === 'table' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500'
            }`}
          >
            <List size={13} /> Bảng
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-12 flex items-center justify-center bg-white border border-neutral-200 rounded-2xl">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 bg-white border border-neutral-200 rounded-2xl flex flex-col items-center justify-center text-center">
          <Building2 size={40} className="text-neutral-300 mb-3" />
          <h3 className="text-base font-semibold text-neutral-700">
            {dataList.length === 0 ? 'Chưa có tổ chức nào' : 'Không tìm thấy'}
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            {dataList.length === 0
              ? 'Tạo công ty chủ quản đầu tiên để bắt đầu.'
              : 'Thử điều chỉnh bộ lọc.'}
          </p>
          {dataList.length === 0 && (
            <Button onClick={() => handleOpenCreate()} className="mt-4 gap-2 bg-primary-600 hover:bg-primary-700 text-white">
              <Plus size={16} /> Thêm công ty đầu tiên
            </Button>
          )}
        </div>
      ) : view === 'tree' ? (
        <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-sm">
          <div className="space-y-1">
            {treeRoots.map((node) => (
              <OrgTreeNode
                key={node.id}
                node={node}
                depth={0}
                onView={setDetailOrg}
                onEdit={handleOpenEdit}
                onAddChild={(parent) => handleOpenCreate(parent.id)}
                onDelete={setConfirmDel}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <AppTable
            data={filteredList}
            isLoading={false}
            showSearch={false}
            columns={[
              {
                title: 'Mã', dataIndex: 'code',
                render: (v: string) => (
                  <span className="font-mono text-xs font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                    {v}
                  </span>
                ),
              },
              {
                title: 'Tên tổ chức', dataIndex: 'name',
                render: (_: any, row: any) => (
                  <button
                    onClick={() => setDetailOrg(row)}
                    className="text-left group"
                  >
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
                title: 'Loại', dataIndex: 'type',
                render: (v: string) => (
                  <span className="text-xs">
                    {TYPE_OPTIONS.find((t) => t.value === v)?.label || v}
                  </span>
                ),
              },
              { title: 'Email', dataIndex: 'email', render: (v: string) => v || '—' },
              { title: 'MST', dataIndex: 'taxCode', render: (v: string) => v ? <span className="font-mono text-xs">{v}</span> : '—' },
              {
                title: 'Trạng thái', dataIndex: 'status',
                render: (v: string) => {
                  const cfg = STATUS_LABEL[v] || STATUS_LABEL.INACTIVE
                  return (
                    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${cfg.className}`}>
                      {cfg.text}
                    </span>
                  )
                },
              },
              {
                title: 'Thao tác', dataIndex: 'id', width: 160,
                render: (_: any, row: any) => (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailOrg(row)}
                      className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Xem chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(row)}
                      className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition"
                      title="Sửa"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDel(row)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      title="Xoá"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* ==================== Modals ==================== */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedItem?.id ? 'Chỉnh sửa tổ chức' : 'Thêm tổ chức mới'}
        description={selectedItem?.id ? undefined : 'Điền thông tin để đăng ký pháp nhân/chi nhánh mới.'}
        maxWidth="4xl"
      >
        <AppForm
          schema={orgSchema}
          defaultValues={formDefaults}
          onSubmit={handleSubmit}
          fields={[
            { name: 'code', label: 'Mã tổ chức', required: true, placeholder: 'VD: ORG001', description: 'UPPERCASE, không dấu' },
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
          onCancel={() => setModalOpen(false)}
        />
      </AppModal>

      <OrganizationDetailDrawer
        isOpen={!!detailOrg}
        org={detailOrg}
        allOrgs={dataList}
        onClose={() => setDetailOrg(null)}
        onEdit={handleOpenEdit}
        onDelete={setConfirmDel}
        onSelectChild={(child) => setDetailOrg(child)}
      />

      <ConfirmDialog
        isOpen={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        title="Xoá tổ chức"
        message={confirmDel ? `Xoá tổ chức "${confirmDel.name}"? Không xoá được nếu đang có hợp đồng/nhân viên tham chiếu.` : ''}
        variant="danger"
        confirmText="Xoá"
        cancelText="Huỷ"
      />
    </div>
  )
}

// ============================================================
// Tree Node
// ============================================================

interface OrgTreeNodeProps {
  node: any
  depth: number
  onView: (o: any) => void
  onEdit: (o: any) => void
  onAddChild: (parent: any) => void
  onDelete: (o: any) => void
}

function OrgTreeNode({ node, depth, onView, onEdit, onAddChild, onDelete }: OrgTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = node.children && node.children.length > 0
  const statusCfg = STATUS_LABEL[node.status || 'ACTIVE'] || STATUS_LABEL.ACTIVE
  const typeLabel = TYPE_OPTIONS.find((t) => t.value === node.type)?.label || node.type

  return (
    <div>
      {/* Node row */}
      <div
        className={`group flex items-center gap-2 rounded-lg hover:bg-neutral-50 transition-colors ${
          depth === 0 ? 'bg-neutral-50/40' : ''
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Toggle */}
        <button
          type="button"
          onClick={() => hasChildren && setExpanded((v) => !v)}
          className={`w-5 h-5 shrink-0 flex items-center justify-center rounded ${
            hasChildren ? 'text-neutral-400 hover:text-primary-600 hover:bg-neutral-200' : 'text-transparent cursor-default'
          }`}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />
          ) : (
            <span className="w-1 h-1 rounded-full bg-neutral-300" />
          )}
        </button>

        {/* Avatar */}
        <button
          type="button"
          onClick={() => onView(node)}
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${pickTone(node.name)} flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm`}
          title="Xem chi tiết"
        >
          {getInitials(node.shortName || node.name)}
        </button>

        {/* Info */}
        <button
          type="button"
          onClick={() => onView(node)}
          className="flex-1 min-w-0 flex items-center gap-2 py-2 pr-2 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-neutral-800 truncate group-hover:text-primary-700 transition-colors">
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
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
              <span>{typeLabel}</span>
              {node.email && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="truncate">{node.email}</span>
                </>
              )}
              {hasChildren && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="text-primary-600 font-medium">
                    {node.children.length} đơn vị con
                  </span>
                </>
              )}
            </div>
          </div>
        </button>

        {/* Status */}
        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border shrink-0 ${statusCfg.className}`}>
          {statusCfg.text}
        </span>

        {/* Hover actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pr-2">
          <button
            type="button"
            onClick={() => onAddChild(node)}
            className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition"
            title="Thêm đơn vị con"
          >
            <Plus size={13} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(node)}
            className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition"
            title="Sửa"
          >
            <Edit size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(node)}
            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
            title="Xoá"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="mt-0.5 space-y-0.5 border-l border-dashed border-neutral-200 ml-[13px]">
          {node.children.map((child: any) => (
            <OrgTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
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

/**
 * Build tree từ filteredList. Nếu con match nhưng parent không match → tự đưa parent lên root
 * để tránh mất context (mượn từ pattern DepartmentsPage).
 */
function buildTree(filteredList: any[], allList: any[]): any[] {
  const nodeMap = new Map<string, any>()
  filteredList.forEach((item) => nodeMap.set(item.id, { ...item, children: [] }))

  // Nếu parent nằm ngoài filtered (do search) → include parent for context
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

  // Sort by orderIndex then name
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

/** Set ID của tổ chức bản thân + tất cả con cháu — tránh tự đặt làm cha (cycle) */
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
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-orange-500 to-rose-600',
    'from-pink-500 to-fuchsia-600',
    'from-cyan-500 to-blue-600',
    'from-amber-500 to-orange-600',
  ]
  const s = (seed || '?').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return tones[s % tones.length]
}
