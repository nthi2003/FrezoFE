import * as z from 'zod'

export const productFormSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  code: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.number().min(0, 'Giá không hợp lệ').optional(),
  categoryId: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>
