import React from 'react';
import BlurText from '../components/BlurText';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

// Local doctor illustration asset (replace with real photo later if desired)
import doctorImg from '../assets/doctor.svg';

const Intro: React.FC = () => {
  const [ref, isInView] = useIntersectionObserver();

  return (
    <section ref={ref} id="about" className={`fullscreen-section section-card ${isInView ? 'in-view' : ''}`}>
      <div className="max-w-[1400px] mx-auto px-6 pt-8 pb-24">
      <div className="grid md:grid-cols-12 gap-12 items-start">
        {/* Image + badge */}
        <div className="md:col-span-6 relative">
          <div className="rounded-[48px] overflow-hidden shadow-card w-full max-w-[560px]">
            <img
              src={doctorImg}
              alt="Doctor"
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 md:left-[52%] md:-translate-x-0 bg-brand-green text-black rounded-2xl px-10 py-6 flex items-center gap-6 shadow-card">
            <div className="flex items-center justify-center w-20 h-20 bg-transparent rounded-xl border-4 border-black">
              {/* Simple smiley icon (SVG) */}
              <svg viewBox="0 0 64 64" className="w-14 h-14 stroke-black" fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="32" cy="32" r="28" />
                <path d="M20 38c3.2 4 8 6 12 6s8.8-2 12-6" />
                <circle cx="24" cy="26" r="3" fill="black" stroke="black" />
                <circle cx="40" cy="26" r="3" fill="black" stroke="black" />
              </svg>
            </div>
            <div>
              <p className="text-4xl font-extrabold leading-none">100+</p>
              <p className="text-sm tracking-wide font-medium mt-2">Happy Customers</p>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="md:col-span-6 max-w-prose md:pt-10">
          <p className="text-gray-800 leading-relaxed text-[15px] md:text-base">
            Your journey to a healthier, more confident smile begins here. During your consultation, we listen closely to your concerns, examine your oral health, and discuss tailored treatment options that suit your needs and lifestyle. Whether it’s a routine check-up or planning a smile transformation, we’re here to guide you every step of the way—with care, clarity, and compassion.
          </p>
        </div>
      </div>

        {/* Why heading */}
        <div className="mt-32 text-5xl md:text-6xl font-light tracking-tight">
          <BlurText
            text="Why Dr. Shawn's:"
            delay={120}
            animateBy="words"
            direction="bottom"
            className="inline-flex flex-wrap"
          />
        </div>
      </div>
    </section>
  );
};

export default Intro;
