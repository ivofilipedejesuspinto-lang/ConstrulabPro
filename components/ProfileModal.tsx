
import React, { useRef, useState } from 'react';
import { User } from '../types';
import { X, Copy, Check, Shield, User as UserIcon } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user }) => {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (inputRef.current) {
      inputRef.current.select();
      inputRef.current.setSelectionRange(0, 99999); // Mobile
      
      try {
        navigator.clipboard.writeText(user.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        // Fallback: User has already selected the text due to .select(), they can Ctrl+C
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={20} />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-400'}`}>
              {user.role === 'admin' ? <Shield size={24} /> : <UserIcon size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    user.role === 'admin' ? 'border-red-500/30 text-red-400 bg-red-500/10' : 
                    user.role === 'pro' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 
                    'border-slate-700 text-slate-500 bg-slate-800'
                }`}>
                  {user.role}
                </span>
                <span className="text-xs text-slate-500">{user.email}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                O seu ID de Utilizador (UUID)
              </label>
              <div className="flex gap-2">
                <input 
                  ref={inputRef}
                  type="text" 
                  value={user.id} 
                  readOnly
                  onClick={(e) => e.currentTarget.select()}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-blue-400 font-mono outline-none focus:border-blue-500"
                />
                <button 
                  onClick={handleCopy}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-2 rounded transition-colors"
                  title="Copiar"
                >
                  {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                Use este ID no comando SQL para se tornar Admin:
                <br/>
                <code className="text-slate-400 bg-slate-800/50 px-1 rounded select-all">
                  UPDATE profiles SET role = 'admin' WHERE id = '{user.id}';
                </code>
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
