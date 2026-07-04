import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { AppModal, Button, Input } from '@frezo/ui'
import { FacebookIcon } from '@/components/shared/FacebookIcon'
import { useFbAccounts, useCreateFbAccount, useUpdateFbAccount, useDeleteFbAccount } from '../hooks/useFbAutomation'

export function FbAccountsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [cookieModalOpen, setCookieModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [cookieText, setCookieText] = useState('')

  const { data: accounts, isLoading } = useFbAccounts()
  const createReq = useCreateFbAccount()
  const updateReq = useUpdateFbAccount()
  const deleteReq = useDeleteFbAccount()

  const list = accounts || []

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      username: form.get('username') as string,
      password: form.get('password') as string,
      proxyIp: form.get('proxyIp') as string,
      userAgent: form.get('userAgent') as string,
      status: form.get('status') as string || 'ACTIVE',
    }
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(data, { onSuccess: () => setModalOpen(false) })
    }
  }

  const handleUpdateCookie = () => {
    if (selectedItem?.id && cookieText) {
      // Call API update cookie
      updateReq.mutate({ id: selectedItem.id, data: { ...selectedItem, cookie: cookieText } } as any)
      setCookieModalOpen(false)
      setCookieText('')
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900"><FacebookIcon className="w-6 h-6 inline-block mr-2 text-blue-600" />Quản lý tài khoản Facebook</h1>
          <p className="text-neutral-500 text-sm">Thêm tài khoản proxy để chạy automation</p>
        </div>
        <Button onClick={() => { setSelectedItem(null); setModalOpen(true) }} className="bg-primary-600 hover:bg-primary-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Thêm tài khoản
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-neutral-400">Đang tải...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">Chưa có tài khoản nào. Hãy thêm tài khoản để bắt đầu.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Username</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Proxy</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Trạng thái</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Bài đăng hôm nay</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map((acc: any) => (
                <tr key={acc.id} className="border-b last:border-b-0 hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{acc.username}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{acc.proxyIp || 'Không có'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${acc.status === 'ACTIVE' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                      {acc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-neutral-500">{acc.postsToday || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(acc); setModalOpen(true) }}>
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm('Xóa tài khoản này?')) deleteReq.mutate(acc.id) }}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal thêm/sửa tài khoản */}
      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Username</label>
            <Input name="username" defaultValue={selectedItem?.username || ''} required placeholder="Email hoặc SĐT Facebook" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
            <Input name="password" type="password" defaultValue={selectedItem?.password || ''} required placeholder="Mật khẩu" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Proxy IP (tùy chọn)</label>
            <Input name="proxyIp" defaultValue={selectedItem?.proxyIp || ''} placeholder="VD: http://user:pass@1.2.3.4:8080" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">User Agent (tùy chọn)</label>
            <Input name="userAgent" defaultValue={selectedItem?.userAgent || ''} placeholder="Để trống để dùng mặc định" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Trạng thái</label>
            <select name="status" defaultValue={selectedItem?.status || 'ACTIVE'} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white" disabled={createReq.isPending || updateReq.isPending}>
              {createReq.isPending || updateReq.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {selectedItem ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </AppModal>
    </div>
  )
}
