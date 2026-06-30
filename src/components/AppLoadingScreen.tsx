import React from 'react';
import { LogoIcon } from './Logo';

export function AppLoadingScreen() {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center font-sans z-[99999]">
      <div className="relative mb-6 w-[84px] h-[84px]">
        {/* Glowing rotating loader ring */}
        <svg 
          className="absolute -top-2 -left-2 w-[100px] h-[100px] animate-spin" 
          viewBox="0 0 100 100"
          style={{ animationDuration: '2s' }}
        >
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            stroke="url(#reactSpinnerGrad)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeDasharray="80 200" 
            fill="none" 
          />
          <defs>
            <linearGradient id="reactSpinnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Static Monogram Logo squircle */}
        <LogoIcon size={84} className="shadow-2xl" />
      </div>

      {/* Title and Shimmering loader */}
      <div className="text-center">
        <h1 className="text-white text-xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent">NL</span> Mess <span className="text-blue-500 font-black">Pro</span>
        </h1>
        
        <div className="w-[120px] h-[3px] bg-slate-800 rounded-full mt-3.5 mx-auto overflow-hidden relative">
          <div className="absolute left-0 h-full w-[50px] bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full animate-[loadingBar_1.5s_ease-in-out_infinite]" />
        </div>
      </div>

      <style>{`
        @keyframes loadingBar {
          0% { left: -50px; }
          100% { left: 120px; }
        }
      `}</style>
    </div>
  );
}
export default AppLoadingScreen;
