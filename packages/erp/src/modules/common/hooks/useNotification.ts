import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '../services/notificationApi'

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.getMyNotifications,

  })
}
