import React, { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import SiteNav from '../components/SiteNav';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { firebaseAuth } from '../firebase';
import Loader from '../components/Loader';

const MemberHome: React.FC = () => {
  const { user, logout } = useAuth();
  const [patientId, setPatientId] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(()=>{
    const load = async ()=>{
      if (!user || user.role !== 'patient') { setLoading(false); return; }
      try{
        const idt = await firebaseAuth.currentUser?.getIdToken();
        if (!idt) { setError('Not authorized'); setLoading(false); return; }
        const [resP, resR, resB] = await Promise.all([
          fetch('/api/me/patient', { headers: { Authorization: `Bearer ${idt}` }}),
          fetch('/api/me/records', { headers: { Authorization: `Bearer ${idt}` }}),
          fetch('/api/me/bookings', { headers: { Authorization: `Bearer ${idt}` }})
        ]);
        if (!resP.ok) { setError('Profile not found'); setLoading(false); return; }
        const me = await resP.json();
        setPatientId(me.id);
        setProfile(me);
        setRecords(await resR.json());
        setBookings(await resB.json());
      }catch(e:any){ setError(e.message || 'Failed to load'); }
      finally{ setLoading(false); }
    };
    load();
  }, [user]);

  if (!user) return <div className="p-8">Not logged in.</div>;
  if (user.role !== 'patient') return <div className="p-8">Accessible only to patients.</div>;

  if (loading) return <Loader className="min-h-[60vh]" />;
  return (
  <div className="min-h-screen flex flex-col bg-gray-50">
      <SiteNav compact />
      <header className="bg-white border-b px-8 py-4 flex items-center gap-6">
        <h1 className="text-lg font-semibold flex-1">Welcome, {user.name}</h1>
        {error ? (
          <span className="text-xs text-red-600">{error}</span>
        ) : (
          <Link to={patientId ? `/patient/${patientId}` : '#'} className="text-sm text-brand-green font-medium {patientId? '' : 'pointer-events-none opacity-50'}">My Records</Link>
        )}
        <button onClick={logout} className="text-sm text-red-600 font-medium">Logout</button>
      </header>
      <main className="flex-1 max-w-4xl mx-auto p-6 md:p-8 space-y-8">
        <section className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="font-semibold mb-4">Profile</h2>
          {profile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Name:</span> <span className="font-medium">{profile.name}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="font-medium">{profile.email}</span></div>
              {profile.mobile && <div><span className="text-gray-500">Mobile:</span> <span className="font-medium">{profile.mobile}</span></div>}
              {profile.city && <div><span className="text-gray-500">City:</span> <span className="font-medium">{profile.city}{profile.state? ', '+profile.state: ''}</span></div>}
              {profile.age && <div><span className="text-gray-500">Age:</span> <span className="font-medium">{profile.age}</span></div>}
              {profile.gender && <div><span className="text-gray-500">Gender:</span> <span className="font-medium">{profile.gender}</span></div>}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Profile not found. Please contact the clinic to link your account.</p>
          )}
          <div className="mt-4">
            {patientId ? (
              <Link to={`/patient/${patientId}`} className="inline-block bg-brand-green text-white rounded-full px-6 py-2 text-sm font-medium">View Full Records</Link>
            ) : (
              <button disabled className="inline-block bg-gray-300 text-white rounded-full px-6 py-2 text-sm font-medium cursor-not-allowed">View Full Records</button>
            )}
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-3">Recent Records</h3>
          {records.length ? (
            <ul className="divide-y">
              {records.slice(0,5).map(r => (
                <li key={r.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{r.date}</span>
                    <span className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-1 rounded-full">VISIT</span>
                  </div>
                  <div className="mt-1">{r.notes}</div>
                  {r.prescription && <div className="text-xs text-gray-600"><span className="font-medium">Prescription:</span> {r.prescription}</div>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No records to display.</p>
          )}
        </section>

        <section className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-3">Your Bookings</h3>
          {bookings.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-t">
                      <td className="py-2 pr-4">{b.date}</td>
                      <td className="py-2 pr-4">{b.time}</td>
                      <td className="py-2">{b.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No bookings found.</p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default MemberHome;
