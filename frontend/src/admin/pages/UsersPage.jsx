import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import { useAdminApiAuth } from '../context/useAdminApiAuth.js'
import { admin, TableSkeletonRows, EmptyTableRow } from '../components/AdminUi.jsx'

export default function UsersPage() {
  const { showToast } = useToast()
  const { can, user: adminUser } = useAdminApiAuth()
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' })
  const [resetting, setResetting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [roles, setRoles] = useState([])
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    is_active: true,
    role_ids: [],
  })

  const load = async (page = 1) => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), per_page: '50' })
      if (search.trim()) q.set('search', search.trim())
      const res = await api(`/users?${q}`)
      setData(res.data)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
  }, [])

  useEffect(() => {
    if (!can('users.manage')) return
    ;(async () => {
      try {
        const res = await api('/roles')
        setRoles(res.data || [])
      } catch {
        setRoles([])
      }
    })()
  }, [can])

  const rows = data?.data || []
  const canResetPasswords = can('roles.manage') || can('users.manage')
  const canDeleteUsers = can('users.manage')

  const confirmDelete = async (u) => {
    if (!canDeleteUsers || !u?.id) return
    if (adminUser?.id != null && Number(u.id) === Number(adminUser.id)) {
      showToast('You cannot delete your own account.', 'error')
      return
    }
    const loanHint =
      u.loans_count > 0
        ? ` This user has ${u.loans_count} loan record(s) — deletion may fail if the database blocks it.`
        : ''
    if (
      !window.confirm(
        `Permanently delete ${u.name} (${u.email})? This cannot be undone.${loanHint}`,
      )
    ) {
      return
    }
    setDeletingId(u.id)
    try {
      await api(`/users/${u.id}`, { method: 'DELETE' })
      showToast('User account deleted.', 'success')
      load(data?.current_page || 1)
    } catch (err) {
      showToast(err.message || 'Failed to delete user.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleRole = (roleId) => {
    setForm((prev) => ({
      ...prev,
      role_ids: prev.role_ids.includes(roleId)
        ? prev.role_ids.filter((id) => id !== roleId)
        : [...prev.role_ids, roleId],
    }))
  }

  const submitCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      showToast('Name, email, and password are required.', 'error')
      return
    }
    setCreating(true)
    try {
      await api('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || null,
          is_active: form.is_active,
          role_ids: form.role_ids,
        }),
      })
      showToast('User created successfully.', 'success')
      setShowCreate(false)
      setForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        is_active: true,
        role_ids: [],
      })
      load(1)
    } catch (e2) {
      showToast(e2.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  const openResetModal = (user) => {
    setResetTarget(user)
    setResetForm({ password: '', confirmPassword: '' })
  }

  const submitResetPassword = async (e) => {
    e.preventDefault()
    if (!resetTarget?.id) return
    if (!resetForm.password.trim()) {
      showToast('New password is required.', 'error')
      return
    }
    if (resetForm.password.length < 8) {
      showToast('Password must be at least 8 characters.', 'error')
      return
    }
    if (resetForm.password !== resetForm.confirmPassword) {
      showToast('Passwords do not match.', 'error')
      return
    }
    setResetting(true)
    try {
      await api(`/users/${resetTarget.id}`, {
        method: 'PUT',
        body: JSON.stringify({ password: resetForm.password }),
      })
      showToast(`Password updated for ${resetTarget.name}.`, 'success')
      setResetTarget(null)
    } catch (err) {
      showToast(err.message || 'Failed to update password.', 'error')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={admin.pageTitle}>Users</h1>
          <p className={admin.pageSubtitle}>
            All accounts (staff, administrators, and borrowers). Same database table as Borrowers — search covers name,
            email, phone, and username. Co-maker details are not stored on user profiles; they appear on each loan
            application and printed form.
          </p>
        </div>
        {can('users.manage') && (
          <button type="button" onClick={() => setShowCreate(true)} className={admin.btnPrimary}>
            Create User
          </button>
        )}
      </div>

      <form
        className="flex min-w-0 flex-col gap-2 p-1 sm:flex-row sm:flex-wrap sm:items-center"
        onSubmit={(e) => {
          e.preventDefault()
          load(1)
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, or username…"
          className={`min-w-0 w-full flex-1 sm:min-w-[200px] ${admin.input}`}
        />
        <button type="submit" className={`${admin.btnPrimary} w-full sm:w-auto`}>
          Search
        </button>
      </form>

      <div className="space-y-3 lg:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${admin.cardNoHover} p-4`}>
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-[#1F2937]" />
              <div className="mt-2 h-3 w-48 animate-pulse rounded bg-gray-200 dark:bg-[#1F2937]" />
              <div className="mt-3 h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-[#1F2937]" />
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className={`${admin.cardNoHover} p-4 text-sm ${admin.textMuted}`}>No users found.</div>
        ) : (
          rows.map((u) => (
            <div key={u.id} className={`${admin.cardNoHover} space-y-2 p-4`}>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{u.name}</p>
              <p className={`text-xs break-words ${admin.tableMuted}`}>{u.email}</p>
              <p className={`text-xs ${admin.tableMuted}`}>{(u.roles || []).map((r) => r.name).join(', ') || '—'}</p>
              {u.loans_count != null && u.loans_count > 0 ? (
                <p className={`text-xs ${admin.tableMuted}`}>
                  Loans: {u.loans_count}{' '}
                  <Link className="text-red-600 hover:underline dark:text-red-400" to={`/admin/borrowers/${u.id}`}>
                    View borrower
                  </Link>
                </p>
              ) : null}
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  u.is_active
                    ? 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300'
                    : 'bg-gray-200 text-gray-600 dark:bg-[#1F2937] dark:text-gray-400'
                }`}
              >
                {u.is_active ? 'Active' : 'Inactive'}
              </span>
              <div className="flex flex-wrap gap-2">
                {canResetPasswords ? (
                  <button
                    type="button"
                    onClick={() => openResetModal(u)}
                    className="inline-flex rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 transition hover:bg-gray-100 dark:border-[#1F2937] dark:bg-[#111827] dark:text-gray-100 dark:hover:bg-[#1F2937]"
                  >
                    Change Password
                  </button>
                ) : null}
                {canDeleteUsers && adminUser?.id != null && Number(u.id) !== Number(adminUser.id) ? (
                  <button
                    type="button"
                    disabled={deletingId === u.id}
                    onClick={() => confirmDelete(u)}
                    className="inline-flex rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
                  >
                    {deletingId === u.id ? 'Deleting…' : 'Delete'}
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      <div className={`hidden lg:block ${admin.tableWrap}`}>
        <table className={`${admin.tableBase} ${admin.tableText} ${admin.tableMin720}`}>
          <thead>
            <tr className={admin.thead}>
              <th className={admin.tableCell}>Name</th>
              <th className={admin.tableCell}>Email</th>
              <th className={admin.tableCell}>Roles</th>
              <th className={`${admin.tableCell} tabular-nums`}>Loans</th>
              <th className={admin.tableCell}>Status</th>
              {canResetPasswords || canDeleteUsers ? (
                <th className={`${admin.tableCell} text-right`}>Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows cols={canResetPasswords || canDeleteUsers ? 6 : 5} rows={6} />
            ) : rows.length === 0 ? (
              <EmptyTableRow
                colSpan={canResetPasswords || canDeleteUsers ? 6 : 5}
                message="No users found."
              />
            ) : (
              rows.map((u) => (
                <tr key={u.id} className={admin.tbodyRow}>
                  <td className={`${admin.tableCell} font-medium`}>
                    <span className="block">{u.name}</span>
                    {u.loans_count > 0 ? (
                      <Link
                        className="mt-0.5 inline-block text-xs font-normal text-red-600 hover:underline dark:text-red-400"
                        to={`/admin/borrowers/${u.id}`}
                      >
                        Borrower profile →
                      </Link>
                    ) : null}
                  </td>
                  <td className={`${admin.tableCell} ${admin.tableMuted}`}>{u.email}</td>
                  <td className={`${admin.tableCell} ${admin.tableMuted}`}>
                    {(u.roles || []).map((r) => r.name).join(', ') || '—'}
                  </td>
                  <td className={`${admin.tableCell} tabular-nums ${admin.tableMuted}`}>
                    {u.loans_count != null ? u.loans_count : '—'}
                  </td>
                  <td className={admin.tableCell}>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.is_active
                          ? 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300'
                          : 'bg-gray-200 text-gray-600 dark:bg-[#1F2937] dark:text-gray-400'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {canResetPasswords || canDeleteUsers ? (
                    <td className={`${admin.tableCell} text-right`}>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {canResetPasswords ? (
                          <button
                            type="button"
                            onClick={() => openResetModal(u)}
                            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-800 transition hover:bg-gray-100 dark:border-[#1F2937] dark:bg-[#111827] dark:text-gray-100 dark:hover:bg-[#1F2937]"
                          >
                            Change Password
                          </button>
                        ) : null}
                        {canDeleteUsers && adminUser?.id != null && Number(u.id) !== Number(adminUser.id) ? (
                          <button
                            type="button"
                            disabled={deletingId === u.id}
                            onClick={() => confirmDelete(u)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
                          >
                            {deletingId === u.id ? 'Deleting…' : 'Delete'}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.last_page > 1 && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={data.current_page <= 1}
            onClick={() => load(data.current_page - 1)}
            className={admin.paginationBtn}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={data.current_page >= data.last_page}
            onClick={() => load(data.current_page + 1)}
            className={admin.paginationBtn}
          >
            Next
          </button>
        </div>
      )}

      {showCreate && (
        <div className={admin.modalOverlay}>
          <div className={`${admin.modalCard} max-w-xl`}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create User</h2>
            <p className={`mt-1 text-xs ${admin.textMuted}`}>Add a staff or administrator account and assign roles.</p>

            <form className="mt-4 space-y-3" onSubmit={submitCreate}>
              <input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="Full name"
                className={`w-full ${admin.input}`}
              />
              <input
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                placeholder="Email"
                type="email"
                className={`w-full ${admin.input}`}
              />
              <input
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                placeholder="Password (minimum 8 characters)"
                type="password"
                className={`w-full ${admin.input}`}
              />
              <input
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                placeholder="Phone (optional)"
                className={`w-full ${admin.input}`}
              />

              <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-100">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
                />
                Active account
              </label>

              <div className={admin.insetPanel}>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${admin.textMuted}`}>Roles</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {roles.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-100">
                      <input
                        type="checkbox"
                        checked={form.role_ids.includes(r.id)}
                        onChange={() => toggleRole(r.id)}
                      />
                      <span>{r.name}</span>
                      <span className={`text-xs ${admin.textMuted}`}>({r.slug})</span>
                    </label>
                  ))}
                  {roles.length === 0 && (
                    <p className={`text-xs ${admin.textMuted}`}>
                      Roles unavailable (missing permission to list roles). The user can still be created.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className={`${admin.btnPrimary} disabled:opacity-50`}
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className={admin.btnSecondary}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetTarget && (
        <div className={admin.modalOverlay}>
          <div className={`${admin.modalCard} max-w-md`}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Change User Password</h2>
            <p className={`mt-1 text-xs ${admin.textMuted}`}>
              Super Admin action for <span className="font-semibold">{resetTarget.name}</span> ({resetTarget.email})
            </p>
            <form className="mt-4 space-y-3" onSubmit={submitResetPassword}>
              <input
                value={resetForm.password}
                onChange={(e) => setResetForm((s) => ({ ...s, password: e.target.value }))}
                placeholder="New password (minimum 8 characters)"
                type="password"
                className={`w-full ${admin.input}`}
              />
              <input
                value={resetForm.confirmPassword}
                onChange={(e) => setResetForm((s) => ({ ...s, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
                type="password"
                className={`w-full ${admin.input}`}
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={resetting} className={`${admin.btnPrimary} disabled:opacity-50`}>
                  {resetting ? 'Updating…' : 'Update Password'}
                </button>
                <button type="button" onClick={() => setResetTarget(null)} className={admin.btnSecondary}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
