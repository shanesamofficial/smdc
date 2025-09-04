import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Home, Info, Images, Layers, Phone, ChevronRight, LayoutDashboard } from 'lucide-react';
import AuthModal from './AuthModal';
import { useAuth } from '../context/AuthContext';

interface NavItem { to:string; label:string; icon: React.ComponentType<{className?:string}> }
const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/about', label: 'About', icon: Info },
  { to: '/services', label: 'Services', icon: Layers },
  { to: '/portfolio', label: 'Portfolio', icon: Images },
  { to: '/contact', label: 'Contact', icon: Phone },
  { to: '/doctor', label: 'Doctor', icon: LayoutDashboard },
];

const SiteNav: React.FC<{ compact?: boolean }>=({ compact })=>{
  const [open, setOpen] = useState(false); // logical open state
  const [closing, setClosing] = useState(false); // legacy (kept for compatibility)
  const overlayRef = useRef<HTMLDivElement|null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const { user, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const openAuth = (mode:'login'|'signup') => { setAuthMode(mode); setAuthOpen(true); };

  const closeMenu = useCallback(()=>{
    // animate out via data-open attr; delay state flip for accessibility focus return
    setClosing(true);
    setOpen(false);
    setTimeout(()=>{ setClosing(false); }, 200);
  }, []);

  // Body scroll lock
  useEffect(()=>{
    if(open){
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Focus first link when opened
  useEffect(()=>{
    if(open && firstLinkRef.current){
      requestAnimationFrame(()=> firstLinkRef.current?.focus());
    }
  }, [open]);

  // ESC to close
  useEffect(()=>{
    if(!open) return;
    const handler = (e:KeyboardEvent)=>{ if(e.key==='Escape') closeMenu(); };
    window.addEventListener('keydown', handler);
    return ()=> window.removeEventListener('keydown', handler);
  }, [open, closeMenu]);

  const linkBase = 'px-2 py-1 rounded transition-colors';
  const renderLinks = (onClick?:()=>void)=>(
    navItems.map(item=> (
      <NavLink key={item.to} to={item.to} end={item.to==='/' } onClick={()=>{ onClick?.(); setOpen(false); }} className={({isActive})=>`${linkBase} ${isActive? 'text-brand-green font-semibold' : 'text-gray-600 hover:text-brand-green'}`}>{item.label}</NavLink>
    ))
  );

  return (
    <>
      <header className={`w-full ${compact? 'py-4' : 'py-6'} px-6 md:px-10 flex items-center ${open ? 'bg-white/70 backdrop-blur-xl' : 'bg-white/90 backdrop-blur-md'} sticky top-0 z-[100] transition-all duration-300`}>      
        <NavLink to="/" className="text-lg font-semibold italic text-brand-dark">Dr. Shawn's</NavLink>
        <nav className="ml-8 hidden md:flex items-center gap-6 text-sm font-medium">
          {renderLinks()}
        </nav>
        <div className="ml-auto hidden md:flex items-center gap-4">
          {!user && (
            <>
              <button onClick={()=>openAuth('login')} className="text-sm font-medium text-gray-700 hover:text-brand-green">Login</button>
              <button onClick={()=>openAuth('signup')} className="text-sm font-semibold bg-brand-green text-white rounded-full px-5 py-2 shadow-card hover:shadow-md transition">Sign Up</button>
            </>
          )}
          {user && (
            <>
              <span className="text-xs font-medium text-gray-500">Hi, {user.name.split(' ')[0]}</span>
              <button onClick={logout} className="text-xs text-red-600 font-medium">Logout</button>
            </>
          )}
        </div>
        <div className="md:hidden ml-auto flex items-center gap-3">
          {!user && (
            <button onClick={()=>openAuth('login')} className="text-sm font-medium text-gray-700 hover:text-brand-green px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50">Login</button>
          )}
          {user && (
            <span className="text-xs font-medium text-gray-600">Hi, {user.name.split(' ')[0]}</span>
          )}
          <button className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-300 hover:bg-gray-100" onClick={()=>setOpen(true)} aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>
      {/* Mobile Popup Menu */}
      {/* Mobile Popup Menu (pre-mounted for faster open) */}
      <div ref={overlayRef} data-open={open} className="mobile-menu-overlay md:hidden">
        <button aria-label="Close menu" onClick={closeMenu} className="overlay-bg" />
        <div role="dialog" aria-modal={open? 'true':'false'} className="mobile-menu-panel">
          <div className="flex items-center justify-between flex-shrink-0">
            <NavLink to="/" className="text-lg font-semibold italic text-brand-dark" onClick={closeMenu}>Dr. Shawn's</NavLink>
            <button className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100" onClick={closeMenu} aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col gap-2 mt-4 overflow-y-auto max-h-[60vh] hide-scrollbar" aria-label="Mobile navigation">
            {navItems.map((item, idx)=>{
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to==='/' }
                  ref={idx===0? firstLinkRef : undefined}
                  onClick={closeMenu}
                  className={({isActive})=>`group relative flex items-center gap-4 px-4 py-3 rounded-xl border border-transparent ${isActive? 'bg-brand-green/10 text-brand-green font-semibold border-brand-green/30' : 'hover:bg-gray-50 text-gray-700'} transition`}
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-white shadow-inner">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-sm tracking-wide flex-1">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-green transition" />
                </NavLink>
              );
            })}
          </div>
          <div className="flex flex-col gap-3 pt-4 flex-shrink-0">
            {!user && (
              <button onClick={()=>{ setOpen(false); openAuth('signup'); }} className="w-full text-sm font-semibold bg-brand-green text-white rounded-full py-3 shadow-card">Sign Up</button>
            )}
            {user && (
              <div className="flex items-center justify-between text-xs bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <span className="font-medium text-gray-700 truncate">{user.name}</span>
                <button onClick={()=>{ logout(); closeMenu(); }} className="text-red-600 font-semibold">Logout</button>
              </div>
            )}
          </div>
          <div className="pt-4 mt-auto text-[11px] tracking-wide text-gray-400 flex items-center justify-between border-t border-gray-200 flex-shrink-0">
            <span>© {new Date().getFullYear()} Dr. Shawn's</span>
            <span className="font-medium text-gray-500">Smile Care</span>
          </div>
          <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-brand-green/20 to-transparent blur-3xl" />
        </div>
      </div>
      <AuthModal open={authOpen} mode={authMode} onClose={()=>setAuthOpen(false)} onSwitch={(m)=> setAuthMode(m)} />
    </>
  );
};

export default SiteNav;
