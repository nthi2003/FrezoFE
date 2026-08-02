import type { PageGuideConfig } from '@frezo/ui'

export const CATEGORIES_GUIDE: PageGuideConfig = {
  title: 'Danh mục giao việc',
  subtitle: 'Nhóm loại việc (Lỗi, Tính năng, Hỗ trợ…) — form giao việc lấy danh sách từ đây.',
  sections: [
    {
      type: 'steps',
      heading: 'Cách dùng',
      steps: [
        {
          title: 'Thêm danh mục',
          description: 'Bấm «Thêm danh mục» → nhập tên tiếng Việt. Mã lưu nội bộ được gợi ý tự động.',
        },
        {
          title: 'Ẩn khi không dùng',
          description: 'Tắt «Hiện trên form» hoặc xoá mềm — danh mục không còn xuất hiện khi tạo việc mới. Việc cũ vẫn giữ mã cũ.',
        },
        {
          title: 'Sắp thứ tự',
          description: 'Trường «Thứ tự» quyết định vị trí trong danh sách chọn trên form.',
        },
      ],
    },
  ],
}
