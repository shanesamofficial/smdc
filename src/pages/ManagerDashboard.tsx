import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, LogOut, Moon, Sun, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const DoctorDashboard: React.FC = () => {
  const { user, patients, createPatient, logout } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState('');
  const [mobile, setMobile] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [medications, setMedications] = useState('');
  const [notes, setNotes] = useState('');

  // Access control: allow if role manager OR valid doctor token present
  const token = typeof window !== 'undefined' ? localStorage.getItem('doctor_token') : null;
  const authorized = (user && user.role === 'manager') || !!token;
  if(!authorized){
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="p-8 rounded-xl border bg-white shadow-sm text-center space-y-4 max-w-sm"><h1 className="text-xl font-semibold">Restricted</h1><p className="text-sm text-gray-500">Doctor access only. Please log in as doctor.</p><a href="/" className="inline-block text-sm font-medium text-brand-green hover:underline">Go Home</a></div></div>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    try {
  await createPatient({
        name,
        email,
        age: age? Number(age): undefined,
        gender: gender || undefined,
        mobile: mobile || undefined,
        addressLine1: addressLine1 || undefined,
        addressLine2: addressLine2 || undefined,
        city: city || undefined,
        state: stateRegion || undefined,
        postalCode: postalCode || undefined,
        emergencyContactName: emergencyContactName || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
        allergies: allergies || undefined,
        medicalConditions: medicalConditions || undefined,
        medications: medications || undefined,
        notes: notes || undefined,
      });
      setSuccess('Patient created');
  setName(''); setEmail(''); setAge(''); setGender(''); setMobile('');
      setAddressLine1(''); setAddressLine2(''); setCity(''); setStateRegion(''); setPostalCode('');
      setEmergencyContactName(''); setEmergencyContactPhone(''); setAllergies(''); setMedicalConditions(''); setMedications(''); setNotes('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const [dark, setDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const inputClass = (extra: string = '') => dark
    ? `w-full rounded-lg px-3 py-2 text-sm bg-[#182125] border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green/50 ${extra}`
    : `w-full rounded-lg px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green/40 ${extra}`;
  const [activeTab, setActiveTab] = useState<'new' | 'patients' | 'bookings' | 'approvals'>('new');
  // Bookings state
  interface Booking { id:string; name:string; email:string; phone:string; date:string; time:string; service:string; notes:string; createdAt:string; emailStatus?:string }
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string|null>(null);
  const [sortKey, setSortKey] = useState<'name'|'service'|'date'|'time'|'createdAt'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');

  const loadBookings = async () => {
    setBookingsLoading(true); setBookingsError(null);
    try {
      const res = await fetch('/api/bookings', { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if(!res.ok) throw new Error('Failed to load');
      setBookings(await res.json());
    } catch(err:any) {
      setBookingsError(err.message);
    } finally { setBookingsLoading(false); }
  };
  useEffect(()=>{ loadBookings(); }, []);

  // Pending users state
  interface PendingUser { id: string; uid: string; name: string; email: string; status: string; createdAt: string; }
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState<string|null>(null);

  const loadPendingUsers = async () => {
    setPendingLoading(true); setPendingError(null);
    try {
      const res = await fetch('/api/users/pending', { 
        headers: token ? { Authorization: `Bearer ${token}` } : undefined 
      });
      if(!res.ok) throw new Error('Failed to load pending users');
      const data = await res.json();
      setPendingUsers(data.users);
    } catch(err:any) {
      setPendingError(err.message);
    } finally { setPendingLoading(false); }
  };

  const approveUser = async (uid: string, approve: boolean) => {
    try {
      const res = await fetch('/api/users/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uid, approve })
      });
      
      if(!res.ok) throw new Error('Failed to update user status');
      
      // Refresh pending users list
      await loadPendingUsers();
      setSuccess(`User ${approve ? 'approved' : 'rejected'} successfully`);
    } catch(err: any) {
      setError(err.message);
    }
  };

  useEffect(()=>{ loadPendingUsers(); }, []);

  // Mobile menu scroll lock
  useEffect(() => {
    if (mobileMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileMenuOpen]);

  const deleteBooking = async (id:string) => {
    if(!confirm('Delete this booking?')) return;
    try {
      const res = await fetch(`/api/bookings/${id}` , { method:'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if(!res.ok) throw new Error('Failed to delete');
      setBookings(b=>b.filter(x=>x.id!==id));
    } catch(err:any) {
      alert(err.message);
    }
  };

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(d=> d==='asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key); setSortDir('asc');
    }
  };

  const sortedBookings = useMemo(()=> {
    const copy = [...bookings];
    copy.sort((a,b)=> {
      let va:any = a[sortKey];
      let vb:any = b[sortKey];
      if(sortKey === 'createdAt') { va = new Date(va).getTime(); vb = new Date(vb).getTime(); }
      const cmp = va > vb ? 1 : va < vb ? -1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [bookings, sortKey, sortDir]);

  const relativeTime = (iso:string) => {
    if(!iso) return '—';
    const now = Date.now();
    const t = new Date(iso).getTime();
    if(isNaN(t)) return '—';
    const diff = now - t;
    const sec = Math.floor(diff/1000);
    if(sec < 60) return sec + 's ago';
    const min = Math.floor(sec/60);
    if(min < 60) return min + 'm ago';
    const hr = Math.floor(min/60);
    if(hr < 24) return hr + 'h ago';
    const day = Math.floor(hr/24);
    if(day < 7) return day + 'd ago';
    const wk = Math.floor(day/7);
    if(wk < 4) return wk + 'w ago';
    const mo = Math.floor(day/30);
    if(mo < 12) return mo + 'mo ago';
    const yr = Math.floor(day/365);
    return yr + 'y ago';
  };
  const sidebarBase = dark ? 'bg-[#121c1f] border-gray-700' : 'bg-white border-gray-200';
  const btnTab = (key: typeof activeTab, label: string, count?: number) => (
    <button
      key={key}
      onClick={() => {
        setActiveTab(key);
        setMobileMenuOpen(false); // Close mobile menu on selection
      }}
      className={`w-full flex items-center justify-between text-sm px-3 py-2 rounded-lg border transition ${activeTab===key
        ? 'bg-brand-green text-white border-brand-green'
        : dark ? 'border-transparent text-gray-300 hover:bg-gray-700/40' : 'border-transparent text-gray-600 hover:bg-gray-100'}`}
      aria-current={activeTab===key}
    >
      <span className="font-medium">{label}</span>
      {typeof count === 'number' && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${activeTab===key? 'bg-white/20' : dark? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>{count}</span>}
    </button>
  );

  const renderNewPatient = () => (
    <div className={dark ? 'bg-[#121c1f] rounded-xl border border-gray-700 p-6 max-w-3xl' : 'bg-white rounded-xl border p-6 max-w-3xl'}>
      <h2 className="font-semibold mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/>Create Patient</h2>
      <form onSubmit={submit} className="space-y-8">
        <div>
          <label className="text-xs font-medium tracking-wide block mb-1">NAME</label>
          <input value={name} onChange={e=>setName(e.target.value)} required className={inputClass()} placeholder="Full name" />
        </div>
        <div>
          <label className="text-xs font-medium tracking-wide block mb-1">EMAIL</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className={inputClass()} placeholder="name@example.com" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <label className="text-xs font-medium tracking-wide block mb-1">AGE</label>
            <input type="number" min={0} value={age} onChange={e=>setAge(e.target.value)} className={inputClass()} placeholder="e.g. 34" />
          </div>
          <div className="col-span-1">
            <label className="text-xs font-medium tracking-wide block mb-1">GENDER</label>
            <select value={gender} onChange={e=>setGender(e.target.value)} className={inputClass('appearance-none')}> 
              <option value="">--</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not">Prefer not</option>
            </select>
          </div>
            <div className="col-span-1">
              <label className="text-xs font-medium tracking-wide block mb-1">MOBILE</label>
              <input value={mobile} onChange={e=>setMobile(e.target.value)} required className={inputClass()} placeholder="+1 555 123 4567" />
            </div>
        </div>
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold tracking-wide text-gray-500">ADDRESS</legend>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium block mb-1">ADDRESS LINE 1 *</label>
              <input value={addressLine1} onChange={e=>setAddressLine1(e.target.value)} required className={inputClass()} placeholder="Street, number" />
            </div>
            <div>
              <label className="text-[11px] font-medium block mb-1">ADDRESS LINE 2</label>
              <input value={addressLine2} onChange={e=>setAddressLine2(e.target.value)} className={inputClass()} placeholder="Apt / Suite" />
            </div>
            <div>
              <label className="text-[11px] font-medium block mb-1">CITY *</label>
              <input value={city} onChange={e=>setCity(e.target.value)} required className={inputClass()} />
            </div>
            <div>
              <label className="text-[11px] font-medium block mb-1">STATE / REGION *</label>
              <input value={stateRegion} onChange={e=>setStateRegion(e.target.value)} required className={inputClass()} />
            </div>
            <div>
              <label className="text-[11px] font-medium block mb-1">POSTAL CODE *</label>
              <input value={postalCode} onChange={e=>setPostalCode(e.target.value)} required className={inputClass()} />
            </div>
          </div>
        </fieldset>
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold tracking-wide text-gray-500">EMERGENCY CONTACT</legend>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium block mb-1">CONTACT NAME *</label>
              <input value={emergencyContactName} onChange={e=>setEmergencyContactName(e.target.value)} required className={inputClass()} />
            </div>
            <div>
              <label className="text-[11px] font-medium block mb-1">CONTACT PHONE *</label>
              <input value={emergencyContactPhone} onChange={e=>setEmergencyContactPhone(e.target.value)} required className={inputClass()} placeholder="+1 555 987 6543" />
            </div>
          </div>
        </fieldset>
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold tracking-wide text-gray-500">MEDICAL INFORMATION</legend>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium block mb-1">ALLERGIES</label>
              <textarea value={allergies} onChange={e=>setAllergies(e.target.value)} className={inputClass('h-20 resize-y')} placeholder="List allergies" />
            </div>
            <div>
              <label className="text-[11px] font-medium block mb-1">MEDICAL CONDITIONS</label>
              <textarea value={medicalConditions} onChange={e=>setMedicalConditions(e.target.value)} className={inputClass('h-20 resize-y')} placeholder="Chronic illnesses, etc." />
            </div>
            <div>
              <label className="text-[11px] font-medium block mb-1">CURRENT MEDICATIONS</label>
              <textarea value={medications} onChange={e=>setMedications(e.target.value)} className={inputClass('h-20 resize-y')} placeholder="Names & dosages" />
            </div>
            <div>
              <label className="text-[11px] font-medium block mb-1">NOTES</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} className={inputClass('h-20 resize-y')} placeholder="Additional context" />
            </div>
          </div>
        </fieldset>
        <button className="w-full bg-brand-green text-white rounded-full py-2 text-sm font-semibold">Add Patient</button>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-green-600">{success}</p>}
      </form>
    </div>
  );

  const renderPatients = () => (
    <div className={dark ? 'bg-[#121c1f] rounded-xl border border-gray-700 p-6 overflow-hidden' : 'bg-white rounded-xl border p-6 overflow-hidden'}>
      <h2 className="font-semibold mb-4">Patients</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs border-b">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Age</th>
              <th className="py-2 pr-4">Gender</th>
              <th className="py-2 pr-4">Mobile</th>
              <th className="py-2 pr-4">City</th>
              <th className="py-2 pr-4">Emergency Contact</th>
              <th className="py-2 pr-4">Records</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.id} className="border-b last:border-none">
                <td className="py-2 pr-4 font-medium">{p.name}</td>
                <td className="py-2 pr-4">{p.email}</td>
                <td className="py-2 pr-4">{p.age ?? '—'}</td>
                <td className="py-2 pr-4 capitalize">{p.gender ? (p.gender === 'prefer_not' ? '—' : p.gender) : '—'}</td>
                <td className="py-2 pr-4">{p.mobile || '—'}</td>
                <td className="py-2 pr-4">{p.city || '—'}</td>
                <td className="py-2 pr-4 text-xs">{p.emergencyContactName ? `${p.emergencyContactName} · ${p.emergencyContactPhone || ''}` : '—'}</td>
                <td className="py-2 pr-4"><Link to={`/patient/${p.id}`} className="text-brand-green hover:underline">View</Link></td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr><td colSpan={8} className="py-6 text-center text-gray-400">No patients yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className={dark ? 'bg-[#121c1f] rounded-xl border border-gray-700 p-6 overflow-hidden' : 'bg-white rounded-xl border p-6 overflow-hidden'}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Bookings</h2>
        <button onClick={loadBookings} className="text-xs font-medium text-brand-green hover:underline disabled:opacity-50" disabled={bookingsLoading}>Refresh</button>
      </div>
      <div className="overflow-x-auto rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs border-b">
              <th className="py-2 px-3 cursor-pointer select-none" onClick={()=>toggleSort('name')}>Name {sortKey==='name' && (sortDir==='asc'?'▲':'▼')}</th>
              <th className="py-2 px-3 cursor-pointer select-none" onClick={()=>toggleSort('service')}>Service {sortKey==='service' && (sortDir==='asc'?'▲':'▼')}</th>
              <th className="py-2 px-3 cursor-pointer select-none" onClick={()=>toggleSort('date')}>Date {sortKey==='date' && (sortDir==='asc'?'▲':'▼')}</th>
              <th className="py-2 px-3 cursor-pointer select-none" onClick={()=>toggleSort('time')}>Time {sortKey==='time' && (sortDir==='asc'?'▲':'▼')}</th>
              <th className="py-2 px-3 cursor-pointer select-none" onClick={()=>toggleSort('createdAt')}>Submitted {sortKey==='createdAt' && (sortDir==='asc'?'▲':'▼')}</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedBookings.map(b => (
              <tr key={b.id} className="border-b last:border-none">
                <td className="py-2 px-3 font-medium">{b.name}</td>
                <td className="py-2 px-3">{b.service}</td>
                <td className="py-2 px-3">{b.date}</td>
                <td className="py-2 px-3">{b.time}</td>
                <td className="py-2 px-3 text-xs text-gray-500 whitespace-nowrap" title={new Date(b.createdAt).toLocaleString()}>{relativeTime(b.createdAt)}</td>
                <td className="py-2 px-3 text-xs">
                  <span className={
                    b.emailStatus === 'sent' ? 'bg-green-100 text-green-700 px-2 py-1 rounded-full' :
                    b.emailStatus === 'error' ? 'bg-red-100 text-red-700 px-2 py-1 rounded-full' :
                    'bg-gray-100 text-gray-600 px-2 py-1 rounded-full'
                  }>{b.emailStatus || '—'}</span>
                </td>
                <td className="py-2 px-3 text-xs">
                  <button onClick={()=>deleteBooking(b.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && !bookingsLoading && (
              <tr><td colSpan={7} className="py-6 text-center text-gray-400 text-xs">No bookings yet</td></tr>
            )}
            {bookingsLoading && (
              <tr><td colSpan={7} className="py-6 text-center text-gray-400 text-xs">Loading…</td></tr>
            )}
            {bookingsError && (
              <tr><td colSpan={7} className="py-6 text-center text-red-500 text-xs">{bookingsError}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderApprovals = () => (
    <div className={dark ? 'bg-[#121c1f] rounded-xl border border-gray-700 p-6 overflow-hidden' : 'bg-white rounded-xl border p-6 overflow-hidden'}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Pending User Approvals</h2>
        <button onClick={loadPendingUsers} className="text-xs font-medium text-brand-green hover:underline disabled:opacity-50" disabled={pendingLoading}>Refresh</button>
      </div>
      <div className="overflow-x-auto rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs border-b">
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3">Email</th>
              <th className="py-2 px-3">Registered</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map(user => (
              <tr key={user.uid} className="border-b last:border-none">
                <td className="py-2 px-3 font-medium">{user.name}</td>
                <td className="py-2 px-3">{user.email}</td>
                <td className="py-2 px-3 text-xs text-gray-500 whitespace-nowrap" title={new Date(user.createdAt).toLocaleString()}>
                  {relativeTime(user.createdAt)}
                </td>
                <td className="py-2 px-3 text-xs space-x-2">
                  <button 
                    onClick={() => approveUser(user.uid, true)} 
                    className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-full font-medium transition"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => approveUser(user.uid, false)} 
                    className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-full font-medium transition"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
            {pendingUsers.length === 0 && !pendingLoading && (
              <tr><td colSpan={4} className="py-6 text-center text-gray-400 text-xs">No pending approvals</td></tr>
            )}
            {pendingLoading && (
              <tr><td colSpan={4} className="py-6 text-center text-gray-400 text-xs">Loading…</td></tr>
            )}
            {pendingError && (
              <tr><td colSpan={4} className="py-6 text-center text-red-500 text-xs">{pendingError}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={dark ? 'min-h-screen flex flex-col bg-[#0f1517] text-gray-100' : 'min-h-screen flex flex-col bg-gray-50 text-gray-900'}>
      <header className={dark ? 'bg-[#121c1f] border-b border-gray-700 px-4 md:px-6 lg:px-8 py-4 flex items-center gap-4' : 'bg-white border-b px-4 md:px-6 lg:px-8 py-4 flex items-center gap-4'}>
        {/* Mobile menu button */}
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className={`md:hidden w-9 h-9 inline-flex items-center justify-center rounded-md border ${dark ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        
        <h1 className="text-lg md:text-xl font-semibold flex-1">Doctor Dashboard</h1>
        <button onClick={()=>setDark(d=>!d)} className={dark? 'w-9 h-9 inline-flex items-center justify-center rounded-md border border-gray-600 text-gray-200 hover:bg-gray-700' : 'w-9 h-9 inline-flex items-center justify-center rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100'} aria-label="Toggle dashboard dark mode">
          {dark? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <Link to="/" className="text-sm text-brand-green font-medium">Site</Link>
        <button onClick={logout} className="hidden md:flex items-center gap-2 text-sm font-medium text-red-600 hover:underline"><LogOut className="w-4 h-4"/>Logout</button>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className={`absolute left-0 top-0 bottom-0 w-72 ${dark ? 'bg-[#121c1f] border-gray-700' : 'bg-white border-gray-200'} border-r shadow-xl`}>
            <div className="p-4 border-b border-gray-200/30 flex items-center justify-between">
              <h2 className="font-semibold">Navigation</h2>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className={`w-8 h-8 inline-flex items-center justify-center rounded-md ${dark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <p className="text-[10px] font-semibold tracking-wide text-gray-500 mb-1">SECTIONS</p>
              {btnTab('new','New Patient')}
              {btnTab('patients','Patients', patients.length)}
              {btnTab('bookings','Bookings', bookings.length)}
              {btnTab('approvals','User Approvals', pendingUsers.length)}
              
              <div className="mt-6 pt-4 border-t border-gray-200/30">
                <button 
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }} 
                  className="w-full flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg"
                >
                  <LogOut className="w-4 h-4"/>Logout
                </button>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200/30 text-[10px] text-gray-400">
                © {new Date().getFullYear()} Dr. Shawn's
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex w-full max-w-7xl mx-auto gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Desktop sidebar */}
        <aside className={`hidden md:flex w-56 shrink-0 h-fit rounded-xl border ${sidebarBase} p-4 flex-col gap-2 sticky top-24 self-start`}> 
          <p className="text-[10px] font-semibold tracking-wide text-gray-500 mb-1">SECTIONS</p>
          {btnTab('new','New Patient')}
          {btnTab('patients','Patients', patients.length)}
          {btnTab('bookings','Bookings', bookings.length)}
          {btnTab('approvals','User Approvals', pendingUsers.length)}
          <div className="mt-4 pt-4 border-t border-gray-200/30 text-[10px] text-gray-400">© {new Date().getFullYear()} Dr. Shawn's</div>
        </aside>
        
        <main className="flex-1 flex flex-col gap-6 md:gap-8 pb-20">
          {activeTab === 'new' && renderNewPatient()}
          {activeTab === 'patients' && renderPatients()}
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'approvals' && renderApprovals()}
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;
