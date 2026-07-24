import { useState } from 'react'
import { Search, Trash2, Loader2, CheckCircle } from 'lucide-react'
import { Button, Input } from '@frezo/ui'
import { toast } from 'sonner'
import { FacebookIcon } from '@/components/shared/FacebookIcon'
import { useFbGroups, useDeleteFbGroup, useScanFbGroups, useJoinFbGroup, useFbAccounts } from '../hooks/useFbAutomation'

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Mới', color: 'text-blue-600 bg-blue-50' },
  JOINED: { label: 'Đã tham gia', color: 'text-green-600 bg-green-50' },
  REJECTED: { label: 'Từ chối', color: 'text-red-600 bg-red-50' },
  READY_TO_JOIN: { label: 'Sẵn sàng', color: 'text-yellow-600 bg-yellow-50' },
}

export function FbGroupScannerPage() {
  const [keyword, setKeyword] = useState('')
  const [maxResults, setMaxResults] = useState(20)
  const [accountId, setAccountId] = useState('')
  const [filter, setFilter] = useState<string | undefined>()

  const { data: accounts } = useFbAccounts()
  const { data: groups, isLoading } = useFbGroups(filter)
  const scanReq = useScanFbGroups()
  const deleteReq = useDeleteFbGroup()
  const joinReq = useJoinFbGroup()

  const list = groups || []
  const accList = accounts || []

  const handleScan = () => {
    if (!keyword.trim() || !accountId) return
    scanReq.mutate({ accountId, keyword: keyword.trim(), maxResults })
  }

  const handleJoin = (groupId: string) => {
    if (!accountId) { toast.error('Vui lòng chọn tài khoản trước'); return }
    joinReq.mutate({ accountId, groupId })
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900"><FacebookIcon className="w-6 h-6 inline-block mr-2 text-blue-600" />Quét Group Facebook</h1>
        <p className="text-neutral-500 text-sm">Sử dụng Selenium để tìm kiếm groups theo từ khóa</p>
      </div>

      <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Chọn tài khoản</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
            >
              <option value="">-- Chọn tài khoản --</option>
              {accList.map((a: any) => (
                <option key={a.id} value={a.id}>{a.username} {a.proxyIp ? `(proxy: ${a.proxyIp})` : ''}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Nhập từ khóa ví dụ: Nhà hàng Đà Nẵng, Chợ dân sinh..."
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
            <Button onClick={handleScan} disabled={scanReq.isPending || !keyword.trim() || !accountId} className="bg-primary-600 hover:bg-primary-700 text-white whitespace-nowrap">
              {scanReq.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              {scanReq.isPending ? 'Đang quét...' : 'Quét Group'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'NEW', 'JOINED', 'REJECTED', 'READY_TO_JOIN'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s === 'all' ? undefined : s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${(filter === undefined && s === 'all') || filter === s ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
          >
            {s === 'all' ? 'Tất cả' : s === 'NEW' ? 'Mới' : s === 'JOINED' ? 'Đã tham gia' : s === 'REJECTED' ? 'Từ chối' : 'Sẵn sàng'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-neutral-400">Đang tải...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">
            {scanReq.isPending ? 'Đang quét groups...' : 'Chưa có group nào. Hãy nhập từ khóa và bấm "Quét Group" để bắt đầu.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Tên Group</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Group ID</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Thành viên</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Độ phù hợp</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Trạng thái</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map((g: any) => {
                const cfg = statusConfig[g.status] || { label: g.status, color: 'text-neutral-600 bg-neutral-50' }
                return (
                  <tr key={g.id} className="border-b last:border-b-0 hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{g.groupName}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500">{g.groupId}</td>
                    <td className="px-4 py-3 text-center text-sm text-neutral-500">{g.memberCount?.toLocaleString() || 'N/A'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${(g.relevanceScore || 0) >= 0.7 ? 'text-green-700 bg-green-50' : (g.relevanceScore || 0) >= 0.4 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'}`}>
                        {((g.relevanceScore || 0) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {g.status === 'NEW' || g.status === 'READY_TO_JOIN' ? (
                          <Button variant="ghost" size="sm" onClick={() => handleJoin(g.groupId)} disabled={joinReq.isPending} className="text-green-600 hover:text-green-800">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Tham gia
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="icon" onClick={() => deleteReq.mutate(g.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
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
