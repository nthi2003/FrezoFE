// ============================================================
// FREZO ERP — Router Configuration
// Protected routes, lazy loading per module
// ============================================================

import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/MainLayout'
import { useAuthStore } from '@/stores/authStore'
import { menuApi } from '@/modules/menus/services/menuApi'

// ---- Lazy load pages per module ----
const LoginPage       = lazy(() => import('@/modules/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage   = lazy(() => import('@/modules/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))

// Modules
const UsersPage       = lazy(() => import('@/modules/users/pages/UsersPage').then(m => ({ default: m.UsersPage })))
const RolesPage       = lazy(() => import('@/modules/roles/pages/RolesPage').then(m => ({ default: m.RolesPage })))
const MenusPage       = lazy(() => import('@/modules/menus/pages/MenusPage').then(m => ({ default: m.MenusPage })))
const OrganizationsPage = lazy(() => import('@/modules/qtht/pages/OrganizationsPage').then(m => ({ default: m.OrganizationsPage })))
const DepartmentsPage   = lazy(() => import('@/modules/qtht/pages/DepartmentsPage').then(m => ({ default: m.DepartmentsPage })))
const PermissionsPage   = lazy(() => import('@/modules/qtht/pages/PermissionsPage').then(m => ({ default: m.PermissionsPage })))
const SecurityPage      = lazy(() => import('@/modules/qtht/pages/SecurityPage').then(m => ({ default: m.SecurityPage })))
const SettingsPage      = lazy(() => import('@/modules/qtht/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const ApiLogsPage       = lazy(() => import('@/modules/qtht/pages/ApiLogsPage').then(m => ({ default: m.ApiLogsPage })))
const WebsiteManagementPage = lazy(() => import('@/modules/qtht/pages/WebsiteManagementPage').then(m => ({ default: m.WebsiteManagementPage })))
const NewsPage = lazy(() => import('@/modules/qtht/pages/NewsPage').then(m => ({ default: m.NewsPage })))
const NewsCreatePage = lazy(() => import('@/modules/qtht/pages/NewsCreatePage').then(m => ({ default: m.NewsCreatePage })))

// Assets (QLTS)
const AssetsPage = lazy(() => import('@/modules/assets/pages/AssetsPage').then(m => ({ default: m.AssetsPage })))
const DepreciationPostPage = lazy(() => import('@/modules/assets/pages/DepreciationPostPage').then(m => ({ default: m.DepreciationPostPage })))

// Workflow Engine — quy trình duyệt chung cho mọi module
const WorkflowsPage = lazy(() => import('@/modules/workflow/pages/WorkflowsPage').then(m => ({ default: m.WorkflowsPage })))
const WorkflowTemplateGalleryPage = lazy(() => import('@/modules/workflow/pages/WorkflowTemplateGalleryPage').then(m => ({ default: m.WorkflowTemplateGalleryPage })))
const WorkflowDesignerPage = lazy(() => import('@/modules/workflow/pages/WorkflowDesignerPage').then(m => ({ default: m.WorkflowDesignerPage })))

// Events
const EventsAdminPage = lazy(() => import('@/modules/events/pages/EventsAdminPage').then(m => ({ default: m.EventsAdminPage })))
const EventDetailAdminPage = lazy(() => import('@/modules/events/pages/EventsAdminPage').then(m => ({ default: m.EventDetailAdminPage })))
const EventFormPage = lazy(() => import('@/modules/events/pages/EventsAdminPage').then(m => ({ default: m.EventFormPage })))

// Contracts
const ContractPage    = lazy(() => import('@/modules/contracts/pages/ContractPage').then(m => ({ default: m.ContractPage })))
const ContractCreatePage = lazy(() => import('@/modules/contracts/pages/ContractCreatePage').then(m => ({ default: m.ContractCreatePage })))
const ContractDetailPage = lazy(() => import('@/modules/contracts/pages/ContractDetailPage').then(m => ({ default: m.ContractDetailPage })))

// QLNS
const PersonsPage     = lazy(() => import('@/modules/qlns/pages/PersonsPage').then(m => ({ default: m.PersonsPage })))
const PayrollsPage    = lazy(() => import('@/modules/qlns/pages/PayrollsPage').then(m => ({ default: m.PayrollsPage })))
const SalaryBandsPage = lazy(() => import('@/modules/qlns/pages/SalaryBandsPage').then(m => ({ default: m.SalaryBandsPage })))
const RequisitionsPage      = lazy(() => import('@/modules/qlns/pages/RequisitionsPage').then(m => ({ default: m.RequisitionsPage })))
const RecruitmentBoardPage  = lazy(() => import('@/modules/qlns/pages/RecruitmentBoardPage').then(m => ({ default: m.RecruitmentBoardPage })))
const OkrsPage                  = lazy(() => import('@/modules/qlns/pages/OkrsPage').then(m => ({ default: m.OkrsPage })))
const PerformanceReviewsPage    = lazy(() => import('@/modules/qlns/pages/PerformanceReviewsPage').then(m => ({ default: m.PerformanceReviewsPage })))
const OnboardingPage            = lazy(() => import('@/modules/qlns/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const ContractSignPage          = lazy(() => import('@/modules/contracts/pages/ContractSignPage').then(m => ({ default: m.ContractSignPage })))

// Customers
const CustomersPage   = lazy(() => import('@/modules/customers/pages/CustomersPage').then(m => ({ default: m.CustomersPage })))
const Customer360Page = lazy(() => import('@/modules/customers/pages/Customer360Page').then(m => ({ default: m.Customer360Page })))

// Suppliers (NCC)
const NccPage         = lazy(() => import('@/modules/suppliers/pages/NccPage').then(m => ({ default: m.NccPage })))

// Products
const ProductsPage    = lazy(() => import('@/modules/products/pages/ProductsPage').then(m => ({ default: m.ProductsPage })))
const ProductCategoriesPage = lazy(() => import('@/modules/products/pages/ProductCategoriesPage').then(m => ({ default: m.ProductCategoriesPage })))

// Tasks
const TasksPage       = lazy(() => import('@/modules/tasks/pages/TasksPage').then(m => ({ default: m.TasksPage })))
const TicketsPage     = lazy(() => import('@/modules/tasks/pages/TicketsPage').then(m => ({ default: m.TicketsPage })))
const TagsPage        = lazy(() => import('@/modules/tasks/pages/TagsPage').then(m => ({ default: m.TagsPage })))
const LeavesPage      = lazy(() => import('@/modules/qlns/pages/LeavesPage').then(m => ({ default: m.LeavesPage })))
const AttendancePage  = lazy(() => import('@/modules/qlns/pages/AttendancePage').then(m => ({ default: m.AttendancePage })))

// Articles
const ArticlesPage       = lazy(() => import('@/modules/articles/pages/ArticlesPage').then(m => ({ default: m.ArticlesPage })))
const ArticleEditorPage  = lazy(() => import('@/modules/articles/pages/ArticleEditorPage').then(m => ({ default: m.ArticleEditorPage })))

// Category Management
const CategoriesPage  = lazy(() => import('@/modules/qtht/pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })))

// Email
const EmailConfigPage   = lazy(() => import('@/modules/email/pages/EmailConfigPage').then(m => ({ default: m.EmailConfigPage })))
const EmailTemplatePage = lazy(() => import('@/modules/email/pages/EmailTemplatePage').then(m => ({ default: m.EmailTemplatePage })))
const EmailGroupsPage   = lazy(() => import('@/modules/email/pages/EmailGroupsPage').then(m => ({ default: m.EmailGroupsPage })))
const EmailComposePage  = lazy(() => import('@/modules/email/pages/EmailComposePage').then(m => ({ default: m.EmailComposePage })))
const EmailInboxPage    = lazy(() => import('@/modules/email/pages/EmailInboxPage').then(m => ({ default: m.EmailInboxPage })))

// Profile
const ProfilePage     = lazy(() => import('@/modules/profile/pages/ProfilePage').then(m => ({ default: m.ProfilePage })))

// Notifications
const NotificationsPage = lazy(() => import('@/modules/common/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })))

// Docs Hub
const DocsHubPage = lazy(() => import('@/modules/docs/pages/DocsHubPage').then(m => ({ default: m.DocsHubPage })))
const DocsViewerPage = lazy(() => import('@/modules/docs/pages/DocsViewerPage').then(m => ({ default: m.DocsViewerPage })))

// Approval (FZ-003)
const ApprovalInboxPage = lazy(() => import('@/modules/approval/pages/ApprovalInboxPage').then(m => ({ default: m.ApprovalInboxPage })))
const ApprovalFlowConfigPage = lazy(() => import('@/modules/approval/pages/ApprovalFlowConfigPage').then(m => ({ default: m.ApprovalFlowConfigPage })))

// Warehouse (FZ-010)
const ReorderRulesPage = lazy(() => import('@/modules/warehouse/pages/ReorderRulesPage').then(m => ({ default: m.ReorderRulesPage })))
const StockAlertsPage = lazy(() => import('@/modules/warehouse/pages/StockAlertsPage').then(m => ({ default: m.StockAlertsPage })))
const StockTakePage = lazy(() => import('@/modules/warehouse/pages/StockTakePage').then(m => ({ default: m.StockTakePage })))
const PurchaseRequestsPage = lazy(() => import('@/modules/warehouse/pages/PurchaseRequestsPage').then(m => ({ default: m.PurchaseRequestsPage })))
const PurchaseRequestDetailPage = lazy(() => import('@/modules/warehouse/pages/PurchaseRequestDetailPage').then(m => ({ default: m.PurchaseRequestDetailPage })))
const PurchaseOrdersPage = lazy(() => import('@/modules/warehouse/pages/PurchaseOrdersPage').then(m => ({ default: m.PurchaseOrdersPage })))
const PurchaseOrderDetailPage = lazy(() => import('@/modules/warehouse/pages/PurchaseOrderDetailPage').then(m => ({ default: m.PurchaseOrderDetailPage })))

// Accounting
const AccountsPage            = lazy(() => import('@/modules/accounting/pages/AccountsPage').then(m => ({ default: m.AccountsPage })))
const JournalsPage            = lazy(() => import('@/modules/accounting/pages/JournalsPage').then(m => ({ default: m.JournalsPage })))
const GeneralLedgerPage       = lazy(() => import('@/modules/accounting/pages/GeneralLedgerPage').then(m => ({ default: m.GeneralLedgerPage })))
const TrialBalancePage        = lazy(() => import('@/modules/accounting/pages/TrialBalancePage').then(m => ({ default: m.TrialBalancePage })))
const FinancialStatementsPage = lazy(() => import('@/modules/accounting/pages/FinancialStatementsPage').then(m => ({ default: m.FinancialStatementsPage })))
const AccountingSettingsPage  = lazy(() => import('@/modules/accounting/pages/AccountingSettingsPage').then(m => ({ default: m.AccountingSettingsPage })))
const FiscalPeriodsPage       = lazy(() => import('@/modules/accounting/pages/FiscalPeriodsPage').then(m => ({ default: m.FiscalPeriodsPage })))
const BankReconciliationPage  = lazy(() => import('@/modules/accounting/pages/BankReconciliationPage').then(m => ({ default: m.BankReconciliationPage })))
const BankStatementImportPage = lazy(() => import('@/modules/accounting/pages/BankStatementImportPage').then(m => ({ default: m.BankStatementImportPage })))

// CRM
const LeadsPage     = lazy(() => import('@/modules/crm/pages/LeadsPage').then(m => ({ default: m.LeadsPage })))
const DealsPage     = lazy(() => import('@/modules/crm/pages/DealsPage').then(m => ({ default: m.DealsPage })))
const QuotesPage    = lazy(() => import('@/modules/crm/pages/QuotesPage').then(m => ({ default: m.QuotesPage })))
const InvoicesPage  = lazy(() => import('@/modules/crm/pages/InvoicesPage').then(m => ({ default: m.InvoicesPage })))
const MeetingsPage  = lazy(() => import('@/modules/crm/pages/MeetingsPage').then(m => ({ default: m.MeetingsPage })))
const EmailSequencesPage = lazy(() => import('@/modules/crm/pages/EmailSequencesPage').then(m => ({ default: m.EmailSequencesPage })))

// FB Automation
const FbDashboardPage     = lazy(() => import('@/modules/fbautomation/pages/FbDashboardPage').then(m => ({ default: m.FbDashboardPage })))
const FbAccountsPage      = lazy(() => import('@/modules/fbautomation/pages/FbAccountsPage').then(m => ({ default: m.FbAccountsPage })))
const FbGroupScannerPage  = lazy(() => import('@/modules/fbautomation/pages/FbGroupScannerPage').then(m => ({ default: m.FbGroupScannerPage })))
const FbGroupsPage        = lazy(() => import('@/modules/fbautomation/pages/FbGroupsPage').then(m => ({ default: m.FbGroupsPage })))
const FbLeadsPage         = lazy(() => import('@/modules/fbautomation/pages/FbLeadsPage').then(m => ({ default: m.FbLeadsPage })))

// MKT Suite — nhóm mới (Marketing/CSKH tools). Không dùng grey-area API, chỉ Graph API + Zalo OA chính thức.
const LeadImportPage      = lazy(() => import('@/modules/fbautomation/pages/LeadImportPage').then(m => ({ default: m.LeadImportPage })))
const SocialContentPage   = lazy(() => import('@/modules/fbautomation/pages/SocialContentPage').then(m => ({ default: m.SocialContentPage })))
const AffiliatePage       = lazy(() => import('@/modules/fbautomation/pages/AffiliatePage').then(m => ({ default: m.AffiliatePage })))

// Error / Not Found Page
import { NotFoundPage } from '@/components/shared/NotFoundPage'
import { PlaceholderPage } from '@/components/shared/PlaceholderPage'
import { RouteErrorBoundary } from '@/components/shared/RouteErrorBoundary'
import logoImg from '@/img/logo.png'

// ---- Page loading fallback ----
function PageLoader() {
  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center">
      <div className="relative flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center w-20 h-20">
          {/* Vòng nền */}
          <div className="absolute inset-0 border-[3px] border-primary-100 rounded-full" />
          {/* Vòng quay */}
          <div className="absolute inset-0 border-[3px] border-primary-500 rounded-full border-t-transparent animate-spin" />
          {/* Logo ở giữa */}
          <img src={logoImg} alt="Frezo" className="w-10 h-10 object-contain animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-bold text-primary-700 tracking-widest uppercase">Frezo</span>
          <span className="text-xs font-medium text-neutral-400">Đang tải dữ liệu...</span>
        </div>
      </div>
    </div>
  )
}

// ---- Protected Route Guard ----
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  const { data: flatMenus, isLoading } = useQuery({
    queryKey: ['menus_user', user?.username],
    queryFn: () => (user?.username ? menuApi.getMenusForUser(user.username) : []),
    enabled: !!user?.username && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) {
    return <PageLoader />
  }

  const isAdmin = user?.isAdmin || user?.username === 'admin' || user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN')

  if (!isAdmin && flatMenus) {
    const path = location.pathname

    // Always allowed paths (mọi user đăng nhập đều truy cập được)
    const publicProtectedPaths = [
      '/',
      '/dashboard',
      '/profile',
      '/notifications',
      '/approval/inbox',
      '/docs',
    ]
    if (
      publicProtectedPaths.includes(path) ||
      path.startsWith('/docs/')
    ) {
      return <>{children}</>
    }

    // Check if the current path matches any allowed menu's feUrl
    const hasAccess = flatMenus.some((menu) => {
      if (!menu.feUrl) return false
      const cleanFeUrl = menu.feUrl.replace(/\/$/, '')
      const cleanPath = path.replace(/\/$/, '')
      return cleanPath === cleanFeUrl || cleanPath.startsWith(cleanFeUrl + '/')
    })

    if (!hasAccess) {
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}

// ---- Public Route Guard (redirect if logged in) ----
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

// ---- Router ----
export const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    errorElement: <RouteErrorBoundary />,
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      </PublicRoute>
    ),
  },

  // Protected routes (inside MainLayout)
  {
    path: '/',
    // errorElement ở root chặn mọi lỗi runtime từ lazy chunk / render trong subtree —
    // thay vì crash cả app, hiện panel Route Error Boundary có action Reload / Home.
    errorElement: <RouteErrorBoundary />,
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense> },
      { path: 'dashboard', element: <Navigate to="/" replace /> },

      // QTHT
      { path: 'qtht/users',         element: <Suspense fallback={<PageLoader />}><UsersPage /></Suspense> },
      { path: 'qtht/roles',         element: <Suspense fallback={<PageLoader />}><RolesPage /></Suspense> },
      { path: 'qtht/menus',         element: <Suspense fallback={<PageLoader />}><MenusPage /></Suspense> },
      { path: 'qtht/organizations', element: <Suspense fallback={<PageLoader />}><OrganizationsPage /></Suspense> },
      { path: 'qtht/departments',   element: <Suspense fallback={<PageLoader />}><DepartmentsPage /></Suspense> },
      { path: 'qtht/permissions',   element: <Suspense fallback={<PageLoader />}><PermissionsPage /></Suspense> },
      { path: 'qtht/security',      element: <Suspense fallback={<PageLoader />}><SecurityPage /></Suspense> },
      { path: 'qtht/settings',      element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },
      { path: 'qtht/apilogs',       element: <Suspense fallback={<PageLoader />}><ApiLogsPage /></Suspense> },
      { path: 'qtht/workflows',     element: <Suspense fallback={<PageLoader />}><WorkflowsPage /></Suspense> },
      { path: 'qtht/workflows/templates', element: <Suspense fallback={<PageLoader />}><WorkflowTemplateGalleryPage /></Suspense> },
      { path: 'qtht/workflows/:id/designer', element: <Suspense fallback={<PageLoader />}><WorkflowDesignerPage /></Suspense> },
      { path: 'qtht/website',        element: <Suspense fallback={<PageLoader />}><WebsiteManagementPage /></Suspense> },
      { path: 'qtht/tin-tuc',        element: <Suspense fallback={<PageLoader />}><NewsPage /></Suspense> },
      { path: 'qtht/tin-tuc/tao-moi', element: <Suspense fallback={<PageLoader />}><NewsCreatePage /></Suspense> },

      // QLNS
      { path: 'qlns/persons',     element: <Suspense fallback={<PageLoader />}><PersonsPage /></Suspense> },
      { path: 'qlns/contract',        element: <Suspense fallback={<PageLoader />}><ContractPage /></Suspense> },
      { path: 'qlns/contract/create', element: <Suspense fallback={<PageLoader />}><ContractCreatePage /></Suspense> },
      { path: 'qlns/contract/sign/:id', element: <Suspense fallback={<PageLoader />}><ContractSignPage /></Suspense> },
      { path: 'qlns/contract/:id', element: <Suspense fallback={<PageLoader />}><ContractDetailPage /></Suspense> },
      { path: 'qlns/payrolls',    element: <Suspense fallback={<PageLoader />}><PayrollsPage /></Suspense> },
      { path: 'qlns/salary-bands', element: <Suspense fallback={<PageLoader />}><SalaryBandsPage /></Suspense> },
      { path: 'qtht/salary-bands', element: <Suspense fallback={<PageLoader />}><SalaryBandsPage /></Suspense> },
      { path: 'qlns/recruitment/requisitions', element: <Suspense fallback={<PageLoader />}><RequisitionsPage /></Suspense> },
      { path: 'qlns/recruitment/board',        element: <Suspense fallback={<PageLoader />}><RecruitmentBoardPage /></Suspense> },
      { path: 'qlns/okrs', element: <Suspense fallback={<PageLoader />}><OkrsPage /></Suspense> },
      { path: 'qlns/performance-reviews', element: <Suspense fallback={<PageLoader />}><PerformanceReviewsPage /></Suspense> },
      { path: 'qlns/onboarding', element: <Suspense fallback={<PageLoader />}><OnboardingPage /></Suspense> },

      // Customer
      { path: 'customer',            element: <Suspense fallback={<PageLoader />}><CustomersPage /></Suspense> },
      { path: 'customer/:id/360',    element: <Suspense fallback={<PageLoader />}><Customer360Page /></Suspense> },
      { path: 'customer/ncc',        element: <Suspense fallback={<PageLoader />}><NccPage /></Suspense> },
      { path: 'ncc',                 element: <Suspense fallback={<PageLoader />}><NccPage /></Suspense> },

      // Product
      { path: 'product',          element: <Suspense fallback={<PageLoader />}><ProductsPage /></Suspense> },
      { path: 'loai-san-pham',    element: <Suspense fallback={<PageLoader />}><ProductCategoriesPage /></Suspense> },

      // Task
      { path: 'task',             element: <Suspense fallback={<PageLoader />}><TasksPage /></Suspense> },
      { path: 'task/tickets',     element: <Suspense fallback={<PageLoader />}><TicketsPage /></Suspense> },
      { path: 'task/tags',        element: <Suspense fallback={<PageLoader />}><TagsPage /></Suspense> },
      { path: 'qlns/leaves',      element: <Suspense fallback={<PageLoader />}><LeavesPage /></Suspense> },

      // Attendance
      { path: 'admin/attendance', element: <Suspense fallback={<PageLoader />}><AttendancePage /></Suspense> },

      // Articles
      { path: 'admin/article-management',            element: <Suspense fallback={<PageLoader />}><ArticlesPage /></Suspense> },
      { path: 'admin/article-management/new',        element: <Suspense fallback={<PageLoader />}><ArticleEditorPage /></Suspense> },
      { path: 'admin/article-management/:id/edit',   element: <Suspense fallback={<PageLoader />}><ArticleEditorPage /></Suspense> },

      // Category Management
      { path: 'admin/category-management', element: <Suspense fallback={<PageLoader />}><CategoriesPage /></Suspense> },
      { path: 'admin/category-management/:type', element: <Suspense fallback={<PageLoader />}><CategoriesPage /></Suspense> },

      // Email
      { path: 'email/config',   element: <Suspense fallback={<PageLoader />}><EmailConfigPage /></Suspense> },
      { path: 'email/template', element: <Suspense fallback={<PageLoader />}><EmailTemplatePage /></Suspense> },
      { path: 'email/group',    element: <Suspense fallback={<PageLoader />}><EmailGroupsPage /></Suspense> },
      { path: 'email/compose',  element: <Suspense fallback={<PageLoader />}><EmailComposePage /></Suspense> },
      { path: 'email/inbox',    element: <Suspense fallback={<PageLoader />}><EmailInboxPage /></Suspense> },

      // Profile
      { path: 'profile',          element: <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense> },

      // Notifications (Notification Center)
      { path: 'notifications',    element: <Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense> },

      // Docs Hub
      { path: 'docs', element: <Suspense fallback={<PageLoader />}><DocsHubPage /></Suspense> },
      { path: 'docs/:slug', element: <Suspense fallback={<PageLoader />}><DocsViewerPage /></Suspense> },

      // Approval module (FZ-003 / FE-1)
      { path: 'approval/inbox',   element: <Suspense fallback={<PageLoader />}><ApprovalInboxPage /></Suspense> },
      { path: 'approval/flows',   element: <Suspense fallback={<PageLoader />}><ApprovalFlowConfigPage /></Suspense> },

      // Warehouse (FZ-010 / FE-3)
      { path: 'warehouse/reorder-rules', element: <Suspense fallback={<PageLoader />}><ReorderRulesPage /></Suspense> },
      { path: 'warehouse/stock-alerts',  element: <Suspense fallback={<PageLoader />}><StockAlertsPage /></Suspense> },
      { path: 'warehouse/stock-takes',   element: <Suspense fallback={<PageLoader />}><StockTakePage /></Suspense> },
      { path: 'warehouse/purchase-requests', element: <Suspense fallback={<PageLoader />}><PurchaseRequestsPage /></Suspense> },
      { path: 'warehouse/purchase-requests/:id', element: <Suspense fallback={<PageLoader />}><PurchaseRequestDetailPage /></Suspense> },
      { path: 'warehouse/purchase-orders', element: <Suspense fallback={<PageLoader />}><PurchaseOrdersPage /></Suspense> },
      { path: 'warehouse/purchase-orders/:id', element: <Suspense fallback={<PageLoader />}><PurchaseOrderDetailPage /></Suspense> },

      // Accounting
      { path: 'accounting/accounts',       element: <Suspense fallback={<PageLoader />}><AccountsPage /></Suspense> },
      { path: 'accounting/journals',       element: <Suspense fallback={<PageLoader />}><JournalsPage /></Suspense> },
      { path: 'accounting/ledger',         element: <Suspense fallback={<PageLoader />}><GeneralLedgerPage /></Suspense> },
      { path: 'accounting/trial-balance',  element: <Suspense fallback={<PageLoader />}><TrialBalancePage /></Suspense> },
      { path: 'accounting/financial-statements', element: <Suspense fallback={<PageLoader />}><FinancialStatementsPage /></Suspense> },
      { path: 'accounting/settings',       element: <Suspense fallback={<PageLoader />}><AccountingSettingsPage /></Suspense> },
      { path: 'accounting/periods',        element: <Suspense fallback={<PageLoader />}><FiscalPeriodsPage /></Suspense> },
      { path: 'accounting/bank-reconciliation',        element: <Suspense fallback={<PageLoader />}><BankReconciliationPage /></Suspense> },
      { path: 'accounting/bank-reconciliation/import', element: <Suspense fallback={<PageLoader />}><BankStatementImportPage /></Suspense> },

      // CRM
      { path: 'crm/leads',     element: <Suspense fallback={<PageLoader />}><LeadsPage /></Suspense> },
      { path: 'crm/deals',     element: <Suspense fallback={<PageLoader />}><DealsPage /></Suspense> },
      { path: 'crm/quotes',    element: <Suspense fallback={<PageLoader />}><QuotesPage /></Suspense> },
      { path: 'crm/invoices',  element: <Suspense fallback={<PageLoader />}><InvoicesPage /></Suspense> },
      { path: 'crm/meetings',  element: <Suspense fallback={<PageLoader />}><MeetingsPage /></Suspense> },
      { path: 'crm/email-sequences', element: <Suspense fallback={<PageLoader />}><EmailSequencesPage /></Suspense> },

      // FB Automation
      { path: 'fb',                element: <Suspense fallback={<PageLoader />}><FbDashboardPage /></Suspense> },
      { path: 'fb/accounts',       element: <Suspense fallback={<PageLoader />}><FbAccountsPage /></Suspense> },
      { path: 'fb/scan-groups',    element: <Suspense fallback={<PageLoader />}><FbGroupScannerPage /></Suspense> },
      { path: 'fb/groups',         element: <Suspense fallback={<PageLoader />}><FbGroupsPage /></Suspense> },
      { path: 'fb/leads',          element: <Suspense fallback={<PageLoader />}><FbLeadsPage /></Suspense> },

      // CSKH — Inbox tổng (alias sang FbLeadsPage đã multi-channel)
      { path: 'support/inbox',     element: <Suspense fallback={<PageLoader />}><FbLeadsPage /></Suspense> },

      // ============================================================
      // MKT Suite — nhóm Marketing/CSKH tools (route /mkt/*)
      // ------------------------------------------------------------
      // Chi tiết trạng thái từng module trong MKT_ROADMAP.md.
      // Ready = không cần API bên ngoài.
      // Placeholder = cần Meta App Review + Page Token (5 module).
      // ============================================================
      { path: 'mkt/inbox',        element: <Suspense fallback={<PageLoader />}><FbLeadsPage /></Suspense> },
      { path: 'mkt/leads/import', element: <Suspense fallback={<PageLoader />}><LeadImportPage /></Suspense> },
      { path: 'mkt/content',      element: <Suspense fallback={<PageLoader />}><SocialContentPage /></Suspense> },
      { path: 'mkt/affiliate',    element: <Suspense fallback={<PageLoader />}><AffiliatePage /></Suspense> },

      // Cần Meta App Review + Page Token — hiện placeholder, sẽ implement khi có credentials.
      { path: 'mkt/insights',     element: <PlaceholderPage title="Page Insights" moduleCode="MKT · INSIGHTS" description="Reach / engagement / follower theo Graph API. Cần Meta App + permission read_insights. Xem MKT_ROADMAP.md." /> },
      { path: 'mkt/ads',          element: <PlaceholderPage title="Báo cáo Ads" moduleCode="MKT · ADS" description="Chi phí / ROAS / CTR từ Meta Marketing API. Cần Ad Account Token + permission ads_read." /> },
      { path: 'mkt/comments',     element: <PlaceholderPage title="Kiểm duyệt Comment" moduleCode="MKT · MODERATOR" description="Auto-reply / hide spam theo từ khoá. Cần Page Token + webhook feed." /> },
      { path: 'mkt/reviews',      element: <PlaceholderPage title="Theo dõi đánh giá" moduleCode="MKT · REVIEWS" description="Poll ratings, alert khi có review 1-2 sao. Cần Page Token + permission pages_read_user_content." /> },
      { path: 'mkt/live',         element: <PlaceholderPage title="Livestream Reminder" moduleCode="MKT · LIVE" description="Tạo event + notify khách đăng ký trước giờ live. Standalone — không cần Meta App." /> },
      { path: 'mkt/zalo',         element: <PlaceholderPage title="Zalo OA Broadcast" moduleCode="MKT · ZALO" description="Gửi ZNS theo template đã duyệt. Cần Zalo OA verified + template duyệt trước." /> },

      // Placeholder routes — menu đã seed nhưng UI chi tiết chưa build.
      // Giữ menu trong sidebar để giữ nguyên IA + phân quyền, nhưng thay 404 bằng trang "đang phát triển".
      { path: 'admin/events',      element: <Suspense fallback={<PageLoader />}><EventsAdminPage /></Suspense> },
      { path: 'admin/events/new',  element: <Suspense fallback={<PageLoader />}><EventFormPage /></Suspense> },
      { path: 'admin/events/:id/edit', element: <Suspense fallback={<PageLoader />}><EventFormPage /></Suspense> },
      { path: 'admin/events/:id',  element: <Suspense fallback={<PageLoader />}><EventDetailAdminPage /></Suspense> },
      { path: 'admin/qlts',        element: <Suspense fallback={<PageLoader />}><AssetsPage /></Suspense> },
      { path: 'assets/depreciation', element: <Suspense fallback={<PageLoader />}><DepreciationPostPage /></Suspense> },
      { path: 'admin/qlbghd',      element: <PlaceholderPage title="Quản Lý Bảng Giá Hợp Đồng" moduleCode="BGHD" description="Bảng giá / phụ lục hợp đồng, phê duyệt và version — đang được xây dựng." /> },
    ],
  },

  // Catch all
  { path: '*', element: <NotFoundPage />, errorElement: <RouteErrorBoundary /> },
], {
  // React 18 + React Router v6 lazy chunk: khi user click Link → route load lazy chunk,
  // React coi đây là "synchronous input" → cảnh báo "component suspended...".
  // Flag này bật startTransition() nội bộ cho mọi navigation → mọi Suspense boundary
  // fallback (PageLoader) sẽ hiển thị mượt thay vì bị thay thế đột ngột.
  // Bonus: chuẩn bị migration sang React Router v7 mà không cần rewrite.
  future: {
    v7_startTransition: true,
  },
})
