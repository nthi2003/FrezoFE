import { Filter } from 'lucide-react'

export interface FunnelRow {
  name: string
  count: number
  amount: number
}

// Recharts v3.x Funnel API không ổn định giữa các minor version, nên render
// funnel bằng CSS/Flex — trực quan, không cần thư viện, mỗi row shrink theo max.
export function PipelineFunnel({ data, isLoading }: { data: FunnelRow[]; isLoading?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  const palette = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9']

  return (
    <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Phễu bán hàng</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Số cơ hội theo giai đoạn</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[240px] flex items-center justify-center text-neutral-400">Đang tải...</div>
      ) : data.length === 0 ? (
        <div className="flex-1 min-h-[240px] flex flex-col items-center justify-center text-neutral-400">
          <Filter size={40} className="opacity-30 mb-2" />
          <p className="text-sm">Chưa có cơ hội trong phễu bán hàng</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center gap-2 py-2">
          {data.map((row, i) => {
            const pct = Math.max(20, Math.round((row.count / max) * 100))
            const color = palette[i % palette.length]
            return (
              <div key={row.name} className="flex items-center gap-3">
                <div className="w-24 text-xs font-medium text-neutral-600 truncate" title={row.name}>
                  {row.name}
                </div>
                <div className="relative flex-1 h-8 bg-neutral-100 rounded overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-md flex items-center justify-center text-xs font-bold text-white transition-all"
                    style={{ width: `${pct}%`, backgroundColor: color, minWidth: 60 }}
                  >
                    {row.count} cơ hội
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
