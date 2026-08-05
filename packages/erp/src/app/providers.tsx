// ============================================================
// FREZO ERP — App Providers
// QueryClient, Router, Toast notifications
// ============================================================

import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { registerPageGuideCmsResolver, TooltipProvider, TOOLTIP_DELAY_MS } from '@frezo/ui'
import { router } from './router'
import { AuthProfileSync } from '@/modules/auth/components/AuthProfileSync'
import { resolvePublishedGuideBody } from '@/modules/docs/services/docsRegistry'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,    // 1 minute default
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

function PageGuideCmsBootstrap() {
  useEffect(() => {
    registerPageGuideCmsResolver(resolvePublishedGuideBody)
    return () => registerPageGuideCmsResolver(null)
  }, [])
  return null
}

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={TOOLTIP_DELAY_MS} skipDelayDuration={0}>
        <PageGuideCmsBootstrap />
        <AuthProfileSync />
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
