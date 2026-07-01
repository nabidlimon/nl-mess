import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 32, className, ...props }: LogoIconProps) {
  const uniqueId = React.useId();
  const bgGradId = `logoBgGrad-${uniqueId}`;
  const nGradId = `logoNGrad-${uniqueId}`;
  const lGradId = `logoLGrad-${uniqueId}`;
  const roofGradId = `logoRoofGrad-${uniqueId}`;
  const glowId = `logoGlow-${uniqueId}`;

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
        {/* Background dark metallic gradient */}
        <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>

        {/* N Path Gradient (Teal to Emerald) */}
        <linearGradient id={nGradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        {/* L Path Gradient (Purple to Pink) */}
        <linearGradient id={lGradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>

        {/* Roof Gradient (Gold to Orange) */}
        <linearGradient id={roofGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>

        {/* Glow Filter */}
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4f46e5" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Dark Gradient Background squircle */}
      <rect width="100" height="100" rx="26" fill={`url(#${bgGradId})`} />
      <rect x="2" y="2" width="96" height="96" rx="24" stroke="white" strokeWidth="1.5" strokeOpacity="0.1" fill="none" />

      {/* Soft backglow */}
      <circle cx="50" cy="50" r="30" fill="#4f46e5" opacity="0.15" filter={`url(#${glowId})`} />

      {/* Roof / House top (Gold to Orange) */}
      <path 
        d="M 18 42 L 48 18 L 78 42" 
        stroke={`url(#${roofGradId})`} 
        strokeWidth="6.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none" 
        filter={`url(#${glowId})`}
      />

      {/* 'N' Monogram (Teal to Emerald) */}
      <path 
        d="M 26 66 L 26 34 L 46 66 L 46 34" 
        stroke={`url(#${nGradId})`} 
        strokeWidth="6.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none" 
      />

      {/* 'L' Monogram (Purple to Pink) */}
      <path 
        d="M 58 42 L 58 66 L 78 66" 
        stroke={`url(#${lGradId})`} 
        strokeWidth="6.5" 
        strokeLinecap="round" 
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
        className={`font-black tracking-tight text-lg transition-colors font-display ${
          textColor === 'light' ? 'text-white' : 'text-slate-900'
        }`}
      >
        <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">NL</span>
        <span className={textColor === 'light' ? 'text-white' : 'text-slate-800'}> Mess</span>
        <span className="text-blue-500 ml-0.5 font-black">Pro</span>
      </span>
    </div>
  );
}
