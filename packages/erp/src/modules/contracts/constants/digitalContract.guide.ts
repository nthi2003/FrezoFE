import type { PageGuideConfig } from '@frezo/ui'

/** Hướng dẫn in-app — Hợp đồng số (khớp /docs/guide-contract-digital) */
export const DIGITAL_CONTRACT_GUIDE: PageGuideConfig = {
  title: 'Hợp đồng số & ký điện tử',
  subtitle:
    'Soạn từ mẫu → trình duyệt nội bộ → gửi ký số → xác thực CA → lưu kho HĐ & nhắc gia hạn.',
  docHref: '/docs/guide-contract-digital',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình 5 bước',
      steps: [
        {
          title: 'Soạn thảo hợp đồng',
          description: 'Chọn mẫu theo loại HĐ — điền placeholder nhân sự, lương, thời hạn.',
        },
        {
          title: 'Trình duyệt nội bộ',
          description: 'Pháp chế, kế toán, ban giám đốc — trạng thái PENDING_APPROVAL.',
        },
        {
          title: 'Gửi ký số cho các bên',
          description: 'Route ký OTP / nền tảng ký số — `/qlns/contract/sign/:id`.',
        },
        {
          title: 'Xác thực chữ ký số',
          description: 'Kiểm tra chứng thư số từ CA cấp phép — audit log sau khi ký.',
        },
        {
          title: 'Lưu trữ & cập nhật trạng thái',
          description: 'Kho HĐ điện tử ACTIVE/COMPLETED — nhắc gia hạn trước 30 ngày.',
        },
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn đầy đủ', href: '/docs/guide-contract-digital' },
        { label: 'Danh sách HĐ', href: '/qlns/contract' },
        { label: 'Hộp thư duyệt', href: '/approval/inbox' },
      ],
    },
  ],
}
