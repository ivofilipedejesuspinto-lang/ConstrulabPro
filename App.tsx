
import React, { useState, useEffect } from 'react';
import { UnitSystem, User, ProjectData, Project } from './types';
import { CanvasArea } from './components/CanvasArea';
import { VolumeMaterials } from './components/VolumeMaterials';
import { AdUnit } from './components/AdUnit';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ProfileModal } from './components/ProfileModal';
import { NotificationBanner, NotificationType } from './components/NotificationBanner';
import { SideCalculator } from './components/SideCalculator';
import { AuthService } from './services/authService';
import { ProjectService } from './services/projectService';
import { Construction, Crown, X, LogIn, LogOut, Shield, RefreshCw, Cloud, FolderOpen, Loader2, Clock, Trash2, Info, Ruler } from 'lucide-react';

const App: React.FC = () => {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(UnitSystem.SI);
  const [calculatedAreaM2, setCalculatedAreaM2] = useState<number>(0);
  
  // User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Payment State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // --- CLOUD / MODAL STATE ---
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState<string>(''); 
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [projectToLoad, setProjectToLoad] = useState<ProjectData | null>(null);

  // --- NOTIFICATION STATE ---
  const [notification, setNotification] = useState<{ msg: string; type: NotificationType } | null>(null);

  useEffect(() => {
    // Check for existing session in Supabase on load
    handleSyncSession();
  }, []);

  const handleSyncSession = async () => {
    setIsSyncing(true);
    try {
      const user = await AuthService.syncSession();
      if (user) {
        setCurrentUser(user);
      } else {
        // If session is invalid (e.g. after DB reset), clear everything
        setCurrentUser(null);
      }
    } catch (e) {
      console.error("Session sync error", e);
      setCurrentUser(null);
    } finally {
      setIsSyncing(false);
    }
  };

  const showNotification = (msg: string, type: NotificationType) => {
    setNotification({ msg, type });
  };

  const isPro = currentUser?.role === 'pro' || currentUser?.role === 'admin';

  const handleLogout = async () => {
    await AuthService.logout();
    setCurrentUser(null);
    setIsAdminPanelOpen(false);
    setIsProfileModalOpen(false);
    setCurrentProjectName('');
    showNotification("Sessão terminada.", 'info');
  };

  const handlePayment = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      setShowUpgradeModal(false);
      return;
    }

    try {
      await AuthService.simulatePaymentSuccess(currentUser.id);
      await handleSyncSession();
      setShowUpgradeModal(false);
      showNotification("Pagamento de 20€ realizado com sucesso! Bem-vindo ao Construlab PRO.", 'success');
    } catch (e) {
      showNotification("Erro ao processar pagamento.", 'error');
    }
  };

  // --- CLOUD HANDLERS ---

  // DIRECT SAVE HANDLER - Centralized Validation
  const onSaveRequest = async (data: ProjectData, name: string) => {
      // 1. Validation: Login
      if (!currentUser) {
          showNotification("Inicie sessão para guardar projetos na nuvem.", 'info');
          setIsAuthModalOpen(true);
          return;
      }

      // 2. Validation: Upgrade Check
      if (!isPro) {
          setShowUpgradeModal(true);
          showNotification("Funcionalidade PRO. Subscreva para guardar.", 'info');
          return;
      }

      // 3. Validation: Geometry
      if (!data.points || data.points.length < 3) {
          showNotification("Desenhe uma geometria fechada (mín. 3 pontos) antes de guardar.", 'error');
          return;
      }

      // 4. Validation: Name
      if (!name || !name.trim()) { 
        showNotification("Escreva o nome do projeto no topo da área de desenho.", 'error'); 
        return; 
      }
      
      setIsLoadingCloud(true);
      try {
          await ProjectService.saveProject(currentUser.id, name, data);
          setCurrentProjectName(name);
          showNotification(`Projeto "${name}" guardado com sucesso!`, 'success');
      } catch (e: any) {
          console.error(e);
          // Handle the "User not found" error that happens after DB reset
          if (e.message && (e.message.includes("violates foreign key") || e.message.includes("user_id"))) {
             showNotification("Erro de sessão. Por favor faça logout e entre novamente.", 'error');
          } else {
             showNotification("Erro ao guardar: " + e.message, 'error');
          }
      } finally {
          setIsLoadingCloud(false);
      }
  };

  const onLoadRequest = async () => {
      if (!currentUser) {
          showNotification("Inicie sessão para carregar projetos.", 'info');
          setIsAuthModalOpen(true);
          return;
      }
      if (!isPro) {
          setShowUpgradeModal(true);
          return;
      }

      setIsLoadingCloud(true);
      try {
          const list = await ProjectService.getUserProjects(currentUser.id);
          setProjectsList(list);
          setIsLoadModalOpen(true);
      } catch (e) {
          showNotification("Erro ao carregar lista. Tente sair e entrar novamente.", 'error');
      } finally {
          setIsLoadingCloud(false);
      }
  };

  const onConfirmLoad = (project: Project) => {
      setProjectToLoad(project.data);
      setCurrentProjectName(project.name); // Set active name
      setIsLoadModalOpen(false);
      showNotification(`Projeto "${project.name}" carregado.`, 'success');
  };

  const onDeleteProject = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm("Tem a certeza?")) return;
      try {
          await ProjectService.deleteProject(id);
          setProjectsList(prev => prev.filter(p => p.id !== id));
          showNotification("Projeto removido.", 'info');
      } catch (e) {
          showNotification("Erro ao apagar projeto.", 'error');
      }
  };


  if (isAdminPanelOpen && currentUser?.role === 'admin') {
    return <AdminDashboard currentUser={currentUser} onClose={() => setIsAdminPanelOpen(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-500 selection:text-white pb-20 print:pb-0 print:block relative">
      
      {/* Global Notification */}
      {notification && (
        <NotificationBanner 
          message={notification.msg} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      {/* Header - Hidden on Print */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/20">
                 <Construction className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white leading-tight tracking-tight">Construlab Pro</h1>
                <div className="text-xs text-blue-400 font-mono tracking-widest uppercase font-semibold">Calculadora Civil</div>
              </div>
            </div>
            <div className="hidden md:flex items-center ml-8 pl-8 border-l border-slate-700 h-10">
               <span className="text-base text-slate-400 font-light tracking-wide">Lages e Pilares</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
              <button 
                onClick={() => setUnitSystem(UnitSystem.SI)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${unitSystem === UnitSystem.SI ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Métrico
              </button>
              <button 
                onClick={() => setUnitSystem(UnitSystem.IMPERIAL)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${unitSystem === UnitSystem.IMPERIAL ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Imperial
              </button>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-3">
                 {currentUser.role === 'admin' && (
                    <button 
                      onClick={() => setIsAdminPanelOpen(true)} 
                      className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-full text-xs font-bold border border-red-500/20 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                      title="Painel Admin"
                    >
                      <Shield size={14} /> ADMIN
                    </button>
                 )}
                 {isPro ? (
                    <div className="flex items-center gap-1 bg-slate-800 text-amber-500 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-700 cursor-default">
                      <Crown size={14} fill="currentColor" />
                      PRO
                    </div>
                 ) : (
                    <button 
                      onClick={() => setShowUpgradeModal(true)}
                      className="hidden sm:flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg transition-all"
                    >
                      <Crown size={14} /> UPGRADE
                    </button>
                 )}
                 <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
                    <div className="hidden sm:flex flex-col items-end group relative cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
                        <span className="text-sm text-slate-300 font-medium leading-tight flex items-center gap-1 hover:text-blue-400 transition-colors">
                          {currentUser.name}
                        </span>
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${
                           currentUser.role === 'admin' ? 'text-red-500' : 
                           currentUser.role === 'pro' ? 'text-amber-500' : 'text-slate-500'
                        }`}>
                           {currentUser.role}
                        </span>
                    </div>
                    
                    <button 
                      onClick={handleSyncSession} 
                      className={`text-slate-500 hover:text-blue-400 transition-colors p-1.5 ${isSyncing ? 'animate-spin' : ''}`} 
                      title="Atualizar Perfil / Sincronizar"
                    >
                      <RefreshCw size={18} />
                    </button>

                    <button onClick={handleLogout} className="text-slate-500 hover:text-white transition-colors p-1.5" title="Sair">
                      <LogOut size={18} />
                    </button>
                 </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg text-sm font-bold border border-slate-700 transition-all"
              >
                <LogIn size={16} /> Entrar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container - Using Flex Column for structural spacing */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8 flex flex-col gap-8 print:block print:p-0 print:max-w-none">
        
        {/* TOP SECTION: Intro Text & Header Ad (Full Width) */}
        {/* This ensures the grid below starts aligned at the top */}
        <div className="flex flex-col gap-8 print:hidden">
            <AdUnit id="ad-top" slotType="header" isPro={isPro} />

            <div className="prose prose-invert prose-base max-w-none text-slate-400">
              <p>
                Utilize as ferramentas abaixo para desenhar a geometria do seu terreno ou laje e estimar os materiais necessários.
              </p>
            </div>
        </div>
        
        {/* GRID SECTION: Canvas/Volume vs Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          
          {/* Left Column Content */}
          <div className="flex flex-col gap-8 print:block">
            <CanvasArea 
              unitSystem={unitSystem} 
              onAreaCalculated={setCalculatedAreaM2} 
              isPro={isPro}
              onRequestUpgrade={() => setShowUpgradeModal(true)}
              onSaveRequest={onSaveRequest}
              onLoadRequest={onLoadRequest}
              externalLoadData={projectToLoad}
              projectName={currentProjectName}
            />
            
            <div className="print:hidden">
              <AdUnit id="ad-inline" slotType="inline" isPro={isPro} />
            </div>

            <VolumeMaterials 
              unitSystem={unitSystem} 
              importedAreaM2={calculatedAreaM2}
              isPro={isPro}
              onRequestUpgrade={() => setShowUpgradeModal(true)}
            />
          </div>

          {/* Right Column Content (Sidebar) */}
          <aside className="hidden lg:flex flex-col gap-6 print:hidden h-full">
             <AdUnit id="ad-sidebar" slotType="sidebar" isPro={isPro} />
             
             {/* Sticky Group: Conversions + Calculator */}
             <div className="sticky top-24 flex flex-col gap-6">
                
                {/* Conversions Box */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-lg">
                    <Ruler size={20} /> Conversões Rápidas
                  </h3>
                  <ul className="text-sm text-slate-400 space-y-3 font-mono">
                    <li className="flex justify-between border-b border-slate-800 pb-2"><span>1 m</span> <span className="text-slate-200">3.28 ft</span></li>
                    <li className="flex justify-between border-b border-slate-800 pb-2"><span>1 m²</span> <span className="text-slate-200">10.76 ft²</span></li>
                    <li className="flex justify-between border-b border-slate-800 pb-2"><span>1 m³</span> <span className="text-slate-200">35.31 ft³</span></li>
                    <li className="flex justify-between"><span>1 kg</span> <span className="text-slate-200">2.20 lb</span></li>
                  </ul>
                </div>

                {/* Calculator Box */}
                <SideCalculator />
             </div>
          </aside>

        </div>

        {/* BOTTOM SECTION: Legal Warning (Full Width) */}
        {/* This sits below the grid, aligned with the full container width */}
        <div className="p-6 border border-yellow-900/50 bg-yellow-900/10 rounded-xl flex gap-4 print:hidden">
             <Info className="text-yellow-600 flex-shrink-0" size={28} />
             <div className="text-base text-yellow-500/80 leading-relaxed">
               <strong>Aviso Legal:</strong> Esta ferramenta fornece estimativas orientativas baseadas em rácios médios. Verifique sempre as normas locais e consulte um engenheiro antes de iniciar a obra.
             </div>
        </div>

      </main>

      {/* Footer - Hidden on Print */}
      <footer className="border-t border-slate-800 mt-16 py-10 bg-slate-950 print:hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-base">
            © {new Date().getFullYear()} Construlab Pro. Desenvolvido por Ivo Pinto • Criado com Google AI Studio
          </p>
        </div>
      </footer>

      {/* --- GLOBAL MODALS --- */}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (showUpgradeModal) setShowUpgradeModal(true);
        }}
      />
      
      {currentUser && (
        <ProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={currentUser}
        />
      )}

      {/* LOAD MODAL */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl p-6 relative">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-bold text-white flex items-center gap-3"><FolderOpen size={22} className="text-blue-500"/> Meus Projetos</h3>
                     <button onClick={() => setIsLoadModalOpen(false)}><X className="text-slate-400 hover:text-white" size={24}/></button>
                 </div>
                 
                 <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                     {isLoadingCloud ? (
                         <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500"/></div>
                     ) : projectsList.length === 0 ? (
                         <div className="text-center py-12 text-slate-500 text-base">Sem projetos guardados.</div>
                     ) : (
                         projectsList.map(p => (
                             <div key={p.id} onClick={() => onConfirmLoad(p)} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer flex justify-between items-center group transition-colors border border-transparent hover:border-slate-600">
                                 <div>
                                     <div className="text-base font-bold text-white mb-1">{p.name}</div>
                                     <div className="text-xs text-slate-500 flex items-center gap-2">
                                         <Clock size={12}/> {new Date(p.created_at || Date.now()).toLocaleDateString()}
                                         <span className="mx-1">•</span>
                                         {p.data.points.length} pontos
                                     </div>
                                 </div>
                                 <button onClick={(e) => onDeleteProject(p.id, e)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                     <Trash2 size={18} />
                                 </button>
                             </div>
                         ))
                     )}
                 </div>
             </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-sm print:hidden">
           <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
             <button 
               onClick={() => setShowUpgradeModal(false)}
               className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
             >
               <X size={24} />
             </button>
             <div className="p-8 text-center">
               <div className="bg-amber-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
                 <Crown size={40} fill="currentColor" />
               </div>
               <h2 className="text-3xl font-bold text-white mb-2">Plano Construlab PRO</h2>
               <div className="text-5xl font-bold text-white mb-2 mt-6">20€ <span className="text-lg font-normal text-slate-400">/ ano</span></div>
               <p className="text-slate-400 text-sm mb-8">IVA incluído. Acesso imediato.</p>
               <ul className="text-left text-base text-slate-300 space-y-4 mb-8 bg-slate-950/50 p-6 rounded-xl">
                 <li className="flex items-center gap-3"><span className="text-green-400 font-bold">✓</span> Sem anúncios</li>
                 <li className="flex items-center gap-3"><span className="text-green-400 font-bold">✓</span> Exportar relatório PDF</li>
                 <li className="flex items-center gap-3"><span className="text-green-400 font-bold">✓</span> Enviar por Email</li>
                 <li className="flex items-center gap-3"><span className="text-green-400 font-bold">✓</span> Guardar Projetos na Nuvem</li>
               </ul>
               <button 
                 onClick={handlePayment}
                 className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 text-white text-lg font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all transform hover:-translate-y-1"
               >
                 Subscrever Agora
               </button>
               <p className="text-xs text-slate-600 mt-6 flex justify-center items-center gap-2">
                 <Shield size={12} /> Pagamento seguro via Stripe
               </p>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
