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
  const requireApproval = (import.meta.env.VITE_REQUIRE_APPROVAL || 'false') === 'true';

  const persistUsers = (next: User[]) => {
    setUsers(next);
    saveUsers(next);
  };

  const fetchPatients = async () => {
    try {
      const hmac = localStorage.getItem('doctor_token');
      let headers: Record<string,string> = {};
      if (hmac) headers = { Authorization: `Bearer ${hmac}` };
      else if (firebaseAuth.currentUser) {
        try {
          const idt = await firebaseAuth.currentUser.getIdToken();
          headers = { Authorization: `Bearer ${idt}` };
        } catch {}
      }
      if(!headers.Authorization) return; // only doctor fetch
      const res = await fetch('/api/patients', { headers });
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

            // Check if this user should be auto-promoted to doctor (Vite env)
            const doctorEmail = (import.meta as any).env?.VITE_DOCTOR_EMAIL || 'shahidrshawn@gmail.com'; // fallback
            const shouldBeDoctor = fbUser.email?.toLowerCase() === doctorEmail.toLowerCase();
            
            if (shouldBeDoctor && !isDoctor) {
              // Auto-set doctor claims for the doctor's email
              try {
                console.log('Auto-setting doctor claims for:', fbUser.email);
                const doctorToken = localStorage.getItem('doctor_token');
                if (doctorToken) {
                  const response = await fetch('/api/auth/set-doctor-claims', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${doctorToken}`
                    },
                    body: JSON.stringify({ uid: fbUser.uid })
                  });
                  
                  if (response.ok) {
                    console.log('Doctor claims set successfully');
                    // Refresh the token to get updated claims
                    await fbUser.getIdToken(true);
                    const newTokenResult = await fbUser.getIdTokenResult();
                    const newIsDoctor = newTokenResult.claims.role === 'doctor';
                    
                    if (newIsDoctor) {
                      const newUser: User = { 
                        id: fbUser.uid, 
                        name: fbUser.displayName || fbUser.email || 'Doctor', 
                        email: fbUser.email || '', 
                        role: 'manager' 
                      };
                      const next = [...freshUsers, newUser];
                      persistUsers(next);
                      setUser(newUser);
                      return;
                    }
                  }
                }
              } catch (error) {
                console.error('Failed to auto-set doctor claims:', error);
              }
            }
            
            if (isDoctor || shouldBeDoctor) {
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
              // For regular users
              if (requireApproval) {
                // Approval workflow enabled: allow only if approved claim or server marks approved
                const hasApprovedClaim = tokenResult.claims.approved === true;
                let approved = hasApprovedClaim;
                if (!approved) {
                  try {
                    const response = await fetch(`/api/users/status/${fbUser.uid}`);
                    const statusData = await response.json();
                    approved = statusData.status === 'approved';
                    if (!approved) {
                      await firebaseAuth.signOut();
                      const msg = statusData.status === 'pending'
                        ? 'Your account is pending approval. Please wait for doctor approval before logging in.'
                        : statusData.status === 'rejected'
                          ? 'Your account has been rejected. Please contact the clinic for more information.'
                          : 'Your account is not approved yet. Please wait for approval.';
                      alert(msg);
                      setLoading(false);
                      return;
                    }
                  } catch (error) {
                    console.error('Error checking user status:', error);
                    await firebaseAuth.signOut();
                    alert('Unable to verify account status. Please try again later.');
                    setLoading(false);
                    return;
                  }
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

  // If doctor logged (via HMAC or Firebase), fetch patients on mount & every 60s
  useEffect(()=>{
    const hasHmac = !!localStorage.getItem('doctor_token');
    const isDoctor = user?.role === 'manager';
    if (hasHmac || isDoctor) {
      fetchPatients();
      const id = setInterval(fetchPatients, 60000);
      return ()=> clearInterval(id);
    }
    return;
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
    if (requireApproval) {
      // Register user for approval instead of immediate access (kept but gated)
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
    } else {
      // Immediate access: persist locally and keep user logged in
      const role: Role = users.length === 0 ? 'manager' : 'patient';
      const newUser: User = { id: cred.user.uid, name: name || email, email, role };
      const next = [...users, newUser];
      persistUsers(next);
      setUser(newUser);
    }
  };

  const logout = () => {
    firebaseAuth.signOut();
    setUser(null);
    localStorage.removeItem(LS_CURRENT);
    localStorage.removeItem('doctor_token'); // Clear doctor token on logout
  };

  const createPatient = async (payload: { name: string; email: string; age?: number; gender?: string; mobile?: string; addressLine1?: string; addressLine2?: string; city?: string; state?: string; postalCode?: string; emergencyContactName?: string; emergencyContactPhone?: string; allergies?: string; medicalConditions?: string; medications?: string; notes?: string; }) => {
    const hmac = localStorage.getItem('doctor_token');
    let headers: Record<string,string> = { 'Content-Type': 'application/json' };
    if (hmac) headers.Authorization = `Bearer ${hmac}`;
    else if (firebaseAuth.currentUser) {
      try {
        const idt = await firebaseAuth.currentUser.getIdToken();
        headers.Authorization = `Bearer ${idt}`;
      } catch {}
    }
    if(!headers.Authorization) throw new Error('Not authorized');
    const res = await fetch('/api/patients', { method:'POST', headers, body: JSON.stringify(payload) });
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
