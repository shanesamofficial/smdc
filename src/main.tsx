import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import Hero from './sections/Hero';
import Intro from './sections/Intro';
import Services from './sections/Services';
import LogoShowcase from './components/LogoLoop';
import Testimonials from './sections/Testimonials';
import ServicesPage from './pages/ServicesPage';
import Footer from './components/Footer';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DoctorDashboard from './pages/DoctorDashboard';
import MemberHome from './pages/MemberHome';
import PatientRecord from './pages/PatientRecord';
import Contact from './pages/Contact';
import About from './pages/About';
import Portfolio from './pages/Portfolio';
import SiteNav from './components/SiteNav';
import Booking from './pages/Booking';
import AdminSetup from './pages/AdminSetup';
import BookingDetails from './pages/BookingDetails';
import ErrorPage from './pages/ErrorPage';
import NotFound from './pages/NotFound';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error?: Error}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('React Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
  return <ErrorPage error={this.state.error} />;
    }
    return this.props.children;
  }
}

const Landing: React.FC = () => (
  <>
    <SiteNav />
    {/* Flash toast for logout */}
    <FlashToast />
    <div className="scroll-container">
      <Hero />
      <Intro />
      <Services />
      <LogoShowcase />
      <Testimonials />
    </div>
    <Footer />
  </>
);

const FlashToast: React.FC = () => {
  const [msg, setMsg] = React.useState<string | null>(null);
  React.useEffect(() => {
    try {
      const f = sessionStorage.getItem('flash');
      if (f === 'logged_out') {
        setMsg('Logged out');
        sessionStorage.removeItem('flash');
      }
    } catch {}
  }, []);
  if (!msg) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200]">
      <div className="bg-black/80 text-white text-sm px-4 py-2 rounded-full shadow-lg">
        {msg}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  console.log('App component rendering...');
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/member" element={<MemberHome />} />
            <Route path="/patient/:id" element={<PatientRecord />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route path="/booking/:id" element={<BookingDetails />} />
            <Route path="/manager" element={<Navigate to="/doctor" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

console.log('Creating React root...');
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
} else {
  console.log('Root element found, creating app...');
  createRoot(rootElement).render(<App />);
  console.log('App rendered successfully');
  // Hide initial preloader once app mounts
  const pre = document.getElementById('preloader');
  if (pre) {
    pre.style.opacity = '0';
    // Give the transition time, then remove from DOM
    setTimeout(() => pre.remove(), 300);
  }
}
