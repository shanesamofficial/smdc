import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 grid gap-10 md:grid-cols-4 text-sm">
        <div className="space-y-3">
          <h3 className="text-base font-semibold tracking-tight text-brand-dark">Dr. Shawn's</h3>
          <p className="text-gray-600 leading-relaxed text-[13px] max-w-[28ch]">Patient‑centered multi‑speciality dental care focused on precision, comfort and lasting smiles.</p>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-semibold tracking-wide text-gray-500">CONTACT</h4>
          <ul className="space-y-2">
            <li className="flex items-start gap-2"><Mail className="w-4 h-4 text-brand-green mt-0.5" /><span>drsmdcofficial@gmail.com</span></li>
            <li className="flex items-start gap-2"><Phone className="w-4 h-4 text-brand-green mt-0.5" /><span>+91-9074530621</span></li>
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-brand-green mt-0.5" /><span className="leading-snug">1st Floor, Opera Building<br/>Kambalakkad Main Road<br/>Wayanad, Kerala - 673122</span></li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-semibold tracking-wide text-gray-500">QUICK LINKS</h4>
          <ul className="space-y-2 text-[13px]">
            <li><a href="/about" className="hover:text-brand-green">About</a></li>
            <li><a href="/services" className="hover:text-brand-green">Services</a></li>
            <li><a href="/portfolio" className="hover:text-brand-green">Portfolio</a></li>
            <li><a href="/contact" className="hover:text-brand-green">Contact</a></li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-semibold tracking-wide text-gray-500">HOURS</h4>
          <p className="text-[13px] text-gray-600 leading-relaxed">Mon - Sat: 9:00 AM – 6:30 PM<br/>Sunday: By Appointment</p>
          <div className="pt-2"><a href="/booking" className="inline-block bg-brand-green text-white rounded-full px-5 py-2 text-xs font-semibold shadow-sm hover:shadow-md">Book Now</a></div>
        </div>
      </div>
      <div className="border-t border-gray-200 text-[11px] tracking-wide text-gray-500 py-4 text-center">
        © {year} Dr. Shawn's. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;