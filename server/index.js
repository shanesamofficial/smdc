import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import 'dotenv/config';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import admin from 'firebase-admin';

// Firebase Admin init (using service account credentials via env vars on Vercel)
if(!admin.apps.length){
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,'\n');
    if(projectId && clientEmail && privateKey){
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey })
      });
      console.log('[firebase-admin] initialized');
    } else {
      console.log('[firebase-admin] missing service account env vars - patient persistence disabled');
    }
  } catch(err){
    console.error('[firebase-admin] init error', err.message);
  }
}

const db = admin.apps.length ? admin.firestore() : null;

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage fallback (used only if Firestore not initialized)
const bookings = [];
// Simple in-memory token revocation list (optional)
// NOTE: Avoid enforcing this in verify() so tokens don't break after server restarts.
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
  // Do NOT enforce validTokens.has(token) – that would break tokens after server restarts
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

async function requireDoctor(req,res,next){
  const auth = req.headers.authorization || '';
  console.log('Authorization header:', auth ? 'Present' : 'Missing');
  
  const token = auth.startsWith('Bearer ')? auth.slice(7): '';
  console.log('Extracted token:', token ? 'Token found' : 'No token');
  
  // First try our HMAC token
  const payload = verifyToken(token);
  if (payload && payload.role === 'doctor') {
    req.user = payload;
    return next();
  }

  // Fallback: try Firebase ID token (if Admin initialized)
  if (admin.apps.length) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      if (decoded && decoded.role === 'doctor') {
        req.user = { email: decoded.email, role: 'doctor', uid: decoded.uid };
        return next();
      }
    } catch (e) {
      console.log('[auth] Firebase ID token verify failed');
    }
  }

  console.log('Authorization failed - neither HMAC nor Firebase doctor token accepted');
  return res.status(401).json({ error:'Unauthorized'});
}

// Patient auth: verify Firebase ID token with role 'patient' (and approved if set)
async function requirePatient(req, res, next){
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ')? auth.slice(7): '';
  if (!token) return res.status(401).json({ error: 'Unauthorized: missing token' });
  if (!admin.apps.length) return res.status(503).json({ error: 'Service unavailable: auth not initialized' });
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    if (!decoded || !decoded.email) return res.status(401).json({ error: 'Unauthorized' });
    const isPatient = decoded.role === 'patient' || typeof decoded.role === 'undefined' || decoded.role === null;
    if (!isPatient) return res.status(403).json({ error: 'Forbidden' });
    // Enforce approval only if the claim exists and is false
    if (Object.prototype.hasOwnProperty.call(decoded, 'approved') && decoded.approved !== true) {
      return res.status(403).json({ error: 'Not approved' });
    }
    req.user = { email: decoded.email, role: 'patient', uid: decoded.uid };
    return next();
  } catch (e){
    return res.status(401).json({ error: 'Unauthorized' });
  }
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

// Set custom claims for doctor (call this once manually to setup)
app.post('/api/auth/set-doctor-claims', requireDoctor, async (req,res)=>{
  const { uid } = req.body || {};
  if(!uid) return res.status(400).json({ error:'Missing uid' });
  if(!admin.apps.length) return res.status(503).json({ error:'Firebase admin not initialized' });
  
  try {
    await admin.auth().setCustomUserClaims(uid, { role: 'doctor' });
    res.json({ success: true, message: 'Doctor claims set successfully' });
  } catch(err) {
  console.error('[auth] set claims failed:', err);
  const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
  const code = (err && err.errorInfo?.code) || 'unknown';
  res.status(500).json({ error: 'Failed to set claims', details: msg, code });
  }
});

// User management endpoints
// Create pending user registration
app.post('/api/users/register', async (req, res) => {
  const { uid, name, email } = req.body || {};
  if (!uid || !email) return res.status(400).json({ error: 'Missing uid or email' });
  if (!admin.apps.length) return res.status(503).json({ error: 'Firebase admin not initialized' });

  try {
    const userDoc = {
      uid,
      name: name || email,
      email,
      status: 'pending', // pending, approved, rejected
      createdAt: new Date().toISOString(),
      approvedAt: null,
      approvedBy: null
    };

    await db.collection('users').doc(uid).set(userDoc);
    res.json({ success: true, message: 'User registration submitted for approval' });
  } catch (err) {
    console.error('[users] registration failed:', err);
    res.status(500).json({ error: 'Failed to create user registration' });
  }
});

