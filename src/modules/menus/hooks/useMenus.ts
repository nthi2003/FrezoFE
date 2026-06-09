// ============================================================
// FREZO ERP — useMenus Hooks
// ============================================================

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { menuApi, type MenuSaveRequest } from '../services/menuApi'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'

export function useMenusForUser(username?: string) {
  return useQuery({
    queryKey: ['menus', username],
    queryFn: () => (username ? menuApi.getMenusForUser(username) : []),
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAllMenus() {
  return useQuery({
    queryKey: ['all_menus'],
    queryFn: () => menuApi.getAllMenus(),
    initialData: [],
  })
}

export function useMenus() {
  const { user } = useAuthStore()
  
  const { data: flatMenus, isLoading } = useQuery({
    queryKey: ['menus_user', user?.username],
    queryFn: () => (user?.username ? menuApi.getMenusForUser(user.username) : []),
    enabled: !!user?.username,
    initialData: [],
  })

  // Build tree
  const menuTree = React.useMemo(() => {
    const nodeMap = new Map<string, any>()
    const roots: any[] = []

    flatMenus.forEach((item: any) => {
      nodeMap.set(item.code, { ...item, children: [] })
    })

    flatMenus.forEach((item: any) => {
      const node = nodeMap.get(item.code)
      if (item.parentCode && nodeMap.has(item.parentCode)) {
        nodeMap.get(item.parentCode).children.push(node)
      } else {
        roots.push(node)
      }
    })

    const sortNodes = (nodes: any[]) => {
      nodes.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
      nodes.forEach(n => sortNodes(n.children))
    }
    sortNodes(roots)

    return roots
  }, [flatMenus])

  return { menuTree, isLoading }
}

export function useMenu(id: string) {
  return useQuery({
    queryKey: ['menu', id],
    queryFn: () => menuApi.getMenuById(id),
    enabled: !!id,
  })
}

export function useCreateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: MenuSaveRequest) => menuApi.createMenu(data),
    onSuccess: () => {
      toast.success('Thêm mới menu thành công')
      queryClient.invalidateQueries({ queryKey: ['all_menus'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Lỗi khi thêm menu')
    },
  })
}

export function useUpdateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MenuSaveRequest }) =>
      menuApi.updateMenu(id, data),
    onSuccess: () => {
      toast.success('Cập nhật menu thành công')
      queryClient.invalidateQueries({ queryKey: ['all_menus'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Lỗi khi cập nhật menu')
    },
  })
}

export function useDeleteMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => menuApi.deleteMenu(id),
    onSuccess: () => {
      toast.success('Xóa menu thành công')
      queryClient.invalidateQueries({ queryKey: ['all_menus'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Lỗi khi xóa menu')
    },
  })
}
