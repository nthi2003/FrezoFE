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
    /**
     * Danh sách lead — hỗ trợ filter theo cả status và source.
     * source: FACEBOOK | LANDING | ZALO | MANUAL (bỏ trống = tất cả).
     */
    getAll: (status?: string, source?: string) =>
      axiosClient.get('/fb/leads', { params: { status, source } }).then(r => r.data?.data ?? r.data),
    getById: (id: string) =>
      axiosClient.get(`/fb/leads/${id}`).then(r => r.data?.data ?? r.data),
    delete: (id: string) =>
      axiosClient.delete(`/fb/leads/${id}`).then(r => r.data?.data ?? r.data),
    importToCustomer: (id: string) =>
      axiosClient.post(`/fb/leads/${id}/import`).then(r => r.data?.data ?? r.data),
    importBatch: (ids: string[]) =>
      axiosClient.post('/fb/leads/import-batch', { ids }).then(r => r.data?.data ?? r.data),
    assign: (id: string, username: string) =>
      axiosClient.post(`/fb/leads/${id}/assign`, { username }).then(r => r.data?.data ?? r.data),
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
  // ============================================================
  // Frezo MKT Suite — lead import, content scheduler, affiliate
  // Endpoint prefix `/mkt/*` — tách khỏi `/fb/*` cũ để tránh nhầm module.
  // ============================================================
  leadImport: {
    upload: (file: File, source?: string, dedupe = true) => {
      const fd = new FormData()
      fd.append('file', file)
      return axiosClient
        .post('/mkt/leads/import', fd, {
          params: { source, dedupe },
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then(r => r.data?.data ?? r.data)
    },
    preview: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return axiosClient
        .post('/mkt/leads/import/preview', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then(r => r.data?.data ?? r.data)
    },
    history: () =>
      axiosClient.get('/mkt/leads/import/history').then(r => r.data?.data ?? r.data),
    rollback: (batchId: string) =>
      axiosClient.delete(`/mkt/leads/import/${batchId}`).then(r => r.data?.data ?? r.data),
  },
  posts: {
    list: (params?: { status?: string; channel?: string }) =>
      axiosClient.get('/mkt/posts', { params }).then(r => r.data?.data ?? r.data),
    get: (id: string) =>
      axiosClient.get(`/mkt/posts/${id}`).then(r => r.data?.data ?? r.data),
    create: (data: any) =>
      axiosClient.post('/mkt/posts', data).then(r => r.data?.data ?? r.data),
    update: (id: string, data: any) =>
      axiosClient.put(`/mkt/posts/${id}`, data).then(r => r.data?.data ?? r.data),
    delete: (id: string) =>
      axiosClient.delete(`/mkt/posts/${id}`).then(r => r.data?.data ?? r.data),
    duplicate: (id: string) =>
      axiosClient.post(`/mkt/posts/${id}/duplicate`).then(r => r.data?.data ?? r.data),
    cancel: (id: string) =>
      axiosClient.post(`/mkt/posts/${id}/cancel`).then(r => r.data?.data ?? r.data),
    publishNow: (id: string) =>
      axiosClient.post(`/mkt/posts/${id}/publish`).then(r => r.data?.data ?? r.data),
  },
  affiliate: {
    list: (params?: { campaign?: string; status?: string; kolName?: string }) =>
      axiosClient.get('/mkt/affiliate', { params }).then(r => r.data?.data ?? r.data),
    get: (id: string) =>
      axiosClient.get(`/mkt/affiliate/${id}`).then(r => r.data?.data ?? r.data),
    create: (data: any) =>
      axiosClient.post('/mkt/affiliate', data).then(r => r.data?.data ?? r.data),
    update: (id: string, data: any) =>
      axiosClient.put(`/mkt/affiliate/${id}`, data).then(r => r.data?.data ?? r.data),
    delete: (id: string) =>
      axiosClient.delete(`/mkt/affiliate/${id}`).then(r => r.data?.data ?? r.data),
    dashboard: () =>
      axiosClient.get('/mkt/affiliate/dashboard').then(r => r.data?.data ?? r.data),
    convert: (code: string, value?: number) =>
      axiosClient.post(`/mkt/affiliate/${code}/convert`, null, { params: { value } })
        .then(r => r.data?.data ?? r.data),
  },
}

export default fbApi
