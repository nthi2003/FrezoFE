import type { PageGuideConfig } from '@frezo/ui'



/**

 * Hướng dẫn in-app cho /qtht/workflows + designer

 * Link đầy đủ: /docs/guide-workflows

 *

 * LNK-04: tách rõ Inbox (duyệt hàng ngày) vs Designer (template visual).

 */

export const WORKFLOWS_GUIDE: PageGuideConfig = {

  title: 'Thiết kế template quy trình (Workflow)',

  subtitle:

    'Admin/HR cấu hình template bước duyệt visual — không phải hộp thư duyệt đơn hàng ngày.',

  docHref: '/docs/guide-workflows',

  sections: [

    {

      type: 'notes',

      heading: 'Đây KHÔNG phải hộp duyệt',

      notes:

        'Duyệt đơn nghiệp vụ (leave, PR, payroll…) nằm ở /approval/inbox. Trang này + /qtht/workflows/:id/designer chỉ thiết kế template graph/steps. Sai chỗ → đơn không vào inbox.',

    },

    {

      type: 'notes',

      heading: 'Hai lớp duyệt — chọn đúng',

      notes:

        'Approval Inbox/Flows (/approval/inbox, /approval/flows): user duyệt + admin gắn flow theo subject. Visual Workflow (/qtht/workflows): Admin/HR thiết kế template — không thay Inbox.',

    },

    {

      type: 'steps',

      heading: 'Cấu hình template — checklist',

      steps: [

        {

          title: 'Mã (code) duy nhất',

          description:

            'Chữ HOA, số, gạch dưới (VD: ASSET_TRANSFER_DEFAULT). Không đổi sau khi đã có instance đang chạy.',

        },

        {

          title: 'Tên + module',

          description:

            'Tên dễ hiểu cho Admin; chọn đúng module (ASSET, LEAVE, CONTRACT…). Module gắn với nơi business gọi start.',

        },

        {

          title: 'Thêm ít nhất 1 bước duyệt',

          description:

            'Mỗi bước: tên rõ (VD: “HR duyệt”) + loại approver. USER/ROLE bắt buộc chọn value; MANAGER/ADMIN tự resolve.',

        },

        {

          title: 'Bật Active rồi Lưu',

          description:

            'Chỉ quy trình Active mới được start instance mới. Instance cũ giữ snapshot steps lúc tạo.',

        },

      ],

    },

    {

      type: 'tips',

      heading: 'Tránh misconfig',

      tips: [

        'Cần duyệt đơn hôm nay → /approval/inbox (không mở Designer).',

        'Module đã dùng /approval/flows → đừng tạo “engine duyệt” thứ hai trên Workflows.',

        'Trước khi Lưu: kiểm tra role/user tồn tại, SLA hợp lý, không để steps trống.',

        'Copy quy trình cũ rồi sửa nhẹ thường an toàn hơn tạo từ đầu.',

      ],

    },

    {

      type: 'links',

      heading: 'Tài liệu & liên quan',

      links: [

        { label: 'Xem tài liệu đầy đủ (Docs Hub)', href: '/docs/guide-workflows' },

        { label: 'Hộp thư duyệt (Inbox)', href: '/approval/inbox' },

        { label: 'Cấu hình Approval Flows', href: '/approval/flows' },

      ],

    },

  ],

}


