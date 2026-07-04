import { useState } from 'react'
import { Bot, Users, UserCheck, Send, Loader2 } from 'lucide-react'
import { Button } from '@frezo/ui'
import { FacebookIcon } from '@/components/shared/FacebookIcon'
import { useFbSummary } from '../hooks/useFbAutomation'

export function FbDashboardPage() {
  const { data: summary, isLoading } = useFbSummary()

  const cards = [
    { title: 'Tài khoản', value: summary?.totalAccounts || 0, sub: `${summary?.activeAccounts || 0} đang hoạt động`, icon: Bot, color: 'bg-blue-50 text-blue-600' },
    { title: 'Groups', value: summary?.totalGroups || 0, sub: `${summary?.approvedGroups || 0} đã tham gia`, icon: Users, color: 'bg-green-50 text-green-600' },
    { title: 'Leads (KH tiềm năng)', value: summary?.totalLeads || 0, sub: `${summary?.pendingLeads || 0} chờ xử lý`, icon: UserCheck, color: 'bg-orange-50 text-orange-600' },
    { title: 'Đã import', value: summary?.importedLeads || 0, sub: 'vào danh sách khách hàng', icon: Send, color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900"><FacebookIcon className="w-6 h-6 inline-block mr-2 text-blue-600" />Facebook Automation</h1>
        <p className="text-neutral-500 text-sm">Quản lý tài khoản, quét groups, thu thập khách hàng tiềm năng từ Facebook</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.title} className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
            <div className={`p-4 rounded-lg ${card.color}`}>
              <card.icon size={24} />
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
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <a href="/fb/accounts" className="p-3 bg-blue-50 rounded-lg text-blue-700 font-medium text-sm hover:bg-blue-100 transition-colors text-center">
              Quản lý tài khoản
            </a>
            <a href="/fb/scan-groups" className="p-3 bg-green-50 rounded-lg text-green-700 font-medium text-sm hover:bg-green-100 transition-colors text-center">
              Quét Groups
            </a>
            <a href="/fb/leads" className="p-3 bg-orange-50 rounded-lg text-orange-700 font-medium text-sm hover:bg-orange-100 transition-colors text-center">
              Leads tiềm năng
            </a>
            <a href="/fb/groups" className="p-3 bg-purple-50 rounded-lg text-purple-700 font-medium text-sm hover:bg-purple-100 transition-colors text-center">
              Danh sách Groups
            </a>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Hướng dẫn</h2>
          <ol className="space-y-2 text-sm text-neutral-600 list-decimal list-inside">
            <li>Thêm tài khoản Facebook vào hệ thống (kèm proxy nếu có)</li>
            <li>Chọn tài khoản và nhập từ khóa để quét groups</li>
            <li>Duyệt groups phù hợp, thực hiện tham gia tự động</li>
            <li>Thu thập leads (khách hàng tiềm năng) từ các group</li>
            <li>Import leads vào danh sách khách hàng CRM</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
