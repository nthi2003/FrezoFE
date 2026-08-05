import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import fbApi from '../services/fbApi'
import { toast } from 'sonner'

export const FB_KEYS = {
  accounts: ['fb', 'accounts'] as const,
  groups: ['fb', 'groups'] as const,
  leads: ['fb', 'leads'] as const,
  summary: ['fb', 'summary'] as const,
}

export function useFbAccounts() {
  return useQuery({ queryKey: FB_KEYS.accounts, queryFn: fbApi.accounts.getAll })
}

export function useCreateFbAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fbApi.accounts.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: FB_KEYS.accounts }); toast.success('Đã thêm tài khoản') },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi thêm tài khoản'),
  })
}

export function useUpdateFbAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; data: any }) => fbApi.accounts.update(params.id, params.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: FB_KEYS.accounts }); toast.success('Đã cập nhật') },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi cập nhật'),
  })
}

export function useDeleteFbAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fbApi.accounts.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: FB_KEYS.accounts }); toast.success('Đã xóa tài khoản') },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi xóa'),
  })
}

export function useFbGroups(status?: string) {
  return useQuery({ queryKey: [...FB_KEYS.groups, status], queryFn: () => fbApi.groups.getAll(status) })
}

export function useDeleteFbGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fbApi.groups.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: FB_KEYS.groups }); toast.success('Đã xóa group') },
  })
}

export function useFbLeads(status?: string, source?: string) {
  return useQuery({
    queryKey: [...FB_KEYS.leads, status, source],
    queryFn: () => fbApi.leads.getAll(status, source),
    // Inbox nên auto-refresh — 30s để bắt lead mới từ landing / Zalo
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}

export function useAssignFbLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; username: string }) => fbApi.leads.assign(params.id, params.username),
    onSuccess: () => { qc.invalidateQueries({ queryKey: FB_KEYS.leads }); toast.success('Đã gán nhân viên xử lý') },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi assign'),
  })
}

export function useDeleteFbLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fbApi.leads.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: FB_KEYS.leads }); toast.success('Đã xoá khách tiềm năng') },
  })
}

export function useImportLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fbApi.leads.importToCustomer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FB_KEYS.leads })
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['crm', 'leads'] })
      toast.success('Đã import KH — mở CRM Leads để follow-up (status NEW→IMPORTED map)')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi import'),
  })
}

export function useImportBatchLeads() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fbApi.leads.importBatch,
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: FB_KEYS.leads })
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['crm', 'leads'] })
      toast.success(
        typeof data === 'string'
          ? `${data} · Mở CRM Leads để tiếp tục`
          : 'Đã import hàng loạt — mở CRM Leads (trùng SĐT/email đã skip)',
      )
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi import hàng loạt'),
  })
}

export function useScanFbGroups() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fbApi.automation.scanGroups,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FB_KEYS.groups })
      toast.success('Đã gửi yêu cầu quét groups, kiểm tra kết quả sau vài phút')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi quét groups'),
  })
}

export function useJoinFbGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fbApi.automation.joinGroup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FB_KEYS.groups })
      toast.success('Đã gửi yêu cầu tham gia group')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi tham gia group'),
  })
}

export function useFbSummary() {
  return useQuery({ queryKey: FB_KEYS.summary, queryFn: fbApi.automation.summary, refetchInterval: 30000 })
}
