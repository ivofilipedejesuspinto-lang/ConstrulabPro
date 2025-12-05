
import React, { useEffect, useRef } from 'react';

interface AdUnitProps {
  id: string; // Used as the slot ID in AdSense
  slotType: 'header' | 'sidebar' | 'inline';
  className?: string;
  isPro?: boolean;
}

export const AdUnit: React.FC<AdUnitProps> = ({ id, slotType, className = '', isPro = false }) => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // If Pro, do nothing
    if (isPro) return;

    const pushAd = () => {
        try {
            const adElement = adRef.current;
            
            // Check if element exists and is empty
            if (adElement && adElement.innerHTML === "") {
                 // CRITICAL FIX: Check if element is visible or has dimensions.
                 // AdSense throws "No slot size for availableWidth=0" if we push to a 0-width element.
                 if (adElement.offsetParent === null || adElement.offsetWidth === 0 || adElement.offsetHeight === 0) {
                     // console.debug(`AdSense: Slot ${id} hidden/zero-size, skipping push.`);
                     return; 
                 }

                 // This assumes adsbygoogle.js is loaded in index.html
                 ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            }
        } catch (e) {
            // Ignore errors that happen during the push itself to not crash the app
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

  const getSizeClasses = () => {
    switch(slotType) {
      case 'header': return 'w-full h-[90px] max-w-[728px]';
      case 'sidebar': return 'w-full h-[100px] md:h-[600px] md:w-[300px]'; 
      case 'inline': return 'w-full h-[250px]';
    }
  };

  return (
    <div className={`ad-container bg-slate-800/20 border border-slate-800/50 rounded-lg flex flex-col items-center justify-center overflow-hidden my-4 mx-auto ${getSizeClasses()} ${className}`}>
      {/* 
        Google AdSense Code Structure. 
        In production, replace data-ad-client with your ID (ca-pub-...) 
        and data-ad-slot with the prop 'id' or a map of IDs.
      */}
      {process.env.NODE_ENV === 'development' ? (
        // Placeholder for Development
        <div className="text-slate-600 text-xs font-mono uppercase tracking-widest text-center p-4">
          <span className="block opacity-50 mb-1">Publicidade (Google AdSense)</span>
          <span className="text-[10px] opacity-30">Slot: {id}</span>
          <span className="block text-[9px] mt-2 text-blue-500">Oculto na versão PRO</span>
        </div>
      ) : (
        // Actual AdSense Tag
        <ins 
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with your ID
          data-ad-slot={id} // Ensure this matches your AdSense setup
          data-ad-format={slotType === 'sidebar' ? 'auto' : 'horizontal'}
          data-full-width-responsive="true"
        ></ins>
      )}
    </div>
  );
};
