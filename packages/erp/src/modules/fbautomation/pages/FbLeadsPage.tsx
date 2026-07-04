import { useState } from 'react'
import { Trash2, Loader2, Download, CheckCircle } from 'lucide-react'
import { Button } from '@frezo/ui'
import { FacebookIcon } from '@/components/shared/FacebookIcon'
import { useFbLeads, useDeleteFbLead, useImportLead, useImportBatchLeads } from '../hooks/useFbAutomation'

export function FbLeadsPage() {
  const [filter, setFilter] = useState<string | undefined>()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: leads, isLoading } = useFbLeads(filter)
  const deleteReq = useDeleteFbLead()
  const importReq = useImportLead()
  const importBatchReq = useImportBatchLeads()

  const list = leads || []

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === list.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(list.map((l: any) => l.id)))
    }
  }

  const handleImportBatch = () => {
    if (selectedIds.size === 0) { alert('Vui lòng chọn ít nhất 1 lead'); return }
    importBatchReq.mutate(Array.from(selectedIds))
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            <FacebookIcon className="w-6 h-6 inline-block mr-2 text-blue-600" />
            Leads - Khách hàng tiềm năng
          </h1>
          <p className="text-neutral-500 text-sm">Danh sách khách hàng tiềm năng thu thập từ Facebook Groups</p>
        </div>
        {selectedIds.size > 0 && (
          <Button onClick={handleImportBatch} disabled={importBatchReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white">
            {importBatchReq.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Import {selectedIds.size} leads
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {['all', 'NEW', 'IMPORTED'].map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s === 'all' ? undefined : s); setSelectedIds(new Set()) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${(filter === undefined && s === 'all') || filter === s ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
          >
            {s === 'all' ? 'Tất cả' : s === 'NEW' ? 'Chờ import' : 'Đã import'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-neutral-400">Đang tải...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">Chưa có lead nào.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" onChange={selectAll} checked={selectedIds.size === list.length && list.length > 0} className="rounded" />
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Tên</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">SĐT</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Nguồn</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Trạng thái</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map((lead: any) => (
                <tr key={lead.id} className="border-b last:border-b-0 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => toggleSelect(lead.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{lead.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{lead.phone || '---'}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{lead.email || '---'}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500 max-w-[200px] truncate">{lead.sourceGroupName || 'N/A'}</td>
                  <td className="px-4 py-3 text-center">
                    {lead.status === 'IMPORTED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                        <CheckCircle className="w-3 h-3" /> Đã import
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                        Tiềm năng
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {lead.status !== 'IMPORTED' ? (
                        <Button variant="ghost" size="sm" onClick={() => importReq.mutate(lead.id)} disabled={importReq.isPending} className="text-primary-600 hover:text-primary-800">
                          {importReq.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
                          Import
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="icon" onClick={() => deleteReq.mutate(lead.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
