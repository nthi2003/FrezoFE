import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aiApi } from '../services/aiApi'
import { toast } from 'sonner'

export const AI_KEYS = {
  health: ['ai', 'health'] as const,
  accounts: ['ai', 'accounts'] as const,
  groups: ['ai', 'groups'] as const,
  posts: ['ai', 'posts'] as const,
  comments: ['ai', 'comments'] as const,
  conversations: ['ai', 'conversations'] as const,
  ragContexts: ['ai', 'rag-contexts'] as const,
  ggmapResults: ['ai', 'ggmap', 'results'] as const,
}

export function useAIHealth() {
  return useQuery({
    queryKey: AI_KEYS.health,
    queryFn: aiApi.health,
    refetchInterval: 30000,
  })
}

export function useAccounts() {
  return useQuery({ queryKey: AI_KEYS.accounts, queryFn: aiApi.getAccounts })
}

export function useAddAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: aiApi.addAccount,
    onSuccess: () => { qc.invalidateQueries({ queryKey: AI_KEYS.accounts }); toast.success('Đã thêm tài khoản') },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Lỗi thêm tài khoản'),
  })
}

export function useGroups(status?: string) {
  return useQuery({
    queryKey: [...AI_KEYS.groups, status],
    queryFn: () => aiApi.getGroups(status),
  })
}

export function useScanGroups() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { keyword: string; maxResults?: number }) => aiApi.scanGroups(params.keyword, params.maxResults),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: AI_KEYS.groups })
      toast.success(`Đã quét xong ${data?.total || 0} groups`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Lỗi quét group'),
  })
}

export function useDeleteGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: aiApi.deleteGroup,
    onSuccess: () => { qc.invalidateQueries({ queryKey: AI_KEYS.groups }); toast.success('Đã xóa group') },
  })
}

export function usePosts() {
  return useQuery({ queryKey: AI_KEYS.posts, queryFn: aiApi.getPosts })
}

export function usePostToGroups() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { topic: string; maxPosts?: number; dryRun?: boolean }) =>
      aiApi.postToGroups(params.topic, params.maxPosts, params.dryRun),
    onSuccess: () => { qc.invalidateQueries({ queryKey: AI_KEYS.posts }); toast.success('Đã đăng bài') },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Lỗi đăng bài'),
  })
}

export function useComments() {
  return useQuery({ queryKey: AI_KEYS.comments, queryFn: aiApi.getComments })
}

export function useScanComments() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (maxComments?: number) => aiApi.scanComments(maxComments),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: AI_KEYS.comments })
      const replied = data?.results?.filter((r: any) => r.status === 'replied').length || 0
      toast.success(`Đã xử lý ${replied} comment`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Lỗi quét comment'),
  })
}

export function useConversations() {
  return useQuery({ queryKey: AI_KEYS.conversations, queryFn: aiApi.getConversations })
}

export function useProcessInbox() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { maxConversations?: number; inboxUrl?: string }) =>
      aiApi.processInbox(params.maxConversations, params.inboxUrl),
    onSuccess: () => { qc.invalidateQueries({ queryKey: AI_KEYS.conversations }); toast.success('Đã xử lý inbox') },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Lỗi xử lý inbox'),
  })
}

export function useGenerateContent() {
  return useMutation({
    mutationFn: (params: { topic: string; tone?: string; variations?: number }) =>
      aiApi.generateContent(params.topic, params.tone, params.variations),
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Lỗi sinh nội dung'),
  })
}

export function useChat() {
  return useMutation({
    mutationFn: (params: { message: string; history?: any[] }) => aiApi.chat(params.message, params.history),
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Lỗi chat'),
  })
}

export function useRagContexts() {
  return useQuery({ queryKey: AI_KEYS.ragContexts, queryFn: aiApi.getRagContexts })
}

export function useAddRagContext() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { title: string; content: string }) => aiApi.addRagContext(params.title, params.content),
    onSuccess: () => { qc.invalidateQueries({ queryKey: AI_KEYS.ragContexts }); toast.success('Đã thêm context') },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Lỗi thêm context'),
  })
}

export function useScheduler() {
  const qc = useQueryClient()
  return {
    start: useMutation({
      mutationFn: aiApi.startScheduler,
      onSuccess: () => toast.success('Scheduler đã khởi động'),
    }),
    stop: useMutation({
      mutationFn: aiApi.stopScheduler,
      onSuccess: () => toast.success('Scheduler đã dừng'),
    }),
  }
}

export function useGgMapScan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { keyword: string; maxResults?: number }) =>
      aiApi.scanGgMap(params.keyword, params.maxResults),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AI_KEYS.ggmapResults })
      toast.success('Đã quét Google Maps xong')
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Lỗi quét Google Maps'),
  })
}

export function useGgMapResults(keyword?: string, status?: string) {
  return useQuery({
    queryKey: [...AI_KEYS.ggmapResults, keyword, status],
    queryFn: () => aiApi.getGgMapResults(keyword, status),
  })
}

export function useImportGgMapResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => aiApi.importGgMapResult(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AI_KEYS.ggmapResults })
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Đã import vào danh sách khách hàng')
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Lỗi import'),
  })
}

export function useImportAllGgMapResults() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => aiApi.importAllGgMapResults(ids),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: AI_KEYS.ggmapResults })
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success(`Đã import ${data?.imported_count || 0} khách hàng`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Lỗi import'),
  })
}
