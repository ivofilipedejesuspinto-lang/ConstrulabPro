
import React, { useEffect, useState } from 'react';
import { AuthService } from '../services/authService';
import { User, UserRole } from '../types';
import { Shield, Search, User as UserIcon, CheckCircle, XCircle, AlertTriangle, RefreshCw, X, Trash2, Ban, Edit, Save } from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', companyName: '', role: 'free' as UserRole });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await AuthService.getAllUsers();
      setUsers(data);
    } catch (e) {
      console.error("Erro ao carregar utilizadores", e);
      setNotification({ msg: "Erro de conexão.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleEditClick = (user: User) => {
      setEditingUser(user);
      setEditForm({
          name: user.name,
          companyName: user.companyName || '',
          role: user.role
      });
  };

  const handleSaveEdit = async () => {
      if (!editingUser) return;
      setSavingEdit(true);
      try {
          // 1. Update Profile Details
          await AuthService.adminUpdateUserProfile(editingUser.id, {
              name: editForm.name,
              companyName: editForm.companyName
          });

          // 2. Update Role (if changed)
          if (editForm.role !== editingUser.role) {
              await AuthService.updateUserRole(editingUser.id, editForm.role);
          }

          setNotification({ msg: "Utilizador atualizado!", type: 'success' });
          setEditingUser(null);
          fetchUsers();
      } catch (e) {
          setNotification({ msg: "Erro ao guardar alterações.", type: 'error' });
      } finally {
          setSavingEdit(false);
      }
  };

  const handleRoleChangeDirect = async (userId: string, newRole: UserRole) => {
    try {
      await AuthService.updateUserRole(userId, newRole);
      setNotification({ msg: `Cargo alterado para ${newRole.toUpperCase()}`, type: 'success' });
      fetchUsers();
    } catch (e) {
      setNotification({ msg: "Erro ao atualizar.", type: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
      if (!window.confirm("ATENÇÃO: Isto apagará PERMANENTEMENTE o perfil, projetos e dados do utilizador. Continuar?")) return;
      
      try {
          await AuthService.deleteUser(userId);
          setNotification({ msg: "Utilizador removido.", type: 'success' });
          fetchUsers();
      } catch (e) {
          setNotification({ msg: "Erro ao remover.", type: 'error' });
      }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in slide-in-from-bottom-5 duration-300">
      
      {/* Toast */}
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[150] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-2 fade-in ${
          notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
           {notification.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
           {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/10 p-2 rounded-lg text-red-500 border border-red-500/20">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Gestão de Utilizadores
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Super Admin</span>
            </h1>
            <p className="text-xs text-slate-400">Total: {users.length} registos.</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={fetchUsers} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white transition-colors border border-slate-700">
                Sair
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto max-w-7xl mx-auto w-full relative">
        
        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar utilizadores..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950/50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="p-4">Utilizador</th>
                <th className="p-4">Cargo (Role)</th>
                <th className="p-4">Empresa (White-Label)</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center flex justify-center items-center gap-2"><RefreshCw className="animate-spin" size={16}/> A carregar...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-600">Nada encontrado.</td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className={`hover:bg-slate-800/30 transition-colors ${user.role === 'banned' ? 'bg-red-950/10 grayscale' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-300 ${user.role === 'admin' ? 'bg-red-900/30 text-red-400' : 'bg-slate-800'}`}>
                         {user.role === 'admin' ? <Shield size={14}/> : <UserIcon size={14} />}
                      </div>
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                            {user.name}
                            {user.id === currentUser.id && <span className="text-[9px] bg-blue-600/20 text-blue-400 px-1.5 rounded">Eu</span>}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChangeDirect(user.id, e.target.value as UserRole)}
                        className={`bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-bold uppercase focus:outline-none focus:border-blue-500 ${
                            user.role === 'admin' ? 'text-red-400 border-red-900/50' :
                            user.role === 'pro' ? 'text-amber-400 border-amber-900/50' :
                            user.role === 'banned' ? 'text-slate-500 line-through' :
                            'text-slate-300'
                        }`}
                        disabled={user.id === currentUser.id}
                    >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="admin">Admin</option>
                        <option value="banned">Banido</option>
                    </select>
                  </td>
                  <td className="p-4">
                      {user.companyName ? (
                          <span className="text-white font-medium">{user.companyName}</span>
                      ) : (
                          <span className="text-slate-600 italic text-xs">Não definido</span>
                      )}
                  </td>
                  <td className="p-4">
                    {user.role === 'banned' ? 
                       <span className="flex items-center gap-1.5 text-red-500 bg-red-950/30 w-fit px-2 py-0.5 rounded-full text-[10px] font-medium"><Ban size={10} /> BANIDO</span>
                    : user.subscriptionStatus === 'active' 
                      ? <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/30 w-fit px-2 py-0.5 rounded-full text-[10px] font-medium"><CheckCircle size={10} /> Ativo</span>
                      : <span className="flex items-center gap-1.5 text-slate-500"><XCircle size={12} /> Inativo</span>
                    }
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                       {/* Edit Button */}
                       <button 
                         onClick={() => handleEditClick(user)}
                         className="p-1.5 rounded hover:bg-blue-600/20 hover:text-blue-400 text-slate-500 transition-colors"
                         title="Editar Detalhes"
                       >
                           <Edit size={16} />
                       </button>

                       {/* Delete Button */}
                       {user.id !== currentUser.id && (
                           <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 rounded hover:bg-red-600 hover:text-white text-slate-600 transition-colors" 
                            title="Remover Perfil"
                           >
                            <Trash2 size={16} />
                           </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* EDIT MODAL */}
        {editingUser && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Editar Utilizador</h3>
                        <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Email (Read Only)</label>
                            <input type="text" value={editingUser.email} disabled className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-500 mt-1 cursor-not-allowed"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
                            <input 
                                type="text" 
                                value={editForm.name} 
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Empresa (White-Label)</label>
                            <input 
                                type="text" 
                                value={editForm.companyName} 
                                onChange={e => setEditForm({...editForm, companyName: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none mt-1"
                                placeholder="Nome da Empresa"
                            />
                        </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Cargo</label>
                            <select 
                                value={editForm.role}
                                onChange={e => setEditForm({...editForm, role: e.target.value as UserRole})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none mt-1"
                            >
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="admin">Admin</option>
                                <option value="banned">Banido</option>
                            </select>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button onClick={() => setEditingUser(null)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-800">Cancelar</button>
                            <button onClick={handleSaveEdit} disabled={savingEdit} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 flex items-center justify-center gap-2">
                                {savingEdit ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>} Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
