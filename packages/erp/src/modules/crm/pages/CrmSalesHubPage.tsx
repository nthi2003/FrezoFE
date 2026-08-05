import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileText, Receipt, Percent } from 'lucide-react'
import { CrmHubLayout, useCrmMenuUrls } from '../components/CrmHubLayout'
import {
  CRM_SALES_TABS,
  canAccessSalesTab,
  resolveSalesTab,
} from '../utils/crmRoutes'
import { InvoicesPage } from './InvoicesPage'
import { QuotesPage } from './QuotesPage'
import { CommissionsPage } from './CommissionsPage'

const TAB_ICONS = {
  quotes: FileText,
  invoices: Receipt,
  commissions: Percent,
} as const

export function CrmSalesHubPage() {
  const [searchParams] = useSearchParams()
  const menuUrls = useCrmMenuUrls()

  const visibleTabKeys = useMemo(
    () => CRM_SALES_TABS.filter((t) => canAccessSalesTab(t.key, menuUrls)).map((t) => t.key),
    [menuUrls],
  )

  const tab = useMemo(
    () => resolveSalesTab(searchParams.get('tab'), menuUrls),
    [searchParams, menuUrls],
  )

  const tabs = CRM_SALES_TABS.map((t) => ({
    ...t,
    icon: TAB_ICONS[t.key],
  }))

  return (
    <CrmHubLayout
      title="Đơn bán & thu"
      description="Báo giá, hoá đơn và hoa hồng sale — theo dõi doanh thu từ CRM."
      tabs={tabs}
      tab={tab}
      visibleTabKeys={visibleTabKeys}
      defaultTab="quotes"
      syncKey={menuUrls}
      onResolveTab={(raw) => resolveSalesTab(raw, menuUrls)}
    >
      {tab === 'quotes' && <QuotesPage embedded />}
      {tab === 'invoices' && <InvoicesPage embedded />}
      {tab === 'commissions' && <CommissionsPage embedded />}
    </CrmHubLayout>
  )
}
