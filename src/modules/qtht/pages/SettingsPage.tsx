import { Settings, Save, Database, Loader2 } from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSettings, useUpdateSetting, useBackupSystem } from '../hooks/useSettings'
import { useState } from 'react'

export function SettingsPage() {
  const { data, isLoading, refetch } = useSettings()
  const updateReq = useUpdateSetting()
  const backupReq = useBackupSystem()

  // Local state for editing value
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  const handleSave = (id: string) => {
    updateReq.mutate({ id, value: editingValue }, {
      onSuccess: () => setEditingId(null)
    })
  }

  const columns: AppTableColumn<any>[] = [
    { title: 'Tên cấu hình', dataIndex: 'key', width: 250, filterType: 'text', render: (val: any) => <span className="font-semibold">{val}</span> },
    { title: 'Mô tả', dataIndex: 'description', filterType: 'text' },
    { 
      title: 'Giá trị (Value)', 
      dataIndex: 'value',
      render: (val: any, record: any) => {
        if (editingId === record.id) {
          return (
            <div className="flex gap-2">
              <Input 
                value={editingValue} 
                onChange={(e) => setEditingValue(e.target.value)} 
                className="h-8 max-w-sm"
              />
              <Button size="sm" onClick={() => handleSave(record.id)} disabled={updateReq.isPending}>
                {updateReq.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Lưu'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Hủy</Button>
            </div>
          )
        }
        return (
          <div className="flex items-center gap-4">
            <span className="text-neutral-700">{val}</span>
            <Button size="sm" variant="ghost" onClick={() => { setEditingId(record.id); setEditingValue(val) }}>Sửa</Button>
          </div>
        )
      }
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Settings className="text-primary-600" />
            Cài đặt Hệ thống
          </h2>
          <p className="text-sm text-neutral-500 mt-1">Cấu hình tham số lõi của Frezo ERP</p>
        </div>
        <Button 
          onClick={() => {
            if(confirm('Hệ thống sẽ thực hiện Backup toàn bộ Database. Quá trình này có thể mất vài phút. Bạn có chắc chắn?')) {
              backupReq.mutate()
            }
          }} 
          disabled={backupReq.isPending}
          variant="outline"
          className="border-primary-600 text-primary-600 hover:bg-primary-50"
        >
          {backupReq.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Database size={16} className="mr-2" />}
          Backup Database
        </Button>
      </div>

      <AppTable 
        columns={columns} 
        data={data} 
        isLoading={isLoading} 
        showSearch
        searchPlaceholder="Tìm kiếm cấu hình..."
        onRefresh={refetch}
        pageIndex={1} 
        pageSize={50} 
        totalElements={data?.length ?? 0} 
      />
    </div>
  )
}
