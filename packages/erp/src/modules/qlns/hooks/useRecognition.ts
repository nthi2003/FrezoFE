import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  recognitionApi,
  type RecognitionConfigDto,
  type TokenGiftRequest,
  type TokenRedeemCreateRequest,
  type TokenWalletDto,
} from '../services/recognitionApi'

const DEFAULT_CONFIG: RecognitionConfigDto = {
  tokenToVnd: 1000,
  maxGiftAmount: 100,
  maxRedeemAmount: 10000,
  starterBalance: 50,
}

const EMPTY_WALLET: TokenWalletDto = {
  id: '',
  personId: '',
  balance: 0,
  estimatedVnd: 0,
  tokenToVnd: 1000,
}

/** Không crash UI khi BE chưa seed / 404 — trả fallback. */
function soft<T>(fn: () => Promise<T>, fallback: T) {
  return fn().catch(() => fallback)
}

export function useRecognitionConfig() {
  return useQuery({
    queryKey: ['qlns', 'recognition', 'config'],
    queryFn: () => soft(() => recognitionApi.getConfig(), DEFAULT_CONFIG),
  })
}

export function useMyTokenWallet() {
  return useQuery({
    queryKey: ['qlns', 'recognition', 'wallet', 'me'],
    queryFn: () => soft(() => recognitionApi.myWallet(), EMPTY_WALLET),
  })
}

export function useTokenWallets() {
  return useQuery({
    queryKey: ['qlns', 'recognition', 'wallets'],
    queryFn: () => soft(() => recognitionApi.listWallets(), []),
  })
}

export function useTokenTransfers(personId?: string) {
  return useQuery({
    queryKey: ['qlns', 'recognition', 'transfers', personId ?? ''],
    queryFn: () => soft(() => recognitionApi.listTransfers(personId), []),
  })
}

export function useTokenRedeems(params?: { personId?: string; status?: string }) {
  return useQuery({
    queryKey: ['qlns', 'recognition', 'redeems', params?.personId, params?.status],
    queryFn: () => soft(() => recognitionApi.listRedeems(params), []),
  })
}

function invalidateRecognition(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['qlns', 'recognition'] })
}

export function useGiftToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: TokenGiftRequest) => recognitionApi.gift(body),
    onSuccess: () => {
      toast.success('Đã tặng token')
      invalidateRecognition(qc)
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || 'Tặng token thất bại — kiểm tra BE đã restart/seed chưa'),
  })
}

export function useCreateRedeem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: TokenRedeemCreateRequest) => recognitionApi.createRedeem(body),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu đổi thưởng')
      invalidateRecognition(qc)
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || 'Đổi thưởng thất bại'),
  })
}

export function useApproveRedeem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recognitionApi.approveRedeem(id),
    onSuccess: () => {
      toast.success('Đã duyệt — sẽ cộng vào kỳ lương hiện tại')
      invalidateRecognition(qc)
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || 'Duyệt thất bại'),
  })
}

export function useRejectRedeem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      recognitionApi.rejectRedeem(id, reason),
    onSuccess: () => {
      toast.success('Đã từ chối — hoàn token')
      invalidateRecognition(qc)
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || 'Từ chối thất bại'),
  })
}
