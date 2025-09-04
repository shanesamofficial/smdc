import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, LogOut, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

const ManagerDashboard: React.FC = () => {
  const { user, patients, createPatient, logout } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!user) return <div className="p-8">Not logged in.</div>;
  if (user.role !== 'manager') return <div className="p-8">Access denied.</div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    try {
      await createPatient({ name, email });
      setSuccess('Patient created');
      setName(''); setEmail('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const [dark, setDark] = useState(false);
  return (
    <div className={dark ? 'min-h-screen bg-[#0f1517] text-gray-100' : 'min-h-screen bg-gray-50 text-gray-900'}>
      <header className={dark ? 'bg-[#121c1f] border-b border-gray-700 px-8 py-4 flex items-center gap-6' : 'bg-white border-b px-8 py-4 flex items-center gap-6'}>
        <h1 className="text-xl font-semibold flex-1">Manager Dashboard</h1>
        <button onClick={()=>setDark(d=>!d)} className={dark? 'w-9 h-9 inline-flex items-center justify-center rounded-md border border-gray-600 text-gray-200 hover:bg-gray-700' : 'w-9 h-9 inline-flex items-center justify-center rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100'} aria-label="Toggle dashboard dark mode">
          {dark? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <Link to="/" className="text-sm text-brand-green font-medium">Site</Link>
        <button onClick={logout} className="flex items-center gap-2 text-sm font-medium text-red-600 hover:underline"><LogOut className="w-4 h-4"/>Logout</button>
      </header>
      <main className="max-w-6xl mx-auto p-8 grid md:grid-cols-3 gap-10">
        <section className={dark ? 'md:col-span-1 bg-[#121c1f] rounded-xl shadow-sm border border-gray-700 p-6' : 'md:col-span-1 bg-white rounded-xl shadow-sm border p-6'}>
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/>Create Patient</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-medium tracking-wide block mb-1">NAME</label>
              <input value={name} onChange={e=>setName(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium tracking-wide block mb-1">EMAIL</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <button className="w-full bg-brand-green text-white rounded-full py-2 text-sm font-semibold">Add Patient</button>
            {error && <p className="text-xs text-red-600">{error}</p>}
            {success && <p className="text-xs text-green-600">{success}</p>}
          </form>
        </section>
  <section className={dark ? 'md:col-span-2 bg-[#121c1f] rounded-xl shadow-sm border border-gray-700 p-6 overflow-hidden' : 'md:col-span-2 bg-white rounded-xl shadow-sm border p-6 overflow-hidden'}>
          <h2 className="font-semibold mb-4">Patients</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs border-b">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Records</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id} className="border-b last:border-none">
                    <td className="py-2 pr-4 font-medium">{p.name}</td>
                    <td className="py-2 pr-4">{p.email}</td>
                    <td className="py-2 pr-4"><Link to={`/patient/${p.id}`} className="text-brand-green hover:underline">View</Link></td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-gray-400">No patients yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ManagerDashboard;
