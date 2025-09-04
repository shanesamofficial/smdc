import React from 'react';
import { Link } from 'react-router-dom';
import BlurText from '../components/BlurText';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface Testimonial {
  quote: string;
  author: string;
  role?: string;
}

const testimonials: Testimonial[] = [
  {
    quote: 'Dr. Shawn\'s team made me feel completely at ease. The treatment was painless and the results are amazing!',
    author: 'Anjali M.',
    role: 'Root Canal & Crown'
  },
  {
    quote: 'Clear, honest guidance and modern technology. I finally love my smile again.',
    author: 'Rahul S.',
    role: 'Aligner Therapy'
  },
  {
    quote: 'Professional, caring and detail-oriented. The follow-up care was exceptional.',
    author: 'Deepa K.',
    role: 'Implant Rehabilitation'
  },
  {
    quote: 'Clean clinic, friendly staff, and they explained every step. Highly recommended.',
    author: 'Mohammed A.',
    role: 'Full Mouth Cleaning'
  }
];

const Testimonials: React.FC = () => {
  const [ref, inView] = useIntersectionObserver();

  return (
    <section ref={ref} id="testimonials" className={`fullscreen-section section-card ${inView ? 'in-view' : ''} bg-white relative py-24`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-[11px] tracking-[0.25em] font-medium text-brand-green mb-3">PATIENT STORIES</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            <BlurText text="Smiles We Helped Shape" delay={90} animateBy="words" direction="top" />
          </h2>
        </div>
        <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 transition-opacity duration-700 ${inView ? 'opacity-100' : 'opacity-0'}`}>
          {testimonials.map((t, i) => (
            <div key={i} className="relative group bg-white border border-gray-200 rounded-3xl p-7 shadow-card hover:shadow-lg transition-shadow flex flex-col">
              <div className="absolute -top-5 left-6 w-10 h-10 rounded-2xl bg-brand-green text-black font-bold flex items-center justify-center shadow">“</div>
              <p className="mt-4 text-sm leading-relaxed text-gray-700 flex-1">{t.quote}</p>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-brand-dark">{t.author}</p>
                {t.role && <p className="text-[11px] tracking-wide text-gray-500 mt-1">{t.role}</p>}
              </div>
            </div>
          ))}
          {/* Accent card */}
          <div className="relative bg-brand-green rounded-3xl p-8 flex flex-col justify-between shadow-card md:col-span-2 lg:col-span-1">
            <div>
              <h3 className="text-black text-2xl font-extrabold leading-tight mb-4">Comfort. Clarity. Care.</h3>
              <p className="text-sm text-black/80 leading-relaxed">Every treatment plan is personalised—whether a simple filling or a full smile rehabilitation. Your comfort and long-term oral health guide every decision.</p>
            </div>
                        <Link to="/booking" className="mt-8 inline-flex items-center bg-black text-white rounded-full px-6 py-3 text-sm font-semibold shadow hover:shadow-md transition-shadow">Book Your Visit →</Link>
          </div>
        </div>
      </div>
      <div className="hidden md:block absolute top-1/2 -translate-y-1/2 left-8 xl:left-16 rotate-[-90deg] origin-left">
        <div className="text-5xl font-extrabold tracking-tight text-brand-green whitespace-nowrap">
          <BlurText text="TESTIMONIALS" delay={120} animateBy="words" direction="bottom" />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
