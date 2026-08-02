export const PINNED_MODULES_KEY = 'frezo:lobby:pinned-modules'
export const MAX_PINNED_MODULES = 4

const PINNED_CHANGED = 'frezo:lobby:pinned-changed'

export function loadPinnedModuleCodes(): string[] {
  try {
    const raw = localStorage.getItem(PINNED_MODULES_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.filter((c): c is string => typeof c === 'string' && c.length > 0).slice(0, MAX_PINNED_MODULES)
  } catch {
    return []
  }
}

export function isPinnedModule(code: string): boolean {
  return loadPinnedModuleCodes().includes(code)
}

export type PinModuleResult = { ok: true } | { ok: false; reason: 'max' | 'invalid' }

export function togglePinnedModule(code: string): PinModuleResult {
  if (!code?.trim()) return { ok: false, reason: 'invalid' }
  const current = loadPinnedModuleCodes()
  if (current.includes(code)) {
    savePinned(current.filter((c) => c !== code))
    return { ok: true }
  }
  if (current.length >= MAX_PINNED_MODULES) {
    return { ok: false, reason: 'max' }
  }
  savePinned([...current, code])
  return { ok: true }
}

function savePinned(codes: string[]): void {
  try {
    localStorage.setItem(PINNED_MODULES_KEY, JSON.stringify(codes.slice(0, MAX_PINNED_MODULES)))
    window.dispatchEvent(new CustomEvent(PINNED_CHANGED))
  } catch {
    // ignore
  }
}

/** Lọc code không còn trong menu user — gọi khi menuTree đổi. */
export function prunePinnedModuleCodes(validCodes: Set<string>): string[] {
  const pruned = loadPinnedModuleCodes().filter((c) => validCodes.has(c))
  if (pruned.length !== loadPinnedModuleCodes().length) {
    savePinned(pruned)
  }
  return pruned
}

export { PINNED_CHANGED as PINNED_MODULES_CHANGED_EVENT }
