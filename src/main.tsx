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
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
          <h1>Something went wrong.</h1>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

const Landing: React.FC = () => (
  <>
    <SiteNav />
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
            <Route path="/manager" element={<Navigate to="/doctor" replace />} />
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
}
