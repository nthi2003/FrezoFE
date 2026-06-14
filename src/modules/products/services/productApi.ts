import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const productApi = {
  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/product', { params }).then(res => res.data),
  getById: (id: string) =>
    axiosClient.get<ApiResponse<any>>(`/product/${id}`).then(res => res.data),
  create: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/product', data).then(res => res.data),
  update: (id: string, data: any) =>
    axiosClient.put<ApiResponse<any>>(`/product/${id}`, data).then(res => res.data),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<any>>(`/product/${id}`).then(res => res.data),
  filter: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/product/filter', data).then(res => res.data),
  bulkUpdatePrices: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/product/bulk-update-prices', data).then(res => res.data),
  importBatch: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/product/import-batch', data).then(res => res.data),
  calculatePrice: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/product/calculate-price', { params }).then(res => res.data),
  getProfitChart: () =>
    axiosClient.get<ApiResponse<any>>('/product/dashboard/profit-chart').then(res => res.data),
  getPriceFluctuation: () =>
    axiosClient.get<ApiResponse<any>>('/product/dashboard/price-fluctuation').then(res => res.data),
  getMarketComparison: () =>
    axiosClient.get<ApiResponse<any>>('/product/dashboard/market-comparison').then(res => res.data),
}

export const orderApi = {
  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/product/order', { params }).then(res => res.data),
  checkout: (customerId: string, data: any) =>
    axiosClient.post<ApiResponse<any>>(`/product/order/checkout/${customerId}`, data).then(res => res.data),
}

export const cartApi = {
  getByCustomer: (customerId: string) =>
    axiosClient.get<ApiResponse<any>>(`/product/cart/${customerId}`).then(res => res.data),
  addItem: (customerId: string, data: any) =>
    axiosClient.post<ApiResponse<any>>(`/product/cart/${customerId}/add`, data).then(res => res.data),
  clear: (customerId: string) =>
    axiosClient.delete<ApiResponse<any>>(`/product/cart/${customerId}/clear`).then(res => res.data),
}
