// ============================================================
// FREZO ERP — Hợp đồng đang hiệu lực của nhân sự
// ------------------------------------------------------------
// Nhiều màn HR cần contractId (không phải user.id / personId):
//   • GET /qlns/leave-request/my/{contractId}
//   • POST /qlns/leave-request  → body.contractId
// Hook gom một chỗ để không mỗi trang tự resolve một kiểu.
// ============================================================

import { useQuery } from '@tanstack/react-query'
import axiosClient from '@/lib/axios/axiosClient'
import { profileApi } from '@/modules/profile/services/profileApi'

const PROFILE_STALE = 5 * 60 * 1000
const CONTRACT_STALE = 5 * 60 * 1000

interface ContractComboboxRow {
  id?: string
  personId?: string
  person_id?: string
  status?: string
  Status?: string
  activated?: boolean | string
}

/**
 * Lọc HĐ đủ điều kiện xin nghỉ — cùng rule BE `LeaveApprovalBridge.assertActiveContract`
 * (activated + status ACTIVE). Combobox thiếu `status` → tin BE đã lọc sẵn.
 */
function pickActiveContractId(raw: unknown, personId: string): string {
  const list: ContractComboboxRow[] = Array.isArray(raw) ? raw : []
  const hit = list.find((c) => {
    if (!c?.id) return false
    const pid = c.personId ?? c.person_id
    if (pid && pid !== personId) return false
    const status = String(c.status ?? c.Status ?? '').toUpperCase()
    if (status && status !== 'ACTIVE') return false
    if (c.activated === false || c.activated === 'false') return false
    return true
  })
  return hit?.id ? String(hit.id) : ''
}

/**
 * HĐ đang hiệu lực của một nhân sự bất kỳ (dùng khi HR tạo đơn hộ người khác).
 * Cần quyền VIEW `/qlns/contract/combobox` — thiếu quyền thì trả rỗng, không retry.
 */
export function useActiveContractId(personId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['qlns', 'active-contract', personId ?? ''],
    queryFn: async () => {
      const res = await axiosClient.get('/qlns/contract/combobox', {
        params: { personId, status: 'ACTIVE' },
        // Nhân viên thường không có quyền xem HĐ — im lặng fallback, không toast 403.
        skipForbiddenToast: true,
      })
      return pickActiveContractId(res.data?.data ?? res.data, personId!)
    },
    enabled: !!personId && (options?.enabled ?? true),
    staleTime: CONTRACT_STALE,
    retry: false,
  })
}

export interface MyContract {
  /** Hồ sơ nhân sự gắn tài khoản đăng nhập — rỗng nếu chưa liên kết. */
  personId: string
  personName: string
  /** HĐ đang hiệu lực; rỗng khi chưa có HĐ hoặc chưa liên kết nhân sự. */
  contractId: string
  isLoading: boolean
  hasPerson: boolean
  hasContract: boolean
}

/**
 * Hồ sơ + HĐ hiện hành của user đăng nhập.
 *
 * Ưu tiên combobox (lọc đúng activated + ACTIVE), fallback `contractId` mà
 * `/auth/profile` đã resolve sẵn — để nhân viên thường không có quyền xem HĐ
 * vẫn tra được đơn nghỉ của chính mình.
 */
export function useMyContract(options?: { enabled?: boolean }): MyContract {
  const enabled = options?.enabled ?? true

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    staleTime: PROFILE_STALE,
    enabled,
  })

  const personId = profileQuery.data?.personId ?? ''
  const profileContractId = profileQuery.data?.contractId ?? ''

  const contractQuery = useActiveContractId(personId || undefined, { enabled })

  const contractId = contractQuery.data || profileContractId

  return {
    personId,
    personName: profileQuery.data?.name?.trim() ?? '',
    contractId,
    isLoading: profileQuery.isLoading || (!!personId && contractQuery.isLoading),
    hasPerson: !!personId,
    hasContract: !!contractId,
  }
}
