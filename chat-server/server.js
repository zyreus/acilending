import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Groq from 'groq-sdk';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import authRoutes from './api/routes/authRoutes.js';
import postsRoutes from './api/routes/postsRoutes.js';
import {
  createConversation,
  getConversation,
  getAllConversations,
  updateStatus,
  updateMode,
  updateVisitor,
  addMessage,
  getMessages,
  getArchivedConversations,
  archiveConversation,
  deleteConversation,
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  updateLead,
  createOrUpdateVisit,
  getVisitByVisitId,
  getAllVisits,
  getVisitsForAnalytics,
  updateVisitLocation,
  createTicket,
  getTickets,
  getTicketById,
  getTicketsByConvo,
  updateTicket,
  setTicketUnread,
  incrementConversationUnread,
  clearConversationUnread,
  deleteTicket,
  getSiteSettings,
  setSiteSettings,
  getSettings,
  setSettings,
  getAdminStats,
  getCareerPositions,
  getCareerPositionById,
  createCareerPosition,
  createApplication,
  createLendingApplication,
  listApplications,
  listLendingApplications,
  getApplicationById,
  deleteApplication,
  updateApplicationStatus,
  updateCareerPosition,
  deleteCareerPosition,
  getNewsItems,
  createNewsItem,
  updateNewsItem,
  deleteNewsItem,
  getNewsletterContent,
  setNewsletterContent,
  createSubscriber,
  getSubscriberByEmail,
  updateSubscriberType,
  getSubscribers,
  deleteSubscriber,
  deleteSubscriberByToken,
  countSubscribers,
  getSubscribersForNotification,
  createFeedback,
  getFeedback,
  markFeedbackRead,
  deleteFeedback,
  countUnreadFeedback,
  createPartnership,
  getPartnerships,
  deletePartnership,
  updatePartnership,
  getCrmTickets,
  getCrmTicketById,
  createCrmTicket,
  updateCrmTicket,
  deleteCrmTicket,
  addCrmTicketReply,
  addCrmTicketNote,
  setCrmTicketUnread,
  getRecentOpenChatTickets,
  logActivity,
  getActivityLogs,
  getAdminUsers,
  createAdminUser,
  deleteAdminUser,
  getAdminUserByEmail,
  updateAdminUserRole,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRoleById,
  getPermissions,
  getRolePermissions,
  getPermissionsForRole,
  createPermission,
  getPermissionIdsForRole,
  assignRolePermissions,
  getRolesWithPermissions,
  DB_PROVIDER,
  ensureApplicationsTable,
  ensureLendingApplicationsTable,
  getAppRoles,
  createAppRole,
  updateAppRole,
  deleteAppRole,
  getAppUsers,
  createAppUser,
  getAppUserByUsername,
  getAppUserByLogin,
  getAppRoleById,
  getCmsPages,
  getCmsPageByName,
  getCmsPageContent,
  getCmsSectionsByPageId,
  getCmsContentsBySectionId,
  upsertCmsContent,
  getCmsSectionByPageAndKey,
} from './db/provider.js';
import { sendNotificationEmails, isEmailConfigured, sendTestEmail, sendCustomEmail, sendApplicationConfirmationEmail } from './lib/email.js';

const app = express();
let port = Number(process.env.PORT) || 8010;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true },
});

app.use(cors({ origin: true }));
app.use(express.json());

// Serve CMS uploads at /uploads/cms
app.use('/uploads', express.static(path.join(__dirname, 'storage', 'app', 'public', 'uploads'), { fallthrough: true }));

// Handle invalid JSON, multer, and any other API errors as JSON (not HTML 500)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ ok: false, message: 'Invalid JSON body.' });
  }
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ ok: false, message: 'Resume must be 2MB or smaller.' });
    }
    return res.status(400).json({ ok: false, message: err.message || 'File upload error.' });
  }
  if (err?.message?.includes?.('Only PDF')) {
    return res.status(400).json({ ok: false, message: err.message });
  }
  const url = req.originalUrl || req.url || '';
  if (url.startsWith('/api') && !res.headersSent) {
    console.error('[api]', req.method, url, err?.message || err);
    const status = Number(err.statusCode || err.status) || 500;
    return res.status(status).json({
      ok: false,
      message: err?.message || 'Unable to complete request.',
    });
  }
  return next(err);
});

// ── Example Auth + CRUD API ──
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);

// ── Public: Careers & News (DB-backed) ──
app.get('/api/public/careers', async (_req, res) => {
  try {
    const positions = await getCareerPositions();
    res.json({ ok: true, positions });
  } catch (err) {
    console.error('[api][public][careers]', err?.message || err);
    res.status(500).json({ ok: false });
  }
});

app.get('/api/public/careers/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ ok: false, message: 'Invalid job id.' });
    }
    const position = await getCareerPositionById(id);
    if (!position) return res.status(404).json({ ok: false, message: 'Job not found.' });
    res.json({ ok: true, position });
  } catch (err) {
    console.error('[api][public][careers/:id]', err?.message || err);
    res.status(500).json({ ok: false });
  }
});

// ── Job applications: resume upload dir and multer ──
const RESUMES_DIR = path.join(__dirname, 'storage', 'app', 'public', 'resumes');
try {
  fs.mkdirSync(RESUMES_DIR, { recursive: true });
} catch {
  /* directory may already exist */
}

const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RESUMES_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    const base = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `${base}${ext}`);
  },
});
const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(pdf|doc|docx)$/i.test(file.originalname);
    if (allowed) cb(null, true);
    else cb(new Error('Only PDF, DOC, or DOCX files are allowed.'));
  },
});

// CMS image upload
const CMS_UPLOADS_DIR = path.join(__dirname, 'storage', 'app', 'public', 'uploads', 'cms');
try {
  fs.mkdirSync(CMS_UPLOADS_DIR, { recursive: true });
} catch {}
const cmsStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CMS_UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safe = (path.basename(file.originalname, ext) || 'image').replace(/[^a-z0-9_-]/gi, '_').slice(0, 40);
    cb(null, `${Date.now()}-${safe}${ext}`);
  },
});
const uploadCmsImage = multer({
  storage: cmsStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.originalname);
    if (allowed) cb(null, true);
    else cb(new Error('Only image files (jpg, png, gif, webp, svg) are allowed.'));
  },
});

const EMAIL_REGEX_APPLY = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmailApply(str) {
  return typeof str === 'string' && EMAIL_REGEX_APPLY.test(str.trim());
}

app.post('/api/applications', uploadResume.single('resume'), async (req, res) => {
  try {
    const body = req.body || {};
    const jobId = body.job_id != null ? Number(body.job_id) : NaN;
    if (!Number.isInteger(jobId) || jobId < 1) {
      return res.status(400).json({ ok: false, message: 'Valid job_id is required.' });
    }
    const fullName = (body.full_name ?? '').trim();
    const email = (body.email ?? '').trim();
    const phone = (body.phone ?? '').trim();
    if (!fullName) return res.status(400).json({ ok: false, message: 'Full name is required.' });
    if (!email) return res.status(400).json({ ok: false, message: 'Email is required.' });
    if (!isValidEmailApply(email)) {
      return res.status(400).json({ ok: false, message: 'Please provide a valid email address.' });
    }
    if (!phone) return res.status(400).json({ ok: false, message: 'Phone is required.' });
    if (!req.file || !req.file.path) {
      return res.status(400).json({
        ok: false,
        message: 'Resume file (PDF, DOC, or DOCX, max 2MB) is required. If you uploaded a file, check its size and format.',
      });
    }
    const resumeStored = path.join('resumes', path.basename(req.file.path)).replace(/\\/g, '/');

    await createApplication({
      job_id: jobId,
      full_name: fullName,
      email,
      phone: phone || null,
      resume: resumeStored,
    });

    io.to('admin').emit('applications:refresh');

    if (isEmailConfigured()) {
      try {
        const job = await getCareerPositionById(jobId).catch(() => null);
        const jobTitle = job?.title || 'your application';
        await sendApplicationConfirmationEmail({
          to: email,
          applicantName: fullName,
          jobTitle,
        }).catch((e) => console.error('[api][applications] confirmation email:', e?.message || e));
      } catch (e) {
        console.error('[api][applications] email send:', e?.message || e);
      }
    }

    res.status(201).json({ ok: true, message: 'Application submitted successfully.' });
  } catch (err) {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ ok: false, message: 'Resume must be 2MB or smaller.' });
    }
    if (err && err.message && String(err.message).includes('Only PDF')) {
      return res.status(400).json({ ok: false, message: err.message });
    }
    console.error('[api][applications]', err?.message || err);
    if (err?.stack) console.error(err.stack);
    const isDev = process.env.NODE_ENV !== 'production';
    const message =
      isDev && err?.message
        ? `Server error: ${err.message}`
        : 'Unable to submit application. Please try again.';
    res.status(500).json({ ok: false, message });
  }
});

// ── Amalgated Lending: loan applications (JSON) ──
function requireLendingAdminSecret(req, res, next) {
  const secret = process.env.LENDING_ADMIN_API_SECRET
  if (!secret || String(secret).trim().length < 8) {
    return res.status(503).json({
      ok: false,
      message: 'LENDING_ADMIN_API_SECRET is not set on the server (min 8 characters).',
    })
  }
  const auth = req.headers.authorization || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const header = (req.headers['x-lending-admin-secret'] || '').trim()
  if (bearer === secret || header === secret) return next()
  return res.status(401).json({ ok: false, message: 'Unauthorized.' })
}

app.post('/api/lending/applications', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const required = ['fullName', 'email', 'phone', 'address', 'employmentStatus', 'monthlyIncome', 'loanType', 'loanAmount', 'loanTerm']
    const missing = required.filter((k) => !String(body[k] ?? '').trim())
    if (missing.length) {
      return res.status(400).json({ ok: false, message: `Missing required fields: ${missing.join(', ')}` })
    }
    if (!isValidEmailApply(String(body.email))) {
      return res.status(400).json({ ok: false, message: 'Please provide a valid email address.' })
    }
    await createLendingApplication(body)
    io.to('admin').emit('applications:refresh')
    res.status(201).json({ ok: true, message: 'Application submitted successfully.' })
  } catch (err) {
    console.error('[api][lending][applications][post]', err?.message || err)
    res.status(500).json({ ok: false, message: 'Unable to submit application. Please try again.' })
  }
})

app.get('/api/lending/applications', requireLendingAdminSecret, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 300, 1), 500)
    const applications = await listLendingApplications({ limit })
    res.json({ ok: true, applications })
  } catch (err) {
    console.error('[api][lending][applications][get]', err?.message || err)
    res.status(500).json({ ok: false, message: 'Failed to load applications.' })
  }
})

app.get('/api/public/news', async (_req, res) => {
  try {
    const [content, items] = await Promise.all([getNewsletterContent(), getNewsItems()]);
    res.json({ ok: true, content: content || null, items });
  } catch (err) {
    console.error('[api][public][news]', err?.message || err);
    res.status(500).json({ ok: false });
  }
});

// ── Public: CMS page content ──
app.get('/api/pages/:pageName', async (req, res) => {
  try {
    const pageName = String(req.params.pageName || '').trim().toLowerCase();
    if (!pageName) return res.status(400).json({ ok: false, message: 'Page name required.' });
    const content = await getCmsPageContent(pageName);
    if (!content) return res.status(404).json({ ok: false, message: 'Page not found.' });
    res.json({ ok: true, content });
  } catch (err) {
    console.error('[api][pages]', err?.message || err);
    res.status(500).json({ ok: false });
  }
});

// ── Careers & News subscription (stores in subscribers table) ──
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(str) {
  return typeof str === 'string' && EMAIL_REGEX.test(str.trim());
}

