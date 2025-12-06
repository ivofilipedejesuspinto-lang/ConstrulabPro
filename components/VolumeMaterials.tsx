
import React, { useState, useEffect, useMemo } from 'react';
import { UnitSystem, MaterialConfig, User } from '../types';
import { CONVERSIONS, DEFAULT_MATERIALS, LABELS } from '../constants';
import { convertValue, formatNumber } from '../utils/math';
import { Settings, Calculator, Droplets, Box, Layers, Container, Scan, Download, Lock, Crown, ChevronDown } from 'lucide-react';
import { PrintPreviewModal } from './PrintPreviewModal';
import { useLanguage } from '../contexts/LanguageContext';

interface VolumeMaterialsProps {
  unitSystem: UnitSystem;
  importedAreaM2: number;
  isPro: boolean;
  user: User | null;
  onRequestUpgrade: () => void;
  projectName?: string;
}

export const VolumeMaterials: React.FC<VolumeMaterialsProps> = ({ unitSystem, importedAreaM2, isPro, user, onRequestUpgrade, projectName }) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'box' | 'slab'>('slab');
  
  // Initialize with '0' as requested
  const [length, setLength] = useState<string>('0');
  const [width, setWidth] = useState<string>('0');
  const [height, setHeight] = useState<string>('0');
  
  const [showSteelDetails, setShowSteelDetails] = useState(true);
  
  const [config, setConfig] = useState<MaterialConfig>(DEFAULT_MATERIALS);
  const [showConfig, setShowConfig] = useState(false);
  const [volumeM3, setVolumeM3] = useState(0);

  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  // Calculate Volume
  const calculate = () => {
    let vol = 0;
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;

    if (mode === 'slab') {
       // In slab mode, we use imported area * height
       // importedAreaM2 comes from CanvasArea component
       vol = importedAreaM2 * h;
    } else {
       vol = l * w * h;
    }
    setVolumeM3(vol);
  };

  useEffect(calculate, [length, width, height, importedAreaM2, mode]);

  // Calculate Display Area (for the new UI section)
  // In Box mode: Area = Length * Width. In Slab mode: Area = Imported Area.
  const currentAreaM2 = mode === 'slab' ? importedAreaM2 : (parseFloat(length) || 0) * (parseFloat(width) || 0);

  const displayVolume = convertValue(volumeM3, 'volume', unitSystem);
  const units = LABELS[unitSystem];

  const matCementKg = volumeM3 * config.cementKgPerM3;
  const matSand = volumeM3 * config.sandM3PerM3;
  const matGravel = volumeM3 * config.gravelM3PerM3;
  const matWater = volumeM3 * config.waterLPerM3;
  const matSteelMin = volumeM3 * config.steelKgPerM3Min;
  const matSteelMax = volumeM3 * config.steelKgPerM3Max;
  const bags = Math.ceil(matCementKg / 25);

  const steelBreakdown = useMemo(() => {
      const avgSteel = (matSteelMin + matSteelMax) / 2;
      
      if (mode === 'slab') {
          return {
              type: t('slabMesh'),
              parts: [
                  { name: `${t('mesh')} (Inf/Sup)`, detail: 'Ø10 - Ø12 // 15-20cm', weight: avgSteel * 0.6 },
                  { name: `${t('dist')} / Cavaletes`, detail: 'Ø8 // 20-25cm', weight: avgSteel * 0.4 }
              ]
          };
      } else {
          return {
              type: t('beamPillar'),
              parts: [
                  { name: `${t('long')} (Varões)`, detail: '4x - 8x Ø12 - Ø20', weight: avgSteel * 0.7 },
                  { name: `${t('stirrups')} (Cinta)`, detail: 'Ø6 - Ø8 // 15cm', weight: avgSteel * 0.3 }
              ]
          };
      }
  }, [mode, matSteelMin, matSteelMax, t]);

  const handlePrintClick = () => {
    setShowPrintPreview(true);
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Input Section */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl ring-1 ring-white/5 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/60 p-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/20 text-indigo-400">
               <Calculator size={22} />
             </div>
             <div>
               <h2 className="text-base font-bold text-slate-100 tracking-wide uppercase">{t('dimensions')}</h2>
               <div className="text-xs text-slate-500 font-medium mt-0.5">{t('defineVolume')}</div>
             </div>
          </div>
          
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800">
             <button onClick={() => setMode('slab')} type="button" className={`px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${mode === 'slab' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>{t('slab')}</button>
             <button onClick={() => setMode('box')} type="button" className={`px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${mode === 'box' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>{t('box')}</button>
          </div>
        </div>

        <div className="p-8 space-y-8 flex-1 flex flex-col">
          
          {/* Inputs */}
          {mode === 'slab' ? (
             // SLAB MODE: Only height input, area comes from canvas
             <div className="space-y-4">
                 <div className="p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-xl flex items-center gap-3 animate-in fade-in">
                    <Scan className="text-indigo-400 shrink-0" size={20}/>
                    <div className="text-sm text-indigo-200">
                       A utilizar área desenhada no canvas acima. Ajuste a espessura abaixo.
                    </div>
                 </div>
                 
                 <div className="group">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide group-focus-within:text-indigo-400 transition-colors">
                      {t('thickness')} ({units.length})
                    </label>
                    <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all font-mono placeholder-slate-700" step="0.05" placeholder="0.00"/>
                  </div>
             </div>
          ) : (
             // BOX MODE: Length, Width, Height inputs
             <>
                <div className="grid grid-cols-2 gap-6 animate-in fade-in">
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide group-focus-within:text-indigo-400 transition-colors">{t('length')} ({units.length})</label>
                    <div className="relative">
                      <input type="number" value={length} onChange={e => setLength(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all font-mono placeholder-slate-700" placeholder="0.00"/>
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide group-focus-within:text-indigo-400 transition-colors">{t('width')} ({units.length})</label>
                    <input type="number" value={width} onChange={e => setWidth(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all font-mono placeholder-slate-700" placeholder="0.00"/>
                  </div>
                </div>

                <div className="group animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide group-focus-within:text-indigo-400 transition-colors">
                    {t('height')} ({units.length})
                  </label>
                  <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all font-mono placeholder-slate-700" step="0.05" placeholder="0.00"/>
                </div>
             </>
          )}

          {/* Footer with Calculations */}
          <div className="mt-auto pt-8 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-6">
             
             {/* VOLUME (Existing) */}
             <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Container size={14}/> {t('estimatedVolume')}
                </div>
                <div className="text-4xl xl:text-5xl font-bold text-emerald-400 font-mono tracking-tight flex items-baseline gap-2">
                  {formatNumber(displayVolume, 3)} <span className="text-xl text-emerald-600/80 font-sans font-bold">{units.volume}</span>
                </div>
             </div>

             {/* AREA (New Section) */}
             <div className="relative pl-0 md:pl-6 md:border-l border-slate-800/60">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Scan size={14}/> Área Calculada
                </div>
                <div className="text-4xl xl:text-5xl font-bold text-blue-400 font-mono tracking-tight flex items-baseline gap-2">
                  {formatNumber(convertValue(currentAreaM2, 'area', unitSystem), 2)} <span className="text-xl text-blue-600/80 font-sans font-bold">{units.area}</span>
                </div>
             </div>

          </div>
        </div>
      </div>

      {/* Materials Section */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl ring-1 ring-white/5 overflow-hidden flex flex-col">
         <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/60 p-5 flex justify-between items-center">
           <div className="flex items-center gap-4">
             <div className="bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 text-amber-500">
               <Box size={22} />
             </div>
             <div>
               <h2 className="text-base font-bold text-slate-100 tracking-wide uppercase">{t('materials')}</h2>
               <div className="text-xs text-slate-500 font-medium mt-0.5">{t('estimateQty')}</div>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setShowConfig(!showConfig)} type="button" className={`p-2.5 rounded-lg transition-all ${showConfig ? 'bg-amber-500/20 text-amber-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`} title={t('traceConfig')}><Settings size={20} /></button>
          </div>
        </div>

        {showConfig && (
          <div className="p-6 bg-slate-950/50 border-b border-slate-800 animate-in slide-in-from-top-2 duration-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('traceTitle')}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-medium">{t('cement')} (kg)</label>
                <input type="number" value={config.cementKgPerM3} onChange={e=>setConfig({...config, cementKgPerM3: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 font-medium">{t('sand')} (m³)</label>
                <input type="number" step="0.1" value={config.sandM3PerM3} onChange={e=>setConfig({...config, sandM3PerM3: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 font-medium">{t('gravel')} (m³)</label>
                <input type="number" step="0.1" value={config.gravelM3PerM3} onChange={e=>setConfig({...config, gravelM3PerM3: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 font-medium">{t('water')} (L)</label>
                <input type="number" value={config.waterLPerM3} onChange={e=>setConfig({...config, waterLPerM3: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200"/>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
           <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-800/40 to-slate-800/10 rounded-2xl border border-slate-800 transition-colors">
              <div className="flex items-center gap-4">
                 <div className="w-1.5 h-12 bg-slate-500 rounded-full"></div>
                 <div><div className="font-bold text-slate-200 text-lg">{t('cement')}</div><div className="text-xs text-slate-400 font-mono mt-1 font-medium">{bags} {t('bags')} (25kg)</div></div>
              </div>
              <div className="font-mono text-2xl text-white font-bold">{formatNumber(convertValue(matCementKg, 'weight', unitSystem), 1)} <span className="text-base text-slate-500 font-sans">{units.weight}</span></div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-gradient-to-r from-amber-900/10 to-amber-900/5 rounded-2xl border border-amber-900/20">
                <div className="font-bold text-amber-200/80 text-sm mb-2">{t('sand')} <span className="text-[10px] text-amber-500/50 ml-1 font-normal uppercase">{t('washed')}</span></div>
                <div className="font-mono text-xl text-white font-bold">{formatNumber(convertValue(matSand, 'volume', unitSystem), 2)} <span className="text-xs text-slate-500 font-sans">{units.volume}</span></div>
              </div>
              <div className="p-5 bg-gradient-to-r from-stone-800/40 to-stone-800/10 rounded-2xl border border-slate-700/50">
                <div className="font-bold text-stone-300 text-sm mb-2">{t('gravel')} <span className="text-[10px] text-stone-500 ml-1 font-normal uppercase">12/24</span></div>
                <div className="font-mono text-xl text-white font-bold">{formatNumber(convertValue(matGravel, 'volume', unitSystem), 2)} <span className="text-xs text-slate-500 font-sans">{units.volume}</span></div>
              </div>
           </div>

           <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-red-500/30 flex flex-col transition-all overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
              
              <div className={`p-5 pl-7 flex justify-between items-start cursor-pointer ${showSteelDetails ? 'pb-2' : ''}`} onClick={() => setShowSteelDetails(!showSteelDetails)}>
                 <div className="flex items-center gap-4">
                    <div className="bg-red-500/20 p-2 rounded-lg text-red-400 border border-red-500/20 group-hover:bg-red-500 group-hover:text-white transition-colors shadow-lg shadow-red-900/20">
                        <Layers size={20}/>
                    </div>
                    <div>
                        <span className="text-base font-bold text-white tracking-wide">{t('steel')}</span>
                        <div className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full w-fit mt-1 font-bold border border-red-500/20">A400 NR</div>
                    </div>
                 </div>
                 
                 <div className="text-right">
                    <div className="font-mono text-xl text-white font-bold tracking-tight">
                        {formatNumber(convertValue(matSteelMin, 'weight', unitSystem), 0)} 
                        <span className="mx-1 text-slate-500">-</span> 
                        {formatNumber(convertValue(matSteelMax, 'weight', unitSystem), 0)} 
                        <span className="text-sm text-slate-400 font-sans ml-1">{units.weight}</span>
                    </div>
                    {isPro ? (
                        <div className="flex items-center justify-end gap-1 mt-2 text-xs text-slate-400">
                             {t('details')} <ChevronDown size={14} className={`transition-transform ${showSteelDetails ? 'rotate-180' : ''}`} />
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 justify-end mt-2 text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                            <Lock size={10} /> {t('locked')}
                        </div>
                    )}
                 </div>
              </div>

              {showSteelDetails && (
                  <div className="px-5 pb-5 pt-2 pl-7 animate-in slide-in-from-top-1">
                      {isPro ? (
                          <div className="space-y-3 mt-2">
                              {steelBreakdown.parts.map((part, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-red-500/40 transition-colors shadow-sm">
                                    <div>
                                        <div className="text-white font-bold text-sm mb-0.5">{part.name}</div>
                                        <div className="text-xs text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded w-fit">{part.detail}</div>
                                    </div>
                                    <div className="text-white font-mono font-bold text-base">~{formatNumber(convertValue(part.weight, 'weight', unitSystem), 1)} <span className="text-xs text-slate-500">{units.weight}</span></div>
                                </div>
                              ))}
                          </div>
                      ) : (
                          <div className="relative overflow-hidden rounded-xl p-4 bg-slate-900/50 text-center mt-2">
                              <div className="opacity-20 blur-[2px] pointer-events-none select-none">
                                  <div className="flex justify-between text-sm mb-3"><span>{t('long')} Ø12</span><span>120 kg</span></div>
                              </div>
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 z-10">
                                  <button onClick={onRequestUpgrade} type="button" className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"><Crown size={12} /> {t('seeDetail')}</button>
                              </div>
                          </div>
                      )}
                  </div>
              )}
           </div>

           <div className="flex items-center justify-between p-5 bg-blue-950/10 rounded-2xl border border-blue-900/20">
              <div className="flex items-center gap-3"><div className="bg-blue-500/10 p-2 rounded-lg text-blue-400"><Droplets size={18}/></div><div className="font-bold text-slate-200 text-sm">{t('water')}</div></div>
              <div className="font-mono text-xl text-white font-bold">{formatNumber(unitSystem === UnitSystem.SI ? matWater : matWater * CONVERSIONS.L_TO_GAL, 1)} <span className="text-sm text-slate-500 font-sans">{units.liquid}</span></div>
           </div>
        </div>
        
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
           <button 
             onClick={handlePrintClick}
             type="button"
             className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-bold border transition-all bg-slate-800 text-white border-slate-700 hover:bg-blue-600 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-900/20 group"
           >
             <Download size={18} className="group-hover:scale-110 transition-transform" />
             <span>{t('printPdf')}</span>
           </button>
        </div>

      </div>
    </div>
    
    {showPrintPreview && (
      <PrintPreviewModal 
        data={{
            unitSystem,
            displayVolume,
            config,
            matCementKg,
            matSand,
            matGravel,
            matWater,
            matSteelMin,
            matSteelMax,
            bags,
            steelBreakdown,
            mode,
            area: currentAreaM2, // Updated to use the correct area variable
            projectName: projectName 
        }}
        user={user}
        onClose={() => setShowPrintPreview(false)}
      />
    )}
    </>
  );
};
