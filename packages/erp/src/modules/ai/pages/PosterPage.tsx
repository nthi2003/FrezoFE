import { useState } from 'react'
import { usePostToGroups, usePosts, useGroups } from '../hooks/useAI'
import { Button } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { Send, Loader2, CheckCircle, XCircle } from 'lucide-react'

export function PosterPage() {
  const [topic, setTopic] = useState('')
  const [maxPosts, setMaxPosts] = useState(5)
  const [dryRun, setDryRun] = useState(false)

  const { data: groupsData } = useGroups('approved')
  const { data: postsData, isLoading } = usePosts()
  const postReq = usePostToGroups()

  const posts = postsData?.posts || []
  const approvedCount = groupsData?.groups?.length || 0

  const handlePost = () => {
    if (!topic.trim()) return
    postReq.mutate({ topic: topic.trim(), maxPosts, dryRun })
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">📝 Đăng bài tự động</h1>
        <p className="text-neutral-500 text-sm">AI sinh nội dung và đăng lên các Group đã duyệt (có sẵn: {approvedCount} groups)</p>
      </div>

      <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Chủ đề bài viết, ví dụ: Rau sạch VietGAP hôm nay có xà lách rom..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-500">Số group:</label>
            <select value={maxPosts} onChange={e => setMaxPosts(Number(e.target.value))} className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white">
              {[1, 3, 5, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} className="rounded" />
            Chạy thử
          </label>
          <Button onClick={handlePost} disabled={postReq.isPending || !topic.trim()} className="bg-primary-600 hover:bg-primary-700 text-white whitespace-nowrap">
            {postReq.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {postReq.isPending ? 'Đang đăng...' : dryRun ? 'Xem trước' : 'Đăng bài'}
          </Button>
        </div>
      </div>

      {postReq.data && (
        <div className="space-y-2">
          <h2 className="font-semibold text-neutral-800">Kết quả:</h2>
          <div className="grid gap-2">
            {(postReq.data as any).results?.map((r: any, i: number) => (
              <div key={i} className={`p-4 rounded-lg border ${r.status === 'posted' || r.status === 'dry_run' ? 'bg-green-50 border-green-200' : r.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-neutral-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {r.status === 'posted' || r.status === 'dry_run' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                  <span className="font-medium text-sm">{r.group_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'posted' ? 'bg-green-100 text-green-700' : r.status === 'dry_run' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                </div>
                {r.content && <p className="text-sm text-neutral-600 ml-6">{r.content.slice(0, 200)}...</p>}
                {r.error && <p className="text-sm text-red-500 ml-6">{r.error}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-neutral-50">
          <h2 className="font-semibold text-neutral-800">📋 Lịch sử bài đăng</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-neutral-400">Đang tải...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-neutral-400">Chưa có bài đăng nào</div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Nội dung</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Trạng thái</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p: any) => (
                <tr key={p.id} className="border-b hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm text-neutral-700">{p.content}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'posted' ? 'text-green-700 bg-green-50' : p.status === 'failed' ? 'text-red-700 bg-red-50' : 'text-yellow-700 bg-yellow-50'}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500 text-center">{p.posted_at ? new Date(p.posted_at).toLocaleString('vi-VN') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