app.post('/api/subscribe', async (req, res) => {
  const { email, subscription_type, honeypot } = req.body || {};
  if (honeypot) return res.json({ ok: true });
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed || !isValidEmail(trimmed)) {
    return res.status(400).json({ ok: false, message: 'A valid email address is required.' });
  }
  const type = ['careers', 'news', 'both'].includes(subscription_type) ? subscription_type : 'both';
  try {
    const existing = await getSubscriberByEmail(trimmed);
    if (existing) {
      await updateSubscriberType(existing.id, type);
      return res.json({ ok: true, updated: true });
    }
    const sub = await createSubscriber({ email: trimmed, subscription_type: type });
    if (!sub) return res.status(400).json({ ok: false, message: 'Unable to subscribe. Please try again.' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[api][subscribe]', err?.message || err);
    return res.status(500).json({ ok: false, message: 'Unable to subscribe. Please try again.' });
  }
});

app.get('/api/unsubscribe/:token', async (req, res) => {
  const { token } = req.params;
  if (!token) return res.redirect('/');
  try {
    await deleteSubscriberByToken(token);
  } catch { /* ignore */ }
  const base = (process.env.SITE_URL || '').replace(/\/$/, '') || `http://localhost:${port}`;
  return res.redirect(`${base}/news?unsubscribed=1`);
});

// ── Newsletter subscribe (stores to admin leads) ──
app.post('/api/newsletter-subscribe', async (req, res) => {
  const { email, source_page } = req.body || {};
  const trimmed = (email || '').trim();
  if (!trimmed) {
    return res.status(400).json({ ok: false, message: 'Email is required.' });
  }
  try {
    const lead = await createLead({
      name: 'Newsletter Subscriber',
      email: trimmed,
      phone: null,
      company: null,
      inquiry_message: 'Newsletter signup',
      conversation_id: null,
      source_page: (source_page || '').trim() || '/news',
    });
    io.to('admin').emit('admin:newLead', lead);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[api][newsletter-subscribe]', err?.message || err);
    return res.status(500).json({ ok: false, message: 'Unable to subscribe. Please try again.' });
  }
});

// ── Contact inquiry (stores to leads) ──
app.post('/api/inquiry', async (req, res) => {
  const { name, email, phone, company, message, source_page } = req.body || {};
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ ok: false, message: 'Name, email, and message are required.' });
  }
  try {
    const lead = await createLead({
      name: name.trim(),
      email: email.trim(),
      phone: (phone || '').trim() || null,
      company: (company || '').trim() || null,
      inquiry_message: message.trim(),
      conversation_id: null,
      source_page: (source_page || '').trim() || '/contact',
    });
    io.to('admin').emit('admin:newLead', lead);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[api][inquiry]', err?.message || err);
    return res.status(500).json({ ok: false, message: 'Unable to submit inquiry at this time.' });
  }
});

// ── AI Setup (Amalgated Holdings) ──

const SYSTEM_PROMPT = `You are the helpful AI assistant for Amalgated Holdings.
Amalgated Holdings is a diversified group of companies. Be professional, friendly, and concise.
Help visitors with general enquiries, company information, and how to get in touch.
Base your answers on the "Website and company details" below. Use that information for contact info, addresses, and company facts.
If the user asks something not covered by the provided details, say so politely and suggest they contact the team or leave their details for a follow-up.
If you don't know something specific, suggest they contact the team directly or leave their details so someone can follow up.`;

// Static company/office info (aligned with the website Contact page) for AI context
const WEBSITE_KNOWLEDGE = `
- Company: Amalgated Holdings – a diversified group of companies.
- Main office: Amalgated Capital, Inc. (Dona Carolina Bldg, J.P. Laurel Ave, Bo. Obrero, Davao City, 8000 Davao del Sur). Located behind Eastwest Bajada, Davao City.
- Office phone: (082) 297 8099.
- Website: https://amalgatedholdings.com.
- Office hours: Open, closes 6 PM.
- Visitors can send an inquiry via the contact form on the website or use the chat to leave their details for the team to follow up.
`;

async function getWebsiteContext() {
  const settings = await getSiteSettings();
  const site = settings.site || {};
  const contactEmail = [site.contactEmail].flat().find(Boolean);
  const contactPhone = [site.contactPhone].flat().find(Boolean);
  const address = [site.address].flat().find(Boolean);
  const parts = [WEBSITE_KNOWLEDGE.trim()];
  if (contactEmail || contactPhone || address) {
    parts.push('Additional contact details from the website settings:');
    if (contactEmail) parts.push(`- General contact email: ${contactEmail}`);
    if (contactPhone) parts.push(`- General contact phone: ${contactPhone}`);
    if (address) parts.push(`- Address: ${address}`);
  }
  return parts.join('\n');
}

const groqApiKey = (process.env.GROQ_API_KEY || '').trim();
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;
/** @see https://console.groq.com/docs/models — override if a model is deprecated. */
const GROQ_MODEL = (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile').trim();
const aiContexts = new Map();

function normalizeLang(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (!raw) return 'en';
  const base = raw.split(/[-_]/)[0];
  if (base === 'tl' || base === 'fil') return 'fil';
  if (['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'id', 'vi'].includes(base)) return base;
  return 'en';
}

function languageName(code) {
  switch (code) {
    case 'fil': return 'Filipino (Tagalog)';
    case 'es': return 'Spanish';
    case 'fr': return 'French';
    case 'de': return 'German';
    case 'it': return 'Italian';
    case 'pt': return 'Portuguese';
    case 'ru': return 'Russian';
    case 'ja': return 'Japanese';
    case 'ko': return 'Korean';
    case 'zh': return 'Chinese';
    case 'ar': return 'Arabic';
    case 'hi': return 'Hindi';
    case 'id': return 'Indonesian';
    case 'vi': return 'Vietnamese';
    default: return 'English';
  }
}

function t(lang, key) {
  const l = normalizeLang(lang);
  const dict = {
    en: {
      leadAsk: 'To help you with that, please share your contact details so our team can get back to you.',
      leadThanks: 'Thank you! We have your details and our team will get back to you shortly.',
      aiNotConfigured: 'AI is not configured. Please contact the team directly.',
      aiError: 'Sorry, something went wrong. Please try again.',
    },
    fil: {
      leadAsk: 'Para matulungan ka, pakibigay ang iyong contact details para makabalik sa iyo ang aming team.',
      leadThanks: 'Salamat! Nakuha na namin ang iyong details at babalikan ka ng aming team sa lalong madaling panahon.',
      aiNotConfigured: 'Hindi naka-configure ang AI. Mangyaring kontakin ang aming team.',
      aiError: 'Pasensya na, may nangyari. Pakisubukan ulit.',
    },
    es: {
      leadAsk: 'Para ayudarte mejor, comparte tus datos de contacto para que nuestro equipo pueda comunicarse contigo.',
      leadThanks: '¡Gracias! Ya tenemos tus datos y nuestro equipo se comunicará contigo pronto.',
      aiNotConfigured: 'La IA no está configurada. Por favor, contacta al equipo.',
      aiError: 'Lo siento, algo salió mal. Inténtalo de nuevo.',
    },
  };
  return (dict[l] && dict[l][key]) || dict.en[key] || '';
}

const LEAD_CAPTURE_KEYWORDS = /\b(service|services|pricing|price|cost|rates?|availability|available|inquire|inquiry|quote|book|schedule|contact|reach|speak|representative|agent|team)\b/i;
function wantsLeadCapture(message) {
  return typeof message === 'string' && LEAD_CAPTURE_KEYWORDS.test(message);
}

function parseUserAgent(ua) {
  if (!ua || typeof ua !== 'string') return { device: 'Unknown', browser: 'Unknown' };
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|webOS/i.test(ua);
  let browser = 'Unknown';
  if (/Chrome\/[.\d]+/i.test(ua) && !/Edge/i.test(ua)) browser = 'Chrome';
  else if (/Firefox\/[.\d]+/i.test(ua)) browser = 'Firefox';
  else if (/Safari\/[.\d]+/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Edge\/[.\d]+/i.test(ua)) browser = 'Edge';
  return { device: isMobile ? 'Mobile' : 'Desktop', browser };
}

function resolveLocationFromIp(visitId, ip, cb) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return cb();
  const url = `http://ip-api.com/json/${ip}?fields=city,regionName,country`;
  fetch(url)
    .then((r) => r.json())
    .then((data) => {
      if (data && (data.city || data.country)) {
        const loc = [data.city, data.regionName, data.country].filter(Boolean).join(', ');
        Promise.resolve(getVisitByVisitId(visitId))
          .then((visit) => {
            if (visit) return updateVisitLocation(visitId, loc);
          })
          .catch(() => {});
      }
    })
    .catch(() => {})
    .finally(cb);
}

const LENDING_AI_APPEND = `
Additional context — this conversation is from the Amalgated Lending website (Amalgated Lending Inc. / ALI).
You help with: personal loans, business loans, salary loans, retail financing, application steps, branch information, and responsible lending.
Guide users to apply via the site apply form and to read loan products. The lending business is part of the Amalgated Holdings group.
Keep answers accurate; if unsure about rates or eligibility, suggest they apply or contact a branch.`;

const LENDING_PHONE = '(082) 297 8099';
const LENDING_OFFICE =
  'Doña Carolina Bldg, J.P. Laurel Ave, Bo. Obrero, Davao City, Philippines';

/** Rule-based replies when GROQ_API_KEY is missing or Groq API errors (chat still works). */
function getLendingFallbackReply(userMessage, lang) {
  const m = String(userMessage || '').toLowerCase();
  const l = normalizeLang(lang);

  if (l === 'fil') {
    if (/apply|aplikasyon|loan|utang|salary|negosyo|personal|business|hiram/i.test(m)) {
      return `Maaari kang mag-apply online sa Amalgated Lending website (Apply page). Kailangan ng valid ID, proof of income, at supporting documents. Susuriin ng team at makikipag-ugnay sa iyo — karaniwan sa loob ng 1–2 araw ng trabaho. Tulong: tumawag sa ${LENDING_PHONE}.`
    }
    if (/rate|interest|bunga|presyo|magkano|fee/i.test(m)) {
      return `Depende ang rates at terms sa loan product, halaga, at profile mo. Para sa tumpak na quote, mag-apply online o tumawag sa ${LENDING_PHONE}.`
    }
    if (/branch|opisina|saan|location|davao|address|bisita/i.test(m)) {
      return `Opisina: ${LENDING_OFFICE}. Telepono: ${LENDING_PHONE}.`
    }
    if (/hello|hi |^hi$|kumusta|tulong|help|magandang/i.test(m)) {
      return `Kumusta! Tutulungan ka namin sa Amalgated Lending — personal, salary, business loans, at iba pa. Ano ang gusto mong malaman? Puwede mo ring gamitin ang mga quick option sa chat.`
    }
    if (/salamat|thank/i.test(m)) {
      return `Walang anuman! Kung may iba ka pang tanong tungkol sa loan o application, sabihin lang.`
    }
    return `Salamat sa mensahe mo. Para sa loan details, rates, o application, tumawag sa ${LENDING_PHONE} o gamitin ang Apply page sa website.`
  }

  if (l === 'es') {
    if (/apply|aplicación|loan|préstamo|salary|business|personal/i.test(m)) {
      return `Puede aplicar en línea en el sitio de Amalgated Lending (página Apply). Suele necesitarse ID válido, comprobante de ingresos y documentos. Teléfono: ${LENDING_PHONE}.`
    }
    return `Gracias por tu mensaje. Para préstamos Amalgated Lending, llama al ${LENDING_PHONE} o usa la página Apply en el sitio.`
  }

  if (/apply|application|how do i apply|apply for|loan application/i.test(m)) {
    return `You can apply online through the Amalgated Lending website’s Apply page. You’ll typically need a valid ID, proof of income, and supporting documents. Our team reviews applications and usually contacts you within 1–2 business days. Need help? Call ${LENDING_PHONE}.`
  }
  if (/rate|interest|how much|apr|monthly payment|fee/i.test(m)) {
    return `Interest rates and terms depend on the loan product, amount, term, and your profile. For accurate figures, apply online or call ${LENDING_PHONE} — our staff can provide a personalized quote.`
  }
  if (/branch|office|location|davao|where|address|visit|open/i.test(m)) {
    return `Main office: ${LENDING_OFFICE}. Phone: ${LENDING_PHONE}. You can also explore Loan Products and Apply on our site.`
  }
  if (/hours|when are you|schedule/i.test(m)) {
    return `For branch hours and appointments, please call ${LENDING_PHONE}.`
  }
  if (/hello|hi |^hi$|hey|good morning|good afternoon|help\b/i.test(m)) {
    return `Hello! I can help with Amalgated Lending — personal, salary, business loans, and more. What would you like to know? You can also use the quick options in this chat.`
  }
  if (/thank|thanks|salamat/i.test(m)) {
    return `You’re welcome! If you need anything else about loans or your application, just ask.`
  }
  return `Thanks for your message. For loan details, rates, or applications, reach us at ${LENDING_PHONE} or use the Apply page on the Amalgated Lending website. Our menu above has shortcuts for common questions.`
}

function getHoldingsFallbackReply(userMessage, lang) {
  const m = String(userMessage || '').toLowerCase();
  const l = normalizeLang(lang);
  const phone = '(082) 297 8099';
  if (l === 'fil') {
    return `Salamat sa mensahe mo. Para sa Amalgated Holdings, tumawag sa ${phone} o bisitahin ang amalgatedholdings.com.`
  }
  if (/contact|phone|email|address|office|where|location/i.test(m)) {
    return `Amalgated Holdings — main office: Doña Carolina Bldg, J.P. Laurel Ave, Bo. Obrero, Davao City. Phone: ${phone}. Website: https://amalgatedholdings.com`
  }
  return `Thanks for reaching out to Amalgated Holdings, a diversified group of companies. For general enquiries, call ${phone} or use the contact form on amalgatedholdings.com. How can I help you today?`
}

async function getAIReply(conversationId, userMessage, lang) {
  const l = normalizeLang(lang);
  const fromLending =
    typeof conversationId === 'string' && conversationId.startsWith('lending-');

  const fallback = () =>
    Promise.resolve(
      fromLending ? getLendingFallbackReply(userMessage, l) : getHoldingsFallbackReply(userMessage, l),
    );

  if (!groqApiKey || !groq) {
    return fallback();
  }

  const key = `${conversationId}:${l}`;
  try {
    if (!aiContexts.has(key)) {
      const websiteContext = await getWebsiteContext();
      const lendingBlock = fromLending ? `\n${LENDING_AI_APPEND}\n` : '\n';
      aiContexts.set(key, [{
        role: 'system',
        content: `${SYSTEM_PROMPT}${lendingBlock}\nWebsite and company details:\n${websiteContext}\n\nAlways reply in ${languageName(l)}. If the user switches language, follow the latest selected language.`,
      }]);
    }
    const ctx = aiContexts.get(key);
    ctx.push({ role: 'user', content: userMessage });
    if (ctx.length > 21) {
      aiContexts.set(key, [ctx[0], ...ctx.slice(-20)]);
    }
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: ctx,
      max_tokens: 512,
      temperature: 0.7,
    });
    const reply = (completion.choices[0]?.message?.content || '').trim();
    if (!reply) {
      ctx.pop();
      return fallback();
    }
    ctx.push({ role: 'assistant', content: reply });
    return reply;
  } catch (err) {
    console.error('[ai]', err?.message || err);
    try {
      const ctx = aiContexts.get(`${conversationId}:${l}`);
      if (ctx?.length && ctx[ctx.length - 1]?.role === 'user') ctx.pop();
    } catch {
      /* ignore */
    }
    return fallback();
  }
}

