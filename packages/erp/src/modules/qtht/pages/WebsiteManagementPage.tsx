import { useState, useEffect } from 'react'
import { LayoutTemplate, FileText, Image, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button, Input, Label, AppModal } from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import { AppForm } from '@/components/shared/AppForm'
import { useForm } from 'react-hook-form'
import { useLandingConfig, useUpdateLandingConfig } from '../hooks/useLandingConfig'
import {
  useArticles,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
} from '@/modules/articles/hooks/useArticle'
import { articleFormSchema, type ArticleFormValues } from '@/modules/articles/constants/schema'
import {
  useBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
} from '../hooks/useBanner'
import { bannerFormSchema, type BannerFormValues } from '../constants/banner.schema'

const TABS = [
  { key: 'config', label: 'Cấu hình trang', icon: LayoutTemplate },
  { key: 'articles', label: 'Quản lý bài viết', icon: FileText },
  { key: 'banners', label: 'Quản lý Banner', icon: Image },
]

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
]

const BANNER_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Ẩn' },
]

const BANNER_POSITION_OPTIONS = [
  { value: 'hero', label: 'Hero Slider' },
  { value: 'promo', label: 'Khuyến mãi' },
  { value: 'banner', label: 'Banner phụ' },
]

const FORM_SECTIONS = [
  {
    title: 'Thương hiệu & Nhận diện',
    fields: [
      { name: 'brandName', label: 'Tên thương hiệu', placeholder: 'Frezo - Cung ứng thực phẩm toàn quốc' },
      { name: 'logoUrl', label: 'URL Logo', placeholder: '/logo.png' },
      { name: 'primaryColor', label: 'Màu chủ đạo', placeholder: '#16a34a' },
    ]
  },
  {
    title: 'Liên hệ & Vận chuyển',
    fields: [
      { name: 'contactEmail', label: 'Email liên hệ', placeholder: 'hotro@frezo.vn' },
      { name: 'contactPhone', label: 'SĐT Hotline', placeholder: '1900 6868' },
      { name: 'contactAddress', label: 'Địa chỉ', placeholder: '76 Đường số 7, Khu phố 5, Bình Trưng, TP HCM' },
      { name: 'workingHours', label: 'Giờ làm việc', placeholder: 'Thứ 2 - Chủ nhật: 7:00 - 21:00' },
      { name: 'shippingPolicy', label: 'Chính sách giao hàng', placeholder: 'Giao hàng miễn phí cho đơn từ 500.000đ' },
    ]
  },
  {
    title: 'Hero Section',
    fields: [
      { name: 'heroTitle', label: 'Tiêu đề Hero' },
      { name: 'heroSubtitle', label: 'Phụ đề Hero' },
    ]
  },
  {
    title: 'Blog',
    fields: [
      { name: 'blogTitle', label: 'Tiêu đề Blog' },
      { name: 'blogSubtitle', label: 'Phụ đề Blog' },
    ]
  },
  {
    title: 'Sản phẩm',
    fields: [
      { name: 'productTitle', label: 'Tiêu đề Sản phẩm' },
      { name: 'productSubtitle', label: 'Phụ đề Sản phẩm' },
    ]
  },
  {
    title: 'Quy trình',
    fields: [
      { name: 'opsTitle', label: 'Tiêu đề Quy trình' },
      { name: 'opsSubtitle', label: 'Phụ đề Quy trình' },
    ]
  },
  {
    title: 'Newsletter',
    fields: [
      { name: 'newsletterTitle', label: 'Tiêu đề Newsletter' },
      { name: 'newsletterSubtitle', label: 'Phụ đề Newsletter' },
    ]
  },
  {
    title: 'Giới thiệu & Footer',
    fields: [
      { name: 'aboutUs', label: 'Giới thiệu', placeholder: 'Đoạn giới thiệu ngắn về công ty' },
      { name: 'footerText', label: 'Footer text', placeholder: '© 2026 Frezo - Cung ứng thực phẩm toàn quốc' },
    ]
  },
]

