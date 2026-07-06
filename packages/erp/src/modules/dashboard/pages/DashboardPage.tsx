import { 
  useDashboardSummary, 
  useExportAttendance, 
  useProfitChart, 
  usePriceFluctuation, 
  useMarketComparison, 
  useLoginByDay 
} from '../hooks/useDashboard'
import { ShoppingBag, TrendingUp, Users, AlertTriangle, Download, Loader2, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react'
import { Button } from '@frezo/ui'
import { Skeleton } from '@frezo/ui'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { AppTable } from '@/components/ui/AppTable'

function StatCard({ title, value, subtitle, icon: Icon, colorClass, isLoading }: any) {
  return (
    <div className="relative overflow-hidden p-6 bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${colorClass.split(' ')[0]} group-hover:scale-150 transition-transform duration-500`}></div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <h3 className="text-2xl font-bold text-neutral-900">{value}</h3>
          )}
          {subtitle && (
            <p className="text-xs font-medium mt-2 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
}

export function DashboardPage() {
  const { data: summary, isLoading: sumLoading } = useDashboardSummary()
  const { data: profitData, isLoading: profitLoading } = useProfitChart(30)
  const { data: priceData, isLoading: priceLoading } = usePriceFluctuation()
  const { data: marketData, isLoading: marketLoading } = useMarketComparison()
  const { data: loginData, isLoading: loginLoading } = useLoginByDay()
  
  const exportReq = useExportAttendance()

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-neutral-50/50 min-h-[calc(100vh-64px)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Tổng quan Hoạt động</h1>
          <p className="text-neutral-500 text-sm mt-1">Dữ liệu được cập nhật theo thời gian thực từ hệ thống</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => exportReq.mutate()} disabled={exportReq.isPending} variant="outline" className="bg-white">
            {exportReq.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Download size={16} className="mr-2" />}
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Đơn hàng hôm nay" 
          value={summary?.ordersToday || 0} 
          icon={ShoppingBag} 
          colorClass="bg-blue-50 text-blue-600" 
          isLoading={sumLoading}
          subtitle={<span className="text-blue-600">Phát sinh trong ngày</span>}
        />
        <StatCard 
          title="Đơn hàng tháng này" 
          value={summary?.ordersThisMonth || 0} 
          icon={Package} 
          colorClass="bg-indigo-50 text-indigo-600" 
          isLoading={sumLoading}
          subtitle={
            summary?.ordersChangePercent >= 0 
              ? <span className="text-green-600 flex items-center"><ArrowUpRight size={14}/> +{summary?.ordersChangePercent}% so với tháng trước</span>
              : <span className="text-red-600 flex items-center"><ArrowDownRight size={14}/> {summary?.ordersChangePercent}% so với tháng trước</span>
          }
        />
        <StatCard 
          title="Doanh thu tháng (Tạm tính)" 
          value={formatCurrency(summary?.revenueThisMonth)} 
          icon={TrendingUp} 
          colorClass="bg-green-50 text-green-600" 
          isLoading={sumLoading}
          subtitle={<span className="text-green-600">Đã bao gồm VAT</span>}
        />
        <StatCard 
          title="Tổng nhân sự" 
          value={summary?.totalEmployees || 0} 
          icon={Users} 
          colorClass="bg-orange-50 text-orange-600" 
          isLoading={sumLoading}
          subtitle={<span className="text-orange-600">+{summary?.newEmployees || 0} nhân sự mới tháng này</span>}
        />
        <StatCard 
          title="Cảnh báo tồn kho" 
          value={summary?.lowStockProducts || 0} 
          icon={AlertTriangle} 
          colorClass="bg-red-50 text-red-600" 
          isLoading={sumLoading}
          subtitle={<span className="text-red-600">Sản phẩm sắp hết hàng</span>}
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <h3 className="text-base font-semibold text-neutral-900 mb-6">Biểu đồ Doanh thu & Lợi nhuận (30 ngày)</h3>
          {profitLoading ? (
            <div className="h-[300px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
          ) : profitData?.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profitData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={(v) => v.substring(5)} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} dy={10} />
                  <YAxis tickFormatter={(v) => `${v / 1000000}M`} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} dx={-10} />
                  <CartesianGrid vertical={false} stroke="#f5f5f5" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="cost" name="Giá vốn" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-neutral-400">Không có dữ liệu biểu đồ</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <h3 className="text-base font-semibold text-neutral-900 mb-6">Thống kê Đăng nhập (7 ngày)</h3>
          {loginLoading ? (
            <div className="h-[300px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
          ) : loginData?.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loginData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="date" tickFormatter={(v) => v.substring(5)} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                  <Tooltip cursor={{fill: '#f9fafb'}} />
                  <Bar dataKey="count" name="Lượt đăng nhập" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-neutral-400">Không có dữ liệu</div>
          )}
        </div>
      </div>

      {/* Row 3: Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-neutral-100">
            <h3 className="text-base font-semibold text-neutral-900">Biến động giá thị trường (Top)</h3>
          </div>
          <div className="p-0 flex-1 overflow-auto">
            <AppTable 
              data={priceData || []} 
              isLoading={priceLoading}
              columns={[
                { title: 'Sản phẩm', dataIndex: 'productName' },
                { title: 'Giá hôm qua', dataIndex: 'oldPrice', render: (v: number) => formatCurrency(v) },
                { title: 'Giá hôm nay', dataIndex: 'newPrice', render: (v: number) => <span className="font-semibold">{formatCurrency(v)}</span> },
                { 
                  title: 'Biến động', 
                  dataIndex: 'changePercent', 
                  render: (v: number) => (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${v > 0 ? 'bg-green-100 text-green-700' : v < 0 ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-700'}`}>
                      {v > 0 ? '+' : ''}{v}%
                    </span>
                  ) 
                }
              ]}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-neutral-100">
            <h3 className="text-base font-semibold text-neutral-900">So sánh giá Chợ đầu mối</h3>
          </div>
          <div className="p-0 flex-1 overflow-auto">
            <AppTable 
              data={marketData || []} 
              isLoading={marketLoading}
              columns={[
                { title: 'Sản phẩm', dataIndex: 'productName' },
                { title: 'Giá nội bộ', dataIndex: 'internalPrice', render: (v: number) => <span className="text-primary-700 font-medium">{formatCurrency(v)}</span> },
                { title: 'Giá thị trường', dataIndex: 'marketPrice', render: (v: number) => formatCurrency(v) },
                { 
                  title: 'Chênh lệch', 
                  dataIndex: 'diffPercent', 
                  render: (v: number) => (
                    <span className={`text-sm font-medium ${v > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {v > 0 ? '+' : ''}{v}%
                    </span>
                  ) 
                }
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
