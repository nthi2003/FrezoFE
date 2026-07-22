import { z } from 'zod'

// Certificate item schema
export const certificateSchema = z.object({
  id: z.string().optional(),
  certificateType: z.string().min(1, 'Loại chứng chỉ bắt buộc'),
  fileUrl: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
})

// NCC form schema
export const nccFormSchema = z.object({
  name: z.string().min(2, 'Tên NCC tối thiểu 2 ký tự'),
  code: z.string().optional().or(z.literal('')),
  representative: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  classificationCode: z.string().optional().or(z.literal('')),
  growingArea: z.coerce.number().min(0).optional().nullable(),
  maxCapacity: z.coerce.number().min(0).optional().nullable(),
  strengths: z.string().optional().or(z.literal('')),
  certificates: z.array(certificateSchema).optional(),
})

export type NccFormValues = z.infer<typeof nccFormSchema>
