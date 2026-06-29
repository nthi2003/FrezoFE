import { useAIHealth, useGroups, usePosts, useComments, useConversations } from '../hooks/useAI'
import { Bot, MessageCircle, Send, Users, Activity, Loader2 } from 'lucide-react'
import { Skeleton } from '@frezo/ui'

function StatCard({ title, value, icon: Icon, color, isLoading }: any) {
  return (
    <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
      <div className={`p-4 rounded-lg ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-neutral-500 font-medium">{title}</p>
        {isLoading ? (
          <Skeleton className="h-8 w-24 mt-1" />
        ) : (
          <h3 className="text-2xl font-bold text-neutral-900">{value}</h3>
        )}
      </div>
    </div>
  )
}

export function AIDashboardPage() {
  const { data: health } = useAIHealth()
  const { data: groupsData, isLoading: groupsLoading } = useGroups()
  const { data: postsData, isLoading: postsLoading } = usePosts()
  const { data: commentsData, isLoading: commentsLoading } = useComments()
  const { data: convsData, isLoading: convsLoading } = useConversations()

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">AI Automation Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Trạng thái: {health?.status === 'ok'
            ? <span className="text-green-600 font-medium">Hoạt động</span>
            : <span className="text-red-600 font-medium">Không kết nối</span>}
          {' | '}FrezoAI v2.0
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Group đã quét" value={groupsData?.groups?.length || 0} icon={Users} color="bg-blue-50 text-blue-600" isLoading={groupsLoading} />
        <StatCard title="Bài đã đăng" value={postsData?.posts?.length || 0} icon={Send} color="bg-green-50 text-green-600" isLoading={postsLoading} />
        <StatCard title="Comment xử lý" value={commentsData?.comments?.length || 0} icon={MessageCircle} color="bg-orange-50 text-orange-600" isLoading={commentsLoading} />
        <StatCard title="Hội thoại Inbox" value={convsData?.conversations?.length || 0} icon={Bot} color="bg-purple-50 text-purple-600" isLoading={convsLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2"><Activity size={20} /> Tình trạng hệ thống</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">AI Service</span><span className="text-green-600 font-medium">Online</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Facebook Account</span><span className="text-neutral-700">{health?.status === 'ok' ? 'Sẵn sàng' : 'Chưa kết nối'}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Database</span><span className="text-green-600 font-medium">SQLite</span></div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">🚀 Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <a href="/ai/scan-groups" className="p-3 bg-blue-50 rounded-lg text-blue-700 font-medium text-sm hover:bg-blue-100 transition-colors text-center">🔍 Quét Group</a>
            <a href="/ai/poster" className="p-3 bg-green-50 rounded-lg text-green-700 font-medium text-sm hover:bg-green-100 transition-colors text-center">📝 Đăng bài</a>
            <a href="/ai/comments" className="p-3 bg-orange-50 rounded-lg text-orange-700 font-medium text-sm hover:bg-orange-100 transition-colors text-center">💬 Comment</a>
            <a href="/ai/inbox" className="p-3 bg-purple-50 rounded-lg text-purple-700 font-medium text-sm hover:bg-purple-100 transition-colors text-center">🤖 Inbox Bot</a>
          </div>
        </div>
      </div>
    </div>
  )
}
