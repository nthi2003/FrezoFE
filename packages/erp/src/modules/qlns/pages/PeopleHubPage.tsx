import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Users, FileText, UserPlus, UserMinus, Briefcase } from 'lucide-react'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { QlnsHubLayout } from '../components/QlnsHubLayout'
import {
  PEOPLE_TABS,
  DEFAULT_PEOPLE_TAB,
  getVisiblePeopleTabs,
  resolvePeopleTab,
} from '../utils/qlnsRoutes'
import { PersonsPage } from './PersonsPage'
import { ContractPage } from '@/modules/contracts/pages/ContractPage'
import { OnboardingPage } from './OnboardingPage'
import { OffboardingPage } from './OffboardingPage'
import { RequisitionsPage } from './RequisitionsPage'

const TAB_ICONS = {
  persons: Users,
  contracts: FileText,
  onboarding: UserPlus,
  offboarding: UserMinus,
  recruitment: Briefcase,
} as const

/** Wave 2 hub — stub embeds legacy pages; recruitment sub-view in Wave 2. */
export function PeopleHubPage() {
  const [searchParams] = useSearchParams()
  const { flatMenuFeUrls } = useMenus()

  const visibleTabKeys = useMemo(
    () => getVisiblePeopleTabs(flatMenuFeUrls),
    [flatMenuFeUrls],
  )

  const tab = useMemo(
    () => resolvePeopleTab(searchParams.get('tab'), flatMenuFeUrls),
    [searchParams, flatMenuFeUrls],
  )

  const tabs = PEOPLE_TABS.map((t) => ({
    key: t.key,
    label: t.label,
    icon: TAB_ICONS[t.key],
    hint: t.hint,
  }))

  return (
    <QlnsHubLayout
      title="Hồ sơ & tổ chức"
      description="Quản lý nhân viên, hợp đồng, tiếp nhận nhân sự mới, nghỉ việc và tuyển dụng."
      tabs={tabs}
      tab={tab}
      visibleTabKeys={visibleTabKeys}
      defaultTab={DEFAULT_PEOPLE_TAB}
      syncKey={flatMenuFeUrls}
      onResolveTab={(raw) => resolvePeopleTab(raw, flatMenuFeUrls)}
    >
      {tab === 'persons' && <PersonsPage />}
      {tab === 'contracts' && <ContractPage />}
      {tab === 'onboarding' && <OnboardingPage />}
      {tab === 'offboarding' && <OffboardingPage />}
      {tab === 'recruitment' && <RequisitionsPage />}
    </QlnsHubLayout>
  )
}
