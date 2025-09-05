import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminSetup: React.FC = () => {
  const { user } = useAuth();
  const [uid, setUid] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const setDoctorClaims = async () => {
    if (!uid.trim()) {
      setMessage('Please enter a Firebase UID');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('doctor_token');
      if (!token) {
        setMessage('Error: No doctor token found. Please login with doctor credentials first.');
        return;
      }

      const res = await fetch('/api/auth/set-doctor-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uid: uid.trim() })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessage('✅ Doctor claims set successfully! The user can now access the dashboard via Firebase Auth.');
      } else {
        setMessage(`❌ Error: ${data.error || 'Failed to set claims'}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-xl font-semibold mb-6">Admin Setup</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Firebase User UID
            </label>
            <input
              type="text"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Enter Firebase user UID to make doctor"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get this from Firebase Console &gt; Authentication &gt; Users
            </p>
          </div>

          <button
            onClick={setDoctorClaims}
            disabled={loading}
            className="w-full bg-brand-green text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Setting Claims...' : 'Set Doctor Claims'}
          </button>

          {message && (
            <div className={`text-sm p-3 rounded-lg ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t text-xs text-gray-500">
          <p><strong>Steps:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Login with doctor credentials first</li>
            <li>Get Firebase UID from Authentication tab</li>
            <li>Enter UID above and click "Set Doctor Claims"</li>
            <li>User can now login via Firebase Auth as doctor</li>
          </ol>
        </div>

        {user && (
          <div className="mt-4 text-xs bg-gray-50 p-3 rounded">
            <p><strong>Current user:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>UID:</strong> {user.id}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSetup;
