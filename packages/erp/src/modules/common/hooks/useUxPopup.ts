import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { uxPopupApi, type UxPopupTemplate } from '../services/uxPopupApi'

export interface UseUxPopupOptions {
  /** Gọi khi event không có template / inactive — caller có thể toast fallback */
  onEmpty?: (eventCode: string) => void
}

/**
 * Load template UX popup theo event code (category group UX_POPUP).
 * Dùng `show(eventCode)` sau khi API nghiệp vụ trả `popupEvent`.
 */
export function useUxPopup(opts?: UseUxPopupOptions) {
  const [activeEvent, setActiveEvent] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const onEmptyRef = useRef(opts?.onEmpty)
  onEmptyRef.current = opts?.onEmpty

  const query = useQuery({
    queryKey: ['ux-popup', activeEvent],
    queryFn: () => uxPopupApi.getByEvent(activeEvent!),
    enabled: !!activeEvent && open,
    select: (res): UxPopupTemplate | null => {
      const data = res?.data
      if (!data || data.enabled === false) return null
      if (!data.title && !data.body) return null
      return data
    },
    staleTime: 5 * 60_000,
  })

  const show = useCallback((eventCode: string) => {
    if (!eventCode) return
    setActiveEvent(eventCode)
    setOpen(true)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open || !activeEvent || query.isLoading || query.isFetching) return
    if (!query.data) {
      onEmptyRef.current?.(activeEvent)
      setOpen(false)
    }
  }, [open, activeEvent, query.isLoading, query.isFetching, query.data])

  const template = open ? query.data ?? null : null
  const isReady = open && !query.isLoading && !!template

  return {
    show,
    close,
    open: isReady,
    template,
    isLoading: open && query.isLoading,
    modalProps: {
      isOpen: isReady,
      onClose: close,
      title: template?.title ?? '',
      body: template?.body ?? undefined,
      imageUrl: template?.imageUrl ?? undefined,
    },
  }
}
