import { useEffect, useRef } from 'react';

export default function HeroStage({ className, children }) {
  const stageRef = useRef(null);

  useEffect(() => {
    const section = stageRef.current?.parentElement;
    if (!section) return undefined;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      section.style.setProperty('--p', progress.toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <div ref={stageRef} className={className}>
      {children}
    </div>
  );
}
