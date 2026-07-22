import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Bot, Loader2, Send, CheckCircle, XCircle, Phone, ShoppingCart,
  Search, Filter, Facebook, MessageSquare, User, RefreshCw, Sparkles,
  ExternalLink, Copy, Circle, ChevronDown, Zap, Play, ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useProcessInbox, useConversations, useChat } from '../hooks/useAI'
import { Button, Input, PageHeader, PageGuideButton, type PageGuideConfig } from '@frezo/ui'

// ============================================================
// Constants
// ============================================================

const INBOX_GUIDE: PageGuideConfig = {
  title: 'Inbox AI (Facebook)',
  subtitle:
    'Trung tâm hội thoại từ Facebook — AI tự trả lời, trích SĐT khách và đề xuất chốt đơn. Bạn giám sát và can thiệp khi cần.',
  sections: [
    {
      type: 'steps',
      heading: 'Cách vận hành',
      steps: [
        {
          title: 'Nhấn "Quét inbox"',
          description:
            'Hệ thống kết nối Facebook page → lấy 5 hội thoại gần nhất → AI phân tích → trả lời tự động.',
        },
        {
          title: 'Xem log ở panel bên trái',
          description:
            'Mỗi hội thoại hiển thị: tên khách, SĐT (nếu detect được), trạng thái (đã reply / chốt đơn / lỗi).',
        },
        {
          title: 'Test AI ở panel giữa',
          description:
            'Nhập tin nhắn giả lập vai khách hàng — xem AI trả lời như thế nào trước khi bật auto reply thật.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo dùng',
      tips: [
        'AI học từ RAG context (Kiến thức) — vào "RAG Contexts" để dạy AI về sản phẩm/chính sách.',
        'Khách "converted" (chốt đơn) sẽ tự tạo record trong CRM và merge duplicate theo SĐT.',
        'Nếu AI trả lời sai → bật "Manual mode" ở conversation → nhân viên trả lời trực tiếp.',
      ],
    },
  ],
}

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả', color: 'text-neutral-700' },
  { key: 'active', label: 'Đang chat', color: 'text-blue-700' },
  { key: 'converted', label: 'Đã chốt đơn', color: 'text-emerald-700' },
  { key: 'missed', label: 'Cần theo dõi', color: 'text-orange-700' },
] as const

// ============================================================
// Page
// ============================================================

export function InboxPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [activeFilter, setActiveFilter] = useState<typeof FILTER_TABS[number]['key']>('all')
  const [testMessage, setTestMessage] = useState('')
  const [testChatHistory, setTestChatHistory] = useState<any[]>([])
  const [inboxUrl, setInboxUrl] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const testChatEndRef = useRef<HTMLDivElement>(null)

  const { data: convsData, isLoading, refetch, isFetching } = useConversations()
  const processReq = useProcessInbox()
  const chatReq = useChat()

  const conversations: any[] = convsData?.conversations || []

  // ---- Derived state ----
  const filteredConvs = useMemo(() => {
    let list = conversations
    if (activeFilter === 'converted') list = list.filter((c) => c.is_ordered || c.status === 'converted')
    if (activeFilter === 'active') list = list.filter((c) => !c.is_ordered && c.status !== 'error')
    if (activeFilter === 'missed') list = list.filter((c) => c.status === 'error' || (!c.phone && !c.is_ordered))
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim()
      list = list.filter(
        (c) =>
          (c.customer || '').toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [conversations, activeFilter, searchText])

  const selected = useMemo(
    () => filteredConvs.find((c) => c.id === selectedId) || filteredConvs[0] || null,
    [filteredConvs, selectedId],
  )

  const stats = useMemo(() => {
    const converted = conversations.filter((c) => c.is_ordered || c.status === 'converted').length
    const withPhone = conversations.filter((c) => c.phone).length
    const conversionRate = conversations.length > 0 ? (converted / conversations.length) * 100 : 0
    return {
      total: conversations.length,
      converted,
      withPhone,
      conversionRate,
    }
  }, [conversations])

  // ---- Auto-scroll test chat ----
  useEffect(() => {
    testChatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [testChatHistory, chatReq.isPending])

  // ---- Auto-select first conversation ----
  useEffect(() => {
    if (!selectedId && filteredConvs.length > 0) {
      setSelectedId(filteredConvs[0].id)
    }
  }, [filteredConvs, selectedId])

  // ---- Handlers ----
  const handleProcessInbox = () => {
    processReq.mutate({ maxConversations: 5, inboxUrl: inboxUrl.trim() || undefined })
  }

  const handleSendTest = () => {
    if (!testMessage.trim()) return
    const msg = testMessage.trim()
    const nextHistory = [...testChatHistory, { sender: 'customer', text: msg, ts: new Date().toISOString() }]
    setTestChatHistory(nextHistory)
    setTestMessage('')
    chatReq.mutate(
      { message: msg, history: nextHistory },
      {
        onSuccess: (data: any) => {
          setTestChatHistory((prev) => [
            ...prev,
            { sender: 'bot', text: data.reply, ts: new Date().toISOString() },
          ])
        },
      },
    )
  }

  const handleClearTest = () => {
    setTestChatHistory([])
  }

  const copyPhone = (phone: string) => {
    if (!phone) return
    navigator.clipboard.writeText(phone)
    toast.success('Đã copy số điện thoại')
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="p-6 space-y-4 h-[calc(100vh-64px)] flex flex-col bg-neutral-50/50">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Facebook size={20} className="text-blue-600" /> Inbox AI
          </span>
        }
        description="Trung tâm hội thoại Facebook — AI tự trả lời & chốt đơn, bạn giám sát khi cần."
        actions={
          <>
            <PageGuideButton guide={INBOX_GUIDE} />
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              {isFetching ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <RefreshCw size={15} />
              )}
              Làm mới
            </Button>
            <Button
              onClick={handleProcessInbox}
              disabled={processReq.isPending}
              className="gap-2 bg-primary-700 hover:bg-primary-800 text-white shadow-sm"
            >
              {processReq.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Zap size={15} />
              )}
              Quét inbox
            </Button>
          </>
        }
      />

      {/* Compact stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip label="Hội thoại" value={String(stats.total)} tone="blue" icon={MessageSquare} />
        <StatChip label="Đã chốt đơn" value={String(stats.converted)} tone="emerald" icon={ShoppingCart} />
        <StatChip label="Có SĐT" value={String(stats.withPhone)} tone="amber" icon={Phone} />
        <StatChip
          label="Tỉ lệ chốt"
          value={`${stats.conversionRate.toFixed(1)}%`}
          tone="violet"
          icon={Sparkles}
        />
      </div>

      {/* Advanced controls (URL override) */}
      {showAdvanced && (
        <div className="p-3 bg-white border border-neutral-200 rounded-xl flex items-center gap-2 shadow-sm">
          <span className="text-xs font-semibold text-neutral-500 shrink-0">URL Inbox override:</span>
          <Input
            placeholder="https://www.facebook.com/messages/t/..."
            value={inboxUrl}
            onChange={(e) => setInboxUrl(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(false)}
            className="text-neutral-500"
          >
            Đóng
          </Button>
        </div>
      )}
      {!showAdvanced && (
        <button
          onClick={() => setShowAdvanced(true)}
          className="text-xs font-medium text-neutral-500 hover:text-primary-600 inline-flex items-center gap-1 self-start -mt-1"
        >
          <ChevronDown size={12} /> Advanced settings
        </button>
      )}

      {/* Process result banner */}
      {processReq.data && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle size={16} />
          Đã xử lý {(processReq.data as any).results?.length || 0} hội thoại
          {(processReq.data as any).results?.some((r: any) => r.status === 'converted') && (
            <span className="ml-auto text-xs font-semibold bg-white px-2 py-0.5 rounded-md border border-emerald-200">
              🎉 Có đơn mới
            </span>
          )}
        </div>
      )}

      {/* 3-pane layout */}
      <div className="flex-1 min-h-0 grid grid-cols-[280px_1fr_320px] gap-4 overflow-hidden">
        {/* ==================== LEFT: Conversation list ==================== */}
        <div className="flex flex-col bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden">
          {/* Search + filter */}
          <div className="p-3 border-b border-neutral-100 space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Tìm hội thoại..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="h-9 w-full pl-8 pr-2 text-sm bg-neutral-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 placeholder:text-neutral-400"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {FILTER_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveFilter(t.key)}
                  className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    activeFilter === t.key
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-neutral-500 hover:bg-neutral-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
                <MessageSquare size={32} className="opacity-40 mb-2" />
                <p className="text-sm font-medium">Chưa có hội thoại</p>
                <p className="text-xs mt-1 text-center px-4">
                  {activeFilter !== 'all'
                    ? 'Không có hội thoại khớp filter'
                    : 'Bấm "Quét inbox" để lấy dữ liệu từ Facebook'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-50">
                {filteredConvs.map((c) => {
                  const isActive = selected?.id === c.id
                  return (
                    <li
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={`px-3 py-2.5 cursor-pointer transition-colors border-l-2 ${
                        isActive
                          ? 'bg-primary-50/60 border-primary-500'
                          : 'border-transparent hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar name={c.customer} size="sm" tone={c.is_ordered ? 'emerald' : 'blue'} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-neutral-800 truncate">
                              {c.customer || 'Ẩn danh'}
                            </span>
                            {c.is_ordered && (
                              <span title="Đã chốt đơn">
                                <ShoppingCart size={11} className="text-emerald-500 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate">
                            {c.phone || (c.last_message?.slice(0, 40) || 'Chưa có SĐT')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pl-8">
                        <StatusDot status={c.status} />
                        {c.updated_at && (
                          <span className="text-[10px] text-neutral-400 tabular-nums">
                            {timeAgo(c.updated_at)}
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ==================== MIDDLE: Thread + Test chat ==================== */}
        <div className="flex flex-col bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden">
          {selected ? (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-3">
                <Avatar name={selected.customer} size="md" tone={selected.is_ordered ? 'emerald' : 'blue'} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-neutral-800 truncate flex items-center gap-2">
                    {selected.customer || 'Ẩn danh'}
                    <span className="text-[10px] font-normal text-neutral-400 inline-flex items-center gap-0.5">
                      <Facebook size={9} /> Facebook
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center gap-2">
                    <StatusDot status={selected.status} />
                    {selected.updated_at && (
                      <span className="text-neutral-400">· {timeAgo(selected.updated_at)}</span>
                    )}
                  </div>
                </div>
                {selected.thread_url && (
                  <a
                    href={selected.thread_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Mở trên Facebook"
                  >
                    <ExternalLink size={15} />
                  </a>
                )}
              </div>

              {/* Thread body — real messages if available, else placeholder */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-neutral-50/50 to-white">
                {Array.isArray(selected.messages) && selected.messages.length > 0 ? (
                  selected.messages.map((m: any, i: number) => (
                    <MessageBubble
                      key={i}
                      sender={m.sender === 'customer' || m.role === 'user' ? 'customer' : 'bot'}
                      text={m.text || m.content}
                      ts={m.ts || m.timestamp}
                    />
                  ))
                ) : (
                  <>
                    {selected.last_message && (
                      <MessageBubble sender="customer" text={selected.last_message} ts={selected.updated_at} />
                    )}
                    {selected.reply && <MessageBubble sender="bot" text={selected.reply} ts={selected.updated_at} />}
                    {!selected.last_message && !selected.reply && (
                      <div className="flex flex-col items-center justify-center h-full text-neutral-400 py-16">
                        <MessageSquare size={40} className="opacity-30 mb-3" />
                        <p className="text-sm font-medium">Chưa có lịch sử tin nhắn chi tiết</p>
                        <p className="text-xs mt-1 text-center max-w-xs">
                          Dùng khung Test AI bên dưới để giả lập trò chuyện với khách này.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Test AI (Simulator) area */}
              <div className="border-t border-neutral-100 bg-neutral-50/70 max-h-[280px] flex flex-col">
                <div className="px-4 py-2 flex items-center gap-2 border-b border-neutral-100 bg-white">
                  <Bot size={13} className="text-primary-500" />
                  <span className="text-xs font-semibold text-neutral-700">
                    Test AI Reply — giả lập vai khách hàng
                  </span>
                  {testChatHistory.length > 0 && (
                    <button
                      onClick={handleClearTest}
                      className="ml-auto text-[11px] text-neutral-400 hover:text-rose-500 font-medium"
                    >
                      Xoá
                    </button>
                  )}
                </div>
                {testChatHistory.length > 0 && (
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[160px]">
                    {testChatHistory.map((m, i) => (
                      <MessageBubble key={i} sender={m.sender} text={m.text} ts={m.ts} compact />
                    ))}
                    {chatReq.isPending && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-neutral-200 px-3 py-2 rounded-2xl text-xs text-neutral-500 flex items-center gap-2 shadow-sm">
                          <Loader2 className="w-3 h-3 animate-spin" /> AI đang soạn...
                        </div>
                      </div>
                    )}
                    <div ref={testChatEndRef} />
                  </div>
                )}
                <div className="p-2 flex items-center gap-2 border-t border-neutral-100 bg-white">
                  <input
                    type="text"
                    placeholder='Ví dụ: "Cho hỏi giá bao nhiêu?"'
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendTest()}
                    className="flex-1 h-9 px-3 text-sm bg-neutral-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 placeholder:text-neutral-400"
                  />
                  <Button
                    onClick={handleSendTest}
                    disabled={!testMessage.trim() || chatReq.isPending}
                    size="icon"
                    className="bg-primary-600 hover:bg-primary-700 text-white h-9 w-9 shrink-0"
                  >
                    {chatReq.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
              <MessageSquare size={56} className="opacity-30 mb-4" />
              <p className="text-base font-medium text-neutral-500">Chọn hội thoại để xem chi tiết</p>
              <p className="text-sm text-neutral-400 mt-1">Hoặc bấm "Quét inbox" để đồng bộ mới</p>
              <Button
                onClick={handleProcessInbox}
                disabled={processReq.isPending}
                className="mt-4 gap-2 bg-primary-600 hover:bg-primary-700 text-white"
              >
                {processReq.isPending ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                Quét inbox ngay
              </Button>
            </div>
          )}
        </div>

        {/* ==================== RIGHT: Customer context ==================== */}
        <div className="flex flex-col bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden">
          {selected ? (
            <>
              <div className="px-4 py-3 border-b border-neutral-100">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Khách hàng
                </div>
                <div className="flex flex-col items-center text-center py-3">
                  <Avatar name={selected.customer} size="lg" tone={selected.is_ordered ? 'emerald' : 'blue'} />
                  <div className="mt-2 font-bold text-neutral-800 truncate max-w-full">
                    {selected.customer || 'Ẩn danh'}
                  </div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap justify-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded border border-blue-200">
                      <Facebook size={9} /> Facebook
                    </span>
                    {selected.is_ordered && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                        <ShoppingCart size={9} /> Đã chốt đơn
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <InfoRow icon={Phone} label="Số điện thoại">
                  {selected.phone ? (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-neutral-800 font-medium">{selected.phone}</span>
                      <button
                        onClick={() => copyPhone(selected.phone)}
                        className="p-1 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                        title="Copy"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-neutral-400 italic">Chưa detect được</span>
                  )}
                </InfoRow>

                <InfoRow icon={Circle} label="Trạng thái">
                  <StatusDot status={selected.status} withLabel />
                </InfoRow>

                <InfoRow icon={ShoppingCart} label="Đơn hàng">
                  {selected.is_ordered ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle size={12} /> Đã tạo
                    </span>
                  ) : (
                    <span className="text-neutral-400 italic">Chưa</span>
                  )}
                </InfoRow>

                {selected.ai_intent && (
                  <InfoRow icon={Sparkles} label="AI Intent">
                    <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded border border-violet-200 font-medium">
                      {selected.ai_intent}
                    </span>
                  </InfoRow>
                )}

                <div className="pt-3 border-t border-neutral-100">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Hành động nhanh
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 hover:border-primary-300 hover:text-primary-700"
                      disabled={!selected.phone}
                    >
                      <User size={13} /> Tạo record CRM
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 hover:border-primary-300 hover:text-primary-700"
                      disabled={!selected.phone}
                    >
                      <ShoppingCart size={13} /> Tạo đơn hàng
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 hover:border-primary-300 hover:text-primary-700"
                    >
                      <ArrowRight size={13} /> Chuyển sale phụ trách
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-300">
              <User size={48} className="opacity-40" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function StatChip({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string
  value: string
  tone: 'blue' | 'emerald' | 'amber' | 'violet'
  icon: typeof MessageSquare
}) {
  const toneMap = {
    blue: 'bg-blue-50 text-blue-700 [&_.ico]:bg-blue-100 [&_.ico]:text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-700 [&_.ico]:bg-emerald-100 [&_.ico]:text-emerald-600',
    amber: 'bg-amber-50 text-amber-700 [&_.ico]:bg-amber-100 [&_.ico]:text-amber-600',
    violet: 'bg-violet-50 text-violet-700 [&_.ico]:bg-violet-100 [&_.ico]:text-violet-600',
  }[tone]
  return (
    <div className={`rounded-xl p-2.5 flex items-center gap-2.5 ${toneMap}`}>
      <div className="ico w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80 truncate">
          {label}
        </div>
        <div className="text-lg font-bold tabular-nums text-neutral-900 leading-none">{value}</div>
      </div>
    </div>
  )
}

function Avatar({
  name,
  size = 'md',
  tone = 'blue',
}: {
  name?: string
  size?: 'sm' | 'md' | 'lg'
  tone?: 'blue' | 'emerald' | 'violet'
}) {
  const sizeMap = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-16 h-16 text-lg',
  }[size]
  const toneMap = {
    blue: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    emerald: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    violet: 'bg-gradient-to-br from-violet-500 to-purple-600',
  }[tone]
  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .padEnd(1, '?')
  return (
    <div
      className={`${sizeMap} ${toneMap} rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-sm ring-2 ring-white`}
    >
      {initials.substring(0, 2)}
    </div>
  )
}

function StatusDot({
  status,
  withLabel,
}: {
  status?: string
  withLabel?: boolean
}) {
  const cfg: Record<string, { color: string; label: string }> = {
    replied: { color: 'bg-blue-500', label: 'Đã trả lời' },
    converted: { color: 'bg-emerald-500', label: 'Chốt đơn' },
    error: { color: 'bg-rose-500', label: 'Lỗi' },
    pending: { color: 'bg-amber-500', label: 'Đang chờ' },
  }
  const s = cfg[status || 'pending'] || cfg.pending
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${s.color} ${status === 'pending' ? 'animate-pulse' : ''}`} />
      {withLabel && <span className="text-xs font-medium text-neutral-600">{s.label}</span>}
      {!withLabel && <span className="text-[10px] text-neutral-500">{s.label}</span>}
    </span>
  )
}

function MessageBubble({
  sender,
  text,
  ts,
  compact,
}: {
  sender: 'customer' | 'bot'
  text: string
  ts?: string
  compact?: boolean
}) {
  const isBot = sender === 'bot'
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[75%] ${isBot ? '' : 'text-right'}`}>
        <div
          className={`inline-block px-3.5 py-2 rounded-2xl text-sm ${
            isBot
              ? 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-md shadow-sm'
              : 'bg-primary-600 text-white rounded-br-md shadow-sm'
          } ${compact ? 'text-xs px-3 py-1.5' : ''}`}
        >
          {text}
        </div>
        {ts && !compact && (
          <div className={`text-[10px] text-neutral-400 mt-1 ${isBot ? 'text-left' : 'text-right'}`}>
            {formatTime(ts)}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={12} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          {label}
        </div>
        <div className="text-sm mt-0.5">{children}</div>
      </div>
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

function timeAgo(iso: string): string {
  try {
    const d = new Date(iso)
    const diffMs = Date.now() - d.getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'vừa xong'
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d`
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  } catch {
    return ''
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
