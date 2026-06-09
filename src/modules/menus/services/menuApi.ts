// ============================================================
// FREZO ERP — Menu API Service
// Calls BE endpoints for sidebar menu
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import { API } from '@/lib/axios/apiEndpoints'
import type { ApiResponse } from '@/types/api.types'
import type { MenuResponseItem } from '../types/menu.types'

export const menuApi = {
  /**
   * Lấy menu theo username đã đăng nhập
   * → BE filter theo Role/Permission của user
   * → Trả về flat list, FE tự build tree
   * Endpoint: GET /qlht/menus/user/{username}
   */
  getMenusForUser: (username: string) =>
    axiosClient
      .get<ApiResponse<MenuResponseItem[]>>(API.QTHT.MENU_BY_USER(username))
      .then((res) => res.data.data),

  /**
   * Lấy toàn bộ menu (dành cho Admin quản lý)
   * Endpoint: GET /qlht/menus
   */
  getAllMenus: () =>
    axiosClient
      .get<ApiResponse<MenuResponseItem[]>>(API.QTHT.MENUS)
      .then((res) => res.data.data),

  /**
   * Tạo menu mới
   */
  createMenu: (data: Partial<MenuResponseItem>) =>
    axiosClient
      .post<ApiResponse<MenuResponseItem>>(API.QTHT.MENUS, data)
      .then((res) => res.data.data),

  /**
   * Cập nhật menu
   */
  updateMenu: (id: string, data: Partial<MenuResponseItem>) =>
    axiosClient
      .put<ApiResponse<MenuResponseItem>>(API.QTHT.MENU_BY_ID(id), data)
      .then((res) => res.data.data),

  /**
   * Xóa menu
   */
  deleteMenu: (id: string) =>
    axiosClient
      .delete<ApiResponse<string>>(API.QTHT.MENU_BY_ID(id))
      .then((res) => res.data),
}
