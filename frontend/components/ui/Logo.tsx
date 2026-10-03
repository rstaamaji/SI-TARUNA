'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import { useOrganization } from '@/context/OrganizationContext';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  href?: string;
  subtitle?: string;
  src?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 46,
  showText = true,
  href,
  subtitle,
  src,
}) => {
  const { config } = useOrganization();
  const [imageError, setImageError] = useState(false);

  const effectiveLogoUrl = src || config.logoUrl || '/assets/logo.png';
  const effectiveSubtitle = subtitle || (config.hamlet ? `${config.hamlet}, ${config.village}, ${config.subDistrict}` : 'Tuk Uluh, Sringin, Jumantono');

  const LogoContent = (
    <div className={cn('flex items-center gap-3 select-none group', className)}>
      {/* Logo Graphic using uploaded official logo */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-2xl bg-taruna-dark shadow-sm ring-2 ring-taruna-yellow-500/50 overflow-hidden transition-transform duration-200 group-hover:scale-105"
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          maxWidth: size,
          maxHeight: size,
          overflow: 'hidden',
        }}
      >
        {!imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={effectiveLogoUrl}
            alt="Logo Karang Taruna"
            width={size}
            height={size}
            style={{
              width: size,
              height: size,
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          /* SVG Emblem with Karang Taruna colors */
          <div
            className="w-full h-full bg-gradient-to-br from-taruna-yellow-500 via-taruna-yellow-600 to-amber-600 flex items-center justify-center relative p-1.5"
            style={{ width: '100%', height: '100%' }}
          >
            <svg
              viewBox="0 0 40 40"
              width={size}
              height={size}
              style={{ width: '100%', height: '100%' }}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-white drop-shadow-sm"
            >
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="2 1"
                className="opacity-70"
              />
              <path
                d="M20 7C20 7 24 13 24 18C24 21 22 23 20 23C18 23 16 21 16 18C16 13 20 7 20 7Z"
                fill="#DC2626"
              />
              <path
                d="M20 12C20 12 22 15 22 18C22 19.5 21 21 20 21C19 21 18 19.5 18 18C18 15 20 12 20 12Z"
                fill="#FEF08A"
              />
              <path
                d="M12 25C15 23 18 24 20 25C22 24 25 23 28 25C26 29 22 31 20 31C18 31 14 29 12 25Z"
                fill="currentColor"
              />
              <path
                d="M9 22C12 21 16 23 18 26C15 27 11 26 9 22Z"
                fill="#FEF08A"
              />
              <path
                d="M31 22C28 21 24 23 22 26C25 27 29 26 31 22Z"
                fill="#FEF08A"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col text-left min-w-0">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <span className="font-black text-base sm:text-lg tracking-tight text-taruna-yellow-500 dark:text-taruna-yellow-400 whitespace-nowrap leading-none group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
              SI-TARUNA
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-taruna-yellow-100 dark:bg-amber-950/80 text-taruna-yellow-900 dark:text-amber-300 border border-taruna-yellow-200 dark:border-amber-800/60 whitespace-nowrap shrink-0">
              SETYA BAKTI
            </span>
          </div>
          <span className="text-[11px] font-bold text-taruna-red-600 dark:text-red-400 tracking-wide mt-1 whitespace-nowrap truncate">
            {effectiveSubtitle}
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none">
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
};
