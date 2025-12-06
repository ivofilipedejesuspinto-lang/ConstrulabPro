import React, { useState, useEffect, useMemo } from 'react';
import { UnitSystem, User, ProjectData, Project, MaterialConfig } from './types';
import { CanvasArea } from './components/CanvasArea';
import { DimensionsCard, MaterialsCard } from './components/VolumeMaterials';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { AdUnit } from './components/AdUnit';
import { AdminDashboard } from './components/AdminDashboard';
import { ProfileModal } from './components/ProfileModal';
import { NotificationBanner, NotificationType } from './components/NotificationBanner';
import { SideCalculator } from './components/SideCalculator';
import { NavigationMenu } from './components/NavigationMenu';
import { AboutPage, ContactPage, FaqPage, PrivacyPage, TermsPage, RoadmapPage } from './components/StaticPages';
import { ProAccessModal } from './components/ProAccessModal';
import { AuthService } from './services/authService';
import { ProjectService } from './services/projectService';
import { Logo } from './components/Logo';
import { LanguageSelector } from './components/LanguageSelector';
import { useLanguage } from './contexts/LanguageContext';
import { ADSENSE_CONFIG, DEFAULT_MATERIALS } from './constants';
import { Crown, X, LogIn, LogOut, Shield, RefreshCw, Cloud, FolderOpen, Loader2, Clock, Trash2, Info, Menu, Sparkles, Code } from 'lucide-react';
import { convertValue } from './utils/math';

