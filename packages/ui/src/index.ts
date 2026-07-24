export { Button, buttonVariants } from './button'
export type { ButtonProps } from './button'
export { Input } from './input'
export type { InputProps } from './input'
export { Textarea } from './textarea'
export type { TextareaProps } from './textarea'
export { Label } from './label'
export { Switch } from './switch'

// ---- Skeleton primitives ----
export { Skeleton, SkeletonText, SkeletonCircle, SkeletonTable } from './skeleton'
export type { SkeletonProps } from './skeleton'

// ---- Select ----
export { Select } from './Select'
export type { Option as SelectOption } from './Select'
export { MultiSelect } from './MultiSelect'
export type { Option as MultiSelectOption } from './MultiSelect'

// ---- Dialog / Modal ----
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog'
export { AppModal } from './AppModal'
export type { AppModalProps } from './AppModal'
export { ConfirmDialog } from './ConfirmDialog'
export { Drawer } from './Drawer'
export type { DrawerProps } from './Drawer'

// ---- Table primitive ----
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table'

// ---- State primitives (chuẩn Frezo — bắt buộc dùng cho mọi màn hình có API) ----
export { EmptyState } from './EmptyState'
export type { EmptyStateProps } from './EmptyState'
export { ErrorState } from './ErrorState'
export type { ErrorStateProps } from './ErrorState'

// ---- Layout primitives ----
export { PageHeader } from './PageHeader'
export type { PageHeaderProps } from './PageHeader'
export { ObjectPageHeader } from './ObjectPageHeader'
export type {
  ObjectPageHeaderProps,
  BreadcrumbItem,
  ObjectPageKpi,
} from './ObjectPageHeader'
export { FlexibleColumnLayout } from './FlexibleColumnLayout'
export type { FlexibleColumnLayoutProps } from './FlexibleColumnLayout'

// ---- Page Guide (mỗi page nên có 1 hướng dẫn nhanh) ----
export { PageGuideButton, registerPageGuideCmsResolver } from './PageGuide'
export type {
  PageGuideButtonProps,
  PageGuideConfig,
  PageGuideCmsResolver,
  GuideSection,
  GuideStep,
  GuideShortcut,
  GuideLink,
} from './PageGuide'

// ---- Form primitives ----
export { FormField } from './FormField'
export type { FormFieldProps } from './FormField'

// ---- Rich content primitives ----
export { RichTextEditor } from './RichTextEditor'
export type { RichTextEditorProps } from './RichTextEditor'
export { ImageUploader } from './ImageUploader'
export type { ImageUploaderProps } from './ImageUploader'
export { IconPicker, IconPreview, AVAILABLE_ICONS } from './IconPicker'
export type { IconPickerProps } from './IconPicker'

// ---- Enterprise Patterns (STANDARD Phần D) ----
export { StatusBadge } from './StatusBadge'
export type { StatusBadgeProps, StatusColor, StatusConfig } from './StatusBadge'

export { StatCard } from './StatCard'
export type { StatCardProps } from './StatCard'

export { ExportButton } from './ExportButton'
export type { ExportButtonProps, ExportFormat } from './ExportButton'

export { PhoneReveal } from './PhoneReveal'
export type { PhoneRevealProps } from './PhoneReveal'

export { BulkSelectionBar } from './BulkSelectionBar'
export type { BulkSelectionBarProps } from './BulkSelectionBar'
