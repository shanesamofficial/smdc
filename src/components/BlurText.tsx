import { motion } from 'motion/react';
import React, { useEffect, useRef, useState, useMemo } from 'react';

type EasingFn = (t: number) => number;

interface BlurTextProps {
  text: string;
  delay?: number; // ms between each segment start
  className?: string;
  animateBy?: 'words' | 'chars';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Record<string, any>;
  animationTo?: Record<string, any>[];
  easing?: EasingFn;
  onAnimationComplete?: () => void;
  stepDuration?: number; // seconds per step
}

const buildKeyframes = (from: Record<string, any>, steps: Record<string, any>[]) => {
  const keys = new Set([...Object.keys(from), ...steps.flatMap(s => Object.keys(s))]);
  const keyframes: Record<string, any[]> = {};
  keys.forEach(k => { keyframes[k] = [from[k], ...steps.map(s => s[k])]; });
  return keyframes;
};

const BlurText: React.FC<BlurTextProps> = ({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  // Default easing changed to a gentle ease-in cubic for smoother entry
  easing = (t) => t * t * t,
  onAnimationComplete,
  stepDuration = 0.35
}) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.unobserve(entry.target);
      }
    }, { threshold, rootMargin });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  // Reduced blur & travel distance for a subtler effect
  const defaultFrom = useMemo(() => direction === 'top'
    ? { filter: 'blur(6px)', opacity: 0, y: -30, scale: 0.985 }
    : { filter: 'blur(6px)', opacity: 0, y: 30, scale: 0.985 }, [direction]);

  const defaultTo = useMemo(() => [
    { filter: 'blur(3px)', opacity: 0.55, y: direction === 'top' ? 6 : -6, scale: 0.995 },
    { filter: 'blur(0px)', opacity: 1, y: 0, scale: 1 }
  ], [direction]);

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;
  const stepCount = toSnapshots.length + 1;
  const times = Array.from({ length: stepCount }, (_, i) => stepCount === 1 ? 0 : i / (stepCount - 1));
  const totalDuration = stepCount > 1 ? stepCount * (stepDuration / (stepCount - 1)) : stepDuration;

  return (
    <p ref={ref} className={className} style={{ display: 'flex', flexWrap: 'wrap' }}>
      {elements.map((segment, index) => {
        const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);
        const spanTransition: any = { duration: totalDuration, times, delay: (index * delay) / 1000 };
        spanTransition.ease = easing;
        return (
          <motion.span
            className="inline-block will-change-[transform,filter,opacity]"
            key={index}
            initial={fromSnapshot}
            animate={inView ? animateKeyframes : fromSnapshot}
            transition={spanTransition}
            onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
          >
            {segment === ' ' ? '\u00A0' : segment}
            {animateBy === 'words' && index < elements.length - 1 && '\u00A0'}
          </motion.span>
        );
      })}
    </p>
  );
};

export default BlurText;