const App: React.FC = () => {
  const { t } = useLanguage();
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(UnitSystem.SI);
  
  // --- STATE ---
  const [calculatedAreaM2, setCalculatedAreaM2] = useState<number>(0); // Sempre em m2
  const [mode, setMode] = useState<'box' | 'slab'>('slab');
  const [length, setLength] = useState<string>('0');
  const [width, setWidth] = useState<string>('0');
  const [height, setHeight] = useState<string>('0');
  const [config, setConfig] = useState<MaterialConfig>(DEFAULT_MATERIALS);
  const [showConfig, setShowConfig] = useState(false);
  const [showSteelDetails, setShowSteelDetails] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [volumeM3, setVolumeM3] = useState(0);

  // User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProAccessModalOpen, setIsProAccessModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Navigation / Page State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState<string | null>(null);

  // --- CLOUD / MODAL STATE ---
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState<string>(''); 
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [projectToLoad, setProjectToLoad] = useState<ProjectData | null>(null);

  // --- NOTIFICATION STATE ---
  const [notification, setNotification] = useState<{ msg: string; type: NotificationType } | null>(null);

  // --- CALCULATIONS LOGIC ---
  
  // Converter inputs para Metros (SI) se estiver em Imperial
  const getValueInMeters = (valStr: string) => {
      const val = parseFloat(valStr) || 0;
      if (unitSystem === UnitSystem.IMPERIAL) {
          return val * 0.3048; // ft to m
      }
      return val;
  };

  const currentAreaM2 = useMemo(() => {
    if (mode === 'slab') return calculatedAreaM2;
    // Box Mode: Calcular área baseada nos inputs (convertidos)
    const l = getValueInMeters(length);
    const w = getValueInMeters(width);
    return l * w;
  }, [mode, calculatedAreaM2, length, width, unitSystem]);

  useEffect(() => {
    let vol = 0;
    const h = getValueInMeters(height);

    if (mode === 'slab') {
       vol = calculatedAreaM2 * h;
    } else {
       const l = getValueInMeters(length);
       const w = getValueInMeters(width);
       vol = l * w * h;
    }
    setVolumeM3(vol);
  }, [length, width, height, calculatedAreaM2, mode, unitSystem]);

  const matCementKg = volumeM3 * config.cementKgPerM3;
  const matSand = volumeM3 * config.sandM3PerM3;
  const matGravel = volumeM3 * config.gravelM3PerM3;
  const matWater = volumeM3 * config.waterLPerM3;
  const matSteelMin = volumeM3 * config.steelKgPerM3Min;
  const matSteelMax = volumeM3 * config.steelKgPerM3Max;
  const bags = Math.ceil(matCementKg / 25);

  const steelBreakdown = useMemo(() => {
      const avgSteel = (matSteelMin + matSteelMax) / 2;
      
      if (mode === 'slab') {
          return {
              type: t('slabMesh'),
              parts: [
                  { name: `${t('mesh')} (Inf/Sup)`, detail: 'Ø10 - Ø12 // 15-20cm', weight: avgSteel * 0.6 },
                  { name: `${t('dist')} / Cavaletes`, detail: 'Ø8 // 20-25cm', weight: avgSteel * 0.4 }
              ]
          };
      } else {
          return {
              type: t('beamPillar'),
              parts: [
                  { name: `${t('long')} (Varões)`, detail: '4x - 8x Ø12 - Ø20', weight: avgSteel * 0.7 },
                  { name: `${t('stirrups')} (Cinta)`, detail: 'Ø6 - Ø8 // 15cm', weight: avgSteel * 0.3 }
              ]
          };
      }
  }, [mode, matSteelMin, matSteelMax, t]);

  useEffect(() => {
    const initApp = async () => {
        const user = await handleSyncSession();
        trackUsage(user);

        const params = new URLSearchParams(window.location.search);
        if (params.get('payment') === 'success') {
            if (user) {
                try {
                    await AuthService.simulatePaymentSuccess(user.id);
                    await handleSyncSession(); 
                    showNotification("Pagamento confirmado! Acesso VITALÍCIO ativado.", 'success');
                } catch (e) {
                    console.error(e);
                    showNotification("Pagamento recebido! Se o PRO não ativar em instantes, contacte o suporte.", 'success');
                }
            }
            window.history.replaceState({}, document.title, window.location.pathname);
            setIsProAccessModalOpen(false);
        }
    };
    initApp();
  }, []);

  const trackUsage = (user: User | null) => {
      const isPro = user?.role === 'pro' || user?.role === 'admin';
      
      if (!isPro) {
          const visits = Number(localStorage.getItem('calcconstrupro_visits') || 0) + 1;
          localStorage.setItem('calcconstrupro_visits', visits.toString());
          
          if (visits === 3) {
              setTimeout(() => setIsProAccessModalOpen(true), 2000);
          }
      }
  };

  const handleSyncSession = async () => {
    setIsSyncing(true);
    try {
      const user = await AuthService.syncSession();
      if (user) {
        setCurrentUser(user);
        return user;
      } else {
        setCurrentUser(null);
        return null;
      }
    } catch (e) {
      console.error("Session sync error", e);
      setCurrentUser(null);
      return null;
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

  const handlePaymentSuccess = async () => {
      await handleSyncSession();
      showNotification("Acesso VITALÍCIO ativado! Bem-vindo ao clube CalcConstruPRO.", 'success');
  };

  // --- CLOUD HANDLERS ---
  const onSaveRequest = async (data: ProjectData, name: string) => {
      if (!currentUser || !isPro) {
          setIsProAccessModalOpen(true);
          if (!currentUser) showNotification("Crie conta ou inicie sessão para continuar.", 'info');
          else showNotification("Funcionalidade exclusiva para membros PRO.", 'info');
          return;
      }

      if (!data.points || data.points.length < 3) {
          showNotification("Desenhe uma geometria fechada (mín. 3 pontos) antes de guardar.", 'error');
          return;
      }

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
      if (!currentUser || !isPro) {
          setIsProAccessModalOpen(true);
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
      setCurrentProjectName(project.name);
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

  const handlePageNavigation = (pageId: string) => {
      if (pageId === 'home') {
          setActivePage(null);
      } else if (pageId === 'client-area') {
          if (currentUser) {
             setIsProfileModalOpen(true);
          } else {
             showNotification("Inicie sessão para aceder à Área de Cliente.", 'info');
             setIsProAccessModalOpen(true);
          }
      } else {
          setActivePage(pageId);
      }
  };

  if (isAdminPanelOpen && currentUser?.role === 'admin') {
    return <AdminDashboard currentUser={currentUser} onClose={() => setIsAdminPanelOpen(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-500 selection:text-white pb-20 print:pb-0 print:block relative">
      
      {notification && (
        <NotificationBanner 
          message={notification.msg} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      <NavigationMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onNavigate={handlePageNavigation}
        activePage={activePage}
      />

      {/* Static Pages & Modals */}
      {activePage === 'about' && <AboutPage onClose={() => setActivePage(null)} />}
      {activePage === 'faq' && <FaqPage onClose={() => setActivePage(null)} />}
      {activePage === 'contact' && <ContactPage onClose={() => setActivePage(null)} />}
      {activePage === 'terms' && <TermsPage onClose={() => setActivePage(null)} />}
      {activePage === 'privacy' && <PrivacyPage onClose={() => setActivePage(null)} />}
      {activePage === 'roadmap' && <RoadmapPage onClose={() => setActivePage(null)} />}
      
      {/* CALCULATOR MODAL */}
      {activePage === 'calculator' && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200" onClick={() => setActivePage(null)}>
           <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
               <button 
                  onClick={() => setActivePage(null)}
                  className="absolute -top-12 right-0 md:-right-12 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full transition-colors"
               >
                  <X size={24} />
               </button>
               <SideCalculator />
           </div>
        </div>
      )}

      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 print:hidden">
        <div className="max-w-[1500px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title={t('menu')}
            >
                <Menu size={24} />
            </button>
            <div className="pl-4 border-l border-slate-700">
              <Logo className="h-9" />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <LanguageSelector />
            <div className="hidden md:flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
              <button onClick={() => setUnitSystem(UnitSystem.SI)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${unitSystem === UnitSystem.SI ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>{t('metric')}</button>
              <button onClick={() => setUnitSystem(UnitSystem.IMPERIAL)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${unitSystem === UnitSystem.IMPERIAL ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>{t('imperial')}</button>
            </div>
            {currentUser ? (
              <div className="flex items-center gap-3">
                 {currentUser.role === 'admin' && (
                    <button onClick={() => setIsAdminPanelOpen(true)} className="hidden md:flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-full text-xs font-bold border border-red-500/20 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]" title="Painel Admin"><Shield size={14} /> {t('admin')}</button>
                 )}
                 {isPro ? (
                    <div className="flex items-center gap-1 bg-slate-800 text-amber-500 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-700 cursor-default"><Crown size={14} fill="currentColor" /> PRO</div>
                 ) : (
                    <button onClick={() => setIsProAccessModalOpen(true)} className="hidden sm:flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg transition-all"><Crown size={14} /> {t('upgrade')}</button>
                 )}
                 <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
                    <div className="hidden sm:flex flex-col items-end group relative cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
                        <span className="text-sm text-slate-300 font-medium leading-tight flex items-center gap-1 hover:text-blue-400 transition-colors">{currentUser.name}</span>
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${currentUser.role === 'admin' ? 'text-red-500' : currentUser.role === 'pro' ? 'text-amber-500' : 'text-slate-500'}`}>{currentUser.role}</span>
                    </div>
                    <button onClick={handleSyncSession} className={`text-slate-500 hover:text-blue-400 transition-colors p-1.5 ${isSyncing ? 'animate-spin' : ''}`} title="Atualizar"><RefreshCw size={18} /></button>
                    <button onClick={handleLogout} className="text-slate-500 hover:text-white transition-colors p-1.5" title={t('logout')}><LogOut size={18} /></button>
                 </div>
              </div>
            ) : (
              <button onClick={() => setIsProAccessModalOpen(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-blue-600 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-900/20 text-white px-5 py-2 rounded-lg text-sm font-bold border border-slate-700 transition-all"><LogIn size={16} /> {t('login')}</button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1500px] mx-auto w-full p-6 md:p-8 flex flex-col gap-8 print:block print:p-0 print:max-w-none">
        
        <div className="flex flex-col gap-8 print:hidden">
            <AdUnit id={ADSENSE_CONFIG.SLOTS.HEADER} slotType="header" isPro={isPro} />
        </div>
        
        {/* FINAL 3-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* COLUMN 1: Canvas (Left) */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            <CanvasArea 
              unitSystem={unitSystem} 
              onAreaCalculated={setCalculatedAreaM2} 
              isPro={isPro}
              onRequestUpgrade={() => setIsProAccessModalOpen(true)}
              onSaveRequest={onSaveRequest}
              onLoadRequest={onLoadRequest}
              externalLoadData={projectToLoad}
              projectName={currentProjectName}
            />
            
            <div className="print:hidden">
              <AdUnit id={ADSENSE_CONFIG.SLOTS.INLINE} slotType="inline" isPro={isPro} />
            </div>
          </div>

          {/* COLUMN 2: Dimensions (Middle) */}
          <div className="xl:col-span-1 flex flex-col h-full">
            <DimensionsCard 
                unitSystem={unitSystem}
                mode={mode}
                setMode={setMode}
                length={length}
                setLength={setLength}
                width={width}
                setWidth={setWidth}
                height={height}
                setHeight={setHeight}
                volumeM3={volumeM3}
                currentAreaM2={currentAreaM2}
            />
          </div>

          {/* COLUMN 3: Materials & Ad (Right) */}
          <div className="xl:col-span-1 flex flex-col gap-6 h-full">
             <MaterialsCard 
                unitSystem={unitSystem}
                config={config}
                setConfig={setConfig}
                showConfig={showConfig}
                setShowConfig={setShowConfig}
                matCementKg={matCementKg}
                matSand={matSand}
                matGravel={matGravel}
                matWater={matWater}
                matSteelMin={matSteelMin}
                matSteelMax={matSteelMax}
                bags={bags}
                isPro={isPro}
                onRequestUpgrade={() => setIsProAccessModalOpen(true)}
                onPrint={() => setShowPrintPreview(true)}
                steelBreakdown={steelBreakdown}
                showSteelDetails={showSteelDetails}
                setShowSteelDetails={setShowSteelDetails}
             />
             
             <div className="hidden xl:block">
                 <AdUnit id={ADSENSE_CONFIG.SLOTS.SIDEBAR} slotType="sidebar" isPro={isPro} className="!w-full !h-auto min-h-[300px]" />
             </div>
          </div>

        </div>

        <div className="p-6 border border-yellow-900/50 bg-yellow-900/10 rounded-xl flex items-center justify-center gap-4 print:hidden">
             <Info className="text-yellow-600 flex-shrink-0" size={28} />
             <div className="text-base text-yellow-500/80 leading-relaxed text-center">
               <strong>{t('disclaimerTitle')}</strong> {t('disclaimerText')}
             </div>
        </div>

      </main>

      {/* Footer & Modals */}
      <footer className="border-t border-slate-800 mt-16 py-10 bg-slate-950 print:hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-base flex items-center justify-center gap-2 mb-4">
            © {new Date().getFullYear()} <span className="font-bold text-slate-300">CalcConstruPRO</span> • {t('rights')}
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-xs text-slate-600 font-medium">
             <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-indigo-500" />
                <span>{t('createdAi')} <span className="text-indigo-400 font-bold">AI</span></span>
             </div>
             <span className="hidden md:inline text-slate-800">•</span>
             <div className="flex items-center gap-1.5">
                <Code size={12} className="text-blue-500" />
                <span>{t('devBy')} <span className="text-slate-300 font-bold">Ivo Pinto</span></span>
             </div>
          </div>
        </div>
      </footer>

      <ProAccessModal 
        isOpen={isProAccessModalOpen} 
        onClose={() => setIsProAccessModalOpen(false)} 
        user={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
      
      {currentUser && (
        <ProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={currentUser}
          onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
        />
      )}

      {showPrintPreview && (
          <PrintPreviewModal 
            data={{
                unitSystem,
                displayVolume: convertValue(volumeM3, 'volume', unitSystem),
                config,
                matCementKg,
                matSand,
                matGravel,
                matWater,
                matSteelMin,
                matSteelMax,
                bags,
                steelBreakdown,
                mode,
                area: currentAreaM2,
                projectName: currentProjectName 
            }}
            user={currentUser}
            onClose={() => setShowPrintPreview(false)}
          />
      )}

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
    </div>
  );
};

export default App;