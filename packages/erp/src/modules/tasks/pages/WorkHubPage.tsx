import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  LayoutGrid,
  ListTodo,
  User,
  Tag as TagIcon,
  FolderTree,
} from 'lucide-react'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { WORK_TABS, getVisibleWorkTabs, resolveWorkTab } from '../utils/taskRoutes'
import { WorkHubLayout } from '../components/WorkHubLayout'
import { TicketsPage } from './TicketsPage'
import { TasksPage } from './TasksPage'
import { TagsPage } from './TagsPage'
import { TicketCategoriesPage } from './TicketCategoriesPage'

const TAB_ICONS = {
  board: LayoutGrid,
  list: ListTodo,
  mine: User,
  tags: TagIcon,
  categories: FolderTree,
} as const

export function WorkHubPage() {
  const [searchParams] = useSearchParams()
  const { flatMenuFeUrls } = useMenus()

  const visibleTabKeys = useMemo(
    () => getVisibleWorkTabs(flatMenuFeUrls),
    [flatMenuFeUrls],
  )

  const tab = useMemo(
    () => resolveWorkTab(searchParams.get('tab'), flatMenuFeUrls),
    [searchParams, flatMenuFeUrls],
  )

  const tabs = useMemo(
    () =>
      WORK_TABS.map((t) => ({
        key: t.key,
        label: t.label,
        icon: TAB_ICONS[t.key],
        hint: t.hint,
      })),
    [],
  )

  return (
    <WorkHubLayout
      tabs={tabs}
      tab={tab}
      visibleTabKeys={visibleTabKeys}
      syncKey={flatMenuFeUrls}
      onResolveTab={(raw) => resolveWorkTab(raw, flatMenuFeUrls)}
    >
      {tab === 'board' && <TicketsPage embedded />}
      {tab === 'mine' && <TicketsPage embedded initialMineOnly />}
      {tab === 'list' && <TasksPage embedded />}
      {tab === 'tags' && <TagsPage embedded />}
      {tab === 'categories' && <TicketCategoriesPage embedded />}
    </WorkHubLayout>
  )
}
