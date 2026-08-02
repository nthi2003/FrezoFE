import type { PageGuideConfig } from '@frezo/ui'

/** Hướng dẫn in-app — Kê khai thuế (khớp /docs/guide-accounting-tax) */
export const TAX_GUIDE: PageGuideConfig = {
  title: 'Kê khai thuế',
  subtitle:
    'Tổng hợp hoá đơn GTGT đầu vào/ra → tính thuế → lập tờ khai → nộp cổng điện tử → lưu chứng từ.',
  docHref: '/docs/guide-accounting-tax',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình 5 bước',
      steps: [
        {
          title: 'Tổng hợp hoá đơn đầu vào/ra',
          description: 'Đối chiếu hoá đơn điện tử (HĐ GTGT từ GRN + hoá đơn bán CRM).',
        },
        {
          title: 'Tính các loại thuế phải nộp',
          description: 'GTGT, TNDN, TNCN — Frezo hiện tổng hợp GTGT stub từ sổ.',
        },
        {
          title: 'Lập tờ khai thuế',
          description: 'Theo mẫu quy định cơ quan thuế — export / đối chiếu số liệu.',
        },
        {
          title: 'Nộp qua cổng điện tử hoặc điều chỉnh',
          description: 'Kế toán trưởng duyệt trước khi nộp · nhánh điều chỉnh nếu số liệu chưa khớp.',
        },
        {
          title: 'Nộp thuế & lưu chứng từ',
          description: 'Biên lai, chứng từ nộp, lưu hồ sơ theo kỳ.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo vận hành',
      tips: [
        'Chốt GRN có số HĐ GTGT đầu vào trước khi tổng hợp thuế tháng.',
        'Đối chiếu output VAT (hoá đơn bán) với TK 3331 trên sổ cái.',
        'Lưu file XML/PDF tờ khai + biên lai nộp vào thư mục kỳ (P1: đính kèm trên Frezo).',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn đầy đủ', href: '/docs/guide-accounting-tax' },
        { label: 'Tờ khai GTGT', href: '/accounting/tax' },
        { label: 'Phiếu nhập kho (HĐ đầu vào)', href: '/warehouse/grn' },
      ],
    },
  ],
}
