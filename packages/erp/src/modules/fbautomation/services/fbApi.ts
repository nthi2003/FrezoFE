import axiosClient from '@/lib/axios/axiosClient'

const fbApi = {
  accounts: {
    getAll: () =>
      axiosClient.get('/fb/accounts').then(r => r.data?.data ?? r.data),
    getById: (id: string) =>
      axiosClient.get(`/fb/accounts/${id}`).then(r => r.data?.data ?? r.data),
    create: (data: any) =>
      axiosClient.post('/fb/accounts', data).then(r => r.data?.data ?? r.data),
    update: (id: string, data: any) =>
      axiosClient.put(`/fb/accounts/${id}`, data).then(r => r.data?.data ?? r.data),
    delete: (id: string) =>
      axiosClient.delete(`/fb/accounts/${id}`).then(r => r.data?.data ?? r.data),
    updateCookie: (id: string, cookie: string) =>
      axiosClient.put(`/fb/accounts/${id}/cookie`, cookie, {
        headers: { 'Content-Type': 'text/plain' }
      }).then(r => r.data?.data ?? r.data),
  },
  groups: {
    getAll: (status?: string) =>
      axiosClient.get('/fb/groups', { params: { status } }).then(r => r.data?.data ?? r.data),
    getById: (id: string) =>
      axiosClient.get(`/fb/groups/${id}`).then(r => r.data?.data ?? r.data),
    delete: (id: string) =>
      axiosClient.delete(`/fb/groups/${id}`).then(r => r.data?.data ?? r.data),
  },
  leads: {
    getAll: (status?: string) =>
      axiosClient.get('/fb/leads', { params: { status } }).then(r => r.data?.data ?? r.data),
    getById: (id: string) =>
      axiosClient.get(`/fb/leads/${id}`).then(r => r.data?.data ?? r.data),
    delete: (id: string) =>
      axiosClient.delete(`/fb/leads/${id}`).then(r => r.data?.data ?? r.data),
    importToCustomer: (id: string) =>
      axiosClient.post(`/fb/leads/${id}/import`).then(r => r.data?.data ?? r.data),
    importBatch: (ids: string[]) =>
      axiosClient.post('/fb/leads/import-batch', { ids }).then(r => r.data?.data ?? r.data),
  },
  automation: {
    scanGroups: (data: { accountId: string; keyword: string; maxResults?: number }) =>
      axiosClient.post('/fb/automation/scan-groups', data).then(r => r.data?.data ?? r.data),
    joinGroup: (data: { accountId: string; groupId: string }) =>
      axiosClient.post('/fb/automation/join-group', data).then(r => r.data?.data ?? r.data),
    login: (accountId: string) =>
      axiosClient.post(`/fb/automation/login/${accountId}`).then(r => r.data?.data ?? r.data),
    summary: () =>
      axiosClient.get('/fb/automation/summary').then(r => r.data?.data ?? r.data),
  },
}

export default fbApi