// ── Partnerships (Partner With Us form) ──

app.post('/api/partnerships', async (req, res) => {
  const { full_name, company, email, phone, partnership_type, message } = req.body || {};
  if (!full_name?.trim() || !email?.trim()) {
    return res.status(400).json({ ok: false, message: 'Full name and email are required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ ok: false, message: 'Please enter a valid email address.' });
  }
  try {
    const row = await createPartnership({
      full_name: full_name.trim(),
      company: company?.trim() || null,
      email: email.trim(),
      phone: phone?.trim() || null,
      partnership_type: partnership_type?.trim() || null,
      message: message?.trim() || null,
    });
    if (!row) {
      return res.status(500).json({ ok: false, message: 'Unable to submit at this time.' });
    }
    io.to('admin').emit('partnerships:refresh');
    return res.json({ ok: true });
  } catch (err) {
    console.error('[api][partnerships]', err?.message || err);
    return res.status(500).json({ ok: false, message: 'Unable to submit at this time.' });
  }
});

// ── Customer Feedback (DB-backed) ──

app.post('/api/feedback', async (req, res) => {
  const { conversationId, rating, name, email, comment } = req.body || {};
  const numRating = Number(rating);
  if (!Number.isFinite(numRating) || numRating <= 0 || !comment?.trim()) {
    return res.status(400).json({ ok: false, message: 'Rating and comment are required.' });
  }
  try {
    await createFeedback({
      id: crypto.randomUUID(),
      conversationId: conversationId || null,
      rating: numRating,
      name: (name || '').trim() || 'Anonymous',
      email: (email || '').trim() || null,
      comment: comment.trim(),
    });
    io.to('admin').emit('feedback:refresh');
    return res.json({ ok: true });
  } catch (err) {
    console.error('[api][feedback]', err?.message || err);
    return res.status(500).json({ ok: false, message: 'Unable to submit feedback at this time.' });
  }
});

// ── Admin Authentication ──

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function getClientIp(req) {
  return req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
}

const ALL_PERMISSIONS = [
  'view_dashboard',
  'manage_users',
  'manage_settings',
  'manage_tickets',
  'manage_partnerships',
  'manage_applications',
  'manage_companies',
  'manage_operations',
  'edit_content',
  'create_user',
  'edit_user',
  'delete_user',
  'view_users',
  'manage_roles',
  'view_reports',
];

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Unauthorized' });
  try {
    req.admin = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ ok: false, message: 'Token expired or invalid' });
  }
}

/** Accepts Node JWT OR LENDING_ADMIN_API_SECRET (for Amalgated Lending admin portal → Node chat/CRM). */
function requireAdminOrLendingSecret(req, res, next) {
  const secret = process.env.LENDING_ADMIN_API_SECRET;
  const auth = req.headers.authorization;
  if (secret && auth?.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    if (token === secret) {
      req.admin = {
        username: 'lending_admin',
        role: 'staff',
        permissions: ['manage_tickets', 'view_dashboard'],
      };
      return next();
    }
  }
  return requireAdmin(req, res, next);
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.admin) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    if (req.admin.role === 'super_admin') return next();
    if (req.admin.role === 'admin' && !Array.isArray(req.admin.permissions)) return next();
    const perms = req.admin.permissions || [];
    if (perms.includes(permission)) return next();
    res.status(403).json({ ok: false, message: 'Forbidden. You do not have permission.' });
  };
}

function requirePermissionAny(...permissions) {
  return (req, res, next) => {
    if (!req.admin) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    if (req.admin.role === 'super_admin') return next();
    if (req.admin.role === 'admin' && !Array.isArray(req.admin.permissions)) return next();
    const perms = req.admin.permissions || [];
    if (permissions.some((p) => perms.includes(p))) return next();
    res.status(403).json({ ok: false, message: 'Forbidden. You do not have permission.' });
  };
}

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ ok: false, message: 'Username and password are required.' });
  }
  const loginUser = String(username).trim().toLowerCase();
  const primaryAdmin = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();

  if (loginUser === primaryAdmin) {
    let adminHash = process.env.ADMIN_PASSWORD_HASH;
    try {
      const siteSettings = await getSiteSettings();
      if (siteSettings.admin_password_hash_override) adminHash = siteSettings.admin_password_hash_override;
    } catch {
      /* use env hash only */
    }
    if (!adminHash) return res.status(500).json({ ok: false, message: 'Admin auth not configured.' });
    const valid = await bcrypt.compare(password, adminHash);
    if (!valid) return res.status(401).json({ ok: false, message: 'Invalid credentials.' });
    const token = jwt.sign(
      { username: process.env.ADMIN_USERNAME || 'admin', role: 'super_admin', permissions: ALL_PERMISSIONS },
      JWT_SECRET,
      { expiresIn: '24h' },
    );
    logActivity({ action: 'login', adminUsername: process.env.ADMIN_USERNAME, ipAddress: getClientIp(req), details: 'Admin login successful' }).catch(() => {});
    return res.json({ ok: true, token, admin: { username: process.env.ADMIN_USERNAME, role: 'super_admin', permissions: ALL_PERMISSIONS } });
  }

  const staffUser = await getAdminUserByEmail(loginUser);
  if (staffUser?.password_hash) {
    const valid = await bcrypt.compare(password, staffUser.password_hash);
    if (valid) {
      let permissions = [];
      try {
        permissions = await getPermissionsForRole(staffUser.role || 'staff');
      } catch {
        permissions = [];
      }
      const token = jwt.sign(
        { username: staffUser.email, role: staffUser.role || 'staff', permissions },
        JWT_SECRET,
        { expiresIn: '24h' },
      );
      logActivity({ action: 'login', adminUsername: staffUser.email, ipAddress: getClientIp(req), details: 'Staff login successful' }).catch(() => {});
      return res.json({ ok: true, token, admin: { username: staffUser.email, role: staffUser.role, permissions } });
    }
  }

  const appUser = await getAppUserByLogin(loginUser);
  if (appUser?.password_hash) {
    const valid = await bcrypt.compare(password, appUser.password_hash);
    if (valid) {
      let roleName = 'staff';
      let permissions = [];
      try {
        const role = await getAppRoleById(appUser.roleId);
        if (role) {
          roleName = role.name;
          permissions = Object.keys(role.permissions || {}).filter((k) => role.permissions[k]);
        }
      } catch {
        /* use defaults */
      }
      const token = jwt.sign(
        { username: appUser.username, role: roleName, permissions },
        JWT_SECRET,
        { expiresIn: '24h' },
      );
      logActivity({ action: 'login', adminUsername: appUser.username, ipAddress: getClientIp(req), details: 'App user login successful' }).catch(() => {});
      return res.json({ ok: true, token, admin: { username: appUser.username, role: roleName, permissions } });
    }
  }

  return res.status(401).json({ ok: false, message: 'Invalid credentials.' });
});

app.get('/api/admin/verify', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ ok: false });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    res.json({ ok: true, admin: { username: decoded.username, role: decoded.role, permissions: decoded.permissions || [] } });
  } catch {
    res.status(401).json({ ok: false });
  }
});

// ── Admin: Feedback ──

app.get('/api/admin/feedback', requireAdminOrLendingSecret, requirePermission('manage_tickets'), async (_req, res) => {
  res.json(await getFeedback());
});

