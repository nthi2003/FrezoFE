// ============================================================
// Shape + formatting helpers cho feed bài viết đã xuất bản
// (Home portal, /bai-viet). BE trả field không đồng nhất giữa
// home-feed và /public nên mọi accessor đều phải fallback.
// ============================================================

export interface HomeArticle {
  id: string
  code?: string | null
  title?: string | null
  summary?: string | null
  content?: string | null
  type?: string | null
  tags?: string | null
  thumbnailUrl?: string | null
  authorName?: string | null
  publishedAt?: string | null
  publishedDate?: string | null
  createdAt?: string | null
  createdDate?: string | null
}

const TYPE_LABELS: Record<string, string> = {
  news: 'Tin tức',
  event: 'Sự kiện',
  blog: 'Bài viết',
  promotion: 'Khuyến mãi',
  recruitment: 'Tuyển dụng',
}

export function articleTypeLabel(a: HomeArticle): string | null {
  const key = (a.type ?? '').trim().toLowerCase()
  return TYPE_LABELS[key] ?? null
}

export function articleTimestamp(a: HomeArticle): number {
  const raw = a.publishedAt || a.publishedDate || a.createdAt || a.createdDate
  if (!raw) return 0
  const t = new Date(raw).getTime()
  return Number.isNaN(t) ? 0 : t
}

export function formatArticleDate(a: HomeArticle): string {
  const t = articleTimestamp(a)
  if (!t) return ''
  return new Date(t).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Ngày dạng dài cho trang đọc — "Thứ Hai, 27 tháng 7, 2026". */
export function formatArticleDateLong(a: HomeArticle): string {
  const t = articleTimestamp(a)
  if (!t) return ''
  return new Date(t).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Mới nhất trước; bỏ record thiếu id để tránh key trùng khi render. */
export function sortPublishedDesc(list: unknown): HomeArticle[] {
  const arr = Array.isArray(list) ? (list as HomeArticle[]) : []
  return arr
    .filter((a) => !!a?.id)
    .slice()
    .sort((a, b) => articleTimestamp(b) - articleTimestamp(a))
}

export function stripHtml(html?: string | null, max = 180): string {
  if (!html) return ''
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export function articleExcerpt(a: HomeArticle, max = 180): string {
  const summary = a.summary?.trim()
  return summary || stripHtml(a.content, max)
}

/** Tốc độ đọc trung bình tiếng Việt — dùng để ước lượng thời lượng bài. */
const WORDS_PER_MINUTE = 200

/** Số phút đọc ước lượng; 0 khi bài chưa có nội dung. */
export function articleReadingMinutes(a: HomeArticle): number {
  const text = stripHtml(a.content, Number.MAX_SAFE_INTEGER) || a.summary?.trim() || ''
  if (!text) return 0
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

/** Cover thật của bài viết; null khi Admin chưa gắn thumbnail. */
export function articleCover(a: HomeArticle): string | null {
  const url = a.thumbnailUrl?.trim()
  return url || null
}

/** Type/tag đánh dấu "chương trình nội bộ" — chưa có API riêng nên suy từ CMS. */
const PROGRAM_TYPES = new Set(['event', 'promotion', 'recruitment'])
const PROGRAM_TAG_RE =
  /(chương trình|chuong trinh|sự kiện|su kien|program|event|nổi bật|noi bat|featured|highlight|tháng này|thang nay)/i

export function isProgramArticle(a: HomeArticle): boolean {
  const type = (a.type ?? '').trim().toLowerCase()
  if (PROGRAM_TYPES.has(type)) return true
  return PROGRAM_TAG_RE.test(a.tags ?? '')
}

export function isInCurrentMonth(a: HomeArticle): boolean {
  const t = articleTimestamp(a)
  if (!t) return false
  const d = new Date(t)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export interface ProgramSelection {
  items: HomeArticle[]
  /** 'month' = đúng chương trình tháng này; 'recent' = fallback gần nhất. */
  scope: 'month' | 'recent'
}

/**
 * Chọn "chương trình đặc sắc trong tháng".
 * Ưu tiên bài program trong tháng → bài program bất kỳ → bài mới trong tháng.
 */
export function selectMonthlyPrograms(
  articles: HomeArticle[],
  limit: number,
  excludeIds: readonly string[] = [],
): ProgramSelection {
  const skip = new Set(excludeIds)
  const pool = articles.filter((a) => !skip.has(a.id))

  const programsThisMonth = pool.filter((a) => isProgramArticle(a) && isInCurrentMonth(a))
  if (programsThisMonth.length) {
    return { items: programsThisMonth.slice(0, limit), scope: 'month' }
  }

  const anyPrograms = pool.filter(isProgramArticle)
  if (anyPrograms.length) {
    return { items: anyPrograms.slice(0, limit), scope: 'recent' }
  }

  const thisMonth = pool.filter(isInCurrentMonth)
  if (thisMonth.length) {
    return { items: thisMonth.slice(0, limit), scope: 'month' }
  }

  return { items: pool.slice(0, limit), scope: 'recent' }
}
