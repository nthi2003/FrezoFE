/** HR Hạng mục — canonical groupCode values (BE category system). */
export const HR_CATEGORY_GROUPS = [
  { value: 'ChucDanh', label: 'Chức danh' },
  { value: 'TrinhDo', label: 'Trình độ' },
  { value: 'CapBac', label: 'Cấp bậc' },
  { value: 'ChiNhanh', label: 'Chi nhánh' },
  { value: 'LoaiHopDong', label: 'Loại hợp đồng' },
  { value: 'GiaiDoan', label: 'Giai đoạn' },
  { value: 'KetQuaDanhGia', label: 'Kết quả đánh giá' },
  { value: 'LyDoNghiViec', label: 'Lý do nghỉ việc' },
] as const

export type HrCategoryGroupCode = (typeof HR_CATEGORY_GROUPS)[number]['value']

export const HR_CATEGORY_GROUP_LABEL: Record<string, string> = Object.fromEntries(
  HR_CATEGORY_GROUPS.map((g) => [g.value, g.label]),
)