// Get pending users (doctor only)
app.get('/api/users/pending', requireDoctor, async (req, res) => {
  if (!admin.apps.length) return res.status(503).json({ error: 'Firebase admin not initialized' });

  try {
    const snapshot = await db.collection('users').where('status', '==', 'pending').get();
    const pendingUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ users: pendingUsers });
  } catch (err) {
  console.error('[users] fetch pending failed:', err);
  const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
  res.status(500).json({ error: 'Failed to fetch pending users', details: msg });
  }
});

// Approve/reject user (doctor only)
app.post('/api/users/approve', requireDoctor, async (req, res) => {
  const { uid, approve } = req.body || {};
  if (!uid || typeof approve !== 'boolean') {
    return res.status(400).json({ error: 'Missing uid or approve flag' });
  }
  if (!admin.apps.length) return res.status(503).json({ error: 'Firebase admin not initialized' });

  try {
    const status = approve ? 'approved' : 'rejected';
    const updateData = {
      status,
      approvedAt: new Date().toISOString(),
      approvedBy: req.user.email
    };

    await db.collection('users').doc(uid).update(updateData);
    
    // If approving, set patient custom claims
    if (approve) {
      await admin.auth().setCustomUserClaims(uid, { role: 'patient', approved: true });
    }

    res.json({ success: true, message: `User ${status} successfully` });
  } catch (err) {
  console.error('[users] approval failed:', err);
  const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
  const code = (err && err.errorInfo?.code) || 'unknown';
  res.status(500).json({ error: 'Failed to update user status', details: msg, code });
  }
});

// Check user approval status
app.get('/api/users/status/:uid', async (req, res) => {
  const { uid } = req.params;
  if (!uid) return res.status(400).json({ error: 'Missing uid' });
  if (!admin.apps.length) return res.status(503).json({ error: 'Firebase admin not initialized' });

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.json({ status: 'not_found' });
    }
    
    const userData = userDoc.data();
    res.json({ 
      status: userData.status, 
      createdAt: userData.createdAt,
      approvedAt: userData.approvedAt 
    });
  } catch (err) {
    console.error('[users] status check failed:', err);
    res.status(500).json({ error: 'Failed to check user status' });
  }
});

app.get('/api/auth/validate', (req,res)=>{
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ')? auth.slice(7): '';
  const payload = verifyToken(token);
  if(!payload) return res.status(401).json({ valid:false });
  res.json({ valid:true, user:{ id:'doctor', name:'Doctor', email: payload.email, role:'doctor' }});
});

// Helper: extract optional doctor token without enforcing
async function getDoctorPayload(req){
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ')? auth.slice(7): '';
  const payload = verifyToken(token);
  if (payload && payload.role === 'doctor') return payload;
  if (admin.apps.length && token) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      if (decoded && decoded.role === 'doctor') return { email: decoded.email, role: 'doctor', uid: decoded.uid };
    } catch {}
  }
  return null;
}

// GET bookings: public gets last 10 (limited); doctor gets up to 500
app.get('/api/bookings', async (req, res) => {
  const doctor = await getDoctorPayload(req);
  const q = (req.query.q || '').toString().trim().toLowerCase();
  try {
    if (db) {
      let query = db.collection('bookings').orderBy('createdAt', 'desc');
      query = query.limit(doctor ? 500 : 10);
      const snap = await query.get();
      let items = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
            email: data.email || '',
          phone: data.phone,
          date: data.date,
          time: data.time,
          service: data.service || 'GENERAL',
          notes: data.notes || '',
          reasons: data.reasons || [],
          address: data.address || '',
          createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          emailStatus: data.emailStatus
        };
      });
      if (q) {
        items = items.filter(b => (
          (b.name && b.name.toLowerCase().includes(q)) ||
          (b.email && b.email.toLowerCase().includes(q)) ||
          (b.phone && b.phone.toLowerCase().includes(q)) ||
          (b.notes && b.notes.toLowerCase().includes(q)) ||
          (b.date && b.date.toLowerCase().includes(q)) ||
          (b.time && b.time.toLowerCase().includes(q))
        ));
      }
      // If public, strip email & phone partially for privacy (example: keep last 3 digits)
      if(!doctor){
        return res.json(items.map(b => ({
          ...b,
          email: b.email ? b.email.replace(/(^.).+(@.*$)/,'$1***$2') : '',
          phone: b.phone ? b.phone.replace(/.(?=.{3})/g,'*') : ''
        })));
      }
      return res.json(items);
    } else {
      // Memory fallback
      let items = [...bookings].sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (q) {
        items = items.filter(b => (
          (b.name && b.name.toLowerCase().includes(q)) ||
          (b.email && b.email.toLowerCase().includes(q)) ||
          (b.phone && b.phone.toLowerCase().includes(q)) ||
          (b.notes && b.notes.toLowerCase().includes(q)) ||
          (b.date && b.date.toLowerCase().includes(q)) ||
          (b.time && b.time.toLowerCase().includes(q))
        ));
      }
      return res.json(doctor ? items : items.slice(0,10));
    }
  } catch(err){
  console.error('[bookings] load failed', err);
  const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
  return res.status(500).json({ error:'Failed to load bookings', details: msg });
  }
});

