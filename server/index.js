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
  console.log('Authorization header:', auth ? 'Present' : 'Missing');
  
  const token = auth.startsWith('Bearer ')? auth.slice(7): '';
  console.log('Extracted token:', token ? 'Token found' : 'No token');
  
  const payload = verifyToken(token);
  console.log('Token payload:', payload);
  
  if(!payload || payload.role !== 'doctor') {
    console.log('Authorization failed - payload:', payload);
    return res.status(401).json({ error:'Unauthorized'});
  }
  
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
    res.status(500).json({ error: 'Failed to set claims' });
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
    res.status(500).json({ error: 'Failed to fetch pending users' });
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
    res.status(500).json({ error: 'Failed to update user status' });
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
function getDoctorPayload(req){
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ')? auth.slice(7): '';
  const payload = verifyToken(token);
  return payload && payload.role === 'doctor' ? payload : null;
}

// GET bookings: public gets last 10 (limited); doctor gets up to 500
app.get('/api/bookings', async (req, res) => {
  const doctor = getDoctorPayload(req);
  try {
    if (db) {
      let query = db.collection('bookings').orderBy('createdAt', 'desc');
      query = query.limit(doctor ? 500 : 10);
      const snap = await query.get();
      const items = snap.docs.map(d => {
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
      const items = [...bookings].sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.json(doctor ? items : items.slice(0,10));
    }
  } catch(err){
    console.error('[bookings] load failed', err);
    return res.status(500).json({ error:'Failed to load bookings' });
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
    return res.status(500).json({ error:'Failed to create booking' });
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
    return res.status(500).json({ error:'Delete failed' });
  }
});

// Patients (Firestore persistence) – secure
app.get('/api/patients', requireDoctor, async (_req,res)=>{
  if(!db) return res.json([]);
  try {
    const snap = await db.collection('patients').orderBy('createdAt','desc').limit(500).get();
    const items = snap.docs.map(d=> ({ id:d.id, ...d.data() }));
    res.json(items);
  } catch(err){
    res.status(500).json({ error:'Failed to load patients'});
  }
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
