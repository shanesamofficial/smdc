import React from 'react';
import Footer from '../components/Footer';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Placeholder for patient medical data structure
interface RecordEntry {
  id: string;
  date: string;
  notes: string;
  prescription: string;
}

// For demo: generate fake records deterministic from id
function generateRecords(id: string): RecordEntry[] {
  return [1,2,3].map(i => ({
    id: `${id}-${i}`,
    date: new Date(Date.now() - i*86400000).toLocaleDateString(),
    notes: `Check-up session ${i}. Patient progressing well.`,
    prescription: `Prescription ${i}: Take medication X ${i} times daily.`
  }));
}

const PatientRecord: React.FC = () => {
  const { id } = useParams();
  const { patients, user } = useAuth();
  const patient = patients.find(p => p.id === id);
  const records = id ? generateRecords(id) : [];

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
          <h3 className="font-semibold mb-4">History & Prescriptions</h3>
          <ul className="space-y-4">
            {records.map(r => (
              <li key={r.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium tracking-wide text-gray-500">{r.date}</span>
                  <span className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-1 rounded-full">VISIT</span>
                </div>
                <p className="text-sm mb-2">{r.notes}</p>
                <p className="text-xs text-gray-600"><span className="font-semibold">Prescription:</span> {r.prescription}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PatientRecord;
