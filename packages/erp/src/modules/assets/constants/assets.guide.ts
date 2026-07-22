import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app cho /admin/qlts (Quản lý tài sản)
 * Docs Hub: /docs/guide-qlts
 */
export const ASSETS_GUIDE: PageGuideConfig = {
  title: 'Quản lý tài sản (QLTS)',
  subtitle:
    'Kiểm kê inventory, tạo yêu cầu cấp phát qua workflow, duyệt từng bước rồi xác nhận bàn giao — tài sản mới chuyển IN_USE.',
  docHref: '/docs/guide-qlts',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình chuẩn',
      steps: [
        {
          title: 'Tạo tài sản',
          description:
            'Bấm "Thêm tài sản" — nhập mã, tên, loại (danh mục LoaiTaiSan), giá trị và bảo hành. Asset ở trạng thái Sẵn sàng mới cấp phát được.',
        },
        {
          title: 'Cấp phát — chọn Person',
          description:
            'Trên card/drawer asset Sẵn sàng, bấm Cấp phát. Chọn nhân viên nhận, ngày dự kiến và lý do. Hệ thống tạo ticket PENDING — không assign trực tiếp.',
        },
        {
          title: 'Duyệt theo workflow',
          description:
            'Tab "Yêu cầu cấp phát": từng bước duyệt lấy từ Workflow Definition (module ASSET / code ASSET_TRANSFER*). Người duyệt hiển thị theo role/user trên stepper.',
        },
        {
          title: 'Bàn giao → IN_USE',
          description:
            'Sau khi đủ bước duyệt, xác nhận bàn giao. Chỉ lúc này tài sản chuyển Đang dùng và gắn người giữ.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo dùng nhanh',
      tips: [
        'Cấu hình ai duyệt ở /qtht/workflows — lọc module ASSET (thường code ASSET_TRANSFER_DEFAULT). Đổi step/role ở đó, QLTS tự theo khi tạo ticket mới.',
        'Tab "Yêu cầu cấp phát" có badge số PENDING — ưu tiên xử lý ticket chờ trước khi tạo thêm.',
        'Trong lúc ticket chờ duyệt, asset vẫn Sẵn sàng và không tạo được ticket cấp phát trùng cho cùng tài sản.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Tài liệu đầy đủ (Docs Hub)', href: '/docs/guide-qlts' },
        { label: 'Khấu hao định kỳ', href: '/assets/depreciation' },
        { label: 'Hướng dẫn khấu hao', href: '/docs/guide-depreciation' },
        { label: 'Cấu hình Workflow (module ASSET)', href: '/qtht/workflows' },
      ],
    },
    {
      type: 'notes',
      heading: 'Phạm vi hiện tại',
      notes:
        'Luồng cấp phát (ASSIGN) đã gắn Workflow Engine. Thu hồi (RETURN) qua /unassign có thể vẫn bypass WF — chờ Product chốt trước khi FE đổi. Permission seed mới (nếu có) do SA/BE — FE chỉ ẩn nút khi key đã tồn tại trong codebase.',
    },
  ],
}
