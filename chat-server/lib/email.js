/**
 * Email notification service for Careers & News subscriptions.
 * Priority order (first configured wins):
 *   1. Brevo API:    BREVO_API_KEY
 *   2. MailerSend:   MAILERSEND_API_KEY
 *   3. Resend API:   RESEND_API_KEY
 *   4. SMTP relay:   SMTP_HOST + SMTP_USER + SMTP_PASS
 *                    (use smtp-relay.brevo.com with your Brevo SMTP credentials)
 */

import nodemailer from 'nodemailer'
import { Resend } from 'resend'

let transporter = null
let resendClient = null

function getMailerSendApiKey() {
  return (process.env.MAILERSEND_API_KEY || '').trim() || null
}

async function sendViaMailerSend(options) {
  const key = getMailerSendApiKey()
  if (!key) return null
  const from = options.from || process.env.MAIL_FROM || 'noreply@localhost'
  const match = String(from).match(/^(.+?)\s*<([^>]+)>$/)
  const fromEmail = match ? match[2].trim() : String(from).trim()
  const fromName = match ? match[1].trim() : 'Amalgated Holdings'
  const res = await fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { email: fromEmail, name: fromName },
      to: [{ email: options.to }],
      subject: options.subject,
      html: options.html,
      text: options.text || undefined,
    }),
  })
  const text = await res.text()
  if (!res.ok) {
    let errMsg = `MailerSend ${res.status}`
    try {
      const err = JSON.parse(text || '{}')
      errMsg = err.message || err.errors?.[0]?.message || errMsg
    } catch {
      /* non-JSON error body */
    }
    throw new Error(errMsg)
  }
  return { message_id: res.headers.get('x-message-id') }
}

function getBrevoApiKey() {
  return (process.env.BREVO_API_KEY || '').trim() || null
}

async function sendViaBrevo(options) {
  const key = getBrevoApiKey()
  if (!key) return null
  const fromAddr = options.from || process.env.MAIL_FROM || 'noreply@localhost'
  const match = fromAddr.match(/^(.+?)\s*<([^>]+)>$/)
  const senderName = match ? match[1].trim() : 'Amalgated Holdings'
  const senderEmail = match ? match[2].trim() : fromAddr
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text || undefined,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || data.code || `Brevo API ${res.status}`)
  return data
}

function getResend() {
  if (resendClient !== null) return resendClient
  const key = (process.env.RESEND_API_KEY || '').trim()
  if (!key) return null
  resendClient = new Resend(key)
  return resendClient
}

function getTransporter() {
  if (transporter !== null) return transporter
  const host = (process.env.SMTP_HOST || '').trim()
  if (!host || host.includes('gmail.com')) return null
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || '',
        }
      : undefined,
  })
  return transporter
}

export function isEmailConfigured() {
  if (getBrevoApiKey()) return true
  if (getMailerSendApiKey()) return true
  if ((process.env.RESEND_API_KEY || '').trim()) return true
  const host = (process.env.SMTP_HOST || '').trim()
  if (!host) return false
  if (host.includes('gmail.com')) return false
  return true
}

export function getBaseUrl(port = process.env.PORT || 8000) {
  const base = (process.env.SITE_URL || '').replace(/\/$/, '')
  return base || `http://localhost:${port}`
}

export function buildUnsubscribeUrl(token, port) {
  return `${getBaseUrl(port)}/api/unsubscribe/${token}`
}

export function buildReadMoreUrl(type, port) {
  const base = getBaseUrl(port)
  if (type === 'careers') return `${base}/careers`
  if (type === 'news') return `${base}/news`
  return `${base}/news`
}

/** Logo URL for subscriber emails. Uses EMAIL_LOGO_URL or SITE_URL + /Amalgated_holdings.png */
function getEmailLogoUrl(port) {
  const custom = (process.env.EMAIL_LOGO_URL || '').trim()
  if (custom) return custom
  return `${getBaseUrl(port)}/Amalgated_holdings.png`
}

const DELAY_MS = 150

