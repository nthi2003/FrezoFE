import * as React from 'react'
import {
  // Common enterprise icons — chọn lọc ~120 icon dùng thường xuyên nhất.
  // Nếu cần thêm: import trực tiếp từ lucide-react và thêm vào ICON_MAP.
  Home, LayoutDashboard, Menu, MoreHorizontal, Search, Bell, Settings, Cog, HelpCircle,
  User, Users, UserCheck, UserCog, UserPlus, UserMinus, UserX,
  Shield, ShieldCheck, Lock, Unlock, Key, Eye, EyeOff, Fingerprint,
  Folder, FolderOpen, FolderTree, File, FileText, Files, FileSpreadsheet,
  FilePlus, FileCheck, FileWarning, FileClock, FileEdit, FileSearch,
  Book, BookOpen, Newspaper, Bookmark, Star, Heart, Flag, Award, Trophy,
  Building, Building2, Store, Warehouse, Factory, Landmark, Hotel,
  Briefcase, Package, PackageOpen, Boxes, Container,
  ShoppingCart, ShoppingBag, CreditCard, DollarSign, Coins, Wallet, Receipt, Banknote,
  TrendingUp, TrendingDown, BarChart, BarChart2, BarChart3, LineChart, PieChart, Activity,
  Calendar, CalendarDays, CalendarCheck, CalendarClock, CalendarRange, Clock, Timer, AlarmClock,
  Mail, MailOpen, Send, Inbox, MessageSquare, MessagesSquare, Phone, PhoneCall, Video,
  Bot, Cpu, Database, Server, HardDrive, Cloud, UploadCloud, DownloadCloud,
  Globe, Wifi, Link, Link2, ExternalLink, Share2, Rss,
  Truck, MapPin, Map, Navigation, Route, Compass,
  Image as ImageIcon, Camera, Film, Music, Palette, Layers, LayoutGrid, LayoutList,
  Plus, Minus, X, Check, ChevronRight, ArrowRight, ArrowUp, ArrowDown,
  Edit, Trash2, Copy, Download, Upload, Save, RefreshCw, RotateCw,
  Filter, SortAsc, SortDesc, Tag, Tags, Hash, AtSign,
  CheckCircle2, AlertCircle, AlertTriangle, Info, XCircle, Ban,
  Zap, Rocket, Sparkles, Lightbulb, Target, Focus, Puzzle,
  GitBranch, GitFork, GitMerge, GitPullRequest, Code, Code2, Terminal, Bug,
  Sun, Moon, Cloudy, Snowflake, Umbrella, Wind, Thermometer,
  Facebook, Twitter, Instagram, Github, Linkedin, Youtube,
  Truck as DeliveryIcon, ClipboardList, ClipboardCheck, ListChecks, CheckSquare, Square,
} from 'lucide-react'
import { cn } from '@frezo/utils'
import { Input } from './input'

/**
 * IconPicker — chọn Lucide icon bằng tên, có preview.
 *
 * Dùng cho các field cần lưu tên icon (VD: menu.icon, category.icon).
 * `value` là tên icon dạng PascalCase (VD: "Users", "LayoutDashboard") —
 * cùng convention với lucide-react export name.
 *
 * Curated list ~120 icon phổ biến enterprise (không import toàn bộ để giữ bundle nhỏ).
 * Extendable: thêm icon vào `ICON_MAP` trong file này.
 */

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Home, LayoutDashboard, Menu, MoreHorizontal, Search, Bell, Settings, Cog, HelpCircle,
  User, Users, UserCheck, UserCog, UserPlus, UserMinus, UserX,
  Shield, ShieldCheck, Lock, Unlock, Key, Eye, EyeOff, Fingerprint,
  Folder, FolderOpen, FolderTree, File, FileText, Files, FileSpreadsheet,
  FilePlus, FileCheck, FileWarning, FileClock, FileEdit, FileSearch,
  Book, BookOpen, Newspaper, Bookmark, Star, Heart, Flag, Award, Trophy,
  Building, Building2, Store, Warehouse, Factory, Landmark, Hotel,
  Briefcase, Package, PackageOpen, Boxes, Container,
  ShoppingCart, ShoppingBag, CreditCard, DollarSign, Coins, Wallet, Receipt, Banknote,
  TrendingUp, TrendingDown, BarChart, BarChart2, BarChart3, LineChart, PieChart, Activity,
  Calendar, CalendarDays, CalendarCheck, CalendarClock, CalendarRange, Clock, Timer, AlarmClock,
  Mail, MailOpen, Send, Inbox, MessageSquare, MessagesSquare, Phone, PhoneCall, Video,
  Bot, Cpu, Database, Server, HardDrive, Cloud, UploadCloud, DownloadCloud,
  Globe, Wifi, Link, Link2, ExternalLink, Share2, Rss,
  Truck, MapPin, Map, Navigation, Route, Compass,
  Image: ImageIcon, Camera, Film, Music, Palette, Layers, LayoutGrid, LayoutList,
  Plus, Minus, X, Check, ChevronRight, ArrowRight, ArrowUp, ArrowDown,
  Edit, Trash2, Copy, Download, Upload, Save, RefreshCw, RotateCw,
  Filter, SortAsc, SortDesc, Tag, Tags, Hash, AtSign,
  CheckCircle2, AlertCircle, AlertTriangle, Info, XCircle, Ban,
  Zap, Rocket, Sparkles, Lightbulb, Target, Focus, Puzzle,
  GitBranch, GitFork, GitMerge, GitPullRequest, Code, Code2, Terminal, Bug,
  Sun, Moon, Cloudy, Snowflake, Umbrella, Wind, Thermometer,
  Facebook, Twitter, Instagram, Github, Linkedin, Youtube,
  ClipboardList, ClipboardCheck, ListChecks, CheckSquare, Square,
}

