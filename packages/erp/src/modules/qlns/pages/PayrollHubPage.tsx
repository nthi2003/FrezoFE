import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calculator, DollarSign } from 'lucide-react'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { QlnsHubLayout } from '../components/QlnsHubLayout'
import { PayrollPeriodsDrawer } from '../components/PayrollPeriodsDrawer'
import { usePayrollPeriodsDrawer } from '../hooks/usePayrollPeriodsDrawer'
import {
  PAYROLL_TABS,
  DEFAULT_PAYROLL_TAB,
  getVisiblePayrollTabs,
  resolvePayrollTab,
  canAccessPayrollPeriodsDrawer,
} from '../utils/qlnsRoutes'
import { PayrollsPage } from './PayrollsPage'
import { SalaryBandsPage } from './SalaryBandsPage'

const TAB_ICONS = {
  payrolls: Calculator,
  bands: DollarSign,
} as const

const now = new Date()

export function PayrollHubPage() {
  const [searchParams] = useSearchParams()
  const { flatMenuFeUrls } = useMenus()
  const { isOpen: periodsOpen, open: openPeriods, close: closePeriods } = usePayrollPeriodsDrawer()
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1)
  const [periodYear, setPeriodYear] = useState(now.getFullYear())

  const showPeriodsDrawer = periodsOpen && canAccessPayrollPeriodsDrawer(flatMenuFeUrls)
  const openPeriodsIfAllowed = canAccessPayrollPeriodsDrawer(flatMenuFeUrls) ? openPeriods : undefined

  const visibleTabKeys = useMemo(
    () => getVisiblePayrollTabs(flatMenuFeUrls),
    [flatMenuFeUrls],
  )

  const tab = useMemo(
    () => resolvePayrollTab(searchParams.get('tab'), flatMenuFeUrls),
    [searchParams, flatMenuFeUrls],
  )

  const tabs = PAYROLL_TABS.map((t) => ({
    key: t.key,
    label: t.label,
    icon: TAB_ICONS[t.key],
    hint: t.hint,
  }))

  return (
    <>
      <QlnsHubLayout
        title="Lương & đãi ngộ"
        description="Tính lương theo kỳ, quản lý bậc lương và chi trả — tại một nơi."
        tabs={tabs}
        tab={tab}
        visibleTabKeys={visibleTabKeys}
        defaultTab={DEFAULT_PAYROLL_TAB}
        syncKey={flatMenuFeUrls}
        onResolveTab={(raw) => resolvePayrollTab(raw, flatMenuFeUrls)}
      >
        {tab === 'payrolls' && (
          <PayrollsPage
            embedded
            onOpenPeriods={openPeriodsIfAllowed}
            onPeriodChange={(m, y) => {
              setPeriodMonth(m)
              setPeriodYear(y)
            }}
          />
        )}
        {tab === 'bands' && <SalaryBandsPage embedded />}
      </QlnsHubLayout>

      {showPeriodsDrawer && (
        <PayrollPeriodsDrawer
          isOpen={periodsOpen}
          onClose={closePeriods}
          month={periodMonth}
          year={periodYear}
        />
      )}
    </>
  )
}
