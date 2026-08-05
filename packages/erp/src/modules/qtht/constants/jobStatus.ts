import { type StatusConfig } from '@frezo/ui'
import type { SystemJobRunStatus, SystemJobStatus } from '../services/jobApi'

/** Trạng thái vận hành của job trên bảng danh sách. */
export const JOB_STATUS_CONFIG: Record<SystemJobStatus, StatusConfig> = {
  ENABLED: { label: 'Đang bật', color: 'success' },
  DISABLED: { label: 'Tắt', color: 'neutral' },
  RUNNING: { label: 'Đang chạy', color: 'info' },
  ERROR: { label: 'Lỗi', color: 'danger' },
}

/** Kết quả lần chạy (cột gần nhất + lịch sử). */
export const RUN_STATUS_CONFIG: Record<SystemJobRunStatus, StatusConfig> = {
  SUCCESS: { label: 'Thành công', color: 'success' },
  FAILED: { label: 'Thất bại', color: 'danger' },
  SKIPPED: { label: 'Bỏ qua', color: 'warning' },
}
