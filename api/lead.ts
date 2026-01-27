import nodemailer from 'nodemailer';
import { checkRateLimit } from './_lib/rateLimit';
import { readJson, sendJson, setCors } from './_lib/http';

type LeadRequest = {
  name: string;
  email: string;
  phone: string;
  message?: string;
  context?: Record<string, any>;
  consent?: boolean;
};

function clampStr(v: any, max: number) {
  return String(v || '').trim().slice(0, max);
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default async function handler(req: any, res: any) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

  const rl = checkRateLimit(req);
  if (rl.ok !== true) {
    return sendJson(res, 429, { error: 'Rate limit exceeded' }, { 'Retry-After': String(rl.retryAfterSec) });
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.LEAD_TO;
  const from = process.env.LEAD_FROM || to;

  if (!host || !user || !pass || !to || !from) {
    return sendJson(res, 501, { error: 'Lead capture not configured (missing SMTP_* and/or LEAD_TO/LEAD_FROM env vars)' });
  }

  try {
    const raw = (await readJson(req)) as LeadRequest;

    const consent = Boolean(raw.consent);
    if (!consent) return sendJson(res, 400, { error: 'Consent required' });

    const name = clampStr(raw.name, 80);
    const email = clampStr(raw.email, 120);
    const phone = clampStr(raw.phone, 40);
    const message = clampStr(raw.message, 1200);

    if (!name) return sendJson(res, 400, { error: 'Missing name' });
    if (!email || !isEmail(email)) return sendJson(res, 400, { error: 'Invalid email' });
    if (!phone) return sendJson(res, 400, { error: 'Missing phone' });

    const context = raw.context && typeof raw.context === 'object' ? raw.context : {};

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const subject = `New lead: ${name} — Diosa Studio Yorkville`;

    const text = `New lead received\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message || '(none)'}\n\nContext (JSON):\n${JSON.stringify(context, null, 2)}\n`;

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      replyTo: email,
    });

    return sendJson(res, 200, { ok: true });
  } catch (e: any) {
    return sendJson(res, 500, { error: e?.message || 'Server error' });
  }
}
