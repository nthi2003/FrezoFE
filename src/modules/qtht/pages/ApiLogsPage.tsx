import { useState } from 'react'
import { Activity, Trash2, Loader2, RefreshCw } from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApiLogs, useDeleteApiLogs } from '../hooks/useApiLog'

export function ApiLogsPage() {
  const { data, isLoading, refetch, isFetching } = useApiLogs()
  const deleteReq = useDeleteApiLogs()
  const [days, setDays] = useState('30')

  const columns: AppTableColumn<any>[] = [
    { title: 'Thời gian', dataIndex: 'createdAt', width: 160 },
    { title: 'Method', dataIndex: 'method', width: 80, render: (val: any) => (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
        val === 'GET' ? 'bg-blue-100 text-blue-700' :
        val === 'POST' ? 'bg-green-100 text-green-700' :
        val === 'PUT' ? 'bg-orange-100 text-orange-700' :
        'bg-red-100 text-red-700'
      }`}>{val}</span>
    )},
    { title: 'Đường dẫn (URI)', dataIndex: 'uri' },
    { title: 'Status', dataIndex: 'statusCode', width: 80, align: 'center', render: (val: any) => (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
        val >= 200 && val < 300 ? 'bg-green-100 text-green-700' :
        val >= 400 ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-700'
      }`}>{val}</span>
    )},
    { title: 'IP Address', dataIndex: 'ipAddress', width: 140 },
    { title: 'User', dataIndex: 'username', width: 120 },
    { title: 'Thời gian phản hồi', dataIndex: 'executionTime', width: 150, render: (val: any) => `${val} ms` },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
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
        data={data} 
        isLoading={isLoading} 
        pageIndex={1} 
        pageSize={50} 
        totalElements={data.length} 
      />
    </div>
  )
}
