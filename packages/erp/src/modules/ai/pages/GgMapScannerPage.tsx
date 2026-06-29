import { useState } from 'react'
import { useGgMapScan, useGgMapResults, useImportGgMapResult, useImportAllGgMapResults } from '../hooks/useAI'
import { Button } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { Search, Loader2, MapPin, Star, Phone, Download, CheckCircle } from 'lucide-react'

export function GgMapScannerPage() {
  const [keyword, setKeyword] = useState('')
  const [maxResults, setMaxResults] = useState(20)

  const scanReq = useGgMapScan()
  const { data, isLoading } = useGgMapResults()
  const importReq = useImportGgMapResult()
  const importAllReq = useImportAllGgMapResults()

  const results = data?.results || data || []

  const handleScan = () => {
    if (!keyword.trim()) return
    scanReq.mutate({ keyword: keyword.trim(), maxResults })
  }

  const handleImport = (id: number) => importReq.mutate(id)
  const handleImportAll = () => {
    const ids = (Array.isArray(results) ? results : []).map((r: any) => r.id)
    if (ids.length > 0) importAllReq.mutate(ids)
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            <MapPin className="w-6 h-6 inline-block mr-2 text-red-500" />
            Quét Google Maps
          </h1>
          <p className="text-neutral-500 text-sm">Tìm kiếm quán ăn, nhà hàng, cửa hàng trên Google Maps và import vào danh sách khách hàng tiềm năng</p>
        </div>
      </div>

      <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Nhập từ khóa ví dụ: Quán ăn Đà Nẵng, Nhà hàng Hà Nội..."
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
              <option value={10}>10 kết quả</option>
              <option value={20}>20 kết quả</option>
              <option value={50}>50 kết quả</option>
            </select>
            <Button
              onClick={handleScan}
              disabled={scanReq.isPending || !keyword.trim()}
              className="bg-primary-600 hover:bg-primary-700 text-white whitespace-nowrap"
            >
              {scanReq.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              {scanReq.isPending ? 'Đang quét...' : 'Quét Maps'}
            </Button>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">Tìm thấy {results.length} kết quả</p>
          <Button
            onClick={handleImportAll}
            disabled={importAllReq.isPending}
            variant="outline"
            className="border-primary-300 text-primary-700 hover:bg-primary-50"
          >
            {importAllReq.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Import tất cả
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-neutral-400">Đang tải...</div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">
            {scanReq.isPending
              ? 'Đang quét Google Maps...'
              : 'Chưa có dữ liệu. Hãy nhập từ khóa và bấm "Quét Maps" để bắt đầu.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Tên quán</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Địa chỉ</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">SĐT</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Đánh giá</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Trạng thái</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r: any) => (
                <tr key={r.id} className="border-b last:border-b-0 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{r.name}</p>
                    {r.website && (
                      <a href={r.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                        {r.website}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500 max-w-[250px] truncate">{r.address}</td>
                  <td className="px-4 py-3 text-center text-sm">
                    {r.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        {r.phone}
                      </span>
                    ) : (
                      <span className="text-neutral-300">---</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.rating ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        {r.rating}
                      </span>
                    ) : (
                      <span className="text-neutral-300">---</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.status === 'imported' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                        <CheckCircle className="w-3 h-3" />
                        Đã import
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                        Tiềm năng
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.status !== 'imported' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleImport(r.id)}
                        disabled={importReq.isPending}
                        className="text-primary-600 hover:text-primary-800 hover:bg-primary-50"
                      >
                        {importReq.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
                        Import
                      </Button>
                    ) : (
                      <span className="text-xs text-green-600">Đã import</span>
                    )}
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
