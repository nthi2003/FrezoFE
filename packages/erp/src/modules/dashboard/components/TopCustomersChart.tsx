import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Users } from 'lucide-react'
import { formatCurrency } from '@frezo/utils'

export interface TopCustomerRow {
  name: string
  revenue: number
}

const BAR_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e']

/**
 * Top 5 khách hàng theo doanh thu YTD (horizontal bar).
 * Data build phía page từ invoices PAID/PARTIALLY_PAID group by customerId.
 */
export function TopCustomersChart({
  data,
  isLoading,
}: {
  data: TopCustomerRow[]
  isLoading?: boolean
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Top 5 khách hàng</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Theo doanh thu YTD</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[240px] flex items-center justify-center text-neutral-400">Đang tải...</div>
      ) : data.length === 0 ? (
        <div className="flex-1 min-h-[240px] flex flex-col items-center justify-center text-neutral-400">
          <Users size={40} className="opacity-30 mb-2" />
          <p className="text-sm">Chưa có dữ liệu khách hàng</p>
        </div>
      ) : (
        <div className="flex-1 min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                width={120}
                tick={{ fontSize: 12, fill: '#334155' }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
              />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={22}>
                {data.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
