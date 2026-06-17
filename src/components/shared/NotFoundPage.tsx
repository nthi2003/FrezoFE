import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />

      <div className="relative max-w-md w-full text-center space-y-8 p-8 bg-slate-950/40 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl">
        {/* Animated Icon Container */}
        <div className="mx-auto w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transform rotate-12 hover:rotate-0 transition-transform duration-300">
          <AlertCircle size={48} className="text-white animate-pulse" />
        </div>

        {/* 404 Text */}
        <div className="space-y-2">
          <h1 className="text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400">
            404
          </h1>
          <h2 className="text-2xl font-bold text-slate-100">Không Tìm Thấy Trang</h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển khỏi hệ thống Frezo ERP.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white gap-2 h-11"
          >
            <ArrowLeft size={16} /> Quay lại
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white gap-2 h-11 shadow-lg shadow-emerald-600/25 border-0"
          >
            <Home size={16} /> Trang chủ
          </Button>
        </div>

        {/* Footer Brand */}
        <div className="text-slate-600 text-xs pt-4 border-t border-slate-900/80">
          Frezo ERP System &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}
