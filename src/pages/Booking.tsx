import React, { useState, useEffect } from 'react';
import SiteNav from '../components/SiteNav';
import Footer from '../components/Footer';
import BlurText from '../components/BlurText';

interface BookingEntry { id:string; name:string; email:string; phone:string; date:string; time:string; service:string; notes:string; createdAt:string; }

const services = ['GENERAL','CLEANING','IMPLANT','ALIGNERS','VENEERS','ORTHODONTICS','CHILD CARE'];

const Booking: React.FC = () => {
  const [form, setForm] = useState({ name:'', email:'', phone:'', date:'', time:'', service:'GENERAL', notes:'' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const [list, setList] = useState<BookingEntry[]>([]);

  const load = async () => {
    try {
      const res = await fetch('/api/bookings');
      setList(await res.json());
    } catch { /* ignore */ }
  };
  useEffect(()=>{ load(); }, []);

  const change = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      const res = await fetch('/api/bookings', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(form) });
      if(!res.ok) throw new Error((await res.json()).error || 'Failed');
      const created = await res.json();
      setSuccess('Booking requested successfully');
      setForm({ name:'', email:'', phone:'', date:'', time:'', service:'GENERAL', notes:'' });
      setList(l => [created, ...l]);
    } catch(err:any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <SiteNav />
      <section className="w-full max-w-6xl mx-auto px-6 md:px-10 pt-14 pb-20 flex flex-col gap-14">
        <header className="space-y-6">
          <div className="text-4xl md:text-5xl font-extrabold tracking-tight">
            <BlurText text="Book an Appointment" delay={70} animateBy="words" direction="top" />
          </div>
          <p className="max-w-2xl text-[15px] md:text-base text-gray-700 leading-relaxed">Select a preferred date & time and submit your request. Our team will confirm availability and follow up with guidance or alternatives if needed.</p>
        </header>
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          <form onSubmit={submit} className="lg:col-span-3 space-y-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-wide">NAME</label>
                <input name="name" value={form.name} onChange={change} required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-wide">EMAIL</label>
                <input type="email" name="email" value={form.email} onChange={change} required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-wide">PHONE</label>
                <input name="phone" value={form.phone} onChange={change} required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-wide">SERVICE</label>
                <select name="service" value={form.service} onChange={change} className="w-full border rounded-lg px-3 py-2 text-sm">
                  {services.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-wide">DATE</label>
                <input type="date" name="date" value={form.date} onChange={change} required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-wide">TIME</label>
                <input type="time" name="time" value={form.time} onChange={change} required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide">NOTES (Optional)</label>
              <textarea name="notes" value={form.notes} onChange={change} rows={4} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Any symptoms, concerns or preferences" />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            {success && <p className="text-xs text-green-600">{success}</p>}
            <button disabled={submitting} className="w-full bg-brand-green text-white rounded-full py-3 text-sm font-semibold disabled:opacity-60">{submitting? 'Submitting...' : 'Submit Booking'}</button>
          </form>
          <aside className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
              <h4 className="font-semibold mb-2 text-brand-dark">Recent Requests</h4>
              <ul className="space-y-4 max-h-[320px] overflow-auto pr-1 text-sm">
                {list.map(b => (
                  <li key={b.id} className="border rounded-lg p-3 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{b.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green font-medium">{b.service}</span>
                    </div>
                    <p className="text-xs text-gray-600">{b.date} @ {b.time}</p>
                  </li>
                ))}
                {list.length === 0 && <li className="text-xs text-gray-400">No bookings yet.</li>}
              </ul>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm text-xs leading-relaxed text-gray-600">
              We process requests during working hours. Submitting this form doesn’t confirm an appointment until our staff contacts you for verification.
            </div>
          </aside>
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default Booking;