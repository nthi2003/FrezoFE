// ============================================================
// FREZO ERP — JobsPage
// Quản trị tác vụ nền: bật/tắt, sửa cron, chạy tay, xem lịch sử.
// ============================================================

import { useMemo, useState } from 'react'
import { Play, RefreshCw, Timer } from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import {
  Button,
  EmptyState,
  ErrorState,
  PageGuideButton,
  PageHeader,
  RowActions,
  StatusBadge,
  Switch,
  type PageGuideConfig,
} from '@frezo/ui'
import { usePermission } from '@/lib/hooks/usePermission'
import { formatDateTime, formatRelativeTime } from '@/lib/utils/format'
import { JobEditCronModal } from '../components/JobEditCronModal'
import { JobHistoryDrawer } from '../components/JobHistoryDrawer'
import { JOB_STATUS_CONFIG, RUN_STATUS_CONFIG } from '../constants/jobStatus'
import { useJobs, useRunJob, useUpdateJob } from '../hooks/useJob'
import type { SystemJobDto, SystemJobRunStatus } from '../services/jobApi'
import { formatDuration, humanizeCron } from '../utils/cron'

const JOBS_GUIDE: PageGuideConfig = {
  title: 'Tác vụ nền',
  subtitle: 'Theo dõi và điều khiển các tác vụ chạy theo lịch trong hệ thống.',
  sections: [
    {
      heading: 'Thao tác thường dùng',
      type: 'steps',
      steps: [
        {
          title: 'Bật / tắt',
          description: 'Dùng công tắc trên từng dòng để dừng hoặc kích hoạt lịch chạy.',
        },
        {
          title: 'Sửa lịch',
          description: 'Chọn biểu thức lịch hoặc mẫu sẵn (mỗi giờ / hằng ngày / tuần / tháng).',
        },
        {
          title: 'Chạy ngay',
          description: 'Kích hoạt ngoài lịch — hệ thống hỏi xác nhận trước khi chạy.',
        },
        {
          title: 'Xem lịch sử',
          description: 'Mở ngăn bên để lọc theo kết quả và khoảng thời gian.',
        },
      ],
    },
    {
      heading: 'Mẹo',
      type: 'tips',
      tips: [
        'Khi trạng thái Đang chạy, bảng tự làm mới mỗi 5 giây.',
        'Gợi ý trên lịch giải thích lịch bằng tiếng Việt.',
      ],
    },
  ],
}

