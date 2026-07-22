import type { PageGuideConfig } from '@frezo/ui'

export const CONTRACTS_GUIDE: PageGuideConfig = {
  title: 'Hợp đồng lao động',
  subtitle:
    'Quản lý vòng đời hợp đồng: soạn thảo → phê duyệt → hiệu lực → gia hạn / kết thúc. Tích hợp AI biên tập và trích xuất DOCX/PDF.',
  sections: [
    {
      type: 'steps',
      heading: 'Vòng đời hợp đồng',
      steps: [
        {
          title: 'Soạn thảo (DRAFT)',
          description:
            'Bấm "Thêm mới" → chọn mẫu / tải file / soạn từ đầu. Điền thông tin nhân sự, doanh nghiệp, lương & bảo hiểm — hệ thống tự chèn placeholder.',
        },
        {
          title: 'Gửi duyệt (PENDING_APPROVAL)',
          description:
            'Chọn người phê duyệt ở bước 2 → hợp đồng chuyển trạng thái "Chờ duyệt". Manager nhận thông báo và duyệt trong màn hình này.',
        },
        {
          title: 'Phê duyệt / Từ chối',
          description:
            'Manager bấm ✅ để đưa vào hiệu lực (ACTIVE), hoặc ❌ ghi lý do để từ chối (REJECTED). Có thể xem lịch sử version.',
        },
        {
          title: 'Kết thúc / Gia hạn',
          description:
            'Trạng thái ACTIVE có thể chuyển COMPLETED (hết hạn), SUSPENDED (tạm dừng) hoặc CANCELLED (hủy). Hợp đồng đã COMPLETED không sửa được nữa.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo dùng',
      tips: [
        'Dùng mẫu có sẵn để tăng tốc 5×. Bấm "Lưu mẫu" trong màn tạo để tái sử dụng cho HĐ tương lai.',
        'Trước khi gửi duyệt, kiểm tra tab "Lương & BH" — hệ thống tự tính BHXH/BHYT/BHTN theo lương cơ bản.',
        'Có thể upload DOCX/PDF, AI sẽ tự trích xuất mã HĐ, ngày, tên nhân sự, lương... Tiết kiệm 80% thời gian nhập liệu.',
      ],
    },
    {
      type: 'notes',
      heading: 'Cảnh báo hết hạn',
      notes:
        'Hợp đồng ACTIVE có ngày kết thúc trong vòng 30 ngày sẽ hiển thị nhãn "Sắp hết hạn" (cam). Manager nên chủ động gia hạn trước ít nhất 15 ngày để tránh gián đoạn hợp đồng lao động.',
    },
  ],
}
