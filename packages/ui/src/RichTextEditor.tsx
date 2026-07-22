import * as React from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Code, Quote,
  Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks,
  AlignLeft, AlignCenter, AlignRight,
  Link2, Image as ImageIcon, Undo2, Redo2, Eraser,
} from 'lucide-react'
import { cn } from '@frezo/utils'

/**
 * RichTextEditor — WYSIWYG editor dùng cho content dài (Article, Description, Announcement…).
 *
 * Chuẩn:
 * - Value là HTML string; controlled qua `value` + `onChange`.
 * - Toolbar sticky, gọn — chỉ các action thường dùng (heading, bold/italic, list, quote,
 *   link, image, align, undo/redo). Không nhồi 40 button như CKEditor.
 * - Nội dung render trong `.prose` (Tailwind Typography) — bắt buộc trang consumer đã có
 *   plugin `@tailwindcss/typography`. Nếu chưa có, styles cơ bản vẫn render OK, chỉ mất
 *   spacing.
 * - Image / Link: dùng prompt gọn thay vì popover phức tạp — enterprise tools thường
 *   upload media qua modal riêng rồi paste URL.
 *
 * KHÔNG dùng cho:
 * - Comment ngắn (dùng Textarea).
 * - Markdown export (TipTap output HTML; nếu cần MD, dùng extension khác).
 */

export interface RichTextEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  minHeight?: number
  editable?: boolean
  className?: string
  /**
   * Callback khi user muốn insert image từ URL. Nếu không truyền,
   * mặc định dùng window.prompt() — nên override để bật media picker chuẩn.
   */
  onRequestImage?: () => Promise<string | null> | string | null
  autoFocus?: boolean
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center justify-center h-8 w-8 rounded-md text-neutral-600',
        'transition-colors',
        'hover:bg-neutral-100 hover:text-neutral-900',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
        active && 'bg-primary-50 text-primary-700',
        disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent',
      )}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-5 w-px bg-neutral-200" aria-hidden="true" />
}

function Toolbar({
  editor,
  onRequestImage,
}: {
  editor: Editor
  onRequestImage?: RichTextEditorProps['onRequestImage']
}) {
  const insertLink = React.useCallback(() => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Nhập URL liên kết (để trống để xoá link):', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run()
  }, [editor])

  const insertImage = React.useCallback(async () => {
    let src: string | null = null
    if (onRequestImage) {
      const res = await onRequestImage()
      src = res ?? null
    } else {
      src = window.prompt('URL ảnh (jpg/png/webp):', 'https://')
    }
    if (!src) return
    editor.chain().focus().setImage({ src }).run()
  }, [editor, onRequestImage])

  return (
    <div
      role="toolbar"
      aria-label="Định dạng văn bản"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-white/95 backdrop-blur px-2 py-1.5"
    >
      <ToolbarButton
        title="Hoàn tác (Ctrl+Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Làm lại (Ctrl+Y)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo2 size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Tiêu đề H1"
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Tiêu đề H2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Tiêu đề H3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="In đậm (Ctrl+B)"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="In nghiêng (Ctrl+I)"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Gạch chân (Ctrl+U)"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Gạch ngang"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Mã (Code)"
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Danh sách chấm"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Danh sách số"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Trích dẫn"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Khối mã"
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <ListChecks size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Căn trái"
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Căn giữa"
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Căn phải"
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton title="Chèn liên kết" active={editor.isActive('link')} onClick={insertLink}>
        <Link2 size={16} />
      </ToolbarButton>
      <ToolbarButton title="Chèn ảnh" onClick={insertImage}>
        <ImageIcon size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Xoá định dạng"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
      >
        <Eraser size={16} />
      </ToolbarButton>
    </div>
  )
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Viết nội dung...',
  minHeight = 320,
  editable = true,
  className,
  onRequestImage,
  autoFocus = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'rounded-md bg-neutral-900 text-neutral-50 p-3 text-sm font-mono' } },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-primary-600 underline underline-offset-2 hover:text-primary-700',
          rel: 'noopener noreferrer nofollow',
        },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-lg my-3 max-w-full h-auto' },
        allowBase64: true,
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Typography,
    ],
    content: value,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-neutral max-w-none focus:outline-none px-4 py-3',
          'prose-headings:font-semibold prose-headings:tracking-tight',
          'prose-p:leading-relaxed prose-p:my-2',
          'prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline',
          'prose-img:rounded-lg',
          'prose-code:bg-neutral-100 prose-code:text-primary-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.85em] prose-code:before:hidden prose-code:after:hidden',
          'prose-pre:bg-neutral-900 prose-pre:text-neutral-50',
          'prose-blockquote:border-l-4 prose-blockquote:border-primary-200 prose-blockquote:pl-4 prose-blockquote:text-neutral-600',
        ),
      },
    },
  })

  // Sync external value → editor khi caller reset form (VD sau khi submit).
  // Không sync mỗi keystroke để tránh loop; chỉ khi value khác hoàn toàn với content hiện tại.
  React.useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if ((value || '') !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  if (!editor) {
    return (
      <div
        className={cn(
          'rounded-lg border border-neutral-200 bg-neutral-50 animate-pulse',
          className,
        )}
        style={{ minHeight: minHeight + 44 }}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 bg-white overflow-hidden',
        'focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-300',
        className,
      )}
    >
      {editable && <Toolbar editor={editor} onRequestImage={onRequestImage} />}
      <div style={{ minHeight }} className="max-h-[65vh] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
      <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/60 px-3 py-1.5 text-[11px] text-neutral-500">
        <span>
          {editor.storage.characterCount?.characters?.() ??
            editor.getText().length}{' '}
          ký tự · {editor.getText().split(/\s+/).filter(Boolean).length} từ
        </span>
        <span className="hidden sm:inline">Hỗ trợ Markdown: **bold**, *italic*, # heading, - list</span>
      </div>
    </div>
  )
}
