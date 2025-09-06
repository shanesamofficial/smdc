import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const Loader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={className ?? 'flex items-center justify-center py-8'}>
    <div className="w-24 h-24">
      <DotLottieReact
        src="https://lottie.host/23f18188-1aa0-4eb0-b042-4210de165f26/UBn0Kh3JVc.lottie"
        loop
        autoplay
      />
    </div>
  </div>
);

export default Loader;
