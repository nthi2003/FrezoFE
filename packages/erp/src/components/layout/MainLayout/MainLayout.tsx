// ============================================================
// FREZO ERP — Main Layout
// Sidebar + Header + Content area + Global CommandPalette (Ctrl+K)
// + Realtime notification toast
// ============================================================

import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { CommandPalette, useCommandPalette } from '@/components/shared/CommandPalette'
import { CommandPaletteContext } from '@/components/shared/CommandPalette/context'
import { useNotificationRealtimeToast } from '@/modules/common/hooks/useNotification'

export function MainLayout() {
  const palette = useCommandPalette()

  // Toast realtime khi có thông báo mới (poll 30s + diff snapshot)
  useNotificationRealtimeToast()

  return (
    <CommandPaletteContext.Provider value={palette}>
      <div className="flex h-screen bg-neutral-50 overflow-hidden">
        <Sidebar />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header />

          <main className="flex-1 overflow-auto p-6">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>

        <CommandPalette isOpen={palette.isOpen} onClose={palette.close} />
      </div>
    </CommandPaletteContext.Provider>
  )
}
