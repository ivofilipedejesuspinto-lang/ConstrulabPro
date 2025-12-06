
import React, { useEffect, useRef } from 'react';
import { ADSENSE_CONFIG } from '../constants';

interface AdUnitProps {
  id: string; // Used as the slot ID in AdSense
  slotType: 'header' | 'sidebar' | 'inline';
  className?: string;
  isPro?: boolean;
}

export const AdUnit: React.FC<AdUnitProps> = ({ id, slotType, className = '', isPro = false }) => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // 1. If Pro, do nothing
    if (isPro) return;

    // 2. If IDs are still placeholders, do nothing (prevents console errors from AdSense)
    if (ADSENSE_CONFIG.PUBLISHER_ID.includes('XXX') || id.includes('0000')) {
        return;
    }

    const pushAd = () => {
        try {
            const adElement = adRef.current;
            
            // Check if element exists and is empty
            if (adElement && adElement.innerHTML === "") {
                 // CRITICAL FIX: Check if element is visible or has dimensions.
                 // AdSense throws "No slot size for availableWidth=0" if we push to a 0-width element.
                 if (adElement.offsetParent === null || adElement.offsetWidth === 0 || adElement.offsetHeight === 0) {
                     return; 
                 }

                 // This assumes adsbygoogle.js is loaded in index.html
                 ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            }
        } catch (e) {
            console.warn("AdSense push warning:", e);
        }
    };

    // Use a small timeout to allow the browser to calculate layout/styles (especially for responsive hiding)
    // before checking visibility.
    const timer = setTimeout(pushAd, 800);

    return () => clearTimeout(timer);
  }, [isPro, id]);

  // If PRO version is active, do not render anything
  if (isPro) {
    return null;
  }

  // Visual placeholder for Development OR if IDs are still dummy/test values ('0000...')
  const showPlaceholder = process.env.NODE_ENV === 'development' || ADSENSE_CONFIG.PUBLISHER_ID.includes('XXX') || id.includes('0000');

  const getSizeClasses = () => {
    switch(slotType) {
      case 'header': return 'w-full h-[90px] max-w-[728px]';
      case 'sidebar': return 'w-full h-[100px] md:h-[600px] md:w-[300px]'; 
      case 'inline': return 'w-full h-[250px]';
    }
  };

  return (
    <div className={`ad-container bg-slate-800/20 border border-slate-800/50 rounded-lg flex flex-col items-center justify-center overflow-hidden my-4 mx-auto ${getSizeClasses()} ${className}`}>
      
      {showPlaceholder ? (
        // Placeholder for Development/Setup
        <div className="text-slate-600 text-xs font-mono uppercase tracking-widest text-center p-4 w-full h-full flex flex-col items-center justify-center bg-slate-900/50 border-2 border-dashed border-slate-700">
          <span className="block opacity-70 mb-2 font-bold text-slate-400">Publicidade</span>
          <span className="text-[10px] opacity-50 block mb-1">Local reservado para o Google AdSense</span>
          <span className="text-[9px] opacity-30 block font-mono">Slot ID: {id}</span>
          
          {id.includes('0000') && (
             <span className="block text-[9px] mt-2 text-amber-500 font-bold bg-amber-900/20 px-2 py-1 rounded">
               ⚠️ Falta configurar o Slot ID real no constants.ts
             </span>
          )}
          
          <span className="block text-[9px] mt-2 text-blue-500">Oculto na versão PRO</span>
        </div>
      ) : (
        // Actual AdSense Tag
        <ins 
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client={ADSENSE_CONFIG.PUBLISHER_ID}
          data-ad-slot={id}
          data-ad-format={slotType === 'sidebar' ? 'auto' : 'horizontal'}
          data-full-width-responsive="true"
        ></ins>
      )}
    </div>
  );
};
