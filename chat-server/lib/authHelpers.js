/**
 * RBAC helper functions for backend.
 * Use with req.admin (JWT-decoded: { username, role, permissions: string[] }).
 */

/**
 * Check if admin has a specific permission.
 * @param {Object} admin - req.admin (role, permissions)
 * @param {string} permission - e.g. 'manage_users', 'edit_content'
 * @returns {boolean}
 */
export function hasPermission(admin, permission) {
  if (!admin) return false
  if (admin.role === 'super_admin') return true
  if (admin.role === 'admin' && !Array.isArray(admin.permissions)) return true
  const perms = admin.permissions || []
  return perms.includes(permission)
}

/**
 * Check if admin has any of the given permissions.
 * @param {Object} admin - req.admin
 * @param {...string} permissions
 * @returns {boolean}
 */
export function hasPermissionAny(admin, ...permissions) {
  if (!admin) return false
  if (admin.role === 'super_admin') return true
  if (admin.role === 'admin' && !Array.isArray(admin.permissions)) return true
  const perms = admin.permissions || []
  return permissions.some((p) => perms.includes(p))
}

/**
 * Check if admin has a specific role (by name).
 * @param {Object} admin - req.admin
 * @param {string} roleName - e.g. 'super_admin', 'admin', 'staff', 'support'
 * @returns {boolean}
 */
export function hasRole(admin, roleName) {
  if (!admin) return false
  return String(admin.role || '').toLowerCase() === String(roleName || '').toLowerCase()
}
