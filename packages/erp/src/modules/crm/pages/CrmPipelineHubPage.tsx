import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Handshake, Mail, Target, Users } from 'lucide-react'
import { AppTooltip, Button } from '@frezo/ui'
import { FilterExportTrigger } from '@/components/shared/FilterExportDrawer'
import { CrmHubLayout, useCrmMenuUrls } from '../components/CrmHubLayout'
import { CrmPipelineExportDrawer } from '../components/CrmPipelineExportDrawer'
import { CrmSequencesDrawer } from '../components/CrmSequencesDrawer'
import { useCrmHubDrawer } from '../hooks/useCrmHubDrawer'
import {
  CRM_EXPORT_DRAWER_KEY,
  CRM_PIPELINE_TABS,
  CRM_SEQUENCES_DRAWER_KEY,
  canAccessPipelineExportDrawer,
  canAccessPipelineTab,
  canAccessSequencesDrawer,
  resolvePipelineTab,
} from '../utils/crmRoutes'
import { DealsPage } from './DealsPage'
import { LeadsPage } from './LeadsPage'
import { MeetingsPage } from './MeetingsPage'

const TAB_ICONS = {
  leads: Target,
  deals: Handshake,
  meetings: Users,
} as const

export function CrmPipelineHubPage() {
  const [searchParams] = useSearchParams()
  const menuUrls = useCrmMenuUrls()
  const sequencesDrawer = useCrmHubDrawer(CRM_SEQUENCES_DRAWER_KEY)
  const exportDrawer = useCrmHubDrawer(CRM_EXPORT_DRAWER_KEY)

  const visibleTabKeys = useMemo(
    () => CRM_PIPELINE_TABS.filter((t) => canAccessPipelineTab(t.key, menuUrls)).map((t) => t.key),
    [menuUrls],
  )

  const tab = useMemo(
    () => resolvePipelineTab(searchParams.get('tab'), menuUrls),
    [searchParams, menuUrls],
  )

  const tabs = CRM_PIPELINE_TABS.map((t) => ({
    ...t,
    icon: TAB_ICONS[t.key],
  }))

  const showSequences = sequencesDrawer.isOpen && canAccessSequencesDrawer(menuUrls)
  const showExport = exportDrawer.isOpen && canAccessPipelineExportDrawer(menuUrls)

  const headerExtra = (
    <div className="flex flex-wrap items-center gap-2">
      {canAccessSequencesDrawer(menuUrls) && (
        <AppTooltip content="Chuỗi email nurture — automation từ pipeline">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 h-9"
            onClick={sequencesDrawer.open}
          >
            <Mail size={15} />
            Email sequence
          </Button>
        </AppTooltip>
      )}
      {tab === 'deals' && canAccessPipelineExportDrawer(menuUrls) && (
        <FilterExportTrigger onClick={exportDrawer.open} />
      )}
    </div>
  )

  return (
    <>
      <CrmHubLayout
        title="Pipeline bán hàng"
        description="Leads, cơ hội bán và cuộc họp — cùng luồng chuyển đổi khách hàng."
        tabs={tabs}
        tab={tab}
        visibleTabKeys={visibleTabKeys}
        defaultTab="leads"
        syncKey={menuUrls}
        headerExtra={headerExtra}
        onResolveTab={(raw) => resolvePipelineTab(raw, menuUrls)}
      >
        {tab === 'leads' && <LeadsPage embedded />}
        {tab === 'deals' && <DealsPage embedded />}
        {tab === 'meetings' && <MeetingsPage embedded />}
      </CrmHubLayout>

      {showSequences && (
        <CrmSequencesDrawer isOpen={sequencesDrawer.isOpen} onClose={sequencesDrawer.close} />
      )}
      {showExport && (
        <CrmPipelineExportDrawer isOpen={exportDrawer.isOpen} onClose={exportDrawer.close} />
      )}
    </>
  )
}
