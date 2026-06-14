import * as z from 'zod'

export const productFormSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  code: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0, 'Giá không hợp lệ').optional(),
  categoryId: z.string().optional(),
  unit: z.string().optional(),
  status: z.string().optional(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>
