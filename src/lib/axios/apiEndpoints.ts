// ============================================================
// FREZO ERP — API Endpoints Constants
// Centralize all BE endpoint strings
// ============================================================

export const API = {
  // ---- Auth (/auth) ----
  AUTH: {
    LOGIN:         '/auth/login',
    LOGOUT:        '/auth/logout',
    REFRESH:       '/auth/refresh-token',
    PROFILE:       '/auth/profile',
    VERIFY_OTP:    '/auth/verify-otp',
    FORGOT_PW:     '/auth/forgot-password',
    RESET_PW:      '/auth/reset-password',
    LOGIN_HISTORY: '/auth/login-history',
  },

  // ---- QTHT — Quản trị hệ thống ----
  QTHT: {
    // Menu (sidebar dynamic)
    MENU_BY_USER: (username: string) => `/qlht/menus/user/${username}`,
    MENUS:        '/qlht/menus',
    MENU_BY_ID:   (id: string) => `/qlht/menus/${id}`,

    // User admin
    USERS:        '/users/all',
    USER_REGISTER:'/users/register',
    USER_BY_ID:   (id: string) => `/users/${id}`,

    // Roles
    ROLES:        '/qlht/roles',
    ROLE_BY_ID:   (id: string) => `/qlht/roles/${id}`,

    // Role-Menu
    ROLE_MENUS:   '/qlht/role-menus',

    // Permissions
    PERMISSIONS:  '/qlht/permissions',

    // Organization
    ORGS:         '/qlht/organization',
    ORG_BY_ID:    (id: string) => `/qlht/organization/${id}`,

    // Department
    DEPARTMENTS:  '/qlht/departments',
    DEPT_BY_ID:   (id: string) => `/qlht/departments/${id}`,
  },

  // ---- QLNS — Nhân sự ----
  QLNS: {
    CONTRACTS:      '/qlns/contract',
    CONTRACT_BY_ID: (id: string) => `/qlns/contract/${id}`,
    ATTENDANCE:     '/qlns/attendance',
    LEAVE:          '/qlns/leave',
    LEAVE_REQUEST:  '/qlns/leave-request',
    PAYROLL:        '/qlns/payroll',
  },

  // ---- Customer ----
  CUSTOMER: {
    LIST:        '/customer',
    BY_ID:       (id: string) => `/customer/${id}`,
    NCC:         '/ncc',
    NCC_BY_ID:   (id: string) => `/ncc/${id}`,
    VOUCHER:     '/voucher',
    VOUCHER_BY_ID: (id: string) => `/voucher/${id}`,
    AI:          '/customer/ai',
  },

  // ---- Product ----
  PRODUCT: {
    LIST:     '/product',
    BY_ID:    (id: string) => `/product/${id}`,
    ORDERS:   '/api/orders',
    ORDER_BY_ID: (id: string) => `/api/orders/${id}`,
    CART:     '/api/cart',
  },

  // ---- Task ----
  TASK: {
    LIST:       '/api/tasks',
    BY_ID:      (id: string) => `/api/tasks/${id}`,
    STATUS:     (id: string) => `/api/tasks/${id}/status`,
    TICKETS:    '/api/tickets',
    TICKET_BY_ID: (id: string) => `/api/tickets/${id}`,
    TAGS:       '/api/tags',
  },

  // ---- DMDC — Danh mục ----
  DMDC: {
    CATEGORIES:   '/qlht/category',
    CATEGORY_BY_ID: (id: string) => `/qlht/category/${id}`,
    ASSETS:       '/qlts/assets',
    ASSET_BY_ID:  (id: string) => `/qlts/assets/${id}`,
  },

  // ---- Dashboard ----
  DASHBOARD: '/api/dashboard',

  // ---- Notification ----
  NOTIFICATIONS: '/api/notifications',
} as const
