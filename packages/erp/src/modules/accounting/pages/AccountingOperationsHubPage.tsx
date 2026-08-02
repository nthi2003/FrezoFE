import { useMemo } from 'react'

import { useSearchParams } from 'react-router-dom'

import { BookOpen, FileText, Landmark } from 'lucide-react'

import { AccountingHubLayout, useAccountingMenuUrls } from '../components/AccountingHubLayout'

import { FiscalPeriodsDrawer } from '../components/FiscalPeriodsDrawer'

import { useFiscalPeriodsDrawer } from '../hooks/useFiscalPeriodsDrawer'

import {

  ACCOUNTING_OPS_TABS,

  canAccessOpsTab,

  canAccessPeriodsDrawer,

  resolveOpsTab,

} from '../utils/accountingRoutes'

import { JournalsPage } from './JournalsPage'

import { GeneralLedgerPage } from './GeneralLedgerPage'

import { BankReconciliationPage } from './BankReconciliationPage'



const TAB_ICONS = {

  journals: FileText,

  ledger: BookOpen,

  bank: Landmark,

} as const



export function AccountingOperationsHubPage() {

  const [searchParams] = useSearchParams()

  const menuUrls = useAccountingMenuUrls()

  const { isOpen: periodsOpen, open: openPeriods, close: closePeriods } = useFiscalPeriodsDrawer()

  const showPeriodsDrawer = periodsOpen && canAccessPeriodsDrawer(menuUrls)



  const visibleTabKeys = useMemo(

    () => ACCOUNTING_OPS_TABS.filter((t) => canAccessOpsTab(t.key, menuUrls)).map((t) => t.key),

    [menuUrls],

  )



  const tab = useMemo(

    () => resolveOpsTab(searchParams.get('tab'), menuUrls),

    [searchParams, menuUrls],

  )



  const tabs = ACCOUNTING_OPS_TABS.map((t) => ({

    ...t,

    icon: TAB_ICONS[t.key],

  }))



  const openPeriodsIfAllowed = canAccessPeriodsDrawer(menuUrls) ? openPeriods : undefined



  return (

    <>

      <AccountingHubLayout

        title="Sổ & chứng từ"

        description="Chứng từ ghi sổ, sổ cái chi tiết và đối chiếu ngân hàng — tại một nơi."

        tabs={tabs}

        tab={tab}

        visibleTabKeys={visibleTabKeys}

        defaultTab="journals"

        syncKey={menuUrls}

        onResolveTab={(raw) => resolveOpsTab(raw, menuUrls)}

      >

        {tab === 'journals' && (

          <JournalsPage embedded onOpenPeriods={openPeriodsIfAllowed} />

        )}

        {tab === 'ledger' && <GeneralLedgerPage embedded />}

        {tab === 'bank' && <BankReconciliationPage embedded />}

      </AccountingHubLayout>



      {showPeriodsDrawer && (

        <FiscalPeriodsDrawer isOpen={periodsOpen} onClose={closePeriods} />

      )}

    </>

  )

}


