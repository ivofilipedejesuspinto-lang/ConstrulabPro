
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UnitSystem, MaterialConfig, User } from '../types';
import { Printer, X, Building2, Calendar, LayoutTemplate } from 'lucide-react';
import { formatNumber, convertValue } from '../utils/math';
import { LABELS, CONVERSIONS } from '../constants';
import { Logo } from './Logo';
import { useLanguage } from '../contexts/LanguageContext';

// Definição dos dados recebidos
interface PrintData {
  unitSystem: UnitSystem;
  displayVolume: number;
  area: number;
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
  projectName?: string;
}

interface PrintPreviewModalProps {
  data: PrintData;
  onClose: () => void;
  user: User | null;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ data, onClose, user }) => {
  const { t } = useLanguage();
  
  // Destructuring dos dados
  const { 
    unitSystem, displayVolume, area, config, 
    matCementKg, matSand, matGravel, matWater, 
    matSteelMin, matSteelMax, bags, steelBreakdown, mode,
    projectName 
  } = data;

  const units = LABELS[unitSystem];
  const isPro = user?.role === 'pro' || user?.role === 'admin';
  const hasCustomLogo = isPro && !!user?.companyLogoUrl;
  const hasCustomName = isPro && !!user?.companyName;

  // REF para capturar o conteúdo HTML do relatório
  const printRef = useRef<HTMLDivElement>(null);

  // Bloquear scroll da página principal enquanto o modal está aberto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handlePrint = () => {
    if (!printRef.current) return;

    // 1. Abrir nova janela em branco
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir o relatório.');
      return;
    }

    // 2. Copiar todos os estilos da aplicação atual (Tailwind + Custom)
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((tag) => tag.outerHTML)
      .join('\n');

    // 3. Obter o HTML do relatório
    const content = printRef.current.outerHTML;

    // 4. Escrever o documento na nova janela
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="${data.unitSystem === 'SI' ? 'pt' : 'en'}">
      <head>
        <meta charset="UTF-8">
        <title>${hasCustomName ? user!.companyName : t('reportTitle')}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${styles}
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4 portrait; margin: 0; }
          body { 
            margin: 0; 
            padding: 0; 
            background: white; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          /* Forçar cores de fundo na impressão */
          * {
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
        </style>
      </head>
      <body>
        ${content}
        <script>
            // Esperar imagens carregarem antes de imprimir
            window.onload = function() {
                setTimeout(function() {
                    window.focus();
                    window.print();
                    // Opcional: window.close();
                }, 500);
            };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Conteúdo do Relatório (A4)
  const reportContent = (
    <div 
        ref={printRef} 
        className="bg-white w-[210mm] min-h-[297mm] mx-auto shadow-2xl flex flex-col text-slate-900 relative overflow-hidden"
    >
      
      {/* --- CABEÇALHO AZUL --- */}
      <div className="bg-slate-900 text-white px-10 py-8">
        <div className="flex justify-between items-center">
          
          {/* Logo / Empresa */}
          <div className="flex flex-col justify-center">
             {hasCustomLogo ? (
                <img 
                  src={user!.companyLogoUrl} 
                  alt="Logo Empresa" 
                  className="h-16 w-auto object-contain mb-3 origin-left" 
                />
             ) : (
                <div className="mb-4">
                   <Logo className="h-12" variant="color" />
                </div>
             )}
             
             <h1 className="text-2xl font-black leading-tight">
                {hasCustomName ? user!.companyName : t('reportTitle')}
             </h1>
             <div className="text-xs text-blue-400 font-bold uppercase tracking-wider mt-1">
                {t('techReport')}
             </div>
          </div>
          
          {/* Resumo Rápido (Topo Direito) */}
          <div className="text-right">
             <div className="bg-white/10 border border-white/10 px-5 py-3 rounded-lg backdrop-blur-sm">
                <div className="text-[10px] text-slate-300 uppercase font-bold mb-1">{t('estimatedVolume')}</div>
                <div className="text-3xl font-mono font-bold text-white leading-none">
                   {formatNumber(displayVolume, 2)} <span className="text-sm text-slate-400 font-normal">{units.volume}</span>
                </div>
             </div>
             <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center justify-end gap-1">
                <Calendar size={10}/> {new Date().toLocaleDateString()}
             </div>
          </div>
        </div>
      </div>

      {/* --- CORPO DO RELATÓRIO (BRANCO) --- */}
      <div className="p-10 flex-1 flex flex-col gap-8 bg-white relative">

          {/* MARCA DE ÁGUA (WATERMARK) - Apenas para Free */}
          {!isPro && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-[70px] font-black text-slate-300 border-8 border-slate-300 p-12 rounded-[3rem] whitespace-nowrap z-0 pointer-events-none select-none opacity-40">
                  CalcConstruPRO
              </div>
          )}

          {/* 1. Resumo do Projeto */}
          <section className="relative z-10">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-blue-100 pb-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  {t('projectSummary')}
                  {/* PROJECT NAME */}
                  {projectName && <span className="text-slate-500 font-bold normal-case ml-2">({projectName})</span>}
              </h3>
              <div className="grid grid-cols-3 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">{t('structureType')}</span>
                      <span className="text-lg font-bold text-slate-800">{mode === 'slab' ? t('slabMesh') : t('beamPillar')}</span>
                  </div>
                  <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">{t('canvasArea')}</span>
                      <span className="text-lg font-bold text-slate-800 font-mono">
                        {formatNumber(convertValue(area, 'area', unitSystem), 2)} <small className="text-xs text-slate-400">{units.area}</small>
                      </span>
                  </div>
                  <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">{t('totalVolume')}</span>
                      <span className="text-lg font-bold text-slate-800 font-mono">
                        {formatNumber(displayVolume, 3)} <small className="text-xs text-slate-400">{units.volume}</small>
                      </span>
                  </div>
              </div>
              
              {/* Configuração do Traço */}
              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full w-fit mx-auto">
                  <span className="font-bold text-blue-600 uppercase">{t('traceRef')}:</span>
                  <span>{config.cementKgPerM3}kg {t('cement')}</span> • 
                  <span>{config.sandM3PerM3}m³ {t('sand')}</span> • 
                  <span>{config.gravelM3PerM3}m³ {t('gravel')}</span>
              </div>
          </section>

          {/* 2. Quantidades de Materiais */}
          <section className="relative z-10">
               <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-blue-100 pb-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  {t('materialQty')}
              </h3>
              <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-100 text-slate-500 text-xs uppercase font-bold">
                      <tr>
                          <th className="px-4 py-3 text-left rounded-l-lg">{t('material')}</th>
                          <th className="px-4 py-3 text-right">{t('estimated')}</th>
                          <th className="px-4 py-3 text-right rounded-r-lg">{t('obs')}</th>
                      </tr>
                  </thead>
                  <tbody className="text-slate-700">
                      <tr className="border-b border-slate-50">
                          <td className="px-4 py-3 font-bold">{t('cement')}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatNumber(convertValue(matCementKg, 'weight', unitSystem), 1)} <span className="text-xs text-slate-400">{units.weight}</span></td>
                          <td className="px-4 py-3 text-right text-xs">~{bags} {t('bags')}</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                          <td className="px-4 py-3 font-bold">{t('sand')}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatNumber(convertValue(matSand, 'volume', unitSystem), 2)} <span className="text-xs text-slate-400">{units.volume}</span></td>
                          <td className="px-4 py-3 text-right text-xs">{t('washed')}</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                          <td className="px-4 py-3 font-bold">{t('gravel')}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatNumber(convertValue(matGravel, 'volume', unitSystem), 2)} <span className="text-xs text-slate-400">{units.volume}</span></td>
                          <td className="px-4 py-3 text-right text-xs">12/24</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                          <td className="px-4 py-3 font-bold">{t('water')}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatNumber(unitSystem === UnitSystem.SI ? matWater : matWater * CONVERSIONS.L_TO_GAL, 1)} <span className="text-xs text-slate-400">{units.liquid}</span></td>
                          <td className="px-4 py-3 text-right text-xs">A/C ~0.5</td>
                      </tr>
                      <tr className="bg-blue-50/50">
                          <td className="px-4 py-3 font-black text-blue-900">{t('steel')} (Total)</td>
                          <td className="px-4 py-3 text-right font-black font-mono text-blue-900">
                              {formatNumber(convertValue(matSteelMin, 'weight', unitSystem), 0)} - {formatNumber(convertValue(matSteelMax, 'weight', unitSystem), 0)} <span className="text-xs">{units.weight}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-blue-700">A400 / A500</td>
                      </tr>
                  </tbody>
              </table>
          </section>

          {/* 3. Detalhes da Armadura */}
          <section className="relative z-10 flex-1">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-blue-100 pb-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  {t('steelDetailTitle')} <span className="text-slate-400 font-normal normal-case">({steelBreakdown.type})</span>
              </h3>
              <div className="grid grid-cols-2 gap-6">
                  {steelBreakdown.parts.map((part, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm break-inside-avoid">
                          <div className="mb-3">
                              <div className="text-slate-900 font-bold text-sm mb-1">{part.name}</div>
                              <div className="text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit font-mono font-bold uppercase tracking-wide border border-blue-100">
                                {part.detail}
                              </div>
                          </div>
                          <div className="text-right border-t border-slate-50 pt-2">
                              <div className="text-xl font-black text-slate-800 leading-none">
                                  ~{formatNumber(convertValue(part.weight, 'weight', unitSystem), 1)} <span className="text-xs text-slate-400 font-medium">{units.weight}</span>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </section>

          {/* Rodapé */}
          <footer className="mt-auto pt-6 text-center border-t border-slate-100">
              <div className="flex justify-center mb-2 text-slate-300">
                  <Building2 size={20} strokeWidth={1.5} />
              </div>
              <p className="text-[9px] text-slate-400 leading-relaxed max-w-lg mx-auto mb-2">
                  <strong>{t('disclaimerTitle')}</strong> {t('disclaimerText')}
                  <br/>
                  Este documento é uma estimativa preliminar. As quantidades reais podem variar devido a desperdícios, métodos de construção e especificidades do local. Consulte sempre um Engenheiro Civil qualificado.
              </p>
              <div className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">
                  {hasCustomName ? `Gerado por ${user!.companyName}` : 'Gerado por CalcConstruPRO'} • {new Date().getFullYear()}
              </div>
          </footer>
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-start overflow-auto animate-in fade-in duration-200">
      
      {/* Barra de Ferramentas (Apenas Visível no Ecrã) */}
      <div className="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-md border-b border-white/10 p-4 mb-8 flex justify-between items-center max-w-5xl rounded-b-2xl shadow-2xl">
         <div className="text-white font-bold flex items-center gap-2">
            <LayoutTemplate className="text-blue-400"/> Pré-visualização de Impressão
         </div>
         <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-sm transition-colors border border-slate-700 flex items-center gap-2">
              <X size={18}/> Fechar
            </button>
            <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-transform hover:-translate-y-0.5">
              <Printer size={16}/> Imprimir PDF
            </button>
         </div>
      </div>

      {/* Container do Papel (Visualização no ecrã) */}
      <div className="pb-20 w-full flex justify-center">
         {/* O elemento que será impresso é apenas este 'reportContent' referenciado pelo useRef */}
         {reportContent}
      </div>

    </div>,
    document.body
  );
};
