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
    AVATAR_UPLOAD: '/auth/avatar',
  },

  // ---- Sessions (/auth/session) ----
  SESSIONS: {
    ACTIVE:      '/auth/session/active',
    ACTIVE_PAGED:'/auth/session/active/paged',
    REVOKE:      (id: string) => `/auth/session/revoke/${id}`,
    REVOKE_ALL:  '/auth/session/revoke-all',
    COUNT:       '/auth/session/count',
  },

  // ---- Statistics (/auth/statistic) ----
  STATISTICS: {
    LOGIN_BY_DAY: '/auth/statistic/login-by-day',
  },

  // ---- Person Document ----
  PERSON_DOCUMENT: {
    LIST:      (personId: string) => `/qtht/person-document/${personId}`,
    UPLOAD:    (personId: string) => `/qtht/person-document/${personId}/upload`,
    DELETE:    (personId: string, docId: string) => `/qtht/person-document/${personId}/${docId}`,
  },

  // ---- QTHT — Quản trị hệ thống ----
  QTHT: {
    MENU_BY_USER: (username: string) => `/qtht/menu/user/${username}`,
    MENUS:        '/qtht/menu',
    MENU_BY_ID:   (id: string) => `/qtht/menu/${id}`,
    USERS:        '/qtht/user/all',
    USER_REGISTER:'/qtht/user/register',
    USER_BY_ID:   (id: string) => `/qtht/user/${id}`,
    USER_ROLES:   (username: string) => `/qtht/user/${username}/roles`,
    USER_ASSIGN_ROLE: '/qtht/user/assign-role',
    ROLES:        '/qtht/role',
    ROLE_COMBOBOX:'/qtht/role/combobox',
    ROLE_MENUS:   '/qtht/role-menu',
    PERMISSIONS:  '/qtht/permission',
    ORGS:         '/qtht/organization',
    ORG_BY_ID:    (id: string) => `/qtht/organization/${id}`,
    DEPARTMENTS:  '/qtht/department',
    DEPT_BY_ID:   (id: string) => `/qtht/department/${id}`,
    CATEGORIES:   '/qtht/category',
    CATEGORY_BY_ID: (id: string) => `/qtht/category/${id}`,
  },

  // ---- QLNS — Nhân sự ----
  QLNS: {
    CONTRACTS:        '/qlns/contract',
    CONTRACT_BY_ID:   (id: string) => `/qlns/contract/${id}`,
    CONTRACT_COMBOBOX:'/qlns/contract/combobox',
    CONTRACT_ASSIGN:  (id: string) => `/qlns/contract/${id}/assign`,
    CONTRACT_STATUS:  (id: string) => `/qlns/contract/${id}/update-status`,
    CONTRACT_REJECT:  (id: string) => `/qlns/contract/${id}/reject`,
    CONTRACT_UPLOAD:  '/qlns/contract/upload',
    CONTRACT_UPLOAD_AND_EXTRACT: '/qlns/contract/upload-and-extract',
    CONTRACT_SAVE_CONTENT: (id: string) => `/qlns/contract/${id}/save-content`,
    CONTRACT_VERSIONS:  (id: string) => `/qlns/contract/${id}/versions`,
    CONTRACT_VERSIONS_DIFF: (id: string) => `/qlns/contract/${id}/versions/diff`,
    ATTENDANCE:     '/qlns/attendance',
    ATTENDANCE_BY_ID: (id: string) => `/qlns/attendance/${id}`,
    ATTENDANCE_CHECKIN:  '/qlns/attendance/check-in',
    ATTENDANCE_CHECKOUT: '/qlns/attendance/check-out',
    LEAVE:          '/qlns/leave',
    LEAVE_APPROVE:  (id: string) => `/qlns/leave/${id}/approve`,
    LEAVE_BY_PERSON: (personId: string) => `/qlns/leave/person/${personId}`,
    LEAVE_REQUEST:  '/qlns/leave-request',
    LEAVE_REQUEST_MY: (contractId: string) => `/qlns/leave-request/my/${contractId}`,
    LEAVE_REQUEST_PENDING: '/qlns/leave-request/pending',
    LEAVE_REQUEST_APPROVE: (id: string) => `/qlns/leave-request/${id}/approve`,
    LEAVE_REQUEST_REJECT: (id: string) => `/qlns/leave-request/${id}/reject`,
    PAYROLL:        '/qlns/payroll',
    PAYROLL_BY_ID:  (id: string) => `/qlns/payroll/${id}`,
    PAYROLL_CALCULATE: (personId: string) => `/qlns/payroll/calculate/${personId}`,
    PAYROLL_CALCULATE_ALL: '/qlns/payroll/calculate-all',
    PAYROLL_BONUS:  (id: string) => `/qlns/payroll/${id}/bonus`,
    PAYROLL_CONFIRM:(id: string) => `/qlns/payroll/${id}/confirm`,
    PAYROLL_PAY:    (id: string) => `/qlns/payroll/${id}/pay`,
    PERSON_ALL:     '/qlns/person/all',
    PERSON:         '/qlns/person',
    PERSON_BY_ID:   (id: string) => `/qlns/person/${id}`,
    PERSON_COMBOBOX:'/qlns/person/combobox',
    PERSON_ACTIVATE:  (id: string) => `/qlns/person/${id}/activate`,
    PERSON_DEACTIVATE:(id: string) => `/qlns/person/${id}/deactivate`,
    PERSON_UPLOAD_AVATAR: '/qlns/person/upload-avatar-temp',
  },

  // ---- Customer ----
  CUSTOMER: {
    LIST:        '/customer',
    BY_ID:       (id: string) => `/customer/${id}`,
    REVEAL_PHONE:(id: string) => `/customer/${id}/reveal-phone`,
    IMPORT:      '/customer/import',
    EXPORT:      '/customer/export',
    AI_SYNC:     '/customer/ai/sync',
    NCC_LIST:    '/customer/ncc/all',
    NCC_BY_ID:   (id: string) => `/customer/ncc/${id}`,
    NCC:         '/customer/ncc',
    NCC_UPLOAD_CERT: '/customer/ncc/upload-certificate',
    VOUCHER:     '/customer/voucher',
    VOUCHER_BY_ID: (id: string) => `/customer/voucher/${id}`,
    VOUCHER_VALIDATE: '/customer/voucher/validate',
  },

  // ---- Product ----
  PRODUCT: {
    LIST:         '/product',
    BY_ID:        (id: string) => `/product/${id}`,
    FILTER:       '/product/filter',
    BULK_PRICES:  '/product/bulk-update-prices',
    IMPORT_BATCH: '/product/import-batch',
    CALC_PRICE:   '/product/calculate-price',
    PROFIT_CHART: '/product/dashboard/profit-chart',
    PRICE_FLUCTUATION: '/product/dashboard/price-fluctuation',
    MARKET_COMPARISON: '/product/dashboard/market-comparison',
    ORDERS:       '/product/order',
    ORDER_CHECKOUT:(customerId: string) => `/product/order/checkout/${customerId}`,
    CART:         '/product/cart',
    CART_ADD:     (customerId: string) => `/product/cart/${customerId}/add`,
    CART_CLEAR:   (customerId: string) => `/product/cart/${customerId}/clear`,
  },

  // ---- Task ----
  TASK: {
    LIST:          '/task/task',
    BY_ID:         (id: string) => `/task/task/${id}`,
    ASSIGN:        (id: string, assignee: string) => `/task/task/${id}/assign/${assignee}`,
    STATUS:        (id: string) => `/task/task/${id}/status`,
    TICKETS:       '/task/ticket',
    TICKET_BY_ID:  (id: string) => `/task/ticket/${id}`,
    TICKET_ASSIGN: (id: string, assignee: string) => `/task/ticket/${id}/assign/${assignee}`,
    TICKET_STATUS: (id: string) => `/task/ticket/${id}/status`,
    TAGS:          '/task/tag',
  },

  // ---- Dashboard ----
  DASHBOARD: {
    SUMMARY:  '/qtht/dashboard/summary',
    EXPORT_ATTENDANCE: '/qtht/dashboard/export/attendance',
  },

  // ---- Notification ----
  NOTIFICATIONS: {
    MY:    '/qtht/notification/my',
    READ:  (id: string) => `/qtht/notification/${id}/read`,
  },

  // ---- API Logs ----
  API_LOGS: {
    LIST:    '/qtht/api-log',
    STATS:   '/qtht/api-log/stats',
    BY_ID:   (id: string) => `/qtht/api-log/${id}`,
    BULK:    (days: number) => `/qtht/api-log/bulk/${days}`,
  },

  // ---- Settings ----
  SETTINGS: {
    LIST:     '/qtht/setting',
    BY_ID:    (id: string) => `/qtht/setting/${id}`,
    BY_ORG:   (orgId: string) => `/qtht/setting/org/${orgId}`,
  },

  // ---- System ----
  SYSTEM: {
    BACKUP:   '/qtht/system/backup',
  },

  // ---- Landing ----
  LANDING: {
    CONFIG:   '/qtbv/landing-config',
  },

  // ---- Public ----
  PUBLIC: {
    LANDING_CONFIG: '/public/landing/config',
    PRODUCT_FILTER: '/public/product/filter',
    PRODUCT_BY_ID:  (id: string) => `/public/product/${id}`,
    ARTICLES:       '/public/articles',
    ARTICLE_BY_ID:  (id: string) => `/public/articles/${id}`,
  },

  // ---- Security ----
  SECURITY: {
    IP_BLACKLIST:     '/qtht/ip-blacklist',
    IP_BLACKLIST_BAN: '/qtht/ip-blacklist/ban',
    IP_BLACKLIST_UNBAN: (id: string) => `/qtht/ip-blacklist/unban/${id}`,
    IP_WHITELIST:     '/qtht/ip-whitelist',
    IP_WHITELIST_CHECK:'/qtht/ip-whitelist/check',
    IP_WHITELIST_BY_ID: (id: string) => `/qtht/ip-whitelist/${id}`,
    IP_TRUST:         '/qtht/ip-trust',
    IP_TRUST_BY_ID:   (id: string) => `/qtht/ip-trust/${id}`,
    GATEWAY_BLACKLIST:'/qtht/internal-gateway/blacklist',
    GATEWAY_WHITELIST:'/qtht/internal-gateway/whitelist',
    GATEWAY_BLOCK_IP: '/qtht/internal-gateway/block-ip',
  },

  // ---- Email ----
  EMAIL: {
    TEMPLATES:        '/email/template',
    TEMPLATE_BY_ID:   (id: string) => `/email/template/${id}`,
    CONFIGS:          '/email/config',
    CONFIG_BY_ID:     (id: string) => `/email/config/${id}`,
    CONFIG_ACTIVATE:  (id: string) => `/email/config/${id}/activate`,
    CONFIG_DEACTIVATE:(id: string) => `/email/config/${id}/deactivate`,
    CONFIG_TEST:      (id: string) => `/email/config/${id}/test-connection`,
  },

  // ---- Audit ----
  AUDIT: {
    LIST:   '/qtht/audit-log',
    HEALTH: '/qtht/audit-log/health',
  },

  // ---- AI ----
  AI: {
    DOC_ANALYZE: '/ai/doc/analyze',
    DOC_REVIEW:  '/ai/doc/review',
  },

  // ---- CMS ----
  CMS: {
    VOUCHERS:         '/cms/voucher',
    VOUCHER_STATUS:   (id: string) => `/cms/voucher/${id}/status`,
    CUSTOMERS_EXPORT: '/cms/customer/export',
    ORDERS_PAYMENT:   '/cms/order/payment-status',
  },

  // ---- Assets ----
  ASSETS: {
    LIST:   '/qlts/asset',
    BY_ID:  (id: string) => `/qlts/asset/${id}`,
  },

  // ---- WebSocket ----
  WEBSOCKET: {
    CHANNELS: '/qtht/websocket-channel',
    TEST_TOPIC: (topic: string) => `/qtht/test-ws/topic/${topic}`,
    TEST_USER:  (username: string, dest: string) => `/qtht/test-ws/user/${username}/${dest}`,
  },
} as const
