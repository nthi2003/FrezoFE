import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@/types/api.types'

export const websocketChannelApi = {
  getAll: () =>
    axiosClient.get<ApiResponse<any>>('/qtht/websocket-channel').then(res => res.data),
}

export const testWebSocketApi = {
  sendToTopic: (topicName: string, data: any) =>
    axiosClient.post<ApiResponse<any>>(`/qtht/test-ws/topic/${topicName}`, data).then(res => res.data),
  sendToUser: (username: string, destination: string, data: any) =>
    axiosClient.post<ApiResponse<any>>(`/qtht/test-ws/user/${username}/${destination}`, data).then(res => res.data),
}
