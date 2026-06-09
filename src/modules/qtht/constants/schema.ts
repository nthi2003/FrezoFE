import * as z from 'zod'

export const orgSchema = z.object({
  code: z.string().min(2, 'Bắt buộc'),
  name: z.string().min(2, 'Bắt buộc'),
  email: z.string().optional(),
})

export type OrgFormValues = z.infer<typeof orgSchema>
