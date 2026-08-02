import { useQuery } from '@tanstack/react-query'
import { locationApi } from '../services/locationApi'

export function useWarehouseLocations(warehouseId: string | undefined) {
  return useQuery({
    queryKey: ['warehouse', 'locations', warehouseId],
    queryFn: () => locationApi.byWarehouse(warehouseId!),
    enabled: !!warehouseId,
  })
}
