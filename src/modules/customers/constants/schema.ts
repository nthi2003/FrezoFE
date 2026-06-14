import * as z from 'zod'

export const customerFormSchema = z.object({
  name: z.string().min(1, 'Tên khách hàng không được để trống'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxCode: z.string().optional(),
  note: z.string().optional(),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>