// ── Admin: Stats ──
app.get('/api/admin/stats', requireAdminOrLendingSecret, requirePermission('view_dashboard'), async (_req, res) => {
  const stats = await getAdminStats();
  const feedbackUnread = await countUnreadFeedback();
  const unreadChat = Number(stats.unreadChat) || 0;
  const unreadTickets = Number(stats.unreadTickets) || 0;
  const feedbackCount = Number(feedbackUnread) || 0;
  const notifications = unreadChat + unreadTickets + feedbackCount;
  const recentOpenChatTickets = await getRecentOpenChatTickets(5);
  res.json({
    ok: true,
    stats: {
      ...stats,
      unreadChat,
      unreadTickets,
      feedbackUnread: feedbackCount,
      notifications,
    },
    recentOpenChatTickets,
  });
});

app.delete('/api/admin/feedback/:id', requireAdminOrLendingSecret, requirePermission('manage_tickets'), async (req, res) => {
  await deleteFeedback(req.params.id);
  io.to('admin').emit('feedback:refresh');
  res.json({ ok: true });
});

// ── Admin: Partnerships ──

app.get('/api/admin/partnerships', requireAdmin, requirePermission('manage_partnerships'), async (req, res) => {
  const search = req.query.search || '';
  const list = await getPartnerships({ search });
  res.json({ ok: true, partnerships: list });
});

app.delete('/api/admin/partnerships/:id', requireAdmin, requirePermission('manage_partnerships'), async (req, res) => {
  await deletePartnership(req.params.id);
  io.to('admin').emit('partnerships:refresh');
  res.json({ ok: true });
});

app.patch('/api/admin/partnerships/:id', requireAdmin, requirePermission('manage_partnerships'), async (req, res) => {
  const { status } = req.body || {};
  const updated = await updatePartnership(req.params.id, { status });
  if (!updated) return res.status(400).json({ ok: false, message: 'Invalid status or not found' });
  io.to('admin').emit('partnerships:refresh');
  res.json({ ok: true, partnership: updated });
});

app.post('/api/admin/partnerships/:id/email', requireAdmin, requirePermission('manage_partnerships'), async (req, res) => {
  const { subject, message } = req.body || {};
  if (!subject?.trim() || !message?.trim()) {
    return res.status(400).json({ ok: false, message: 'Subject and message are required.' });
  }
  const list = await getPartnerships({});
  const p = list.find((x) => String(x.id) === String(req.params.id));
  if (!p || !p.email) return res.status(404).json({ ok: false, message: 'Partnership not found' });
  if (!isEmailConfigured()) {
    return res.status(400).json({ ok: false, message: 'No email provider configured.' });
  }
  try {
    const html = message.replace(/\n/g, '<br>');
    await sendCustomEmail({
      to: p.email,
      subject: subject.trim(),
      html: `<!DOCTYPE html><html><body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">${html}</body></html>`,
      text: message,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[api] partnerships/email', err?.message);
    res.status(500).json({ ok: false, message: err?.message || 'Failed to send email' });
  }
});

// ── Admin: Bulk actions ──

app.post('/api/admin/bulk', requireAdminOrLendingSecret, async (req, res) => {
  const { resource, action, ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ ok: false, message: 'ids required' });
  if (!['conversations', 'feedback', 'tickets'].includes(resource)) return res.status(400).json({ ok: false, message: 'invalid resource' });
  if (!['delete', 'markRead', 'markUnread'].includes(action)) return res.status(400).json({ ok: false, message: 'invalid action' });

  if (resource === 'conversations') {
    for (const id of ids) {
      if (action === 'delete') await deleteConversation(id);
      if (action === 'markRead') await clearConversationUnread(id);
      if (action === 'markUnread') await incrementConversationUnread(id);
    }
    io.to('admin').emit('conversations:refresh');
    return res.json({ ok: true });
  }

  if (resource === 'tickets') {
    for (const id of ids) {
      const num = Number(id);
      if (!Number.isFinite(num)) return;
      if (action === 'delete') {
        await deleteTicket(num);
        logActivity({ action: 'ticket_deleted', adminUsername: req.admin?.username, ipAddress: getClientIp(req), details: `Chat ticket #${num} deleted` }).catch(() => {});
      }
      if (action === 'markRead') await setTicketUnread(num, false);
      if (action === 'markUnread') await setTicketUnread(num, true);
    }
    io.to('admin').emit('tickets:refresh');
    return res.json({ ok: true });
  }

  if (action === 'delete') {
    for (const id of ids) await deleteFeedback(id);
    io.to('admin').emit('feedback:refresh');
    return res.json({ ok: true });
  }
  if (action === 'markRead') {
    await markFeedbackRead(ids, true);
    io.to('admin').emit('feedback:refresh');
    return res.json({ ok: true });
  }
  if (action === 'markUnread') {
    await markFeedbackRead(ids, false);
    io.to('admin').emit('feedback:refresh');
    return res.json({ ok: true });
  }
  return res.json({ ok: true });
});

// ── Admin: Conversations ──

// ── Admin: Website Settings (legacy) ──
app.get('/api/admin/settings', requireAdmin, requirePermission('manage_settings'), async (_req, res) => {
  const settings = await getSiteSettings();
  res.json({ ok: true, settings: settings.site || {} });
});

app.put('/api/admin/settings', requireAdmin, requirePermission('manage_settings'), async (req, res) => {
  const { settings } = req.body || {};
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ ok: false, message: 'settings object required' });
  }
  const next = await setSiteSettings({ site: settings });
  logActivity({ action: 'settings_updated', adminUsername: req.admin?.username, ipAddress: getClientIp(req), details: 'Website settings updated' }).catch(() => {});
  io.to('admin').emit('settings:updated');
  res.json({ ok: true, settings: next.site || {} });
});

// ── Public settings (no auth) – partnership types, chat config for frontend
app.get('/api/public/settings', async (_req, res) => {
  try {
    const { flat } = await getSettings();
    res.json({
      ok: true,
      partnership_types: Array.isArray(flat?.partnership_types) ? flat.partnership_types : ['Real Estate', 'Retail & Distribution', 'Financial Services', 'LPG Operations', 'IT & Technology', 'Other'],
      chat_enabled: flat?.chat_enabled !== false,
      chat_availability: flat?.chat_availability || 'online',
      chat_auto_reply: flat?.chat_auto_reply || '',
      chat_working_hours: flat?.chat_working_hours || '',
    });
  } catch (err) {
    console.error('[api][public][settings]', err?.message || err);
    res.status(500).json({ ok: false });
  }
});

// ── Admin: Dynamic Settings (new) ──
app.get('/api/settings', requireAdmin, requirePermission('manage_settings'), async (_req, res) => {
  const { grouped, flat } = await getSettings();
  res.json({ ok: true, settings: grouped, flat });
});

app.post('/api/settings', requireAdmin, requirePermission('manage_settings'), async (req, res) => {
  const input = req.body?.settings ?? req.body;
  if (!input || typeof input !== 'object') {
    return res.status(400).json({ ok: false, message: 'settings must be an object' });
  }
  const { grouped, flat } = await setSettings(input);
  logActivity({ action: 'settings_updated', adminUsername: req.admin?.username, ipAddress: getClientIp(req), details: 'System settings updated' }).catch(() => {});
  io.to('admin').emit('settings:updated');
  io.emit('public:settings'); // notify all (including ChatWidget) for chat_enabled etc.
  res.json({ ok: true, settings: grouped, flat });
});

// ── Admin: Profile (change password) ──
app.post('/api/admin/profile/password', requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ ok: false, message: 'Current password and new password (min 6 chars) required.' });
  }
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  const valid = await bcrypt.compare(currentPassword, adminHash);
  if (!valid) {
    return res.status(400).json({ ok: false, message: 'Current password is incorrect.' });
  }
  const hash = await bcrypt.hash(newPassword, 10);
  // Persist to site_settings for override (login checks this first)
  await setSiteSettings({ admin_password_hash_override: hash }).catch(() => {});
  logActivity({ action: 'password_changed', adminUsername: req.admin?.username, ipAddress: getClientIp(req), details: 'Admin password changed' }).catch(() => {});
  res.json({ ok: true, message: 'Password changed successfully.' });
});

// ── Admin: Roles (dynamic, from DB) ──
const requireManageRoles = requirePermissionAny('manage_users', 'manage_roles');
const requireViewUsers = requirePermissionAny('manage_users', 'view_users');
const requireCreateUser = requirePermissionAny('manage_users', 'create_user');
const requireEditUser = requirePermissionAny('manage_users', 'edit_user');
const requireDeleteUser = requirePermissionAny('manage_users', 'delete_user');

app.get('/api/admin/roles', requireAdmin, requireManageRoles, async (_req, res) => {
  const roles = await getRolesWithPermissions();
  res.json(roles);
});

app.post('/api/admin/roles', requireAdmin, requireManageRoles, async (req, res) => {
  try {
    const { name, description } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const role = await createRole({ name: name.trim(), description: description?.trim() || null });
    res.status(201).json(role);
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY' || e?.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Role name already exists' });
    }
    console.error('[api][admin/roles]', e?.message || e);
    res.status(500).json({ error: e?.message || 'Failed to create role' });
  }
});

app.put('/api/admin/roles/:id', requireAdmin, requireManageRoles, async (req, res) => {
  try {
    const { name, description } = req.body || {};
    const role = await updateRole(Number(req.params.id), { name: name?.trim(), description: description?.trim() });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json(role);
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY' || e?.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Role name already exists' });
    }
    console.error('[api][admin/roles]', e?.message || e);
    res.status(500).json({ error: e?.message || 'Failed to update role' });
  }
});

app.delete('/api/admin/roles/:id', requireAdmin, requireManageRoles, async (req, res) => {
  try {
    const result = await deleteRole(Number(req.params.id));
    if (!result.deleted) return res.status(400).json({ error: result.error || 'Cannot delete role' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[api][admin/roles]', e?.message || e);
    res.status(500).json({ error: e?.message || 'Failed to delete role' });
  }
});

app.get('/api/admin/permissions', requireAdmin, requireManageRoles, async (_req, res) => {
  const permissions = await getPermissions();
  const rolePermissions = await getRolePermissions();
  res.json({ ok: true, permissions, rolePermissions });
});

app.post('/api/admin/permissions', requireAdmin, requireManageRoles, async (req, res) => {
  try {
    const { name, description } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const perm = await createPermission({ name: name.trim(), description: description?.trim() || null });
    res.status(201).json(perm);
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY' || e?.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Permission name already exists' });
    }
    console.error('[api][admin/permissions]', e?.message || e);
    res.status(500).json({ error: e?.message || 'Failed to create permission' });
  }
});

app.post('/api/admin/roles/:id/permissions', requireAdmin, requireManageRoles, async (req, res) => {
  try {
    const roleId = Number(req.params.id);
    const { permissionIds } = req.body || {};
    const role = await getRoleById(roleId);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    await assignRolePermissions(roleId, Array.isArray(permissionIds) ? permissionIds : []);
    const updated = await getRoleById(roleId);
    const permIds = await getPermissionIdsForRole(roleId);
    res.json({ ...updated, permissionIds: permIds });
  } catch (e) {
    console.error('[api][admin/roles/:id/permissions]', e?.message || e);
    res.status(500).json({ error: e?.message || 'Failed to assign permissions' });
  }
});

app.put('/api/admin/users/:id/role', requireAdmin, requireEditUser, async (req, res) => {
  const id = Number(req.params.id);
  const { roleId } = req.body || {};
  if (!Number.isFinite(id) || !Number.isFinite(Number(roleId))) {
    return res.status(400).json({ ok: false, message: 'Invalid user or roleId.' });
  }
  const user = await updateAdminUserRole(id, Number(roleId));
  if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
  logActivity({ action: 'admin_role_updated', adminUsername: req.admin?.username, ipAddress: getClientIp(req), details: `User ${user.email} → role ${roleId}` }).catch(() => {});
  res.json({ ok: true, user: { ...user, username: user.email } });
});

