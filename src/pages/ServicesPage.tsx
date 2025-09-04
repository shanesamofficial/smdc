import React from 'react';
import SiteNav from '../components/SiteNav';
import Footer from '../components/Footer';
import BlurText from '../components/BlurText';
import heroImplant from '../assets/hero-implant.svg';

interface ServiceItem { title:string; blurb:string; image:string; }

const services: ServiceItem[] = [
  { title:'CLEANING', blurb:'Professional oral prophylaxis to remove plaque, tartar and stains while protecting enamel.', image: heroImplant },
  { title:'ALIGNERS', blurb:'Clear orthodontic alignment systems for discreet tooth movement and improved bite.', image: heroImplant },
  { title:'EXTRACTION', blurb:'Safe, minimally traumatic removal procedures with focus on fast healing.', image: heroImplant },
  { title:'IMPLANT', blurb:'Titanium / zirconia implant solutions restoring function and aesthetics permanently.', image: heroImplant },
  { title:'DENTURES', blurb:'Precision partial & complete dentures engineered for comfort, stability and natural look.', image: heroImplant },
  { title:'VENEERS', blurb:'Ultra-thin ceramic laminates to enhance shape, colour and symmetry of visible teeth.', image: heroImplant },
  { title:'ORTHODONTICS', blurb:'Comprehensive fixed & growth-modulation therapies for alignment and jaw harmony.', image: heroImplant },
  { title:'CHILD CARE', blurb:'Gentle paediatric dentistry: prevention, habit correction, and early orthodontic guidance.', image: heroImplant },
];

const ServicesPage: React.FC = () => {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <SiteNav />
      <section className="w-full max-w-7xl mx-auto px-6 md:px-10 pt-14 pb-8 md:pb-20 flex flex-col gap-14">
        <header className="space-y-6">
          <div className="text-4xl md:text-5xl font-extrabold tracking-tight">
            <BlurText text="Our Services" delay={70} animateBy="words" direction="top" />
          </div>
          <p className="max-w-3xl text-[15px] md:text-base text-gray-700 leading-relaxed">We combine precision dentistry, advanced biomaterials and patient‑focused protocols to deliver predictable clinical outcomes with long-term comfort and aesthetics. Explore our core treatment categories below—each tailored to individual needs following thorough diagnosis and transparent planning.</p>
        </header>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {services.map(s => (
            <div key={s.title} className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                <img src={s.image} alt={s.title} className="w-2/3 h-2/3 object-contain group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex flex-col gap-3">
                <h3 className="text-sm font-semibold tracking-wide text-brand-dark">{s.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{s.blurb}</p>
                <button className="self-start mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand-green hover:underline">Learn More →</button>
              </div>
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-brand-green/5 to-transparent" />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="rounded-2xl border border-brand-green/30 bg-brand-green/10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1 space-y-2">
              <h4 className="text-base font-semibold text-brand-dark">Need a personalized treatment plan?</h4>
              <p className="text-sm text-gray-700 leading-relaxed">Schedule a detailed consultation—digital diagnostics & smile assessment included. We’ll map phased care aligned with your comfort, timeline and goals.</p>
            </div>
            <a href="/booking" className="inline-flex items-center gap-2 bg-brand-green text-white rounded-full px-6 py-3 text-sm font-semibold shadow-card hover:shadow-lg transition">Book Now →</a>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default ServicesPage;