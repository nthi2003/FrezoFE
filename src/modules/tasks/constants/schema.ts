import * as z from 'zod'

export const taskFormSchema = z.object({
  title: z.string().min(2, 'Tiêu đề bắt buộc'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>

export const ticketSchema = z.object({
  title: z.string().min(2, 'Tiêu đề bắt buộc'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  resolutionNote: z.string().optional(),
})

export type TicketFormValues = z.infer<typeof ticketSchema>

export const tagSchema = z.object({
  code: z.string().min(1, 'Mã tag bắt buộc'),
  name: z.string().min(2, 'Tên tag bắt buộc'),
  category: z.string().optional(),
  color: z.string().optional(),
})
