import { useState } from 'react'
import { useProcessInbox, useConversations, useChat } from '../hooks/useAI'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Loader2, Send, CheckCircle, XCircle, Phone, ShoppingCart } from 'lucide-react'

export function InboxPage() {
  const [inboxUrl, setInboxUrl] = useState('')
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<any[]>([])

  const { data: convsData, isLoading } = useConversations()
  const processReq = useProcessInbox()
  const chatReq = useChat()

  const conversations = convsData?.conversations || []

  const handleProcessInbox = () => {
    processReq.mutate({ maxConversations: 5, inboxUrl: inboxUrl.trim() || undefined })
  }

  const handleSendMessage = () => {
    if (!message.trim()) return
    const history = [...chatHistory, { sender: 'customer', text: message }]
    setChatHistory(prev => [...prev, { sender: 'customer', text: message }])
    setMessage('')
    chatReq.mutate(
      { message: message.trim(), history },
      {
        onSuccess: (data: any) => {
          setChatHistory(prev => [...prev, { sender: 'bot', text: data.reply }])
        },
      }
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">🤖 Inbox Bot</h1>
        <p className="text-neutral-500 text-sm">Tự động trả lời tin nhắn Facebook và chốt đơn hàng</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Chat Simulator */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-neutral-50">
            <h2 className="font-semibold text-neutral-800 flex items-center gap-2"><Bot size={18} /> Chat với AI Sales Bot</h2>
          </div>
          <div className="h-80 overflow-y-auto p-4 space-y-3 bg-neutral-50/50">
            {chatHistory.length === 0 && (
              <div className="text-center text-neutral-400 text-sm mt-20">
                Nhập tin nhắn để bắt đầu chat với AI Sales Bot
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${msg.sender === 'customer' ? 'bg-primary-600 text-white rounded-br-md' : 'bg-neutral-200 text-neutral-800 rounded-bl-md'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatReq.isPending && (
              <div className="flex justify-start">
                <div className="bg-neutral-200 px-4 py-2 rounded-2xl text-sm text-neutral-500 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Đang suy nghĩ...
                </div>
              </div>
            )}
          </div>
          <div className="p-3 border-t flex gap-2">
            <Input
              placeholder="Nhập tin nhắn..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} disabled={!message.trim() || chatReq.isPending} size="icon" className="bg-primary-600 hover:bg-primary-700 text-white">
              {chatReq.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Right: Inbox processing */}
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm">
            <h2 className="font-semibold text-neutral-800 mb-3">📨 Xử lý Inbox thật</h2>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="URL Inbox Facebook (để trống để xử lý tất cả)..."
                value={inboxUrl}
                onChange={e => setInboxUrl(e.target.value)}
              />
              <Button onClick={handleProcessInbox} disabled={processReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white whitespace-nowrap">
                {processReq.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
                Xử lý
              </Button>
            </div>

            {processReq.data && (
              <div className="space-y-2 mt-3">
                {Array.isArray((processReq.data as any).results) && (processReq.data as any).results.map((r: any, i: number) => (
                  <div key={i} className={`p-3 rounded-lg text-sm ${r.status === 'replied' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2 font-medium">
                      {r.status === 'replied' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                      {r.customer}
                    </div>
                    {r.reply && <p className="text-neutral-600 mt-1">→ {r.reply}</p>}
                    {r.error && <p className="text-red-500 mt-1">{r.error}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-neutral-50">
              <h2 className="font-semibold text-neutral-800">📊 Hội thoại đã xử lý</h2>
            </div>
            {isLoading ? (
              <div className="p-6 text-center text-neutral-400">Đang tải...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-neutral-400">Chưa có hội thoại nào</div>
            ) : (
              <table className="w-full">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 text-sm font-medium text-neutral-600">Khách hàng</th>
                    <th className="text-center px-4 py-2 text-sm font-medium text-neutral-600"><Phone size={14} /></th>
                    <th className="text-center px-4 py-2 text-sm font-medium text-neutral-600"><ShoppingCart size={14} /></th>
                    <th className="text-center px-4 py-2 text-sm font-medium text-neutral-600">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((c: any) => (
                    <tr key={c.id} className="border-b hover:bg-neutral-50">
                      <td className="px-4 py-2 text-sm font-medium">{c.customer}</td>
                      <td className="px-4 py-2 text-center text-sm">{c.phone || '—'}</td>
                      <td className="px-4 py-2 text-center">{c.is_ordered ? <CheckCircle className="w-4 h-4 text-green-600 inline" /> : '—'}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.status === 'converted' ? 'text-green-700 bg-green-50' : 'text-blue-700 bg-blue-50'}`}>{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
