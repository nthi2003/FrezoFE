import { useMemo, useState } from 'react'
import { Users, UserPlus, UserMinus, Briefcase, Cake, FileWarning } from 'lucide-react'
import { PageHeader, Input, Label } from '@frezo/ui'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { usePersonStatistics } from '../hooks/useHrSetup'
import { pageRootClass } from '../utils/pageEmbed'

type StatTab = 'expiring' | 'probation' | 'official' | 'resigned' | 'birthdays'

const TAB_DEFS: { key: StatTab; label: string; icon: typeof Users }[] = [
  { key: 'expiring', label: 'HĐ chính thức đến hạn', icon: FileWarning },
  { key: 'probation', label: 'Thử việc', icon: Briefcase },
  { key: 'official', label: 'Chính thức', icon: Users },
  { key: 'resigned', label: 'Nghỉ việc', icon: UserMinus },
  { key: 'birthdays', label: 'Sinh nhật', icon: Cake },
]

type Props = { embedded?: boolean }

function KpiCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <div className="rounded-xl border bg-white p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-xs text-neutral-500">{label}</div>
      </div>
    </div>
  )
}

export function PersonStatsPage({ embedded }: Props) {
  const now = new Date()
  const [from, setFrom] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)
  const [to, setTo] = useState(now.toISOString().slice(0, 10))
  const [tab, setTab] = useState<StatTab>('expiring')

  const { data: stats, isLoading } = usePersonStatistics({ from, to })

  const tabData = useMemo(() => {
    if (!stats) return []
    const map: Record<StatTab, any[]> = {
      expiring: stats.contractExpiring ?? [],
      probation: stats.probation ?? [],
      official: stats.officialList ?? [],
      resigned: stats.resignedList ?? [],
      birthdays: stats.birthdays ?? [],
    }
    return map[tab] ?? []
  }, [stats, tab])

  const columns: AppTableColumn<any>[] = [
    { key: 'code', title: 'Mã NV', dataIndex: 'code' },
    { key: 'name', title: 'Họ tên', dataIndex: 'name' },
    { key: 'email', title: 'Email', dataIndex: 'email' },
    { key: 'jobTitle', title: 'Chức danh', dataIndex: 'jobTitle' },
    { key: 'departmentName', title: 'Phòng ban', dataIndex: 'departmentName' },
  ]

  const rootClass = pageRootClass(embedded)

  return (
    <div className={rootClass}>
      {!embedded && (
        <PageHeader
          title="Thống kê nhân sự"
          description="Tổng quan biến động nhân sự theo kỳ — hợp đồng, thử việc, nghỉ việc, sinh nhật."
        />
      )}

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs">Từ ngày</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Đến ngày</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Tổng NS" value={stats?.total ?? 0} icon={Users} />
        <KpiCard label="Nam" value={stats?.male ?? 0} icon={Users} />
        <KpiCard label="Nữ" value={stats?.female ?? 0} icon={Users} />
        <KpiCard label="Nhân sự mới" value={stats?.newHires ?? 0} icon={UserPlus} />
        <KpiCard label="Chính thức" value={stats?.official ?? 0} icon={Briefcase} />
        <KpiCard label="Nghỉ việc" value={stats?.resigned ?? 0} icon={UserMinus} />
      </div>

      <div className="flex flex-wrap gap-1 border-b border-neutral-200">
        {TAB_DEFS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === key ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <AppTable data={tabData} columns={columns} isLoading={isLoading} showSearch={false} />
    </div>
  )
}
