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
  code: z.string().min(1, 'Mã tag bắt buộc'),
  name: z.string().min(2, 'Tên tag bắt buộc'),
  category: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
})
