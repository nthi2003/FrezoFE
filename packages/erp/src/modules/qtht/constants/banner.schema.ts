import * as z from 'zod'

export const bannerFormSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  subtitle: z.string().optional().nullable(),
  imageUrl: z.string().min(1, 'URL hình ảnh không được để trống'),
  linkUrl: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  orderIndex: z.coerce.number().optional(),
})

export type BannerFormValues = z.infer<typeof bannerFormSchema>
