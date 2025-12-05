
import React, { useState, useRef, useEffect } from 'react';
import { Point, UnitSystem, ProjectData } from '../types';
import { calculatePolygonAreaPx, getDistance, convertValue, formatNumber } from '../utils/math';
import { LABELS } from '../constants';
import { Trash2, ZoomIn, Scan, FolderOpen, Lock, Pencil, Cloud } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CanvasAreaProps {
  unitSystem: UnitSystem;
  onAreaCalculated: (areaM2: number) => void;
  isPro?: boolean;
  onRequestUpgrade?: () => void;
  onSaveRequest?: (data: ProjectData, name: string) => void;
  onLoadRequest?: () => void;
  externalLoadData?: ProjectData | null;
  projectName?: string;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({ 
    unitSystem, 
    onAreaCalculated, 
    isPro = false, 
    onRequestUpgrade,
    onSaveRequest,
    onLoadRequest,
    externalLoadData,
    projectName
}) => {
  const { t } = useLanguage();
  const [points, setPoints] = useState<Point[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(15); // Default scale 15 px/m
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0, id: -1 });
  
  // Local state for the project name input
  const [localName, setLocalName] = useState("");
  const [nameError, setNameError] = useState(false); // UI state for validation error

  const svgRef = useRef<SVGSVGElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync with prop when project is loaded externally
  useEffect(() => {
    if (projectName) {
      setLocalName(projectName);
      setNameError(false);
    }
  }, [projectName]);

  // Load external data if provided
  useEffect(() => {
      if (externalLoadData) {
          setPoints(externalLoadData.points);
          setScale(externalLoadData.scale);
          setIsClosed(externalLoadData.isClosed);
      }
  }, [externalLoadData]);

  // Calculate real area in m2 whenever polygon changes
  useEffect(() => {
    if (isClosed && points.length >= 3) {
      const areaPx = calculatePolygonAreaPx(points);
      const areaM2 = areaPx / (scale * scale);
      onAreaCalculated(areaM2);
    }
  }, [points, isClosed, scale, onAreaCalculated]);

  const getSvgCoordinates = (e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Grid snapping (10px) if CTRL is held
    if (e.ctrlKey) {
      x = Math.round(x / 10) * 10;
      y = Math.round(y / 10) * 10;
    }

    return { x, y };
  };

  const handleSvgClick = (e: React.MouseEvent) => {
    if (isClosed) return;
    if (dragIndex !== null) return;

    const { x, y } = getSvgCoordinates(e);
    
    if (points.length > 2) {
      const distToStart = getDistance({ x, y, id: 0 }, points[0]);
      if (distToStart < 15) {
        setIsClosed(true);
        return;
      }
    }

    setPoints([...points, { x, y, id: Date.now() }]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getSvgCoordinates(e);
    setMousePos({ x, y, id: -1 });

    if (dragIndex !== null) {
      const newPoints = [...points];
      let finalX = x;
      let finalY = y;

      if (e.shiftKey && points.length > 1) {
        const prevPoint = points[dragIndex === 0 ? points.length - 1 : dragIndex - 1];
        const dx = Math.abs(x - prevPoint.x);
        const dy = Math.abs(y - prevPoint.y);
        
        if (dx > dy) finalY = prevPoint.y;
        else finalX = prevPoint.x;
      }

      newPoints[dragIndex] = { ...newPoints[dragIndex], x: finalX, y: finalY };
      setPoints(newPoints);
    }
  };

  const handleMouseUp = () => {
    setDragIndex(null);
  };

  const resetCanvas = () => {
    setPoints([]);
    setIsClosed(false);
    setLocalName("");
    setNameError(false);
    onAreaCalculated(0);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalName(e.target.value);
      if (e.target.value.trim()) {
          setNameError(false);
      }
  };

  // --- BUTTON HANDLERS ---

  const handleLoadClick = () => {
    if (onLoadRequest) onLoadRequest();
  };

  const handleSaveClick = () => {
    // Check for empty name locally to provide visual feedback
    if (!localName.trim()) {
        setNameError(true);
        // Focus the input to alert user
        nameInputRef.current?.focus();
        
        // We still let the parent know (so it can show the NotificationBanner)
        // or we rely solely on parent validation. 
        // Best UX: Focus here, notify parent.
    }

    if (onSaveRequest) {
        onSaveRequest({
            points,
            scale,
            isClosed,
            unitSystem
        }, localName);
    }
  };

  const renderSegments = () => {
    if (points.length < 2) return null;

    const lines = [];
    const count = isClosed ? points.length : points.length - 1;

    for (let i = 0; i < count; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      
      const distPx = getDistance(p1, p2);
      const distM = distPx / scale;
      const displayDist = convertValue(distM, 'length', unitSystem);
      const unitLabel = LABELS[unitSystem].length;
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      lines.push(
        <g key={`seg-${i}`}>
          <line 
            x1={p1.x} y1={p1.y} 
            x2={p2.x} y2={p2.y} 
            stroke="#3b82f6" 
            strokeWidth="2" 
            opacity="0.8"
          />
          <rect 
            x={midX - 26} y={midY - 13} 
            width="52" height="26" 
            rx="6" fill="#0f172a" 
            stroke="#1e293b"
            strokeWidth="1"
            opacity="0.9"
          />
          <text 
            x={midX} y={midY + 5} 
            textAnchor="middle" 
            fill="#e2e8f0" 
            fontSize="12"
            fontWeight="500"
            className="pointer-events-none select-none font-mono"
          >
            {formatNumber(displayDist, 1)}<tspan fontSize="10" fill="#94a3b8">{unitLabel}</tspan>
          </text>
        </g>
      );
    }
    return lines;
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden ring-1 ring-white/5 transition-all hover:border-slate-700/50 print:bg-white print:border-none print:shadow-none print:ring-0">
        
        {/* Header - Hidden on Print */}
        <div className="relative z-30 bg-slate-900/50 backdrop-blur-md border-b border-slate-800/60 p-4 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
            {/* Title / Input Section */}
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20 text-blue-400 shrink-0">
                    <Scan size={22} />
                </div>
                <div className="flex-1">
                    {/* DIRECT INPUT - NO MODAL */}
                    <div className="relative group/input">
                        <input 
                            ref={nameInputRef}
                            type="text" 
                            value={localName}
                            onChange={handleNameChange}
                            placeholder={t('projectNamePlaceholder')}
                            className={`bg-transparent border-b text-slate-100 font-semibold text-base placeholder-slate-600 outline-none w-full md:w-64 transition-all pb-0.5 ${
                                nameError 
                                ? 'border-red-500 placeholder-red-500/50 animate-pulse' 
                                : 'border-transparent hover:border-slate-600 focus:border-blue-500'
                            }`}
                        />
                        <Pencil size={12} className={`absolute right-0 top-1.5 opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none ${nameError ? 'text-red-500 opacity-100' : 'text-slate-600'}`}/>
                        
                        {nameError && (
                            <span className="absolute left-0 -bottom-5 text-[10px] text-red-500 font-bold animate-in slide-in-from-top-1">
                                {t('required')}
                            </span>
                        )}
                    </div>
                    
                    <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
                        <span>{points.length > 0 ? (isClosed ? t('geometryClosed') : t('drawing')) : t('defineGeometry')}</span>
                        {points.length > 0 && (
                            <>
                            <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                            <span className="text-blue-400 font-bold">{points.length} {t('points')}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Toolbar */}
            <div className="flex items-center gap-1 w-full md:w-auto justify-end">
                {/* Scale Control - YELLOW/AMBER */}
                <div className="group flex items-center rounded-xl border border-transparent hover:bg-amber-950/30 hover:border-amber-900/50 px-2 py-1.5 transition-all cursor-default">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 group-hover:text-amber-400 font-bold mr-2 uppercase tracking-wider transition-colors">
                    <ZoomIn size={14} /> <span className="hidden sm:inline">{t('scale')}</span>
                    </span>
                    <div className="flex items-center bg-slate-950/50 group-hover:bg-slate-950 rounded-lg px-2 py-1 gap-1 border border-slate-800 group-hover:border-amber-500/30 transition-colors">
                    <input 
                        type="number" 
                        value={scale} 
                        onChange={(e) => setScale(Number(e.target.value))}
                        className="w-8 bg-transparent text-sm font-mono text-slate-300 group-hover:text-amber-200 focus:outline-none text-right placeholder-slate-600 font-bold"
                        min="1"
                        />
                        <span className="text-[10px] text-slate-600 group-hover:text-amber-500/50 font-mono">px/m</span>
                    </div>
                </div>
                
                <div className="h-6 w-px bg-slate-800 mx-1 hidden md:block"></div>

                {/* Action Buttons */}
                <div className="flex gap-1">
                    {/* Abrir - BLUE */}
                    <button 
                        onClick={handleLoadClick}
                        className="group px-3 py-2 border border-transparent rounded-xl transition-all relative flex items-center gap-2 font-bold text-sm text-slate-500 hover:text-blue-400 hover:bg-blue-950/30 hover:border-blue-900/50"
                        title={t('open')}
                    >
                        <FolderOpen size={18} strokeWidth={2} />
                        <span className="hidden sm:inline">{t('open')}</span>
                        {!isPro && <div className="absolute -top-1 -right-1 bg-amber-600 rounded-full p-0.5"><Lock size={8} className="text-white"/></div>}
                    </button>

                    {/* Guardar - GREEN/EMERALD */}
                    <button 
                        onClick={handleSaveClick}
                        className="group px-3 py-2 border border-transparent rounded-xl transition-all relative flex items-center gap-2 font-bold text-sm text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/30 hover:border-emerald-900/50"
                        title={t('save')}
                    >
                        <Cloud size={18} strokeWidth={2} />
                        <span className="hidden sm:inline">{t('save')}</span>
                        {!isPro && <div className="absolute -top-1 -right-1 bg-amber-600 rounded-full p-0.5"><Lock size={8} className="text-white"/></div>}
                    </button>

                    {/* Trash - RED */}
                    <button 
                        onClick={resetCanvas}
                        className="group p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 rounded-xl transition-all"
                        title="Limpar Tudo"
                    >
                        <Trash2 size={18} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>

        {/* SVG Container */}
        <div className="relative w-full h-[450px] bg-slate-950 cursor-crosshair overflow-hidden group print:invert print:bg-black">
            <div className="absolute inset-0 pointer-events-none opacity-20" 
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #475569 1px, transparent 0)', backgroundSize: '20px 20px' }}>
            </div>

            <svg 
            ref={svgRef}
            className="w-full h-full relative z-10"
            onClick={handleSvgClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            >
            {points.length > 2 && (
                <path 
                d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')} ${isClosed ? 'Z' : ''}`}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="none"
                className="animate-pulse-slow"
                />
            )}
            {renderSegments()}
            {!isClosed && points.length > 0 && (
                <g pointerEvents="none">
                <line 
                    x1={points[points.length-1].x} 
                    y1={points[points.length-1].y}
                    x2={mousePos.x}
                    y2={mousePos.y}
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                />
                </g>
            )}
            {points.map((p, i) => (
                <g 
                key={p.id}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    setDragIndex(i);
                }}
                className="cursor-move"
                >
                <circle 
                    cx={p.x} cy={p.y} r={7} 
                    fill={i === 0 && points.length > 2 && !isClosed ? "#ef4444" : "#3b82f6"} 
                    stroke="white" strokeWidth="2"
                    className="hover:r-9 transition-all shadow-lg"
                />
                <text x={p.x + 12} y={p.y - 12} fill="#94a3b8" fontSize="12" fontWeight="bold" className="pointer-events-none select-none">{i + 1}</text>
                </g>
            ))}
            </svg>
        </div>
    </div>
  );
};
