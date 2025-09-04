import React from 'react';
import BlurText from '../components/BlurText';
import SiteNav from '../components/SiteNav';

interface CaseItem { id:number; title:string; description:string; image:string; }
const cases: CaseItem[] = Array.from({length:6}).map((_,i)=>({
  id:i+1,
  title:`Case ${i+1}`,
  description:'Illustrative result description. Replace with real before/after narrative explaining approach and outcome.',
  image:`https://source.unsplash.com/600x40${i}/?dental,smile`
}));

const Portfolio: React.FC = () => {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <SiteNav />
      <section className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-10 py-14">
        <div className="text-4xl font-extrabold tracking-tight mb-10">
          <BlurText text="Portfolio" delay={90} animateBy="chars" direction="top" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {cases.map(c=> (
            <div key={c.id} className="group rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition flex flex-col">
              <div className="aspect-video overflow-hidden bg-gray-100">
                <img src={c.image} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold mb-2 text-brand-dark">{c.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">{c.description}</p>
                <button className="mt-4 inline-flex text-sm font-medium text-brand-green hover:underline">View Details →</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <footer className="py-6 text-center text-xs text-gray-500">© {new Date().getFullYear()} Dr. Shawn's. All rights reserved.</footer>
    </main>
  );
};

export default Portfolio;
