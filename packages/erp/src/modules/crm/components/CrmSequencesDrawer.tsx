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
          Chuỗi email tự động
        </span>
      }
      description="Chuỗi email chăm sóc — thêm khách tiềm năng vào chuỗi khi cấu hình email đã bật."
      size="xl"
    >
      <EmailSequencesPage embedded />
    </Drawer>
  )
}