app.post('/api/bookings', async (req, res) => {
  const { name, email, phone, date, time, notes, service, reasons, address } = req.body || {};
  if(!name || !phone || !date || !time || !address){
    return res.status(400).json({ error:'Missing required fields' });
  }
  try {
    let stored;
    if (db) {
      const docRef = await db.collection('bookings').add({
        name,
        email: email || '',
        phone,
        date,
        time,
        service: service || 'GENERAL',
        notes: notes || '',
        reasons: Array.isArray(reasons) ? reasons : [],
        address: address || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        emailStatus: 'pending'
      });
      const snap = await docRef.get();
      const data = snap.data();
      stored = {
        id: docRef.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        date: data.date,
        time: data.time,
        service: data.service,
        notes: data.notes,
        reasons: data.reasons || [],
        address: data.address || '',
        createdAt: new Date().toISOString(), // temporary until serverTimestamp resolves on next fetch
        emailStatus: data.emailStatus
      };
      // Update createdAt once timestamp resolves (fire and forget)
      // Not strictly necessary but keeps timing accurate for future reads.
    } else {
      stored = {
        id: nanoid(10), name, email: email || '', phone, date, time, notes: notes || '', service: service || 'GENERAL', reasons: Array.isArray(reasons)? reasons: [], address: address || '', createdAt: new Date().toISOString(), emailStatus: 'disabled'
      };
      bookings.push(stored);
    }

    // Email notifications (fire-and-forget but we await main send for response status)
    if (mailReady) {
      const adminTo = process.env.MAIL_TO || process.env.SMTP_USER;
      const from = process.env.MAIL_FROM || process.env.SMTP_USER;
      const subject = `New Booking: ${stored.name} (${stored.service})`;
      const html = `<h2>New Booking Request</h2>
        <p><strong>Name:</strong> ${stored.name}</p>
        <p><strong>Email:</strong> ${stored.email || '—'}</p>
        <p><strong>Phone:</strong> ${stored.phone}</p>
        <p><strong>Service:</strong> ${stored.service}</p>
        <p><strong>Date/Time:</strong> ${stored.date} @ ${stored.time}</p>
        <p><strong>Address:</strong> ${stored.address || '—'}</p>
        <p><strong>Reasons:</strong> ${(stored.reasons && stored.reasons.length)? stored.reasons.join(', ') : '—'}</p>
        <p><strong>Notes:</strong> ${stored.notes || '—'}</p>
        <p><em>Submitted at ${stored.createdAt}</em></p>`;
      try {
        await transporter.sendMail({ from, to: adminTo, subject, html, text: html.replace(/<[^>]+>/g,' ') });
        if (process.env.MAIL_ACK === 'true' && stored.email) {
          transporter.sendMail({
            from,
            to: stored.email,
            subject: 'We received your booking request',
            text: `Hi ${stored.name}, we have received your booking request for ${stored.service} on ${stored.date} at ${stored.time}. We will confirm soon.`
          }).catch(e=> console.warn('[mail] ack failed:', e.message));
        }
        stored.emailStatus = 'sent';
      } catch(err) {
        console.error('[mail] send failed:', err.message);
        stored.emailStatus = 'error';
      }
    }

    // If Firestore, update emailStatus field asynchronously (no need to await)
    if (db) {
      db.collection('bookings').doc(stored.id).set({ emailStatus: stored.emailStatus }, { merge: true }).catch(()=>{});
    }

    return res.status(201).json(stored);
  } catch(err){
  console.error('[bookings] create failed', err);
  const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
  return res.status(500).json({ error:'Failed to create booking', details: msg });
  }
});

// Get single booking (doctor only)
app.get('/api/bookings/:id', requireDoctor, async (req, res) => {
  const id = req.params.id;
  try {
    if (db) {
      const ref = db.collection('bookings').doc(id);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: 'Not found' });
      const data = snap.data();
      return res.json({
        id: snap.id,
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        date: data.date || '',
        time: data.time || '',
        service: data.service || 'GENERAL',
        reasons: Array.isArray(data.reasons) ? data.reasons : [],
        address: data.address || '',
        notes: data.notes || '',
        createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        emailStatus: data.emailStatus || 'pending'
      });
    } else {
      const item = bookings.find(b => b.id === id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      return res.json(item);
    }
  } catch (err) {
    console.error('[bookings] get one failed', err);
    const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
    return res.status(500).json({ error: 'Failed to load booking', details: msg });
  }
});

