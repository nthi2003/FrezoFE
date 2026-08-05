import type { PageGuideConfig } from '@frezo/ui'

export const SHRINKAGE_GUIDE: PageGuideConfig = {
  title: 'Ghi nhận hao hụt kho',
  subtitle:
    'Ghi SHRINK / DAMAGE / EXPIRED riêng — không qua phiếu xuất bán. Chỉ Confirm mới trừ tồn lô.',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình',
      steps: [
        {
          title: 'Chọn lô có tồn',
          description:
            'Filter theo kho và sản phẩm. Mỗi dòng gắn một lô (batch) cụ thể.',
        },
        {
          title: 'Chọn loại hao hụt',
          description:
            'SHRINK — co hụt; DAMAGE — dập/hỏng; EXPIRED — quá hạn tươi.',
        },
        {
          title: 'Xác nhận',
          description:
            'Trừ qtyOnHand lô + stock_balance. Thao tác không tự hoàn tác.',
        },
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Danh sách lô', href: '/warehouse/batches' },
        { label: 'Cảnh báo cận hạn', href: '/warehouse/stock-alerts' },
      ],
    },
  ],
}
