import { Package, AlertTriangle, Sparkles, MoreHorizontal, LineChart } from 'lucide-react'
import { useState } from 'react'
import { formatCurrency } from '@frezo/utils'
import { RowActions } from '@frezo/ui'

interface Props {
  product: any
  categoryLabel?: string
  isSelected?: boolean
  onSelectToggle?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onPriceHistory?: () => void
  onClick?: () => void
}

/**
 * Grid card cho catalog product. Design theo Shopify Admin / Odoo:
 * - Ảnh vuông cover, badge NEW/HOT ở góc
 * - Tên rõ ràng, giá đậm, meta 1 dòng
 * - Cảnh báo tồn kho / hạn dùng nếu có threshold cấu hình
 * - Hover reveal quick actions (edit, delete, more)
 * - Checkbox selection cho bulk actions
 */
export function ProductGridCard({
  product,
  categoryLabel,
  isSelected,
  onSelectToggle,
  onEdit,
  onDelete,
  onPriceHistory,
  onClick,
}: Props) {
  const [imgError, setImgError] = useState(false)

  const isActive = product.isActive !== false
  const isNew = product.isNew
  const hasWarning = product.warningThreshold != null && product.warningThreshold > 0
  const hasExpiryAlert = product.expiryAlertDays != null && product.expiryAlertDays > 0

  return (
    <div
      className={`group relative bg-white rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col ${
        isSelected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-neutral-200'
      } ${!isActive ? 'opacity-70' : ''}`}
    >
      {/* Selection checkbox */}
      {onSelectToggle && (
        <label
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md bg-white/90 backdrop-blur border shadow-sm flex items-center justify-center cursor-pointer transition ${
            isSelected
              ? 'border-primary-500 opacity-100'
              : 'border-neutral-200 opacity-0 group-hover:opacity-100'
          }`}
        >
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={onSelectToggle}
            className="w-3.5 h-3.5 accent-primary-600"
          />
        </label>
      )}

      {/* Image */}
      <div
        className="relative aspect-square bg-neutral-100 cursor-pointer overflow-hidden"
        onClick={onClick}
      >
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <Package size={48} />
          </div>
        )}

        {/* Top-right badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {isNew && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-sm">
              <Sparkles size={10} /> Sản phẩm mới
            </span>
          )}
          {!isActive && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-700 bg-neutral-200 rounded-full">
              Ngừng KD
            </span>
          )}
        </div>

        {/* Hover actions */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <RowActions
            align="end"
            className="rounded-lg bg-white/95 backdrop-blur shadow-sm border border-neutral-200 px-1 py-0.5"
            actions={[
              {
                key: 'price-history',
                icon: LineChart,
                tooltip: 'Biến động giá',
                hidden: !onPriceHistory,
                onClick: () => onPriceHistory?.(),
              },
              { kind: 'edit', hidden: !onEdit, onClick: () => onEdit?.() },
              { kind: 'delete', hidden: !onDelete, onClick: () => onDelete?.() },
            ]}
          />
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        {/* Category + code */}
        <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
          <span className="truncate">{categoryLabel || 'Chưa phân loại'}</span>
          {product.code && (
            <>
              <span className="text-neutral-300">·</span>
              <span className="truncate">{product.code}</span>
            </>
          )}
        </div>

        {/* Name */}
        <h4
          className="text-sm font-semibold text-neutral-800 leading-snug line-clamp-2 min-h-[2.2rem] cursor-pointer hover:text-primary-700 transition"
          onClick={onClick}
          title={product.name}
        >
          {product.name}
        </h4>

        {/* Price */}
        <div className="flex items-end justify-between mt-1 gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">
              Giá bán
            </span>
            <span className="text-base font-bold text-neutral-900 tabular-nums leading-none">
              {formatVND(product.price)}
            </span>
          </div>
        </div>

        {/* Origin / Season chips */}
        {(product.origin || product.season) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {product.origin && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-md bg-blue-50 text-blue-700 font-medium">
                📍 {product.origin}
              </span>
            )}
            {product.season && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-md bg-emerald-50 text-emerald-700 font-medium">
                🌱 {product.season}
              </span>
            )}
          </div>
        )}

        {/* Warning meta */}
        {(hasWarning || hasExpiryAlert) && (
          <div className="mt-auto pt-2 border-t border-neutral-100 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-neutral-500 font-medium">
            {hasWarning && (
              <span className="inline-flex items-center gap-1" title="Ngưỡng cảnh báo tồn kho">
                <AlertTriangle size={10} className="text-orange-500" />
                Cảnh báo &lt; {product.warningThreshold}
              </span>
            )}
            {hasExpiryAlert && (
              <span className="inline-flex items-center gap-1" title="Cảnh báo trước khi hết hạn">
                <MoreHorizontal size={10} className="text-amber-500" />
                Alert {product.expiryAlertDays}d
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function formatVND(v: number | null | undefined): string {
  return formatCurrency(v)
}
