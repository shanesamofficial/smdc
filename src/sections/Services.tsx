import React from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface ServiceItem {
  title: string;
  image: string;
}

// Placeholder images for services – replace with local assets when available.
const services: ServiceItem[] = [
  { title: 'CLEANING', image: 'https://via.placeholder.com/240x160.png?text=Cleaning' },
  { title: 'ALIGNERS', image: 'https://via.placeholder.com/240x340.png?text=Aligners' },
  { title: 'EXTRACTION', image: 'https://via.placeholder.com/240x160.png?text=Extraction' },
  { title: 'IMPLANT', image: 'https://via.placeholder.com/240x240.png?text=Implant' },
  { title: 'DENTURES', image: 'https://via.placeholder.com/240x240.png?text=Dentures' },
  { title: 'VENEERS', image: 'https://via.placeholder.com/240x240.png?text=Veneers' },
  { title: 'ORTHODONTICS', image: 'https://via.placeholder.com/240x240.png?text=Ortho' },
  { title: 'CHILD CARE', image: 'https://via.placeholder.com/240x240.png?text=Child+Care' },
];

const Services: React.FC = () => {
  const [ref, isInView] = useIntersectionObserver();

  return (
    <section ref={ref} id="services" className={`fullscreen-section section-card ${isInView ? 'in-view' : ''} relative bg-black text-white py-20 overflow-hidden`}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className={`stagger-animation ${isInView ? 'in-view' : ''} grid grid-cols-3 gap-x-8 gap-y-12 justify-items-center`}>
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
        <div className="flex justify-center mt-16">
          <a href="#more-services" className="group inline-flex items-center gap-3 bg-brand-green text-white font-medium text-sm rounded-full pl-8 pr-10 py-4 shadow-card hover:shadow-lg transition-shadow">
            <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-green group-hover:translate-y-[-2px] transition-transform">→</span>
            Know More
          </a>
        </div>
      </div>
      {/* Vertical side heading */}
      <div className="absolute top-1/2 -translate-y-1/2 right-8 xl:right-16">
        <h2 className="text-5xl xl:text-6xl font-extrabold tracking-tight origin-center rotate-90 whitespace-nowrap">
          <span className="text-brand-green">OUR SERVICES</span>
        </h2>
      </div>
    </section>
  );
};

export default Services;
