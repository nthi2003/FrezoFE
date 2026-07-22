// ============================================================
// Warehouse API — reorder rules + stock alerts (BE FZ-010 đã ship)
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'
import type {
  PageResponse,
  ReorderRuleDto,
  ReorderRuleRequest,
  StockAlertDto,
  StockAlertStatus,
  WarehouseOption,
} from '../types'

const BASE = '/warehouse'

export const warehouseApi = {
  /** GET /warehouse/warehouses — alias trên ReorderController */
  listWarehouses: () =>
    axiosClient
      .get<ApiResponse<WarehouseOption[]>>(`${BASE}/warehouses`)
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),

  listReorderRules: (params?: {
    warehouseId?: string
    productId?: string
    page?: number
  }) =>
    axiosClient
      .get<ApiResponse<PageResponse<ReorderRuleDto>>>(`${BASE}/reorder-rules`, {
        params,
      })
      .then((r) => r.data.data),

  createReorderRule: (body: ReorderRuleRequest) =>
    axiosClient
      .post<ApiResponse<ReorderRuleDto>>(`${BASE}/reorder-rules`, body)
      .then((r) => r.data.data),

  updateReorderRule: (id: string, body: Partial<ReorderRuleRequest>) =>
    axiosClient
      .put<ApiResponse<ReorderRuleDto>>(`${BASE}/reorder-rules/${id}`, body)
      .then((r) => r.data.data),

  deleteReorderRule: (id: string) =>
    axiosClient
      .delete<ApiResponse<void>>(`${BASE}/reorder-rules/${id}`)
      .then((r) => r.data),

  /** POST /warehouse/reorder-rules/import-excel — multipart file thật */
  importReorderRules: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return axiosClient
      .post<ApiResponse<{ imported: number }>>(
        `${BASE}/reorder-rules/import-excel`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      .then((r) => r.data.data)
  },

  listStockAlerts: (params?: {
    status?: StockAlertStatus | 'open' | 'resolved'
  }) =>
    axiosClient
      .get<ApiResponse<PageResponse<StockAlertDto>>>(`${BASE}/stock-alerts`, {
        params: {
          status:
            params?.status === 'open'
              ? 'OPEN'
              : params?.status === 'resolved'
                ? 'RESOLVED'
                : params?.status,
        },
      })
      .then((r) => r.data.data),

  dismissAlert: (id: string) =>
    axiosClient
      .post<ApiResponse<StockAlertDto>>(`${BASE}/stock-alerts/${id}/dismiss`)
      .then((r) => r.data.data),
}