export const AVAILABLE_ICONS = Object.keys(ICON_MAP).sort()

/**
 * Render 1 icon theo tên. Nếu không match, render fallback `?` neutral.
 * Case-insensitive matching để chấp nhận cả "users" và "Users".
 */
export function IconPreview({
  name,
  size = 16,
  className,
}: {
  name?: string | null
  size?: number
  className?: string
}) {
  if (!name) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center text-neutral-300',
          className,
        )}
        style={{ width: size, height: size, fontSize: size * 0.7 }}
      >
        ?
      </span>
    )
  }
  // Try exact match, then case-insensitive.
  let Cmp = ICON_MAP[name]
  if (!Cmp) {
    const lower = name.toLowerCase()
    const key = AVAILABLE_ICONS.find((k) => k.toLowerCase() === lower)
    if (key) Cmp = ICON_MAP[key]
  }
  if (!Cmp) {
    return (
      <span
        className={cn('inline-flex items-center justify-center text-red-400', className)}
        style={{ width: size, height: size, fontSize: size * 0.7 }}
        title={`Icon "${name}" không tồn tại trong curated list`}
      >
        !
      </span>
    )
  }
  return <Cmp size={size} className={className} />
}

export interface IconPickerProps {
  value?: string
  onChange?: (name: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function IconPicker({
  value,
  onChange,
  placeholder = 'Chọn icon (VD: Users, Settings)…',
  disabled,
  className,
}: IconPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return AVAILABLE_ICONS
    return AVAILABLE_ICONS.filter((k) => k.toLowerCase().includes(q))
  }, [query])

  const pick = (name: string) => {
    onChange?.(name)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
          <IconPreview name={value} size={16} />
        </span>
        <Input
          value={value || ''}
          onChange={(e) => {
            onChange?.(e.target.value)
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-8 pr-8 h-9"
        />
        {value && !disabled && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
            onClick={() => onChange?.('')}
            aria-label="Xoá icon"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-w-md rounded-lg border border-neutral-200 bg-white shadow-lg">
          <div className="border-b border-neutral-100 px-3 py-2 text-xs text-neutral-500 flex items-center justify-between">
            <span>{filtered.length} icon</span>
            <span className="text-neutral-400">Curated cho enterprise</span>
          </div>
          <div
            className="grid grid-cols-8 gap-1 p-2 max-h-64 overflow-y-auto"
            role="listbox"
          >
            {filtered.length === 0 ? (
              <div className="col-span-8 py-6 text-center text-sm text-neutral-500">
                Không tìm thấy icon "{query}"
              </div>
            ) : (
              filtered.map((name) => {
                const active = value === name
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => pick(name)}
                    title={name}
                    aria-label={name}
                    aria-selected={active}
                    role="option"
                    className={cn(
                      'flex items-center justify-center h-9 rounded-md text-neutral-600 border border-transparent',
                      'hover:bg-primary-50 hover:text-primary-700 hover:border-primary-100 transition-colors',
                      active && 'bg-primary-100 text-primary-700 border-primary-200',
                    )}
                  >
                    <IconPreview name={name} size={16} />
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
