// ============================================================

// FREZO ERP — Lobby Layout

// Sảnh chờ trước khi vào phân hệ ERP — không Sidebar

// ============================================================



import { Outlet, useNavigate } from 'react-router-dom'

import { BookOpen, Search, Command } from 'lucide-react'

import { AppTooltip } from '@frezo/ui'

import logoSrc from '@/img/logo.png'

import { CommandPalette, useCommandPalette } from '@/components/shared/CommandPalette'

import { CommandPaletteContext } from '@/components/shared/CommandPalette/context'

import { NotificationBell } from '@/components/shared/NotificationBell/NotificationBell'

import { UserAccountMenu } from '@/components/shared/UserAvatar'

import { useNotificationRealtimeToast } from '@/modules/common/hooks/useNotification'



export function LobbyLayout() {

  const palette = useCommandPalette()

  const navigate = useNavigate()



  useNotificationRealtimeToast()



  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)



  return (

    <CommandPaletteContext.Provider value={palette}>

      <div className="flex min-h-screen flex-col bg-neutral-50">

        <header className="sticky top-0 z-40 shrink-0 border-b border-neutral-200 bg-surface shadow-sm">

          <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">

            <button

              type="button"

              onClick={() => navigate('/')}

              className="flex min-w-0 items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"

            >

              <img src={logoSrc} alt="Frezo" className="h-7 w-auto shrink-0 object-contain" />

              <div className="min-w-0 text-left">

                <div className="truncate text-sm font-semibold text-neutral-900">Frezo ERP</div>

                <div className="truncate text-2xs uppercase tracking-wider text-neutral-400">

                  Trang chủ

                </div>

              </div>

            </button>



            <div className="flex items-center gap-2 shrink-0">

              <AppTooltip content="Mở thanh lệnh (Ctrl+K)">
                <button
                  type="button"
                  onClick={palette.open}
                  className="hidden sm:flex items-center gap-2 h-8 pl-2.5 pr-2 text-xs bg-neutral-50 border border-border rounded-lg text-neutral-500 hover:bg-white hover:border-primary-300 hover:text-neutral-700 transition-colors group"
                >
                  <Search size={13} className="text-neutral-400 group-hover:text-primary-500" />
                  <span className="hidden md:inline w-28 text-left">Tìm kiếm...</span>
                  <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-[10px] font-mono font-semibold text-neutral-500 shadow-sm">
                    {isMac ? <Command size={9} /> : 'Ctrl'} K
                  </kbd>
                </button>
              </AppTooltip>



              <AppTooltip content="Tài liệu">
                <button
                  type="button"
                  onClick={() => navigate('/docs')}
                  aria-label="Tài liệu"
                  className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-primary-700 transition-colors"
                >
                  <BookOpen size={16} strokeWidth={1.5} />
                </button>
              </AppTooltip>



              <NotificationBell />



              <UserAccountMenu />

            </div>

          </div>

        </header>



        <main className="flex-1 overflow-auto">

          <Outlet />

        </main>

      </div>



      <CommandPalette isOpen={palette.isOpen} onClose={palette.close} />

    </CommandPaletteContext.Provider>

  )

}


