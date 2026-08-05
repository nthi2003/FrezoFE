import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { unwrapList } from '@frezo/utils'
import { ticketApi, tagApi, ticketCategoryApi } from '../services/taskApi'
import { toast } from 'sonner'

export function useTickets(params?: any) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => ticketApi.getAll(params),
    select: unwrapList,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => ticketApi.create(data),
    onSuccess: () => {
      toast.success('Tạo ticket thành công')
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ticketApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật ticket thành công')
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

/** Chỉ đổi status (PATCH) — không gửi partial PUT (tránh wipe assignee khi BE cũ full-replace). */
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ticketApi.updateStatus(id, status),
    onSuccess: (_data, vars) => {
      toast.success(
        vars.status === 'RESOLVED'
          ? 'Đã gửi hoàn thành — chờ quản lý duyệt'
          : 'Cập nhật trạng thái thành công',
      )
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không cập nhật được trạng thái')
    },
  })
}

/** Người giao / admin duyệt hoặc trả lại ticket RESOLVED. */
export function useReviewTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, approved, note }: { id: string; approved: boolean; note?: string }) =>
      ticketApi.review(id, { approved, note }),
    onSuccess: (_data, vars) => {
      toast.success(vars.approved ? 'Đã duyệt và đóng ticket' : 'Đã trả lại ticket cho người xử lý')
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không duyệt được ticket')
    },
  })
}

export function useDeleteTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ticketApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa ticket thành công')
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useTags(params?: any) {
  return useQuery({
    queryKey: ['tags', params],
    queryFn: () => tagApi.getAll(params),
    select: unwrapList,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => tagApi.create(data),
    onSuccess: () => {
      toast.success('Tạo tag thành công')
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tagApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật tag thành công')
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tagApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa tag thành công')
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useTicketCategories() {
  return useQuery({
    queryKey: ['ticket-categories'],
    queryFn: () => ticketCategoryApi.getAll(),
    select: unwrapList,
  })
}

/** Dropdown form ticket — chỉ danh mục đang dùng. */
export function useActiveTicketCategories() {
  return useQuery({
    queryKey: ['ticket-categories', 'active'],
    queryFn: () => ticketCategoryApi.getActive(),
    select: unwrapList,
  })
}

export function useCreateTicketCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => ticketCategoryApi.create(data),
    onSuccess: () => {
      toast.success('Tạo danh mục thành công')
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] })
    },
  })
}

export function useUpdateTicketCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ticketCategoryApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật danh mục thành công')
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] })
    },
  })
}

export function useDeleteTicketCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ticketCategoryApi.delete(id),
    onSuccess: () => {
      toast.success('Đã ẩn danh mục')
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] })
    },
  })
}
