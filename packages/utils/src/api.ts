/**
 * Chuẩn hoá response BE về **array** dùng cho useQuery `select`.
 *
 * BE Frezo có thể trả 3 shape (do lịch sử service:
 * - `Map<String, Object>` với `content`, hoặc
 * - `PageResponse<T>` với `content` / `items`, hoặc
 * - Array trần khi endpoint list không paginate):
 *
 * ```
 * ApiResponse { data: [...] }                                    // array trần
 * ApiResponse { data: { content: [...], totalElements, ... } }   // Spring Page / PageResponse
 * ApiResponse { data: { items:   [...], total, ... } }           // Legacy custom
 * ```
 *
 * `unwrapList` nhận **full ApiResponse** (đã .then trong service) và trả về array items.
 * Không bao giờ throw, không bao giờ trả `undefined` — luôn `[]` khi không có data.
 *
 * @example
 * ```ts
 * useQuery({
 *   queryFn: () => api.getAll(),
 *   select: unwrapList<Article>,
 * })
 * ```
 */
export function unwrapList<T = any>(res: any): T[] {
  const d = res?.data ?? res
  if (Array.isArray(d)) return d as T[]
  if (Array.isArray(d?.content)) return d.content as T[]
  if (Array.isArray(d?.items)) return d.items as T[]
  if (Array.isArray(d?.data)) return d.data as T[]
  return []
}

/**
 * Chuẩn hoá response BE về **paginated shape** dùng cho useQuery `select` khi cần meta.
 * Trả về `{ items, total, page, size, totalPages }` — luôn có, kể cả khi BE trả array trần.
 *
 * @example
 * ```ts
 * const { data } = useQuery({
 *   queryFn: () => api.getAll(),
 *   select: unwrapPage<Article>,
 * })
 * // data = { items: Article[], total: number, page: number, size: number, totalPages: number }
 * ```
 */
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

export function unwrapPage<T = any>(res: any): Paginated<T> {
  const d = res?.data ?? res
  if (Array.isArray(d)) {
    return {
      items: d as T[],
      total: d.length,
      page: 1,
      size: d.length,
      totalPages: 1,
    }
  }
  const items = Array.isArray(d?.content)
    ? d.content
    : Array.isArray(d?.items)
      ? d.items
      : Array.isArray(d?.data)
        ? d.data
        : []
  return {
    items: items as T[],
    total: Number(d?.totalElements ?? d?.total ?? items.length) || 0,
    page: Number(d?.pageNumber ?? d?.number ?? d?.page ?? 1) || 1,
    size: Number(d?.pageSize ?? d?.size ?? items.length) || items.length,
    totalPages: Number(d?.totalPages ?? 1) || 1,
  }
}

/**
 * Chuẩn hoá response BE về **1 record** (unwrap `ApiResponse.data`).
 *
 * @example
 * ```ts
 * useQuery({
 *   queryFn: () => api.getById(id),
 *   select: unwrapOne<Article>,
 * })
 * ```
 */
export function unwrapOne<T = any>(res: any): T | null {
  return (res?.data ?? res ?? null) as T | null
}
