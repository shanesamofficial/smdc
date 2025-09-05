import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { firebaseAuth } from '../firebase';

type Booking = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  date?: string;
  time?: string;
  service?: string;
  reasons?: string[];
  address?: string;
  notes?: string;
  createdAt?: string;
  emailStatus?: string;
};

const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeader = async (): Promise<Record<string, string>> => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('doctor_token') : null;
    if (t) return { Authorization: `Bearer ${t}` };
    try {
      const u = firebaseAuth.currentUser;
      if (u) {
        const idt = await u.getIdToken();
        return { Authorization: `Bearer ${idt}` };
      }
    } catch {}
    return {};
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const headers = await getAuthHeader();
        if (!headers.Authorization) throw new Error('Not authorized');
        const res = await fetch(`/api/bookings/${id}`, { headers });
        if (!res.ok) throw new Error('Failed to load booking');
        const json = await res.json();
        if (mounted) setData(json);
      } catch (e: any) {
        if (mounted) setError(e.message || 'Failed to load booking');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="mb-4 text-sm">
          <Link to="/doctor" className="text-brand-green hover:underline">← Back to Dashboard</Link>
        </div>
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h1 className="text-lg font-semibold mb-4">Booking Details</h1>
          {loading && <p className="text-sm text-gray-500">Loading…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {data && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><div className="text-gray-500 text-xs">Name</div><div className="font-medium">{data.name}</div></div>
                <div><div className="text-gray-500 text-xs">Email</div><div>{data.email || '—'}</div></div>
                <div><div className="text-gray-500 text-xs">Phone</div><div>{data.phone || '—'}</div></div>
                <div><div className="text-gray-500 text-xs">Submitted</div><div>{data.createdAt ? new Date(data.createdAt).toLocaleString() : '—'}</div></div>
                <div><div className="text-gray-500 text-xs">Date</div><div>{data.date || '—'}</div></div>
                <div><div className="text-gray-500 text-xs">Time</div><div>{data.time || '—'}</div></div>
                <div><div className="text-gray-500 text-xs">Email Status</div><div>{data.emailStatus || '—'}</div></div>
                {data.service && (
                  <div><div className="text-gray-500 text-xs">Service</div><div>{data.service}</div></div>
                )}
                <div className="md:col-span-2"><div className="text-gray-500 text-xs">Address</div><div>{data.address || '—'}</div></div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Reasons</div>
                {data.reasons && data.reasons.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {data.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                ) : (
                  <div>—</div>
                )}
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Notes</div>
                <div className="whitespace-pre-wrap">{data.notes || '—'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
