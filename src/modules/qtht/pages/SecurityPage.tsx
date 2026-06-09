import { useState } from 'react'
import { Plus, ShieldX, ShieldCheck, Server } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { Button } from '@/components/ui/button'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import * as z from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ipBlacklistApi, ipWhitelistApi, ipTrustApi } from '../services/securityApi'
import { toast } from 'sonner'

const ipSchema = z.object({
  ipAddress: z.string().min(7, 'IP không hợp lệ'),
  reason: z.string().optional(),
})

const trustSchema = z.object({
  ipAddress: z.string().min(7, 'IP không hợp lệ'),
  description: z.string().optional(),
})

export function SecurityPage() {
  const [tab, setTab] = useState<'blacklist' | 'whitelist' | 'trust'>('blacklist')
  const [modalOpen, setModalOpen] = useState(false)
  const queryClient = useQueryClient()
  
  // Queries
  const { data: rawBlacklist, isLoading: loadingB } = useQuery({ queryKey: ['ip_blacklist'], queryFn: () => ipBlacklistApi.getAll() })
  const { data: rawWhitelist, isLoading: loadingW } = useQuery({ queryKey: ['ip_whitelist'], queryFn: () => ipWhitelistApi.getAll() })
  const { data: rawTrust, isLoading: loadingT } = useQuery({ queryKey: ['ip_trust'], queryFn: () => ipTrustApi.getAll() })

  // Mutations - Blacklist
  const banMutation = useMutation({
    mutationFn: (data: any) => ipBlacklistApi.ban(data),
    onSuccess: () => { toast.success('Đã chặn IP'); queryClient.invalidateQueries({ queryKey: ['ip_blacklist']}); setModalOpen(false) }
  })
  const unbanMutation = useMutation({
    mutationFn: (id: string) => ipBlacklistApi.unban(id),
    onSuccess: () => { toast.success('Đã gỡ chặn IP'); queryClient.invalidateQueries({ queryKey: ['ip_blacklist']}) }
  })

  // Mutations - Whitelist
  const whiteMutation = useMutation({
    mutationFn: (data: any) => ipWhitelistApi.create(data),
    onSuccess: () => { toast.success('Đã thêm IP Whitelist'); queryClient.invalidateQueries({ queryKey: ['ip_whitelist']}); setModalOpen(false) }
  })
  const unwhiteMutation = useMutation({
    mutationFn: (id: string) => ipWhitelistApi.delete(id),
    onSuccess: () => { toast.success('Đã xóa IP khỏi Whitelist'); queryClient.invalidateQueries({ queryKey: ['ip_whitelist']}) }
  })

  // Mutations - Trust
  const trustMutation = useMutation({
    mutationFn: (data: any) => ipTrustApi.create(data),
    onSuccess: () => { toast.success('Đã thêm IP Trusted'); queryClient.invalidateQueries({ queryKey: ['ip_trust']}); setModalOpen(false) }
  })
  const untrustMutation = useMutation({
    mutationFn: (id: string) => ipTrustApi.delete(id),
    onSuccess: () => { toast.success('Đã xóa IP khỏi Trusted'); queryClient.invalidateQueries({ queryKey: ['ip_trust']}) }
  })

  const getColumns = () => {
    const common = [
      { title: 'Địa chỉ IP', dataIndex: 'ipAddress' },
      { title: tab === 'trust' ? 'Mô tả' : 'Lý do / Ghi chú', dataIndex: tab === 'trust' ? 'description' : 'reason' },
      { title: 'Ngày tạo', dataIndex: 'createdAt' },
    ]
    const action = {
      title: 'Thao tác',
      dataIndex: 'id',
      render: (_: any, row: any) => (
        <Button variant="ghost" size="sm" className={tab === 'blacklist' ? "text-green-600" : "text-red-600"} 
          onClick={() => { 
            if(confirm('Xóa IP này?')) {
              if (tab === 'blacklist') unbanMutation.mutate(row.id)
              if (tab === 'whitelist') unwhiteMutation.mutate(row.id)
              if (tab === 'trust') untrustMutation.mutate(row.id)
            }
          }}>
          {tab === 'blacklist' ? 'Gỡ chặn' : 'Xóa'}
        </Button>
      ),
    }
    return [...common, action]
  }

  const data = tab === 'blacklist' ? (rawBlacklist?.items || rawBlacklist || []) 
             : tab === 'whitelist' ? (rawWhitelist?.items || rawWhitelist || [])
             : (rawTrust?.items || rawTrust || [])

  const isLoading = tab === 'blacklist' ? loadingB : tab === 'whitelist' ? loadingW : loadingT

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <ShieldCheck className="text-primary-600" />
            Bảo mật Hệ thống (IP Rules)
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Quản lý danh sách truy cập IP</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-primary-600 hover:bg-primary-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Thêm IP {tab === 'blacklist' ? 'chặn' : tab === 'whitelist' ? 'Whitelist' : 'Trusted'}
        </Button>
      </div>

      <div className="flex gap-4">
        <button className={`px-4 py-2 font-medium rounded-lg flex items-center gap-2 ${tab === 'blacklist' ? 'bg-red-50 text-red-700 border border-red-200' : 'text-neutral-500 hover:bg-neutral-100'}`} onClick={() => setTab('blacklist')}>
          <ShieldX size={16} /> Blacklist
        </button>
        <button className={`px-4 py-2 font-medium rounded-lg flex items-center gap-2 ${tab === 'whitelist' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'text-neutral-500 hover:bg-neutral-100'}`} onClick={() => setTab('whitelist')}>
          <ShieldCheck size={16} /> Whitelist
        </button>
        <button className={`px-4 py-2 font-medium rounded-lg flex items-center gap-2 ${tab === 'trust' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-neutral-500 hover:bg-neutral-100'}`} onClick={() => setTab('trust')}>
          <Server size={16} /> Trusted
        </button>
      </div>

      <AppTable data={data} columns={getColumns()} isLoading={isLoading} />

      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Thêm IP vào ${tab}`}>
        <AppForm 
          schema={tab === 'trust' ? trustSchema : ipSchema} 
          defaultValues={{ ipAddress: '', reason: '', description: '' }} 
          onSubmit={(v) => {
            if (tab === 'blacklist') banMutation.mutate(v)
            if (tab === 'whitelist') whiteMutation.mutate(v)
            if (tab === 'trust') trustMutation.mutate(v)
          }} 
          fields={[
            { name: 'ipAddress', label: 'Địa chỉ IP' }, 
            { name: tab === 'trust' ? 'description' : 'reason', label: tab === 'trust' ? 'Mô tả' : 'Lý do' }
          ]} 
          submitText="Xác nhận" 
          isLoading={banMutation.isPending || whiteMutation.isPending || trustMutation.isPending} 
        />
      </AppModal>
    </div>
  )
}
