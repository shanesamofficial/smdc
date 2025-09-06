import React, { useEffect, useMemo, useState } from 'react';
import Footer from '../components/Footer';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firebaseAuth } from '../firebase';

// Placeholder for patient medical data structure
interface OrthoDetails { stage?: string; appliances?: string; adjustments?: string; nextSteps?: string; treatment?: string; images?: string[]; nextAppointmentDate?: string; nextAppointmentNote?: string }
interface RecordEntry { id: string; date: string; notes: string; prescription: string; createdAt?: string; amount?: number; type?: 'general'|'orthodontic'; orthodontic?: OrthoDetails|null }

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

  const [draft, setDraft] = useState<{ date:string; notes:string; prescription:string; amount:number; type:'general'|'orthodontic'; orthodontic: OrthoDetails }>({ 
    date: new Date().toISOString().slice(0,10), notes:'', prescription:'', amount: 0, type: 'general', orthodontic: { stage:'', appliances:'', adjustments:'', nextSteps:'', treatment:'', images: [], nextAppointmentDate:'', nextAppointmentNote:'' }
  });
  const addRecord = async () => {
    if(!id) return;
    try{
      const headers = await getAuthHeader();
  const res = await fetch(`/api/patients/${id}/records`, { method:'POST', headers: { 'Content-Type':'application/json', ...headers }, body: JSON.stringify(draft) });
      if(!res.ok) throw new Error('Failed to add record');
      const created = await res.json();
      setRecords(list => [created, ...list]);
  setDraft({ date: new Date().toISOString().slice(0,10), notes:'', prescription:'', amount: 0, type:'general', orthodontic: { stage:'', appliances:'', adjustments:'', nextSteps:'' } });
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
            <div className="flex items-center gap-3">
              {isDoctor && (
                <div className="text-xs text-gray-600">
                  Total: <span className="font-semibold text-brand-green">₹{(records.reduce((s,r)=> s + (Number(r.amount)||0), 0)).toFixed(2)}</span>
                </div>
              )}
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
              {draft.type === 'orthodontic' && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-24">Stage</label>
                    <input className="border rounded px-2 py-1 flex-1" value={draft.orthodontic.stage} onChange={e=>setDraft({...draft, orthodontic: { ...draft.orthodontic, stage: e.target.value }})} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-24">Appliances</label>
                    <input className="border rounded px-2 py-1 flex-1" value={draft.orthodontic.appliances} onChange={e=>setDraft({...draft, orthodontic: { ...draft.orthodontic, appliances: e.target.value }})} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-24">Adjustments</label>
                    <input className="border rounded px-2 py-1 flex-1" value={draft.orthodontic.adjustments} onChange={e=>setDraft({...draft, orthodontic: { ...draft.orthodontic, adjustments: e.target.value }})} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-24">Next steps</label>
                    <input className="border rounded px-2 py-1 flex-1" value={draft.orthodontic.nextSteps} onChange={e=>setDraft({...draft, orthodontic: { ...draft.orthodontic, nextSteps: e.target.value }})} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-24">Treatment</label>
                    <input className="border rounded px-2 py-1 flex-1" placeholder="Treatment done" value={draft.orthodontic.treatment || ''} onChange={e=>setDraft({...draft, orthodontic: { ...draft.orthodontic, treatment: e.target.value }})} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-24">Image URL</label>
                    <input className="border rounded px-2 py-1 flex-1" placeholder="https://..." value={''} onChange={()=>{}} />
                    <button type="button" className="text-xs text-brand-green" onClick={()=>{
                      const url = prompt('Enter image URL (uploaded to Firebase Storage)');
                      if(url){ setDraft({...draft, orthodontic: { ...draft.orthodontic, images: [...(draft.orthodontic.images||[]), url] }}) }
                    }}>Add</button>
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
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-24">Appt Notes</label>
                    <input className="border rounded px-2 py-1 flex-1" placeholder="Appointment notes" value={draft.orthodontic.nextAppointmentNote || ''} onChange={e=>setDraft({...draft, orthodontic: { ...draft.orthodontic, nextAppointmentNote: e.target.value }})} />
                  </div>
                </div>
              )}
              <div className="md:col-span-2 flex justify-end">
                <button onClick={addRecord} className="text-white bg-brand-green px-4 py-1.5 rounded-full text-sm font-medium">Add Record</button>
              </div>
            </div>
          )}
          {loading && <p className="text-xs text-gray-500">Loading…</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <ul className="space-y-4">
            {records.map(r => (
              <li key={r.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium tracking-wide text-gray-500">{r.date}</span>
                  <div className="flex items-center gap-2">
                    {typeof r.amount === 'number' && r.amount > 0 && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full">₹{Number(r.amount).toFixed(2)}</span>
                    )}
                    <span className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-1 rounded-full">{r.type === 'orthodontic' ? 'ORTHO' : 'VISIT'}</span>
                  </div>
                </div>
                {!isDoctor && (
                  <>
                    <p className="text-sm mb-2">{r.notes}</p>
                    <p className="text-xs text-gray-600"><span className="font-semibold">Prescription:</span> {r.prescription}</p>
                    {r.type === 'orthodontic' && (
                      <div className="mt-2 space-y-1 text-xs text-gray-700">
                        {r.orthodontic?.treatment && <div><span className="font-semibold">Treatment:</span> {r.orthodontic.treatment}</div>}
                        {r.orthodontic?.nextSteps && <div><span className="font-semibold">Next steps:</span> {r.orthodontic.nextSteps}</div>}
                        {r.orthodontic?.nextAppointmentDate && (
                          <div><span className="font-semibold">Next appointment:</span> {r.orthodontic.nextAppointmentDate} {r.orthodontic.nextAppointmentNote ? `– ${r.orthodontic.nextAppointmentNote}` : ''}</div>
                        )}
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
                {isDoctor && (
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2 flex-wrap">
                      <input type="date" className="border rounded px-2 py-1" value={r.date} onChange={e=>saveRecord(r.id, { date: e.target.value })} />
                      <input className="border rounded px-2 py-1 w-56" value={r.notes} onChange={e=>saveRecord(r.id, { notes: e.target.value })} />
                      <input className="border rounded px-2 py-1 w-56" value={r.prescription} onChange={e=>saveRecord(r.id, { prescription: e.target.value })} />
                      <select className="border rounded px-2 py-1" value={r.type || 'general'} onChange={e=>saveRecord(r.id, { type: e.target.value as any })}>
                        <option value="general">General</option>
                        <option value="orthodontic">Orthodontic</option>
                      </select>
                      <input type="number" className="border rounded px-2 py-1 w-28" placeholder="Amount" value={r.amount ?? 0} onChange={e=>saveRecord(r.id, { amount: Number(e.target.value) || 0 })} />
                    </div>
                    {r.type === 'orthodontic' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input className="border rounded px-2 py-1" placeholder="Stage" value={r.orthodontic?.stage || ''} onChange={e=>saveRecord(r.id, { orthodontic: { ...r.orthodontic, stage: e.target.value } as any })} />
                        <input className="border rounded px-2 py-1" placeholder="Appliances" value={r.orthodontic?.appliances || ''} onChange={e=>saveRecord(r.id, { orthodontic: { ...r.orthodontic, appliances: e.target.value } as any })} />
                        <input className="border rounded px-2 py-1" placeholder="Adjustments" value={r.orthodontic?.adjustments || ''} onChange={e=>saveRecord(r.id, { orthodontic: { ...r.orthodontic, adjustments: e.target.value } as any })} />
                        <input className="border rounded px-2 py-1" placeholder="Next steps" value={r.orthodontic?.nextSteps || ''} onChange={e=>saveRecord(r.id, { orthodontic: { ...r.orthodontic, nextSteps: e.target.value } as any })} />
                        <input className="border rounded px-2 py-1 md:col-span-2" placeholder="Treatment" value={r.orthodontic?.treatment || ''} onChange={e=>saveRecord(r.id, { orthodontic: { ...r.orthodontic, treatment: e.target.value } as any })} />
                        <div className="md:col-span-2">
                          <div className="flex items-center gap-2 mb-2">
                            <input className="border rounded px-2 py-1 flex-1" placeholder="Add image URL (uploaded)" onKeyDown={(e)=>{
                              if (e.key === 'Enter') {
                                const input = e.target as HTMLInputElement;
                                const val = input.value.trim();
                                if (val) {
                                  saveRecord(r.id, { orthodontic: { ...r.orthodontic, images: [...(r.orthodontic?.images || []), val] } as any });
                                  input.value='';
                                }
                              }
                            }} />
                            <button type="button" className="text-xs text-brand-green" onClick={()=>{
                              const url = prompt('Enter image URL');
                              if(url){ saveRecord(r.id, { orthodontic: { ...r.orthodontic, images: [...(r.orthodontic?.images||[]), url] } as any }); }
                            }}>Add</button>
                          </div>
                          {!!(r.orthodontic?.images && r.orthodontic.images.length) && (
                            <div className="flex gap-2 flex-wrap">
                              {r.orthodontic.images.map((u, i)=> (
                                <div key={i} className="relative w-20 h-20 border rounded overflow-hidden">
                                  <a href={u} target="_blank" rel="noreferrer">
                                    <img src={u} className="object-cover w-full h-full" />
                                  </a>
                                  <button type="button" className="absolute top-1 right-1 text-[10px] bg-white/80 px-1 rounded" onClick={()=>{
                                    const next = [...(r.orthodontic?.images||[])]; next.splice(i,1);
                                    saveRecord(r.id, { orthodontic: { ...r.orthodontic, images: next } as any });
                                  }}>x</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="date" className="border rounded px-2 py-1" min={new Date().toISOString().slice(0,10)} value={r.orthodontic?.nextAppointmentDate || ''} onChange={e=>saveRecord(r.id, { orthodontic: { ...r.orthodontic, nextAppointmentDate: e.target.value } as any })} />
                          <input className="border rounded px-2 py-1 flex-1" placeholder="Appointment notes" value={r.orthodontic?.nextAppointmentNote || ''} onChange={e=>saveRecord(r.id, { orthodontic: { ...r.orthodontic, nextAppointmentNote: e.target.value } as any })} />
                        </div>
                      </div>
                    )}
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
