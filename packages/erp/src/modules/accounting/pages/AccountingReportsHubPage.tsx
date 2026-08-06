import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BarChart3, FileSpreadsheet, Receipt } from 'lucide-react'
import { AccountingHubLayout, useAccountingMenuUrls } from '../components/AccountingHubLayout'
import {
  ACCOUNTING_REPORTS_TABS,
  canAccessReportsTab,
  resolveReportsTab,
} from '../utils/accountingRoutes'
import { TrialBalancePage } from './TrialBalancePage'
import { FinancialStatementsPage } from './FinancialStatementsPage'
import { TaxDeclarationPage } from './TaxDeclarationPage'

const TAB_ICONS = {
  'trial-balance': BarChart3,
  financial: FileSpreadsheet,
  tax: Receipt,
} as const

export function AccountingReportsHubPage() {
  const [searchParams] = useSearchParams()
  const menuUrls = useAccountingMenuUrls()

  const visibleTabKeys = useMemo(
    () =>
      ACCOUNTING_REPORTS_TABS.filter((t) => canAccessReportsTab(t.key, menuUrls)).map((t) => t.key),
    [menuUrls],
  )

  const tab = useMemo(
    () => resolveReportsTab(searchParams.get('tab'), menuUrls),
    [searchParams, menuUrls],
  )

  const tabs = ACCOUNTING_REPORTS_TABS.map((t) => ({
    key: t.key,
    label: t.label,
    hint: t.hint,
    icon: TAB_ICONS[t.key],
  }))

  return (
    <AccountingHubLayout
      title="Báo cáo kế toán"
      description="Cân đối thử, báo cáo tài chính và tờ khai GTGT — tra cứu theo kỳ."
      tabs={tabs}
      tab={tab}
      visibleTabKeys={visibleTabKeys}
      defaultTab="trial-balance"
      syncKey={menuUrls}
      onResolveTab={(raw) => resolveReportsTab(raw, menuUrls)}
    >
      {tab === 'trial-balance' && <TrialBalancePage embedded />}
      {tab === 'financial' && <FinancialStatementsPage embedded />}
      {tab === 'tax' && <TaxDeclarationPage embedded />}
    </AccountingHubLayout>
  )
}
