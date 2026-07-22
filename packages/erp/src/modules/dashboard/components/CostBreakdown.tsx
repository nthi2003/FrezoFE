import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import { formatCurrency } from '@frezo/utils'

export interface CostSlice {
  name: string
  value: number
  color: string
}

/**
 * Cơ cấu chi phí (donut chart): Lương / BHXH / Vận hành / Khác.
 * Data build phía page — cost slice ước lượng client-side.
 */
export function CostBreakdown({ data, isLoading }: { data: CostSlice[]; isLoading?: boolean }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0)

  return (
    <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Cơ cấu chi phí</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Tổng: {formatCurrency(total)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[240px] flex items-center justify-center text-neutral-400">Đang tải...</div>
      ) : total === 0 ? (
        <div className="flex-1 min-h-[240px] flex flex-col items-center justify-center text-neutral-400">
          <PieIcon size={40} className="opacity-30 mb-2" />
          <p className="text-sm">Chưa có dữ liệu chi phí</p>
        </div>
      ) : (
        <div className="flex-1 min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                {data.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend
                iconType="circle"
                verticalAlign="bottom"
                height={30}
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
