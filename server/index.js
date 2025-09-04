import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import 'dotenv/config';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (replace with DB in production)
const bookings = [];
// Simple in-memory token revocation list (optional)
const validTokens = new Set();

// --- Auth Helpers (lightweight HMAC token) ---
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8; // 8h
function base64url(buf){ return Buffer.from(buf).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_'); }
function signToken(payload){
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const data = JSON.stringify(payload);
  const body = base64url(data);
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const token = body + '.' + sig;
  validTokens.add(token);
  return token;
}
function verifyToken(token){
  if(!token || !token.includes('.')) return null;
  if(!validTokens.has(token)) return null; // simple allow-list
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  if (expected !== sig) return null;
  try {
    const json = JSON.parse(Buffer.from(body.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString('utf8'));
    if(Date.now() > json.exp) return null;
    return json;
  } catch { return null; }
}

function requireDoctor(req,res,next){
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ')? auth.slice(7): '';
  const payload = verifyToken(token);
  if(!payload || payload.role !== 'doctor') return res.status(401).json({ error:'Unauthorized'});
  req.user = payload;
  next();
}

// Mailer setup (optional if env provided)
let transporter = null;
let mailReady = false;
try {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.verify();
    mailReady = true;
    console.log('[mail] transporter verified');
  } else {
    console.log('[mail] SMTP variables not fully set – email disabled');
  }
} catch (err) {
  console.error('[mail] setup failed:', err.message);
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Auth endpoints
app.post('/api/auth/login', (req,res)=>{
  const { email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({ error:'Missing credentials'});
  const allowedEmail = process.env.DOCTOR_EMAIL;
  const allowedPass = process.env.DOCTOR_PASSWORD;
  if(!allowedEmail || !allowedPass){
    return res.status(500).json({ error:'Doctor credentials not configured' });
  }
  if(email.toLowerCase() !== allowedEmail.toLowerCase() || password !== allowedPass){
    return res.status(401).json({ error:'Invalid email or password'});
  }
  const payload = { sub:'doctor', role:'doctor', email: allowedEmail, iat: Date.now(), exp: Date.now()+TOKEN_TTL_MS };
  const token = signToken(payload);
  res.json({ token, user: { id:'doctor', name:'Doctor', email: allowedEmail, role:'doctor' }, expiresIn: TOKEN_TTL_MS });
});

app.get('/api/auth/validate', (req,res)=>{
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ')? auth.slice(7): '';
  const payload = verifyToken(token);
  if(!payload) return res.status(401).json({ valid:false });
  res.json({ valid:true, user:{ id:'doctor', name:'Doctor', email: payload.email, role:'doctor' }});
});

app.get('/api/bookings', requireDoctor, (_req, res) => {
  res.json(bookings);
});

app.post('/api/bookings', async (req, res) => {
  const { name, email, phone, date, time, notes, service } = req.body || {};
  if(!name || !email || !phone || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const entry = { id: nanoid(10), name, email, phone, date, time, notes: notes || '', service: service || 'GENERAL', createdAt: new Date().toISOString() };
  bookings.push(entry);
  // Fire-and-forget email notifications
  if (mailReady) {
    const adminTo = process.env.MAIL_TO || process.env.SMTP_USER;
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    const subject = `New Booking: ${entry.name} (${entry.service})`;
    const html = `<h2>New Booking Request</h2>
      <p><strong>Name:</strong> ${entry.name}</p>
      <p><strong>Email:</strong> ${entry.email}</p>
      <p><strong>Phone:</strong> ${entry.phone}</p>
      <p><strong>Service:</strong> ${entry.service}</p>
      <p><strong>Date/Time:</strong> ${entry.date} @ ${entry.time}</p>
      <p><strong>Notes:</strong> ${entry.notes || '—'}</p>
      <p><em>Submitted at ${entry.createdAt}</em></p>`;
    try {
      await transporter.sendMail({ from, to: adminTo, subject, html, text: html.replace(/<[^>]+>/g,' ') });
      // Optional patient acknowledgment
      if (process.env.MAIL_ACK === 'true') {
        try {
          await transporter.sendMail({
            from,
            to: entry.email,
            subject: 'We received your booking request',
            text: `Hi ${entry.name}, we have received your booking request for ${entry.service} on ${entry.date} at ${entry.time}. We will confirm soon.`
          });
        } catch (ackErr) {
          console.warn('[mail] ack failed:', ackErr.message);
        }
      }
      res.status(201).json({ ...entry, emailStatus: 'sent' });
    } catch (mailErr) {
      console.error('[mail] send failed:', mailErr.message);
      res.status(201).json({ ...entry, emailStatus: 'error' });
    }
  } else {
    res.status(201).json({ ...entry, emailStatus: 'disabled' });
  }
});

app.delete('/api/bookings/:id', requireDoctor, (req, res) => {
  const idx = bookings.findIndex(b => b.id === req.params.id);
  if(idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = bookings.splice(idx,1);
  res.json(removed);
});

const port = process.env.PORT || 5174;
app.listen(port, () => {
  console.log(`API server running on :${port}`);
});
