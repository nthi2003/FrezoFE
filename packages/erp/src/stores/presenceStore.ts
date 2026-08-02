// ============================================================
// FREZO ERP — Presence Store (localStorage per user)
// ============================================================

import { create } from 'zustand'
import { storage } from '@frezo/utils'
import {
  DEFAULT_PRESENCE,
  type PresenceStatus,
} from '@/lib/presence/presenceConfig'

const STORAGE_KEY = 'presence_status'

type PresenceMap = Record<string, PresenceStatus>

interface PresenceStore {
  status: PresenceStatus
  currentUsername: string | null
  initForUser: (username: string | undefined) => void
  setStatus: (status: PresenceStatus) => void
}

function loadMap(): PresenceMap {
  return storage.get<PresenceMap>(STORAGE_KEY) ?? {}
}

function saveStatus(username: string, status: PresenceStatus) {
  const map = loadMap()
  map[username] = status
  storage.set(STORAGE_KEY, map)
}

export const usePresenceStore = create<PresenceStore>((set, get) => ({
  status: DEFAULT_PRESENCE,
  currentUsername: null,

  initForUser: (username) => {
    if (!username) {
      set({ status: DEFAULT_PRESENCE, currentUsername: null })
      return
    }
    const map = loadMap()
    const status = map[username] ?? DEFAULT_PRESENCE
    set({ status, currentUsername: username })
  },

  setStatus: (status) => {
    const username = get().currentUsername
    if (username) saveStatus(username, status)
    set({ status })
  },
}))
