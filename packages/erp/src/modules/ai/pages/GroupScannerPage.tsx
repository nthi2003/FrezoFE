import { useState } from 'react'
import { useScanGroups, useGroups, useDeleteGroup } from '../hooks/useAI'
import { Button } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { Search, Trash2, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string }> = {
  approved: { label: 'Đã duyệt', color: 'text-green-600 bg-green-50' },
  pending: { label: 'Chờ duyệt', color: 'text-yellow-600 bg-yellow-50' },
  rejected: { label: 'Từ chối', color: 'text-red-600 bg-red-50' },
}

export function GroupScannerPage() {
  const [keyword, setKeyword] = useState('')
  const [maxResults, setMaxResults] = useState(20)
  const [filter, setFilter] = useState<string | undefined>(undefined)

  const { data, isLoading } = useGroups(filter)
  const scanReq = useScanGroups()
  const deleteReq = useDeleteGroup()

  const groups = data?.groups || []

  const handleScan = () => {
    if (!keyword.trim()) return
    scanReq.mutate({ keyword: keyword.trim(), maxResults })
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">🔍 Quét Group Facebook</h1>
          <p className="text-neutral-500 text-sm">Nhập từ khóa để tìm kiếm group, AI tự động phân tích và lọc</p>
        </div>
      </div>

      <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Nhập từ khóa ví dụ: Nhà hàng Đà Nẵng, Nguồn hàng F&B..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleScan()}
            className="flex-1"
          />
          <div className="flex gap-2">
            <select
              value={maxResults}
              onChange={e => setMaxResults(Number(e.target.value))}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
            >
              <option value={10}>10 groups</option>
              <option value={20}>20 groups</option>
              <option value={50}>50 groups</option>
            </select>
            <Button onClick={handleScan} disabled={scanReq.isPending || !keyword.trim()} className="bg-primary-600 hover:bg-primary-700 text-white whitespace-nowrap">
              {scanReq.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              {scanReq.isPending ? 'Đang quét...' : 'Quét Group'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'approved', 'pending', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s === 'all' ? undefined : s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${(filter === undefined && s === 'all') || filter === s ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
          >
            {s === 'all' ? 'Tất cả' : s === 'approved' ? 'Đã duyệt' : s === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-neutral-400">Đang tải...</div>
        ) : groups.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">
            {scanReq.isPending ? 'Đang quét group...' : 'Chưa có group nào. Hãy nhập từ khóa và bấm "Quét Group" để bắt đầu.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Tên Group</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Group ID</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Độ phù hợp</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Trạng thái</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g: any) => {
                const cfg = statusConfig[g.status] || { label: g.status, color: 'text-neutral-600 bg-neutral-50' }
                const score = (g.score * 100).toFixed(0)
                return (
                  <tr key={g.id} className="border-b last:border-b-0 hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900">{g.name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-500">{g.group_id}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${Number(score) >= 70 ? 'text-green-700 bg-green-50' : Number(score) >= 40 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'}`}>
                        {score}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="icon" onClick={() => deleteReq.mutate(g.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
