// ============================================================
// useConfirmDialog / useConfirm — thay window.confirm() (FR-UX-03)
// ============================================================

import { useCallback, useState, type ReactNode } from 'react'
import { ConfirmDialog, type ConfirmVariant } from '@frezo/ui'

export interface ConfirmAskOptions {
  title: string
  /** Ưu tiên dùng `description`. */
  description?: ReactNode
  /** @deprecated Dùng `description`. */
  message?: ReactNode
  confirmText?: string
  cancelText?: string
  /** `default` giữ tương thích — map sang `info`. */
  variant?: ConfirmVariant | 'default'
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  requireTypeToConfirm?: string
  extra?: ReactNode
}

/**
 * Hook imperative: `askConfirm` + node `confirmDialog` render 1 lần trong page.
 *
 * @example
 * const { askConfirm, confirmDialog } = useConfirm()
 * askConfirm({
 *   title: 'Xoá?',
 *   description: 'Không hoàn tác được.',
 *   variant: 'danger',
 *   onConfirm: () => del.mutateAsync(id),
 * })
 * return <>{...}{confirmDialog}</>
 */
export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmAskOptions | null>(null)
  const [loading, setLoading] = useState(false)

  const askConfirm = useCallback((opts: ConfirmAskOptions) => {
    setState(opts)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!state) return
    setLoading(true)
    try {
      await Promise.resolve(state.onConfirm())
      setState(null)
    } catch {
      // Giữ dialog mở khi lỗi
    } finally {
      setLoading(false)
    }
  }, [state])

  const handleCancel = useCallback(() => {
    if (loading) return
    state?.onCancel?.()
    setState(null)
  }, [loading, state])

  const confirmDialog = (
    <ConfirmDialog
      isOpen={!!state}
      onClose={handleCancel}
      onConfirm={() => handleConfirm()}
      title={state?.title || ''}
      description={state?.description ?? state?.message ?? ''}
      confirmText={state?.confirmText}
      cancelText={state?.cancelText}
      variant={state?.variant ?? 'danger'}
      isLoading={loading}
      requireTypeToConfirm={state?.requireTypeToConfirm}
      extra={state?.extra}
    />
  )

  return { askConfirm, confirmDialog, isOpen: !!state }
}

/** Alias ngắn của `useConfirmDialog`. */
export const useConfirm = useConfirmDialog
