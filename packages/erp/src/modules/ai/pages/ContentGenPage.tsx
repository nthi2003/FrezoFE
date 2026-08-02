import { useState } from 'react'
import { useGenerateContent } from '../hooks/useAI'
import { Button, Input, PageHeader, Label, EmptyState, Select } from '@frezo/ui'
import { Sparkles, Loader2, Copy, Check, FileText, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'

export function ContentGenPage() {
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('bán hàng')
  const [variations, setVariations] = useState(1)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const genReq = useGenerateContent()

  const handleGenerate = () => {
    if (!topic.trim()) return
    genReq.mutate({ topic: topic.trim(), tone, variations })
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('Đã copy vào clipboard')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const tones = ['bán hàng', 'thân thiện', 'chuyên nghiệp', 'kể chuyện', 'hài hước']
  const contents: string[] = genReq.data?.versions || (genReq.data?.content ? [genReq.data.content] : [])

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Sinh nội dung AI"
        description="Tạo nội dung bài viết Facebook với AI, có thể sinh nhiều phiên bản."
      />

      <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm space-y-4">
        <div>
          <Label className="mb-1">Chủ đề bài viết</Label>
          <Input
            placeholder="VD: Rau sạch VietGAP cho nhà hàng…"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label className="mb-1">Phong cách</Label>
            <Select
              options={tones.map((t) => ({ value: t, label: t }))}
              value={tone}
              onChange={setTone}
              placeholder="Phong cách"
              aria-label="Phong cách"
              showSearch={false}
            />
          </div>
          <div className="w-full sm:w-40">
            <Label className="mb-1 inline-flex items-center gap-1">
              Số phiên bản
              <span title="AI sẽ spin nội dung thành N phiên bản khác nhau">
                <HelpCircle size={12} className="text-neutral-400" />
              </span>
            </Label>
            <Select
              options={[1, 2, 3, 5].map((n) => ({ value: String(n), label: `${n} phiên bản` }))}
              value={String(variations)}
              onChange={(v) => setVariations(Number(v))}
              placeholder="Số phiên bản"
              aria-label="Số phiên bản"
              showSearch={false}
            />
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={genReq.isPending || !topic.trim()}
          className="bg-primary-600 hover:bg-primary-700 text-white"
        >
          {genReq.isPending
            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            : <Sparkles className="w-4 h-4 mr-2" />}
          {genReq.isPending ? 'Đang sinh…' : 'Sinh nội dung'}
        </Button>
      </div>

      {contents.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-semibold text-neutral-800 text-sm">Kết quả ({contents.length} phiên bản)</h2>
          {contents.map((content, i) => (
            <div key={i} className="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm relative group">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleCopy(content, i)}
                  className="p-1.5 bg-white rounded-lg border hover:bg-neutral-50 transition-colors"
                  title="Sao chép nội dung"
                >
                  {copiedIndex === i
                    ? <Check className="w-4 h-4 text-emerald-600" />
                    : <Copy className="w-4 h-4 text-neutral-500" />}
                </button>
              </div>
              <div className="pr-16">
                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full mb-2 inline-block">
                  Phiên bản {i + 1}
                </span>
                <p className="text-sm text-neutral-700 mt-1 whitespace-pre-wrap">{content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : !genReq.isPending ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={FileText}
            title="Chưa có nội dung"
            description="Nhập chủ đề và bấm Sinh nội dung để AI tạo bài viết."
          />
        </div>
      ) : null}
    </div>
  )
}
