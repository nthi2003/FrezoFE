import * as z from 'zod'

export const articleFormSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  summary: z.string().optional(),
  content: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  tags: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  authorId: z.string().optional(),
  orgId: z.string().optional(),
  publishedDate: z.string().optional(),
})

export type ArticleFormValues = z.infer<typeof articleFormSchema>
