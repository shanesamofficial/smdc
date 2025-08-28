import React from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

// Temporary placeholder images (replace with actual assets: hero.jpg, service1.jpg, service2.jpg, service3.jpg)
const heroImg = 'https://via.placeholder.com/800x1000.png?text=Hero+Image';
const service1 = 'https://via.placeholder.com/400x300.png?text=Portfolio';
const service2 = 'https://via.placeholder.com/400x300.png?text=Services';
const service3 = 'https://via.placeholder.com/400x300.png?text=Products';

const Hero: React.FC = () => {
  const [ref, isInView] = useIntersectionObserver();

  return (
    <header ref={ref} className={`fullscreen-section section-card ${isInView ? 'in-view' : ''}`}>
      <div className="max-w-[1400px] mx-auto px-6 pt-8 pb-16 grid grid-cols-12 gap-10">
        <nav className="col-span-12 flex items-center gap-12 mb-6">
          <span className="text-lg font-semibold text-brand-dark italic">Dr. Shawn's</span>
          <a href="#about" className="text-sm tracking-wide font-medium text-gray-700 hover:text-brand-green transition-colors">ABOUT</a>
        </nav>

        <div className="col-span-12 md:col-span-5 flex flex-col gap-8">
          <h1 className="text-6xl leading-[1.05] font-extrabold tracking-tight">
            <span className="block">SMILE</span>
            <span className="block text-brand-green">BRIGHTER</span>
            <span className="block">WITH US</span>
          </h1>

          <div className="flex flex-wrap gap-6 items-center">
            <a href="#book" className="group inline-flex items-center gap-3 bg-brand-green text-white font-semibold text-lg rounded-full pl-8 pr-10 py-5 shadow-card hover:shadow-lg transition-shadow">
              <span className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-brand-green group-hover:translate-y-[-2px] transition-transform"><ArrowUpRight className="w-6 h-6" /></span>
              Book Now
            </a>
          </div>

          <div className="flex items-stretch gap-6 pt-4">
            <div className="bg-brand-green text-white rounded-md px-8 py-8 flex items-center justify-center text-2xl font-semibold shadow-card min-w-[320px]">+91-9074530621</div>
            <div className="flex-1 bg-white rounded-md border border-gray-200 shadow-card px-8 py-8 text-xl font-semibold flex items-center">Call Us</div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 relative">
          <div className="relative rounded-3xl bg-[#9DC9BD] overflow-hidden aspect-[4/5] flex items-end justify-center">
            <img src={heroImg} alt="Whitening" className="h-full object-cover" />
            <span className="absolute top-6 left-8 text-white/90 tracking-wide text-sm font-medium">WHITENING</span>
            <div className="absolute bottom-4 right-4 flex gap-3 text-white/70">
              <button aria-label="Previous" className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center hover:bg-white/20"><ChevronLeft /></button>
              <button aria-label="Next" className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center hover:bg-white/20"><ChevronRight /></button>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-3 flex flex-col gap-6">
          <a className="relative rounded-3xl overflow-hidden h-48 group bg-brand-dark text-white flex items-end p-6" href="#portfolio">
            <img src={service1} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform" alt="Portfolio" />
            <span className="relative z-10 text-2xl font-semibold leading-6 max-w-[8ch]">PORTFOLIO</span>
          </a>
          <a className="relative rounded-3xl overflow-hidden h-48 group bg-gray-200 flex items-end p-6" href="#services">
            <img src={service2} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform" alt="All Services" />
            <span className="relative z-10 text-2xl font-semibold leading-6 max-w-[9ch] text-white drop-shadow">ALL SERVICES</span>
          </a>
          <a className="relative rounded-3xl overflow-hidden h-48 group bg-gray-200 flex items-end p-6" href="#products">
            <img src={service3} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform" alt="Our Products" />
            <span className="relative z-10 text-2xl font-semibold leading-6 max-w-[9ch] text-white drop-shadow">OUR PRODUCTS</span>
          </a>
        </div>
      </div>
    </header>
  );
};

export default Hero;
