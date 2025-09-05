import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminSetup: React.FC = () => {
  const { user } = useAuth();
  const [uid, setUid] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Doctor login state
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [isLoggedInAsDoctor, setIsLoggedInAsDoctor] = useState(false);
  const [showDocPwd, setShowDocPwd] = useState(false);

  // Check if doctor token exists on mount
  React.useEffect(() => {
    const token = localStorage.getItem('doctor_token');
    setIsLoggedInAsDoctor(!!token);
  }, []);

  const doctorLogin = async () => {
    if (!doctorEmail.trim() || !doctorPassword.trim()) {
      setLoginMessage('Please enter both email and password');
      return;
    }

    setLoginLoading(true);
    setLoginMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: doctorEmail, password: doctorPassword })
      });

      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('doctor_token', data.token);
        setIsLoggedInAsDoctor(true);
        setLoginMessage('✅ Doctor login successful! You can now set custom claims.');
        setDoctorEmail('');
        setDoctorPassword('');
      } else {
        setLoginMessage(`❌ Login failed: ${data.error || 'Invalid credentials'}`);
      }
    } catch (error) {
      setLoginMessage(`❌ Network error: ${error}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const setDoctorClaims = async () => {
    if (!uid.trim()) {
      setMessage('Please enter a Firebase UID');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('doctor_token');
      console.log('Retrieved token:', token ? 'Token found' : 'No token found');
      
      if (!token) {
        setMessage('Error: No doctor token found. Please login with doctor credentials first.');
        setLoading(false);
        return;
      }

      console.log('Sending request to set claims for UID:', uid.trim());
      const res = await fetch('/api/auth/set-doctor-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uid: uid.trim() })
      });

      const data = await res.json();
      console.log('Server response:', data);
      
      if (res.ok) {
        setMessage('✅ Doctor claims set successfully! The user can now access the dashboard via Firebase Auth.');
      } else {
        setMessage(`❌ Error: ${data.error || 'Failed to set claims'}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      setMessage(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const setCurrentUserAsDoctor = async () => {
    if (!user) {
      setMessage('❌ No Firebase user logged in. Please login first.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('doctor_token');
      console.log('Retrieved token:', token ? 'Token found' : 'No token found');
      
      if (!token) {
        setMessage('Error: No doctor token found. Please login with doctor credentials first.');
        setLoading(false);
        return;
      }

      console.log('Setting claims for current user UID:', user.id);
      const res = await fetch('/api/auth/set-doctor-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uid: user.id })
      });

      const data = await res.json();
      console.log('Server response:', data);
      
      if (res.ok) {
        setMessage('✅ Current user set as doctor successfully! You can now access the dashboard via Firebase Auth.');
      } else {
        setMessage(`❌ Error: ${data.error || 'Failed to set claims'}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      setMessage(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-xl font-semibold mb-6">Admin Setup</h1>
        
        {/* Step 1: Doctor Login */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-medium">Step 1: Doctor Login</h2>
          
          {!isLoggedInAsDoctor ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Doctor Email</label>
                <input
                  type="email"
                  value={doctorEmail}
                  onChange={(e) => setDoctorEmail(e.target.value)}
                  placeholder="Enter doctor email"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Doctor Password</label>
                <div className="relative">
                  <input
                    type={showDocPwd ? 'text' : 'password'}
                    value={doctorPassword}
                    onChange={(e) => setDoctorPassword(e.target.value)}
                    placeholder="Enter doctor password"
                    className="w-full border rounded-lg px-3 py-2 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    aria-label={showDocPwd ? 'Hide password' : 'Show password'}
                    onClick={() => setShowDocPwd((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showDocPwd ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 3l18 18"/><path d="M10.58 10.58a3 3 0 104.24 4.24"/><path d="M16.24 16.24A10.94 10.94 0 0112 18c-5 0-9-4-9-6a10.94 10.94 0 014.46-4.94"/><path d="M9.88 5.12A10.94 10.94 0 0112 6c5 0 9 4 9 6a10.94 10.94 0 01-1.64 2.88"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={doctorLogin}
                disabled={loginLoading}
                className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
              >
                {loginLoading ? 'Logging in...' : 'Login as Doctor'}
              </button>
            </>
          ) : (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
              ✅ Logged in as doctor. You can now set custom claims.
            </div>
          )}

          {loginMessage && (
            <div className={`text-sm p-3 rounded-lg ${
              loginMessage.includes('✅') 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {loginMessage}
            </div>
          )}
        </div>

        {/* Step 2: Set Claims (only show if logged in as doctor) */}
        {isLoggedInAsDoctor && (
          <div className="space-y-4 pt-6 border-t">
            <h2 className="text-lg font-medium">Step 2: Set Firebase Claims</h2>
            
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

            {user && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium mb-2">Quick Setup</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Make the currently logged-in Firebase user ({user.email}) a doctor
                </p>
                <button
                  onClick={setCurrentUserAsDoctor}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {loading ? 'Setting Claims...' : 'Make Current User Doctor'}
                </button>
              </div>
            )}

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
        )}

        <div className="mt-6 pt-6 border-t text-xs text-gray-500">
          <p><strong>Steps:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Login with doctor credentials above</li>
            <li>Get Firebase UID from Authentication tab</li>
            <li>Enter UID and click "Set Doctor Claims"</li>
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
