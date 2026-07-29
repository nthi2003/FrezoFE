import type { PageGuideConfig } from '@frezo/ui'

/**
 * Guide cho 2 màn đọc tin của Home portal (/bai-viet, /bai-viet/:id).
 * Không đặt `docHref` vì BE chưa có slug guide riêng cho bản đọc —
 * PageGuide sẽ hiển thị nội dung local; link tài liệu để ở section "Liên quan".
 */
export const ARTICLES_READER_GUIDE: PageGuideConfig = {
  title: 'Tin & bài viết',
  subtitle: 'Đọc thông báo và bài viết nội bộ đã được xuất bản.',
  sections: [
    {
      type: 'steps',
      heading: 'Cách dùng',
      steps: [
        {
          title: 'Chọn bài từ danh sách',
          description:
            'Danh sách sắp xếp theo ngày xuất bản mới nhất. Bấm vào một dòng để đọc toàn văn.',
        },
        {
          title: 'Quay lại khi đọc xong',
          description:
            'Dùng breadcrumb ở đầu trang (Trang chủ / Tin & bài viết) hoặc nút Quay lại để về danh sách.',
        },
        {
          title: 'Không thấy bài cần tìm',
          description:
            'Chỉ bài đã xuất bản mới hiện ở đây. Bài nháp hoặc chờ duyệt chỉ xem được trong màn Quản lý bài viết.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo',
      tips: [
        'Trang bài viết mở lỗi → bấm "Thử lại", thường do mạng chập chờn.',
        'Bài đã gỡ hoặc chưa xuất bản sẽ báo "Không tìm thấy bài viết".',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [{ label: 'Hướng dẫn quản lý bài viết', href: '/docs/guide-articles' }],
    },
  ],
}