/** Ensure from address is valid: email@domain.com or "Name" <email@domain.com> */
function normalizeFrom(addr) {
  if (!addr || typeof addr !== 'string') return 'noreply@localhost'
  const s = addr.trim()
  const match = s.match(/<?([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/)
  const email = match ? match[1] : s
  const nameMatch = s.match(/^["']?([^"'<]+)["']?\s*</)
  const name = nameMatch ? nameMatch[1].trim() : 'Amalgated Holdings'
  return `${name} <${email}>`
}

function escapeHtml(s) {
  if (s == null || typeof s !== 'string') return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function sendOne(options) {
  const fromAddr = options.from || process.env.MAIL_FROM || process.env.BREVO_FROM || process.env.MAILERSEND_FROM || process.env.RESEND_FROM || 'noreply@localhost'
  const from = normalizeFrom(fromAddr)

  // 1. Brevo API (preferred)
  if (getBrevoApiKey()) {
    return sendViaBrevo({ ...options, from })
  }
  // 2. MailerSend API
  if (getMailerSendApiKey()) {
    return sendViaMailerSend({ ...options, from })
  }
  // 3. Resend API
  const resend = getResend()
  if (resend) {
    const { data, error } = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })
    if (error) throw new Error(error.message)
    return data
  }
  // 4. SMTP relay (Brevo smtp-relay.brevo.com or any other provider)
  const trans = getTransporter()
  if (!trans) return null
  return trans.sendMail({ ...options, from })
}

/**
 * Send a custom email (subject + html/text). Used for admin-composed messages.
 */
export async function sendCustomEmail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || process.env.BREVO_FROM || process.env.SMTP_USER || 'noreply@localhost'
  return sendOne({ from, to, subject, html, text })
}

/**
 * Send confirmation email to applicant after they submit a job application.
 * @param {{ to: string, applicantName: string, jobTitle: string }} opts
 */
export async function sendApplicationConfirmationEmail({ to, applicantName, jobTitle }) {
  const from = process.env.MAIL_FROM || process.env.BREVO_FROM || process.env.SMTP_USER || process.env.MAILERSEND_FROM || process.env.RESEND_FROM || 'noreply@localhost'
  const logoUrl = getEmailLogoUrl()
  const safeName = escapeHtml(applicantName || 'Applicant')
  const safeTitle = escapeHtml(jobTitle || 'your application')
  const subject = `Application received – Amalgated Holdings`
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Application Received</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
  <div style="margin-bottom: 24px;">
    <img src="${logoUrl}" alt="Amalgated Holdings" style="height: 48px; width: auto; display: block;" />
  </div>
  <h2 style="margin: 0 0 16px; font-size: 1.25rem; color: #2F6FA3;">Application received</h2>
  <p style="margin: 0 0 12px; line-height: 1.5;">Dear ${safeName},</p>
  <p style="margin: 0 0 12px; line-height: 1.5;">Thank you for applying for <strong>${safeTitle}</strong> at Amalgated Holdings. We have received your application and resume.</p>
  <p style="margin: 0 0 24px; line-height: 1.5;">Our team will review your submission and get in touch if your profile matches our current needs.</p>
  <p style="margin: 0; font-size: 12px; color: #6b7280;">Amalgated Holdings</p>
</body>
</html>`
  const text = `Dear ${applicantName || 'Applicant'},\n\nThank you for applying for ${jobTitle || 'your application'} at Amalgated Holdings. We have received your application and resume.\n\nOur team will review your submission and get in touch if your profile matches our current needs.\n\nAmalgated Holdings`
  return sendOne({ from, to, subject, html, text })
}

/**
 * Send a test email directly (not queued) to verify the provider is working.
 * Throws on failure so the caller can surface the exact error.
 */
export async function sendTestEmail(to) {
  const from = process.env.MAIL_FROM || process.env.BREVO_FROM || process.env.SMTP_USER || 'noreply@localhost'
  const logoUrl = getEmailLogoUrl()
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Test Email</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; color: #1f2937;">
  <div style="margin-bottom: 20px;">
    <img src="${logoUrl}" alt="Amalgated Holdings" style="height: 48px; width: auto; display: block;" />
  </div>
  <h2 style="margin: 0 0 12px; color: #2F6FA3;">Amalgated Holdings — Test Email</h2>
  <p style="margin: 0 0 8px; line-height: 1.6;">
    Your email configuration is working correctly.
    Subscribers will now receive notifications when new careers or news are published.
  </p>
  <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af;">Sent at ${new Date().toISOString()}</p>
</body>
</html>`
  const result = await sendOne({
    from,
    to,
    subject: 'Amalgated Holdings – Email Configuration Test',
    html,
    text: 'Your Amalgated Holdings email configuration is working correctly.',
  })
  if (result === null) throw new Error('No email provider is configured or responded.')
  return result
}

