import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 48,
  showText = true,
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-taruna-yellow-500 to-taruna-yellow-600 shadow-md ring-2 ring-taruna-red-600/20 overflow-hidden"
        style={{ width: size, height: size }}
      >
        <div className="flex items-center justify-center font-bold text-white text-lg tracking-wider">
          ST
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-taruna-dark leading-none">
            SI-TARUNA
          </span>
          <span className="text-xs sm:text-sm font-medium text-taruna-red-600 tracking-wide">
            Springin - Jumantono
          </span>
        </div>
      )}
    </div>
  );
};
