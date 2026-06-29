import { useState, useRef, useEffect } from 'react'
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
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Chọn các mục...',
  className,
}: MultiSelectProps) {
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

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    const allValues = filteredOptions.map((opt) => opt.value)
    const newValue = Array.from(new Set([...value, ...allValues]))
    onChange(newValue)
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    const filteredValues = filteredOptions.map((opt) => opt.value)
    onChange(value.filter((v) => !filteredValues.includes(v)))
  }

  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedOptions = normalizedOptions.filter((opt) => value.includes(opt.value))

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex min-h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-1.5 text-sm ring-offset-background cursor-pointer transition-all duration-150',
          isOpen ? 'ring-2 ring-primary-500 border-primary-500' : 'hover:border-neutral-400'
        )}
      >
        <div className="flex flex-wrap gap-1 items-center max-w-[90%]">
          {selectedOptions.length === 0 ? (
            <span className="text-neutral-400 select-none">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 px-2 py-0.5 rounded text-xs font-medium border border-primary-100 transition-all hover:bg-primary-100"
              >
                {opt.label}
                <button
                  type="button"
                  onClick={(e) => handleRemoveValue(e, opt.value)}
                  className="hover:bg-primary-200 rounded-full p-0.5 text-primary-600 hover:text-primary-800 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          size={16}
          className={cn('text-neutral-400 transition-transform shrink-0', isOpen && 'rotate-180')}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-surface shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
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
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500 px-1">
              <span>Đang hiển thị {filteredOptions.length} mục</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-primary-600 hover:text-primary-800 transition-colors"
                >
                  Chọn tất cả
                </button>
                <span className="text-neutral-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-neutral-600 hover:text-neutral-800 transition-colors"
                >
                  Bỏ chọn tất cả
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-400 select-none">
                Không tìm thấy kết quả
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value.includes(opt.value)
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleToggleOption(opt.value)}
                    className={cn(
                      'flex items-center gap-2 px-2.5 py-1.5 text-xs rounded cursor-pointer transition-colors duration-100 select-none',
                      isSelected
                        ? 'bg-primary-50/50 text-primary-900 font-medium'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-3.5 w-3.5 items-center justify-center rounded border border-neutral-300 transition-all shrink-0',
                        isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white'
                      )}
                    >
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span className="truncate">{opt.label}</span>
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
