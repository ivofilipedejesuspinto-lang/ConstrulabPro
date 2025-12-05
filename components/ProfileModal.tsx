
import React, { useRef, useState, useEffect } from 'react';
import { User } from '../types';
import { AuthService } from '../services/authService';
import { X, Copy, Check, Shield, User as UserIcon, Building2, Upload, Save, Loader2, Image as ImageIcon, AlertCircle, Calendar, CreditCard, LayoutTemplate } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUserUpdate: (updatedUser: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUserUpdate }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'company'>('profile');
  
  // Company Form State
  const [companyName, setCompanyName] = useState(user.companyName || '');
  const [logoPreview, setLogoPreview] = useState(user.companyLogoUrl || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setCompanyName(user.companyName || '');
        setLogoPreview(user.companyLogoUrl || '');
        setActiveTab('profile');
        setSaveSuccess(false);
        setErrorMessage(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (inputRef.current) {
      inputRef.current.select();
      inputRef.current.setSelectionRange(0, 99999);
      try {
        navigator.clipboard.writeText(user.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {}
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setSelectedFile(file);
          const objectUrl = URL.createObjectURL(file);
          setLogoPreview(objectUrl);
          setErrorMessage(null);
      }
  };

  const handleSaveCompany = async () => {
      setSaving(true);
      setErrorMessage(null);
      try {
          let finalUrl = user.companyLogoUrl;

          if (selectedFile) {
              finalUrl = await AuthService.uploadLogo(user.id, selectedFile);
          }

          await AuthService.updateCompanyProfile(user.id, companyName, finalUrl);
          
          const updatedUser = await AuthService.syncSession();
          if (updatedUser) {
              onUserUpdate(updatedUser);
          }
          
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
      } catch (e: any) {
          console.error(e);
          if (e.message && (e.message.includes('row-level security') || e.message.includes('policy') || e.statusCode === '403')) {
              setErrorMessage("Permissão negada: O Supabase bloqueou o upload. Corra o script SQL corrigido no painel do Supabase.");
          } else {
              setErrorMessage("Erro ao guardar: " + (e.message || "Tente novamente."));
          }
      } finally {
          setSaving(false);
      }
  };

  const isPro = user.role === 'pro' || user.role === 'admin';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      {/* Changed max-w-2xl to max-w-3xl to accommodate wider tabs */}
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-blue-900 via-slate-800 to-slate-900 relative">
            <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
            <button onClick={onClose} className="absolute top-4 right-4 bg-slate-950/50 hover:bg-slate-950 text-white p-2 rounded-full transition-colors z-10 backdrop-blur-sm border border-white/10">
                <X size={20} />
            </button>
        </div>

        {/* Profile Header & Tabs */}
        <div className="px-8 pb-0 relative -mt-12 flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
            <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-2xl bg-slate-950 border-4 border-slate-900 shadow-xl flex items-center justify-center relative overflow-hidden group">
                     <div className={`w-full h-full flex items-center justify-center ${user.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-blue-600 text-white'}`}>
                        <span className="text-3xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
                     </div>
                     {/* Role Badge */}
                     <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-sm py-1 text-center">
                         <span className={`text-[10px] font-bold uppercase tracking-wider ${
                             user.role === 'admin' ? 'text-red-400' : isPro ? 'text-amber-400' : 'text-slate-400'
                         }`}>
                             {user.role}
                         </span>
                     </div>
                </div>
                <div className="mb-2">
                    <h2 className="text-2xl font-bold text-white leading-tight">{user.name}</h2>
                    <p className="text-slate-400 text-sm">{user.email}</p>
                </div>
            </div>

            <div className="flex bg-slate-900/90 p-1.5 rounded-xl border border-slate-700 shadow-lg backdrop-blur-md mb-2 w-full md:w-auto relative z-20">
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                        activeTab === 'profile' ? 'bg-slate-700 text-white shadow-md ring-1 ring-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                >
                    <UserIcon size={16}/> <span className="hidden sm:inline">Minha Conta</span>
                </button>
                <button 
                    onClick={() => setActiveTab('company')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                        activeTab === 'company' ? 'bg-blue-600 text-white shadow-md ring-1 ring-white/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                >
                    <Building2 size={16}/> <span className="hidden sm:inline">Empresa & Marca</span>
                    {!isPro && <LockIconSmall />}
                </button>
            </div>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ID Card */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block flex items-center gap-2">
                            <Shield size={14}/> ID de Utilizador
                        </label>
                        <div className="flex gap-2">
                            <input 
                                ref={inputRef}
                                type="text" 
                                value={user.id} 
                                readOnly
                                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono outline-none focus:border-blue-500/50 transition-colors"
                            />
                            <button 
                                onClick={handleCopy}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg transition-colors border border-slate-700"
                                title="Copiar ID"
                            >
                                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Subscription Card */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <CreditCard size={80} />
                        </div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block flex items-center gap-2">
                            <CreditCard size={14}/> Estado da Subscrição
                        </label>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isPro ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                                {isPro ? <Check size={24} /> : <AlertCircle size={24} />}
                            </div>
                            <div>
                                <div className={`text-lg font-bold ${isPro ? 'text-white' : 'text-slate-400'}`}>
                                    {isPro ? 'Plano Profissional' : 'Plano Gratuito'}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {isPro ? 'Acesso total vitalício' : 'Funcionalidades limitadas'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 flex items-center gap-3 text-slate-400 text-sm">
                    <Calendar size={16} />
                    <span>Membro desde <span className="text-slate-200 font-medium">{new Date(user.createdAt).toLocaleDateString()}</span></span>
                </div>
            </div>
          )}

          {/* COMPANY TAB */}
          {activeTab === 'company' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  
                  {/* Lock Overlay for Free Users */}
                  {!isPro && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-4 mb-6">
                          <div className="bg-amber-500/20 p-2 rounded-lg text-amber-500 shrink-0">
                              <LayoutTemplate size={24}/>
                          </div>
                          <div>
                              <h3 className="text-amber-200 font-bold text-sm mb-1">Personalização Bloqueada</h3>
                              <p className="text-xs text-amber-200/70 leading-relaxed">
                                  Faça upgrade para <strong>PRO</strong> para adicionar o logótipo e nome da sua empresa aos relatórios PDF. Dê um aspeto profissional aos seus orçamentos.
                              </p>
                          </div>
                      </div>
                  )}

                  <div className={!isPro ? 'opacity-40 pointer-events-none grayscale' : ''}>
                      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8">
                          
                          {/* Inputs */}
                          <div className="space-y-6">
                              <div>
                                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Nome da Empresa</label>
                                  <input 
                                    type="text" 
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder-slate-700"
                                    placeholder="Ex: Construções Silva, Lda"
                                  />
                                  <p className="text-[10px] text-slate-500 mt-2">Aparece como título principal nos PDFs.</p>
                              </div>

                              <div>
                                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Logótipo</label>
                                  <div className="flex gap-4 items-start">
                                      <div className="flex-1">
                                          <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/png, image/jpeg, image/webp"
                                            className="hidden"
                                          />
                                          <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-24 border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-slate-800/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group text-slate-500 hover:text-blue-400"
                                          >
                                              <Upload size={20} className="group-hover:scale-110 transition-transform"/>
                                              <span className="text-xs font-bold">Carregar Imagem</span>
                                          </button>
                                      </div>
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-2">Recomendado: PNG Transparente (200x100px).</p>
                              </div>
                          </div>

                          {/* Preview Area */}
                          <div className="bg-white rounded-xl overflow-hidden shadow-xl border border-slate-700 flex flex-col">
                              <div className="bg-slate-100 p-2 border-b border-slate-200 flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><LayoutTemplate size={10}/> Pré-visualização PDF</span>
                              </div>
                              <div className="p-6 flex-1 flex flex-col items-center justify-center text-center bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
                                  {logoPreview ? (
                                      <img src={logoPreview} alt="Logo Preview" className="h-16 object-contain mb-3" />
                                  ) : (
                                      <div className="h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300 mb-3 border border-slate-200">
                                          <span className="text-[10px] font-bold uppercase">Seu Logo</span>
                                      </div>
                                  )}
                                  
                                  <div className="w-full">
                                      {companyName ? (
                                          <h4 className="text-slate-900 font-black text-lg leading-tight break-words">{companyName}</h4>
                                      ) : (
                                          <h4 className="text-slate-300 font-bold text-lg leading-tight uppercase">Nome da Sua Empresa</h4>
                                      )}
                                      <div className="text-[8px] text-slate-400 font-bold uppercase mt-1">Relatório Técnico</div>
                                  </div>
                              </div>
                          </div>

                      </div>

                      {/* Error Message */}
                      {errorMessage && (
                          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-1">
                              <AlertCircle size={18} className="shrink-0" />
                              <div className="leading-relaxed font-medium">{errorMessage}</div>
                          </div>
                      )}

                      <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
                          <button 
                            onClick={handleSaveCompany}
                            disabled={saving}
                            className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all transform hover:-translate-y-0.5 ${
                                saveSuccess 
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                            }`}
                          >
                              {saving ? <Loader2 className="animate-spin" size={18}/> : saveSuccess ? <Check size={18}/> : <Save size={18}/>}
                              {saveSuccess ? 'Definições Guardadas!' : 'Guardar Alterações'}
                          </button>
                      </div>
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};

const LockIconSmall = () => (
    <div className="bg-slate-800 rounded p-0.5 ml-1">
        <div className="text-[8px] text-amber-500 font-bold px-1">PRO</div>
    </div>
);
