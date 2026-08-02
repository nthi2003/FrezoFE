import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GitBranch, PencilRuler } from 'lucide-react'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { ApprovalConfigHubLayout } from '../components/ApprovalConfigHubLayout'
import {
  APPROVAL_CONFIG_TABS,
  getVisibleApprovalConfigTabs,
  resolveApprovalConfigTab,
} from '../utils/approvalRoutes'
import { ApprovalFlowConfigPage } from './ApprovalFlowConfigPage'
import { WorkflowsPage } from '@/modules/workflow/pages/WorkflowsPage'

const TAB_ICONS = {
  flows: GitBranch,
  templates: PencilRuler,
} as const

export function ApprovalConfigHubPage() {
  const [searchParams] = useSearchParams()
  const { flatMenuFeUrls } = useMenus()

  const visibleTabKeys = useMemo(
    () => getVisibleApprovalConfigTabs(flatMenuFeUrls),
    [flatMenuFeUrls],
  )

  const tab = useMemo(
    () => resolveApprovalConfigTab(searchParams.get('tab'), flatMenuFeUrls),
    [searchParams, flatMenuFeUrls],
  )

  const tabs = APPROVAL_CONFIG_TABS.map((t) => ({
    key: t.key,
    label: t.label,
    icon: TAB_ICONS[t.key],
    hint: t.hint,
  }))

  return (
    <ApprovalConfigHubLayout
      tabs={tabs}
      tab={tab}
      visibleTabKeys={visibleTabKeys}
      syncKey={flatMenuFeUrls}
      onResolveTab={(raw) => resolveApprovalConfigTab(raw, flatMenuFeUrls)}
    >
      {tab === 'flows' && <ApprovalFlowConfigPage embedded />}
      {tab === 'templates' && <WorkflowsPage embedded />}
    </ApprovalConfigHubLayout>
  )
}
