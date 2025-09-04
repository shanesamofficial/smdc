import React from 'react';
import './logoloop.css';

// Lightweight wrapper using provided LogoLoop implementation logic (simplified import path assumption)
export interface LogoItemNode { node: React.ReactNode; title: string; href?: string; ariaLabel?: string; }
export interface LogoItemImg { src: string; alt: string; href?: string; title?: string; }
export type LogoItem = LogoItemNode | LogoItemImg;

// The animation component code (trimmed for brevity, original logic kept)
import { LogoLoop as BaseLogoLoop } from '../vendor/LogoLoopBase';

const partnerLogos: LogoItemImg[] = [
  { src: '/logos/dentcare.svg', alt: 'DentCare', href: '#', title: 'DentCare' },
  { src: '/logos/denco.svg', alt: 'DenCo', href: '#', title: 'DenCo' },
  { src: '/logos/illusion.svg', alt: 'ILLUSION', href: '#', title: 'ILLUSION' },
  { src: '/logos/dezone.svg', alt: 'DeZone', href: '#', title: 'DeZone' },
  { src: '/logos/maxima.svg', alt: 'Maxima', href: '#', title: 'Maxima' }
];

const LogoShowcase: React.FC = () => {
  return (
    <div className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-[11px] tracking-[0.2em] font-medium text-gray-500 mb-3">AMONG OUR CLIENTS</p>
        <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight mb-10">PROUD TO WORK WITH</h2>
        <div style={{ height: 120 }} className="relative">
          <BaseLogoLoop
            logos={partnerLogos}
            speed={120}
            direction="left"
            logoHeight={48}
            gap={56}
            pauseOnHover
            scaleOnHover
            fadeOut
            fadeOutColor="#ffffff"
            ariaLabel="Partner logos"
          />
        </div>
      </div>
    </div>
  );
};

export default LogoShowcase;
