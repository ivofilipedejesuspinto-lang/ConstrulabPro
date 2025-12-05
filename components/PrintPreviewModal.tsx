
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UnitSystem, MaterialConfig, User } from '../types';
import { Printer, FileText, X, Building2 } from 'lucide-react';
import { formatNumber, convertValue } from '../utils/math';
import { LABELS, CONVERSIONS } from '../constants';
import { Logo } from './Logo';

interface PrintData {
  unitSystem: UnitSystem;
  displayVolume: number;
  config: MaterialConfig;
  matCementKg: number;
  matSand: number;
  matGravel: number;
  matWater: number;
  matSteelMin: number;
  matSteelMax: number;
  bags: number;
  steelBreakdown: {
    type: string;
    parts: { name: string; detail: string; weight: number }[];
  };
  mode: 'box' | 'slab';
}

interface PrintPreviewModalProps {
  data: PrintData;
  onClose: () => void;
  user: User | null; // Changed from isPro boolean to full User object
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ data, onClose, user }) => {
  const { 
    unitSystem, displayVolume, config, 
    matCementKg, matSand, matGravel, matWater, 
    matSteelMin, matSteelMax, bags, steelBreakdown, mode 
  } = data;

  const units = LABELS[unitSystem];
  const isPro = user?.role === 'pro' || user?.role === 'admin';
  
  // Custom Company Logic
  const hasCustomLogo = isPro && !!user?.companyLogoUrl;
  const hasCustomName = isPro && !!user?.companyName;

  // Ref para o conteúdo específico que queremos imprimir
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add('print-mode');
    return () => {
      document.body.classList.remove('print-mode');
    };
  }, []);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank', 'width=900,height=800');

    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir o relatório.');
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((tag) => tag.outerHTML)
      .join('\n');

    const content = printRef.current.outerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de Materiais</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        colors: {
                            slate: { 850: '#1e293b', 900: '#0f172a', 950: '#020617' }
                        }
                    }
                }
            }
        </script>
        ${styles}
        <style>
          @page { size: A4 portrait; margin: 0; }
          body { 
            margin: 0; 
            padding: 0; 
            background: white; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
          }
          .print-container {
             width: 100% !important;
             max-width: 210mm !important;
             height: 297mm !important;
             margin: 0 auto !important;
             padding: 15mm !important;
             box-shadow: none !important;
             display: flex !important;
             flex-direction: column !important;
             position: relative !important;
             overflow: hidden !important;
          }
          .watermark {
             position: absolute;
             top: 50%;
             left: 50%;
             transform: translate(-50%, -50%) rotate(-45deg);
             font-size: 80px;
             font-weight: bold;
             color: rgba(200, 200, 200, 0.2);
             pointer-events: none;
             z-index: 0;
             white-space: nowrap;
             border: 5px solid rgba(200, 200, 200, 0.2);
             padding: 20px;
             border-radius: 20px;
          }
        </style>
      </head>
      <body>
        <div class="flex justify-center items-start py-0">
            ${content}
        </div>
        <script>
            window.onload = function() {
                setTimeout(function() {
                    window.focus();
                    window.print();
                }, 800);
            };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex flex-col print-portal-container animate-in fade-in duration-200">
      
      {/* Toolbar */}
      <div className="shrink-0 w-full max-w-5xl mx-auto p-4 flex justify-between items-center z-50 sticky top-0 bg-slate-950/50 backdrop-blur-sm border-b border-white/10 mb-4">
        <div className="bg-slate-900 text-white px-4 py-2 rounded-full border border-slate-700 shadow-xl flex items-center gap-2">
            <FileText size={16} className="text-blue-400"/> 
            <span className="font-medium">Pré-visualização</span>
        </div>
        <div className="flex gap-3 items-center">
             <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg border border-slate-700 transition-all active:scale-95 flex items-center gap-2">
                <X size={18} /> <span className="hidden sm:inline">Fechar</span>
            </button>
            <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all active:scale-95 hover:-translate-y-0.5 relative z-50">
                <Printer size={18} /> Imprimir
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 custom-scrollbar flex justify-center items-start">
        
        <div ref={printRef} className="print-container bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-8 shadow-2xl relative flex flex-col rounded-sm mb-10 overflow-hidden">
            
            {!isPro && (
                <div className="watermark absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-[80px] font-bold text-slate-200/40 border-4 border-slate-200/40 p-10 rounded-3xl whitespace-nowrap z-0 pointer-events-none select-none">
                    VERSÃO GRATUITA
                </div>
            )}

            {/* HEADER */}
            <div className="border-b-2 border-blue-600 pb-3 mb-4 flex justify-between items-end relative z-10">
                
                {/* DYNAMIC HEADER LOGIC */}
                {(hasCustomLogo || hasCustomName) ? (
                     <div className="flex items-center gap-4">
                        {hasCustomLogo && (
                             <img src={user!.companyLogoUrl} alt="Logo" className="h-16 max-w-[200px] object-contain" />
                        )}
                        {!hasCustomLogo && hasCustomName && (
                             <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                                 <Building2 className="text-slate-400" size={32}/>
                             </div>
                        )}
                        
                        {hasCustomName ? (
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">{user!.companyName}</h1>
                                <div className="text-xs text-slate-500 font-bold uppercase mt-1">Relatório Técnico</div>
                            </div>
                        ) : (
                            // Logo only provided, no name override -> Show default name small or nothing? 
                            // Fallback to default styling if no name provided but logo exists
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">Relatório de Materiais</h1>
                                <div className="text-xs text-slate-500 font-bold uppercase mt-1">CalcConstruPRO (Powered by)</div>
                            </div>
                        )}
                     </div>
                ) : (
                    // DEFAULT HEADER
                    <div className="flex items-center gap-4">
                        <Logo className="h-10 text-slate-900" variant="color" />
                    </div>
                )}

                <div className="text-right">
                    <div className="text-lg font-bold text-slate-600">Estimativa de Materiais</div>
                    <div className="text-[10px] text-slate-400 font-mono font-medium">
                        {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* CONTENT SECTIONS */}
            <div className="mb-4 relative z-10">
                <h2 className="text-xs font-bold text-blue-700 uppercase tracking-widest border-b border-blue-100 pb-1 mb-2 flex items-center gap-2">
                    1. Resumo do Projeto
                </h2>
                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-blue-100 shadow-sm print:shadow-none print:border-slate-300">
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Tipo de Estrutura</div>
                        <div className="text-lg font-bold text-slate-900">{mode === 'slab' ? 'Laje (Betão Armado)' : 'Viga / Pilar / Caixa'}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Volume Total Estimado</div>
                        <div className="text-lg font-bold text-slate-900 flex items-baseline gap-1">
                            {formatNumber(displayVolume, 3)} <span className="text-xs text-slate-500 font-medium">{units.volume}</span>
                        </div>
                    </div>
                    <div className="col-span-2 mt-1 pt-2 border-t border-slate-100">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Traço Configurado (Referência 1m³)</div>
                        <div className="font-mono text-xs font-medium text-blue-900 bg-blue-50 px-3 py-2 rounded border border-blue-100 inline-block print:border print:bg-transparent print:p-1 print:border-slate-300">
                            {config.cementKgPerM3}kg Cimento <span className="text-blue-300 mx-2">|</span> {config.sandM3PerM3}m³ Areia <span className="text-blue-300 mx-2">|</span> {config.gravelM3PerM3}m³ Brita
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-4 relative z-10">
                <h2 className="text-xs font-bold text-blue-700 uppercase tracking-widest border-b border-blue-100 pb-1 mb-2">2. Quantidades de Materiais</h2>
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="bg-blue-50 border-b border-blue-200 text-blue-900">
                            <th className="p-2 font-bold rounded-tl-lg text-xs">Material</th>
                            <th className="p-2 font-bold text-right text-xs">Quantidade Estimada</th>
                            <th className="p-2 font-bold text-right rounded-tr-lg text-xs">Observações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100">
                        <tr>
                            <td className="p-2 font-bold text-slate-700 text-sm">Cimento Portland</td>
                            <td className="p-2 text-right font-bold text-base text-slate-900 bg-blue-50/30">
                                {formatNumber(convertValue(matCementKg, 'weight', unitSystem), 1)} <span className="text-[10px] font-normal text-slate-500">{units.weight}</span>
                            </td>
                            <td className="p-2 text-right text-slate-600 font-mono font-medium text-xs">~{bags} sacos</td>
                        </tr>
                        <tr>
                            <td className="p-2 font-bold text-slate-700 text-sm">Areia (Média/Lavada)</td>
                            <td className="p-2 text-right font-bold text-base text-slate-900">
                                {formatNumber(convertValue(matSand, 'volume', unitSystem), 2)} <span className="text-[10px] font-normal text-slate-500">{units.volume}</span>
                            </td>
                            <td className="p-2 text-right text-slate-600 font-medium text-xs">-</td>
                        </tr>
                        <tr>
                            <td className="p-2 font-bold text-slate-700 text-sm">Brita / Inertes</td>
                            <td className="p-2 text-right font-bold text-base text-slate-900">
                                {formatNumber(convertValue(matGravel, 'volume', unitSystem), 2)} <span className="text-[10px] font-normal text-slate-500">{units.volume}</span>
                            </td>
                            <td className="p-2 text-right text-slate-600 font-medium text-xs">Calibre 12/24</td>
                        </tr>
                        <tr>
                            <td className="p-2 font-bold text-slate-700 text-sm">Água</td>
                            <td className="p-2 text-right font-bold text-base text-slate-900">
                                {formatNumber(unitSystem === UnitSystem.SI ? matWater : matWater * CONVERSIONS.L_TO_GAL, 1)} <span className="text-[10px] font-normal text-slate-500">{units.liquid}</span>
                            </td>
                            <td className="p-2 text-right text-slate-600 font-medium text-xs">Fator a/c ~0.5</td>
                        </tr>
                        <tr className="bg-blue-50/50 print:bg-transparent border-t-2 border-blue-200">
                            <td className="p-2 font-black text-blue-900 text-sm">Aço Total (Armadura)</td>
                            <td className="p-2 text-right font-black text-base text-blue-900">
                                {formatNumber(convertValue(matSteelMin, 'weight', unitSystem), 0)} - {formatNumber(convertValue(matSteelMax, 'weight', unitSystem), 0)} <span className="text-[10px] font-bold text-blue-400">{units.weight}</span>
                            </td>
                            <td className="p-2 text-right text-slate-700 font-bold text-xs">A400 / A500 NR</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mb-4 relative z-10">
                <h2 className="text-xs font-bold text-blue-700 uppercase tracking-widest border-b border-blue-100 pb-1 mb-2">3. Detalhe de Armadura ({steelBreakdown.type})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {steelBreakdown.parts.map((part, idx) => (
                        <div key={idx} className="bg-white border border-slate-100 rounded-xl p-3 flex justify-between items-center break-inside-avoid shadow-sm print:border-slate-300 print:shadow-none">
                            <div>
                                <div className="font-bold text-slate-900 text-sm">{part.name}</div>
                                <div className="text-[10px] text-blue-600 font-mono font-bold mt-0.5 bg-blue-50 px-1.5 py-0.5 rounded w-fit print:bg-transparent print:p-0">{part.detail}</div>
                            </div>
                            <div className="text-right font-bold text-slate-800 text-base">
                                ~{formatNumber(convertValue(part.weight, 'weight', unitSystem), 1)} <span className="text-[10px] font-normal text-slate-500">{units.weight}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FOOTER */}
            <div className="mt-auto border-t border-slate-200 pt-4 text-center print:mt-auto relative z-10">
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-lg mx-auto">
                    <strong>Aviso Legal:</strong> Este documento é uma estimativa gerada automaticamente com base em rácios volumétricos médios. 
                    Não substitui um projeto de estabilidade nem o cálculo estrutural rigoroso efetuado por um engenheiro civil.
                </p>
                <div className="mt-1 text-[9px] uppercase font-bold text-slate-300">
                    {hasCustomName ? 'Gerado com CalcConstruPRO' : 'Gerado por CalcConstruPRO v1.2'}
                </div>
            </div>

        </div>
      </div>
    </div>,
    document.body
  );
};
