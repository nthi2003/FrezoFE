import * as z from 'zod'

/** Form schema — create/update; `code` is server-generated (never required from user). */
export const articleFormSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  summary: z.string().optional().nullable(),
  content: z
    .string()
    .min(1, 'Nội dung không được để trống')
    .refine((v) => v.replace(/<[^>]*>/g, '').trim().length > 0, {
      message: 'Nội dung không được để trống',
    }),
  type: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
  authorId: z.string().optional().nullable(),
  /** Maps to BE `organizationId` on create/update */
  organizationId: z.string().optional().nullable(),
  /** Người duyệt — BE `managerId` */
  managerId: z.string().optional().nullable(),
  publishScope: z.string().optional().nullable(),
  publishedDate: z.string().optional().nullable(),
})

export type ArticleFormValues = z.infer<typeof articleFormSchema>

/** BE create contract (SA-ART-001) — omit blank `code` so server auto-gens. */
export function toArticleCreatePayload(values: ArticleFormValues) {
  const publishScope = values.publishScope === 'PUBLIC' ? 'PUBLIC' : 'INTERNAL'
  return {
    title: values.title.trim(),
    content: values.content,
    organizationId: values.organizationId || undefined,
    managerId: values.managerId || undefined,
    publishScope,
    isPublic: publishScope === 'PUBLIC',
  }
}

/** BE update contract — code immutable, not sent. */
export function toArticleUpdatePayload(values: ArticleFormValues) {
  const publishScope = values.publishScope === 'PUBLIC' ? 'PUBLIC' : 'INTERNAL'
  return {
    title: values.title.trim(),
    content: values.content,
    organizationId: values.organizationId || undefined,
    managerId: values.managerId || undefined,
    publishScope,
    isPublic: publishScope === 'PUBLIC',
  }
}
