import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import { AtSign } from 'lucide-react'
import { useMentionUsers } from './useComments'
import type { MentionUser } from './types'

interface Props {
  value: string
  onChange: (value: string, mentionedIds: string[]) => void
  onSubmit: () => void
  placeholder?: string
  disabled?: boolean
  mentionedIds: string[]
}

export interface MentionInputHandle {
  /** Chèn text (emoji, …) tại vị trí caret hiện tại */
  insertAtCursor: (text: string) => void
  focus: () => void
}

/**
 * Input đơn giản + autocomplete @user.
 * (Tiptap full editor quá nặng cho comment box — MVP dùng textarea + @ trigger.)
 */
export const MentionInput = forwardRef<MentionInputHandle, Props>(function MentionInput(
  {
    value,
    onChange,
    onSubmit,
    placeholder = 'Viết bình luận… dùng @ để mention',
    disabled,
    mentionedIds,
  },
  ref,
) {
  const [mentionQ, setMentionQ] = useState<string | null>(null)
  const [caret, setCaret] = useState(0)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const caretRef = useRef(0)
  const { data: suggestions = [] } = useMentionUsers(mentionQ ?? '', mentionQ !== null)

  const syncCaret = (pos: number) => {
    caretRef.current = pos
    setCaret(pos)
  }

  // Detect @query trước caret
  useEffect(() => {
    const before = value.slice(0, caret)
    const m = before.match(/@([\w.àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]*)$/i)
    if (m) setMentionQ(m[1])
    else setMentionQ(null)
  }, [value, caret])

  const insertAtCursor = (text: string) => {
    const pos = caretRef.current
    const before = value.slice(0, pos)
    const after = value.slice(pos)
    const next = before + text + after
    const nextPos = before.length + text.length
    onChange(next, mentionedIds)
    syncCaret(nextPos)
    requestAnimationFrame(() => {
      taRef.current?.focus()
      taRef.current?.setSelectionRange(nextPos, nextPos)
    })
  }

  useImperativeHandle(ref, () => ({
    insertAtCursor,
    focus: () => taRef.current?.focus(),
  }))

  const pickUser = (u: MentionUser) => {
    const before = value.slice(0, caret)
    const after = value.slice(caret)
    const replaced = before.replace(/@[\w.àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]*$/i, `@${u.username} `)
    const next = replaced + after
    const ids = mentionedIds.includes(u.id) ? mentionedIds : [...mentionedIds, u.id]
    onChange(next, ids)
    setMentionQ(null)
    requestAnimationFrame(() => {
      taRef.current?.focus()
      const pos = replaced.length
      syncCaret(pos)
      taRef.current?.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="relative">
      <textarea
        ref={taRef}
        rows={2}
        disabled={disabled}
        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none disabled:opacity-60"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          syncCaret(e.target.selectionStart)
          onChange(e.target.value, mentionedIds)
        }}
        onSelect={(e) => syncCaret((e.target as HTMLTextAreaElement).selectionStart)}
        onKeyUp={(e) => syncCaret((e.target as HTMLTextAreaElement).selectionStart)}
        onClick={(e) => syncCaret((e.target as HTMLTextAreaElement).selectionStart)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            onSubmit()
          }
        }}
      />
      {mentionQ !== null && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 bottom-full mb-1 max-h-48 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg z-20 py-1">
          {suggestions.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 flex items-center gap-2"
                onClick={() => pickUser(u)}
              >
                <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                  {u.fullName.charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="font-medium text-neutral-800 block truncate">{u.fullName}</span>
                  <span className="text-[11px] text-neutral-400">@{u.username}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-400">
        <span className="inline-flex items-center gap-1">
          <AtSign size={11} /> gõ @ để mention · Emoji · Ctrl+Enter gửi
        </span>
      </div>
    </div>
  )
})
