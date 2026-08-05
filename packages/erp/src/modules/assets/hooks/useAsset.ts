import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  assetApi, type AssetItem, type AssetStats, type AssetAssignmentItem, type AssetListParams, type AssetSavePayload,
} from '../services/assetApi'

const QK_LIST = ['assets', 'list'] as const
const QK_DETAIL = (id: string) => ['assets', 'detail', id] as const
const QK_HISTORY = (id: string) => ['assets', 'history', id] as const
const QK_STATS = ['assets', 'stats'] as const

export function useAssets(params?: AssetListParams) {
  return useQuery({
    queryKey: [...QK_LIST, params],
    queryFn: () => assetApi.list(params),
    select: (raw: any) => {
      const d = raw?.data ?? raw
      return {
        items: (d?.items as AssetItem[]) || [],
        total: d?.total || 0,
      }
    },
  })
}

export function useAssetDetail(id?: string) {
  return useQuery({
    queryKey: QK_DETAIL(id || ''),
    queryFn: () => assetApi.get(id!),
    enabled: !!id,
    select: (raw: any) => (raw?.data ?? raw) as AssetItem,
  })
}

export function useAssetHistory(id?: string) {
  return useQuery({
    queryKey: QK_HISTORY(id || ''),
    queryFn: () => assetApi.history(id!),
    enabled: !!id,
    select: (raw: any) => (raw?.data ?? raw) as AssetAssignmentItem[],
  })
}

export function useAssetStats() {
  return useQuery({
    queryKey: QK_STATS,
    queryFn: () => assetApi.stats(),
    select: (raw: any) => (raw?.data ?? raw) as AssetStats,
  })
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['assets'] })
}

export function useCreateAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AssetSavePayload) => assetApi.create(data),
    onSuccess: () => {
      toast.success('Đã thêm tài sản')
      invalidateAll(qc)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không thêm được'),
  })
}

export function useUpdateAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetSavePayload }) => assetApi.update(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật')
      invalidateAll(qc)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không cập nhật được'),
  })
}

export function useDeleteAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => assetApi.delete(id),
    onSuccess: () => {
      toast.success('Đã xoá tài sản')
      invalidateAll(qc)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không xoá được (kiểm tra tài sản còn đang dùng?)'),
  })
}

export function useAssignAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, personId, personName, note }: { id: string; personId: string; personName?: string; note?: string }) =>
      assetApi.assign(id, personId, personName, note),
    onSuccess: () => {
      toast.success('Đã cấp phát tài sản')
      invalidateAll(qc)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không cấp phát được'),
  })
}

export function useUnassignAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => assetApi.unassign(id, note),
    onSuccess: () => {
      toast.success('Đã thu hồi')
      invalidateAll(qc)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không thu hồi được'),
  })
}

export function useStartMaintenance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => assetApi.startMaintenance(id, note),
    onSuccess: () => {
      toast.success('Đã chuyển sang bảo trì')
      invalidateAll(qc)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không chuyển được'),
  })
}

export function useEndMaintenance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note, cost }: { id: string; note?: string; cost?: number }) =>
      assetApi.endMaintenance(id, note, cost),
    onSuccess: () => {
      toast.success('Đã kết thúc bảo trì')
      invalidateAll(qc)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không cập nhật được'),
  })
}

export function useDisposeAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => assetApi.dispose(id, note),
    onSuccess: () => {
      toast.success('Đã thanh lý tài sản')
      invalidateAll(qc)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không thanh lý được'),
  })
}