// ── Roles & Users API (User Management – dynamic, no hardcoding) ──
app.get('/api/roles', requireAdmin, requireManageRoles, async (_req, res) => {
  try {
    const roles = await getAppRoles();
    res.json(roles);
  } catch (e) {
    console.error('[api][roles]', e?.message || e);
    res.status(500).json({ error: e?.message || 'Failed to load roles' });
  }
});

app.post('/api/roles', requireAdmin, requireManageRoles, async (req, res) => {
  try {
    const { name, permissions } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const role = await createAppRole({ name: name.trim(), permissions: permissions || {} });
    res.status(201).json(role);
  } catch (e) {
    if (e?.message?.includes('UNIQUE') || e?.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Role name already exists' });
    }
    console.error('[api][roles]', e?.message || e);
    res.status(500).json({ error: e?.message || 'Failed to create role' });
  }
});

app.put('/api/roles/:id', requireAdmin, requireManageRoles, async (req, res) => {
  try {
    const { name, permissions } = req.body || {};
    const role = await updateAppRole(req.params.id, { name: name?.trim(), permissions });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json(role);
  } catch (e) {
    console.error('[api][roles]', e?.message || e);
    res.status(500).json({ error: e?.message || 'Failed to update role' });
  }
});

app.delete('/api/roles/:id', requireAdmin, requireManageRoles, async (req, res) => {
  try {
    const result = await deleteAppRole(req.params.id);
    if (!result.deleted) {
      return res.status(400).json({ error: result.error || 'Cannot delete role' });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('[api][roles]', e?.message || e);
    res.status(500).json({ error: e?.message || 'Failed to delete role' });
  }
});

app.get('/api/users', requireAdmin, requirePermission('manage_users'), async (_req, res) => {
  try {
    const users = await getAppUsers();
    res.json(users);
  } catch (e) {
    console.error('[api][users]', e?.message || e);
    res.status(500).json({ error: e?.message || 'Failed to load users' });
  }
});

app.post('/api/users', requireAdmin, requireCreateUser, async (req, res) => {
  try {
    const { name, username, email, password, roleId } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!username?.trim()) return res.status(400).json({ error: 'Username is required' });
    if (!email?.trim()) return res.status(400).json({ error: 'Email is required' });
    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (!roleId) return res.status(400).json({ error: 'roleId is required' });
    if (name.trim().length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
    if (username.trim().length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const existing = await getAppUserByUsername(username);
    if (existing) return res.status(400).json({ error: 'Username already taken' });
    const hash = await bcrypt.hash(password, 10);
    const user = await createAppUser({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password_hash: hash,
      role_id: roleId,
    });
    logActivity({ action: 'app_user_created', adminUsername: req.admin?.username, ipAddress: getClientIp(req), details: `User: ${username}` }).catch(() => {});
    res.status(201).json(user);
  } catch (e) {
    if (e?.message?.includes('UNIQUE') || e?.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username or email already taken' });
    }
    console.error('[api][users]', e?.message || e);
    res.status(500).json({ error: e?.message || 'Failed to create user' });
  }
});

// ── Admin: User Management (legacy admin_users table) ──
app.get('/api/admin/users', requireAdmin, requireViewUsers, async (_req, res) => {
  const rows = await getAdminUsers();
  const users = rows.map((u) => ({ ...u, username: u.email }));
  const primaryAdmin = process.env.ADMIN_USERNAME || 'admin';
  const primaryAdminEmail = process.env.PRIMARY_ADMIN_EMAIL || process.env.ADMIN_EMAIL || primaryAdmin;
  res.json({ ok: true, users, primaryAdmin, primaryAdminEmail });
});

app.post('/api/admin/users', requireAdmin, requireCreateUser, async (req, res) => {
  try {
    const { name, username, roleId, password } = req.body || {};
    const login = (username || req.body?.email || '').trim().toLowerCase();
    const primaryAdmin = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    if (!name?.trim() || !login || !password) {
      return res.status(400).json({ ok: false, message: 'Name, username, and password required.' });
    }
    if (!roleId) return res.status(400).json({ ok: false, message: 'Role is required.' });
    if (name.trim().length < 2) {
      return res.status(400).json({ ok: false, message: 'Name must be at least 2 characters.' });
    }
    if (login.length < 3 || login.length > 30) {
      return res.status(400).json({ ok: false, message: 'Username must be 3–30 characters.' });
    }
    if (!/^[a-z0-9_]+$/.test(login)) {
      return res.status(400).json({ ok: false, message: 'Username: letters, numbers, underscores only (no spaces).' });
    }
    if (login === primaryAdmin) {
      return res.status(400).json({ ok: false, message: 'Username cannot match primary admin.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, message: 'Password must be at least 6 characters.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await createAdminUser({ name: name.trim(), email: login, role_id: Number(roleId), password_hash: hash });
    logActivity({ action: 'admin_user_created', adminUsername: req.admin?.username, ipAddress: getClientIp(req), details: `Admin user: ${login}` }).catch(() => {});
    res.status(201).json({ ok: true, user: { ...user, username: user?.email } });
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY' || e?.message?.includes('UNIQUE') || e?.message?.includes('unique')) {
      return res.status(400).json({ ok: false, message: 'Username already taken.' });
    }
    console.error('[api][admin/users]', e?.message || e);
    res.status(500).json({ ok: false, message: e?.message || 'Unable to create user.' });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, requireDeleteUser, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ ok: false });
  await deleteAdminUser(id);
  logActivity({ action: 'admin_user_deleted', adminUsername: req.admin?.username, ipAddress: getClientIp(req), details: `Admin user ID ${id}` }).catch(() => {});
  res.json({ ok: true });
});

// ── Admin: Backup ──
app.post('/api/admin/backup', requireAdmin, async (_req, res) => {
  logActivity({ action: 'backup_requested', adminUsername: _req.admin?.username, ipAddress: getClientIp(_req), details: 'Backup triggered' }).catch(() => {});
  res.json({ ok: true, message: 'Backup requested. Use your database tool (phpMyAdmin, mysqldump) for full backup.' });
});

// ── Admin: Activity Logs ──
app.get('/api/admin/activity-logs', requireAdmin, requirePermission('manage_settings'), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const logs = await getActivityLogs(limit);
    res.json({ ok: true, logs: logs || [] });
  } catch (err) {
    console.error('[api][activity-logs]', err?.message || err);
    res.status(500).json({ ok: false, message: 'Failed to load activity logs', logs: [] });
  }
});

app.get('/api/admin/conversations', requireAdminOrLendingSecret, requirePermission('manage_tickets'), async (_req, res) => {
  res.json(await getAllConversations());
});

app.get('/api/admin/conversations/archived', requireAdminOrLendingSecret, requirePermission('manage_tickets'), async (_req, res) => {
  res.json(await getArchivedConversations());
});

app.get('/api/admin/conversations/:id/messages', requireAdminOrLendingSecret, requirePermission('manage_tickets'), async (req, res) => {
  await clearConversationUnread(req.params.id);
  res.json(await getMessages(req.params.id));
});

app.patch('/api/admin/conversations/:id/status', requireAdminOrLendingSecret, requirePermission('manage_tickets'), async (req, res) => {
  const { status } = req.body;
  if (!['open', 'in_progress', 'resolved'].includes(status)) {
    return res.status(400).json({ ok: false });
  }
  await updateStatus(req.params.id, status);
  io.to('admin').emit('conversation:updated', await getConversation(req.params.id));
  io.to(req.params.id).emit('conversation:statusChanged', { status });
  res.json({ ok: true });
});

app.patch('/api/admin/conversations/:id/mode', requireAdminOrLendingSecret, requirePermission('manage_tickets'), async (req, res) => {
  const { mode, ai_enabled } = req.body;
  const targetMode = mode === 'human' || ai_enabled === false ? 'human' : 'ai';
  await updateMode(req.params.id, targetMode);
  const convo = await getConversation(req.params.id);
  io.to('admin').emit('conversation:updated', convo);
  io.to(req.params.id).emit('conversation:modeChanged', { conversationId: req.params.id, mode: targetMode });
  res.json({ ok: true, mode: targetMode, ai_enabled: targetMode === 'ai' });
});

app.patch('/api/admin/conversations/:id/archive', requireAdminOrLendingSecret, requirePermission('manage_tickets'), async (req, res) => {
  await archiveConversation(req.params.id);
  io.to('admin').emit('conversations:refresh');
  io.to(req.params.id).emit('conversation:statusChanged', { status: 'archived' });
  res.json({ ok: true });
});

app.delete('/api/admin/conversations/:id', requireAdminOrLendingSecret, requirePermission('manage_tickets'), async (req, res) => {
  await deleteConversation(req.params.id);
  io.to('admin').emit('conversations:refresh');
  res.json({ ok: true });
});

// ── Admin: Leads ──

app.get('/api/admin/leads', requireAdminOrLendingSecret, requirePermission('manage_tickets'), async (req, res) => {
  const { status, search } = req.query;
  res.json(await getLeads({ status: status || undefined, search: search || undefined }));
});

app.get('/api/admin/leads/export', requireAdminOrLendingSecret, requirePermission('manage_tickets'), async (req, res) => {
  const { format, status, search } = req.query;
  const leads = await getLeads({ status: status || undefined, search: search || undefined });
  if (format === 'csv') {
    const header = 'Name,Email,Phone,Company,Inquiry Message,Conversation ID,Source Page,Status,Created At\n';
    const escape = (v) => (v != null ? String(v).replace(/"/g, '""') : '');
    const rows = leads
      .map((l) =>
        [l.name, l.email, l.phone, l.company, l.inquiry_message, l.conversation_id, l.source_page, l.status, l.created_at]
          .map((c) => `"${escape(c)}"`)
          .join(',')
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
    return res.send(header + rows);
  }
  res.json(leads);
});

app.patch('/api/admin/leads/:id', requireAdminOrLendingSecret, requirePermission('manage_tickets'), async (req, res) => {
  const { id } = req.params;
  const { status, name, email, phone, company, inquiry_message } = req.body || {};
  const lead = await getLeadById(Number(id));
  if (!lead) return res.status(404).json({ ok: false, message: 'Lead not found' });
  if (status !== undefined) {
    await updateLeadStatus(Number(id), status);
  } else if (name !== undefined || email !== undefined || phone !== undefined || company !== undefined || inquiry_message !== undefined) {
    await updateLead(Number(id), { name, email, phone, company, inquiry_message, status: lead.status });
  }
  io.to('admin').emit('leads:refresh');
  res.json(await getLeadById(Number(id)));
});

// ── Admin: Subscribers (Careers & News) ──

app.get('/api/admin/subscribers', requireAdmin, async (req, res) => {
  const { subscription_type, search } = req.query;
  const list = await getSubscribers({
    subscription_type: subscription_type || undefined,
    search: search || undefined,
  });
  const total = await countSubscribers();
  res.json({ ok: true, subscribers: list, total });
});

app.get('/api/admin/subscribers/export', requireAdmin, async (req, res) => {
  const { subscription_type } = req.query;
  const list = await getSubscribers({ subscription_type: subscription_type || undefined });
  const header = 'Email,Subscription Type,Created At\n';
  const escape = (v) => (v != null ? String(v).replace(/"/g, '""') : '');
  const rows = list
    .map((s) => [s.email, s.subscription_type, s.created_at].map((c) => `"${escape(c)}"`).join(','))
    .join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
  res.send(header + rows);
});

app.delete('/api/admin/subscribers/:id', requireAdmin, async (req, res) => {
  const ok = await deleteSubscriber(Number(req.params.id));
  if (!ok) return res.status(404).json({ ok: false });
  res.json({ ok: true });
});

// ── Admin: Email status & test send ──

app.get('/api/admin/email/status', requireAdmin, (_req, res) => {
  const key = (process.env.BREVO_API_KEY || '').trim()
  const smtp = (process.env.SMTP_HOST || '').trim()
  const provider = key ? 'brevo-api'
    : (process.env.MAILERSEND_API_KEY || '').trim() ? 'mailersend'
    : (process.env.RESEND_API_KEY || '').trim() ? 'resend'
    : smtp ? 'smtp'
    : null
  res.json({
    ok: true,
    configured: isEmailConfigured(),
    provider,
    from: process.env.MAIL_FROM || '(not set)',
    smtp_host: smtp || null,
  });
});

app.post('/api/admin/email/test', requireAdmin, async (req, res) => {
  const { to } = req.body || {};
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
    return res.status(400).json({ ok: false, message: 'A valid "to" email is required.' });
  }
  if (!isEmailConfigured()) {
    return res.status(400).json({ ok: false, message: 'No email provider configured. Add BREVO_API_KEY or SMTP_HOST to .env' });
  }
  try {
    await sendTestEmail(to.trim());
    res.json({ ok: true, message: `Test email sent to ${to.trim()}` });
  } catch (err) {
    const msg = err?.message || String(err);
    console.error('[api] email/test failed:', msg);
    res.status(500).json({ ok: false, message: msg });
  }
});

// ── Admin: Send notification emails ──

app.post('/api/admin/notifications/send', requireAdmin, async (req, res) => {
  const { type, title, description } = req.body || {};
  if (!type || !['news', 'careers'].includes(type)) {
    return res.status(400).json({ ok: false, message: 'type must be "news" or "careers"' });
  }
  if (!title?.trim()) {
    return res.status(400).json({ ok: false, message: 'title required' });
  }
  if (!isEmailConfigured()) {
    return res.status(400).json({ ok: false, message: 'Configure MailerSend (MAILERSEND_API_KEY), Brevo, or SMTP in .env' });
  }
  try {
    const subs = await getSubscribersForNotification(type);
    sendNotificationEmails(
      { type, title: title.trim(), description: (description || '').trim(), port },
      subs
    );
    res.json({ ok: true, queued: subs.length, message: `Queued ${subs.length} email(s) for delivery` });
  } catch (err) {
    console.error('[api] notifications/send', err?.message || err);
    res.status(500).json({ ok: false, message: 'Failed to send: ' + (err?.message || 'Unknown error') });
  }
});

// ── Admin: Job applications ──
const RESUMES_PUBLIC_DIR = path.join(__dirname, 'storage', 'app', 'public', 'resumes');
function resolveApplicationResumePath(rel) {
  if (!rel || typeof rel !== 'string') return null;
  const base = path.basename(rel.replace(/\\/g, '/'));
  if (!base || base.includes('..')) return null;
  const full = path.resolve(path.join(RESUMES_PUBLIC_DIR, base));
  if (!full.startsWith(path.resolve(RESUMES_PUBLIC_DIR)) || !fs.existsSync(full)) return null;
  return full;
}

app.get('/api/admin/applications', requireAdmin, requirePermissionAny('manage_applications', 'manage_settings'), async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const rows = await listApplications({ search });
    const applications = Array.isArray(rows) ? rows : [];
    console.log('[api][admin][applications] DB:', process.env.MYSQL_DATABASE || 'sqlite', '→', applications.length, 'rows');
    res.json({ ok: true, applications });
  } catch (err) {
    console.error('[api][admin][applications]', err?.message || err);
    res.status(500).json({ ok: false, message: 'Failed to load applications.' });
  }
});

// ── Admin: Amalgated Lending (loan applications from lending site) ──
app.get('/api/admin/lending-applications', requireAdmin, requirePermissionAny('manage_applications', 'manage_settings'), async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 300, 1), 500);
    const applications = await listLendingApplications({ limit });
    res.json({ ok: true, applications });
  } catch (err) {
    console.error('[api][admin][lending-applications]', err?.message || err);
    res.status(500).json({ ok: false, message: 'Failed to load lending applications.' });
  }
});

