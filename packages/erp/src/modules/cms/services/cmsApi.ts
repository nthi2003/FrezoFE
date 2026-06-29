import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export const cmsVoucherApi = {
  getAll: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/cms/voucher', { params }).then(res => res.data),
  create: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/cms/voucher', data).then(res => res.data),
  updateStatus: (id: string, data: any) =>
    axiosClient.patch<ApiResponse<any>>(`/cms/voucher/${id}/status`, data).then(res => res.data),
}

export const cmsCustomerApi = {
  export: (params?: any) =>
    axiosClient.get<ApiResponse<any>>('/cms/customer/export', { params }).then(res => res.data),
}

export const cmsOrderApi = {
  updatePaymentStatus: (data: any) =>
    axiosClient.post<ApiResponse<any>>('/cms/order/payment-status', data).then(res => res.data),
}
