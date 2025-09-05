import React, { useEffect, useMemo, useState } from 'react';
import Footer from '../components/Footer';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firebaseAuth } from '../firebase';

// Placeholder for patient medical data structure
interface RecordEntry { id: string; date: string; notes: string; prescription: string; createdAt?: string }

const PatientRecord: React.FC = () => {
  const { id } = useParams();
  const { patients, user } = useAuth();
  const patient = useMemo(()=> patients.find(p => p.id === id), [patients, id]);
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
        const res = await fetch('/api/me/records', { headers: { Authorization: `Bearer ${idt}` }});
        if (!res.ok) throw new Error('Failed to load records');
        setRecords(await res.json());
      }
    }catch(e:any){ setError(e.message); }
    finally{ setLoading(false); }
  };

  useEffect(()=>{ loadRecords(); }, [id, isDoctor]);

  const [draft, setDraft] = useState({ date: new Date().toISOString().slice(0,10), notes:'', prescription:'' });
  const addRecord = async () => {
    if(!id) return;
    try{
      const headers = await getAuthHeader();
      const res = await fetch(`/api/patients/${id}/records`, { method:'POST', headers: { 'Content-Type':'application/json', ...headers }, body: JSON.stringify(draft) });
      if(!res.ok) throw new Error('Failed to add record');
      const created = await res.json();
      setRecords(list => [created, ...list]);
      setDraft({ date: new Date().toISOString().slice(0,10), notes:'', prescription:'' });
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

  if (!user) return <div className="p-8">Not logged in.</div>;
  // Patient can only view their own, manager can view any
  if (user.role === 'patient' && user.id !== id) return <div className="p-8">Access denied.</div>;
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
          <p className="mt-4 text-sm italic text-gray-500">(Demo data only - integrate real medical records securely.)</p>
        </div>
        <section className="bg-white rounded-xl p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">History & Prescriptions</h3>
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
          {!isDoctor && !firebaseAuth.currentUser && (
            <p className="text-xs text-red-600 mb-3">Access denied. Please log in to view your records.</p>
          )}
          {isDoctor && (
            <div className="mb-4 p-3 border rounded-lg bg-gray-50 text-sm flex flex-wrap gap-2">
              <input type="date" className="border rounded px-2 py-1" value={draft.date} onChange={e=>setDraft({...draft, date:e.target.value})} />
              <input className="border rounded px-2 py-1 w-56" placeholder="Notes" value={draft.notes} onChange={e=>setDraft({...draft, notes:e.target.value})} />
              <input className="border rounded px-2 py-1 w-56" placeholder="Prescription" value={draft.prescription} onChange={e=>setDraft({...draft, prescription:e.target.value})} />
              <button onClick={addRecord} className="text-brand-green font-medium">Add</button>
            </div>
          )}
          {loading && <p className="text-xs text-gray-500">Loading…</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <ul className="space-y-4">
            {records.map(r => (
              <li key={r.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium tracking-wide text-gray-500">{r.date}</span>
                  <span className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-1 rounded-full">VISIT</span>
                </div>
                {!isDoctor && (
                  <>
                    <p className="text-sm mb-2">{r.notes}</p>
                    <p className="text-xs text-gray-600"><span className="font-semibold">Prescription:</span> {r.prescription}</p>
                  </>
                )}
                {isDoctor && (
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2 flex-wrap">
                      <input type="date" className="border rounded px-2 py-1" value={r.date} onChange={e=>saveRecord(r.id, { date: e.target.value })} />
                      <input className="border rounded px-2 py-1 w-56" value={r.notes} onChange={e=>saveRecord(r.id, { notes: e.target.value })} />
                      <input className="border rounded px-2 py-1 w-56" value={r.prescription} onChange={e=>saveRecord(r.id, { prescription: e.target.value })} />
                    </div>
                    <div>
                      <button onClick={()=>deleteRecord(r.id)} className="text-red-600 text-xs">Delete</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
            {records.length === 0 && !loading && (
              <li className="text-xs text-gray-400">No records yet.</li>
            )}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PatientRecord;
