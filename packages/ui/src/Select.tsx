import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X, Search } from 'lucide-react'
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
  const containerRef = useRef<HTMLDivElement>(null)

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-1.5 text-sm ring-offset-background cursor-pointer transition-all duration-150',
          isOpen ? 'ring-2 ring-primary-500 border-primary-500' : 'hover:border-neutral-400'
        )}
      >
        {isOpen && showSearch ? (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={selectedOption ? selectedOption.label : placeholder}
            className="w-full bg-transparent border-0 p-0 text-sm focus:outline-none focus:ring-0 placeholder:text-neutral-400"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={cn('truncate select-none', !selectedOption && 'text-neutral-400')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        )}
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

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-surface shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
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
        </div>
      )}
    </div>
  )
}
