// Customer Page (placeholder)
import { UserCheck } from 'lucide-react'
export function CustomersPage() {
  return (
    <div className="space-y-4">
      <div><h2 className="page-title">Quản lý khách hàng</h2><p className="page-subtitle">Danh sách khách hàng và nhà cung cấp</p></div>
      <div className="card flex flex-col items-center py-16 text-neutral-400">
        <UserCheck size={48} className="mb-3 opacity-20" />
        <p className="text-sm">Danh sách khách hàng: GET /customer</p>
      </div>
    </div>
  )
}

