
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UnitSystem, MaterialConfig } from '../types';
import { Construction, Printer, FileText, X } from 'lucide-react';
import { formatNumber, convertValue } from '../utils/math';
import { LABELS, CONVERSIONS } from '../constants';

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
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ data, onClose }) => {
  const { 
    unitSystem, displayVolume, config, 
    matCementKg, matSand, matGravel, matWater, 
    matSteelMin, matSteelMax, bags, steelBreakdown, mode 
  } = data;

  const units = LABELS[unitSystem];
  
  // Add a class to body when modal opens to help with print CSS isolation
  useEffect(() => {
    document.body.classList.add('print-mode');
    return () => {
      document.body.classList.remove('print-mode');
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Using Portal with a Flexbox layout structure for better scrolling handling
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex flex-col print:bg-white print:p-0 print:static print:block print:overflow-visible print-portal-container animate-in fade-in duration-200">
      
      {/* Toolbar - Flex item at top */}
      <div className="shrink-0 w-full max-w-5xl mx-auto p-4 flex justify-between items-center z-50 print:hidden sticky top-0 bg-slate-950/50 backdrop-blur-sm border-b border-white/10 mb-4">
        <div className="bg-slate-900 text-white px-4 py-2 rounded-full border border-slate-700 shadow-xl flex items-center gap-2">
            <FileText size={16} className="text-blue-400"/> 
            <span className="font-medium">Pré-visualização</span>
        </div>
        <div className="flex gap-3 items-center">
             <button 
                type="button"
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg border border-slate-700 transition-all active:scale-95 flex items-center gap-2 cursor-pointer pointer-events-auto"
            >
                <X size={18} /> <span className="hidden sm:inline">Fechar</span>
            </button>
            <button 
                type="button"
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all active:scale-95 hover:-translate-y-0.5 cursor-pointer pointer-events-auto relative z-50"
            >
                <Printer size={18} /> Imprimir
            </button>
        </div>
      </div>

      {/* Scrollable Content Area - Flex 1 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 custom-scrollbar flex justify-center items-start print:p-0 print:overflow-visible print:block">
        
        {/* A4 Page Container */}
        <div className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-12 shadow-2xl relative flex flex-col print:shadow-none print:m-0 print:w-full print:min-h-0 print:h-auto print:p-0 rounded-sm mb-10 print:mb-0">
            
            {/* HEADER */}
            <div className="border-b-4 border-blue-600 pb-6 mb-8 flex justify-between items-end">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-xl print:border print:border-blue-600">
                        <Construction className="text-white" size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 leading-none tracking-tight">Construlab Pro</h1>
                        <div className="text-sm text-blue-600 font-bold tracking-widest uppercase mt-1">Calculadora Civil</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xl font-bold text-slate-600">Relatório de Materiais</div>
                    <div className="text-xs text-slate-400 font-mono mt-1 font-medium">
                        {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* SECTION 1: OVERVIEW */}
            <div className="mb-8">
                <h2 className="text-sm font-bold text-blue-700 uppercase tracking-widest border-b-2 border-blue-100 pb-2 mb-4 flex items-center gap-2">
                    1. Resumo do Projeto
                </h2>
                <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-xl border-2 border-blue-100 shadow-sm print:shadow-none print:border-slate-300">
                    <div>
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Tipo de Estrutura</div>
                        <div className="text-xl font-bold text-slate-900">{mode === 'slab' ? 'Laje (Betão Armado)' : 'Viga / Pilar / Caixa'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Volume Total Estimado</div>
                        <div className="text-xl font-bold text-slate-900 flex items-baseline gap-1">
                            {formatNumber(displayVolume, 3)} <span className="text-sm text-slate-500 font-medium">{units.volume}</span>
                        </div>
                    </div>
                    <div className="col-span-2 mt-2 pt-4 border-t border-slate-100">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-2">Traço Configurado (Referência 1m³)</div>
                        <div className="font-mono text-sm font-medium text-blue-900 bg-blue-50 px-4 py-3 rounded border border-blue-100 inline-block print:border print:bg-transparent print:p-2 print:border-slate-300">
                            {config.cementKgPerM3}kg Cimento <span className="text-blue-300 mx-2">|</span> {config.sandM3PerM3}m³ Areia <span className="text-blue-300 mx-2">|</span> {config.gravelM3PerM3}m³ Brita
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: MATERIALS TABLE */}
            <div className="mb-8">
                <h2 className="text-sm font-bold text-blue-700 uppercase tracking-widest border-b-2 border-blue-100 pb-2 mb-4">2. Quantidades de Materiais</h2>
                
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="bg-blue-50 border-b-2 border-blue-200 text-blue-900">
                            <th className="p-4 font-bold rounded-tl-lg">Material</th>
                            <th className="p-4 font-bold text-right">Quantidade Estimada</th>
                            <th className="p-4 font-bold text-right rounded-tr-lg">Observações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100">
                        <tr>
                            <td className="p-4 font-bold text-slate-700">Cimento Portland</td>
                            <td className="p-4 text-right font-bold text-lg text-slate-900 bg-blue-50/30">
                                {formatNumber(convertValue(matCementKg, 'weight', unitSystem), 1)} <span className="text-xs font-normal text-slate-500">{units.weight}</span>
                            </td>
                            <td className="p-4 text-right text-slate-600 font-mono font-medium">~{bags} sacos</td>
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-slate-700">Areia (Média/Lavada)</td>
                            <td className="p-4 text-right font-bold text-lg text-slate-900">
                                {formatNumber(convertValue(matSand, 'volume', unitSystem), 2)} <span className="text-xs font-normal text-slate-500">{units.volume}</span>
                            </td>
                            <td className="p-4 text-right text-slate-600 font-medium">-</td>
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-slate-700">Brita / Inertes</td>
                            <td className="p-4 text-right font-bold text-lg text-slate-900">
                                {formatNumber(convertValue(matGravel, 'volume', unitSystem), 2)} <span className="text-xs font-normal text-slate-500">{units.volume}</span>
                            </td>
                            <td className="p-4 text-right text-slate-600 font-medium">Calibre 12/24</td>
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-slate-700">Água</td>
                            <td className="p-4 text-right font-bold text-lg text-slate-900">
                                {formatNumber(unitSystem === UnitSystem.SI ? matWater : matWater * CONVERSIONS.L_TO_GAL, 1)} <span className="text-xs font-normal text-slate-500">{units.liquid}</span>
                            </td>
                            <td className="p-4 text-right text-slate-600 font-medium">Fator a/c ~0.5</td>
                        </tr>
                        <tr className="bg-blue-50/50 print:bg-transparent border-t-2 border-blue-200">
                            <td className="p-4 font-black text-blue-900">Aço Total (Armadura)</td>
                            <td className="p-4 text-right font-black text-lg text-blue-900">
                                {formatNumber(convertValue(matSteelMin, 'weight', unitSystem), 0)} - {formatNumber(convertValue(matSteelMax, 'weight', unitSystem), 0)} <span className="text-xs font-bold text-blue-400">{units.weight}</span>
                            </td>
                            <td className="p-4 text-right text-slate-700 font-bold">A400 / A500 NR</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* SECTION 3: STEEL BREAKDOWN */}
            <div className="mb-12">
                <h2 className="text-sm font-bold text-blue-700 uppercase tracking-widest border-b-2 border-blue-100 pb-2 mb-4">3. Detalhe de Armadura ({steelBreakdown.type})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {steelBreakdown.parts.map((part, idx) => (
                        <div key={idx} className="bg-white border-2 border-slate-100 rounded-xl p-5 flex justify-between items-center break-inside-avoid shadow-sm print:border-slate-300 print:shadow-none">
                            <div>
                                <div className="font-bold text-slate-900 text-base">{part.name}</div>
                                <div className="text-xs text-blue-600 font-mono font-bold mt-1 bg-blue-50 px-2 py-0.5 rounded w-fit print:bg-transparent print:p-0">{part.detail}</div>
                            </div>
                            <div className="text-right font-bold text-slate-800 text-lg">
                                ~{formatNumber(convertValue(part.weight, 'weight', unitSystem), 1)} <span className="text-xs font-normal text-slate-500">{units.weight}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FOOTER - Pushed to bottom */}
            <div className="mt-auto border-t border-slate-200 pt-6 text-center print:mt-12">
                <p className="text-xs text-slate-500 leading-relaxed max-w-lg mx-auto">
                    <strong>Aviso Legal:</strong> Este documento é uma estimativa gerada automaticamente com base em rácios volumétricos médios. 
                    Não substitui um projeto de estabilidade nem o cálculo estrutural rigoroso efetuado por um engenheiro civil.
                </p>
                <p className="text-[10px] text-blue-300 mt-2 font-mono uppercase font-bold">
                    Gerado por Construlab Pro v1.0
                </p>
            </div>

        </div>
      </div>
    </div>,
    document.body
  );
};
