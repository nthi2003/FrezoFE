import { useState, useRef, useEffect, useLayoutEffect, useCallback, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@frezo/utils'

export interface Option {
  value: string
  label: string
}

interface SelectProps {
  options: (Option | string)[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  showSearch?: boolean
  showClear?: boolean
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-required'?: boolean | 'true' | 'false'
  'aria-invalid'?: boolean | 'true' | 'false'
  'aria-describedby'?: string
}

const DROPDOWN_MAX_H = 280
const DROPDOWN_MIN_W = 260

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Chọn một mục...',
  className,
  showSearch = true,
  showClear = false,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-required': ariaRequired,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )

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
  }, [isOpen, updatePosition])

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

  const handleSelectOption = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedOption = normalizedOptions.find((opt) => opt.value === value)

  const dropdown = isOpen
    ? createPortal(
        <div
          ref={dropdownRef}
          data-frezo-select-dropdown=""
          style={dropdownStyle}
          className="pointer-events-auto rounded-md border border-border bg-surface shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-6 text-sm text-neutral-400 select-none">
                Không tìm thấy kết quả
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value
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
                      handleSelectOption(opt.value)
                    }}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors duration-100 select-none',
                      isSelected
                        ? 'bg-primary-50 text-primary-900 font-medium'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check size={14} className="text-primary-600 shrink-0" strokeWidth={3} />}
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
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-required={ariaRequired}
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
          'flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-1.5 text-sm ring-offset-background cursor-pointer transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          isOpen ? 'ring-2 ring-primary-500 border-primary-500' : 'hover:border-neutral-400',
          ariaInvalid === true || ariaInvalid === 'true' ? 'border-danger' : undefined
        )}
      >
        {isOpen && showSearch ? (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={selectedOption ? selectedOption.label : placeholder}
            className="w-full min-w-0 bg-transparent border-0 p-0 text-sm focus:outline-none focus:ring-0 placeholder:text-neutral-400"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={cn('truncate select-none', !selectedOption && 'text-neutral-400')}
            title={selectedOption ? selectedOption.label : undefined}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        )}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {showClear && value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Xóa lựa chọn"
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={cn('text-neutral-400 transition-transform', isOpen && 'rotate-180')}
          />
        </div>
      </div>

      {dropdown}
    </div>
  )
}
