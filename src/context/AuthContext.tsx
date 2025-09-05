import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firebaseAuth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, updateProfile, sendPasswordResetEmail } from 'firebase/auth';

export type Role = 'manager' | 'patient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  age?: number;
  gender?: string;
  mobile?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  medicalConditions?: string;
  medications?: string;
  notes?: string;
  createdAt?: any;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  doctorLogin: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string }) => Promise<void | { pending: boolean; message: string }>;
  resetPassword: (email:string) => Promise<void>;
  logout: () => void;
  createPatient: (data: {
    name: string; email: string; age?: number; gender?: string; mobile?: string;
    addressLine1?: string; addressLine2?: string; city?: string; state?: string; postalCode?: string;
    emergencyContactName?: string; emergencyContactPhone?: string; allergies?: string; medicalConditions?: string; medications?: string; notes?: string;
  }) => Promise<User>;
  patients: User[];
}

// Using localStorage as a placeholder persistence layer
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LS_KEY = 'demo-auth-users';
const LS_CURRENT = 'demo-auth-current';

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(users));
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const persistUsers = (next: User[]) => {
    setUsers(next);
    saveUsers(next);
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('doctor_token');
      if(!token) return; // only doctor fetch
      const res = await fetch('/api/patients', { headers:{ 'Authorization': `Bearer ${token}` }});
      if(!res.ok) return;
      const data: User[] = await res.json();
      // merge into local user store (avoid duplicates) so existing code relying on users works
      const others = users.filter(u=>u.role !== 'patient');
      persistUsers([...others, ...data.map(p=> ({...p, role: 'patient' as Role}))]);
    } catch {}
  };

  useEffect(() => {
    const loaded = loadUsers();
    setUsers(loaded);
    const unsub = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (fbUser) {
        const freshUsers = loadUsers();
        const existing = freshUsers.find(u => u.id === fbUser.uid);
        if (existing) {
          setUser(existing);
        } else {
          try {
            // Get user's custom claims to check if they're a doctor
            const tokenResult = await fbUser.getIdTokenResult();
            console.log('User claims:', tokenResult.claims); // Debug log
            const isDoctor = tokenResult.claims.role === 'doctor';
            
            if (isDoctor) {
              const newUser: User = { 
                id: fbUser.uid, 
                name: fbUser.displayName || fbUser.email || 'Doctor', 
                email: fbUser.email || '', 
                role: 'manager' 
              };
              const next = [...freshUsers, newUser];
              persistUsers(next);
              setUser(newUser);
            } else {
              // For regular users, check approval status
              const isApproved = tokenResult.claims.approved === true;
              
              if (!isApproved) {
                // Check user approval status from server
                try {
                  const response = await fetch(`/api/users/status/${fbUser.uid}`);
                  const statusData = await response.json();
                  
                  if (statusData.status === 'pending') {
                    // Sign out user and show pending message
                    await firebaseAuth.signOut();
                    alert('Your account is pending approval. Please wait for doctor approval before logging in.');
                    setLoading(false);
                    return;
                  } else if (statusData.status === 'rejected') {
                    // Sign out user and show rejection message
                    await firebaseAuth.signOut();
                    alert('Your account has been rejected. Please contact the clinic for more information.');
                    setLoading(false);
                    return;
                  }
                } catch (error) {
                  console.error('Error checking user status:', error);
                  // If can't check status, sign out for safety
                  await firebaseAuth.signOut();
                  alert('Unable to verify account status. Please try again later.');
                  setLoading(false);
                  return;
                }
              }
              
              // User is approved, create user object
              const newUser: User = { 
                id: fbUser.uid, 
                name: fbUser.displayName || fbUser.email || 'User', 
                email: fbUser.email || '', 
                role: 'patient' 
              };
              const next = [...freshUsers, newUser];
              persistUsers(next);
              setUser(newUser);
            }
          } catch (error) {
            console.error('Error getting user claims:', error);
            // For safety, sign out if there's an error
            await firebaseAuth.signOut();
            alert('Authentication error. Please try logging in again.');
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // if doctor logged (token present) fetch patients on mount & every 60s
  useEffect(()=>{
    if(localStorage.getItem('doctor_token')){
      fetchPatients();
      const id = setInterval(fetchPatients, 60000);
      return ()=> clearInterval(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(firebaseAuth, email, password);
  };

  const doctorLogin = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email, password }) });
    if(!res.ok){
      const err = await res.json().catch(()=>({error:'Login failed'}));
      throw new Error(err.error || 'Doctor login failed');
    }
    const data = await res.json();
    const docUser: User = { id: data.user.id, name: data.user.name, email: data.user.email, role: 'manager' };
    setUser(docUser);
    localStorage.setItem('doctor_token', data.token);
    fetchPatients();
  };

  const signup = async ({ name, email, password }: { name: string; email: string; password: string }) => {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }

    // Register user for approval instead of immediate access
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: cred.user.uid,
          name: name || email,
          email: email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit registration for approval');
      }

      // Sign out immediately since account needs approval
      await firebaseAuth.signOut();
      
      // Return success message for pending approval
      return { 
        pending: true, 
        message: 'Account created successfully! Please wait for doctor approval before logging in.' 
      };
    } catch (error) {
      // If registration fails, delete the Firebase auth account
      await cred.user.delete();
      throw error;
    }
  };

  const logout = () => {
    firebaseAuth.signOut();
    setUser(null);
    localStorage.removeItem(LS_CURRENT);
    localStorage.removeItem('doctor_token'); // Clear doctor token on logout
  };

  const createPatient = async (payload: { name: string; email: string; age?: number; gender?: string; mobile?: string; addressLine1?: string; addressLine2?: string; city?: string; state?: string; postalCode?: string; emergencyContactName?: string; emergencyContactPhone?: string; allergies?: string; medicalConditions?: string; medications?: string; notes?: string; }) => {
    const token = localStorage.getItem('doctor_token');
    if(!token) throw new Error('Not authorized');
    const res = await fetch('/api/patients', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
    if(!res.ok){
      const err = await res.json().catch(()=>({error:'Create failed'}));
      throw new Error(err.error || 'Create patient failed');
    }
    const created = await res.json();
    // assign role for local representation
    const patient: User = { ...created, role: 'patient' };
    const others = users.filter(u=>u.id !== patient.id);
    persistUsers([...others, patient]);
    return patient;
  };

  const resetPassword = async (email:string) => {
    await sendPasswordResetEmail(firebaseAuth, email);
  };

  const value: AuthContextValue = {
    user,
    loading,
    login,
    doctorLogin,
    signup,
    resetPassword,
    logout,
    createPatient,
    patients: users.filter(u => u.role === 'patient')
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
