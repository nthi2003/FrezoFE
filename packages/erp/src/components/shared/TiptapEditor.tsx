import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import LinkExtension from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'
import { Node, mergeAttributes } from '@tiptap/core'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Quote,
  Heading1, Heading2, Heading3, Code, Minus, Link, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo2, Redo2, RemoveFormatting, ImageIcon,
} from 'lucide-react'
import { Button, AppModal, Input, Label } from '@frezo/ui'
import { cn } from '@frezo/utils'
import { useEffect, useCallback, useImperativeHandle, forwardRef, useState } from 'react'
import { ImageUploadModal } from './ImageUploadModal'

interface TiptapEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export interface TiptapEditorRef {
  insertHtml: (html: string) => void
}

const PlaceholderNode = Node.create({
  name: 'placeholder',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      placeholder: {
        default: null,
        parseHTML: element => element.getAttribute('data-placeholder'),
        renderHTML: attributes => ({
          'data-placeholder': attributes.placeholder,
        }),
      },
      label: {
        default: '',
        parseHTML: element => element.textContent || '',
        renderHTML: () => ({}),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-placeholder]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'contract-placeholder bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded border border-primary-200 font-semibold select-all mx-0.5 inline-block',
      }),
      node.attrs.label || '',
    ]
  },
})

const ToolbarButton = ({ onClick, active, children, title }: {
  onClick: () => void
  active: boolean
  children: React.ReactNode
  title?: string
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className={cn(
      'p-1.5 rounded transition-colors',
      active ? 'bg-primary-100 text-primary-700' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
    )}
  >
    {children}
  </button>
)

const Divider = () => <div className="w-px h-5 bg-neutral-200 mx-0.5" />

export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  ({ value, onChange, placeholder = 'Nhập nội dung...', className }, ref) => {
    const [imageModalOpen, setImageModalOpen] = useState(false)
    const [linkModalOpen, setLinkModalOpen] = useState(false)
    const [linkDraft, setLinkDraft] = useState('https://')

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Underline,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        LinkExtension.configure({ openOnClick: false }),
        ImageExtension.configure({ inline: true }),
        Placeholder.configure({ placeholder }),
        PlaceholderNode,
      ],
      content: value,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML())
      },
    })

    useImperativeHandle(ref, () => ({
      insertHtml: (html: string) => {
        if (editor) {
          editor.chain().focus().insertContent(html).run()
        }
      }
    }), [editor])

    useEffect(() => {
      if (editor && value !== editor.getHTML()) {
        editor.commands.setContent(value, { emitUpdate: false })
      }
    }, [editor, value])

    const openLinkModal = useCallback(() => {
      if (!editor) return
      const previousUrl = (editor.getAttributes('link').href as string) || 'https://'
      setLinkDraft(previousUrl)
      setLinkModalOpen(true)
    }, [editor])

    const applyLink = useCallback(() => {
      if (!editor) return
      const url = linkDraft.trim()
      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
      }
      setLinkModalOpen(false)
    }, [editor, linkDraft])

    const removeLink = useCallback(() => {
      if (!editor) return
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setLinkModalOpen(false)
    }, [editor])

    const handleImageUploaded = useCallback((url: string) => {
      if (!editor || !url) return
      editor.chain().focus().setImage({ src: url }).run()
    }, [editor])

    if (!editor) return null

    return (
      <div className={cn('border border-border rounded-lg overflow-hidden flex flex-col bg-white', className)}>
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-neutral-50/80 flex-wrap">
          <ToolbarButton title="In đậm" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
            <Bold size={15} />
          </ToolbarButton>
          <ToolbarButton title="In nghiêng" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
            <Italic size={15} />
          </ToolbarButton>
          <ToolbarButton title="Gạch chân" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
            <UnderlineIcon size={15} />
          </ToolbarButton>
          <ToolbarButton title="Gạch ngang" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
            <Strikethrough size={15} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton title="Mã" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}>
            <Code size={15} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton title="Tiêu đề 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}>
            <Heading1 size={15} />
          </ToolbarButton>
          <ToolbarButton title="Tiêu đề 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
            <Heading2 size={15} />
          </ToolbarButton>
          <ToolbarButton title="Tiêu đề 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
            <Heading3 size={15} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton title="Căn trái" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}>
            <AlignLeft size={15} />
          </ToolbarButton>
          <ToolbarButton title="Căn giữa" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}>
            <AlignCenter size={15} />
          </ToolbarButton>
          <ToolbarButton title="Căn phải" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}>
            <AlignRight size={15} />
          </ToolbarButton>
          <ToolbarButton title="Căn đều" onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })}>
            <AlignJustify size={15} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton title="Danh sách" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
            <List size={15} />
          </ToolbarButton>
          <ToolbarButton title="Danh sách số" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
            <ListOrdered size={15} />
          </ToolbarButton>
          <ToolbarButton title="Trích dẫn" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
            <Quote size={15} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton title="Chèn liên kết" onClick={openLinkModal} active={editor.isActive('link')}>
            <Link size={15} />
          </ToolbarButton>
          <ToolbarButton title="Chèn hình ảnh" onClick={() => setImageModalOpen(true)} active={editor.isActive('image')}>
            <ImageIcon size={15} />
          </ToolbarButton>
          <ToolbarButton title="Đường kẻ ngang" onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false}>
            <Minus size={15} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton title="Xóa định dạng" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} active={false}>
            <RemoveFormatting size={15} />
          </ToolbarButton>

          <div className="ml-auto flex items-center gap-0.5">
            <ToolbarButton title="Hoàn tác" onClick={() => editor.chain().focus().undo().run()} active={false}>
              <Undo2 size={15} />
            </ToolbarButton>
            <ToolbarButton title="Làm lại" onClick={() => editor.chain().focus().redo().run()} active={false}>
              <Redo2 size={15} />
            </ToolbarButton>
          </div>
        </div>
        <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[380px]" />

        <ImageUploadModal
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          onUploaded={handleImageUploaded}
          title="Chèn hình ảnh vào nội dung"
        />

        <AppModal
          isOpen={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          title="Chèn liên kết"
          description="Nhập URL. Để trống rồi bấm Xóa liên kết nếu muốn gỡ link."
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700">URL</Label>
              <Input
                value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                placeholder="https://"
                className="h-10"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    applyLink()
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-200">
              <Button type="button" variant="ghost" onClick={removeLink} className="text-danger">
                Xóa liên kết
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setLinkModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="button" onClick={applyLink}>
                  Áp dụng
                </Button>
              </div>
            </div>
          </div>
        </AppModal>
      </div>
    )
  }
)

TiptapEditor.displayName = 'TiptapEditor'
