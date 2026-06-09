import { useDashboardSummary, useExportAttendance } from '../hooks/useDashboard'
import { Users, FileText, Calendar, Ticket, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

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

export function DashboardPage() {
  const { data, isLoading } = useDashboardSummary()
  const exportReq = useExportAttendance()

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tổng quan Hệ thống</h1>
          <p className="text-neutral-500 text-sm mt-1">Số liệu thống kê tự động từ Frezo ERP</p>
        </div>
        <Button onClick={() => exportReq.mutate()} disabled={exportReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white">
          {exportReq.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Download size={16} className="mr-2" />}
          Xuất báo cáo Điểm danh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng nhân sự" 
          value={data?.totalPersons || 0} 
          icon={Users} 
          color="bg-blue-50 text-blue-600" 
          isLoading={isLoading} 
        />
        <StatCard 
          title="Hợp đồng đang có" 
          value={data?.totalContracts || 0} 
          icon={FileText} 
          color="bg-green-50 text-green-600" 
          isLoading={isLoading} 
        />
        <StatCard 
          title="Đơn nghỉ chờ duyệt" 
          value={data?.pendingLeaves || 0} 
          icon={Calendar} 
          color="bg-orange-50 text-orange-600" 
          isLoading={isLoading} 
        />
        <StatCard 
          title="Ticket đang xử lý" 
          value={data?.activeTickets || 0} 
          icon={Ticket} 
          color="bg-purple-50 text-purple-600" 
          isLoading={isLoading} 
        />
      </div>

      <div className="mt-8 p-12 bg-white rounded-xl border border-neutral-200 text-center shadow-sm">
        <h2 className="text-xl font-bold text-neutral-800 mb-2">Chào mừng đến với Frezo ERP</h2>
        <p className="text-neutral-500">Hệ thống quản trị nguồn lực doanh nghiệp toàn diện. Các Module chi tiết vui lòng truy cập tại thanh Sidebar bên trái.</p>
      </div>
    </div>
  )
}
