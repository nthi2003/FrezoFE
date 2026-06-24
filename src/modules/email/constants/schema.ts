import { z } from 'zod'

export const emailConfigSchema = z.object({
  code: z.string().min(1, 'Mã cấu hình không được để trống'),
  name: z.string().min(1, 'Tên cấu hình không được để trống'),
  apiKey: z.string().min(1, 'API Key không được để trống'),
  smtp: z.string().min(1, 'SMTP không được để trống'),
  port: z.string().optional(),
  nameEmail: z.string().min(1, 'Email hiển thị không được để trống'),
})

export const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Tên mẫu không được để trống'),
  subject: z.string().min(1, 'Tiêu đề không được để trống'),
  content: z.string().min(1, 'Nội dung không được để trống'),
  description: z.string().optional(),
})
