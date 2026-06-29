import { useNavigate } from 'react-router-dom'
import { Eye, ExternalLink, Plus } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { Button } from '@frezo/ui'
import { useArticles } from '@/modules/articles/hooks/useArticle'

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
]

const TYPE_OPTIONS = [
  { value: 'news', label: 'Tin tức' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'blog', label: 'Blog' },
  { value: 'promotion', label: 'Khuyến mãi' },
  { value: 'recruitment', label: 'Tuyển dụng' },
]

export function NewsPage() {
  const navigate = useNavigate()
  const { data: rawData, isLoading } = useArticles()
  const dataList = rawData || []

  const columns = [
    { title: 'Tiêu đề', dataIndex: 'title', filterType: 'text' as const },
    { title: 'Loại', dataIndex: 'type', filterType: 'select' as const, filterOptions: TYPE_OPTIONS },
    {
      title: 'Trạng thái', dataIndex: 'status',
      filterType: 'select' as const, filterOptions: STATUS_OPTIONS,
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
      title: 'Ngày xuất bản', dataIndex: 'publishedDate',
      render: (val: string) => val ? new Date(val).toLocaleDateString('vi-VN') : '---',
    },
    {
      title: 'Thao tác', dataIndex: 'id',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => window.open(`/bai-viet/${row.id}`, '_blank')}>
            <Eye className="w-4 h-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => window.open(`/bai-viet/${row.id}/chinh-sua`, '_blank')}>
            <ExternalLink className="w-4 h-4 text-neutral-500" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Tin tức & Sự kiện</h1>
          <p className="text-sm text-neutral-500 mt-1">Danh sách tin tức, bài viết trên hệ thống</p>
        </div>
        <Button onClick={() => navigate('/qtht/tin-tuc/tao-moi')} className="bg-primary-600 hover:bg-primary-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Thêm mới
        </Button>
      </div>

      <AppTable
        data={dataList}
        columns={columns as any}
        isLoading={isLoading}
        showSearch={true}
        searchPlaceholder="Tìm theo tiêu đề, nội dung..."
      />
    </div>
  )
}
