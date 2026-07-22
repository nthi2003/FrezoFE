import type { PageGuideConfig } from '@frezo/ui'

export const ATTENDANCE_GUIDE: PageGuideConfig = {
  title: 'Chấm công',
  subtitle: 'Bắt đầu ngày làm việc chỉ với 1 cú click — theo dõi giờ công, đi muộn và OT theo thời gian thực.',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình chấm công hằng ngày',
      steps: [
        {
          title: 'Check-in đầu giờ',
          description:
            'Bấm nút CHECK IN màu xanh ở góc phải trên cùng ngay khi bạn tới văn phòng. Hệ thống ghi lại giờ vào + toạ độ GPS (nếu bạn cho phép).',
        },
        {
          title: 'Làm việc — hệ thống đếm giờ realtime',
          description:
            'Sau khi check-in, hero card đổi màu xanh lá và bắt đầu đếm thời gian đã làm. Bạn có thể đóng trang, quay lại vẫn hiển thị đúng.',
        },
        {
          title: 'Check-out cuối giờ',
          description:
            'Bấm CHECK OUT trước khi rời văn phòng. Backend sẽ tự tính workMinutes, lateMinutes và overtimeMinutes để tính lương cuối tháng.',
        },
        {
          title: 'Xem lịch tháng + KPI cá nhân',
          description:
            'Tab "Tổng quan" hiển thị heatmap 30 ngày và 5 KPI cá nhân (ngày công, đúng giờ, muộn, OT, streak).',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo tối ưu',
      tips: [
        'Bật quyền GPS trong browser để check-in được xác thực vị trí — giúp phòng ban tin tưởng hơn.',
        'Nếu quên check-out, HR sẽ điều chỉnh thủ công. Tránh lặp lại vì làm rối bảng lương.',
        'Streak "đúng giờ liên tiếp" reset về 0 khi bạn đi muộn. Giữ streak dài để có KPI cuối quý!',
      ],
    },
    {
      type: 'shortcuts',
      heading: 'Phím tắt',
      shortcuts: [
        { keys: ['C'], label: 'Check-in / Check-out nhanh (khi focus vào hero card)' },
        { keys: ['←', '→'], label: 'Chuyển tháng trong heatmap' },
        { keys: ['G', 'T'], label: 'Chuyển tab Tổng quan' },
      ],
    },
    {
      type: 'notes',
      heading: 'Dành cho Manager',
      notes:
        'Tab "Danh sách chấm công" cho phép filter theo nhân viên + trạng thái để duyệt bảng công cuối tháng. Đơn nghỉ phép ở tab riêng — bấm ✓/✗ để duyệt/từ chối nhanh.',
    },
  ],
}
