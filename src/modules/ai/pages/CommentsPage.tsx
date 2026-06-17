import { useScanComments, useComments } from '../hooks/useAI'
import { Button } from '@/components/ui/button'
import { MessageCircle, Loader2, CheckCircle, XCircle } from 'lucide-react'

export function CommentsPage() {
  const { data, isLoading } = useComments()
  const scanReq = useScanComments()

  const comments = data?.comments || []

  const intentColors: Record<string, string> = {
    ask_price: 'text-blue-700 bg-blue-50',
    ask_order: 'text-green-700 bg-green-50',
    ask_info: 'text-purple-700 bg-purple-50',
    spam: 'text-red-700 bg-red-50',
    positive: 'text-emerald-700 bg-emerald-50',
    negative: 'text-orange-700 bg-orange-50',
    unknown: 'text-neutral-500 bg-neutral-50',
  }

  const intentLabels: Record<string, string> = {
    ask_price: 'Hỏi giá',
    ask_order: 'Đặt hàng',
    ask_info: 'Hỏi thông tin',
    spam: 'Spam',
    positive: 'Tích cực',
    negative: 'Tiêu cực',
    unknown: 'Chưa xác định',
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">💬 Quản lý Comment</h1>
          <p className="text-neutral-500 text-sm">Quét và trả lời comment tự động bằng AI</p>
        </div>
        <Button onClick={() => scanReq.mutate(20)} disabled={scanReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white whitespace-nowrap">
          {scanReq.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageCircle className="w-4 h-4 mr-2" />}
          {scanReq.isPending ? 'Đang quét...' : 'Quét comment mới'}
        </Button>
      </div>

      {scanReq.data && (
        <div className="space-y-2">
          <h2 className="font-semibold text-neutral-800">Kết quả quét:</h2>
          <div className="grid gap-2">
            {(scanReq.data as any).results?.filter((r: any) => r.status !== 'skipped').map((r: any, i: number) => (
              <div key={i} className={`p-4 rounded-lg border ${r.status === 'replied' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {r.status === 'replied' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                  <span className="font-medium text-sm">{r.author}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                </div>
                <p className="text-sm text-neutral-500 ml-6 mt-1">"{r.text}"</p>
                {r.reply && <p className="text-sm text-green-700 ml-6 mt-1">→ {r.reply}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-neutral-50">
          <h2 className="font-semibold text-neutral-800">Tất cả Comment</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-neutral-400">Đang tải...</div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center text-neutral-400">Chưa có comment nào. Hãy quét comment để bắt đầu.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Tác giả</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Nội dung</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Ý định</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Đã reply</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm font-medium">{c.author}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600 max-w-xs truncate">{c.text}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${intentColors[c.intent] || intentColors.unknown}`}>
                      {intentLabels[c.intent] || c.intent}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.is_replied ? (
                      <span className="text-green-600 text-xs font-medium">✓ {c.reply?.slice(0, 50)}...</span>
                    ) : (
                      <span className="text-neutral-400 text-xs">—</span>
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
