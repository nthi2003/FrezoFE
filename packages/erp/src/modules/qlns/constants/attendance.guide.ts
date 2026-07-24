import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app — Chấm công nhân viên (giọng EU)
 * Cấu hình GPS/WiFi (Admin): /docs/guide-attendance-settings
 */
export const ATTENDANCE_GUIDE: PageGuideConfig = {
  title: 'Chấm công',
  subtitle: 'Check-in khi tới văn phòng, check-out trước khi về — theo dõi giờ công trong ngày.',
  docHref: '/docs/guide-attendance-settings',
  sections: [
    {
      type: 'steps',
      heading: 'Chấm công hằng ngày',
      steps: [
        {
          title: 'Check-in đầu giờ',
          description:
            'Bấm CHECK IN góc trên khi tới văn phòng. Cho phép vị trí nếu trình duyệt hỏi — giúp xác nhận bạn đang đúng chỗ.',
        },
        {
          title: 'Làm việc trong ngày',
          description:
            'Sau check-in, trang hiện bạn đang làm việc và đếm giờ. Đóng trang rồi mở lại vẫn giữ trạng thái đúng.',
        },
        {
          title: 'Check-out cuối giờ',
          description:
            'Bấm CHECK OUT trước khi rời văn phòng. Hệ thống ghi giờ ra để tính công cuối tháng.',
        },
        {
          title: 'Xem lịch tháng',
          description:
            'Tab Tổng quan: xem các ngày đã chấm và các chỉ số cá nhân (ngày công, đúng giờ, muộn…).',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Khi bị từ chối check-in',
      tips: [
        'Bật GPS (và WiFi công ty nếu công ty yêu cầu).',
        'Đứng trong vùng văn phòng đã cấu hình — nếu vẫn lỗi, báo Admin kiểm tra Cài đặt → Định vị.',
        'Quên check-out: báo HR điều chỉnh; tránh lặp lại vì ảnh hưởng bảng công.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        {
          label: 'Hướng dẫn cấu hình GPS / WiFi (Admin)',
          href: '/docs/guide-attendance-settings',
        },
      ],
    },
    {
      type: 'notes',
      heading: 'Dành cho quản lý',
      notes:
        'Tab danh sách chấm công giúp lọc theo nhân viên và trạng thái khi chốt bảng công. Đơn nghỉ phép xử lý ở mục nghỉ phép / Hộp thư duyệt.',
    },
  ],
}