app.patch('/api/admin/applications/:id/status', requireAdmin, requirePermissionAny('manage_applications', 'manage_settings'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ ok: false, message: 'Invalid id.' });
  const raw = String(req.body?.status || '').trim().toLowerCase();
  const allowed = new Set(['new', 'called', 'ongoing', 'failed']);
  if (!allowed.has(raw)) return res.status(400).json({ ok: false, message: 'Invalid status.' });

  try {
    await updateApplicationStatus(id, raw);
    io.to('admin').emit('applications:refresh');
    res.json({ ok: true });
  } catch (err) {
    console.error('[api][admin][applications][status]', err?.message || err);
    res.status(500).json({ ok: false, message: 'Failed to update status.' });
  }
});

function sanitizeFileName(name) {
  if (!name || typeof name !== 'string') return 'resume';
  return name
    .replace(/[/\\:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200) || 'resume';
}

app.get('/api/admin/applications/:id/resume', requireAdmin, requirePermissionAny('manage_applications', 'manage_settings'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ ok: false });
  try {
    const row = await getApplicationById(id);
    if (!row) return res.status(404).json({ ok: false, message: 'Not found' });
    const full = resolveApplicationResumePath(row.resume);
    if (!full) return res.status(404).json({ ok: false, message: 'Resume file not found' });
    const ext = path.extname(row.resume || full) || '.pdf';
    const downloadName = sanitizeFileName(row.full_name) + ext;
    return res.download(full, downloadName);
  } catch (err) {
    console.error('[api][admin][applications][resume]', err?.message || err);
    return res.status(500).json({ ok: false });
  }
});

app.delete('/api/admin/applications/:id', requireAdmin, requirePermissionAny('manage_applications', 'manage_settings'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ ok: false });
  try {
    const row = await getApplicationById(id);
    if (!row) return res.status(404).json({ ok: false });
    const full = resolveApplicationResumePath(row.resume);
    if (full) {
      try {
        fs.unlinkSync(full);
      } catch {
        /* file missing or locked */
      }
    }
    await deleteApplication(id);
    res.json({ ok: true });
  } catch (err) {
    console.error('[api][admin][applications][delete]', err?.message || err);
    res.status(500).json({ ok: false });
  }
});

// ── Admin: Careers & News (DB-backed) ──

app.get('/api/admin/careers', requireAdmin, requirePermissionAny('edit_content', 'manage_settings'), async (_req, res) => {
  res.json({ ok: true, positions: await getCareerPositions() });
});

app.post('/api/admin/careers', requireAdmin, requirePermissionAny('edit_content', 'manage_settings'), async (req, res) => {
  const { title, location, department, type, summary } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ ok: false, message: 'title required' });
  const position = await createCareerPosition({
    title: title.trim(),
    location: (location || '').trim() || null,
    department: (department || '').trim() || null,
    type: (type || '').trim() || null,
    summary: (summary || '').trim() || null,
  });
  if (isEmailConfigured()) {
    getSubscribersForNotification('careers')
      .then((subs) => {
        console.log(`[email] Notifying ${subs.length} subscriber(s) about new career: "${position.title}"`);
        return sendNotificationEmails(
          { type: 'careers', title: position.title, description: position.summary || position.location || '', port },
          subs
        );
      })
      .catch((e) => console.error('[email] careers notification error:', e?.message || e));
  }
  res.json({ ok: true, position });
});

app.patch('/api/admin/careers/:id', requireAdmin, requirePermissionAny('edit_content', 'manage_settings'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ ok: false });
  const { title, location, department, type, summary } = req.body || {};
  const updated = await updateCareerPosition(id, {
    title: title !== undefined ? String(title).trim() : undefined,
    location: location !== undefined ? String(location).trim() : undefined,
    department: department !== undefined ? String(department).trim() : undefined,
    type: type !== undefined ? String(type).trim() : undefined,
    summary: summary !== undefined ? String(summary).trim() : undefined,
  });
  if (!updated) return res.status(404).json({ ok: false });
  res.json({ ok: true, position: updated });
});

app.delete('/api/admin/careers/:id', requireAdmin, requirePermissionAny('edit_content', 'manage_settings'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ ok: false });
  await deleteCareerPosition(id);
  res.json({ ok: true });
});

app.get('/api/admin/news-items', requireAdmin, requirePermissionAny('edit_content', 'manage_settings'), async (_req, res) => {
  res.json({ ok: true, items: await getNewsItems() });
});

app.post('/api/admin/news-items', requireAdmin, requirePermissionAny('edit_content', 'manage_settings'), async (req, res) => {
  const { title, category, date, summary } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ ok: false, message: 'title required' });
  const item = await createNewsItem({
    title: title.trim(),
    category: (category || '').trim() || null,
    date: (date || '').trim() || null,
    summary: (summary || '').trim() || null,
  });
  if (isEmailConfigured()) {
    getSubscribersForNotification('news')
      .then((subs) => {
        console.log(`[email] Notifying ${subs.length} subscriber(s) about new news: "${item.title}"`);
        return sendNotificationEmails(
          { type: 'news', title: item.title, description: item.summary || item.category || '', port },
          subs
        );
      })
      .catch((e) => console.error('[email] news notification error:', e?.message || e));
  }
  res.json({ ok: true, item });
});

app.patch('/api/admin/news-items/:id', requireAdmin, requirePermissionAny('edit_content', 'manage_settings'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ ok: false });
  const { title, category, date, summary } = req.body || {};
  const updated = await updateNewsItem(id, {
    title: title !== undefined ? String(title).trim() : undefined,
    category: category !== undefined ? String(category).trim() : undefined,
    date: date !== undefined ? String(date).trim() : undefined,
    summary: summary !== undefined ? String(summary).trim() : undefined,
  });
  if (!updated) return res.status(404).json({ ok: false });
  res.json({ ok: true, item: updated });
});

app.delete('/api/admin/news-items/:id', requireAdmin, requirePermissionAny('edit_content', 'manage_settings'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ ok: false });
  await deleteNewsItem(id);
  res.json({ ok: true });
});

app.get('/api/admin/newsletter-content', requireAdmin, requirePermissionAny('edit_content', 'manage_settings'), async (_req, res) => {
  res.json({ ok: true, content: (await getNewsletterContent()) || {} });
});

app.put('/api/admin/newsletter-content', requireAdmin, requirePermissionAny('edit_content', 'manage_settings'), async (req, res) => {
  const { content } = req.body || {};
  if (!content || typeof content !== 'object') return res.status(400).json({ ok: false, message: 'content object required' });
  const next = await setNewsletterContent(content);
  res.json({ ok: true, content: next });
});

// ── Admin: CMS (edit_content) ──
const requireEditContent = requirePermissionAny('edit_content', 'manage_settings');

app.get('/api/admin/cms/pages', requireAdmin, requireEditContent, async (_req, res) => {
  try {
    const pages = await getCmsPages();
    res.json({ ok: true, pages });
  } catch (err) {
    console.error('[api][admin][cms/pages]', err?.message || err);
    res.status(500).json({ ok: false, message: 'Failed to load pages.' });
  }
});

