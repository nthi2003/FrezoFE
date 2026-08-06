import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Image as ImageIcon,
  Quote,
  Newspaper,
  Pin,
  Plus,
  Search,
} from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Input,
  Label,
  AppModal,
  PageHeader,
  RowActions,
  Select,
  Switch,
} from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import { usePermission } from '@/lib/hooks/usePermission'
import { useQuery } from '@tanstack/react-query'
import { unwrapList } from '@frezo/utils'
import { organizationApi } from '@/modules/qtht/services/qthtApi'
import {
  useBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
} from '@/modules/qtht/hooks/useBanner'
import { bannerFormSchema, type BannerFormValues } from '@/modules/qtht/constants/banner.schema'
import {
  useArticles,
  useDeleteArticle,
  useToggleArticleDisplayOnNews,
} from '@/modules/articles/hooks/useArticle'
import {
  useNewsMottos,
  useCreateNewsMotto,
  useUpdateNewsMotto,
  useDeleteNewsMotto,
  useNewsPins,
  usePinArticle,
  useUnpinArticle,
} from '../hooks/useNews'
import { AppForm } from '@/components/shared/AppForm'
import { OrganizationTreePicker } from '../components/OrganizationTreePicker'

const TABS = [
  { key: 'banners', label: 'Banner', icon: ImageIcon },
  { key: 'mottos', label: 'Châm ngôn', icon: Quote },
  { key: 'news', label: 'Tin tức', icon: Newspaper },
  { key: 'pins', label: 'Ghim tin', icon: Pin },
] as const

type TabKey = (typeof TABS)[number]['key']

