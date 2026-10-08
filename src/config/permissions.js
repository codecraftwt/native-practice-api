// Role → permission map (see docs/specs/roles-permissions.md)
// authorize('perm') resolves the caller's role against this map.

const ROLES = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'WAITER', 'CASHIER', 'KITCHEN', 'CUSTOMER'];

const STAFF_ROLES = ['OWNER', 'MANAGER', 'WAITER', 'CASHIER', 'KITCHEN'];

const PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  OWNER: [
    'settings:update',
    'staff:list',
    'staff:create',
    'staff:update',
    'staff:delete',
    'staff:role',
    'tables:view',
    'tables:manage',
    'tables:status',
    'menu:read',
    'menu:crud',
    'orders:view',
    'orders:create',
    'orders:update',
    'orders:cancel',
    'kitchen:view',
    'kitchen:advance',
    'billing:view',
    'billing:generate',
    'payments:process',
    'reports:view',
    'dashboard:view',
  ],
  MANAGER: [
    'staff:list',
    'staff:create',
    'staff:update',
    'staff:delete',
    'tables:view',
    'tables:manage',
    'tables:status',
    'menu:read',
    'menu:crud',
    'orders:view',
    'orders:create',
    'orders:update',
    'orders:cancel',
    'kitchen:view',
    'kitchen:advance',
    'billing:view',
    'billing:generate',
    'payments:process',
    'reports:view',
    'dashboard:view',
  ],
  WAITER: [
    'tables:view',
    'tables:status',
    'menu:read',
    'orders:view',
    'orders:create',
    'orders:update',
    'orders:cancel',
    'kitchen:view',
  ],
  CASHIER: [
    'tables:view',
    'tables:status',
    'menu:read',
    'orders:view',
    'orders:update',
    'orders:cancel',
    'kitchen:view',
    'billing:view',
    'billing:generate',
    'payments:process',
    'dashboard:view',
  ],
  KITCHEN: ['tables:view', 'menu:read', 'orders:view', 'kitchen:view', 'kitchen:advance'],
  CUSTOMER: ['menu:read', 'orders:create'],
};

const hasPermission = (role, permission) => {
  const granted = PERMISSIONS[role];
  if (!granted) {
    return false;
  }
  return granted.includes('*') || granted.includes(permission);
};

module.exports = { ROLES, STAFF_ROLES, PERMISSIONS, hasPermission };
