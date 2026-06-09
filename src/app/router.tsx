// ============================================================
// FREZO ERP — Router Configuration
// Protected routes, lazy loading per module
// ============================================================

import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { useAuthStore } from '@/stores/authStore'

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
const LandingConfigPage = lazy(() => import('@/modules/qtht/pages/LandingConfigPage').then(m => ({ default: m.LandingConfigPage })))

// Contracts
const ContractPage    = lazy(() => import('@/modules/contracts/pages/ContractPage').then(m => ({ default: m.ContractPage })))

// QLNS
const PersonsPage     = lazy(() => import('@/modules/qlns/pages/PersonsPage').then(m => ({ default: m.PersonsPage })))
const PayrollsPage    = lazy(() => import('@/modules/qlns/pages/PayrollsPage').then(m => ({ default: m.PayrollsPage })))

// Customers
const CustomersPage   = lazy(() => import('@/modules/customers/pages/CustomersPage').then(m => ({ default: m.CustomersPage })))

// Products
const ProductsPage    = lazy(() => import('@/modules/products/pages/ProductsPage').then(m => ({ default: m.ProductsPage })))

// Tasks
const TasksPage       = lazy(() => import('@/modules/tasks/pages/TasksPage').then(m => ({ default: m.TasksPage })))
const TicketsPage     = lazy(() => import('@/modules/tasks/pages/TicketsPage').then(m => ({ default: m.TicketsPage })))
const TagsPage        = lazy(() => import('@/modules/tasks/pages/TagsPage').then(m => ({ default: m.TagsPage })))
const LeavesPage      = lazy(() => import('@/modules/qlns/pages/LeavesPage').then(m => ({ default: m.LeavesPage })))

// ---- Page loading fallback ----
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-neutral-500">Đang tải...</span>
      </div>
    </div>
  )
}

// ---- Protected Route Guard ----
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
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
      { path: 'qtht/landing-config',element: <Suspense fallback={<PageLoader />}><LandingConfigPage /></Suspense> },

      // QLNS
      { path: 'qlns/persons',     element: <Suspense fallback={<PageLoader />}><PersonsPage /></Suspense> },
      { path: 'qlns/contract',    element: <Suspense fallback={<PageLoader />}><ContractPage /></Suspense> },
      { path: 'qlns/payrolls',    element: <Suspense fallback={<PageLoader />}><PayrollsPage /></Suspense> },

      // Customer
      { path: 'customer',         element: <Suspense fallback={<PageLoader />}><CustomersPage /></Suspense> },

      // Product
      { path: 'product',          element: <Suspense fallback={<PageLoader />}><ProductsPage /></Suspense> },

      // Task
      { path: 'task',             element: <Suspense fallback={<PageLoader />}><TasksPage /></Suspense> },
      { path: 'task/tickets',     element: <Suspense fallback={<PageLoader />}><TicketsPage /></Suspense> },
      { path: 'task/tags',        element: <Suspense fallback={<PageLoader />}><TagsPage /></Suspense> },
      { path: 'qlns/leaves',      element: <Suspense fallback={<PageLoader />}><LeavesPage /></Suspense> },
    ],
  },

  // Catch all
  { path: '*', element: <Navigate to="/" replace /> },
])
