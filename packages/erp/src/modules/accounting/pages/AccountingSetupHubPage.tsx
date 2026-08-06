import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ListTree, Settings } from 'lucide-react'
import { AccountingHubLayout, useAccountingMenuUrls } from '../components/AccountingHubLayout'
import { FiscalPeriodsDrawer } from '../components/FiscalPeriodsDrawer'
import { useFiscalPeriodsDrawer } from '../hooks/useFiscalPeriodsDrawer'
import {
  ACCOUNTING_SETUP_HUB_TABS,
  canAccessPeriodsDrawer,
  canAccessSetupTab,
  resolveSetupTab,
} from '../utils/accountingRoutes'
import { AccountingSettingsPage } from './AccountingSettingsPage'
import { AccountsPage } from './AccountsPage'

const TAB_ICONS = {
  settings: Settings,
  accounts: ListTree,
} as const

export function AccountingSetupHubPage() {
  const [searchParams] = useSearchParams()
  const menuUrls = useAccountingMenuUrls()
  const { isOpen: periodsOpen, open: openPeriods, close: closePeriods } = useFiscalPeriodsDrawer()
  const showPeriodsDrawer = periodsOpen && canAccessPeriodsDrawer(menuUrls)

  const visibleTabKeys = useMemo(
    () => ACCOUNTING_SETUP_HUB_TABS.filter((t) => canAccessSetupTab(t.key, menuUrls)).map((t) => t.key),
    [menuUrls],
  )

  const tab = useMemo(
    () => resolveSetupTab(searchParams.get('tab'), menuUrls),
    [searchParams, menuUrls],
  )

  const tabs = ACCOUNTING_SETUP_HUB_TABS.map((t) => ({
    ...t,
    icon: TAB_ICONS[t.key],
  }))

  return (
    <>
      <AccountingHubLayout
        title="Thiết lập kế toán"
        description="Cấu hình chuẩn kế toán và hệ thống tài khoản — kỳ kế toán mở từ nút bên trong."
        tabs={tabs}
        tab={tab}
        visibleTabKeys={visibleTabKeys}
        defaultTab="settings"
        syncKey={menuUrls}
        onResolveTab={(raw) => resolveSetupTab(raw, menuUrls)}
      >
        {tab === 'settings' && (
          <AccountingSettingsPage
            embedded
            onOpenPeriods={canAccessPeriodsDrawer(menuUrls) ? openPeriods : undefined}
          />
        )}
        {tab === 'accounts' && <AccountsPage embedded />}
      </AccountingHubLayout>

      {showPeriodsDrawer && (
        <FiscalPeriodsDrawer isOpen={periodsOpen} onClose={closePeriods} />
      )}
    </>
  )
}
