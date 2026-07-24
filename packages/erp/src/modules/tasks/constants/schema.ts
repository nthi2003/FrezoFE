import * as z from 'zod'

export const taskFormSchema = z.object({
  title: z.string().min(2, 'Tiêu đề bắt buộc'),
  description: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>

export const ticketSchema = z.object({
  title: z.string().min(2, 'Tiêu đề bắt buộc'),
  description: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  resolutionNote: z.string().optional().nullable(),
})

export type TicketFormValues = z.infer<typeof ticketSchema>

export const tagSchema = z.object({
  // Ưu tiên slug không dấu (gap, quan-trong); vẫn nhận mã cũ UPPER_SNAKE khi sửa bản ghi đã seed.
  code: z
    .string()
    .min(1, 'Mã tag bắt buộc')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$|^[A-Z0-9]+(?:_[A-Z0-9]+)*$/,
      'Mã dạng slug không dấu (vd: quan-trong)',
    ),
  name: z.string().min(2, 'Tên tag bắt buộc'),
  category: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
})

export const ticketCategorySchema = z.object({
  code: z
    .string()
    .min(1, 'Mã danh mục bắt buộc')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$|^[A-Z0-9]+(?:_[A-Z0-9]+)*$/,
      'Mã dạng slug (vd: hop) hoặc mã cũ (BUG, FEATURE_REQUEST)',
    ),
  name: z.string().min(2, 'Tên danh mục bắt buộc'),
  sortOrder: z.coerce.number().int().optional().nullable(),
  active: z.boolean().optional().nullable(),
})

export type TicketCategoryFormValues = z.infer<typeof ticketCategorySchema>
