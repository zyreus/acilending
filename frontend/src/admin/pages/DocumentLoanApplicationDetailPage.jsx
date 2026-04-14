import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import { useAdminApiAuth } from '../context/useAdminApiAuth.js'
import { admin } from '../components/AdminUi.jsx'
import { AdminPageSkeleton } from '../../components/AppSkeletons.jsx'
import { getLaravelStorageFileUrl } from '../../utils/lendingLaravelApi.js'

function fileUrl(upload) {
  if (!upload) return ''
  if (upload.url) return upload.url
  const p = upload.file_path
  return p ? getLaravelStorageFileUrl(p) : ''
}

export default function DocumentLoanApplicationDetailPage() {
  const { id } = useParams()
  const { showToast } = useToast()
  const { can } = useAdminApiAuth()
  const [loading, setLoading] = useState(true)
  const [app, setApp] = useState(null)
  const [edits, setEdits] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api(`/document-loan-applications/${id}`)
      const row = res?.application
      setApp(row || null)
      const next = {}
      ;(row?.uploaded_documents || []).forEach((u) => {
        next[u.id] = { status: u.status, remarks: u.remarks || '' }
      })
      setEdits(next)
    } catch (e) {
      showToast(e.message, 'error')
      setApp(null)
    } finally {
      setLoading(false)
    }
  }, [id, showToast])

  useEffect(() => {
    load()
  }, [load])

  const saveUpload = async (uploadId) => {
    if (!can('loans.approve')) {
      showToast('You do not have permission to update document status.', 'error')
      return
    }
    const row = edits[uploadId]
    if (!row) return
    try {
      await api(`/uploaded-documents/${uploadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: row.status, remarks: row.remarks || null }),
      })
      showToast('Document updated.', 'success')
      await load()
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  if (!can('loans.view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-600 dark:text-gray-300">You don&apos;t have permission to view this application.</p>
      </div>
    )
  }

  if (loading) {
    return <AdminPageSkeleton className="p-8" />
  }

  if (!app) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-600 dark:text-gray-300">Application not found.</p>
        <Link to="/admin/document-loan-applications" className="mt-4 inline-block text-red-600 hover:underline dark:text-red-400">
          ← Back to list
        </Link>
      </div>
    )
  }

  const uploads = app.uploaded_documents || []

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link to="/admin/document-loan-applications" className="text-sm font-medium text-red-600 hover:underline dark:text-red-400">
        ← Document applications
      </Link>

      <div className="mt-6 flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          #{app.id} — {app.loan_product?.name}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {app.user?.name} · {app.user?.email}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Status: <strong className="text-gray-900 dark:text-white">{app.status}</strong>
          {app.submitted_at ? (
            <>
              {' '}
              · Submitted {new Date(app.submitted_at).toLocaleString()}
            </>
          ) : (
            <span> · Not submitted</span>
          )}
        </p>
      </div>

      {app.signed_form_path || app.signed_form_url ? (
        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 dark:border-emerald-800 dark:bg-emerald-950/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Signed application form</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Status: {app.is_signed ? 'Received' : '—'}
          </p>
          {app.signed_form_url ? (
            <a
              href={app.signed_form_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
            >
              Open signed form
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Requirement uploads</h2>
        {uploads.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No files uploaded yet.</p>
        ) : (
          <ul className="space-y-6">
            {uploads.map((u) => {
              const reqName = u.loan_requirement?.requirement_name || `Requirement #${u.loan_requirement_id}`
              const href = fileUrl(u)
              const e = edits[u.id] || { status: u.status, remarks: u.remarks || '' }
              return (
                <li
                  key={u.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900/50"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{reqName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{u.original_name}</p>
                    </div>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
                      >
                        Open file
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                      <select
                        value={e.status}
                        disabled={!can('loans.approve')}
                        onChange={(ev) =>
                          setEdits((prev) => ({
                            ...prev,
                            [u.id]: { ...e, status: ev.target.value },
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                      >
                        <option value="pending">pending</option>
                        <option value="verified">verified</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Remarks</label>
                      <textarea
                        value={e.remarks}
                        disabled={!can('loans.approve')}
                        onChange={(ev) =>
                          setEdits((prev) => ({
                            ...prev,
                            [u.id]: { ...e, remarks: ev.target.value },
                          }))
                        }
                        rows={2}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  {can('loans.approve') ? (
                    <button type="button" onClick={() => saveUpload(u.id)} className={`mt-4 ${admin.btnPrimary}`}>
                      Save review
                    </button>
                  ) : (
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Read-only (needs loans.approve to update).</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
