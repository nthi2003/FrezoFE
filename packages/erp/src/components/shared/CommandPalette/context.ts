import { createContext, useContext } from 'react'

interface CommandPaletteContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

/** Hook để mở CommandPalette từ bất kỳ component nào bên trong MainLayout. */
export function useCommandPaletteContext(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) {
    // Fallback silent no-op để không crash trong test/isolated rendering.
    return {
      isOpen: false,
      open: () => {},
      close: () => {},
      toggle: () => {},
    }
  }
  return ctx
}
