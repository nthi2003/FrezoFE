import { useState } from 'react'
import { useAccounts, useAddAccount } from '../hooks/useAI'
import { Button } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { AppModal } from '@frezo/ui'
import { Plus, User, Eye, EyeOff } from 'lucide-react'

export function AIAccountsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [proxy, setProxy] = useState('')
  const [showPw, setShowPw] = useState(false)

  const { data, isLoading } = useAccounts()
  const addReq = useAddAccount()

  const accounts = data?.accounts || []

  const handleAdd = () => {
    if (!email.trim() || !password.trim()) return
    addReq.mutate(
      { email: email.trim(), password: password.trim(), proxy: proxy.trim() },
      { onSuccess: () => { setModalOpen(false); setEmail(''); setPassword(''); setProxy('') } }
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">👤 Tài khoản Facebook</h1>
          <p className="text-neutral-500 text-sm">Quản lý tài khoản clone/via dùng cho automation</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-primary-600 hover:bg-primary-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Thêm tài khoản
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-neutral-400">Đang tải...</div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">Chưa có tài khoản nào. Thêm tài khoản Facebook để bắt đầu.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Proxy</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Bài đã đăng</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a: any) => (
                <tr key={a.email} className="border-b hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-neutral-400" />
                      <span className="font-medium">{a.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{a.proxy || '—'}</td>
                  <td className="px-4 py-3 text-center text-sm">{a.posts_today}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.is_active ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                      {a.is_active ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Thêm tài khoản Facebook">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email / SĐT</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <Input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Proxy (tùy chọn)</label>
            <Input value={proxy} onChange={e => setProxy(e.target.value)} placeholder="user:pass@ip:port" />
          </div>
          <Button onClick={handleAdd} disabled={addReq.isPending || !email || !password} className="w-full bg-primary-600 hover:bg-primary-700 text-white">
            {addReq.isPending ? 'Đang thêm...' : 'Thêm tài khoản'}
          </Button>
        </div>
      </AppModal>
    </div>
  )
}
