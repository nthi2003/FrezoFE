import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractApi } from '@/modules/qlns/services/contractApi'
import { toast } from 'sonner'

export interface SavedTemplate {
  id: string
  name: string
  type: string
  fileUrl: string
  createdAt: string
  updatedAt: string
}

export function useContractTemplates() {
  const queryClient = useQueryClient()

  const { data: templates = [] } = useQuery({
    queryKey: ['contract-templates'],
    queryFn: async () => {
      const res = await contractApi.getTemplates()
      return (res?.data ?? []) as SavedTemplate[]
    },
  })

  const addTemplate = useMutation({
    mutationFn: ({ name, type, content }: { name: string; type: string; content: string }) => {
      const blob = new Blob([content], { type: 'text/html' })
      const file = new File([blob], `${name}.html`, { type: 'text/html' })
      return contractApi.createTemplate(file, name, type)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] })
      toast.success('Đã lưu mẫu hợp đồng')
    },
    onError: () => {
      toast.error('Lưu mẫu thất bại')
    },
  })

  const removeTemplate = useMutation({
    mutationFn: (id: string) => contractApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] })
      toast.success('Đã xóa mẫu hợp đồng')
    },
    onError: () => {
      toast.error('Xóa mẫu thất bại')
    },
  })

  return { templates, addTemplate, removeTemplate }
}

export async function fetchTemplateContent(fileUrl: string): Promise<string> {
  return contractApi.getTemplateContent(fileUrl)
}