export function JobsPage() {
  const canUpdate = usePermission('QTHT.JOBS.UPDATE')
  const canRun = usePermission('QTHT.JOBS.RUN')

  const { data, isLoading, isError, isFetching, refetch } = useJobs()
  const updateMut = useUpdateJob()
  const runMut = useRunJob()

  const [editJob, setEditJob] = useState<SystemJobDto | null>(null)
  const [historyJob, setHistoryJob] = useState<SystemJobDto | null>(null)

  const jobs = data ?? []

  const columns = useMemo<AppTableColumn<SystemJobDto>[]>(
    () => [
      {
        title: 'Tác vụ',
        dataIndex: 'name',
        render: (_: unknown, row: SystemJobDto) => (
          <div className="min-w-0 py-0.5">
            <div className="truncate text-sm font-semibold text-neutral-900">{row.name}</div>
            {row.description ? (
              <div className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{row.description}</div>
            ) : null}
            {row.moduleCode ? (
              <div className="mt-1 text-[11px] uppercase tracking-wide text-neutral-400">
                {row.moduleCode}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        title: 'Lịch chạy',
        dataIndex: 'cronExpression',
        width: 200,
        render: (_: unknown, row: SystemJobDto) => {
          const hint = row.cronDescription || humanizeCron(row.cronExpression)
          return (
            <div title={hint} className="space-y-0.5">
              <code className="block rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-800">
                {row.cronExpression}
              </code>
              <div className="text-[11px] text-neutral-500">{hint}</div>
            </div>
          )
        },
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        width: 120,
        render: (value: SystemJobDto['status']) => {
          const cfg = JOB_STATUS_CONFIG[value]
          return cfg ? <StatusBadge {...cfg} /> : <span className="text-xs">—</span>
        },
      },
      {
        title: 'Lần chạy gần nhất',
        dataIndex: 'lastRunAt',
        width: 180,
        render: (_: unknown, row: SystemJobDto) => {
          if (!row.lastRunAt) {
            return <span className="text-xs text-neutral-400">Chưa chạy</span>
          }
          const runCfg =
            row.lastStatus && RUN_STATUS_CONFIG[row.lastStatus as SystemJobRunStatus]
          return (
            <div className="space-y-1">
              <div
                className="text-xs text-neutral-700"
                title={formatDateTime(row.lastRunAt)}
              >
                {formatRelativeTime(row.lastRunAt)}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {runCfg ? <StatusBadge {...runCfg} /> : null}
                {row.lastDurationMs != null ? (
                  <span className="text-[11px] text-neutral-400">
                    {formatDuration(row.lastDurationMs)}
                  </span>
                ) : null}
              </div>
            </div>
          )
        },
      },
      {
        title: 'Lần chạy kế tiếp',
        dataIndex: 'nextRunAt',
        width: 150,
        render: (value: string, row: SystemJobDto) =>
          !row.enabled || !value ? (
            <span className="text-xs text-neutral-400">—</span>
          ) : (
            <span className="text-xs tabular-nums text-neutral-700">{formatDateTime(value)}</span>
          ),
      },
      {
        title: 'Bật',
        dataIndex: 'enabled',
        width: 72,
        align: 'center' as const,
        render: (_: unknown, row: SystemJobDto) =>
          canUpdate ? (
            <Switch
              checked={row.enabled}
              disabled={updateMut.isPending || row.status === 'RUNNING'}
              onChange={(enabled) => updateMut.mutate({ code: row.code, data: { enabled } })}
            />
          ) : (
            <span className="text-xs text-neutral-500">{row.enabled ? 'Bật' : 'Tắt'}</span>
          ),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 120,
        align: 'right' as const,
        render: (_: unknown, row: SystemJobDto) => (
          <RowActions
            align="end"
            actions={[
              {
                kind: 'view',
                tooltip: 'Xem lịch sử',
                onClick: () => setHistoryJob(row),
              },
              {
                kind: 'edit',
                tooltip: 'Sửa lịch',
                onClick: () => setEditJob(row),
                hidden: !canUpdate,
              },
              {
                key: 'run',
                icon: Play,
                tooltip: 'Chạy ngay',
                tone: 'blue',
                hidden: !canRun,
                disabled: row.status === 'RUNNING' || runMut.isPending,
                confirm: {
                  title: 'Chạy tác vụ ngay?',
                  message: `Chạy "${row.name}" ngoài lịch định kỳ?`,
                  confirmText: 'Chạy ngay',
                  variant: 'warning',
                },
                onClick: () => runMut.mutate(row.code),
              },
            ]}
          />
        ),
      },
    ],
    [canRun, canUpdate, runMut, updateMut],
  )

  return (
    <div className="space-y-4 p-6 animate-fade-in">
      <PageHeader
        title="Tác vụ nền"
        description="Quản lý lịch chạy tự động của hệ thống — bật/tắt, sửa lịch, chạy thủ công, xem lịch sử."
        actions={
          <div className="flex items-center gap-2">
            <PageGuideButton guide={JOBS_GUIDE} />
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
              Làm mới
            </Button>
          </div>
        }
      />

      {isError ? (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <ErrorState
            title="Không tải được danh sách tác vụ"
            message="Kiểm tra kết nối hoặc quyền QTHT.JOBS.VIEW rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : !isLoading && jobs.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <EmptyState
            icon={Timer}
            title="Chưa có tác vụ nền"
            description="Hệ thống sẽ tự đăng ký tác vụ khi máy chủ khởi động. Kiểm tra bảng system_job nếu danh sách vẫn trống."
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={jobs}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          onRefresh={() => void refetch()}
        />
      )}

      <JobEditCronModal
        job={editJob}
        isOpen={!!editJob}
        isSaving={updateMut.isPending}
        onClose={() => setEditJob(null)}
        onSave={(cronExpression) => {
          if (!editJob) return
          updateMut.mutate(
            { code: editJob.code, data: { cronExpression } },
            { onSuccess: () => setEditJob(null) },
          )
        }}
      />

      <JobHistoryDrawer job={historyJob} onClose={() => setHistoryJob(null)} />
    </div>
  )
}
