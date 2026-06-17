import { useState } from 'react'
import { useGenerateContent } from '../hooks/useAI'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Loader2, Copy, Check } from 'lucide-react'
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
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">✨ Sinh nội dung AI</h1>
        <p className="text-neutral-500 text-sm">Tạo nội dung bài viết Facebook với AI, có thể spin thành nhiều phiên bản</p>
      </div>

      <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Chủ đề bài viết</label>
            <Input
              placeholder="VD: Rau sạch VietGAP cho nhà hàng, Xà lách rom tươi ngon hôm nay..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Phong cách</label>
              <select value={tone} onChange={e => setTone(e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white">
                {tones.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Số phiên bản</label>
              <select value={variations} onChange={e => setVariations(Number(e.target.value))} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white">
                {[1, 2, 3, 5].map(n => <option key={n} value={n}>{n} phiên bản</option>)}
              </select>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={genReq.isPending || !topic.trim()} className="bg-primary-600 hover:bg-primary-700 text-white">
            {genReq.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {genReq.isPending ? 'Đang sinh...' : 'Sinh nội dung'}
          </Button>
        </div>
      </div>

      {contents.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-neutral-800">📝 Kết quả ({contents.length} phiên bản)</h2>
          {contents.map((content, i) => (
            <div key={i} className="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm relative group">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleCopy(content, i)} className="p-1.5 bg-white rounded-lg border hover:bg-neutral-50 transition-colors">
                  {copiedIndex === i ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-neutral-500" />}
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
      )}
    </div>
  )
}
