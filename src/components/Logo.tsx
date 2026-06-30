import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 32, className, ...props }: LogoIconProps) {
  const uniqueId = React.useId();
  const bgGradId = `logoBgGrad-${uniqueId}`;
  const nlGradId = `logoNlGrad-${uniqueId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Background Gradient */}
        <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        
        {/* Monogram Stroke Gradient */}
        <linearGradient id={nlGradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </linearGradient>
      </defs>

      {/* Blue Background Rounded Rect */}
      <rect width="100" height="100" rx="22" fill={`url(#${bgGradId})`} />

      {/* Monogram Paths with exact geometry matching user requirements */}
      {/* Left Vertical Stem of N */}
      <path 
        d="M 24 32 L 24 72" 
        stroke={`url(#${nlGradId})`} 
        strokeWidth="5.5" 
        strokeLinecap="butt" 
        strokeLinejoin="round" 
        fill="none" 
      />

      {/* Diagonal of N */}
      <path 
        d="M 24 32 L 44 64" 
        stroke={`url(#${nlGradId})`} 
        strokeWidth="5.5" 
        strokeLinecap="butt" 
        strokeLinejoin="round" 
        fill="none" 
      />

      {/* Roof / Outer Wall */}
      <path 
        d="M 34.5 37 L 50 23 L 70 41 L 70 65" 
        stroke={`url(#${nlGradId})`} 
        strokeWidth="5.5" 
        strokeLinecap="butt" 
        strokeLinejoin="round" 
        fill="none" 
      />

      {/* Inner 'L' */}
      <path 
        d="M 50 33 L 50 63 C 50 69 54 69 60 69 L 76 69" 
        stroke={`url(#${nlGradId})`} 
        strokeWidth="5.5" 
        strokeLinecap="butt" 
        strokeLinejoin="round" 
        fill="none" 
      />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  iconSize?: number;
  textColor?: 'light' | 'dark';
}

export function Logo({ className = '', iconSize = 32, textColor = 'dark' }: LogoProps) {
  const { t } = useLanguage();

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <LogoIcon size={iconSize} className="flex-shrink-0 transform transition-transform hover:scale-105" />
      <span 
        className={`font-bold tracking-tight text-lg transition-colors ${
          textColor === 'light' ? 'text-white' : 'text-slate-900'
        }`}
      >
        {t('common.appName') || 'NL Mess'}
        <span className="text-blue-500 ml-0.5 font-extrabold">Pro</span>
      </span>
    </div>
  );
}
