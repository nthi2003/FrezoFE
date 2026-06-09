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
  content: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
})

export const tagSchema = z.object({
  name: z.string().min(2, 'Tên tag bắt buộc'),
  color: z.string().optional(),
})
