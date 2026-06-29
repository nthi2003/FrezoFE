import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { emailConfigApi, emailTemplateApi, emailGroupApi } from '@/modules/email/services/emailApi'
import { toast } from 'sonner'

export function useEmailConfigs() {
  return useQuery({
    queryKey: ['email-configs'],
    queryFn: () => emailConfigApi.getAll(),
    select: (res: any) => res?.data?.items ?? res?.items ?? [],
  })
}

export function useCreateEmailConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => emailConfigApi.create(data),
    onSuccess: () => { toast.success('Tạo cấu hình email thành công'); qc.invalidateQueries({ queryKey: ['email-configs'] }) },
  })
}

export function useUpdateEmailConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => emailConfigApi.update(id, data),
    onSuccess: () => { toast.success('Cập nhật cấu hình email thành công'); qc.invalidateQueries({ queryKey: ['email-configs'] }) },
  })
}

export function useDeleteEmailConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => emailConfigApi.delete(id),
    onSuccess: () => { toast.success('Xóa cấu hình email thành công'); qc.invalidateQueries({ queryKey: ['email-configs'] }) },
  })
}

export function useActivateEmailConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => emailConfigApi.activate(id),
    onSuccess: () => { toast.success('Kích hoạt cấu hình email thành công'); qc.invalidateQueries({ queryKey: ['email-configs'] }) },
  })
}

export function useDeactivateEmailConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => emailConfigApi.deactivate(id),
    onSuccess: () => { toast.success('Hủy kích hoạt cấu hình email thành công'); qc.invalidateQueries({ queryKey: ['email-configs'] }) },
  })
}

export function useTestEmailConfig() {
  return useMutation({
    mutationFn: (id: string) => emailConfigApi.testConnection(id),
    onSuccess: () => toast.success('Kiểm tra kết nối thành công'),
    onError: () => toast.error('Kiểm tra kết nối thất bại'),
  })
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['email-templates'],
    queryFn: () => emailTemplateApi.getAll(),
    select: (res: any) => res?.data?.items ?? res?.items ?? [],
  })
}

export function useCreateEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => emailTemplateApi.create(data),
    onSuccess: () => { toast.success('Tạo mẫu email thành công'); qc.invalidateQueries({ queryKey: ['email-templates'] }) },
  })
}

export function useUpdateEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => emailTemplateApi.update(id, data),
    onSuccess: () => { toast.success('Cập nhật mẫu email thành công'); qc.invalidateQueries({ queryKey: ['email-templates'] }) },
  })
}

export function useDeleteEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => emailTemplateApi.delete(id),
    onSuccess: () => { toast.success('Xóa mẫu email thành công'); qc.invalidateQueries({ queryKey: ['email-templates'] }) },
  })
}

export function useEmailTemplate(id: string) {
  return useQuery({
    queryKey: ['email-template', id],
    queryFn: () => emailTemplateApi.getById(id),
    select: (res: any) => res?.data ?? res,
    enabled: !!id,
  })
}

export function useEmailGroups() {
  return useQuery({
    queryKey: ['email-groups'],
    queryFn: () => emailGroupApi.getAll(),
    select: (res: any) => res?.data ?? res ?? [],
  })
}

export function useEmailGroup(id: string) {
  return useQuery({
    queryKey: ['email-group', id],
    queryFn: () => emailGroupApi.getById(id),
    select: (res: any) => res?.data ?? res,
    enabled: !!id,
  })
}

export function useCreateEmailGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string; emails: string[] }) => emailGroupApi.create(data),
    onSuccess: () => { toast.success('Tạo nhóm email thành công'); qc.invalidateQueries({ queryKey: ['email-groups'] }) },
  })
}

export function useUpdateEmailGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string; emails: string[] } }) => emailGroupApi.update(id, data),
    onSuccess: () => { toast.success('Cập nhật nhóm email thành công'); qc.invalidateQueries({ queryKey: ['email-groups'] }) },
  })
}

export function useDeleteEmailGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => emailGroupApi.delete(id),
    onSuccess: () => { toast.success('Xóa nhóm email thành công'); qc.invalidateQueries({ queryKey: ['email-groups'] }) },
  })
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { recipients: string[]; params?: Record<string, any> } }) =>
      emailTemplateApi.sendTest(id, data),
    onSuccess: () => toast.success('Gửi email test thành công'),
    onError: () => toast.error('Gửi email test thất bại'),
  })
}
