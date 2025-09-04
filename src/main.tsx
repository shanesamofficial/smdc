import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import Hero from './sections/Hero';
import Intro from './sections/Intro';
import Services from './sections/Services';
import LogoShowcase from './components/LogoLoop';
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

const Landing: React.FC = () => (
  <>
    <SiteNav />
  <div className="scroll-container">
      <Hero />
      <Intro />
  <Services />
  <LogoShowcase />
    </div>
  <Footer />
  </>
);

const App: React.FC = () => (
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
  <Route path="/manager" element={<Navigate to="/doctor" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

createRoot(document.getElementById('root')!).render(<App />);