function ConfigTab() {
  const { data, isLoading } = useLandingConfig()
  const updateReq = useUpdateLandingConfig()

  const { register, handleSubmit, reset } = useForm({
    defaultValues: Object.fromEntries(
      FORM_SECTIONS.flatMap(s => s.fields).map(f => [f.name, ''])
    )
  })

  useEffect(() => {
    if (data) reset(data)
  }, [data, reset])

  const onSubmit = (formData: any) => {
    updateReq.mutate(formData)
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 max-w-4xl shadow-sm">
      {isLoading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary-600" /></div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {FORM_SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 pb-2 border-b border-neutral-100">{section.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map(field => (
                  <div key={field.name} className="space-y-1.5">
                    <Label>{field.label}</Label>
                    <Input {...register(field.name)} placeholder={field.placeholder} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-4 border-t border-neutral-200">
            <Button type="submit" disabled={updateReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white min-w-[120px]">
              {updateReq.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : 'Lưu cấu hình'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

function ArticlesTab() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)

  const { data: rawData, isLoading } = useArticles()
  const createReq = useCreateArticle()
  const updateReq = useUpdateArticle()
  const deleteReq = useDeleteArticle()

  const dataList = rawData || []

  const handleSubmit = (values: ArticleFormValues) => {
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: values }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  const columns = [
    { title: 'Tiêu đề', dataIndex: 'title', filterType: 'text' },
    { title: 'Tóm tắt', dataIndex: 'summary', filterType: 'text' },
    { title: 'Loại', dataIndex: 'type', filterType: 'text' },
    {
      title: 'Trạng thái', dataIndex: 'status',
      filterType: 'select', filterOptions: STATUS_OPTIONS,
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          DRAFT: 'bg-neutral-100 text-neutral-600',
          PUBLISHED: 'bg-green-50 text-green-700',
          ARCHIVED: 'bg-yellow-50 text-yellow-700',
        }
        const labelMap: Record<string, string> = {
          DRAFT: 'Bản nháp',
          PUBLISHED: 'Đã xuất bản',
          ARCHIVED: 'Lưu trữ',
        }
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[val] || 'bg-neutral-100 text-neutral-500'}`}>
            {labelMap[val] || val}
          </span>
        )
      },
    },
    {
      title: 'Ngày tạo', dataIndex: 'createdDate',
      render: (val: string) => val ? new Date(val).toLocaleDateString('vi-VN') : '---',
    },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(row); setModalOpen(true) }}>
            <Pencil className="w-4 h-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { if (confirm('Xóa bài viết này?')) deleteReq.mutate(row.id) }}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  const formFields = [
    { name: 'title', label: 'Tiêu đề', required: true },
    { name: 'summary', label: 'Tóm tắt' },
    { name: 'content', label: 'Nội dung' },
    { name: 'type', label: 'Loại bài viết' },
    { name: 'status', label: 'Trạng thái', type: 'select', options: STATUS_OPTIONS },
    { name: 'tags', label: 'Thẻ' },
    { name: 'thumbnailUrl', label: 'URL Ảnh đại diện' },
    { name: 'authorId', label: 'Tác giả' },
    { name: 'orgId', label: 'Đơn vị' },
    { name: 'publishedDate', label: 'Ngày xuất bản', type: 'date' },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Quản lý Bài viết</h2>
          <p className="text-sm text-neutral-500">Quản lý tin tức, bài viết trên hệ thống</p>
        </div>
        <Button onClick={() => { setSelectedItem(null); setModalOpen(true) }} className="bg-primary-600 hover:bg-primary-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Thêm mới
        </Button>
      </div>

      <AppTable
        data={dataList}
        columns={columns as any}
        isLoading={isLoading}
        showSearch={true}
        searchPlaceholder="Tìm theo tiêu đề, tóm tắt..."
      />

      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Cập nhật Bài viết' : 'Thêm Bài viết mới'} maxWidth="4xl">
        <AppForm
          schema={articleFormSchema}
          defaultValues={selectedItem || { title: '', summary: '', content: '', type: '', status: 'DRAFT', tags: '', thumbnailUrl: '', authorId: '', orgId: '', publishedDate: '' }}
          onSubmit={handleSubmit}
          fields={formFields}
          isLoading={createReq.isPending || updateReq.isPending}
          submitText={selectedItem ? 'Cập nhật' : 'Thêm mới'}
        />
      </AppModal>
    </>
  )
}

function BannersTab() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)

  const { data: rawData, isLoading } = useBanners()
  const createReq = useCreateBanner()
  const updateReq = useUpdateBanner()
  const deleteReq = useDeleteBanner()

  const dataList = rawData || []

  const handleSubmit = (values: BannerFormValues) => {
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: values }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  const columns = [
    {
      title: 'Hình ảnh', dataIndex: 'imageUrl',
      render: (val: string) => val ? (
        <img src={val} alt="banner" className="w-20 h-12 object-cover rounded border border-neutral-200" />
      ) : (
        <div className="w-20 h-12 bg-neutral-100 rounded flex items-center justify-center text-neutral-400 text-xs">No img</div>
      ),
    },
    { title: 'Tiêu đề', dataIndex: 'title', filterType: 'text' },
    { title: 'Phụ đề', dataIndex: 'subtitle', filterType: 'text' },
    {
      title: 'Vị trí', dataIndex: 'position',
      filterType: 'select', filterOptions: BANNER_POSITION_OPTIONS,
      render: (val: string) => {
        const map: Record<string, string> = { hero: 'Hero Slider', promo: 'Khuyến mãi', banner: 'Banner phụ' }
        return map[val] || val
      },
    },
    {
      title: 'Trạng thái', dataIndex: 'status',
      filterType: 'select', filterOptions: BANNER_STATUS_OPTIONS,
      render: (val: string) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${val === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
          {val === 'ACTIVE' ? 'Hoạt động' : 'Ẩn'}
        </span>
      ),
    },
    { title: 'Thứ tự', dataIndex: 'orderIndex' },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(row); setModalOpen(true) }}>
            <Pencil className="w-4 h-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { if (confirm('Xóa banner này?')) deleteReq.mutate(row.id) }}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  const formFields = [
    { name: 'title', label: 'Tiêu đề', required: true },
    { name: 'subtitle', label: 'Phụ đề' },
    { name: 'imageUrl', label: 'URL Hình ảnh', required: true },
    { name: 'linkUrl', label: 'Đường dẫn (khi click)' },
    { name: 'position', label: 'Vị trí', type: 'select', options: BANNER_POSITION_OPTIONS },
    { name: 'status', label: 'Trạng thái', type: 'select', options: BANNER_STATUS_OPTIONS },
    { name: 'orderIndex', label: 'Thứ tự hiển thị', type: 'number' },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Quản lý Banner</h2>
          <p className="text-sm text-neutral-500">Quản lý banner quảng cáo, slider trên trang chủ</p>
        </div>
        <Button onClick={() => { setSelectedItem(null); setModalOpen(true) }} className="bg-primary-600 hover:bg-primary-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Thêm mới
        </Button>
      </div>

      <AppTable
        data={dataList}
        columns={columns as any}
        isLoading={isLoading}
        showSearch={true}
        searchPlaceholder="Tìm theo tiêu đề..."
      />

      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Cập nhật Banner' : 'Thêm Banner mới'} maxWidth="2xl">
        <AppForm
          schema={bannerFormSchema}
          defaultValues={selectedItem || { title: '', subtitle: '', imageUrl: '', linkUrl: '', position: 'hero', status: 'ACTIVE', orderIndex: 0 }}
          onSubmit={handleSubmit}
          fields={formFields}
          isLoading={createReq.isPending || updateReq.isPending}
          submitText={selectedItem ? 'Cập nhật' : 'Thêm mới'}
        />
      </AppModal>
    </>
  )
}

export function WebsiteManagementPage() {
  const [activeTab, setActiveTab] = useState('config')

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <LayoutTemplate className="text-primary-600" />
          Quản lý Trang Web
        </h2>
        <p className="text-sm text-neutral-500 mt-1">Quản lý nội dung hiển thị trên landing page</p>
      </div>

      <div className="flex gap-1 border-b border-neutral-200">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="pt-2">
        {activeTab === 'config' && <ConfigTab />}
        {activeTab === 'articles' && <ArticlesTab />}
        {activeTab === 'banners' && <BannersTab />}
      </div>
    </div>
  )
}
