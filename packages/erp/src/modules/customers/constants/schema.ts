import * as z from 'zod'

export const customerFormSchema = z.object({
  name: z.string().min(1, 'Tên khách hàng không được để trống'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  taxCode: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>