app.get('/api/admin/cms/pages/:pageName', requireAdmin, requireEditContent, async (req, res) => {
  try {
    const pageName = String(req.params.pageName || '').trim().toLowerCase();
    if (!pageName) return res.status(400).json({ ok: false, message: 'Page name required.' });
    const page = await getCmsPageByName(pageName);
    if (!page) return res.status(404).json({ ok: false, message: 'Page not found.' });
    const sections = await getCmsSectionsByPageId(page.id);
    const sectionsWithContent = [];
    for (const sec of sections) {
      const contents = await getCmsContentsBySectionId(sec.id);
      sectionsWithContent.push({ ...sec, contents });
    }
    res.json({ ok: true, page: { ...page, sections: sectionsWithContent } });
  } catch (err) {
    console.error('[api][admin][cms/pages/:pageName]', err?.message || err);
    res.status(500).json({ ok: false });
  }
});

app.put('/api/admin/cms/pages/:pageName', requireAdmin, requireEditContent, async (req, res) => {
  try {
    const pageName = String(req.params.pageName || '').trim().toLowerCase();
    const { content } = req.body || {};
    if (!pageName) return res.status(400).json({ ok: false, message: 'Page name required.' });
    if (!content || typeof content !== 'object') return res.status(400).json({ ok: false, message: 'content object required.' });
    const page = await getCmsPageByName(pageName);
    if (!page) return res.status(404).json({ ok: false, message: 'Page not found.' });
    for (const [sectionKey, items] of Object.entries(content)) {
      if (!items || typeof items !== 'object') continue;
      const section = await getCmsSectionByPageAndKey(page.id, sectionKey);
      if (!section) continue;
      for (const [contentKey, val] of Object.entries(items)) {
        const value = val != null ? String(val) : '';
        const type = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value) || value.startsWith('/uploads/') ? 'image' : 'text';
        await upsertCmsContent(section.id, type, contentKey, value);
      }
    }
    const updated = await getCmsPageContent(pageName);
    io.emit('cms:updated', { pageName });
    res.json({ ok: true, content: updated });
  } catch (err) {
    console.error('[api][admin][cms/pages/:pageName] PUT', err?.message || err);
    res.status(500).json({ ok: false });
  }
});

app.post('/api/admin/cms/upload', requireAdmin, requireEditContent, uploadCmsImage.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'No file uploaded.' });
    const filename = req.file.filename || path.basename(req.file.path);
    const url = `/uploads/cms/${filename}`;
    res.json({ ok: true, url });
  } catch (err) {
    console.error('[api][admin][cms/upload]', err?.message || err);
    res.status(500).json({ ok: false });
  }
});

// ── Admin: Analytics (real-time from visitor_visits in DB) ──

const emptyAnalytics = () => ({
  visits: 0,
  totalVisits: 0,
  totalMessages: 0,
  viewersCount: 0,
  messagedCount: 0,
  avgDurationSeconds: 0,
  byDevice: {},
  byBrowser: {},
  byLocation: {},
  byDeviceMessaged: {},
  byBrowserMessaged: {},
  byLocationMessaged: {},
  recentVisits: [],
  recentViewers: [],
  recentMessaged: [],
});

app.get('/api/admin/analytics', requireAdminOrLendingSecret, async (req, res) => {
  const { since = '-7 days' } = req.query;
  let visitsRaw = [];
  let allVisitsRaw = [];
  try {
    visitsRaw = await getVisitsForAnalytics(since);
    allVisitsRaw = await getAllVisits();
  } catch (err) {
    console.error('[api][admin][analytics]', err?.message || err);
    return res.json(emptyAnalytics());
  }

  // Basic hygiene: ignore obvious internal traffic + bots,
  // and cap session duration so a single long tab doesn't skew the average.
  const MAX_SESSION_SECONDS = 3 * 60 * 60; // 3 hours
  const includeLocalVisits = ['1', 'true', 'yes'].includes(
    String(process.env.ANALYTICS_INCLUDE_LOCAL || '').toLowerCase().trim(),
  );
  const isInternalOrBot = (v) => {
    const ip = (v.ip || '').toLowerCase();
    const browser = (v.browser || '').toLowerCase();
    if (!ip && !browser) return false;
    const isLocalOrPrivateIp =
      ip === '::1' ||
      ip === '127.0.0.1' ||
      ip === '::ffff:127.0.0.1' ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('172.16.');
    if (!includeLocalVisits && ip && isLocalOrPrivateIp) return true;
    if (
      browser &&
      (browser.includes('bot') ||
        browser.includes('crawler') ||
        browser.includes('spider') ||
        browser.includes('headless'))
    ) {
      return true;
    }
    return false;
  };

  const visits = visitsRaw.filter((v) => !isInternalOrBot(v));
  const allVisits = allVisitsRaw.filter((v) => !isInternalOrBot(v));

  // Separate: viewers (no message) vs messaged (sent at least one message)
  const viewers = visits.filter((v) => (v.message_count || 0) === 0);
  const messaged = visits.filter((v) => (v.message_count || 0) >= 1);

  const byDevice = {};
  const byBrowser = {};
  const byLocation = {};
  const byDeviceMessaged = {};
  const byBrowserMessaged = {};
  const byLocationMessaged = {};
  let totalMessages = 0;
  let totalDuration = 0;

  visits.forEach((v) => {
    byDevice[v.device || 'Unknown'] = (byDevice[v.device || 'Unknown'] || 0) + 1;
    byBrowser[v.browser || 'Unknown'] = (byBrowser[v.browser || 'Unknown'] || 0) + 1;
    byLocation[v.location || 'Unknown'] = (byLocation[v.location || 'Unknown'] || 0) + 1;
    totalMessages += v.message_count || 0;
    const rawDuration = Number.isFinite(v.visit_duration_seconds)
      ? v.visit_duration_seconds
      : Number(v.visit_duration_seconds) || 0;
    totalDuration += Math.max(0, Math.min(rawDuration, MAX_SESSION_SECONDS));
    if ((v.message_count || 0) >= 1) {
      byDeviceMessaged[v.device || 'Unknown'] = (byDeviceMessaged[v.device || 'Unknown'] || 0) + 1;
      byBrowserMessaged[v.browser || 'Unknown'] = (byBrowserMessaged[v.browser || 'Unknown'] || 0) + 1;
      byLocationMessaged[v.location || 'Unknown'] = (byLocationMessaged[v.location || 'Unknown'] || 0) + 1;
    }
  });

  res.json({
    visits: visits.length,
    totalVisits: allVisits.length,
    totalMessages,
    viewersCount: viewers.length,
    messagedCount: messaged.length,
    avgDurationSeconds: visits.length ? Math.round(totalDuration / visits.length) : 0,
    byDevice,
    byBrowser,
    byLocation,
    byDeviceMessaged,
    byBrowserMessaged,
    byLocationMessaged,
    recentVisits: visits.slice(0, 50),
    recentViewers: viewers.slice(0, 30),
    recentMessaged: messaged.slice(0, 30),
  });
});

// ── Admin: Tickets ──

app.get('/api/admin/tickets', requireAdminOrLendingSecret, async (req, res) => {
  const { status, conversationId } = req.query;
  res.json(await getTickets({ status: status || undefined, conversationId: conversationId || undefined }));
});

app.post('/api/admin/tickets', requireAdminOrLendingSecret, async (req, res) => {
  const { conversation_id, priority, status, assigned_staff, notes } = req.body || {};
  if (!conversation_id) return res.status(400).json({ ok: false, message: 'conversation_id required' });
  const ticket = await createTicket(conversation_id, { priority, status, assigned_staff, notes });
  logActivity({ action: 'ticket_created', adminUsername: req.admin?.username, ipAddress: getClientIp(req), details: `Chat ticket #${ticket?.id || ''} for conversation ${conversation_id}` }).catch(() => {});
  io.to('admin').emit('tickets:refresh');
  res.json(ticket);
});

app.patch('/api/admin/tickets/:id', requireAdminOrLendingSecret, async (req, res) => {
  const { id } = req.params;
  const { priority, status, assigned_staff, notes } = req.body || {};
  const ticket = await getTicketById(Number(id));
  if (!ticket) return res.status(404).json({ ok: false, message: 'Ticket not found' });
  const updated = await updateTicket(Number(id), { priority, status, assigned_staff, notes });
  logActivity({ action: 'ticket_updated', adminUsername: req.admin?.username, ipAddress: getClientIp(req), details: `Chat ticket #${id}` }).catch(() => {});
  await setTicketUnread(Number(id), false);
  io.to('admin').emit('tickets:refresh');
  res.json(updated);
});

app.get('/api/admin/tickets/by-conversation/:conversationId', requireAdminOrLendingSecret, async (req, res) => {
  res.json(await getTicketsByConvo(req.params.conversationId));
});

// ── CRM tickets (standalone support system) ──
app.get('/api/tickets', requireAdmin, async (req, res) => {
  const { status, priority, assigned_to, search } = req.query;
  const tickets = await getCrmTickets({
    status: status || undefined,
    priority: priority || undefined,
    assigned_to: assigned_to != null ? Number(assigned_to) : undefined,
    search: search || undefined,
  });
  res.json({ ok: true, tickets });
});

app.get('/api/tickets/:id', requireAdmin, async (req, res) => {
  const ticket = await getCrmTicketById(Number(req.params.id));
  if (!ticket) return res.status(404).json({ ok: false, message: 'Ticket not found' });
  await setCrmTicketUnread(Number(req.params.id), false);
  res.json({ ok: true, ticket });
});

app.post('/api/tickets', requireAdmin, async (req, res) => {
  const { customer_name, email, subject, category, priority, message } = req.body || {};
  if (!customer_name || !email || !subject) {
    return res.status(400).json({ ok: false, message: 'customer_name, email, and subject required' });
  }
  const ticket = await createCrmTicket({ customer_name, email, subject, category, priority, message });
  logActivity({ action: 'ticket_created', adminUsername: req.admin?.username, ipAddress: getClientIp(req), details: `CRM ticket #${ticket?.id || ''} – ${(subject || '').slice(0, 50)}` }).catch(() => {});
  io.to('admin').emit('tickets:refresh');
  res.status(201).json({ ok: true, ticket });
});

app.put('/api/tickets/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const ticket = await getCrmTicketById(id);
  if (!ticket) return res.status(404).json({ ok: false, message: 'Ticket not found' });
  const allowed = ['status', 'priority', 'assigned_to', 'category', 'subject', 'customer_name', 'email'];
  const data = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  }
  const updated = await updateCrmTicket(id, data);
  logActivity({ action: 'ticket_updated', adminUsername: req.admin?.username, ipAddress: getClientIp(req), details: `CRM ticket #${id}` }).catch(() => {});
  io.to('admin').emit('tickets:refresh');
  res.json({ ok: true, ticket: updated });
});

app.delete('/api/tickets/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const ticket = await getCrmTicketById(id);
  if (!ticket) return res.status(404).json({ ok: false, message: 'Ticket not found' });
  await deleteCrmTicket(id);
  logActivity({ action: 'ticket_deleted', adminUsername: req.admin?.username, ipAddress: getClientIp(req), details: `CRM ticket #${id}` }).catch(() => {});
  io.to('admin').emit('tickets:refresh');
  res.json({ ok: true });
});

app.post('/api/tickets/:id/reply', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { message } = req.body || {};
  if (!message || !String(message).trim()) {
    return res.status(400).json({ ok: false, message: 'message required' });
  }
  const ticket = await addCrmTicketReply(id, String(message).trim());
  if (!ticket) return res.status(404).json({ ok: false, message: 'Ticket not found' });
  io.to('admin').emit('tickets:refresh');
  res.json({ ok: true, ticket, message: ticket.messages[ticket.messages.length - 1] });
});

app.post('/api/tickets/:id/notes', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { note } = req.body || {};
  if (!note || !String(note).trim()) {
    return res.status(400).json({ ok: false, message: 'note required' });
  }
  const adminId = 'admin';
  const ticket = await addCrmTicketNote(id, adminId, String(note).trim());
  if (!ticket) return res.status(404).json({ ok: false, message: 'Ticket not found' });
  res.json({ ok: true, ticket, note: ticket.notes[ticket.notes.length - 1] });
});

