import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const MemberHome: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return <div className="p-8">Not logged in.</div>;
  if (user.role !== 'patient') return <div className="p-8">Accessible only to patients.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4 flex items-center gap-6">
        <h1 className="text-lg font-semibold flex-1">Welcome, {user.name}</h1>
        <Link to={`/patient/${user.id}`} className="text-sm text-brand-green font-medium">My Records</Link>
        <button onClick={logout} className="text-sm text-red-600 font-medium">Logout</button>
      </header>
      <main className="max-w-3xl mx-auto p-8 space-y-8">
        <section className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="font-semibold mb-2">Your Overview</h2>
          <p className="text-sm text-gray-600">Access your visit history, prescriptions, and upcoming appointments (placeholder). This is a read-only area for your medical information.</p>
          <div className="mt-4">
            <Link to={`/patient/${user.id}`} className="inline-block bg-brand-green text-white rounded-full px-6 py-2 text-sm font-medium">View My Records</Link>
          </div>
        </section>
        <section className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-2">Security & Privacy</h3>
          <p className="text-xs text-gray-500">Ensure nobody else can view your data. Always log out on shared devices. (Integrate real auth + backend for production.)</p>
        </section>
      </main>
    </div>
  );
};

export default MemberHome;
