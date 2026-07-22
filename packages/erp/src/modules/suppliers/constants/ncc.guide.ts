import type { PageGuideConfig } from '@frezo/ui'

export const NCC_GUIDE: PageGuideConfig = {
  title: 'Nhà cung cấp (NCC)',
  subtitle:
    'Danh bạ NCC nông sản: năng lực sản xuất (diện tích, sản lượng), chứng chỉ VietGAP/GlobalGAP, và điểm mạnh — nguồn dữ liệu cho quyết định thu mua.',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình chuẩn',
      steps: [
        {
          title: 'Thêm NCC + phân loại',
          description:
            'Nhập thông tin cơ bản, gán "Phân loại" (Hộ nông dân / Hợp tác xã / Doanh nghiệp), rồi khai báo diện tích canh tác và sản lượng tối đa/tháng.',
        },
        {
          title: 'Upload chứng chỉ',
          description:
            'Đính kèm VietGAP, GlobalGAP, HACCP... để phòng thu mua verify. Mỗi chứng chỉ cần loại + file scan + ngày hết hạn.',
        },
        {
          title: 'Đánh giá và rating',
          description:
            'Sau mỗi lần nhập hàng, cập nhật "Điểm mạnh" (chất lượng, giao hẹn giờ, đóng gói...) — làm cơ sở đề xuất mua lần sau.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo dùng',
      tips: [
        'Đặt mã NCC theo pattern: NCC001, NCC-DL-01 — tự động sinh khi để trống. Không sửa mã sau khi tạo tránh loạn tham chiếu ở nhập kho.',
        'Diện tích canh tác (ha) + sản lượng tối đa (kg/tháng) là 2 chỉ số then chốt để dự báo nguồn cung.',
        'Chứng chỉ sắp hết hạn (< 30 ngày) sẽ hiển thị dấu cảnh báo — chủ động nhắc NCC gia hạn.',
      ],
    },
    {
      type: 'notes',
      heading: 'Bảo mật SĐT',
      notes:
        'Số điện thoại NCC được lưu hash (SHA-256). Chỉ hiển thị đủ với user có quyền "customer.ncc.VIEW". Log audit khi bấm "hiện SĐT".',
    },
  ],
}

export const NCC_CLASSIFICATION_TYPE = 'PhanLoaiNCC'
