import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app — Chấm công nhân viên (giọng EU)
 * Cấu hình GPS/WiFi (Admin): /docs/guide-attendance-settings
 */
export const ATTENDANCE_GUIDE: PageGuideConfig = {
  title: 'Chấm công',
  subtitle:
    'Bước 1–3 luồng Chấm công & Lương: chấm ngày → duyệt nghỉ/OT → tổng hợp công trước khi tính lương.',
  docHref: '/docs/guide-hr-payroll',
  sections: [
    {
      type: 'steps',
      heading: 'Luồng chấm công (bước 1–3)',
      steps: [
        {
          title: 'Chấm công hàng ngày',
          description:
            'Check-in khi tới văn phòng (GPS/app/máy). Check-out trước khi về — ghi giờ làm thực tế.',
        },
        {
          title: 'Duyệt nghỉ phép & tăng ca',
          description:
            'Tab Đơn nghỉ phép — QLTT duyệt tại đây hoặc Hộp thư duyệt.',
        },
        {
          title: 'Tổng hợp công cuối tháng',
          description:
            'Tab Danh sách / Theo dõi ngày — HR đối chiếu ngày công trước khi sang Bảng lương.',
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