function BannerTab() {
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const { data: rawData, isLoading } = useBanners()
  const createReq = useCreateBanner()
  const updateReq = useUpdateBanner()
  const deleteReq = useDeleteBanner()

  const { data: orgOptions = [] } = useQuery({
    queryKey: ['organizations-combobox'],
    queryFn: () => organizationApi.getCombobox(),
    select: (res: any) =>
      unwrapList(res).map((o: any) => ({
        value: o.value ?? o.id,
        label: o.label ?? o.name,
      })),
  })

  const rows = (rawData || []).filter((b: any) => b.pinForNewsPage || b.position === 'news')

  const openCreate = () => {
    setSelected(null)
    setModalOpen(true)
  }

  const openEdit = (row: any) => {
    setSelected(row)
    setModalOpen(true)
  }

  const handleSubmit = (values: BannerFormValues) => {
    const payload = { ...values, position: 'news', pinForNewsPage: true }
    if (selected?.id) {
      updateReq.mutate({ id: selected.id, data: payload }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      render: (val: string, row: any) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <img src={row.imageUrl} alt="" className="w-14 h-9 object-cover rounded border" />
          ) : null}
          <span className="font-medium">{val}</span>
        </div>
      ),
    },
    { title: 'Liên kết', dataIndex: 'linkUrl', render: (v: string) => v || '—' },
    {
      title: 'Đơn vị',
      dataIndex: 'organizationId',
      render: (v: string) => orgOptions.find((o) => o.value === v)?.label || 'Toàn hệ thống',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (v: string) => (v === 'ACTIVE' ? 'Hoạt động' : 'Ẩn'),
    },
    {
      title: '',
      dataIndex: 'id',
      width: 100,
      render: (_: any, row: any) => (
        <RowActions
          actions={[
            { kind: 'edit', onClick: () => openEdit(row) },
            {
              kind: 'delete',
              onClick: () =>
                askConfirm({
                  title: 'Xóa banner?',
                  message: `Banner "${row.title}" sẽ bị xóa.`,
                  confirmText: 'Xóa',
                  onConfirm: () => deleteReq.mutate(row.id),
                }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <p className="text-sm text-neutral-600">Banner carousel trên trang Tin tức (/bai-viet)</p>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} /> Thêm banner
          </Button>
        </div>
        {rows.length === 0 && !isLoading ? (
          <div className="p-10">
            <EmptyState
              icon={ImageIcon}
              title="Chưa có banner tin tức"
              description="Tạo banner đầu tiên cho trang Tin tức."
              action={{ label: 'Thêm banner', onClick: openCreate }}
            />
          </div>
        ) : (
          <div className="p-4">
            <AppTable data={rows} columns={columns as any} isLoading={isLoading} showSearch={false} />
          </div>
        )}
      </div>

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Sửa banner' : 'Thêm banner tin tức'}
        maxWidth="2xl"
      >
        <AppForm
          key={selected?.id || 'new-banner'}
          schema={bannerFormSchema}
          defaultValues={
            selected || {
              title: '',
              subtitle: '',
              imageUrl: '',
              linkUrl: '',
              position: 'news',
              status: 'ACTIVE',
              orderIndex: rows.length + 1,
              organizationId: '',
              pinForNewsPage: true,
            }
          }
          onSubmit={handleSubmit}
          fields={[
            { name: 'title', label: 'Tiêu đề', required: true },
            {
              name: 'imageUrl',
              label: 'Hình ảnh',
              type: 'image',
              folder: 'banners',
              aspectRatio: '21/9',
              required: true,
              colSpan: 3,
            },
            { name: 'linkUrl', label: 'Liên kết khi click', placeholder: 'https://... hoặc /bai-viet/...' },
            {
              name: 'organizationId',
              label: 'Phạm vi đơn vị',
              type: 'select',
              options: [{ value: '', label: 'Toàn hệ thống' }, ...orgOptions],
            },
            {
              name: 'status',
              label: 'Trạng thái',
              type: 'select',
              options: [
                { value: 'ACTIVE', label: 'Hoạt động' },
                { value: 'INACTIVE', label: 'Ẩn' },
              ],
            },
          ]}
          isLoading={createReq.isPending || updateReq.isPending}
          submitText={selected ? 'Cập nhật' : 'Thêm mới'}
        />
      </AppModal>
      {confirmDialog}
    </>
  )
}

function MottoTab() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const { data: mottos = [], isLoading } = useNewsMottos()
  const createReq = useCreateNewsMotto()
  const updateReq = useUpdateNewsMotto()
  const deleteReq = useDeleteNewsMotto()

  const openCreate = () => {
    setSelected(null)
    setContent('')
    setAuthor('')
    setModalOpen(true)
  }

  const openEdit = (row: any) => {
    setSelected(row)
    setContent(row.content || '')
    setAuthor(row.author || '')
    setModalOpen(true)
  }

  const save = () => {
    const payload = { content: content.trim(), author: author.trim() || undefined }
    if (selected?.id) {
      updateReq.mutate({ id: selected.id, data: payload }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  const columns = [
    { title: 'Nội dung', dataIndex: 'content' },
    { title: 'Tác giả', dataIndex: 'author', width: 180, render: (v: string) => v || '—' },
    {
      title: '',
      dataIndex: 'id',
      width: 100,
      render: (_: any, row: any) => (
        <RowActions
          actions={[
            { kind: 'edit', onClick: () => openEdit(row) },
            { kind: 'delete', onClick: () => setDeleteTarget(row) },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <p className="text-sm text-neutral-600">Châm ngôn hiển thị trên trang Tin tức</p>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} /> Thêm châm ngôn
          </Button>
        </div>
        <div className="p-4">
          <AppTable data={mottos} columns={columns as any} isLoading={isLoading} showSearch={false} />
        </div>
      </div>

      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Sửa châm ngôn' : 'Thêm châm ngôn'}>
        <div className="space-y-4">
          <div>
            <Label>Nội dung</Label>
            <textarea
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm min-h-[100px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập châm ngôn..."
            />
          </div>
          <div>
            <Label>Tác giả</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Tên tác giả" className="mt-1" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Huỷ</Button>
            <Button onClick={save} disabled={!content.trim() || createReq.isPending || updateReq.isPending}>
              {selected ? 'Cập nhật' : 'Thêm'}
            </Button>
          </div>
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteReq.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) })
        }}
        title="Xóa châm ngôn?"
        message="Không thể hoàn tác."
        confirmText="Xóa"
        variant="danger"
        isLoading={deleteReq.isPending}
      />
    </>
  )
}

function NewsTab() {
  const navigate = useNavigate()
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const { data: rawData, isLoading } = useArticles()
  const toggleDisplay = useToggleArticleDisplayOnNews()
  const deleteReq = useDeleteArticle()
  const canDelete = usePermission('QTBV.ARTICLES.DELETE')
  const articles = Array.isArray(rawData) ? rawData : []

  const columns = [
    { title: 'Tiêu đề', dataIndex: 'title' },
    {
      title: 'Hiển thị',
      dataIndex: 'displayOnNews',
      width: 100,
      render: (_: boolean, row: any) => (
        <Switch
          checked={row.displayOnNews !== false}
          disabled={toggleDisplay.isPending}
          onChange={(checked) =>
            toggleDisplay.mutate({ id: row.id, displayOnNews: checked })
          }
        />
      ),
    },
    { title: 'Trạng thái', dataIndex: 'status', width: 120 },
    {
      title: '',
      dataIndex: 'id',
      width: 100,
      render: (_: any, row: any) => (
        <RowActions
          actions={[
            { kind: 'edit', onClick: () => navigate(`/admin/article-management/${row.id}/edit`) },
            {
              kind: 'delete',
              hidden: !canDelete,
              onClick: () =>
                askConfirm({
                  title: 'Xóa bài viết?',
                  message: `Bài "${row.title}" sẽ bị xóa.`,
                  confirmText: 'Xóa',
                  onConfirm: () => deleteReq.mutate(row.id),
                }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <p className="text-sm text-neutral-600">Quản lý tin tức — chỉnh sửa tại trình soạn bài viết</p>
          <Button onClick={() => navigate('/admin/article-management/new')}>Thêm tin mới</Button>
        </div>
        <div className="p-4">
          <AppTable data={articles} columns={columns as any} isLoading={isLoading} showSearch searchPlaceholder="Tìm tiêu đề..." />
        </div>
      </div>
      {confirmDialog}
    </>
  )
}

function PinTab() {
  const [orgId, setOrgId] = useState('')
  const [search, setSearch] = useState('')

  const { data: rawArticles } = useArticles()
  const { data: pins = [] } = useNewsPins(orgId || undefined)
  const pinReq = usePinArticle()
  const unpinReq = useUnpinArticle()

  const published = useMemo(() => {
    const all = Array.isArray(rawArticles) ? rawArticles : []
    return all.filter((a: any) => a.status === 'PUBLISHED')
  }, [rawArticles])

  const pinnedIds = new Set(pins.map((p: any) => p.id))

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase()
    return published.filter((a: any) => {
      if (pinnedIds.has(a.id)) return false
      if (!q) return true
      return (a.title || '').toLowerCase().includes(q)
    })
  }, [published, pinnedIds, search])

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <Label>Chọn đơn vị</Label>
        <OrganizationTreePicker value={orgId || undefined} onChange={setOrgId} className="mt-2" />
        <p className="mt-2 text-xs text-neutral-500">Tối đa 5 tin ghim / đơn vị. Chỉ tin đã xuất bản mới ghim được.</p>
      </div>

      {orgId && (
        <>
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="text-sm font-semibold mb-3">Đang ghim ({pins.length}/5)</h3>
            {pins.length === 0 ? (
              <p className="text-sm text-neutral-500">Chưa ghim tin nào cho đơn vị này.</p>
            ) : (
              <ul className="space-y-2">
                {pins.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                    <span className="text-sm truncate">{a.title}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={unpinReq.isPending}
                      onClick={() => unpinReq.mutate({ organizationId: orgId, articleId: a.id })}
                    >
                      Bỏ ghim
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-semibold">Tìm tin để ghim</h3>
            <div className="relative max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" placeholder="Tìm tiêu đề..." />
            </div>
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {candidates.slice(0, 20).map((a: any) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                  <span className="text-sm truncate">{a.title}</span>
                  <Button
                    size="sm"
                    disabled={pins.length >= 5 || pinReq.isPending}
                    onClick={() => pinReq.mutate({ articleId: a.id, organizationId: orgId })}
                  >
                    Ghim
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

export function NewsUtilitiesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('banners')
  const canManage = usePermission('QTBV.ARTICLES.UPDATE')

  if (!canManage) {
    return (
      <div className="p-6">
        <EmptyState title="Không có quyền truy cập" description="Liên hệ Admin để được cấp quyền quản lý tin tức." />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <PageHeader
        title="Tiện ích — Tin tức"
        description="Cấu hình banner, châm ngôn, tin tức và ghim tin theo đơn vị."
      />

      <div className="flex gap-1 border-b border-neutral-200">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = tab.key === activeTab
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'banners' && <BannerTab />}
      {activeTab === 'mottos' && <MottoTab />}
      {activeTab === 'news' && <NewsTab />}
      {activeTab === 'pins' && <PinTab />}
    </div>
  )
}
