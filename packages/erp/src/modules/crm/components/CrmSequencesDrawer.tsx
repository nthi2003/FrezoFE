import { Mail } from 'lucide-react'
import { Drawer } from '@frezo/ui'
import { EmailSequencesPage } from '../pages/EmailSequencesPage'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export function CrmSequencesDrawer({ isOpen, onClose }: Props) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Mail size={16} className="text-primary-600" />
          Email sequence
        </span>
      }
      description="Chuỗi nurture — đăng ký lead khi cấu hình email đã kích hoạt."
      size="xl"
    >
      <EmailSequencesPage embedded />
    </Drawer>
  )
}
