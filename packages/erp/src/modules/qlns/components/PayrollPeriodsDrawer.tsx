import { Drawer } from '@frezo/ui'
import { PayrollApprovalBar } from './PayrollApprovalBar'

interface PayrollPeriodsDrawerProps {
  isOpen: boolean
  onClose: () => void
  month: number
  year: number
}

/** Kỳ lương — progressive disclosure qua drawer (pattern FiscalPeriodsDrawer). */
export function PayrollPeriodsDrawer({ isOpen, onClose, month, year }: PayrollPeriodsDrawerProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Kỳ lương"
      description="Tạo, khóa/mở kỳ lương và duyệt qua Approval Inbox."
    >
      <PayrollApprovalBar month={month} year={year} />
    </Drawer>
  )
}
