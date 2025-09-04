import React, { useEffect, useRef, useState } from 'react';
import SiteNav from '../components/SiteNav';
import BlurText from '../components/BlurText';
import Footer from '../components/Footer';
import aboutImg from '../assets/about.jpeg';

interface ValueItem { title:string; body:string; }
interface TeamMember { name:string; role:string; tagline:string; image:string; }

const values: ValueItem[] = [
  { title: 'COMPASSION', body: 'We treat every patient with care, empathy, and respect.' },
  { title: 'INNOVATION', body: 'We use the latest dental technology and techniques for safer, faster, and more comfortable treatments.' },
  { title: 'EXCELLENCE', body: 'We aim for the highest standards in every procedure — from a simple cleaning to complex orthodontics.' },
  { title: 'RESULTS', body: 'Your confident smile is our ultimate measure of success.' },
  { title: 'TRUST', body: 'We believe in honest communication, transparency, and building lifelong relationships with our patients.' },
  { title: 'EMPATHY', body: 'We understand your world.' },
];

const team: TeamMember[] = [
  { name:'Dr. Shawn Sam', role:'Chief Dental Surgeon', tagline:'TURNING DENTAL CARE INTO SMILE ART', image:'/team/shawn.jpg' },
  { name:'Dr. Anoop Jacob', role:'PEDODONTIST', tagline:'GENTLE CARE FOR LITTLE SMILES', image:'/team/anoop.jpg' },
  { name:'Dr. Roshan Augustin Benny', role:'ENDODONTIST', tagline:'ROOT OF EVERY STRONG SMILE', image:'/team/roshan.jpg' },
  { name:'Dr. Rakhil S', role:'ORAL & MAXILLOFACIAL SURGEON', tagline:'WHERE PRECISION MEETS CONFIDENCE', image:'/team/rakhil.jpg' },
  { name:'Dr. Sangeetha', role:'ENDODONTIST', tagline:'The architect of SAVING TOOTH', image:'/team/sangeetha.jpg' },
  { name:'Dr. RAJ KAMAL', role:'ORTHODONTIST', tagline:'ALIGNER OF CONFIDENT SMILES', image:'/team/rajkamal.jpg' },
];

const About: React.FC = () => {
  return (
  <main className="min-h-screen flex flex-col bg-white">
      <SiteNav />
      <section className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-10 pt-24 md:pt-28 pb-16 space-y-24">
  {/* Our Story */}
        <div className="space-y-8">
          <div className="text-4xl md:text-5xl font-extrabold tracking-tight">
            <BlurText text="OUR STORY" delay={70} animateBy="words" direction="top" />
          </div>
            <div className="text-2xl md:text-4xl font-bold leading-tight">
              <BlurText text="CREATING SMILES" delay={120} animateBy="words" direction="bottom" />
              <BlurText text="CREATING HAPPINESS" delay={140} animateBy="words" direction="bottom" className="mt-2" />
            </div>
          <p className="text-gray-700 leading-relaxed max-w-3xl text-[15px] md:text-base">We believe every smile tells a story — and our mission is to make yours brighter, healthier, and more confident.</p>
        </div>

  {/* Overlapping Scroll Zoom Image */}
  <ZoomImage />

        {/* Values */}
        <div className="space-y-12">
          <div className="text-4xl md:text-5xl font-extrabold tracking-tight">
            <BlurText text="OUR VALUES" delay={80} animateBy="words" direction="top" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map(v => (
              <div key={v.title} className="group relative p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-brand-green/10 to-transparent pointer-events-none" />
                <h3 className="font-semibold mb-3 text-brand-dark tracking-wide">{v.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="space-y-12">
          <div className="text-4xl md:text-5xl font-extrabold tracking-tight">
            <BlurText text="OUR TEAM" delay={80} animateBy="words" direction="top" />
          </div>
          <p className="text-gray-700 leading-relaxed max-w-4xl text-[15px] md:text-base">At Dr. Shawn’s Multispeciality Dental Clinic, our team is more than just doctors and staff — we are partners in your smile journey. From highly skilled dentists and orthodontists to caring dental assistants and front-office staff, each member is dedicated to making your visit comfortable, stress-free, and effective.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {team.map(m => (
              <div key={m.name} className="flex flex-col rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-lg transition">
                <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img src={m.image} alt={m.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-6 flex flex-col gap-2">
                  <p className="text-xs font-semibold tracking-wide text-brand-green">{m.tagline}</p>
                  <h3 className="text-lg font-semibold text-brand-dark">{m.name}</h3>
                  <p className="text-xs font-medium text-gray-600">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
  <Footer />
    </main>
  );
};

export default About;

// --- Scroll Zoom Image Inline Component ---
const ZoomImage: React.FC = () => {
  const imgRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0); // 0..1 visibility progress

  useEffect(() => {
    const handle = () => {
      if (!imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // When center of element reaches middle of viewport => progress 1
      const center = rect.top + rect.height / 2;
      const raw = 1 - center / vh; // ~ increases as we scroll past
      const clamped = Math.min(Math.max(raw, 0), 1);
      setProgress(clamped);
    };
    handle();
    window.addEventListener('scroll', handle, { passive: true });
    window.addEventListener('resize', handle);
    return () => { window.removeEventListener('scroll', handle); window.removeEventListener('resize', handle); };
  }, []);

  const scale = 1 + progress * 0.18; // up to ~1.18x
  const translateY = -progress * 40; // lift slightly as it zooms

  return (
    <div className="relative -mt-10 md:-mt-24 mb-10 md:mb-20 z-[5]" aria-hidden>
      <div
        ref={imgRef}
        className="relative mx-auto w-full max-w-5xl aspect-[16/8] md:aspect-[16/6] rounded-[40px] overflow-hidden shadow-2xl ring-1 ring-black/5 bg-gray-200"
        style={{ transform: `translateY(${translateY}px) scale(${scale})`, transition: 'transform 0.05s linear', willChange: 'transform' }}
      >
        <img
          src={aboutImg}
          alt="Clinic montage"
          className="w-full h-full object-cover select-none pointer-events-none"
          loading="lazy"
        />
        {/* Soft gradient top to blend overlap */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-transparent to-white/10 pointer-events-none" />
      </div>
    </div>
  );
};
