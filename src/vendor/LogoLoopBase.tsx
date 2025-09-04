import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import '../components/logoloop.css';

const ANIMATION_CONFIG = { SMOOTH_TAU: 0.25, MIN_COPIES: 2, COPY_HEADROOM: 2 };
const toCssLength = (value: any) => (typeof value === 'number' ? `${value}px` : (value ?? undefined));

const useResizeObserver = (callback: () => void, elements: any[], dependencies: any[]) => {
  useEffect(() => {
    if (!(window as any).ResizeObserver) {
      const handleResize = () => callback();
      window.addEventListener('resize', handleResize);
      callback();
      return () => window.removeEventListener('resize', handleResize);
    }
    const observers = elements.map(ref => {
      if (!ref.current) return null;
      const observer = new (window as any).ResizeObserver(callback);
      observer.observe(ref.current);
      return observer;
    });
    callback();
    return () => { observers.forEach((o: any) => o?.disconnect()); };
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps
};

const useImageLoader = (seqRef: any, onLoad: () => void, dependencies: any[]) => {
  useEffect(() => {
    const images = seqRef.current?.querySelectorAll('img') ?? [];
    if (images.length === 0) { onLoad(); return; }
    let remaining = images.length;
    const handle = () => { remaining -= 1; if (remaining === 0) onLoad(); };
    images.forEach((img: any) => {
      if (img.complete) handle(); else {
        img.addEventListener('load', handle, { once: true });
        img.addEventListener('error', handle, { once: true });
      }
    });
    return () => images.forEach((img: any) => { img.removeEventListener('load', handle); img.removeEventListener('error', handle); });
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps
};

const useAnimationLoop = (trackRef: any, targetVelocity: number, seqWidth: number, isHovered: boolean, pauseOnHover: boolean) => {
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  useEffect(() => {
    const track = trackRef.current; if (!track) return;
    if (seqWidth > 0) {
      offsetRef.current = ((offsetRef.current % seqWidth) + seqWidth) % seqWidth;
      track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
    }
    const animate = (ts: number) => {
      if (lastTs.current === null) lastTs.current = ts;
      const dt = Math.max(0, ts - lastTs.current) / 1000; lastTs.current = ts;
      const target = (pauseOnHover && isHovered) ? 0 : targetVelocity;
      const easing = 1 - Math.exp(-dt / ANIMATION_CONFIG.SMOOTH_TAU);
      velocityRef.current += (target - velocityRef.current) * easing;
      if (seqWidth > 0) {
        let next = offsetRef.current + velocityRef.current * dt;
        next = ((next % seqWidth) + seqWidth) % seqWidth;
        offsetRef.current = next;
        track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); lastTs.current = null; };
  }, [targetVelocity, seqWidth, isHovered, pauseOnHover, trackRef]);
};

export const LogoLoop = memo(({
  logos,
  speed = 120,
  direction = 'left',
  width = '100%',
  logoHeight = 28,
  gap = 32,
  pauseOnHover = true,
  fadeOut = false,
  fadeOutColor,
  scaleOnHover = false,
  ariaLabel = 'Partner logos',
  className,
  style
}: any) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const seqRef = useRef<HTMLUListElement | null>(null);
  const [seqWidth, setSeqWidth] = useState(0);
  const [copyCount, setCopyCount] = useState(ANIMATION_CONFIG.MIN_COPIES);
  const [hover, setHover] = useState(false);
  const targetVelocity = useMemo(() => {
    const mag = Math.abs(speed); const dirMul = direction === 'left' ? 1 : -1; const spMul = speed < 0 ? -1 : 1; return mag * dirMul * spMul;
  }, [speed, direction]);
  const updateDimensions = useCallback(() => {
    const containerWidth = containerRef.current?.clientWidth ?? 0;
    const sequenceWidth = seqRef.current?.getBoundingClientRect?.()?.width ?? 0;
    if (sequenceWidth > 0) {
      setSeqWidth(Math.ceil(sequenceWidth));
      const copiesNeeded = Math.ceil(containerWidth / sequenceWidth) + ANIMATION_CONFIG.COPY_HEADROOM;
      setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded));
    }
  }, []);
  useResizeObserver(updateDimensions, [containerRef, seqRef], [logos, gap, logoHeight]);
  useImageLoader(seqRef, updateDimensions, [logos, gap, logoHeight]);
  useAnimationLoop(trackRef, targetVelocity, seqWidth, hover, pauseOnHover);
  const cssVars = useMemo(() => ({ '--logoloop-gap': `${gap}px`, '--logoloop-logoHeight': `${logoHeight}px`, ...(fadeOutColor && { '--logoloop-fadeColor': fadeOutColor }) }), [gap, logoHeight, fadeOutColor]);
  const rootClass = useMemo(() => ['logoloop', fadeOut && 'logoloop--fade', scaleOnHover && 'logoloop--scale-hover', className].filter(Boolean).join(' '), [fadeOut, scaleOnHover, className]);
  const onEnter = useCallback(() => { if (pauseOnHover) setHover(true); }, [pauseOnHover]);
  const onLeave = useCallback(() => { if (pauseOnHover) setHover(false); }, [pauseOnHover]);
  const renderLogoItem = useCallback((item: any, key: string) => {
    const isNode = 'node' in item;
    const content = isNode ? <span className="logoloop__node" aria-hidden={!!item.href && !item.ariaLabel}>{item.node}</span> : (
      <img src={item.src} alt={item.alt ?? ''} title={item.title} loading="lazy" decoding="async" draggable={false} />
    );
    const aria = isNode ? (item.ariaLabel ?? item.title) : (item.alt ?? item.title);
    const inner = item.href ? <a className="logoloop__link" href={item.href} aria-label={aria || 'logo link'} target="_blank" rel="noreferrer noopener">{content}</a> : content;
    return <li className="logoloop__item" key={key} role="listitem">{inner}</li>;
  }, []);
  const lists = useMemo(() => Array.from({ length: copyCount }, (_, i) => (
    <ul className="logoloop__list" key={`copy-${i}`} role="list" aria-hidden={i>0} ref={i===0?seqRef:undefined}>
      {logos.map((itm: any, idx: number) => renderLogoItem(itm, `${i}-${idx}`))}
    </ul>
  )), [copyCount, logos, renderLogoItem]);
  const containerStyle = useMemo(() => ({ width: toCssLength(width) ?? '100%', ...cssVars, ...style }), [width, cssVars, style]);
  return (
    <div ref={containerRef} className={rootClass} style={containerStyle} role="region" aria-label={ariaLabel} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div className="logoloop__track" ref={trackRef}>{lists}</div>
    </div>
  );
});

LogoLoop.displayName = 'LogoLoop';

export default LogoLoop;
