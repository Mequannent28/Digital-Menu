/**
 * useRole — central role & permission hook
 * Import this anywhere in admin to check what the current user can do.
 */

// ── Permission map ────────────────────────────────────────────────────────────
// Each role lists the exact nav routes it can access.
// '*' means unrestricted (admin / barista / manager gets full access)
export const ROLE_PERMISSIONS = {
  admin: {
    label: 'Admin',
    icon: '👑',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    routes: '*',                   // all routes allowed
    canManageMenu:    true,
    canManageUsers:   true,
    canManageSettings:true,
    canViewReports:   true,
    canViewReviews:   true,
    canManageTables:  true,
    canViewOrders:    true,        // all orders
    canUpdateStatus:  true,
    homeRoute: '/admin',
  },
  manager: {
    label: 'Manager',
    icon: '💼',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    routes: [
      '/admin', '/admin/orders', '/admin/kitchen',
      '/admin/categories', '/admin/menu-items', '/admin/modifiers',
      '/admin/tables', '/admin/qr-codes',
      '/admin/reports', '/admin/reviews',
    ],
    canManageMenu:    true,
    canManageUsers:   false,       // cannot add/delete users
    canManageSettings:false,       // cannot change restaurant settings
    canViewReports:   true,
    canViewReviews:   true,
    canManageTables:  true,
    canViewOrders:    true,        // all orders
    canUpdateStatus:  true,
    homeRoute: '/admin',
  },
  barista: {
    label: 'Barista',
    icon: '☕',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    routes: [
      '/admin', '/admin/orders', '/admin/kitchen',
      '/admin/categories', '/admin/menu-items', '/admin/modifiers',
      '/admin/tables', '/admin/qr-codes',
      '/admin/reports', '/admin/reviews',
    ],
    canManageMenu:    true,
    canManageUsers:   false,
    canManageSettings:false,
    canViewReports:   true,
    canViewReviews:   true,
    canManageTables:  true,
    canViewOrders:    true,
    canUpdateStatus:  true,
    homeRoute: '/admin',
  },
  kitchen: {
    label: 'Kitchen',
    icon: '👨‍🍳',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    routes: ['/admin', '/admin/orders', '/admin/kitchen'],
    canManageMenu:    false,
    canManageUsers:   false,
    canManageSettings:false,
    canViewReports:   false,
    canViewReviews:   false,
    canManageTables:  false,
    canViewOrders:    true,        // all orders (kitchen sees all)
    canUpdateStatus:  true,        // can advance order status
    homeRoute: '/admin/kitchen',
  },
  waiter: {
    label: 'Waiter',
    icon: '🛎️',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    routes: ['/admin', '/admin/orders', '/admin/reviews'],
    canManageMenu:    false,
    canManageUsers:   false,
    canManageSettings:false,
    canViewReports:   false,
    canViewReviews:   true,        // can read reviews (customer feedback)
    canManageTables:  false,
    canViewOrders:    'own',       // only orders assigned to their table
    canUpdateStatus:  true,        // can mark as served
    homeRoute: '/admin/orders',
  },
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useRole() {
  try {
    const user = JSON.parse(localStorage.getItem('admin-user') || '{}')
    const role = (user?.role || 'admin').toLowerCase()
    const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.admin
    return {
      user,
      role,
      perms,
      isAdmin:   role === 'admin',
      isManager: role === 'manager',
      isKitchen: role === 'kitchen',
      isWaiter:  role === 'waiter',
      isBarista: role === 'barista',
      // Check if a specific route is accessible
      canAccess: (path) => {
        if (perms.routes === '*') return true
        return perms.routes.some(r => path.startsWith(r))
      },
    }
  } catch {
    return {
      user: {}, role: 'admin', perms: ROLE_PERMISSIONS.admin,
      isAdmin: true, isManager: false, isKitchen: false, isWaiter: false, isBarista: false,
      canAccess: () => true,
    }
  }
}
