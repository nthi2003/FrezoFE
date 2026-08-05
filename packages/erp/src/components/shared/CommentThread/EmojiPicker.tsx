// ============================================================
// EmojiPicker — grid emoji unicode miễn phí (không thêm dependency)
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { Smile } from 'lucide-react'

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: 'Cảm xúc',
    emojis: [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
      '😉', '😍', '🥰', '😘', '😜', '🤗', '🤔', '🤨', '😐', '😑',
      '😶', '🙄', '😏', '😣', '😥', '😮', '😲', '😢', '😭', '😤',
      '😠', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😴', '🥱', '😷',
    ],
  },
  {
    label: 'Cử chỉ',
    emojis: [
      '👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '✌️', '🤞', '🤟',
      '🤘', '👌', '🤌', '👈', '👉', '👆', '👇', '👋', '✋', '🖐️',
      '👊', '✊', '🫶', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤',
      '🤍', '💔', '❣️', '💕', '💞', '💯', '💢', '💥', '💫', '⭐',
    ],
  },
  {
    label: 'Công việc',
    emojis: [
      '✅', '❌', '⚠️', '❗', '❓', '💡', '📌', '📍', '🔥', '🎉',
      '🎊', '🏆', '🎯', '📋', '📝', '✏️', '📁', '📂', '📎', '🔗',
      '🗓️', '⏰', '🚀', '💼', '💻', '📱', '🔧', '⚙️', '🛠️', '📊',
      '📈', '📉', '💰', '🧾', '✉️', '📩', '🔔', '🔕', '👀', '🔒',
    ],
  },
  {
    label: 'Khác',
    emojis: [
      '☕', '🍵', '🍕', '🍔', '🍜', '🍰', '🎂', '🍻', '🌿', '🌸',
      '🌺', '🍀', '☀️', '🌙', '⚡', '🌈', '🏖️', '🏠', '🏢', '🚗',
      '✈️', '🎁', '🎈', '🪄', '✨', '🌟', '🐱', '🐶', '🦊', '🐼',
    ],
  },
]

interface Props {
  onPick: (emoji: string) => void
  disabled?: boolean
}

export function EmojiPicker({ onPick, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 h-8 px-2.5 text-xs text-neutral-700 border border-neutral-200 rounded-md hover:bg-neutral-50 hover:border-neutral-300 transition disabled:opacity-50"
        title="Chèn emoji"
        aria-label="Chèn emoji"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <Smile size={12} /> Emoji
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-1.5 z-30 w-[280px] rounded-lg border border-neutral-200 bg-white shadow-lg"
          role="dialog"
          aria-label="Chọn emoji"
        >
          <div className="flex gap-0.5 px-1.5 pt-1.5 border-b border-neutral-100">
            {EMOJI_GROUPS.map((g, i) => (
              <button
                key={g.label}
                type="button"
                className={`flex-1 px-1 py-1.5 text-[11px] rounded-t-md transition ${
                  tab === i
                    ? 'text-primary-700 font-semibold bg-primary-50'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                }`}
                onClick={() => setTab(i)}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-0.5 p-2 max-h-44 overflow-y-auto">
            {EMOJI_GROUPS[tab].emojis.map((emoji) => (
              <button
                key={`${EMOJI_GROUPS[tab].label}-${emoji}`}
                type="button"
                className="h-8 w-full rounded-md text-base leading-none hover:bg-primary-50 transition"
                title={emoji}
                onClick={() => {
                  onPick(emoji)
                  setOpen(false)
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
