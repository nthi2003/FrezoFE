import type { PageGuideConfig } from '@frezo/ui'

/** Hướng dẫn in-app — Phiếu nhập kho (khớp /docs/guide-warehouse-grn-gin) */
export const GRN_GUIDE: PageGuideConfig = {
  title: 'Phiếu nhập kho',
  subtitle: 'Quy trình T3/AMIS: nháp → duyệt → xác nhận nhập + hóa đơn NCC.',
  docHref: '/docs/guide-warehouse-grn-gin',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình 4 bước',
      steps: [
        {
          title: '1. Tạo PNK (Lưu nháp)',
          description:
            'Chọn kho, NCC, số HĐ GTGT đầu vào, PO (nếu có), dòng SP + SL + đơn giá.',
        },
        {
          title: '2. Gửi duyệt',
          description: 'Nút Gửi duyệt — trạng thái Chờ duyệt (PENDING_APPROVAL).',
        },
        {
          title: '3. Duyệt',
          description: 'Kế toán bấm Duyệt (quyền WAREHOUSE.GRN.APPROVE) → Đã duyệt.',
        },
        {
          title: '4. Xác nhận nhập',
          description: 'Thủ kho nhập SL thực nhận → Xác nhận nhập → tồn tăng.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Demo',
      tips: [
        'GRN-DEMO-001 — nháp + PO-DEMO-001 + HĐ NCC.',
        'GRN-DEMO-002 — chờ duyệt (có số HĐ).',
        'GRN-DEMO-003 — đã nhập kho.',
        'Có thể Xác nhận nhập trực tiếp từ Nháp nếu bỏ qua duyệt.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn đầy đủ', href: '/docs/guide-warehouse-grn-gin' },
        { label: 'Phiếu xuất kho', href: '/warehouse/gin' },
        { label: 'Đơn mua (PO)', href: '/warehouse/purchase-orders' },
      ],
    },
  ],
}

/** Hướng dẫn in-app — Phiếu xuất kho */
export const GIN_GUIDE: PageGuideConfig = {
  title: 'Phiếu xuất kho',
  subtitle: 'Quy trình T3/AMIS: nháp → duyệt → xác nhận xuất + chứng từ/HĐ.',
  docHref: '/docs/guide-warehouse-grn-gin',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình 4 bước',
      steps: [
        {
          title: '1. Tạo PXK (Lưu nháp)',
          description:
            'Chọn kho, loại xuất (bán/chuyển kho), khách/kho đích, số chứng từ, dòng hàng.',
        },
        {
          title: '2. Gửi duyệt',
          description: 'Nút Gửi duyệt trên chi tiết hoặc pipeline stepper.',
        },
        {
          title: '3. Duyệt',
          description: 'Quyền WAREHOUSE.GIN.APPROVE — Duyệt trước khi xuất thực tế.',
        },
        {
          title: '4. Xác nhận xuất',
          description: 'Thủ kho xác nhận SL xuất → tồn giảm.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Demo',
      tips: [
        'GIN-DEMO-001 — xuất bán nháp (SP001).',
        'GIN-DEMO-002 — chuyển kho chờ duyệt.',
        'GIN-DEMO-003 — BigC đã xuất.',
        'Thiếu tồn → không xác nhận được.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn đầy đủ', href: '/docs/guide-warehouse-grn-gin' },
        { label: 'Phiếu nhập kho', href: '/warehouse/grn' },
        { label: 'Đơn hàng & tồn kho', href: '/docs/guide-warehouse-sales' },
      ],
    },
  ],
}
