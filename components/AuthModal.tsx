
import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { User } from '../types';
import { X, LogIn, UserPlus, Loader2, Lock, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Only for register
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const getErrorMessage = (err: any) => {
    if (!err) return "Erro desconhecido";
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    return "Erro ao processar pedido.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      let user;
      if (isLogin) {
        user = await AuthService.login(email, password);
      } else {
        user = await AuthService.register(email, password, name);
      }
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = getErrorMessage(err);

      if (msg.includes("Invalid login")) msg = "Email ou password incorretos.";
      else if (msg.includes("already registered")) msg = "Este email já está registado.";
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={24} />
        </button>

        <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white">{isLogin ? 'Bem-vindo' : 'Criar Conta'}</h2>
              <p className="text-slate-400 text-sm mt-2">
                {isLogin ? 'Aceda à sua conta CalcConstruPRO' : 'Junte-se para guardar projetos e mais.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-1.5">Nome</label>
                  <input 
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-base text-white focus:border-blue-500 outline-none"
                    placeholder="Seu Nome"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-1.5">Email</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-base text-white focus:border-blue-500 outline-none"
                  placeholder="exemplo@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-500 mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-base text-white focus:border-blue-500 outline-none pr-10"
                    placeholder="••••••"
                  />
                  <Lock className="absolute right-3 top-3.5 text-slate-600" size={18} />
                </div>
              </div>

              {error && (
                <div className="bg-red-950/30 p-4 rounded-lg border border-red-900/50 flex items-start gap-3">
                  <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                  <div className="text-red-300 text-xs leading-relaxed break-words">{error}</div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-blue-900/20"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
                {isLogin ? 'Entrar' : 'Registar'}
              </button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-sm text-blue-400 hover:text-blue-300 hover:underline font-medium"
              >
                {isLogin ? 'Não tem conta? Crie uma aqui.' : 'Já tem conta? Faça login.'}
              </button>
            </div>
          </div>
      </div>
    </div>
  );
};
