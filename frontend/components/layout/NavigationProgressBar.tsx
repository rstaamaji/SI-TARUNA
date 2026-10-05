'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export const NavigationProgressBar: React.FC = () => {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // When route change completes, finish and hide progress bar
    if (isVisible) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !target.hasAttribute('download') &&
        target.getAttribute('target') !== '_blank'
      ) {
        // Only trigger if going to a different route
        if (href !== window.location.pathname) {
          setIsVisible(true);
          setProgress(30);

          setTimeout(() => {
            setProgress((p) => (p >= 30 && p < 80 ? 75 : p));
          }, 100);
        }
      }
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-1 pointer-events-none bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-taruna-yellow-500 via-amber-400 to-taruna-yellow-600 shadow-sm transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '200ms' : '300ms',
        }}
      />
    </div>
  );
};
