import React from 'react';
import BlurText from '../components/BlurText';
import { Mail, Phone, MapPin } from 'lucide-react';
import SiteNav from '../components/SiteNav';
import Footer from '../components/Footer';

const Contact: React.FC = () => {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <SiteNav />
      <section className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-10 pt-24 md:pt-28 pb-12 grid md:grid-cols-2 gap-12">
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
            src="https://www.google.com/maps?q=1st%20Floor%2C%20Opera%20Building%2C%20Above%20Akshaya%20Centre%2C%20Kambalakkad%20Main%20Road%2C%20Wayanad%2C%20Kerala%20-%20673122&output=embed"
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