app.delete('/api/bookings/:id', requireDoctor, async (req, res) => {
  const id = req.params.id;
  try {
    if (db) {
      const ref = db.collection('bookings').doc(id);
      const snap = await ref.get();
      if(!snap.exists) return res.status(404).json({ error:'Not found' });
      const data = snap.data();
      await ref.delete();
      return res.json({ id: snap.id, ...data });
    } else {
      const idx = bookings.findIndex(b => b.id === id);
      if(idx === -1) return res.status(404).json({ error:'Not found' });
      const [removed] = bookings.splice(idx,1);
      return res.json(removed);
    }
  } catch(err){
  console.error('[bookings] delete failed', err);
  const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
  return res.status(500).json({ error:'Delete failed', details: msg });
  }
});

// Patients (Firestore persistence) – secure
app.get('/api/patients', requireDoctor, async (req,res)=>{
  if(!db) return res.json([]);
  try {
    const snap = await db.collection('patients').orderBy('createdAt','desc').limit(500).get();
    let items = snap.docs.map(d=> ({ id:d.id, ...d.data() }));
    const q = (req.query.q || '').toString().trim().toLowerCase();
    if (q) {
      items = items.filter(p => (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.mobile && p.mobile.toLowerCase().includes(q))
      ));
    }
    res.json(items);
  } catch(err){
    const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
    res.status(500).json({ error:'Failed to load patients', details: msg});
  }
});

// Get a single patient
app.get('/api/patients/:id', requireDoctor, async (req, res) => {
  if(!db) return res.status(503).json({ error:'Database disabled' });
  try {
    const ref = db.collection('patients').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error:'Not found' });
    res.json({ id: snap.id, ...snap.data() });
  } catch(err){
    const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
    res.status(500).json({ error:'Failed to load patient', details: msg});
  }
});

// Update patient
app.put('/api/patients/:id', requireDoctor, async (req, res) => {
  if (!db) return res.status(503).json({ error:'Database disabled'});
  const id = req.params.id;
  const data = req.body || {};
  try {
    await db.collection('patients').doc(id).set(data, { merge: true });
    const snap = await db.collection('patients').doc(id).get();
    res.json({ id, ...snap.data() });
  } catch (err) {
    const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
    res.status(500).json({ error:'Failed to update patient', details: msg });
  }
});

// Delete patient (and optionally their records)
app.delete('/api/patients/:id', requireDoctor, async (req, res) => {
  if (!db) return res.status(503).json({ error:'Database disabled'});
  const id = req.params.id;
  try {
    // delete patient doc
    const ref = db.collection('patients').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    await ref.delete();
    // try delete records subcollection (best effort)
    try {
      const recs = await db.collection('patients').doc(id).collection('records').get();
      const batch = db.batch();
      recs.forEach(d => batch.delete(d.ref));
      if (!recs.empty) await batch.commit();
    } catch {}
    res.json({ id });
  } catch (err) {
    const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
    res.status(500).json({ error:'Failed to delete patient', details: msg });
  }
});

// Patient records (doctor only)
app.get('/api/patients/:id/records', requireDoctor, async (req, res) => {
  if (!db) return res.json([]);
  const id = req.params.id;
  try {
    const snap = await db.collection('patients').doc(id).collection('records').orderBy('createdAt','desc').get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt && d.data().createdAt.toDate ? d.data().createdAt.toDate().toISOString() : new Date().toISOString() }));
    res.json(items);
  } catch (err) {
    const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
    res.status(500).json({ error:'Failed to load records', details: msg });
  }
});

