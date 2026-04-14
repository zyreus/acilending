/**
 * Server-side role permissions. Mirrors src/utils/rolePermissions.js
 * Use getPermissionsByRole(role) when saving user to Firestore.
 */

const PERMISSION_KEYS = [
  'manage_applications',
  'manage_partnerships',
  'manage_settings',
  'manage_tickets',
  'manage_users',
  'view_dashboard',
]

const FULL_ACCESS_ROLES = new Set(['super_admin', 'admin'])

const STAFF_PERMISSIONS = {
  manage_applications: true,
  manage_partnerships: true,
  manage_settings: false,
  manage_tickets: true,
  manage_users: false,
  view_dashboard: true,
}

const SUPPORT_PERMISSIONS = {
  manage_applications: false,
  manage_partnerships: false,
  manage_settings: false,
  manage_tickets: true,
  manage_users: false,
  view_dashboard: true,
}

function getPermissionsByRole(role) {
  const normalized = String(role || '').toLowerCase().trim()
  if (FULL_ACCESS_ROLES.has(normalized)) {
    return PERMISSION_KEYS.reduce((acc, key) => ({ ...acc, [key]: true }), {})
  }
  if (normalized === 'staff') return { ...STAFF_PERMISSIONS }
  if (normalized === 'support') return { ...SUPPORT_PERMISSIONS }
  return { ...SUPPORT_PERMISSIONS }
}

export { getPermissionsByRole, PERMISSION_KEYS }
