import React, { useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import AuthModal from '../components/AuthModal';

// Local SVG/illustration assets (swap with real optimized images when available)
import heroImg from '../assets/hero-implant.svg';
// Re-using hero implant illustration for placeholders; duplicate or replace with unique files later
const service1 = heroImg;
const service2 = heroImg;
const service3 = heroImg;

const Hero: React.FC = () => {
  const [ref, isInView] = useIntersectionObserver();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <header
      ref={ref}
      className={`fullscreen-section section-card ${isInView ? 'in-view' : ''} bg-white md:bg-transparent md:pt-0`}
    >
      <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col md:block px-4 sm:px-6 pt-4 md:pt-8 pb-8 md:pb-16">
        {/* Top Nav / Mobile */}
        <nav className="flex items-center w-full mb-6">
          <span className="text-lg font-semibold italic text-white md:text-brand-dark">Dr. Shawn's</span>
          <a
            href="#about"
            className="hidden md:inline-block text-sm tracking-wide font-medium text-gray-300 md:text-gray-700 hover:text-brand-green transition-colors ml-8"
          >
            ABOUT
          </a>
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <button
              onClick={() => openAuth('login')}
              className="hidden md:inline-block text-xs font-semibold tracking-wide px-5 py-2 rounded-full border border-gray-300 hover:border-brand-green hover:text-brand-green transition"
            >
              LOGIN
            </button>
            <button
              onClick={() => openAuth('signup')}
              className="hidden md:inline-block text-xs font-semibold tracking-wide px-5 py-2 rounded-full bg-brand-green text-white hover:opacity-90 transition shadow-card"
            >
              SIGN UP
            </button>
            {/* Mobile menu placeholder */}
            <button
              className="md:hidden w-10 h-10 inline-flex items-center justify-center rounded-md bg-brand-green text-white font-bold"
              aria-label="Menu"
            >
              <span className="sr-only">Menu</span>
              ☰
            </button>
          </div>
        </nav>

        {/* Content Grid Desktop / Flex Mobile */}
        <div className="flex flex-col gap-6 md:grid md:grid-cols-12 md:gap-10 flex-1">
          {/* Left content (heading + CTA) */}
            <div className="order-1 md:order-none md:col-span-5 flex flex-col gap-6 md:gap-8 text-white md:text-black">
            <h1 className="text-4xl sm:text-5xl md:text-6xl leading-[1.05] font-extrabold tracking-tight">
              <span className="block">SMILE</span>
              <span className="block text-brand-green">BRIGHTER</span>
              <span className="block">WITH US</span>
            </h1>
            <div className="flex flex-wrap gap-4 items-center">
              <a
                href="#book"
                className="group inline-flex items-center gap-3 bg-brand-green text-white font-semibold text-base md:text-lg rounded-full pl-6 pr-8 md:pl-8 md:pr-10 py-4 md:py-5 shadow-card hover:shadow-lg transition-shadow"
              >
                <span className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center text-brand-green group-hover:translate-y-[-2px] transition-transform">
                  <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />
                </span>
                Book Now
              </a>
            </div>
          </div>

          {/* Image Card */}
          <div className="order-2 md:order-none md:col-span-4 relative">
            <div className="relative rounded-2xl md:rounded-3xl bg-[#9DC9BD] overflow-hidden aspect-[4/3] md:aspect-[4/5] flex items-end justify-center">
              <img src={heroImg} alt="Whitening" className="h-full w-full object-cover" />
              <span className="absolute top-4 left-4 md:top-6 md:left-8 text-white/90 tracking-wide text-xs md:text-sm font-semibold">
                DENTAL IMPLANT
              </span>
              <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 flex gap-2 md:gap-3 text-white/80">
                <button
                  aria-label="Previous"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/40 flex items-center justify-center hover:bg-white/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  aria-label="Next"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/40 flex items-center justify-center hover:bg-white/20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Service Tiles Desktop (right column) */}
          <div className="hidden md:flex md:col-span-3 flex-col gap-6">
            <a
              className="relative rounded-3xl overflow-hidden h-48 group bg-brand-dark text-white flex items-end p-6"
              href="#portfolio"
            >
              <img
                src={service1}
                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform"
                alt="Portfolio"
              />
              <span className="relative z-10 text-2xl font-semibold leading-6 max-w-[8ch]">PORTFOLIO</span>
            </a>
            <a
              className="relative rounded-3xl overflow-hidden h-48 group bg-gray-200 flex items-end p-6"
              href="#services"
            >
              <img
                src={service2}
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform"
                alt="All Services"
              />
              <span className="relative z-10 text-2xl font-semibold leading-6 max-w-[9ch] text-white drop-shadow">
                ALL SERVICES
              </span>
            </a>
            <a
              className="relative rounded-3xl overflow-hidden h-48 group bg-gray-200 flex items-end p-6"
              href="#products"
            >
              <img
                src={service3}
                className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform"
                alt="Our Products"
              />
              <span className="relative z-10 text-2xl font-semibold leading-6 max-w-[9ch] text-white drop-shadow">
                OUR PRODUCTS
              </span>
            </a>
          </div>

          {/* Phone Bar (desktop separate, mobile combined) */}
          <div className="order-3 md:order-none md:col-span-12 flex flex-col md:block">
            {/* Desktop original phone blocks */}
            <div className="hidden md:flex items-stretch gap-6 pt-4">
              <div className="bg-brand-green text-white rounded-md px-8 py-8 flex items-center justify-center text-2xl font-semibold shadow-card min-w-[320px]">
                +91-9074530621
              </div>
              <div className="flex-1 bg-white rounded-md border border-gray-200 shadow-card px-8 py-8 text-xl font-semibold flex items-center">
                Call Us
              </div>
            </div>
            {/* Mobile combined bar */}
            <div className="md:hidden mt-4 flex w-full rounded-xl overflow-hidden shadow-card text-sm font-semibold">
              <div className="flex-1 bg-brand-green text-white px-3 py-4 text-center">
                <span className="tracking-wide">+91-9074530621</span>
              </div>
              <button className="bg-white text-black px-6 py-4">CALL NOW</button>
            </div>
          </div>

          {/* Mobile service tiles grid */}
          <div className="order-4 md:hidden grid grid-cols-2 gap-5 mt-4">
            <a
              href="#portfolio"
              className="relative rounded-2xl overflow-hidden h-40 flex items-end p-4 bg-gray-800"
            >
              <img
                src={service1}
                alt="Portfolio"
                className="absolute inset-0 w-full h-full object-cover opacity-70"
              />
              <span className="relative z-10 text-lg font-bold leading-5 max-w-[8ch] text-white">
                PORTFOLIO
              </span>
            </a>
            <a
              href="#services"
              className="relative rounded-2xl overflow-hidden h-40 flex items-end p-4 bg-gray-700"
            >
              <img
                src={service2}
                alt="All Services"
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
              <span className="relative z-10 text-lg font-bold leading-5 max-w-[9ch] text-white drop-shadow">
                ALL SERVICES
              </span>
            </a>
            <a
              href="#products"
              className="relative rounded-2xl overflow-hidden h-44 col-span-2 flex items-end p-4 bg-gray-700"
            >
              <img
                src={service3}
                alt="Our Products"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
              <span className="relative z-10 text-lg font-bold leading-5 max-w-[12ch] text-white drop-shadow">
                OUR PRODUCTS
              </span>
              {/* Chat with AI button */}
              <button
                className="absolute left-1/2 -translate-x-1/2 bottom-4 inline-flex items-center gap-2 bg-brand-green text-white font-medium rounded-full px-6 py-3 shadow-card"
              >
                <Sparkles className="w-5 h-5" /> Chat with AI
              </button>
            </a>
          </div>
        </div>
      </div>
      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onSwitch={(m) => setAuthMode(m)}
      />
      {/* Background overlay for mobile dark theme */}
      <div className="absolute inset-0 bg-black md:bg-transparent -z-10" aria-hidden="true" />
    </header>
  );
};

export default Hero;
