import { useEffect, useState, useCallback } from 'react'

/**
 * Global Ctrl+K / ⌘K listener + open/close state.
 *
 * Usage in MainLayout:
 *   const { isOpen, close } = useCommandPalette()
 *   return <> ... <CommandPalette isOpen={isOpen} onClose={close} /> </>
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ctrl+K (Win/Linux) or ⌘K (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        // Ignore when typing in text inputs (unless it's from Cmd+K in nested app)
        // Actually Linear/Notion still open even in inputs — override anyway
        e.preventDefault()
        setIsOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return { isOpen, open, close, toggle }
}
