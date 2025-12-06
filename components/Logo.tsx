
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'color' | 'white' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "h-8", 
  showText = true,
  variant = 'color'
}) => {
  
  // Color configuration based on variant
  const primaryColor = variant === 'white' ? '#ffffff' : '#2563eb'; // blue-600
  const secondaryColor = variant === 'white' ? '#94a3b8' : (variant === 'dark' ? '#1e293b' : '#3b82f6'); // slate-400 or blue-500 or slate-900
  
  // TEXT COLOR LOGIC
  // Reverted to white as requested for better legibility
  let textColorClass = 'text-white';

  if (variant === 'dark') {
      textColorClass = 'text-slate-900';
  } else if (variant === 'white') {
      textColorClass = 'text-white';
  } else {
      // App Mode - Default
      textColorClass = 'text-white';
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* ISO MARK (ICON) */}
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-full w-auto aspect-square"
      >
        {/* Background Shape (Subtle Hexagon/Cube implication) */}
        <path 
          d="M50 5 L93.3 30 V80 L50 105 L6.7 80 V30 L50 5Z" 
          fill={primaryColor} 
          fillOpacity="0.1" 
        />
        
        {/* Structural C - Left Side */}
        <path 
          d="M35 25 L25 30 V75 L35 80 L75 80 L80 70 H38 V35 H80 L75 25 H35Z" 
          fill={primaryColor} 
        />

        {/* Measurement/Precision Element - Right Side/Overlay */}
        <path 
          d="M55 45 L55 85 L85 70 V30 L55 45Z" 
          fill={secondaryColor} 
          fillOpacity="0.8"
        />
        
        {/* Ruler Ticks */}
        <rect x="22" y="35" width="6" height="2" rx="1" fill="white" fillOpacity="0.6" />
        <rect x="22" y="45" width="4" height="2" rx="1" fill="white" fillOpacity="0.6" />
        <rect x="22" y="55" width="6" height="2" rx="1" fill="white" fillOpacity="0.6" />
        <rect x="22" y="65" width="4" height="2" rx="1" fill="white" fillOpacity="0.6" />

        {/* Roof/Arrow implication at top */}
        <path d="M50 15 L65 25 H35 L50 15Z" fill={secondaryColor} />
      </svg>

      {/* WORD MARK (TEXT) */}
      {showText && (
        <div className="flex flex-col justify-center">
          <h1 className={`font-black tracking-tight leading-none ${textColorClass} text-[1.4em]`}>
            CalcConstru<span className={`${variant === 'white' ? 'text-blue-300' : 'text-blue-500'}`}>PRO</span>
          </h1>
          <div className={`text-[0.4em] font-bold tracking-[0.2em] uppercase opacity-60 ${textColorClass} mt-[0.1em]`}>
            Engenharia Civil
          </div>
        </div>
      )}
    </div>
  );
};
