// ============================================================
// EmailSequencesPage — LNK-09: block enroll khi thiếu email activated
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Settings, Search } from 'lucide-react'
import { PageHeader, EmptyState, Button, ErrorState } from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { useEmailSequences } from '../hooks/useEmailSequences'
import { useEmailConfigs } from '@/modules/email/hooks/useEmail'
import { pageRootClass } from '@/modules/accounting/utils/pageEmbed'

type SeqRow = {
  id: string
  name: string
  active?: boolean
  steps?: Array<{ id?: string; stepOrder?: number; subject?: string }>
}

export function EmailSequencesPage({ embedded }: { embedded?: boolean } = {}) {
  const navigate = useNavigate()
  const { data: list = [], isLoading, isError, refetch, isFetching } = useEmailSequences()
  const { data: configs, isLoading: configsLoading } = useEmailConfigs()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'on' | 'off'>('all')

  const hasActivatedConfig = useMemo(() => {
    if (!configs) return false
    return (configs as { activated?: boolean }[]).some((c) => c.activated)
  }, [configs])

  const rows = list as SeqRow[]

  const filtered = useMemo(() => {
    let data = rows
    if (activeFilter === 'on') data = data.filter((s) => s.active)
    if (activeFilter === 'off') data = data.filter((s) => !s.active)
    const q = search.trim().toLowerCase()
    if (q) {
      data = data.filter((s) => (s.name || '').toLowerCase().includes(q))
    }
    return data
  }, [rows, search, activeFilter])

  const hasFilter = !!search.trim() || activeFilter !== 'all'
  const isFilteredEmpty = !isLoading && rows.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && rows.length === 0

  const columns: AppTableColumn<SeqRow>[] = [
    {
      key: 'name',
      title: 'Tên chuỗi',
      render: (_, row) => (
        <span className="font-medium text-neutral-900">{row.name || '—'}</span>
      ),
    },
    {
      key: 'steps',
      title: 'Số bước',
      width: 100,
      render: (_, row) => (
        <span className="tabular-nums text-sm text-neutral-700">
          {row.steps?.length || 0}
        </span>
      ),
    },
    {
      key: 'active',
      title: 'Trạng thái',
      width: 120,
      render: (_, row) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${
            row.active
              ? 'bg-success-light text-success-dark border-success/30'
              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
          }`}
        >
          {row.active ? 'Đang bật' : 'Tắt'}
        </span>
      ),
    },
    {
      key: 'preview',
      title: 'Bước đầu',
      render: (_, row) => {
        const first = [...(row.steps || [])].sort(
          (a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0),
        )[0]
        return (
          <span className="text-xs text-neutral-500 truncate max-w-[280px] block" title={first?.subject}>
            {first?.subject || '—'}
          </span>
        )
      },
    },
  ]

  if (configsLoading) {
    return (
      <div className={pageRootClass(embedded, embedded ? 'px-1' : '')}>
        {!embedded && (
          <PageHeader
            title="Chuỗi email"
            description="Chuỗi nurture — đang kiểm tra cấu hình email…"
          />
        )}
        <AppTable columns={columns} data={[]} isLoading density="compact" showSearch={false} />
      </div>
    )
  }

  if (!hasActivatedConfig) {
    return (
      <div className={pageRootClass(embedded, embedded ? 'px-1' : '')}>
        {!embedded && (
          <PageHeader
            title="Chuỗi email"
            description="Chuỗi nurture — cần cấu hình email đã kích hoạt trước khi đăng ký lead."
          />
        )}
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Mail}
            title="Chưa có cấu hình email hoạt động"
            description="Đăng ký lead vào chuỗi bị chặn khi thiếu cấu hình đã kích hoạt. Kích hoạt cấu hình rồi quay lại."
            action={{
              label: 'Đến cấu hình email',
              onClick: () => navigate('/email/config'),
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={pageRootClass(embedded, embedded ? 'px-1' : '')}>
      {!embedded && (
        <PageHeader
          title="Chuỗi email"
          description="Chuỗi nurture — đăng ký lead chỉ khi cấu hình email đã kích hoạt."
          actions={
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => navigate('/email/config')}
            >
              <Settings size={14} /> Cấu hình email
            </Button>
          }
        />
      )}

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => {
          setSearch('')
          setActiveFilter('all')
        }}
        countLabel={`${filtered.length} chuỗi${hasFilter ? ' (đã lọc)' : ''}`}
        selects={[
          {
            id: 'active',
            label: 'Trạng thái',
            value: activeFilter,
            onChange: (v) => setActiveFilter(v as 'all' | 'on' | 'off'),
            options: [
              { value: 'all', label: 'Tất cả' },
              { value: 'on', label: 'Đang bật' },
              { value: 'off', label: 'Tắt' },
            ],
          },
        ]}
      >
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 text-sm border rounded-md bg-white"
            placeholder="Tìm tên chuỗi…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm chuỗi email"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được chuỗi email"
            message="Lỗi API / mạng. Thử lại hoặc kiểm tra quyền CRM."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Mail}
            title={isFilteredEmpty ? 'Không có chuỗi khớp bộ lọc' : 'Chưa có chuỗi email'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi từ khoá.'
                : 'Tạo chuỗi khi BA/SA mở quyền mutate. Đăng ký lead vẫn cần cấu hình email đã kích hoạt.'
            }
            action={
              isFilteredEmpty
                ? {
                    label: 'Xoá lọc',
                    onClick: () => {
                      setSearch('')
                      setActiveFilter('all')
                    },
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          onRefresh={() => void refetch()}
        />
      )}
    </div>
  )
}