// ── Socket.io ──

function getSocketClientIp(socket) {
  const req = socket.request;
  return req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req?.connection?.remoteAddress || socket.handshake?.address || '';
}

io.on('connection', (socket) => {
  const ua = socket.handshake?.headers?.['user-agent'];
  const { device, browser } = parseUserAgent(ua);
  const ip = getSocketClientIp(socket);

  socket.on('visitor:join', async (payload) => {
    const conversationId = typeof payload === 'string' ? payload : payload?.conversationId;
    const source_page = typeof payload === 'object' ? payload?.source_page : undefined;
    const lang = typeof payload === 'object' ? payload?.lang : undefined;
    if (!conversationId) return;
    await createConversation(conversationId);
    socket.join(conversationId);
    socket.data.conversationId = conversationId;
    socket.data.role = 'visitor';
    socket.data.lang = normalizeLang(lang);

    const pages = source_page ? [source_page] : [];
    await createOrUpdateVisit(conversationId, conversationId, {
      ip,
      location: 'Unknown',
      device,
      browser,
      pages_visited: JSON.stringify(pages),
      message_count: 0,
    });
    io.to('admin').emit('conversations:refresh');
    io.to('admin').emit('analytics:refresh');
    resolveLocationFromIp(conversationId, ip, () => {});

    const msgs = await getMessages(conversationId);
    socket.emit('chat:history', msgs);
  });

  socket.on('admin:join', () => {
    socket.join('admin');
    socket.data.role = 'admin';
  });

  socket.on('admin:joinConversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('admin:leaveConversation', (conversationId) => {
    socket.leave(conversationId);
  });

  socket.on('visitor:message', async (payload) => {
    const { conversationId, content, source_page, lang } =
      typeof payload === 'object' ? payload : { conversationId: payload?.conversationId, content: payload?.content };
    if (!content?.trim()) return;
    const langCode = normalizeLang(lang || socket.data.lang);

    await createConversation(conversationId);
    await addMessage(conversationId, 'user', content.trim());
    await incrementConversationUnread(conversationId);

    const visit = await getVisitByVisitId(conversationId);
    if (visit) {
      let pages = [];
      try {
        pages = JSON.parse(visit.pages_visited || '[]');
      } catch {
        pages = [];
      }
      if (source_page && !pages.includes(source_page)) pages.push(source_page);
      const started = visit.started_at ? new Date(visit.started_at).getTime() : Date.now();
      const durationSec = Math.floor((Date.now() - started) / 1000);
      await createOrUpdateVisit(conversationId, conversationId, {
        pages_visited: JSON.stringify(pages),
        message_count: (visit.message_count || 0) + 1,
        visit_duration_seconds: durationSec,
      });
      io.to('admin').emit('analytics:refresh');
    } else {
      await createOrUpdateVisit(conversationId, conversationId, {
        ip: getSocketClientIp(socket),
        device,
        browser,
        pages_visited: source_page ? JSON.stringify([source_page]) : '[]',
        message_count: 1,
      });
      io.to('admin').emit('analytics:refresh');
    }

    const userMsg = {
      conversation_id: conversationId,
      sender: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    io.to(conversationId).emit('chat:message', userMsg);
    io.to('admin').emit('chat:newMessage', { conversationId, message: userMsg });

    const convo = await getConversation(conversationId);
    if (convo?.mode === 'ai') {
      if (wantsLeadCapture(content.trim())) {
        const askMsg = t(langCode, 'leadAsk');
        await addMessage(conversationId, 'ai', askMsg);
        const aiMsg = {
          conversation_id: conversationId,
          sender: 'ai',
          content: askMsg,
          created_at: new Date().toISOString(),
        };
        io.to(conversationId).emit('chat:message', aiMsg);
        io.to(conversationId).emit('chat:requestLeadDetails', { inquiry_message: content.trim() });
        io.to('admin').emit('chat:newMessage', { conversationId, message: aiMsg });
      } else {
        io.to(conversationId).emit('chat:typing', { sender: 'ai' });
        try {
          const reply = await getAIReply(conversationId, content.trim(), langCode);
          await addMessage(conversationId, 'ai', reply);
          const aiMsg = {
            conversation_id: conversationId,
            sender: 'ai',
            content: reply,
            created_at: new Date().toISOString(),
          };
          io.to(conversationId).emit('chat:message', aiMsg);
          io.to('admin').emit('chat:newMessage', { conversationId, message: aiMsg });
        } catch (err) {
          console.error('[ai]', err.message);
          const errMsg = {
            conversation_id: conversationId,
            sender: 'ai',
            content: t(langCode, 'aiError'),
            created_at: new Date().toISOString(),
          };
          io.to(conversationId).emit('chat:message', errMsg);
        }
        io.to(conversationId).emit('chat:typingStop');
      }
    }

    io.to('admin').emit('conversations:refresh');
  });

  socket.on('visitor:leadDetails', async ({ conversationId, name, email, phone, company, inquiry_message, source_page, lang }) => {
    if (!conversationId || !name?.trim() || !email?.trim()) return;
    const langCode = normalizeLang(lang || socket.data.lang);
    const lead = await createLead({
      name: name.trim(),
      email: email.trim(),
      phone: (phone || '').trim() || null,
      company: (company || '').trim() || null,
      inquiry_message: (inquiry_message || '').trim() || null,
      conversation_id: conversationId,
      source_page: (source_page || '').trim() || null,
    });
    const thankMsg = t(langCode, 'leadThanks');
    await addMessage(conversationId, 'ai', thankMsg);
    const aiMsg = {
      conversation_id: conversationId,
      sender: 'ai',
      content: thankMsg,
      created_at: new Date().toISOString(),
    };
    io.to(conversationId).emit('chat:message', aiMsg);
    io.to(conversationId).emit('chat:leadCaptured');
    io.to('admin').emit('chat:newMessage', { conversationId, message: aiMsg });
    io.to('admin').emit('admin:newLead', lead);
    io.to('admin').emit('conversations:refresh');
  });

  socket.on('visitor:requestAgent', async ({ conversationId, name, email, concern, phone, company, source_page }) => {
    await createConversation(conversationId);
    await updateMode(conversationId, 'human');
    await updateStatus(conversationId, 'open');
    if (name) await updateVisitor(conversationId, name, email || '');

    await addMessage(conversationId, 'user', `[Agent Request] Name: ${name || 'N/A'} | Email: ${email || 'N/A'} | Concern: ${concern || 'N/A'}`);

    // Save a lead so it appears in Admin → Leads
    if (name?.trim() && email?.trim()) {
      try {
        const lead = await createLead({
          name: name.trim(),
          email: email.trim(),
          phone: (phone || '').trim() || null,
          company: (company || '').trim() || null,
          inquiry_message: (concern || '').trim() || 'Requested a representative',
          conversation_id: conversationId,
          source_page: (source_page || '').trim() || null,
        });
        io.to('admin').emit('admin:newLead', lead);
      } catch (err) {
        console.error('[lead][requestAgent]', err?.message || err);
      }
    }

    const sysMsg = {
      conversation_id: conversationId,
      sender: 'ai',
      content: "You've been connected to our support queue. A representative will be with you shortly.",
      created_at: new Date().toISOString(),
    };
    await addMessage(conversationId, 'ai', sysMsg.content);
    io.to(conversationId).emit('chat:message', sysMsg);
    io.to('admin').emit('conversations:refresh');
  });

  socket.on('admin:message', async ({ conversationId, content, adminName }) => {
    if (!content?.trim()) return;

    await addMessage(conversationId, 'admin', content.trim(), adminName || 'Support Agent');
    await updateMode(conversationId, 'human');
    await updateStatus(conversationId, 'in_progress');
    await clearConversationUnread(conversationId);

    const adminMsg = {
      conversation_id: conversationId,
      sender: 'admin',
      admin_name: adminName || 'Support Agent',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    io.to(conversationId).emit('chat:message', adminMsg);
    io.to(conversationId).emit('conversation:modeChanged', { conversationId, mode: 'human' });
    io.to('admin').emit('chat:newMessage', { conversationId, message: adminMsg });
    io.to('admin').emit('conversation:updated', await getConversation(conversationId));
    io.to('admin').emit('conversations:refresh');
  });

  socket.on('admin:typing', ({ conversationId }) => {
    io.to(conversationId).emit('chat:typing', { sender: 'admin' });
  });

  socket.on('admin:typingStop', ({ conversationId }) => {
    io.to(conversationId).emit('chat:typingStop');
  });
});

app.get('/health', (_req, res) =>
  res.json({ ok: true, service: 'amalgated-lending-chat-server' }),
);

// ── Serve frontend (Vite build from repo root) on same origin ──
// `npm run build` writes to ../dist (amalgated-lending/), not chat-server/dist.

const distParent = path.join(__dirname, '..', 'dist');
const distLocal = path.join(__dirname, 'dist');
const clientDir = fs.existsSync(distParent) ? distParent : distLocal;

if (fs.existsSync(clientDir)) {
  app.use(express.static(clientDir, { fallthrough: true }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return res.status(404).end();
    }
    res.sendFile(path.join(clientDir, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
} else {
  // In dev (npm run dev:full) the UI is served by Vite on :5173 — chat server is API + Socket.IO only.
  const devFrontend = (process.env.VITE_DEV_SERVER_URL || process.env.SITE_URL || '').replace(/\/$/, '');
  if (devFrontend) {
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.startsWith('/health') || req.path.startsWith('/uploads')) {
        return next();
      }
      res.redirect(302, devFrontend + req.originalUrl);
    });
  } else if (process.env.NODE_ENV === 'production') {
    console.warn('[chat] No ../dist — run `npm run build` in the amalgated-lending project root to serve the SPA from this server.');
  } else {
    console.info('[chat] No ../dist (normal for dev). UI: Vite dev server (e.g. http://localhost:5173). Optional: set VITE_DEV_SERVER_URL in chat-server/.env to redirect :8010 → Vite.');
  }
}

function onChatListening() {
  console.log(`Amalgated Lending chat server listening on http://localhost:${port}`);
}

function startListening(nextPort) {
  port = nextPort;
  // Remove prior handler so a failed listen (EADDRINUSE) does not stack once('listening') callbacks.
  httpServer.off('listening', onChatListening);
  httpServer.once('listening', onChatListening);
  httpServer.listen(port);
}

httpServer.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    const retryPort = Number(port) + 1;
    console.warn(`Port ${port} is in use. Trying ${retryPort}...`);
    setTimeout(() => startListening(retryPort), 250);
    return;
  }
  console.error('Server error:', err);
  process.exit(1);
});

Promise.all([
  ensureApplicationsTable().catch((err) => console.error('[db] ensureApplicationsTable:', err?.message || err)),
  ensureLendingApplicationsTable().catch((err) => console.error('[db] ensureLendingApplicationsTable:', err?.message || err)),
]).finally(() => {
  if (DB_PROVIDER === 'mysql') {
    console.log('[db] MySQL — database:', process.env.MYSQL_DATABASE || 'amalgated_lending_chat', '| job applications in `applications` table.')
  } else {
    console.log('[db] SQLite (chat.db). For MySQL/XAMPP add DB_PROVIDER=mysql and MYSQL_* to .env.')
  }
  if (process.env.LENDING_ADMIN_API_SECRET) {
    console.log('[api] Lending admin API: GET /api/lending/applications (Bearer or X-Lending-Admin-Secret)')
  }
  startListening(port)
})
