import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Role = 'manager' | 'patient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  createPatient: (data: { name: string; email: string }) => Promise<User>;
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

  useEffect(() => {
    const loaded = loadUsers();
    setUsers(loaded);
    const currentId = localStorage.getItem(LS_CURRENT);
    if (currentId) {
      const found = loaded.find(u => u.id === currentId) || null;
      setUser(found);
    }
    setLoading(false);
  }, []);

  const persistUsers = (next: User[]) => {
    setUsers(next);
    saveUsers(next);
  };

  const login = async (email: string, _password: string) => {
    // For demo: password ignored
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) throw new Error('User not found');
    setUser(found);
    localStorage.setItem(LS_CURRENT, found.id);
  };

  const signup = async ({ name, email }: { name: string; email: string; password: string }) => {
    // Only manager can create accounts directly; normal signup creates patient pending approval could be handled.
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) throw new Error('Email already registered');
    // For first ever user, make them manager automatically
    const role: Role = users.length === 0 ? 'manager' : 'patient';
    const newUser: User = { id: crypto.randomUUID(), name, email, role };
    const next = [...users, newUser];
    persistUsers(next);
    setUser(newUser);
    localStorage.setItem(LS_CURRENT, newUser.id);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LS_CURRENT);
  };

  const createPatient = async ({ name, email }: { name: string; email: string }) => {
    if (user?.role !== 'manager') throw new Error('Not authorized');
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) throw new Error('Email already used');
    const newUser: User = { id: crypto.randomUUID(), name, email, role: 'patient' };
    const next = [...users, newUser];
    persistUsers(next);
    return newUser;
  };

  const value: AuthContextValue = {
    user,
    loading,
    login,
    signup,
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
