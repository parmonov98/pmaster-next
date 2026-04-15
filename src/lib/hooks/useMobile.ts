'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current screen size is mobile
 * @param breakpoint - Breakpoint in pixels (default: 768px for md breakpoint)
 * @returns boolean indicating if screen is mobile
 */
export const useMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};
