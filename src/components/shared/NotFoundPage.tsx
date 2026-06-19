import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import buildImg from '@/img/mas-cost-build.png'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="flex flex-col items-center text-center max-w-md">
        <img src={buildImg} alt="Đang xây dựng" className="w-64 h-64 object-contain mb-4" />
        <p className="text-base font-bold text-neutral-500">Frezo đang xây dựng hoặc trang web không tồn tại</p>
        <div className="flex gap-3 mt-6">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft size={16} /> Quay lại
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="gap-2 bg-primary-700 hover:bg-primary-800 text-white"
          >
            <Home size={16} /> Trang chủ
          </Button>
        </div>
      </div>
    </div>
  )
}
