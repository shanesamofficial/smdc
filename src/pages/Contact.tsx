import React from 'react';
import BlurText from '../components/BlurText';
import { Mail, Phone, MapPin } from 'lucide-react';
import SiteNav from '../components/SiteNav';
import Footer from '../components/Footer';

const Contact: React.FC = () => {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <SiteNav />
  <section className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-10 pt-16 md:pt-20 pb-12 grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="text-4xl font-extrabold tracking-tight">
            <BlurText text="CONTACT" delay={70} animateBy="chars" direction="top" />
          </div>
          <div className="space-y-4 text-[15px] leading-relaxed">
            <p className="flex items-start gap-3"><Mail className="w-5 h-5 text-brand-green mt-0.5" /> <span>drsmdcofficial@gmail.com</span></p>
            <p className="flex items-start gap-3"><Phone className="w-5 h-5 text-brand-green mt-0.5" /> <span>+91-9074530621</span></p>
            <p className="flex items-start gap-3"><MapPin className="w-5 h-5 text-brand-green mt-0.5" /> <span>1st Floor, Opera Building<br/>Above Akshaya Centre<br/>Kambalakkad Main Road<br/>Wayanad, Kerala - 673122</span></p>
          </div>
          <div className="bg-brand-green/10 border border-brand-green/30 rounded-xl p-6 text-sm text-gray-700">
            <p><strong className="text-brand-green">Dr. Shawn Sam</strong><br/>For appointments or queries, reach out via phone or email. We'll respond promptly.</p>
          </div>
        </div>
        <div className="h-[380px] md:h-full rounded-2xl overflow-hidden shadow-card min-h-[300px]">
          <iframe
            title="Clinic Location"
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3907.2946313331554!2d76.07474817622206!3d11.673519288535125!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba67584f0a18c2d%3A0xa7a09f1c1ef8620a!2sDr.%20Shawn&#39;s%20Multispecialty%20Dental%20Clinic!5e0!3m2!1sen!2sin!4v1757144816071!5m2!1sen!2sin"
            allowFullScreen
          ></iframe>
        </div>
        <div className="mt-3">
          <a
            href="https://share.google/TFRkdg6cKJaDMn7ut"
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-brand-green text-white rounded-full px-4 py-2 text-sm font-medium"
          >
            Open in Google Maps
          </a>
        </div>
      </section>
  <Footer />
    </main>
  );
};

export default Contact;
