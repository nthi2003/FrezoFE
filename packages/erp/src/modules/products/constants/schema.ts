import * as z from 'zod'

export const productFormSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  price: z.number().min(0, 'Giá không hợp lệ'),
  imageUrl: z.string().optional().nullable(),
  category: z.string().min(1, 'Danh mục không được để trống'),
  rating: z.number().optional().nullable(),
  isNew: z.boolean().optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>
