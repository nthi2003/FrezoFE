import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, Hammer } from 'lucide-react'
import { Button } from '@frezo/ui'

interface PlaceholderPageProps {
  title: string
  description?: string
  moduleCode?: string
}

export function PlaceholderPage({
  title,
  description = 'Tính năng này đang được xây dựng. Vui lòng quay lại sau.',
  moduleCode,
}: PlaceholderPageProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center relative overflow-hidden bg-neutral-50/50">
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl px-6 py-16">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary-200/60 rounded-full blur-2xl scale-110" />
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-500/30 animate-float">
            <Hammer size={44} strokeWidth={1.8} className="text-white drop-shadow" />
          </div>
        </div>

        {moduleCode && (
          <span className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700 ring-1 ring-inset ring-primary-200">
            {moduleCode}
          </span>
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 tracking-tight mb-3">
          {title}
        </h1>
        <p className="text-neutral-500 max-w-md mx-auto text-sm md:text-base mb-2">
          {description}
        </p>
        <p className="text-neutral-400 text-xs mb-8">
          Module đã được cấu hình trong menu, giao diện chi tiết sẽ được triển khai ở phiên bản kế tiếp.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full sm:w-auto min-w-[140px] h-11 rounded-xl border-neutral-200 text-neutral-600 hover:bg-neutral-100 font-medium"
          >
            <ArrowLeft size={18} className="mr-2" /> Quay lại
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto min-w-[140px] h-11 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-medium shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            <Home size={18} className="mr-2" /> Về Dashboard
          </Button>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          .animate-float { animation: float 5s ease-in-out infinite; }
        `,
        }}
      />
    </div>
  )
}
