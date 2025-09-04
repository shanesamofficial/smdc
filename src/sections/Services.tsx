import React from 'react';
import BlurText from '../components/BlurText';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface ServiceItem {
  title: string;
  image: string;
}

// Local illustration (using one asset for all until individual ones are provided)
import heroImplant from '../assets/hero-implant.svg';
const services: ServiceItem[] = [
  { title: 'CLEANING', image: heroImplant },
  { title: 'ALIGNERS', image: heroImplant },
  { title: 'EXTRACTION', image: heroImplant },
  { title: 'IMPLANT', image: heroImplant },
  { title: 'DENTURES', image: heroImplant },
  { title: 'VENEERS', image: heroImplant },
  { title: 'ORTHODONTICS', image: heroImplant },
  { title: 'CHILD CARE', image: heroImplant },
];

const Services: React.FC = () => {
  const [ref, isInView] = useIntersectionObserver();

  return (
  <section ref={ref} id="services" className={`fullscreen-section section-card ${isInView ? 'in-view' : ''} relative bg-white text-brand-dark py-20 overflow-hidden`}>
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Desktop / tablet complex grid */}
        <div className={`stagger-animation ${isInView ? 'in-view' : ''} hidden md:grid grid-cols-3 gap-x-8 gap-y-12 justify-items-center`}>
          {/* Row 1: Cleaning, Aligners (tall), Extraction */}
          <div className="relative group w-[200px]">
            <div className="rounded-2xl overflow-hidden bg-gray-700 aspect-[3/2] flex items-center justify-center">
              <img src={services[0].image} alt={services[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-14px] min-w-[140px] bg-white text-black text-center font-semibold tracking-wide rounded-full py-3 text-sm shadow-card">
              {services[0].title}
            </div>
          </div>
          
          <div className="relative group w-[200px] row-span-2">
            <div className="rounded-2xl overflow-hidden bg-teal-200 aspect-[3/4] flex items-end justify-center p-6">
              <img src={services[1].image} alt={services[1].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-14px] min-w-[140px] bg-white text-black text-center font-semibold tracking-wide rounded-full py-3 text-sm shadow-card">
              {services[1].title}
            </div>
          </div>
          
          <div className="relative group w-[200px]">
            <div className="rounded-2xl overflow-hidden bg-pink-200 aspect-[3/2] flex items-center justify-center">
              <img src={services[2].image} alt={services[2].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-14px] min-w-[140px] bg-white text-black text-center font-semibold tracking-wide rounded-full py-3 text-sm shadow-card">
              {services[2].title}
            </div>
          </div>
          
          {/* Row 2: Implant, (Aligners continues), Dentures */}
          <div className="relative group w-[200px]">
            <div className="rounded-2xl overflow-hidden bg-blue-200 aspect-square flex items-center justify-center">
              <img src={services[3].image} alt={services[3].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-14px] min-w-[140px] bg-white text-black text-center font-semibold tracking-wide rounded-full py-3 text-sm shadow-card">
              {services[3].title}
            </div>
          </div>
          
          <div className="relative group w-[200px]">
            <div className="rounded-2xl overflow-hidden bg-pink-100 aspect-square flex items-center justify-center">
              <img src={services[4].image} alt={services[4].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-14px] min-w-[140px] bg-white text-black text-center font-semibold tracking-wide rounded-full py-3 text-sm shadow-card">
              {services[4].title}
            </div>
          </div>
          
          {/* Row 3: Veneers, Orthodontics, Child Care */}
          <div className="relative group w-[200px]">
            <div className="rounded-2xl overflow-hidden bg-red-200 aspect-square flex items-center justify-center">
              <img src={services[5].image} alt={services[5].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-14px] min-w-[140px] bg-white text-black text-center font-semibold tracking-wide rounded-full py-3 text-sm shadow-card">
              {services[5].title}
            </div>
          </div>
          
          <div className="relative group w-[200px]">
            <div className="rounded-2xl overflow-hidden bg-gray-600 aspect-square flex items-center justify-center">
              <img src={services[6].image} alt={services[6].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-14px] min-w-[140px] bg-white text-black text-center font-semibold tracking-wide rounded-full py-3 text-sm shadow-card">
              {services[6].title}
            </div>
          </div>
          
          <div className="relative group w-[200px]">
            <div className="rounded-2xl overflow-hidden bg-purple-200 aspect-square flex items-center justify-center">
              <img src={services[7].image} alt={services[7].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-14px] min-w-[140px] bg-white text-black text-center font-semibold tracking-wide rounded-full py-3 text-sm shadow-card">
              {services[7].title}
            </div>
          </div>
        </div>

        {/* Mobile title */}
        <div className="md:hidden mb-10 text-center">
          <div className="text-3xl font-extrabold tracking-tight">
            <BlurText
              text="Our Services"
              delay={70}
              animateBy="words"
              direction="top"
              className="inline-flex"
            />
          </div>
        </div>
        {/* Mobile simplified vertical list */}
        <div className={`md:hidden flex flex-col items-center gap-8 ${isInView ? 'in-view' : ''}`}>
          {services.map(s => (
            <div key={s.title} className="w-full max-w-[320px] rounded-2xl border border-gray-200 shadow-sm bg-white overflow-hidden flex flex-col items-center p-6">
              <div className="w-full aspect-square rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden mb-5">
                <img src={s.image} alt={s.title} className="w-3/4 h-3/4 object-contain" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide text-brand-dark">{s.title}</h3>
            </div>
          ))}
          <a href="#more-services" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-green">View All Services →</a>
        </div>
        {/* Desktop CTA */}
        <div className="hidden md:flex justify-center mt-16">
          <a href="#more-services" className="group inline-flex items-center gap-3 bg-brand-green text-white font-medium text-sm rounded-full pl-8 pr-10 py-4 shadow-card hover:shadow-lg transition-shadow">
            <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-green group-hover:translate-y-[-2px] transition-transform">→</span>
            Know More
          </a>
        </div>
      </div>
      {/* Vertical side heading */}
      <div className="hidden md:block absolute top-1/2 -translate-y-1/2 right-8 xl:right-16">
        <div className="text-5xl xl:text-6xl font-extrabold tracking-tight origin-center rotate-90 whitespace-nowrap">
          <BlurText
            text="OUR SERVICES"
            delay={90}
            animateBy="words"
            direction="top"
            className="text-brand-green"
          />
        </div>
      </div>
    </section>
  );
};

export default Services;
