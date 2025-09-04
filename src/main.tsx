import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import Hero from './sections/Hero';
import Intro from './sections/Intro';
import Services from './sections/Services';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ManagerDashboard from './pages/ManagerDashboard';
import MemberHome from './pages/MemberHome';
import PatientRecord from './pages/PatientRecord';
import Contact from './pages/Contact';
import About from './pages/About';
import Portfolio from './pages/Portfolio';
import SiteNav from './components/SiteNav';

const Landing: React.FC = () => (
  <>
    <SiteNav />
    <div className="scroll-container">
      <Hero />
      <Intro />
      <Services />
    </div>
  </>
);

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/manager" element={<ManagerDashboard />} />
  <Route path="/member" element={<MemberHome />} />
  <Route path="/patient/:id" element={<PatientRecord />} />
  <Route path="/contact" element={<Contact />} />
  <Route path="/about" element={<About />} />
  <Route path="/portfolio" element={<Portfolio />} />
  <Route path="/services" element={<Services />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

createRoot(document.getElementById('root')!).render(<App />);
