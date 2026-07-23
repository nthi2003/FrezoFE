import { useState, useRef, useEffect, useLayoutEffect, useCallback, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, X, Search } from 'lucide-react'
import { cn } from '@frezo/utils'

export interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  options: (Option | string)[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-invalid'?: boolean | 'true' | 'false'
  'aria-describedby'?: string
}

const DROPDOWN_MAX_H = 280
const DROPDOWN_MIN_W = 260

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Chọn các mục...',
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )

  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedOptions = normalizedOptions.filter((opt) => value.includes(opt.value))

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < DROPDOWN_MAX_H && rect.top > spaceBelow
    const width = Math.max(rect.width, DROPDOWN_MIN_W)
    const left = Math.min(rect.left, Math.max(8, window.innerWidth - width - 8))
    setDropdownStyle({
      position: 'fixed',
      left,
      width,
      // Above Radix Dialog (z-50). pointerEvents required: modal sets body { pointer-events: none }.
      zIndex: 10050,
      pointerEvents: 'auto',
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4, top: 'auto' }
        : { top: rect.bottom + 4, bottom: 'auto' }),
    })
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) return
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, updatePosition, filteredOptions.length, selectedOptions.length])

  useEffect(() => {
    function handlePointerDownOutside(event: PointerEvent) {
      const target = event.target as Node
      if (containerRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDownOutside)
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  const handleToggleOption = (optionValue: string) => {
    const isSelected = value.includes(optionValue)
    const newValue = isSelected
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  const handleRemoveValue = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation()
    onChange(value.filter((v) => v !== optionValue))
  }

  const handleSelectAll = () => {
    const allValues = filteredOptions.map((opt) => opt.value)
    const newValue = Array.from(new Set([...value, ...allValues]))
    onChange(newValue)
  }

  const handleClearAll = () => {
    const filteredValues = filteredOptions.map((opt) => opt.value)
    onChange(value.filter((v) => !filteredValues.includes(v)))
  }

  const dropdown = isOpen
    ? createPortal(
        <div
          ref={dropdownRef}
          data-frezo-select-dropdown=""
          style={dropdownStyle}
          className="pointer-events-auto rounded-md border border-border bg-surface shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="p-2 border-b border-border flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full bg-neutral-50 pl-8 pr-3 py-1.5 text-xs rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500 px-1">
              <span>Đang hiển thị {filteredOptions.length} mục</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onPointerDown={(e) => {
                    // AppModal preventDefault on outside pointerdown suppresses mousedown/click.
                    e.preventDefault()
                    e.stopPropagation()
                    handleSelectAll()
                  }}
                  className="text-primary-600 hover:text-primary-800 transition-colors"
                >
                  Chọn tất cả
                </button>
                <span className="text-neutral-300">|</span>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleClearAll()
                  }}
                  className="text-neutral-600 hover:text-neutral-800 transition-colors"
                >
                  Bỏ chọn tất cả
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-6 text-sm text-neutral-400 select-none">
                Không tìm thấy kết quả
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value.includes(opt.value)
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onPointerDown={(e) => {
                      // Must use pointerdown: Radix Dialog outside handler preventDefaults
                      // pointerdown which cancels subsequent mousedown/click.
                      e.preventDefault()
                      e.stopPropagation()
                      handleToggleOption(opt.value)
                    }}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 text-sm rounded-md cursor-pointer transition-colors duration-100 select-none',
                      isSelected
                        ? 'bg-primary-50/50 text-primary-900 font-medium'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border border-neutral-300 transition-all shrink-0',
                        isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white'
                      )}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>,
        document.body
      )
    : null

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div
        ref={triggerRef}
        id={id}
        role="combobox"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-multiselectable="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen((open) => !open)
          } else if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }}
        className={cn(
          'flex min-h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-1.5 text-sm ring-offset-background cursor-pointer transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          isOpen ? 'ring-2 ring-primary-500 border-primary-500' : 'hover:border-neutral-400',
          ariaInvalid === true || ariaInvalid === 'true' ? 'border-danger' : undefined
        )}
      >
        <div className="flex flex-wrap gap-1 items-center min-w-0 flex-1 max-w-[90%]">
          {selectedOptions.length === 0 ? (
            <span className="text-neutral-400 select-none truncate">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                title={opt.label}
                className="inline-flex items-center gap-1 max-w-full bg-primary-50 text-primary-700 px-2 py-0.5 rounded text-xs font-medium border border-primary-100 transition-all hover:bg-primary-100"
              >
                <span className="truncate">{opt.label}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveValue(e, opt.value)}
                  className="hover:bg-primary-200 rounded-full p-0.5 text-primary-600 hover:text-primary-800 transition-colors shrink-0"
                  aria-label={`Bỏ chọn ${opt.label}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          size={16}
          className={cn('text-neutral-400 transition-transform shrink-0 ml-2', isOpen && 'rotate-180')}
        />
      </div>

      {dropdown}
    </div>
  )
}
