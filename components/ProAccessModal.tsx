
import React, { useState } from 'react';
import { User } from '../types';
import { AuthService } from '../services/authService';
import { X, LogIn, UserPlus, Loader2, Lock, AlertCircle, Crown, Check, Shield, Star, Sparkles, Clock, Building2 } from 'lucide-react';

interface ProAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLoginSuccess: (user: User) => void;
  onPaymentSuccess: () => void;
}

export const ProAccessModal: React.FC<ProAccessModalProps> = ({ 
    isOpen, 
    onClose, 
    user, 
    onLoginSuccess,
    onPaymentSuccess
}) => {
  // Auth State
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Payment/Trial State
  const [trialLoading, setTrialLoading] = useState(false);

  if (!isOpen) return null;

  // --- AUTH HANDLERS ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    if (password.length < 6) {
      setAuthError('A password deve ter pelo menos 6 caracteres.');
      setAuthLoading(false);
      return;
    }

    try {
      let loggedUser;
      if (isLogin) {
        loggedUser = await AuthService.login(email, password);
      } else {
        loggedUser = await AuthService.register(email, password, name);
      }
      
      onLoginSuccess(loggedUser);
      
      // CRITICAL UPDATE: Redirect logic
      // Se for PRO ou ADMIN, fecha a modal imediatamente para ir para a App.
      if (loggedUser.role === 'pro' || loggedUser.role === 'admin') {
          onClose();
          return;
      }

      // Se for Free, mantemos aberto para tentar vender o Upgrade (User Experience de conversão)
      
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = err.message || "Erro desconhecido";
      if (msg.includes("Invalid login")) msg = "Email ou password incorretos.";
      else if (msg.includes("already registered")) msg = "Este email já está registado.";
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // --- TRIAL HANDLER ---
  const handleStartTrial = async () => {
      if (!user) {
          setAuthError("Por favor, crie conta ou inicie sessão primeiro para ativar o trial.");
          return;
      }

      setTrialLoading(true);
      try {
          await AuthService.activateTrial(user.id);
          // Refresh session to get new role
          const updatedUser = await AuthService.syncSession();
          if (updatedUser) {
              onLoginSuccess(updatedUser);
              // Auto close on trial start
              onClose();
          }
      } catch (e) {
          alert("Erro ao ativar trial.");
      } finally {
          setTrialLoading(false);
      }
  };

  const isProActive = user?.role === 'pro' || user?.role === 'admin';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl shadow-2xl relative flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-300 my-auto">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white z-50 p-2 bg-slate-800/50 rounded-full transition-colors">
          <X size={20} />
        </button>

        {/* LEFT SIDE: AUTH MODULE */}
        <div className="w-full md:w-1/2 p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900 flex flex-col justify-center relative">
            
            {user ? (
                // LOGGED IN STATE
                <div className="text-center py-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-900/20">
                        <span className="text-3xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Olá, {user.name}!</h2>
                    <p className="text-slate-400 mb-8">{user.email}</p>
                    
                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 mb-6 text-left">
                        <div className="flex items-center gap-3 mb-2">
                            <Check className="text-emerald-500" size={16}/>
                            <span className="text-slate-300 text-sm">Conta criada com sucesso</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {isProActive ? (
                                <>
                                    <Check className="text-emerald-500" size={16}/>
                                    <span className="text-slate-300 text-sm">Plano PRO Ativo</span>
                                    {user.subscriptionStatus === 'trial' && <span className="text-[10px] bg-blue-600 px-1.5 rounded text-white ml-2">Trial</span>}
                                </>
                            ) : (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-slate-600"></div>
                                    <span className="text-slate-500 text-sm">A aguardar subscrição PRO...</span>
                                </>
                            )}
                        </div>
                    </div>

                    {!isProActive && (
                       <p className="text-blue-400 text-sm font-bold animate-pulse">
                           Complete a subscrição ao lado &rarr;
                       </p>
                    )}
                </div>
            ) : (
                // LOGGED OUT STATE (FORM)
                <>
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">{isLogin ? 'Bem-vindo de volta' : 'Crie a sua conta'}</h2>
                        <p className="text-slate-400">
                            {isLogin ? 'Aceda aos seus projetos e configurações.' : 'Registe-se para começar a desenhar.'}
                        </p>
                    </div>

                    <form onSubmit={handleAuthSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Nome</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 outline-none transition-all focus:ring-1 focus:ring-blue-500/50"
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Email</label>
                            <input 
                                type="email" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 outline-none transition-all focus:ring-1 focus:ring-blue-500/50"
                                placeholder="exemplo@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Password</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 outline-none pr-10 transition-all focus:ring-1 focus:ring-blue-500/50"
                                    placeholder="••••••"
                                />
                                <Lock className="absolute right-3.5 top-4 text-slate-600" size={18} />
                            </div>
                        </div>

                        {authError && (
                            <div className="bg-red-950/30 p-3 rounded-lg border border-red-900/50 flex items-start gap-3">
                                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                                <div className="text-red-300 text-xs leading-relaxed">{authError}</div>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={authLoading}
                            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {authLoading ? <Loader2 size={20} className="animate-spin" /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
                            {isLogin ? 'Entrar na Conta' : 'Criar Conta Grátis'}
                        </button>
                    </form>
                    
                    <div className="mt-6 pt-6 border-t border-slate-800/50 text-center">
                        <button 
                            onClick={() => { setIsLogin(!isLogin); setAuthError(''); }}
                            className="text-sm text-slate-400 hover:text-white hover:underline transition-colors"
                        >
                            {isLogin ? 'Ainda não tem conta? Registe-se aqui.' : 'Já tem conta? Faça login.'}
                        </button>
                    </div>
                </>
            )}
        </div>

        {/* RIGHT SIDE: UPGRADE MODULE (STRATEGY LAUNCH) */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-slate-900 to-slate-950 relative overflow-hidden flex flex-col">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-900/0 to-transparent pointer-events-none"></div>
            
            <div className="p-8 md:p-12 flex-1 flex flex-col relative z-10">
                <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <div className="bg-amber-500/20 p-2.5 rounded-xl border border-amber-500/20 text-amber-500 shadow-lg shadow-amber-900/20">
                            <Crown size={28} fill="currentColor" />
                        </div>
                        <div className="flex flex-col">
                             <span className="text-amber-500 font-bold tracking-widest text-xs uppercase">Oferta de Lançamento</span>
                             <h2 className="text-2xl font-bold text-white">CalcConstruPRO</h2>
                        </div>
                    </div>
                    {/* Early Bird Badge */}
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-lg border border-white/10 animate-pulse">
                        POUPE 20%
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-slate-400 text-sm mb-4">Acesso vitalício a todas as ferramentas profissionais.</p>
                    <div className="flex items-end gap-3">
                        <span className="text-6xl font-bold text-white tracking-tighter">€19,99</span>
                        <div className="flex flex-col mb-1.5">
                            <span className="text-slate-500 text-lg font-bold line-through decoration-red-500/50 decoration-2">€24,99</span>
                            <span className="text-amber-500 text-xl font-black uppercase tracking-widest drop-shadow-sm">Vitalício</span>
                        </div>
                    </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center gap-3">
                        <div className="bg-emerald-500/20 p-1 rounded-full"><Check size={12} className="text-emerald-400" strokeWidth={3}/></div>
                        <span className="text-slate-300 text-sm">Guardar projetos ilimitados na nuvem</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="bg-emerald-500/20 p-1 rounded-full"><Check size={12} className="text-emerald-400" strokeWidth={3}/></div>
                        <span className="text-slate-300 text-sm">Personalização de Marca (Logo e Nome)</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="bg-emerald-500/20 p-1 rounded-full"><Check size={12} className="text-emerald-400" strokeWidth={3}/></div>
                        <span className="text-slate-300 text-sm">Exportar relatórios PDF sem marcas d'água</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="bg-emerald-500/20 p-1 rounded-full"><Check size={12} className="text-emerald-400" strokeWidth={3}/></div>
                        <span className="text-slate-300 text-sm">Detalhes avançados de armaduras</span>
                    </li>
                </ul>

                <div className="space-y-4">
                    {/* STRIPE BUTTON INTEGRATION */}
                    {!isProActive ? (
                        <div className="w-full">
                            {user ? (
                                // @ts-ignore
                                <stripe-buy-button
                                  buy-button-id="buy_btn_1Sb7BQBlnpClJ5RnVXqoGuEA"
                                  publishable-key="pk_live_51SaySiBlnpClJ5RnScxFmO8sktLkCAKYVfXHPCtpqktwNUxsCdMhNS6ihZzwNCuyLw00TEaZGOYLqRUVNnkSLXeX00eYoJ2h7Q"
                                  client-reference-id={user.id}
                                  customer-email={user.email}
                                >
                                </stripe-buy-button>
                            ) : (
                                <div className="text-center p-3 border border-dashed border-slate-700 rounded-xl bg-slate-900/50 text-slate-400 text-sm mb-2">
                                    <Lock size={16} className="inline mr-2 mb-0.5"/>
                                    Crie conta para desbloquear o pagamento
                                </div>
                            )}
                        </div>
                    ) : (
                         <div className="w-full py-3.5 rounded-xl text-lg font-bold bg-emerald-600/20 text-emerald-500 border border-emerald-600/30 flex items-center justify-center gap-2 cursor-default">
                             <Check size={24}/> Plano Vitalício Ativo
                         </div>
                    )}

                    {!isProActive && (
                        <button 
                            onClick={handleStartTrial}
                            disabled={trialLoading || !user}
                            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${!user ? 'opacity-50 cursor-not-allowed text-slate-600' : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700'}`}
                        >
                             {trialLoading ? <Loader2 className="animate-spin" size={16}/> : <><Clock size={16}/> Testar Grátis por 7 Dias</>}
                        </button>
                    )}
                </div>
                
                <p className="text-center text-[10px] text-slate-600 mt-4 flex items-center justify-center gap-2">
                    <Shield size={10}/> Pagamento seguro via Stripe • Acesso Imediato
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};
