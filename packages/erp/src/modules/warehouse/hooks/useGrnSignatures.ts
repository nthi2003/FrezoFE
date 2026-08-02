import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'

export type GrnSignRole = 'PREPARER' | 'WAREHOUSE' | 'ACCOUNTANT' | 'DIRECTOR'

export interface GrnSignatureEntry {
  role: GrnSignRole
  signedBy: string
  signedAt: string
}

export type GrnSignatures = Partial<Record<GrnSignRole, GrnSignatureEntry>>

const STORAGE_PREFIX = 'frezo-grn-signatures:'

function loadSignatures(grnId: string): GrnSignatures {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${grnId}`)
    if (!raw) return {}
    return JSON.parse(raw) as GrnSignatures
  } catch {
    return {}
  }
}

function saveSignatures(grnId: string, signatures: GrnSignatures) {
  localStorage.setItem(`${STORAGE_PREFIX}${grnId}`, JSON.stringify(signatures))
}

export function useGrnSignatures(grnId?: string) {
  const user = useAuthStore((s) => s.user)
  const [signatures, setSignatures] = useState<GrnSignatures>({})

  useEffect(() => {
    if (!grnId) return
    setSignatures(loadSignatures(grnId))
  }, [grnId])

  const sign = useCallback(
    (role: GrnSignRole) => {
      if (!grnId) return
      const signedBy = user?.fullName || user?.username || 'Người dùng'
      const entry: GrnSignatureEntry = {
        role,
        signedBy,
        signedAt: new Date().toISOString(),
      }
      setSignatures((prev) => {
        const next = { ...prev, [role]: entry }
        saveSignatures(grnId, next)
        return next
      })
      toast.success(`Đã ký số (demo) — ${signedBy}`)
    },
    [grnId, user?.fullName, user?.username],
  )

  return { signatures, sign }
}
