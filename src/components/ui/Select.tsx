// ============================================================
// FREZO ERP — Select Component (Single Selection)
// Premium custom select with search filter, clear option, and smooth animations
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

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
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Chọn một mục...',
  className,
  showSearch = true,
  showClear = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Normalize options to Option objects
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (!isOpen) return
    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setDropdownStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width })
      }
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
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

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-1.5 text-sm ring-offset-background cursor-pointer transition-all duration-150',
          isOpen ? 'ring-2 ring-primary-500 border-primary-500' : 'hover:border-neutral-400'
        )}
      >
        <span className={cn('truncate select-none', !selectedOption && 'text-neutral-400')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {showClear && value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors"
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

      {/* Dropdown Panel via Portal */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: dropdownStyle.top, left: dropdownStyle.left, width: dropdownStyle.width, zIndex: 9999 }}
          className="rounded-md border border-border bg-surface shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Search bar */}
          {showSearch && (
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full bg-neutral-50 pl-7 pr-3 py-1 text-xs rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-400 select-none">
                Không tìm thấy kết quả
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelectOption(opt.value)}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 text-xs rounded cursor-pointer transition-colors duration-100 select-none',
                      isSelected
                        ? 'bg-primary-50 text-primary-900 font-medium'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check size={12} className="text-primary-600 shrink-0" strokeWidth={3} />}
                  </div>
                )
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
