import React, { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { firebaseAuth } from '../firebase';

const MemberHome: React.FC = () => {
  const { user, logout } = useAuth();
  const [patientId, setPatientId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(()=>{
    const load = async ()=>{
      if (!user || user.role !== 'patient') { setLoading(false); return; }
      try{
        const idt = await firebaseAuth.currentUser?.getIdToken();
        if (!idt) { setError('Not authorized'); setLoading(false); return; }
        const res = await fetch('/api/me/patient', { headers: { Authorization: `Bearer ${idt}` }});
        if (!res.ok) { setError('Profile not found'); setLoading(false); return; }
        const me = await res.json();
        setPatientId(me.id);
      }catch(e:any){ setError(e.message || 'Failed to load'); }
      finally{ setLoading(false); }
    };
    load();
  }, [user]);

  if (!user) return <div className="p-8">Not logged in.</div>;
  if (user.role !== 'patient') return <div className="p-8">Accessible only to patients.</div>;

  if (loading) return <div className="p-8 text-sm text-gray-500">Loading…</div>;
  return (
  <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b px-8 py-4 flex items-center gap-6">
        <h1 className="text-lg font-semibold flex-1">Welcome, {user.name}</h1>
        {error ? (
          <span className="text-xs text-red-600">{error}</span>
        ) : (
          <Link to={patientId ? `/patient/${patientId}` : '#'} className="text-sm text-brand-green font-medium {patientId? '' : 'pointer-events-none opacity-50'}">My Records</Link>
        )}
        <button onClick={logout} className="text-sm text-red-600 font-medium">Logout</button>
      </header>
  <main className="flex-1 max-w-3xl mx-auto p-8 space-y-8">
        <section className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="font-semibold mb-2">Your Overview</h2>
          <p className="text-sm text-gray-600">Access your visit history, prescriptions, and upcoming appointments (placeholder). This is a read-only area for your medical information.</p>
          <div className="mt-4">
            {patientId ? (
              <Link to={`/patient/${patientId}`} className="inline-block bg-brand-green text-white rounded-full px-6 py-2 text-sm font-medium">View My Records</Link>
            ) : (
              <button disabled className="inline-block bg-gray-300 text-white rounded-full px-6 py-2 text-sm font-medium cursor-not-allowed">View My Records</button>
            )}
          </div>
        </section>
        <section className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-2">Security & Privacy</h3>
          <p className="text-xs text-gray-500">Ensure nobody else can view your data. Always log out on shared devices. (Integrate real auth + backend for production.)</p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default MemberHome;
