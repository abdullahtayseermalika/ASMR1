import { useEffect, useState, useRef } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export function useCountUp(targetValue: number, duration: number = 600): number {
  const prefersReduced = usePrefersReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(() => {
    return prefersReduced ? targetValue : 0;
  });

  const prevTargetRef = useRef<number>(prefersReduced ? targetValue : 0);

  useEffect(() => {
    if (prefersReduced) {
      setDisplayValue(targetValue);
      prevTargetRef.current = targetValue;
      return;
    }

    const startValue = prevTargetRef.current;
    const diff = targetValue - startValue;

    if (diff === 0) {
      setDisplayValue(targetValue);
      return;
    }

    let animationFrameId: number;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic curve: fast ramp-up, smooth settling
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + diff * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        // Guarantee exact integer match
        setDisplayValue(targetValue);
        prevTargetRef.current = targetValue;
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, duration, prefersReduced]);

  return displayValue;
}
