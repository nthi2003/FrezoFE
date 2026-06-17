import aiClient from '@/lib/axios/aiClient'

function unwrap(r: any) {
  return r.data?.data ?? r.data
}

export const aiApi = {
  health: () =>
    aiClient.get('/health').then(unwrap),

  getAccounts: () =>
    aiClient.get('/accounts').then(unwrap),
  addAccount: (data: { email: string; password: string; proxy?: string }) =>
    aiClient.post('/accounts', data).then(unwrap),

  scanGroups: (keyword: string, maxResults = 20) =>
    aiClient.post('/scan-groups', { keyword, max_results: maxResults }).then(unwrap),
  getGroups: (status?: string) =>
    aiClient.get('/groups', { params: { status } }).then(unwrap),
  deleteGroup: (id: number) =>
    aiClient.delete(`/groups/${id}`).then(unwrap),

  postToGroups: (topic: string, maxPosts = 5, dryRun = false) =>
    aiClient.post('/post', { topic, max_posts: maxPosts, dry_run: dryRun }).then(unwrap),
  getPosts: () =>
    aiClient.get('/posts').then(unwrap),

  scanComments: (maxComments = 10) =>
    aiClient.post('/scan-comments', null, { params: { max_comments: maxComments } }).then(unwrap),
  getComments: () =>
    aiClient.get('/comments').then(unwrap),

  processInbox: (maxConversations = 5, inboxUrl?: string) =>
    aiClient.post('/process-inbox', null, {
      params: { max_conversations: maxConversations, inbox_url: inboxUrl }
    }).then(unwrap),
  getConversations: () =>
    aiClient.get('/conversations').then(unwrap),

  generateContent: (topic: string, tone = 'bán hàng', variations = 1) =>
    aiClient.post('/generate-content', { topic, tone, variations }).then(unwrap),

  chat: (message: string, history: any[] = []) =>
    aiClient.post('/chat', { message, conversation_history: history }).then(unwrap),

  getRagContexts: () =>
    aiClient.get('/rag-contexts').then(unwrap),
  addRagContext: (title: string, content: string) =>
    aiClient.post('/rag-context', { title, content }).then(unwrap),

  startScheduler: () =>
    aiClient.post('/scheduler/start').then(unwrap),
  stopScheduler: () =>
    aiClient.post('/scheduler/stop').then(unwrap),

  scanGgMap: (keyword: string, maxResults = 20) =>
    aiClient.post('/ggmap/scan', { keyword, max_results: maxResults }).then(unwrap),
  getGgMapResults: (keyword?: string, status?: string) =>
    aiClient.get('/ggmap/results', { params: { keyword, status } }).then(unwrap),
  importGgMapResult: (id: number) =>
    aiClient.post(`/ggmap/import/${id}`).then(unwrap),
  importAllGgMapResults: (ids: number[]) =>
    aiClient.post('/ggmap/import-all', { ids }).then(unwrap),
}
