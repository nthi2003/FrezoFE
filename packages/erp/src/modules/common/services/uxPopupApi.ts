import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'
import { API } from '@/lib/axios/apiEndpoints'

export interface UxPopupTemplate {
  eventCode: string
  title: string
  body?: string | null
  imageUrl?: string | null
  enabled: boolean
}

export const uxPopupApi = {
  getByEvent: (eventCode: string) =>
    axiosClient
      .get<ApiResponse<UxPopupTemplate | null>>(API.QTHT.UX_POPUP_BY_EVENT(eventCode))
      .then((res) => res.data),
}
