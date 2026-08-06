// ============================================================
// FREZO ERP — Router Configuration
// Protected routes, lazy loading per module
// ============================================================

import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/MainLayout'
import { LobbyLayout } from '@/components/layout/LobbyLayout'
import { useAuthStore } from '@/stores/authStore'
import { menuApi } from '@/modules/menus/services/menuApi'

// ---- Lazy load pages per module ----
const LoginPage       = lazy(() => import('@/modules/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const ForgotPasswordPage = lazy(() => import('@/modules/auth/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const LobbyPage       = lazy(() => import('@/modules/dashboard/pages/LobbyPage').then(m => ({ default: m.LobbyPage })))
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
const JobsPage          = lazy(() => import('@/modules/qtht/pages/JobsPage').then(m => ({ default: m.JobsPage })))
const UsageAnalyticsPage = lazy(() => import('@/modules/qtht/pages/UsageAnalyticsPage').then(m => ({ default: m.UsageAnalyticsPage })))
const WebsiteManagementPage = lazy(() => import('@/modules/qtht/pages/WebsiteManagementPage').then(m => ({ default: m.WebsiteManagementPage })))
const NewsUtilitiesPage     = lazy(() => import('@/modules/news/pages/NewsUtilitiesPage').then(m => ({ default: m.NewsUtilitiesPage })))
// Assets (QLTS)
const AssetsPage = lazy(() => import('@/modules/assets/pages/AssetsPage').then(m => ({ default: m.AssetsPage })))
const DepreciationPostPage = lazy(() => import('@/modules/assets/pages/DepreciationPostPage').then(m => ({ default: m.DepreciationPostPage })))

// Workflow Engine — quy trình duyệt chung cho mọi module
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
const OkrWorkspacePage          = lazy(() => import('@/modules/qlns/pages/OkrWorkspacePage').then(m => ({ default: m.OkrWorkspacePage })))
const PerformanceReviewsPage    = lazy(() => import('@/modules/qlns/pages/PerformanceReviewsPage').then(m => ({ default: m.PerformanceReviewsPage })))
const RecognitionPage           = lazy(() => import('@/modules/qlns/pages/RecognitionPage').then(m => ({ default: m.RecognitionPage })))
const OnboardingPage            = lazy(() => import('@/modules/qlns/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const OffboardingPage           = lazy(() => import('@/modules/qlns/pages/OffboardingPage').then(m => ({ default: m.OffboardingPage })))
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
const WorkHubPage     = lazy(() => import('@/modules/tasks/pages/WorkHubPage').then(m => ({ default: m.WorkHubPage })))
const TaskLegacyRedirect = lazy(() => import('@/modules/tasks/components/TaskLegacyRedirect').then(m => ({ default: m.TaskLegacyRedirect })))
const LeavesPage      = lazy(() => import('@/modules/qlns/pages/LeavesPage').then(m => ({ default: m.LeavesPage })))
const AttendancePage  = lazy(() => import('@/modules/qlns/pages/AttendancePage').then(m => ({ default: m.AttendancePage })))
const TimeHubPage     = lazy(() => import('@/modules/qlns/pages/TimeHubPage').then(m => ({ default: m.TimeHubPage })))
const PayrollHubPage  = lazy(() => import('@/modules/qlns/pages/PayrollHubPage').then(m => ({ default: m.PayrollHubPage })))
const PeopleHubPage   = lazy(() => import('@/modules/qlns/pages/PeopleHubPage').then(m => ({ default: m.PeopleHubPage })))
const HrSetupHubPage  = lazy(() => import('@/modules/qlns/pages/HrSetupHubPage').then(m => ({ default: m.HrSetupHubPage })))
const PerformanceHubPage = lazy(() => import('@/modules/qlns/pages/PerformanceHubPage').then(m => ({ default: m.PerformanceHubPage })))
const QlnsLegacyRedirect = lazy(() => import('@/modules/qlns/components/QlnsLegacyRedirect').then(m => ({ default: m.QlnsLegacyRedirect })))

// Articles
const ArticlesPage       = lazy(() => import('@/modules/articles/pages/ArticlesPage').then(m => ({ default: m.ArticlesPage })))
const ArticleEditorPage  = lazy(() => import('@/modules/articles/pages/ArticleEditorPage').then(m => ({ default: m.ArticleEditorPage })))
const ArticleListPage    = lazy(() => import('@/modules/articles/pages/ArticleListPage').then(m => ({ default: m.ArticleListPage })))
const ArticleDetailPage  = lazy(() => import('@/modules/articles/pages/ArticleDetailPage').then(m => ({ default: m.ArticleDetailPage })))

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

// Docs Hub + Guide CMS (FR-DOC-03/04)
const DocsHubPage = lazy(() => import('@/modules/docs/pages/DocsHubPage').then(m => ({ default: m.DocsHubPage })))
const DocsViewerPage = lazy(() => import('@/modules/docs/pages/DocsViewerPage').then(m => ({ default: m.DocsViewerPage })))
const GuidesAdminPage = lazy(() => import('@/modules/docs/pages/GuidesAdminPage').then(m => ({ default: m.GuidesAdminPage })))
const GuideEditorPage = lazy(() => import('@/modules/docs/pages/GuideEditorPage').then(m => ({ default: m.GuideEditorPage })))

// Approval (FZ-003)
const ApprovalInboxPage = lazy(() => import('@/modules/approval/pages/ApprovalInboxPage').then(m => ({ default: m.ApprovalInboxPage })))
const ApprovalConfigHubPage = lazy(() => import('@/modules/approval/pages/ApprovalConfigHubPage').then(m => ({ default: m.ApprovalConfigHubPage })))

// Warehouse (FZ-010)
const ReorderRulesPage = lazy(() => import('@/modules/warehouse/pages/ReorderRulesPage').then(m => ({ default: m.ReorderRulesPage })))
const StockAlertsPage = lazy(() => import('@/modules/warehouse/pages/StockAlertsPage').then(m => ({ default: m.StockAlertsPage })))
const StockTakePage = lazy(() => import('@/modules/warehouse/pages/StockTakePage').then(m => ({ default: m.StockTakePage })))
const StockTakeDetailPage = lazy(() => import('@/modules/warehouse/pages/StockTakeDetailPage').then(m => ({ default: m.StockTakeDetailPage })))
const PurchaseRequestsPage = lazy(() => import('@/modules/warehouse/pages/PurchaseRequestsPage').then(m => ({ default: m.PurchaseRequestsPage })))
const PurchaseRequestDetailPage = lazy(() => import('@/modules/warehouse/pages/PurchaseRequestDetailPage').then(m => ({ default: m.PurchaseRequestDetailPage })))
const PurchaseOrdersPage = lazy(() => import('@/modules/warehouse/pages/PurchaseOrdersPage').then(m => ({ default: m.PurchaseOrdersPage })))
const PurchaseOrderDetailPage = lazy(() => import('@/modules/warehouse/pages/PurchaseOrderDetailPage').then(m => ({ default: m.PurchaseOrderDetailPage })))
const GoodsReceiptNotesPage = lazy(() => import('@/modules/warehouse/pages/GoodsReceiptNotesPage').then(m => ({ default: m.GoodsReceiptNotesPage })))
const GoodsReceiptNoteDetailPage = lazy(() => import('@/modules/warehouse/pages/GoodsReceiptNoteDetailPage').then(m => ({ default: m.GoodsReceiptNoteDetailPage })))
const GoodsIssueNotesPage = lazy(() => import('@/modules/warehouse/pages/GoodsIssueNotesPage').then(m => ({ default: m.GoodsIssueNotesPage })))
const GoodsIssueNoteDetailPage = lazy(() => import('@/modules/warehouse/pages/GoodsIssueNoteDetailPage').then(m => ({ default: m.GoodsIssueNoteDetailPage })))
const ShrinkagePage = lazy(() => import('@/modules/warehouse/pages/ShrinkagePage').then(m => ({ default: m.ShrinkagePage })))
const BatchesPage = lazy(() => import('@/modules/warehouse/pages/BatchesPage').then(m => ({ default: m.BatchesPage })))
const WarehouseDashboardPage = lazy(() => import('@/modules/warehouse/pages/WarehouseDashboardPage').then(m => ({ default: m.WarehouseDashboardPage })))

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
const TaxDeclarationPage      = lazy(() => import('@/modules/accounting/pages/TaxDeclarationPage').then(m => ({ default: m.TaxDeclarationPage })))
const AccountingOperationsHubPage = lazy(() => import('@/modules/accounting/pages/AccountingOperationsHubPage').then(m => ({ default: m.AccountingOperationsHubPage })))
const AccountingReportsHubPage    = lazy(() => import('@/modules/accounting/pages/AccountingReportsHubPage').then(m => ({ default: m.AccountingReportsHubPage })))
const AccountingSetupHubPage      = lazy(() => import('@/modules/accounting/pages/AccountingSetupHubPage').then(m => ({ default: m.AccountingSetupHubPage })))
const AccountingLegacyRedirect    = lazy(() => import('@/modules/accounting/components/AccountingLegacyRedirect').then(m => ({ default: m.AccountingLegacyRedirect })))

// CRM
const CrmPipelineHubPage = lazy(() => import('@/modules/crm/pages/CrmPipelineHubPage').then(m => ({ default: m.CrmPipelineHubPage })))
const CrmSalesHubPage = lazy(() => import('@/modules/crm/pages/CrmSalesHubPage').then(m => ({ default: m.CrmSalesHubPage })))
const CrmLegacyRedirect = lazy(() => import('@/modules/crm/components/CrmLegacyRedirect').then(m => ({ default: m.CrmLegacyRedirect })))

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
const AdsPage             = lazy(() => import('@/modules/fbautomation/pages/AdsPage').then(m => ({ default: m.AdsPage })))
const InsightsPage        = lazy(() => import('@/modules/fbautomation/pages/InsightsPage').then(m => ({ default: m.InsightsPage })))
const CommentsPage        = lazy(() => import('@/modules/fbautomation/pages/CommentsPage').then(m => ({ default: m.CommentsPage })))
const ReviewsPage         = lazy(() => import('@/modules/fbautomation/pages/ReviewsPage').then(m => ({ default: m.ReviewsPage })))
const LivePage            = lazy(() => import('@/modules/fbautomation/pages/LivePage').then(m => ({ default: m.LivePage })))

// AI Automation
const AIDashboardPage   = lazy(() => import('@/modules/ai/pages/AIDashboardPage').then(m => ({ default: m.AIDashboardPage })))
const AIAccountsPage    = lazy(() => import('@/modules/ai/pages/AIAccountsPage').then(m => ({ default: m.AIAccountsPage })))
const AIGroupScannerPage = lazy(() => import('@/modules/ai/pages/GroupScannerPage').then(m => ({ default: m.GroupScannerPage })))
const AIPosterPage      = lazy(() => import('@/modules/ai/pages/PosterPage').then(m => ({ default: m.PosterPage })))
const AICommentsPage    = lazy(() => import('@/modules/ai/pages/CommentsPage').then(m => ({ default: m.CommentsPage })))
const AIInboxPage       = lazy(() => import('@/modules/ai/pages/InboxPage').then(m => ({ default: m.InboxPage })))
const AIContentGenPage  = lazy(() => import('@/modules/ai/pages/ContentGenPage').then(m => ({ default: m.ContentGenPage })))
const AIGgMapScannerPage = lazy(() => import('@/modules/ai/pages/GgMapScannerPage').then(m => ({ default: m.GgMapScannerPage })))

// Error / Not Found Page
import { NotFoundPage } from '@/components/shared/NotFoundPage'
import { PlaceholderPage } from '@/components/shared/PlaceholderPage'
import { RouteErrorBoundary } from '@/components/shared/RouteErrorBoundary'
import { hasPermission } from '@/lib/hooks/usePermission'
import { canAccessTaskPathname } from '@/modules/tasks/utils/taskRoutes'
import { canAccessAccountingHubPathname } from '@/modules/accounting/utils/accountingRoutes'
import { canAccessQlnsHubPathname } from '@/modules/qlns/utils/qlnsRoutes'
import { canAccessCrmHubPathname } from '@/modules/crm/utils/crmRoutes'
// AppSplash = màn brand toàn trang (bootstrap/auth), PageLoader = loader trong MainLayout
import { AppSplash, PageLoader } from '@/components/shared/AppLoading'

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
    return <AppSplash />
  }

  const isAdmin = user?.isAdmin || user?.username === 'admin' || user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN')

  if (!isAdmin && flatMenus) {
    const path = location.pathname

    // Always allowed paths (mọi user đăng nhập đều truy cập được)
    // Home `/` = portal; `/dashboard` KPI cần menu DASHBOARD / QTHT.DASHBOARD.VIEW
    const publicProtectedPaths = [
      '/',
      '/home',
      '/profile',
      '/notifications',
      '/approval/inbox',
      '/docs',
      '/bai-viet',
    ]
    if (
      publicProtectedPaths.includes(path) ||
      path.startsWith('/docs/') ||
      path.startsWith('/bai-viet/')
    ) {
      return <>{children}</>
    }

    // Dashboard KPI: menu DASHBOARD hoặc permission QTHT.DASHBOARD.VIEW
    if (path === '/dashboard' && hasPermission('QTHT.DASHBOARD.VIEW')) {
      return <>{children}</>
    }

    // Task hub `/task` — allowed if user has any legacy task/ticket/tag menu
    const menuFeUrls = flatMenus
      .map((m) => m.feUrl)
      .filter((u): u is string => !!u)
    if (canAccessTaskPathname(path, menuFeUrls)) {
      return <>{children}</>
    }

    // Accounting hubs — allowed if user has any legacy menu in that group
    if (canAccessAccountingHubPathname(path, menuFeUrls)) {
      return <>{children}</>
    }

    // CRM hubs — allowed if user has any legacy menu in that group
    if (canAccessCrmHubPathname(path, menuFeUrls)) {
      return <>{children}</>
    }

    // QLNS hubs — allowed if user has any legacy menu in that hub group
    if (canAccessQlnsHubPathname(path, menuFeUrls)) {
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
        <Suspense fallback={<AppSplash label="Đang mở trang đăng nhập" />}>
          <LoginPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: '/forgot-password',
    errorElement: <RouteErrorBoundary />,
    element: (
      <PublicRoute>
        <Suspense fallback={<AppSplash label="Đang mở quên mật khẩu" />}>
          <ForgotPasswordPage />
        </Suspense>
      </PublicRoute>
    ),
  },

  // Protected routes — LobbyLayout (/) vs MainLayout (ERP modules)
  {
    path: '/',
    // errorElement ở root chặn mọi lỗi runtime từ lazy chunk / render trong subtree —
    // thay vì crash cả app, hiện panel Route Error Boundary có action Reload / Home.
    errorElement: <RouteErrorBoundary />,
    element: (
      <ProtectedRoute>
        <Outlet />
      </ProtectedRoute>
    ),
    children: [
      {
        element: <LobbyLayout />,
        children: [
          { index: true, element: <Suspense fallback={<PageLoader />}><LobbyPage /></Suspense> },
        ],
      },
      {
        element: <MainLayout />,
        children: [
      { path: 'home', element: <Navigate to="/" replace /> },
      { path: 'dashboard', element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense> },

      // Reader — tin / bài viết nội bộ (Home portal)
      { path: 'bai-viet', element: <Suspense fallback={<PageLoader />}><ArticleListPage /></Suspense> },
      { path: 'bai-viet/:id', element: <Suspense fallback={<PageLoader />}><ArticleDetailPage /></Suspense> },

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
      { path: 'qtht/jobs',          element: <Suspense fallback={<PageLoader />}><JobsPage /></Suspense> },
      { path: 'qtht/usage',         element: <Suspense fallback={<PageLoader />}><UsageAnalyticsPage /></Suspense> },
      { path: 'qtht/workflows',     element: <Navigate to="/approval/flows?tab=templates" replace /> },
      { path: 'qtht/workflows/templates', element: <Suspense fallback={<PageLoader />}><WorkflowTemplateGalleryPage /></Suspense> },
      { path: 'qtht/workflows/:id/designer', element: <Suspense fallback={<PageLoader />}><WorkflowDesignerPage /></Suspense> },
      { path: 'qtht/website',        element: <Suspense fallback={<PageLoader />}><WebsiteManagementPage /></Suspense> },
      { path: 'qtht/tien-ich',       element: <Suspense fallback={<PageLoader />}><NewsUtilitiesPage /></Suspense> },
      { path: 'qtht/tin-tuc',        element: <Navigate to="/admin/article-management" replace /> },
      { path: 'qtht/tin-tuc/tao-moi', element: <Navigate to="/admin/article-management/new" replace /> },

      // QLNS — unified hubs + legacy redirects
      { path: 'qlns/time',        element: <Suspense fallback={<PageLoader />}><TimeHubPage /></Suspense> },
      { path: 'qlns/payroll',     element: <Suspense fallback={<PageLoader />}><PayrollHubPage /></Suspense> },
      { path: 'qlns/people',      element: <Suspense fallback={<PageLoader />}><PeopleHubPage /></Suspense> },
      { path: 'qlns/settings',    element: <Suspense fallback={<PageLoader />}><HrSetupHubPage /></Suspense> },
      { path: 'qlns/performance', element: <Suspense fallback={<PageLoader />}><PerformanceHubPage /></Suspense> },
      { path: 'qlns/recognition', element: <Suspense fallback={<PageLoader />}><RecognitionPage /></Suspense> },
      { path: 'qlns/persons',     element: <Suspense fallback={<PageLoader />}><QlnsLegacyRedirect hubPath="/qlns/people" tab="persons" /></Suspense> },
      { path: 'qlns/contract',        element: <Suspense fallback={<PageLoader />}><QlnsLegacyRedirect hubPath="/qlns/people" tab="contracts" /></Suspense> },
      { path: 'qlns/contract/create', element: <Suspense fallback={<PageLoader />}><ContractCreatePage /></Suspense> },
      { path: 'qlns/contract/sign/:id', element: <Suspense fallback={<PageLoader />}><ContractSignPage /></Suspense> },
      { path: 'qlns/contract/:id', element: <Suspense fallback={<PageLoader />}><ContractDetailPage /></Suspense> },
      { path: 'qlns/payrolls',    element: <Suspense fallback={<PageLoader />}><QlnsLegacyRedirect hubPath="/qlns/payroll" tab="payrolls" /></Suspense> },
      { path: 'qlns/salary-bands', element: <Suspense fallback={<PageLoader />}><QlnsLegacyRedirect hubPath="/qlns/payroll" tab="bands" /></Suspense> },
      { path: 'qtht/salary-bands', element: <Suspense fallback={<PageLoader />}><QlnsLegacyRedirect hubPath="/qlns/payroll" tab="bands" /></Suspense> },
      { path: 'qlns/payroll-periods', element: <Suspense fallback={<PageLoader />}><QlnsLegacyRedirect hubPath="/qlns/payroll" tab="payrolls" drawer="periods" /></Suspense> },
      { path: 'qlns/recruitment/requisitions', element: <Suspense fallback={<PageLoader />}><QlnsLegacyRedirect hubPath="/qlns/people" tab="recruitment" /></Suspense> },
      { path: 'qlns/recruitment/board',        element: <Suspense fallback={<PageLoader />}><QlnsLegacyRedirect hubPath="/qlns/people" tab="recruitment" /></Suspense> },
      { path: 'qlns/okrs', element: <Suspense fallback={<PageLoader />}><QlnsLegacyRedirect hubPath="/qlns/performance" tab="okrs" /></Suspense> },
      { path: 'qlns/okr-settings', element: <Suspense fallback={<PageLoader />}><OkrWorkspacePage initialTab="settings" /></Suspense> },
      { path: 'qlns/performance-reviews', element: <Suspense fallback={<PageLoader />}><QlnsLegacyRedirect hubPath="/qlns/performance" tab="reviews" /></Suspense> },
      { path: 'qlns/onboarding', element: <Suspense fallback={<PageLoader />}><QlnsLegacyRedirect hubPath="/qlns/people" tab="onboarding" /></Suspense> },
      { path: 'qlns/offboarding', element: <Suspense fallback={<PageLoader />}><QlnsLegacyRedirect hubPath="/qlns/people" tab="offboarding" /></Suspense> },

      // Customer
      { path: 'customer',            element: <Suspense fallback={<PageLoader />}><CustomersPage /></Suspense> },
      { path: 'customer/:id/360',    element: <Suspense fallback={<PageLoader />}><Customer360Page /></Suspense> },
      { path: 'customer/ncc',        element: <Suspense fallback={<PageLoader />}><NccPage /></Suspense> },
      { path: 'ncc',                 element: <Suspense fallback={<PageLoader />}><NccPage /></Suspense> },

      // Product
      { path: 'product',          element: <Suspense fallback={<PageLoader />}><ProductsPage /></Suspense> },
      { path: 'loai-san-pham',    element: <Suspense fallback={<PageLoader />}><ProductCategoriesPage /></Suspense> },

      // Task — unified hub + danh mục ticket
      { path: 'task',             element: <Suspense fallback={<PageLoader />}><WorkHubPage /></Suspense> },
      { path: 'task/tickets',     element: <Suspense fallback={<PageLoader />}><TaskLegacyRedirect tab="board" /></Suspense> },
      { path: 'tasks',            element: <Suspense fallback={<PageLoader />}><TaskLegacyRedirect tab="board" /></Suspense> },
      { path: 'task/tags',        element: <Suspense fallback={<PageLoader />}><TaskLegacyRedirect tab="tags" /></Suspense> },
      { path: 'task/categories',  element: <Suspense fallback={<PageLoader />}><TaskLegacyRedirect tab="categories" /></Suspense> },
      { path: 'qlns/leaves',      element: <Suspense fallback={<PageLoader />}><QlnsLegacyRedirect hubPath="/qlns/time" tab="leaves" /></Suspense> },

      // Attendance — legacy redirect
      { path: 'admin/attendance', element: <Suspense fallback={<PageLoader />}><QlnsLegacyRedirect hubPath="/qlns/time" tab="daily" /></Suspense> },

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

      // Docs Hub + Guide CMS admin
      { path: 'docs', element: <Suspense fallback={<PageLoader />}><DocsHubPage /></Suspense> },
      { path: 'docs/:slug', element: <Suspense fallback={<PageLoader />}><DocsViewerPage /></Suspense> },
      { path: 'admin/guides', element: <Suspense fallback={<PageLoader />}><GuidesAdminPage /></Suspense> },
      { path: 'admin/guides/new', element: <Suspense fallback={<PageLoader />}><GuideEditorPage /></Suspense> },
      { path: 'admin/guides/:id/edit', element: <Suspense fallback={<PageLoader />}><GuideEditorPage /></Suspense> },

      // Approval module (FZ-003 / FE-1) — config hub + ops inbox
      { path: 'approval/inbox',   element: <Suspense fallback={<PageLoader />}><ApprovalInboxPage /></Suspense> },
      { path: 'approval/flows',   element: <Suspense fallback={<PageLoader />}><ApprovalConfigHubPage /></Suspense> },

      // Warehouse (FZ-010 / FE-3)
      { path: 'warehouse', element: <Suspense fallback={<PageLoader />}><WarehouseDashboardPage /></Suspense> },
      { path: 'warehouse/reorder-rules', element: <Suspense fallback={<PageLoader />}><ReorderRulesPage /></Suspense> },
      { path: 'warehouse/stock-alerts',  element: <Suspense fallback={<PageLoader />}><StockAlertsPage /></Suspense> },
      { path: 'warehouse/stock-takes',   element: <Suspense fallback={<PageLoader />}><StockTakePage /></Suspense> },
      { path: 'warehouse/stock-takes/:id', element: <Suspense fallback={<PageLoader />}><StockTakeDetailPage /></Suspense> },
      { path: 'warehouse/purchase-requests', element: <Suspense fallback={<PageLoader />}><PurchaseRequestsPage /></Suspense> },
      { path: 'warehouse/purchase-requests/:id', element: <Suspense fallback={<PageLoader />}><PurchaseRequestDetailPage /></Suspense> },
      { path: 'warehouse/purchase-orders', element: <Suspense fallback={<PageLoader />}><PurchaseOrdersPage /></Suspense> },
      { path: 'warehouse/purchase-orders/:id', element: <Suspense fallback={<PageLoader />}><PurchaseOrderDetailPage /></Suspense> },
      { path: 'warehouse/grn', element: <Suspense fallback={<PageLoader />}><GoodsReceiptNotesPage /></Suspense> },
      { path: 'warehouse/grn/:id', element: <Suspense fallback={<PageLoader />}><GoodsReceiptNoteDetailPage /></Suspense> },
      { path: 'warehouse/gin', element: <Suspense fallback={<PageLoader />}><GoodsIssueNotesPage /></Suspense> },
      { path: 'warehouse/gin/:id', element: <Suspense fallback={<PageLoader />}><GoodsIssueNoteDetailPage /></Suspense> },
      { path: 'warehouse/shrinkage', element: <Suspense fallback={<PageLoader />}><ShrinkagePage /></Suspense> },
      { path: 'warehouse/batches', element: <Suspense fallback={<PageLoader />}><BatchesPage /></Suspense> },

      // Accounting — unified hubs + legacy redirects
      { path: 'accounting',                  element: <Suspense fallback={<PageLoader />}><AccountingOperationsHubPage /></Suspense> },
      { path: 'accounting/reports',          element: <Suspense fallback={<PageLoader />}><AccountingReportsHubPage /></Suspense> },
      { path: 'accounting/setup',            element: <Suspense fallback={<PageLoader />}><AccountingSetupHubPage /></Suspense> },
      { path: 'accounting/journals',         element: <Suspense fallback={<PageLoader />}><AccountingLegacyRedirect hubPath="/accounting" tab="journals" /></Suspense> },
      { path: 'accounting/ledger',           element: <Suspense fallback={<PageLoader />}><AccountingLegacyRedirect hubPath="/accounting" tab="ledger" /></Suspense> },
      { path: 'accounting/bank-reconciliation', element: <Suspense fallback={<PageLoader />}><AccountingLegacyRedirect hubPath="/accounting" tab="bank" /></Suspense> },
      { path: 'accounting/trial-balance',    element: <Suspense fallback={<PageLoader />}><AccountingLegacyRedirect hubPath="/accounting/reports" tab="trial-balance" /></Suspense> },
      { path: 'accounting/financial-statements', element: <Suspense fallback={<PageLoader />}><AccountingLegacyRedirect hubPath="/accounting/reports" tab="financial" /></Suspense> },
      { path: 'accounting/tax',              element: <Suspense fallback={<PageLoader />}><AccountingLegacyRedirect hubPath="/accounting/reports" tab="tax" /></Suspense> },
      { path: 'accounting/settings',         element: <Suspense fallback={<PageLoader />}><AccountingLegacyRedirect hubPath="/accounting/setup" tab="settings" /></Suspense> },
      { path: 'accounting/periods',          element: <Suspense fallback={<PageLoader />}><AccountingLegacyRedirect hubPath="/accounting/setup" drawer="periods" /></Suspense> },
      { path: 'accounting/accounts',         element: <Suspense fallback={<PageLoader />}><AccountingLegacyRedirect hubPath="/accounting/setup" tab="accounts" /></Suspense> },
      { path: 'accounting/bank-reconciliation/import', element: <Suspense fallback={<PageLoader />}><BankStatementImportPage /></Suspense> },

      // CRM — unified hubs + legacy redirects
      { path: 'crm',             element: <Suspense fallback={<PageLoader />}><CrmPipelineHubPage /></Suspense> },
      { path: 'crm/sales',       element: <Suspense fallback={<PageLoader />}><CrmSalesHubPage /></Suspense> },
      { path: 'crm/leads',       element: <Suspense fallback={<PageLoader />}><CrmLegacyRedirect hubPath="/crm" tab="leads" /></Suspense> },
      { path: 'crm/deals',       element: <Suspense fallback={<PageLoader />}><CrmLegacyRedirect hubPath="/crm" tab="deals" /></Suspense> },
      { path: 'crm/meetings',    element: <Suspense fallback={<PageLoader />}><CrmLegacyRedirect hubPath="/crm" tab="meetings" /></Suspense> },
      { path: 'crm/email-sequences', element: <Suspense fallback={<PageLoader />}><CrmLegacyRedirect hubPath="/crm" tab="deals" drawer="sequences" /></Suspense> },
      { path: 'crm/quotes',      element: <Suspense fallback={<PageLoader />}><CrmLegacyRedirect hubPath="/crm/sales" tab="quotes" /></Suspense> },
      { path: 'crm/invoices',    element: <Suspense fallback={<PageLoader />}><CrmLegacyRedirect hubPath="/crm/sales" tab="invoices" /></Suspense> },

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

      { path: 'mkt/insights',     element: <Suspense fallback={<PageLoader />}><InsightsPage /></Suspense> },
      { path: 'mkt/ads',          element: <Suspense fallback={<PageLoader />}><AdsPage /></Suspense> },
      { path: 'mkt/comments',     element: <Suspense fallback={<PageLoader />}><CommentsPage /></Suspense> },
      { path: 'mkt/reviews',      element: <Suspense fallback={<PageLoader />}><ReviewsPage /></Suspense> },
      { path: 'mkt/live',         element: <Suspense fallback={<PageLoader />}><LivePage /></Suspense> },
      // Cần Zalo OA verified + template duyệt trước.
      { path: 'mkt/zalo',         element: <PlaceholderPage title="Zalo OA Broadcast" moduleCode="MKT · ZALO" description="Gửi ZNS theo template đã duyệt. Cần Zalo OA verified + template duyệt trước." /> },

      // AI Automation
      { path: 'ai',               element: <Suspense fallback={<PageLoader />}><AIDashboardPage /></Suspense> },
      { path: 'ai/accounts',      element: <Suspense fallback={<PageLoader />}><AIAccountsPage /></Suspense> },
      { path: 'ai/scan-groups',   element: <Suspense fallback={<PageLoader />}><AIGroupScannerPage /></Suspense> },
      { path: 'ai/poster',        element: <Suspense fallback={<PageLoader />}><AIPosterPage /></Suspense> },
      { path: 'ai/comments',      element: <Suspense fallback={<PageLoader />}><AICommentsPage /></Suspense> },
      { path: 'ai/inbox',         element: <Suspense fallback={<PageLoader />}><AIInboxPage /></Suspense> },
      { path: 'ai/content',       element: <Suspense fallback={<PageLoader />}><AIContentGenPage /></Suspense> },
      { path: 'ai/maps',          element: <Suspense fallback={<PageLoader />}><AIGgMapScannerPage /></Suspense> },

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
