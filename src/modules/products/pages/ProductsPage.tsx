// Product Page (placeholder)
import { Package } from 'lucide-react'
export function ProductsPage() {
  return (
    <div className="space-y-4">
      <div><h2 className="page-title">Quản lý sản phẩm</h2><p className="page-subtitle">Danh mục sản phẩm và đơn hàng</p></div>
      <div className="card flex flex-col items-center py-16 text-neutral-400">
        <Package size={48} className="mb-3 opacity-20" />
        <p className="text-sm">Danh sách sản phẩm: GET /product</p>
      </div>
    </div>
  )
}

