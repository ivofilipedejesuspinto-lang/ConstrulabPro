
import React, { useEffect } from 'react';
import { X, Home, Info, HelpCircle, Mail, Shield, FileText, Github, Linkedin, UserCircle, Crown } from 'lucide-react';
import { Logo } from './Logo';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  activePage: string | null;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ isOpen, onClose, onNavigate, activePage }) => {
  
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const menuItems = [
    // Área de Cliente adicionada aqui
    { id: 'client-area', label: 'Área de Cliente', icon: <UserCircle size={20}/> },
    { type: 'divider' },
    { id: 'about', label: 'Sobre Nós', icon: <Info size={20}/> },
    { id: 'faq', label: 'Manual & FAQ', icon: <HelpCircle size={20}/> },
    { id: 'contact', label: 'Contactos', icon: <Mail size={20}/> },
    { type: 'divider' },
    { id: 'privacy', label: 'Privacidade', icon: <Shield size={20}/> },
    { id: 'terms', label: 'Termos de Uso', icon: <FileText size={20}/> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-[280px] bg-slate-900 border-r border-slate-800 z-[100] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            {/* Logo text enabled to fix "missing something" */}
            <Logo className="h-7" showText={true} />
            <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            <button 
                onClick={() => { onNavigate('home'); onClose(); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${
                    activePage === null 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
                <Home size={20} /> Início
            </button>

            {menuItems.map((item, idx) => {
                if (item.type === 'divider') {
                    return <div key={idx} className="h-px bg-slate-800 my-4 mx-2" />;
                }
                return (
                    <button 
                        key={item.id}
                        onClick={() => { onNavigate(item.id!); onClose(); }}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all group ${
                            activePage === item.id 
                            ? 'bg-slate-800 text-blue-400 border border-slate-700' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        {item.icon} 
                        <span>{item.label}</span>
                        
                        {/* PRO Badge Logic */}
                        {item.id === 'client-area' && (
                             <div className="ml-auto flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.1)] group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                <Crown size={10} fill="currentColor" />
                                PRO
                             </div>
                        )}
                    </button>
                );
            })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950">
            <div className="flex justify-center gap-4 mb-4">
                <a href="#" className="text-slate-500 hover:text-white transition-colors"><Github size={20}/></a>
                <a href="#" className="text-slate-500 hover:text-blue-400 transition-colors"><Linkedin size={20}/></a>
            </div>
            <p className="text-center text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                © {new Date().getFullYear()} CalcConstruPRO
            </p>
        </div>
      </div>
    </>
  );
};