app.post('/api/patients/:id/records', requireDoctor, async (req, res) => {
  if (!db) return res.status(503).json({ error:'Database disabled'});
  const id = req.params.id;
  const payload = req.body || {};
  try {
    const ref = await db.collection('patients').doc(id).collection('records').add({
      date: payload.date || new Date().toISOString().slice(0,10),
      notes: payload.notes || '',
      prescription: payload.prescription || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const snap = await ref.get();
    res.status(201).json({ id: ref.id, ...snap.data(), createdAt: new Date().toISOString() });
  } catch (err) {
    const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
    res.status(500).json({ error:'Failed to add record', details: msg });
  }
});

app.put('/api/patients/:pid/records/:rid', requireDoctor, async (req, res) => {
  if (!db) return res.status(503).json({ error:'Database disabled'});
  const { pid, rid } = req.params;
  try {
    await db.collection('patients').doc(pid).collection('records').doc(rid).set(req.body || {}, { merge: true });
    const snap = await db.collection('patients').doc(pid).collection('records').doc(rid).get();
    res.json({ id: rid, ...snap.data() });
  } catch (err) {
    const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
    res.status(500).json({ error:'Failed to update record', details: msg });
  }
});

app.delete('/api/patients/:pid/records/:rid', requireDoctor, async (req, res) => {
  if (!db) return res.status(503).json({ error:'Database disabled'});
  const { pid, rid } = req.params;
  try {
    await db.collection('patients').doc(pid).collection('records').doc(rid).delete();
    res.json({ id: rid });
  } catch (err) {
    const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
    res.status(500).json({ error:'Failed to delete record', details: msg });
  }
});

// Self-service endpoints for patients: resolve patient by email and return their data/records (read-only)
app.get('/api/me/patient', requirePatient, async (req, res) => {
  if (!db) return res.status(503).json({ error:'Database disabled'});
  try {
    const snap = await db.collection('patients').where('email','==', req.user.email).limit(1).get();
    if (snap.empty) return res.status(404).json({ error:'Not found' });
    const doc = snap.docs[0];
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
    res.status(500).json({ error:'Failed to load patient', details: msg });
  }
});

app.get('/api/me/records', requirePatient, async (req, res) => {
  if (!db) return res.json([]);
  try {
    const snap = await db.collection('patients').where('email','==', req.user.email).limit(1).get();
    if (snap.empty) return res.json([]);
    const doc = snap.docs[0];
    const recs = await db.collection('patients').doc(doc.id).collection('records').orderBy('createdAt','desc').get();
    const items = recs.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt && d.data().createdAt.toDate ? d.data().createdAt.toDate().toISOString() : new Date().toISOString() }));
    return res.json(items);
  } catch (err) {
    const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
    res.status(500).json({ error:'Failed to load records', details: msg });
  }
});

// Optional: user's upcoming bookings (by email) for dashboard
app.get('/api/me/bookings', requirePatient, async (req,res)=>{
  if (!db) return res.json([]);
  try{
    const snap = await db.collection('bookings').where('email','==', req.user.email).orderBy('createdAt','desc').limit(20).get();
    const list = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        date: data.date || '',
        time: data.time || '',
        notes: data.notes || '',
        createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
      };
    });
    res.json(list);
  } catch (err){
    const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
    res.status(500).json({ error:'Failed to load bookings', details: msg });
  }
});

// Update booking
app.put('/api/bookings/:id', requireDoctor, async (req, res) => {
  const id = req.params.id;
  try {
    if (db) {
      const ref = db.collection('bookings').doc(id);
      const snap = await ref.get();
      if(!snap.exists) return res.status(404).json({ error:'Not found' });
      await ref.set(req.body || {}, { merge: true });
      const updated = await ref.get();
      const data = updated.data();
      return res.json({ id, ...data, createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString() });
    } else {
      const idx = bookings.findIndex(b => b.id === id);
      if(idx === -1) return res.status(404).json({ error:'Not found' });
      bookings[idx] = { ...bookings[idx], ...(req.body || {}) };
      return res.json(bookings[idx]);
    }
  } catch (err) {
    const msg = (err && (err.message || err.errorInfo?.message)) || 'Unknown error';
    return res.status(500).json({ error:'Failed to update booking', details: msg });
  }
});
// Lightweight diagnostics endpoint (no secrets)
app.get('/api/_diag', (_req,res)=>{
  res.json({
    firebaseAdminInitialized: !!admin.apps.length,
    projectId: process.env.FIREBASE_PROJECT_ID ? 'set' : 'missing',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'set' : 'missing',
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'set' : 'missing'
  });
});

app.post('/api/patients', requireDoctor, async (req,res)=>{
  if(!db) return res.status(503).json({ error:'Database disabled'});
  const data = req.body || {};
  if(!data.name || !data.email){
    return res.status(400).json({ error:'Missing name/email'});
  }
  try {
    const doc = await db.collection('patients').add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const stored = await doc.get();
    res.status(201).json({ id: doc.id, ...stored.data() });
  } catch(err){
    res.status(500).json({ error:'Failed to create patient'});
  }
});

// In a serverless (Vercel) environment we export the app; locally we still listen.
const port = process.env.PORT || 5174;
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`API server running on :${port}`);
  });
}

export default app;
