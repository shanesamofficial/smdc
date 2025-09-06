import React, { useState, useEffect } from 'react';
import SiteNav from '../components/SiteNav';
import Footer from '../components/Footer';
import BlurText from '../components/BlurText';

interface BookingEntry { id:string; name:string; email:string; phone:string; date:string; time:string; notes:string; createdAt:string; }

const Booking: React.FC = () => {
  const [form, setForm] = useState({ name:'', email:'', phone:'', date:'', time:'', notes:'', reasons: [] as string[], address:'' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const [list, setList] = useState<BookingEntry[]>([]);

  const load = async () => {
    try {
      const res = await fetch('/api/bookings');
      if(!res.ok){
        // Non-OK (e.g., 401 if server still old). Safely ignore.
        return;
      }
      const data = await res.json();
      if(Array.isArray(data)) setList(data);
    } catch { /* ignore */ }
  };
  useEffect(()=>{ load(); }, []);

  const change = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const toggleReason = (val:string) => {
    setForm(f=> ({ ...f, reasons: f.reasons.includes(val) ? f.reasons.filter(r=>r!==val) : [...f.reasons, val] }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError(null); setSuccess(null);
    try {
  const res = await fetch('/api/bookings', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(form) });
      if(!res.ok) throw new Error((await res.json()).error || 'Failed');
      const created = await res.json();
      setSuccess('Booking requested successfully');
  setForm({ name:'', email:'', phone:'', date:'', time:'', notes:'', reasons:[], address:'' });
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
  <section className="w-full max-w-6xl mx-auto px-6 md:px-10 pt-16 md:pt-20 pb-20 flex flex-col gap-14">
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
                <label className="text-xs font-medium tracking-wide">NAME <span className="text-red-500">*</span><br/><span className="text-[11px] font-normal text-gray-500">പേര് എഴുതുക</span></label>
                <input name="name" value={form.name} onChange={change} required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-wide">PHONE <span className="text-red-500">*</span><br/><span className="text-[11px] font-normal text-gray-500">ഫോൺ നമ്പർ</span></label>
                <input name="phone" value={form.phone} onChange={change} required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-wide">EMAIL<br/><span className="text-[11px] font-normal text-gray-500">ഇമെയിൽ ഐഡി</span></label>
                <input type="email" name="email" value={form.email} onChange={change} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-medium tracking-wide">ADDRESS <span className="text-red-500">*</span><br/><span className="text-[11px] font-normal text-gray-500">അഡ്രസ്സ്</span></label>
                <input name="address" value={form.address} onChange={change} required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              {/* Service selection removed per request */}
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-wide">DATE</label>
                <input type="date" name="date" value={form.date} onChange={change} required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-wide">TIME</label>
                <input type="time" name="time" value={form.time} onChange={change} required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide">REASON FOR ENQUIRY <span className="text-red-500">*</span><br/><span className="text-[11px] font-normal text-gray-500">കാരണം</span></label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    ['Tooth Pain','പല്ല് വേദന'],
                    ['Carious Tooth','പല്ലിൽ കേട്'],
                    ['Fractured Tooth','പൊട്ടിയ പല്ല്'],
                    ['Cleaning','പല്ല് ക്ലീൻ ചെയ്യാൻ'],
                    ['Orthodontic Treatment','പല്ലിൽ കമ്പി ഇടാൻ'],
                    ['Aligner','അലൈനർ'],
                    ['Implant','ഇമ്പ്ലാന്റ്'],
                    ['Denture','വെപ്പ് പല്ല് വെക്കാൻ'],
                    ['Mobile Tooth','ഇളക്കുന്ന പല്ല്'],
                    ['Smile Design','സ്‌മൈൽ ഡിസൈൻ'],
                    ['Fixed Tooth','ഉറപ്പിച്ചു വെക്കുക പല്ലുകൾ'],
                    ['Gum Pain','മോണ വേദന'],
                    ['Other','മറ്റ് കാരണം']
                  ].map(([en, ml]) => (
                    <label key={en} className="flex items-start gap-2 text-[11px] bg-gray-50 rounded-lg px-3 py-2 border cursor-pointer">
                      <input type="checkbox" className="mt-0.5" checked={form.reasons.includes(en)} onChange={()=>toggleReason(en)} />
                      <span className="flex-1 leading-snug"><span className="font-medium text-gray-700 text-[12px]">{en}</span><br/><span className="text-gray-500">{ml}</span></span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-wide">NOTES<br/><span className="text-[11px] font-normal text-gray-500">അധിക കുറിപ്പുകൾ</span></label>
                <textarea name="notes" value={form.notes} onChange={change} rows={4} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Any symptoms, concerns or preferences" />
              </div>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            {success && <p className="text-xs text-green-600">{success}</p>}
            <button disabled={submitting} className="w-full bg-brand-green text-white rounded-full py-3 text-sm font-semibold disabled:opacity-60">{submitting? 'Submitting...' : 'Submit Booking'}</button>
          </form>
          <aside className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
              <h4 className="font-semibold mb-2 text-brand-dark">Recent Requests</h4>
              <ul className="space-y-4 max-h-[320px] overflow-auto pr-1 text-sm">
                {Array.isArray(list) && list.length > 0 && list.map(b => (
                  <li key={b.id} className="border rounded-lg p-3 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{b.name}</span>
                    </div>
                    <p className="text-xs text-gray-600">{b.date} @ {b.time}</p>
                  </li>
                ))}
                {(!Array.isArray(list) || list.length === 0) && <li className="text-xs text-gray-400">No bookings yet.</li>}
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