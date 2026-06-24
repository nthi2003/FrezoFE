import { useState } from 'react'
import { Activity, Trash2, Loader2, RefreshCw, Search } from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppModal } from '@/components/ui/AppModal'
import { useApiLogs, useDeleteApiLogs } from '../hooks/useApiLog'

function formatDateTime(dateStr?: string) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch { return dateStr }
}

function formatJson(str?: string) {
  if (!str) return 'N/A'
  try { return JSON.stringify(JSON.parse(str), null, 2) } catch { return str }
}

export function ApiLogsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { data, isLoading, refetch, isFetching } = useApiLogs(page, pageSize)
  const deleteReq = useDeleteApiLogs()
  const [days, setDays] = useState('30')
  const [selectedLog, setSelectedLog] = useState<any | null>(null)

  const handlePageChange = (newPage: number, newSize: number) => {
    setPage(newPage)
    setPageSize(newSize)
  }

  const columns: AppTableColumn<any>[] = [
    { title: 'Thời gian bắt đầu', dataIndex: 'effFrom', width: 170, render: (val: any) => formatDateTime(val) },
    { title: 'Thời gian kết thúc', dataIndex: 'effTo', width: 170, render: (val: any) => formatDateTime(val) },
    { title: 'Method', dataIndex: 'method', width: 80, filterType: 'text', render: (val: any) => (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
        val === 'GET' ? 'bg-blue-100 text-blue-700' :
        val === 'POST' ? 'bg-green-100 text-green-700' :
        val === 'PUT' ? 'bg-orange-100 text-orange-700' :
        'bg-red-100 text-red-700'
      }`}>{val}</span>
    )},
    { title: 'Đường dẫn (URI)', dataIndex: 'uri', filterType: 'text' },
    { title: 'Status', dataIndex: 'statusCode', width: 80, align: 'center', filterType: 'text', render: (val: any) => (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
        val >= 200 && val < 300 ? 'bg-green-100 text-green-700' :
        val >= 400 ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-700'
      }`}>{val}</span>
    )},
    { title: 'IP Address', dataIndex: 'ipAddress', width: 140 },
    { title: 'User', dataIndex: 'username', width: 120 },
    { title: 'Thời gian phản hồi', dataIndex: 'duration', width: 150, render: (val: any) => val != null ? `${val} ms` : '-' },
    {
      title: '',
      dataIndex: 'id',
      width: 50,
      align: 'center',
      render: (_: any, row: any) => (
        <button
          className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
          onClick={() => setSelectedLog(row)}
          title="Xem chi tiết Request / Response"
        >
          <Search size={15} />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Activity className="text-primary-600" />
            Nhật ký Hệ thống (API Logs)
          </h2>
          <p className="text-sm text-neutral-500 mt-1">Giám sát toàn bộ request vào hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={16} className={`mr-2 ${isFetching ? 'animate-spin' : ''}`} /> Làm mới
          </Button>
          <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-md border border-red-100">
            <span className="text-sm text-red-700 font-medium">Xóa log cũ hơn</span>
            <Input 
              type="number" 
              className="w-16 h-8 text-center" 
              value={days} 
              onChange={e => setDays(e.target.value)} 
            />
            <span className="text-sm text-red-700 font-medium">ngày</span>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => {
                if(confirm(`Xóa toàn bộ log cũ hơn ${days} ngày?`)) deleteReq.mutate(Number(days))
              }}
              disabled={deleteReq.isPending}
            >
              {deleteReq.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </Button>
          </div>
        </div>
      </div>

      <AppTable 
        columns={columns} 
        data={data?.items ?? []} 
        isLoading={isLoading} 
        showSearch
        searchPlaceholder="Tìm kiếm log..."
        onRefresh={() => refetch()}
        pageIndex={page} 
        pageSize={pageSize} 
        totalElements={data?.total ?? 0} 
        onPageChange={handlePageChange} 
      />
      <AppModal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Chi tiết Request / Response" maxWidth="4xl">
        {selectedLog && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium text-neutral-500">Method:</span> <span className="text-neutral-900">{selectedLog.method}</span></div>
              <div><span className="font-medium text-neutral-500">URI:</span> <span className="text-neutral-900 font-mono">{selectedLog.uri}</span></div>
              <div><span className="font-medium text-neutral-500">Status:</span> <span className="text-neutral-900">{selectedLog.statusCode}</span></div>
              <div><span className="font-medium text-neutral-500">IP:</span> <span className="text-neutral-900">{selectedLog.ipAddress}</span></div>
              <div><span className="font-medium text-neutral-500">User:</span> <span className="text-neutral-900">{selectedLog.username}</span></div>
              <div><span className="font-medium text-neutral-500">Thời gian phản hồi:</span> <span className="text-neutral-900">{selectedLog.duration != null ? `${selectedLog.duration} ms` : '-'}</span></div>
              <div><span className="font-medium text-neutral-500">Bắt đầu:</span> <span className="text-neutral-900">{formatDateTime(selectedLog.effFrom)}</span></div>
              <div><span className="font-medium text-neutral-500">Kết thúc:</span> <span className="text-neutral-900">{formatDateTime(selectedLog.effTo)}</span></div>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Request Body
                </h4>
                <pre className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg p-3 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                  {formatJson(selectedLog.requestBody)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Response Body
                </h4>
                <pre className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg p-3 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                  {formatJson(selectedLog.responseBody)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </AppModal>
    </div>
  )
}
