import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import Hero from './sections/Hero';
import Intro from './sections/Intro';
import Services from './sections/Services';

const App: React.FC = () => {
  return (
    <div className="scroll-container">
      <Hero />
      <Intro />
      <Services />
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
