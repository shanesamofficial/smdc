import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  open: boolean;
  mode: 'login' | 'signup';
  onClose: () => void;
  onSwitch: (mode: 'login' | 'signup') => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, mode, onClose, onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, signup, user } = useAuth();
  const isSignup = mode === 'signup';

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignup) {
        await signup({ name, email, password });
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = () => {
    alert('Google Sign-In to be implemented');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 text-gray-500 hover:text-black">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold mb-2">{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
        <p className="text-sm text-gray-500 mb-6">
          {isSignup ? 'Sign up to manage appointments and more.' : 'Login to continue.'}
        </p>
        {user && <p className="text-xs text-green-600 mb-4">Logged in as {user.email}</p>}
        <button onClick={googleSignIn} className="w-full border border-gray-300 hover:bg-gray-50 text-sm font-medium rounded-full py-3 flex items-center justify-center gap-2 mb-6">
          <img alt="Google" className="w-5 h-5" src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" />
          Continue with Google
        </button>
        <div className="flex items-center gap-4 mb-6">
          <span className="h-px bg-gray-200 flex-1" />
          <span className="text-[11px] tracking-wide text-gray-400 font-medium">OR</span>
          <span className="h-px bg-gray-200 flex-1" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-xs font-semibold tracking-wide mb-1">NAME</label>
              <input value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/60" placeholder="Jane Doe" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold tracking-wide mb-1">EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/60" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-wide mb-1">PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/60" placeholder="••••••••" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button disabled={loading} type="submit" className="w-full bg-brand-green text-white font-semibold rounded-full py-3 text-sm hover:opacity-90 transition disabled:opacity-60">
            {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          {isSignup ? (
            <>Already have an account? <button type="button" onClick={() => onSwitch('login')} className="text-brand-green font-medium">Log in</button></>
          ) : (
            <>No account? <button type="button" onClick={() => onSwitch('signup')} className="text-brand-green font-medium">Sign up</button></>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
