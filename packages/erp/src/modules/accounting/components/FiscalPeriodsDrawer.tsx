import { Drawer } from '@frezo/ui'
import { FiscalPeriodsPage } from '../pages/FiscalPeriodsPage'

interface FiscalPeriodsDrawerProps {
  isOpen: boolean
  onClose: () => void
}

/** Kỳ kế toán — progressive disclosure qua drawer, không tách route riêng. */
export function FiscalPeriodsDrawer({ isOpen, onClose }: FiscalPeriodsDrawerProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Kỳ kế toán"
      description="Khóa/mở kỳ theo năm tài chính — chặn ghi sổ mới khi kỳ đã khóa."
    >
      <FiscalPeriodsPage embedded inDrawer />
    </Drawer>
  )
}
