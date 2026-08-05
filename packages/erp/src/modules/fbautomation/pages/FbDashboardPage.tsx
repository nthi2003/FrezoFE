import { Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader, ErrorState } from '@frezo/ui'
import { Bot, Users, UserCheck, Send } from 'lucide-react'
import { FacebookIcon } from '@/components/shared/FacebookIcon'
import { useFbSummary } from '../hooks/useFbAutomation'

export function FbDashboardPage() {
  const { data: summary, isLoading, isError, isFetching, refetch } = useFbSummary()

  const cards = [
    {
      title: 'Tài khoản',
      value: summary?.totalAccounts || 0,
      sub: `${summary?.activeAccounts || 0} đang hoạt động`,
      icon: Bot,
      color: 'bg-blue-50 text-blue-600',
      to: '/fb/accounts',
    },
    {
      title: 'Nhóm',
      value: summary?.totalGroups || 0,
      sub: `${summary?.approvedGroups || 0} đã tham gia`,
      icon: Users,
      color: 'bg-emerald-50 text-emerald-600',
      to: '/fb/groups',
    },
    {
      title: 'Khách tiềm năng',
      value: summary?.totalLeads || 0,
      sub: `${summary?.pendingLeads || 0} chờ xử lý`,
      icon: UserCheck,
      color: 'bg-orange-50 text-orange-600',
      to: '/fb/leads',
    },
    {
      title: 'Đã nhập CRM',
      value: summary?.importedLeads || 0,
      sub: 'vào danh sách khách hàng',
      icon: Send,
      color: 'bg-violet-50 text-violet-600',
      to: '/fb/leads',
    },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <FacebookIcon className="w-6 h-6 text-blue-600" />
            Facebook Automation
          </span>
        }
        description="Tổng quan tài khoản, nhóm và khách tiềm năng thu thập từ Facebook."
      />

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được tổng quan"
            message="Kiểm tra kết nối rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Link
              key={card.title}
              to={card.to}
              className="p-5 bg-white rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4 hover:border-neutral-300 transition-colors"
            >
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon size={22} />
              </div>
              <div>
                <p className="text-sm text-neutral-500 font-medium">{card.title}</p>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-neutral-400 mt-1" />
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-neutral-900">{card.value}</h3>
                    <p className="text-xs text-neutral-400">{card.sub}</p>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-800 mb-3">Thao tác nhanh</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/fb/accounts" className="p-3 bg-blue-50 rounded-lg text-blue-700 font-medium text-sm hover:bg-blue-100 transition-colors text-center">
              Quản lý tài khoản
            </Link>
            <Link to="/fb/scan-groups" className="p-3 bg-emerald-50 rounded-lg text-emerald-700 font-medium text-sm hover:bg-emerald-100 transition-colors text-center">
              Quét nhóm
            </Link>
            <Link to="/fb/leads" className="p-3 bg-orange-50 rounded-lg text-orange-700 font-medium text-sm hover:bg-orange-100 transition-colors text-center">
              Khách tiềm năng
            </Link>
            <Link to="/fb/groups" className="p-3 bg-violet-50 rounded-lg text-violet-700 font-medium text-sm hover:bg-violet-100 transition-colors text-center">
              Danh sách nhóm
            </Link>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-800 mb-3">Hướng dẫn</h2>
          <ol className="space-y-2 text-sm text-neutral-600 list-decimal list-inside">
            <li>Thêm tài khoản Facebook (kèm proxy nếu có)</li>
            <li>Chọn tài khoản và nhập từ khoá để quét nhóm</li>
            <li>Duyệt nhóm phù hợp, tham gia tự động</li>
            <li>Thu thập khách tiềm năng từ các nhóm</li>
            <li>Nhập khách tiềm năng vào danh sách khách hàng CRM</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
