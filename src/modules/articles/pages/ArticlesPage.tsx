import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@/components/ui/button'
import {
  useArticles,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
} from '../hooks/useArticle'
import { articleFormSchema, type ArticleFormValues } from '../constants/schema'

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
]

export function ArticlesPage() {
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Quản lý Bài viết</h1>
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
    </div>
  )
}