/**
 * Background queue for notification emails. Jobs are processed asynchronously
 * so the admin dashboard is not blocked.
 */
const emailQueue = []
let queueProcessing = false

async function processQueue() {
  if (queueProcessing || emailQueue.length === 0) return
  queueProcessing = true
  while (emailQueue.length > 0) {
    const job = emailQueue.shift()
    try {
      await sendNotificationEmailsSync(job.opts, job.subscribers)
    } catch (e) {
      console.error('[email] Queue job failed:', e?.message || e)
    }
  }
  queueProcessing = false
}

/**
 * Enqueue notification emails to be sent in the background.
 * Returns immediately; emails are sent asynchronously.
 * @param {Object} opts - { type: 'careers'|'news', title, description, port }
 * @param {Array} subscribers - from getSubscribersForNotification
 */
export function queueNotificationEmails(opts, subscribers) {
  if (!subscribers?.length) return
  emailQueue.push({ opts, subscribers })
  setImmediate(processQueue)
}

/**
 * Send notification emails (internal). Used by the queue.
 * @param {Object} opts - { type: 'careers'|'news', title, description, port }
 * @param {Array<{ email, unsubscribe_token }>} subscribers
 */
export async function sendNotificationEmails(opts, subscribers) {
  queueNotificationEmails(opts, subscribers)
}

async function sendNotificationEmailsSync(opts, subscribers) {
  const canSend = getBrevoApiKey() || getMailerSendApiKey() || getResend() || getTransporter()
  if (!canSend || !subscribers?.length) return

  const { type, title, description, port } = opts
  const readMoreUrl = buildReadMoreUrl(type, port)
  const typeLabel = type === 'careers' ? 'New career posting' : 'New news article'
  const buttonLabel = type === 'careers' ? 'Apply Now' : 'Read News'
  const safeTitle = escapeHtml(title || 'Update')
  const safeDesc = escapeHtml(description || '')

  const logoUrl = getEmailLogoUrl(port)
  for (const sub of subscribers) {
    try {
      const unsubscribeUrl = buildUnsubscribeUrl(sub.unsubscribe_token || sub.id, port)
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${typeLabel}</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
  <div style="margin-bottom: 24px;">
    <img src="${logoUrl}" alt="Amalgated Holdings" style="height: 48px; width: auto; display: block;" />
  </div>
  <h2 style="margin: 0 0 16px; font-size: 1.25rem;">${typeLabel}</h2>
  <p style="margin: 0 0 12px; line-height: 1.5;">${safeTitle}</p>
  ${safeDesc ? `<p style="margin: 0 0 20px; line-height: 1.5; color: #4b5563;">${safeDesc}</p>` : ''}
  <p style="margin: 0 0 24px;">
    <a href="${readMoreUrl}" style="display: inline-block; padding: 10px 20px; background: #2F6FA3; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">${buttonLabel}</a>
  </p>
  <p style="margin: 0; font-size: 12px; color: #6b7280;">
    You received this because you subscribed to ${type === 'careers' ? 'careers' : 'news'} updates.
    <a href="${unsubscribeUrl}" style="color: #6b7280;">Unsubscribe</a>
  </p>
</body>
</html>
`
      await sendOne({
        from: process.env.MAIL_FROM || process.env.MAILERSEND_FROM || process.env.BREVO_FROM || process.env.SMTP_USER || process.env.RESEND_FROM || 'noreply@localhost',
        to: sub.email,
        subject: `${typeLabel}: ${(title || 'Update').slice(0, 60)}`,
        html,
        text: `${typeLabel}\n\n${title || 'Update'}\n\n${description || ''}\n\n${buttonLabel}: ${readMoreUrl}\n\nUnsubscribe: ${unsubscribeUrl}`,
      })
      await new Promise((r) => setTimeout(r, DELAY_MS))
    } catch (err) {
      const msg = err?.message || String(err)
      if (msg.includes('BadCredentials') || msg.includes('Invalid login') || msg.includes('535')) {
        console.error('[email] Gmail SMTP auth failed. Use Resend instead: add RESEND_API_KEY to .env (free at resend.com)')
      } else if (msg.includes('only send testing emails to your own')) {
        console.error('[email] Resend: Verify your domain at https://resend.com/domains to send to all subscribers. Use RESEND_FROM=noreply@theamalgatedproperties.com (or your domain) after verification.')
      } else {
        console.error('[email] Failed to send to', sub.email, msg)
      }
    }
  }
}
