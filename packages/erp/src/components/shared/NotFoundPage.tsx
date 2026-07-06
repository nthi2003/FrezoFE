import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@frezo/ui'
import buildImg from '@/img/mas-cost-build.png'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neutral-50/50">
      {/* Background Particles Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      
      {/* Background decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl px-6">
        {/* Animated 404 Text */}
        <div className="relative">
          <h1 className="text-[150px] md:text-[200px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary-400 via-primary-600 to-blue-600 select-none drop-shadow-sm animate-bounce" style={{ animationDuration: '3s' }}>
            404
          </h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-tr from-white/40 to-transparent blur-xl pointer-events-none mix-blend-overlay"></div>
        </div>
        
        {/* Animated Image/Illustration replacement if wanted, but using the existing img for context */}
        <div className="relative mt-[-20px] mb-8 group perspective-1000">
          <div className="absolute inset-0 bg-primary-100 rounded-full blur-2xl opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
          <img src={buildImg} alt="Đang xây dựng" className="w-48 h-48 md:w-56 md:h-56 object-contain relative z-10 drop-shadow-xl animate-float transition-transform duration-700 hover:rotate-6 hover:scale-105" style={{ animation: 'float 6s ease-in-out infinite' }} />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 tracking-tight mb-3">
          Không tìm thấy trang
        </h2>
        <p className="text-neutral-500 max-w-md mx-auto text-sm md:text-base mb-8">
          Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không truy cập được.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full sm:w-auto min-w-[140px] h-12 rounded-xl border-neutral-200 text-neutral-600 hover:bg-neutral-100 font-medium transition-colors"
          >
            <ArrowLeft size={18} className="mr-2" /> Quay lại
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-medium shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            <Home size={18} className="mr-2" /> Về trang chủ
          </Button>
        </div>
      </div>
      
      {/* Inline styles for custom animations that Tailwind might not have by default */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}} />
    </div>
  )
}
