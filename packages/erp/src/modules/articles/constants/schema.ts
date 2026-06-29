import * as z from 'zod'

export const articleFormSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  summary: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
  authorId: z.string().optional().nullable(),
  orgId: z.string().optional().nullable(),
  publishedDate: z.string().optional().nullable(),
})

export type ArticleFormValues = z.infer<typeof articleFormSchema>
