import { Link } from 'react-router-dom'
import { useAIHealth, useGroups, usePosts, useComments, useConversations } from '../hooks/useAI'
import { Bot, MessageCircle, Send, Users, Activity } from 'lucide-react'
import { PageHeader, Skeleton, ErrorState } from '@frezo/ui'

function StatCard({ title, value, icon: Icon, color, isLoading, to }: any) {
  const body = (
    <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4 hover:border-neutral-300 transition-colors h-full">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} />
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
  return to ? <Link to={to}>{body}</Link> : body
}

export function AIDashboardPage() {
  const { data: health, isError, isFetching, refetch } = useAIHealth()
  const { data: groupsData, isLoading: groupsLoading } = useGroups()
  const { data: postsData, isLoading: postsLoading } = usePosts()
  const { data: commentsData, isLoading: commentsLoading } = useComments()
  const { data: convsData, isLoading: convsLoading } = useConversations()

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <PageHeader
        title="Bảng điều khiển AI Automation"
        description={
          <>
            Trạng thái:{' '}
            {health?.status === 'ok' ? (
              <span className="text-emerald-600 font-medium">Hoạt động</span>
            ) : (
              <span className="text-rose-600 font-medium">Không kết nối</span>
            )}
            {' · '}FrezoAI v2.0
          </>
        }
      />

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không kết nối được AI service"
            message="Kiểm tra FrezoAI đang chạy rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Group đã quét" value={groupsData?.groups?.length || 0} icon={Users} color="bg-blue-50 text-blue-600" isLoading={groupsLoading} to="/ai/scan-groups" />
        <StatCard title="Bài đã đăng" value={postsData?.posts?.length || 0} icon={Send} color="bg-emerald-50 text-emerald-600" isLoading={postsLoading} to="/ai/poster" />
        <StatCard title="Comment xử lý" value={commentsData?.comments?.length || 0} icon={MessageCircle} color="bg-orange-50 text-orange-600" isLoading={commentsLoading} to="/ai/comments" />
        <StatCard title="Hội thoại Inbox" value={convsData?.conversations?.length || 0} icon={Bot} color="bg-violet-50 text-violet-600" isLoading={convsLoading} to="/ai/inbox" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <Activity size={18} /> Tình trạng hệ thống
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Dịch vụ AI</span>
              <span className="text-emerald-600 font-medium">Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Tài khoản Facebook</span>
              <span className="text-neutral-700">{health?.status === 'ok' ? 'Sẵn sàng' : 'Chưa kết nối'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Cơ sở dữ liệu</span>
              <span className="text-emerald-600 font-medium">SQLite</span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-800 mb-3">Thao tác nhanh</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/ai/scan-groups" className="p-3 bg-blue-50 rounded-lg text-blue-700 font-medium text-sm hover:bg-blue-100 transition-colors text-center">Quét Group</Link>
            <Link to="/ai/poster" className="p-3 bg-emerald-50 rounded-lg text-emerald-700 font-medium text-sm hover:bg-emerald-100 transition-colors text-center">Đăng bài</Link>
            <Link to="/ai/comments" className="p-3 bg-orange-50 rounded-lg text-orange-700 font-medium text-sm hover:bg-orange-100 transition-colors text-center">Comment</Link>
            <Link to="/ai/inbox" className="p-3 bg-violet-50 rounded-lg text-violet-700 font-medium text-sm hover:bg-violet-100 transition-colors text-center">Inbox Bot</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
