// ============================================================
// PurchaseRequestsPage — danh sách PR
// ============================================================

import { useNavigate } from 'react-router-dom'
import { FileText, Loader2, Send } from 'lucide-react'
import { Button, PageHeader, EmptyState } from '@frezo/ui'
import {
  usePurchaseRequests,
  useSubmitPurchaseRequest,
} from '../hooks/usePurchaseRequest'

export function PurchaseRequestsPage() {
  const nav = useNavigate()
  const { data: list = [], isLoading } = usePurchaseRequests()
  const submit = useSubmitPurchaseRequest()

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Purchase Requests"
        description="Yêu cầu mua từ stock alerts — submit để vào Approval Inbox."
        actions={
          <Button
            variant="outline"
            onClick={() => nav('/warehouse/stock-alerts')}
          >
            Từ Stock Alerts
          </Button>
        }
      />

      {isLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
        </div>
      ) : list.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={FileText}
            title="Chưa có PR"
            description="Chọn alerts cùng supplier trên trang Stock Alerts rồi Tạo PR."
            action={{
              label: 'Mở Stock Alerts',
              onClick: () => nav('/warehouse/stock-alerts'),
            }}
          />
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-xl bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600 text-left">
              <tr>
                <th className="p-3">Mã</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Lines</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((pr) => (
                <tr key={pr.id} className="hover:bg-neutral-50">
                  <td className="p-3 font-mono text-xs">
                    <button
                      type="button"
                      className="text-primary-700 hover:underline"
                      onClick={() =>
                        nav(`/warehouse/purchase-requests/${pr.id}`)
                      }
                    >
                      {pr.code || pr.id}
                    </button>
                  </td>
                  <td className="p-3">{pr.supplierName || pr.supplierId || '—'}</td>
                  <td className="p-3 tabular-nums">{pr.lines?.length || 0}</td>
                  <td className="p-3">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border bg-neutral-50">
                      {pr.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        nav(`/warehouse/purchase-requests/${pr.id}`)
                      }
                    >
                      Chi tiết
                    </Button>
                    {(pr.status || '').toUpperCase() === 'DRAFT' && (
                      <Button
                        size="sm"
                        className="gap-1"
                        disabled={submit.isPending}
                        onClick={() => submit.mutate(pr.id)}
                      >
                        <Send size={12} /> Submit
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
