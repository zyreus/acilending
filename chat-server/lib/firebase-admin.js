/**
 * Firebase Admin SDK for User Management.
 * Requires env: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * Or: GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)
 */

let admin = null
let auth = null
let db = null

async function init() {
  if (admin !== null) return { admin, auth, db }
  const projectId = (process.env.FIREBASE_PROJECT_ID || '').trim()
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim()
  let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').trim()
  const credPath = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim()

  if (!projectId && !credPath) return null

  try {
    const firebaseAdmin = (await import('firebase-admin')).default
    if (credPath) {
      admin = firebaseAdmin.initializeApp()
    } else if (projectId && clientEmail && privateKey) {
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n')
      }
      admin = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    } else {
      return null
    }
    auth = admin.auth()
    db = admin.firestore()
    return { admin, auth, db }
  } catch (e) {
    console.error('[firebase-admin] Init failed:', e?.message || e)
    return null
  }
}

/** Lazy init - returns { auth, db } or null */
export async function getFirebaseAdmin() {
  if (admin) return { auth, db }
  return await init()
}

export const ADMIN_USERS_COLLECTION = 'adminUsers'
