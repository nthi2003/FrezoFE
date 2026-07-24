// ============================================================
// useConfirmDialog — thay window.confirm() (FR-UX-03 / STANDARD §8)
// ============================================================

import { useCallback, useState, type ReactNode } from 'react'
import { ConfirmDialog } from '@frezo/ui'

export interface ConfirmAskOptions {
  title: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  onConfirm: () => void | Promise<void>
}

/**
 * Hook trả về `askConfirm` + node `confirmDialog` để render 1 lần trong page.
 * @example
 * const { askConfirm, confirmDialog } = useConfirmDialog()
 * askConfirm({ title: 'Xoá?', message: '…', onConfirm: () => del.mutate(id) })
 * return <>{...}{confirmDialog}</>
 */
export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmAskOptions | null>(null)
  const [loading, setLoading] = useState(false)

  const askConfirm = useCallback((opts: ConfirmAskOptions) => {
    setState(opts)
  }, [])

  const close = useCallback(() => {
    if (loading) return
    setState(null)
  }, [loading])

  const handleConfirm = useCallback(async () => {
    if (!state) return
    setLoading(true)
    try {
      await Promise.resolve(state.onConfirm())
      setState(null)
    } finally {
      setLoading(false)
    }
  }, [state])

  const confirmDialog = (
    <ConfirmDialog
      isOpen={!!state}
      onClose={close}
      onConfirm={() => void handleConfirm()}
      title={state?.title || ''}
      message={state?.message ?? ''}
      confirmText={state?.confirmText}
      cancelText={state?.cancelText}
      variant={state?.variant ?? 'danger'}
      isLoading={loading}
    />
  )

  return { askConfirm, confirmDialog, isOpen: !!state }
}
