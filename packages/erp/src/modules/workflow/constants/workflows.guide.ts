import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app cho trang thiết kế quy trình + designer
 */
export const WORKFLOWS_GUIDE: PageGuideConfig = {
  title: 'Thiết kế quy trình',
  subtitle:
    'Cấu hình bước duyệt theo module — đơn hàng ngày duyệt ở Hộp thư duyệt.',
  docHref: '/docs/guide-workflows',
  sections: [
    {
      type: 'steps',
      heading: 'Cấu hình — checklist',
      steps: [
        {
          title: 'Mã (code) duy nhất',
          description:
            'Chữ HOA, số, gạch dưới (VD: ASSET_TRANSFER_DEFAULT). Không đổi sau khi đã có yêu cầu đang chạy.',
        },
        {
          title: 'Tên + module',
          description:
            'Tên dễ hiểu; chọn đúng module (ASSET, LEAVE, CONTRACT…). Module gắn với nơi nghiệp vụ khởi tạo duyệt.',
        },
        {
          title: 'Thêm ít nhất 1 bước duyệt',
          description:
            'Mỗi bước: tên rõ (VD: “HR duyệt”) + loại người duyệt. USER/ROLE bắt buộc chọn giá trị; MANAGER/ADMIN tự resolve.',
        },
        {
          title: 'Bật Active rồi Lưu',
          description:
            'Chỉ quy trình đang bật mới dùng cho yêu cầu mới. Yêu cầu cũ giữ snapshot bước lúc tạo.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Tránh cấu hình sai',
      tips: [
        'Cần duyệt đơn hôm nay → mở Hộp thư duyệt (không mở trang thiết kế).',
        'Module đã có luồng duyệt riêng → đừng tạo quy trình trùng nghiệp vụ.',
        'Trước khi Lưu: kiểm tra role/user tồn tại, SLA hợp lý, không để bước trống.',
        'Copy quy trình cũ rồi sửa nhẹ thường an toàn hơn tạo từ đầu.',
      ],
    },
    {
      type: 'links',
      heading: 'Tài liệu & liên quan',
      links: [
        { label: 'Xem tài liệu đầy đủ (Docs Hub)', href: '/docs/guide-workflows' },
        { label: 'Hộp thư duyệt', href: '/approval/inbox' },
        { label: 'Cấu hình luồng duyệt', href: '/approval/flows' },
      ],
    },
  ],
}
