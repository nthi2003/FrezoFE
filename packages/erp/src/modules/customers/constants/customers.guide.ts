import type { PageGuideConfig } from '@frezo/ui'

export const CUSTOMERS_GUIDE: PageGuideConfig = {
  title: 'Khách hàng (CRM)',
  subtitle:
    'Danh bạ khách hàng — cá nhân & doanh nghiệp. Tích hợp AI Inbox để tự động thu thập & phản hồi khách từ Facebook.',
  sections: [
    {
      type: 'steps',
      heading: 'Cách thêm khách hàng',
      steps: [
        {
          title: 'Nhập thủ công',
          description:
            'Bấm "Thêm mới" → điền tên, SĐT, email, mã số thuế. Tối thiểu chỉ cần tên; các trường khác có thể bổ sung sau.',
        },
        {
          title: 'Import CSV',
          description:
            'Dùng "Import" ở toolbar để nhập hàng loạt từ file. Chuẩn cột: name, phone, email, address, taxCode, note.',
        },
        {
          title: 'AI Sync từ Facebook',
          description:
            'Bấm "AI Sync" — hệ thống quét inbox Facebook, trích xuất tên/SĐT/địa chỉ, tự tạo record khách hàng và merge trùng lặp.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo dùng',
      tips: [
        'SĐT khách hiển thị mờ (mask) mặc định — bấm biểu tượng mắt để reveal (backend ghi log ai xem, khi nào).',
        'Dùng cột "Ghi chú" để log lịch sử tương tác quan trọng: cuộc gọi, khiếu nại, ưu đãi đặc biệt...',
        'Export CSV để backup định kỳ hoặc gửi cho team marketing chạy chiến dịch.',
      ],
    },
    {
      type: 'notes',
      heading: 'Bảo mật dữ liệu',
      notes:
        'SĐT & email khách hàng là PII (thông tin cá nhân) — chỉ nhân viên có quyền mới xem. Hệ thống log mọi hành động reveal-phone. Không share file export ra ngoài công ty.',
    },
  ],
}
