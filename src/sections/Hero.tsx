import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import AuthModal from '../components/AuthModal';

// Local SVG/illustration assets (swap with real optimized images when available)
import whiteningImg from '../assets/whitening.jpg';
import whiteningImgMobile from '../assets/whitening-m.jpg';
import alignerImg from '../assets/aligner.jpg';
import implantImg from '../assets/implant.jpg';
import implantImgMobile from '../assets/implant-m.jpg';
import portfolioImg from '../assets/portfolio.jpg';
import servicesImg from '../assets/services.jpg';
import productsImg from '../assets/products.jpg';
import smileIcon from '../assets/smile.svg';
// Re-using hero implant illustration for placeholders; duplicate or replace with unique files later
const service1 = portfolioImg;
const service2 = servicesImg;
const service3 = productsImg;

type Slide = { img: string; label: string; imgMobile?: string };

const Hero: React.FC = () => {
  const [ref, isInView] = useIntersectionObserver();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const slides: Slide[] = [
    { img: whiteningImg, imgMobile: whiteningImgMobile, label: 'WHITENING' },
    { img: alignerImg, label: 'ALIGNERS' },
    { img: implantImg, imgMobile: implantImgMobile, label: 'IMPLANT' },
  ];
  const [baseIndex, setBaseIndex] = useState(0);
  const [overlayIndex, setOverlayIndex] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);

  const goTo = (idx: number) => {
    if (animating || idx === baseIndex) return;
    setOverlayIndex(idx);
    // Ensure the browser applies initial opacity before transitioning
    setAnimating(false);
    requestAnimationFrame(() => {
      setAnimating(true);
      // After fade-in completes, swap base to new image and remove overlay
      setTimeout(() => {
        setBaseIndex(idx);
        setOverlayIndex(null);
        setAnimating(false);
      }, 420);
    });
  };

  const prev = () => goTo((baseIndex - 1 + slides.length) % slides.length);
  const next = () => goTo((baseIndex + 1) % slides.length);

  // Auto-slide every 1.75s
  useEffect(() => {
    const id = setInterval(() => {
      if (!animating) {
        next();
      }
    }, 1750);
    return () => clearInterval(id);
  }, [animating, baseIndex]);

  return (
    <header
      ref={ref}
      className={`fullscreen-section section-card ${isInView ? 'in-view' : ''} bg-white md:bg-transparent md:pt-0`}
    >
  <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col md:block px-4 sm:px-6 pt-2 md:pt-6 pb-8 md:pb-14">
  {/* (Global SiteNav is rendered above; internal hero nav removed) */}

        {/* Content Grid Desktop / Flex Mobile */}
        <div className="flex flex-col gap-6 md:grid md:grid-cols-12 md:gap-10 flex-1">
          {/* Left content (heading + CTA) */}
            <div className="order-1 md:order-none md:col-span-5 flex flex-col gap-6 md:gap-8 text-brand-dark">
            <div className="relative pr-24 md:pr-0 text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui', fontWeight: 500 }}>
              <span className="block">
                {/* Keep line-height stable: icon is absolutely positioned within the line */}
                <span className="relative inline-block align-baseline pr-12 sm:pr-14 md:pr-20 lg:pr-24">
                  SMILE
                  <img
                    src={smileIcon}
                    alt="smile"
                    className="pointer-events-none select-none absolute top-1/2 -translate-y-1/2 right-0 w-10 sm:w-12 md:w-16 lg:w-20 h-auto"
                  />
                </span>
              </span>
              <span className="block text-brand-green">BRIGHTER</span>
              <span className="block">WITH US.</span>
              {/* Mobile-only CTA positioned to the right of the title */}
              <Link
                to="/booking"
                className="md:hidden absolute top-1/2 right-0 -translate-y-1/2 group inline-flex items-center gap-3 bg-brand-green text-white font-semibold text-base rounded-full pl-5 pr-6 py-3 shadow-card hover:shadow-lg transition-shadow"
              >
                <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-brand-green group-hover:translate-y-[-2px] transition-transform">
                  <ArrowUpRight className="w-5 h-5" />
                </span>
                Book Now
              </Link>
            </div>
            <div className="hidden md:flex flex-wrap gap-4 items-center">
              <Link
                to="/booking"
                className="group inline-flex items-center gap-3 bg-brand-green text-white font-semibold text-base md:text-lg rounded-full pl-6 pr-8 md:pl-8 md:pr-10 py-4 md:py-5 shadow-card hover:shadow-lg transition-shadow"
              >
                <span className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center text-brand-green group-hover:translate-y-[-2px] transition-transform">
                  <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />
                </span>
                Book Now
              </Link>
              <a
                href="tel:+919074530621"
                className="group inline-flex items-center gap-3 bg-white text-black font-semibold text-base md:text-lg rounded-full pl-6 pr-8 md:pl-8 md:pr-10 py-4 md:py-5 border border-gray-200 shadow-card hover:bg-gray-50 transition-colors hover:shadow-lg"
                aria-label="Call Us"
              >
                <span className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand-green flex items-center justify-center text-white group-hover:translate-y-[-2px] transition-transform">
                  <Phone className="w-5 h-5 md:w-6 md:h-6" />
                </span>
                Call Us
              </a>
            </div>
            {/* Desktop combined bar removed; Call Us now sits to the right of Book Now */}
            {/* Removed temporary mobile call row under title */}
          </div>

          {/* Image Card */}
          <div className="order-2 md:order-none md:col-span-4 relative">
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden aspect-[4/3] md:aspect-[3/4.494]">
              {/* Base image (current) */}
              <picture>
                <source media="(max-width: 767px)" srcSet={(slides[baseIndex] as any).imgMobile ?? slides[baseIndex].img} />
                <img src={slides[baseIndex].img} alt={slides[baseIndex].label} className="absolute inset-0 w-full h-full object-cover" />
              </picture>
              {/* Overlay image (next) with fade-in */}
        {overlayIndex !== null && (
                <picture>
                  <source media="(max-width: 767px)" srcSet={(slides[overlayIndex] as any).imgMobile ?? slides[overlayIndex].img} />
                  <img
                    src={slides[overlayIndex].img}
                    alt={slides[overlayIndex].label}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${animating ? 'opacity-100' : 'opacity-0'}`}
          style={{ opacity: animating ? 1 : 0 }}
                  />
                </picture>
              )}
              <div className="absolute left-4 bottom-4 select-none">
        <span className={`block text-white drop-shadow-sm text-xl md:text-3xl lg:text-3xl transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`} style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui', fontStyle: 'italic', fontWeight: 500 }}>
                  {overlayIndex !== null ? slides[overlayIndex].label : slides[baseIndex].label}
                </span>
              </div>
              <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 flex gap-2 md:gap-3 text-white/90">
                <button
                  onClick={prev}
                  aria-label="Previous"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/50 bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  aria-label="Next"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/50 bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Service Tiles Desktop (right column) */}
          <div className="hidden md:flex md:col-span-3 flex-col gap-6">
            <a
              className="relative rounded-3xl overflow-hidden h-48 block"
              href="#portfolio"
            >
              <img
                src={service1}
                className="absolute inset-0 w-full h-full object-cover"
                alt="Portfolio"
              />
              <div className="absolute left-4 bottom-4 select-none">
                <span className="block text-white drop-shadow-sm text-xl md:text-3xl lg:text-3xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui', fontStyle: 'italic', fontWeight: 500 }}>PORTFOLIO</span>
              </div>
            </a>
            <a
              className="relative rounded-3xl overflow-hidden h-48 block"
              href="#services"
            >
              <img
                src={service2}
                className="absolute inset-0 w-full h-full object-cover"
                alt="All Services"
              />
              <div className="absolute left-4 bottom-4 select-none">
                <span className="block text-white drop-shadow-sm text-xl md:text-3xl lg:text-3xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui', fontStyle: 'italic', fontWeight: 500 }}>SERVICES</span>
              </div>
            </a>
            <a
              className="relative rounded-3xl overflow-hidden h-48 block"
              href="#products"
            >
              <img
                src={service3}
                className="absolute inset-0 w-full h-full object-cover"
                alt="Our Products"
              />
              <div className="absolute left-4 bottom-4 leading-[1.05] select-none">
                <span className="block text-white drop-shadow-sm text-base md:text-xl lg:text-2xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui', fontStyle: 'italic', fontWeight: 300 }}>OUR</span>
                <span className="block text-white drop-shadow-sm text-xl md:text-3xl lg:text-3xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui', fontStyle: 'italic', fontWeight: 500 }}>PRODUCTS</span>
              </div>
            </a>
          </div>

          {/* Phone Bar: Mobile combined bar (desktop uses the same design under Book Now) */}
          <div className="order-3 md:order-none md:col-span-12 flex flex-col md:block">
      <div className="md:hidden mt-4 flex w-full rounded-xl overflow-hidden shadow-card text-sm font-semibold">
              <a
                href="tel:+919074530621"
        className="flex-1 bg-brand-green text-white px-4 py-4 text-center hover:opacity-95 text-base"
                aria-label="Call +91 90745 30621"
              >
        <span className="tracking-wide">+91 90745 30621</span>
              </a>
              <a
                href="tel:+919074530621"
                className="bg-white text-black px-6 py-4"
                aria-label="Call Us"
              >
                CALL NOW
              </a>
            </div>
          </div>

          {/* Mobile service tiles grid */}
          <div className="order-4 md:hidden grid grid-cols-2 gap-5 mt-4">
            <a
              href="#portfolio"
              className="relative rounded-2xl overflow-hidden h-40 block"
            >
              <img
                src={service1}
                alt="Portfolio"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute left-3 bottom-3 select-none">
                <span className="block text-white drop-shadow-sm text-xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui', fontStyle: 'italic', fontWeight: 500 }}>PORTFOLIO</span>
              </div>
            </a>
            <a
              href="#services"
              className="relative rounded-2xl overflow-hidden h-40 block"
            >
              <img
                src={service2}
                alt="All Services"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute left-3 bottom-3 select-none">
                <span className="block text-white drop-shadow-sm text-xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui', fontStyle: 'italic', fontWeight: 500 }}>SERVICES</span>
              </div>
            </a>
            <a
              href="#products"
              className="relative rounded-2xl overflow-hidden h-44 col-span-2 block"
            >
              <img
                src={service3}
                alt="Our Products"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute left-3 bottom-3 leading-[1.05] select-none">
                <span className="block text-white text-lg drop-shadow-sm" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui', fontStyle: 'italic', fontWeight: 300 }}>OUR</span>
                <span className="block text-white text-2xl drop-shadow-sm" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui', fontStyle: 'italic', fontWeight: 500 }}>PRODUCTS</span>
              </div>
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
  {/* Background overlay removed for white mobile background */}
    </header>
  );
};

export default Hero;
