import axiosClient from '@/lib/axios/axiosClient'
import { API } from '@/lib/axios/apiEndpoints'
import type { ApiResponse } from '@frezo/types'
import type { MenuResponseItem } from '../types/menu.types'

export const menuApi = {
  getMenusForUser: (username: string) =>
    axiosClient
      .get<ApiResponse<MenuResponseItem[]>>(API.QTHT.MENU_BY_USER(username))
      .then((res) => res.data.data),

  getAllMenus: () =>
    axiosClient
      .get<ApiResponse<MenuResponseItem[]>>(API.QTHT.MENUS)
      .then((res) => res.data.data),

  getMenuById: (id: string) =>
    axiosClient
      .get<ApiResponse<MenuResponseItem>>(API.QTHT.MENU_BY_ID(id))
      .then(res => res.data.data),

  createMenu: (data: Partial<MenuResponseItem>) =>
    axiosClient
      .post<ApiResponse<MenuResponseItem>>(API.QTHT.MENUS, data)
      .then((res) => res.data.data),

  updateMenu: (id: string, data: Partial<MenuResponseItem>) =>
    axiosClient
      .put<ApiResponse<MenuResponseItem>>(API.QTHT.MENU_BY_ID(id), data)
      .then((res) => res.data.data),

  deleteMenu: (id: string) =>
    axiosClient
      .delete<ApiResponse<string>>(API.QTHT.MENU_BY_ID(id))
      .then((res) => res.data),
}
