import React, { useEffect, useMemo, useState } from 'react';
import { DOCTORS } from '../constants/doctors';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firebaseAuth, firebaseStorage } from '../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// Placeholder for patient medical data structure
interface OrthoDetails { nextSteps?: string; treatment?: string; images?: string[]; nextAppointmentDate?: string; nextAppointmentNote?: string; bracketCode?: string; bracket?: string; estimatedTotal?: number }

const ORTHO_BRACKETS: { code: string; label: string }[] = [
  { code: 'OR1', label: 'Metal Bracket Regular' },
  { code: 'OR2', label: 'Metal Bracket Premium' },
  { code: 'OR3', label: 'Ceramic Bracket Regular' },
  { code: 'OR4', label: 'Ceramic Bracket Premium' },
  { code: 'OR5', label: 'Self Ligating Metal Bracket' },
  { code: 'OR6', label: 'Self Ligating Ceramic Bracket' },
];
interface RecordEntry { id: string; date: string; notes: string; prescription: string; createdAt?: string; amount?: number; type?: 'general'|'orthodontic'; orthodontic?: OrthoDetails|null; assignedDoctorName?: string }

const PatientRecord: React.FC = () => {
  const { id } = useParams();
  const { patients, user } = useAuth();
  const patientFromContext = useMemo(()=> patients.find(p => p.id === id), [patients, id]);
  const [selfPatient, setSelfPatient] = useState<any|null>(null);
  const [selfPatientId, setSelfPatientId] = useState<string|undefined>(undefined);
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const hasDoctorToken = typeof window !== 'undefined' && !!localStorage.getItem('doctor_token');
  const isDoctor = hasDoctorToken || user?.role === 'manager';

  const getAuthHeader = async (): Promise<Record<string,string>> => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('doctor_token') : null;
    if (t) return { Authorization: `Bearer ${t}` };
    try {
      if (firebaseAuth.currentUser) {
        const idt = await firebaseAuth.currentUser.getIdToken();
        return { Authorization: `Bearer ${idt}` };
      }
    } catch {}
    return {};
  };

  const loadRecords = async () => {
    setError(null); setLoading(true);
    try{
      if (isDoctor) {
        if(!id) { setLoading(false); return; }
        const headers = await getAuthHeader();
        if (!headers.Authorization) { setLoading(false); return; }
        const res = await fetch(`/api/patients/${id}/records`, { headers });
        if (!res.ok) throw new Error('Failed to load records');
        setRecords(await res.json());
      } else {
        // Patient: read-only records
        const idt = await firebaseAuth.currentUser?.getIdToken();
        if(!idt){ setLoading(false); return; }
        const [resMe, resRecs] = await Promise.all([
          fetch('/api/me/patient', { headers: { Authorization: `Bearer ${idt}` }}),
          fetch('/api/me/records', { headers: { Authorization: `Bearer ${idt}` }})
        ]);
        if (resMe.ok) {
          const me = await resMe.json();
          setSelfPatient(me);
          setSelfPatientId(me.id);
        }
        if (!resRecs.ok) throw new Error('Failed to load records');
        setRecords(await resRecs.json());
      }
    }catch(e:any){ setError(e.message); }
    finally{ setLoading(false); }
  };

  useEffect(()=>{ loadRecords(); }, [id, isDoctor]);

  const [draft, setDraft] = useState<{ date:string; notes:string; prescription:string; amount:number; type:'general'|'orthodontic'; assignedDoctorName?: string; orthodontic: OrthoDetails }>({
    date: new Date().toISOString().slice(0,10),
    notes:'',
    prescription:'',
    amount: 0,
    type: 'general',
    assignedDoctorName: (patientFromContext as any)?.assignedDoctorName || '',
    orthodontic: { nextSteps:'', treatment:'', images: [], nextAppointmentDate:'', nextAppointmentNote:'', bracketCode:'', bracket:'' }
  });
  // ORTHO_BRACKETS available from module scope
  const addRecord = async () => {
    if(!id) return;
    try{
      const headers = await getAuthHeader();
  const res = await fetch(`/api/patients/${id}/records`, { method:'POST', headers: { 'Content-Type':'application/json', ...headers }, body: JSON.stringify(draft) });
      if(!res.ok) throw new Error('Failed to add record');
      const created = await res.json();
      setRecords(list => [created, ...list]);
      setDraft({
        date: new Date().toISOString().slice(0,10),
        notes:'',
        prescription:'',
        amount: 0,
        type:'general',
        assignedDoctorName: (patient as any)?.assignedDoctorName || '',
        orthodontic: { nextSteps:'', treatment:'', images: [], nextAppointmentDate:'', nextAppointmentNote:'', bracketCode:'', bracket:'' }
      });
    }catch(e:any){ alert(e.message); }
  };
  const saveRecord = async (rid: string, patch: Partial<RecordEntry>) => {
    if(!id) return;
    try{
      const headers = await getAuthHeader();
      const res = await fetch(`/api/patients/${id}/records/${rid}`, { method:'PUT', headers: { 'Content-Type':'application/json', ...headers }, body: JSON.stringify(patch) });
      if(!res.ok) throw new Error('Failed to update record');
      setRecords(list => list.map(r => r.id===rid? { ...r, ...patch }: r));
    }catch(e:any){ alert(e.message); }
  };
  const deleteRecord = async (rid: string) => {
    if(!id) return;
    if(!confirm('Delete this record?')) return;
    try{
      const headers = await getAuthHeader();
      const res = await fetch(`/api/patients/${id}/records/${rid}`, { method:'DELETE', headers });
      if(!res.ok) throw new Error('Failed to delete record');
      setRecords(list => list.filter(r => r.id !== rid));
    }catch(e:any){ alert(e.message); }
  };

  // Resolve active patient and compute derived values before any early returns to keep hooks order stable
  const patient = isDoctor ? patientFromContext : (selfPatient || patientFromContext);
  const fixedBracket = useMemo(() => {
    if (!patient) return null;
    const codeFromPatient = (patient as any)?.orthodonticBracketCode as string|undefined;
    const labelFromPatient = (patient as any)?.orthodonticBracket as string|undefined;
    if (codeFromPatient || labelFromPatient) return { code: codeFromPatient || '', label: labelFromPatient || '' };
    const firstOrtho = records.find(r => r.type === 'orthodontic' && r.orthodontic && (r.orthodontic.bracketCode || r.orthodontic.bracket));
    if (firstOrtho?.orthodontic) return { code: firstOrtho.orthodontic.bracketCode || '', label: firstOrtho.orthodontic.bracket || '' };
    return null;
  }, [patient, records]);

  const estimatedCost = useMemo(() => {
    if (!patient) return undefined;
    const fromPatient = (patient as any)?.orthodonticEstimatedCost;
    if (typeof fromPatient === 'number') return fromPatient;
    const rec = records.find(r => r.type === 'orthodontic' && r.orthodontic && (r.orthodontic as any).estimatedTotal !== undefined);
    const val: any = rec?.orthodontic && (rec.orthodontic as any).estimatedTotal;
    if (typeof val === 'number') return val;
    const num = val ? Number(val) : NaN;
    return Number.isFinite(num) ? num : undefined;
  }, [patient, records]);

  const totalPaid = useMemo(() => (records.reduce((s,r)=> s + (Number(r.amount)||0), 0)), [records]);
  const assignedDoctorSummary = useMemo(() => ((patient as any)?.assignedDoctorName || records.find(r=>r.assignedDoctorName)?.assignedDoctorName || ''), [patient, records]);

  // If adding an orthodontic record and patient has a fixed bracket, prefill and lock it
  useEffect(() => {
    if (draft.type === 'orthodontic' && fixedBracket) {
      if (draft.orthodontic.bracketCode !== fixedBracket.code) {
        setDraft(d => ({ ...d, orthodontic: { ...d.orthodontic, bracketCode: fixedBracket.code, bracket: fixedBracket.label } }));
      }
    }
  }, [draft.type, fixedBracket]);

  if (!user) return <div className="p-8">Not logged in.</div>;
  // For patients, ensure they only access their own record (compare against selfPatientId when loaded)
  if (user.role === 'patient') {
    if (loading) return <Loader className="min-h-[40vh]" />;
    if (id && selfPatientId && id !== selfPatientId) return <div className="p-8">Access denied.</div>;
  }
  if (!patient) return <div className="p-8">Patient not found.</div>;

  return (
  <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b px-8 py-4 flex items-center gap-6">
        <h1 className="text-lg font-semibold flex-1">Patient Record</h1>
  <Link to={user.role === 'manager' ? '/doctor' : '/member'} className="text-sm text-brand-green font-medium">Back</Link>
      </header>
  <main className="flex-1 max-w-4xl mx-auto p-8 space-y-8">
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <h2 className="text-xl font-semibold mb-2">{patient.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-gray-500">EMAIL</p>
              <p>{patient.email}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-gray-500">AGE</p>
              <p>{patient.age ?? '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-gray-500">GENDER</p>
              <p className="capitalize">{patient.gender ? (patient.gender === 'prefer_not' ? '—' : patient.gender) : '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-gray-500">MOBILE</p>
              <p>{patient.mobile || '—'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-[11px] font-semibold tracking-wide text-gray-500">ADDRESS</p>
              <p>{patient.addressLine1 || '—'}{patient.addressLine2 ? `, ${patient.addressLine2}`: ''}</p>
              <p>{patient.city || '—'} {patient.state || ''} {patient.postalCode || ''}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-gray-500">EMERGENCY CONTACT</p>
              <p className="text-xs">{patient.emergencyContactName ? `${patient.emergencyContactName} (${patient.emergencyContactPhone||'—'})` : '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-gray-500">ALLERGIES</p>
              <p className="text-xs whitespace-pre-wrap">{patient.allergies || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-gray-500">CONDITIONS</p>
              <p className="text-xs whitespace-pre-wrap">{patient.medicalConditions || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-gray-500">MEDICATIONS</p>
              <p className="text-xs whitespace-pre-wrap">{patient.medications || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-gray-500">NOTES</p>
              <p className="text-xs whitespace-pre-wrap">{patient.notes || '—'}</p>
            </div>
          </div>
        </div>
        {/* Mobile summary below patient details */}
        {isDoctor && (
          <div className="md:hidden">
            <div className="bg-white border rounded-xl shadow-sm p-4">
              <h4 className="text-sm font-semibold mb-3">Treatment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Total paid</span>
                  <span className="font-semibold text-brand-green">₹{totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Doctor</span>
                  <span className="font-medium">{assignedDoctorSummary || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Estimated</span>
                  <span className="font-medium">{typeof estimatedCost==='number' ? `₹${estimatedCost.toFixed(2)}` : '—'}</span>
                </div>
                {typeof estimatedCost==='number' && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Remaining</span>
                    <span className="font-medium">₹{Math.max(0, estimatedCost - totalPaid).toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500">Bracket</div>
                  <div className="text-sm">{fixedBracket ? (<span><span className="font-medium">{fixedBracket.code}</span>{fixedBracket.label ? ` – ${fixedBracket.label}` : ''}</span>) : '—'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        <section className="bg-white rounded-xl p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">History & Prescriptions</h3>
            <div className="flex items-center gap-3">
              <button
              type="button"
              onClick={loadRecords}
              disabled={loading || (!isDoctor && !firebaseAuth.currentUser)}
              className={`text-xs font-medium px-3 py-1 rounded-full border ${loading? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'} border-gray-300 text-gray-700`}
              aria-busy={loading}
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>
          {!isDoctor && !firebaseAuth.currentUser && (
            <p className="text-xs text-red-600 mb-3">Access denied. Please log in to view your records.</p>
          )}
          {isDoctor && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50 text-sm grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 w-20">Date</label>
                <input type="date" className="border rounded px-2 py-1 flex-1" value={draft.date} onChange={e=>setDraft({...draft, date:e.target.value})} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 w-20">Type</label>
                <select className="border rounded px-2 py-1 flex-1" value={draft.type} onChange={e=>setDraft({...draft, type: e.target.value as any})}>
                  <option value="general">General</option>
                  <option value="orthodontic">Orthodontic</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <label className="text-xs text-gray-600 w-20">Notes</label>
                <input className="border rounded px-2 py-1 flex-1" placeholder="Notes" value={draft.notes} onChange={e=>setDraft({...draft, notes:e.target.value})} />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <label className="text-xs text-gray-600 w-20">Prescription</label>
                <input className="border rounded px-2 py-1 flex-1" placeholder="Prescription" value={draft.prescription} onChange={e=>setDraft({...draft, prescription:e.target.value})} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 w-20">Amount</label>
                <input type="number" min="0" step="0.01" className="border rounded px-2 py-1 flex-1" value={draft.amount} onChange={e=>setDraft({...draft, amount: Number(e.target.value) || 0})} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 w-20">Doctor</label>
                <select className="border rounded px-2 py-1 flex-1" value={draft.assignedDoctorName || ''} onChange={e=>setDraft({...draft, assignedDoctorName: e.target.value})}>
                  <option value="">-- Select --</option>
                  {DOCTORS.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              {draft.type === 'orthodontic' && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {!estimatedCost && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 w-24">Est. total</label>
                      <input type="number" min="0" step="0.01" className="border rounded px-2 py-1 flex-1" placeholder="Estimated total cost" value={draft.orthodontic.estimatedTotal ?? ''} onChange={e=>{
                        const v = e.target.value;
                        setDraft({...draft, orthodontic: { ...draft.orthodontic, estimatedTotal: v === '' ? undefined : Number(v) || 0 }})
                      }} />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-24">Next steps</label>
                    <input className="border rounded px-2 py-1 flex-1" value={draft.orthodontic.nextSteps} onChange={e=>setDraft({...draft, orthodontic: { ...draft.orthodontic, nextSteps: e.target.value }})} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-24">Treatment</label>
                    <input className="border rounded px-2 py-1 flex-1" placeholder="Treatment done" value={draft.orthodontic.treatment || ''} onChange={e=>setDraft({...draft, orthodontic: { ...draft.orthodontic, treatment: e.target.value }})} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-24">Images</label>
                    <button type="button" className="text-xs text-brand-green" onClick={async ()=>{
                      if (!firebaseStorage) { alert('Storage not configured'); return; }
                      const input = document.createElement('input');
                      input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
                      input.onchange = async ()=>{
                        if(!input.files || !input.files.length) return;
                        const prefix = `patients/${id || 'unknown'}/draft`;
                        const urls: string[] = [];
                        for (const f of Array.from(input.files)){
                          const path = `${prefix}/${Date.now()}_${f.name}`;
                          const sref = storageRef(firebaseStorage, path);
                          await uploadBytes(sref, f, { contentType: f.type });
                          const url = await getDownloadURL(sref);
                          urls.push(url);
                        }
                        setDraft(curr => ({...curr, orthodontic: { ...curr.orthodontic, images: [...(curr.orthodontic.images||[]), ...urls ]}}));
                      };
                      input.click();
                    }}>Upload</button>
                  </div>
                  <div className="md:col-span-2">
                    {!!(draft.orthodontic.images && draft.orthodontic.images.length) && (
                      <div className="flex gap-3 flex-wrap">
                        {draft.orthodontic.images!.map((u,idx)=> (
                          <div key={idx} className="relative w-24 h-24 border rounded overflow-hidden">
                            <img src={u} alt="ortho" className="object-cover w-full h-full" />
                            <button type="button" className="absolute top-1 right-1 text-[10px] bg-white/80 px-1 rounded" onClick={()=>{
                              const next = [...(draft.orthodontic.images||[])]; next.splice(idx,1); setDraft({...draft, orthodontic: { ...draft.orthodontic, images: next }})
                            }}>x</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-24">Next Appt</label>
                    <input type="date" className="border rounded px-2 py-1" min={new Date().toISOString().slice(0,10)} value={draft.orthodontic.nextAppointmentDate || ''} onChange={e=>setDraft({...draft, orthodontic: { ...draft.orthodontic, nextAppointmentDate: e.target.value }})} />
                  </div>
                </div>
              )}
              <div className="md:col-span-2 flex justify-end">
                <button onClick={addRecord} className="text-white bg-brand-green px-4 py-1.5 rounded-full text-sm font-medium">Add Record</button>
              </div>
            </div>
          )}
          {loading && <Loader />}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <ul className="space-y-4">
            {records.map(r => (
              <RecordItem
                key={r.id}
                r={r}
                isDoctor={isDoctor}
                patientId={id || selfPatientId || ''}
                fixedBracket={fixedBracket}
                onSave={saveRecord}
                onDelete={deleteRecord}
              />
            ))}
            {records.length === 0 && !loading && (
              <li className="text-xs text-gray-400">No records yet.</li>
            )}
          </ul>
        </section>
      </main>
      {/* Floating summary container on the right for doctors */}
      {isDoctor && (
        <aside className="hidden md:block fixed right-6 top-28 z-20">
          <div className="w-72 bg-white border rounded-xl shadow-lg p-4">
            <h4 className="text-sm font-semibold mb-3">Treatment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total paid</span>
                <span className="font-semibold text-brand-green">₹{totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Doctor</span>
                <span className="font-medium">{assignedDoctorSummary || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Estimated</span>
                <span className="font-medium">{typeof estimatedCost==='number' ? `₹${estimatedCost.toFixed(2)}` : '—'}</span>
              </div>
              {typeof estimatedCost==='number' && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Remaining</span>
                  <span className="font-medium">₹{Math.max(0, estimatedCost - totalPaid).toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-500">Bracket</div>
                <div className="text-sm">{fixedBracket ? (<span><span className="font-medium">{fixedBracket.code}</span>{fixedBracket.label ? ` – ${fixedBracket.label}` : ''}</span>) : '—'}</div>
              </div>
            </div>
          </div>
        </aside>
      )}
      <Footer />
    </div>
  );
};

// Per-record component to support read-only by default and edit on demand
const RecordItem: React.FC<{
  r: RecordEntry;
  isDoctor: boolean;
  patientId: string;
  fixedBracket: { code: string; label: string } | null;
  onSave: (rid: string, patch: Partial<RecordEntry>) => Promise<void> | void;
  onDelete: (rid: string) => Promise<void> | void;
}> = ({ r, isDoctor, patientId, fixedBracket, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RecordEntry>(r);

  useEffect(()=>{ setDraft(r); }, [r.id]);

  const handleSave = async () => {
    const patch: Partial<RecordEntry> = {
      date: draft.date,
      notes: draft.notes,
      prescription: draft.prescription,
      amount: draft.amount,
      type: draft.type,
  assignedDoctorName: draft.assignedDoctorName,
      orthodontic: draft.type === 'orthodontic' ? (draft.orthodontic || {}) : undefined,
    };
    await onSave(r.id, patch);
    setEditing(false);
  };

  return (
    <li className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium tracking-wide text-gray-500">{r.date}</span>
        <div className="flex items-center gap-2">
          {typeof r.amount === 'number' && r.amount > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
              ₹{Number(r.amount).toFixed(2)}
              {r.type === 'orthodontic' && r.orthodontic?.bracketCode && (
                <span className="ml-2 text-[10px] text-amber-700/80">{r.orthodontic.bracketCode}</span>
              )}
              {r.type === 'orthodontic' && (r.orthodontic as any)?.estimatedTotal !== undefined && (
                <span className="ml-2 text-[10px] text-amber-700/70">(Est. ₹{Number((r.orthodontic as any).estimatedTotal).toFixed(0)})</span>
              )}
            </span>
          )}
          <span className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-1 rounded-full">{r.type === 'orthodontic' ? 'ORTHO' : 'VISIT'}</span>
        </div>
      </div>

      {/* Read-only view for patients and for doctors by default */}
      {(!isDoctor || !editing) && (
        <>
          <p className="text-sm mb-2">{r.notes}</p>
          <p className="text-xs text-gray-600"><span className="font-semibold">Prescription:</span> {r.prescription}</p>
          {r.type === 'orthodontic' && (
            <div className="mt-2 space-y-1 text-xs text-gray-700">
              {r.orthodontic?.bracketCode && (
                <div><span className="font-semibold">Bracket:</span> {r.orthodontic.bracketCode}{r.orthodontic.bracket ? ` – ${r.orthodontic.bracket}` : ''}</div>
              )}
              {r.orthodontic?.treatment && <div><span className="font-semibold">Treatment:</span> {r.orthodontic.treatment}</div>}
              {r.orthodontic?.nextSteps && <div><span className="font-semibold">Next steps:</span> {r.orthodontic.nextSteps}</div>}
              <div>
                <span className="font-semibold">Next appointment:</span>{' '}
                {r.orthodontic?.nextAppointmentDate ? (
                  <>{r.orthodontic.nextAppointmentDate} {r.orthodontic.nextAppointmentNote ? `– ${r.orthodontic.nextAppointmentNote}` : ''}</>
                ) : (
                  <span className="italic text-gray-500">to be assigned</span>
                )}
              </div>
              {!!(r.orthodontic?.images && r.orthodontic.images.length) && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {r.orthodontic!.images!.map((u, i)=> (
                    <a key={i} href={u} target="_blank" rel="noreferrer" className="w-16 h-16 border rounded overflow-hidden block">
                      <img src={u} className="object-cover w-full h-full" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Edit mode for doctors */}
      {isDoctor && editing && (
        <div className="space-y-2 text-sm">
          <div className="flex gap-2 flex-wrap">
            <input type="date" className="border rounded px-2 py-1" value={draft.date} onChange={e=>setDraft({...draft, date: e.target.value})} />
            <input className="border rounded px-2 py-1 w-56" value={draft.notes} onChange={e=>setDraft({...draft, notes: e.target.value})} />
            <input className="border rounded px-2 py-1 w-56" value={draft.prescription} onChange={e=>setDraft({...draft, prescription: e.target.value})} />
            <select className="border rounded px-2 py-1" value={draft.type || 'general'} onChange={e=>setDraft({...draft, type: e.target.value as any})}>
              <option value="general">General</option>
              <option value="orthodontic">Orthodontic</option>
            </select>
            <input type="number" className="border rounded px-2 py-1 w-28" placeholder="Amount" value={draft.amount ?? 0} onChange={e=>setDraft({...draft, amount: Number(e.target.value) || 0})} />
            <select className="border rounded px-2 py-1" value={draft.assignedDoctorName || ''} onChange={e=>setDraft({...draft, assignedDoctorName: e.target.value})}>
              <option value="">Doctor – Select</option>
              {DOCTORS.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          {draft.type === 'orthodontic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select className="border rounded px-2 py-1 disabled:bg-gray-100 disabled:text-gray-500" disabled={!!fixedBracket} value={draft.orthodontic?.bracketCode || ''} onChange={e=>{
                const code = e.target.value || '';
                const opt = ORTHO_BRACKETS.find(o=>o.code===code);
                setDraft(d=> ({...d, orthodontic: { ...(d.orthodontic||{}), bracketCode: code, bracket: opt?.label || '' }}));
              }}>
                <option value="">Bracket – Select</option>
                {ORTHO_BRACKETS.map(o=> (
                  <option key={o.code} value={o.code}>{o.code} – {o.label}</option>
                ))}
              </select>
              {fixedBracket && (
                <div className="text-[11px] text-gray-500">Fixed at patient level</div>
              )}
              <input className="border rounded px-2 py-1" placeholder="Next steps" value={draft.orthodontic?.nextSteps || ''} onChange={e=>setDraft({...draft, orthodontic: { ...(draft.orthodontic||{}), nextSteps: e.target.value }})} />
              <input className="border rounded px-2 py-1" placeholder="Treatment" value={draft.orthodontic?.treatment || ''} onChange={e=>setDraft({...draft, orthodontic: { ...(draft.orthodontic||{}), treatment: e.target.value }})} />
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <button type="button" className="text-xs text-brand-green" onClick={async ()=>{
                    if (!firebaseStorage) { alert('Storage not configured'); return; }
                    const input = document.createElement('input');
                    input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
                    input.onchange = async ()=>{
                      if(!input.files || !input.files.length) return;
                      const prefix = `patients/${patientId || 'unknown'}/records/${r.id}`;
                      const urls: string[] = [];
                      for (const f of Array.from(input.files)){
                        const path = `${prefix}/${Date.now()}_${f.name}`;
                        const sref = storageRef(firebaseStorage, path);
                        await uploadBytes(sref, f, { contentType: f.type });
                        const url = await getDownloadURL(sref);
                        urls.push(url);
                      }
                      const nextImages = [...(draft.orthodontic?.images || []), ...urls];
                      setDraft(d => ({...d, orthodontic: { ...(d.orthodontic||{}), images: nextImages }}));
                    };
                    input.click();
                  }}>Upload Images</button>
                </div>
                {!!(draft.orthodontic?.images && draft.orthodontic.images.length) && (
                  <div className="flex gap-2 flex-wrap">
                    {draft.orthodontic.images.map((u, i)=> (
                      <div key={i} className="relative w-20 h-20 border rounded overflow-hidden">
                        <a href={u} target="_blank" rel="noreferrer">
                          <img src={u} className="object-cover w-full h-full" />
                        </a>
                        <button type="button" className="absolute top-1 right-1 text-[10px] bg-white/80 px-1 rounded" onClick={()=>{
                          const next = [...(draft.orthodontic?.images||[])]; next.splice(i,1);
                          setDraft(d => ({...d, orthodontic: { ...(d.orthodontic||{}), images: next }}));
                        }}>x</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input type="date" className="border rounded px-2 py-1" min={new Date().toISOString().slice(0,10)} value={draft.orthodontic?.nextAppointmentDate || ''} onChange={e=>setDraft({...draft, orthodontic: { ...(draft.orthodontic||{}), nextAppointmentDate: e.target.value }})} />
              </div>
            </div>
          )}
          <div className="space-x-3">
            <button onClick={handleSave} className="text-green-700 text-xs font-medium">Save</button>
            <button onClick={()=>{ setEditing(false); setDraft(r); }} className="text-gray-600 text-xs">Cancel</button>
          </div>
        </div>
      )}

      {/* Doctor actions */}
      {isDoctor && !editing && (
        <div className="mt-2 space-x-3">
          <button onClick={()=>setEditing(true)} className="text-blue-600 text-xs">Edit</button>
          <button onClick={()=>onDelete(r.id)} className="text-red-600 text-xs">Delete</button>
        </div>
      )}
    </li>
  );
};

export default PatientRecord;
