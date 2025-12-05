
import React from 'react';
import { X, Mail, Globe, MapPin, ChevronRight, HelpCircle, Book, Shield, FileText, Building2 } from 'lucide-react';

interface PageProps {
  onClose: () => void;
}

// Layout Genérico para as Páginas
const PageLayout: React.FC<{ title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }> = ({ title, icon, onClose, children }) => (
  <div className="fixed inset-0 z-[150] bg-slate-950 flex flex-col animate-in slide-in-from-right duration-300">
    {/* Header da Página */}
    <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400 border border-blue-600/20">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      </div>
      <button 
        onClick={onClose}
        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
      >
        <X size={24} />
      </button>
    </div>

    {/* Conteúdo com Scroll */}
    <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
      <div className="max-w-3xl mx-auto prose prose-invert prose-blue prose-headings:font-bold prose-a:text-blue-400">
        {children}
      </div>
    </div>
  </div>
);

export const AboutPage: React.FC<PageProps> = ({ onClose }) => (
  <PageLayout title="Sobre o CalcConstruPRO" icon={<Book size={24}/>} onClose={onClose}>
    <p className="lead text-lg text-slate-300">
      O <strong>CalcConstruPRO</strong> é uma ferramenta de cálculo civil avançada, desenvolvida para ajudar engenheiros, empreiteiros e entusiastas da construção a estimar materiais com precisão e rapidez.
    </p>
    
    <h3>A Nossa Missão</h3>
    <p>
      Simplificar o processo de orçamentação e planeamento de obra. Acreditamos que cálculos precisos não só poupam dinheiro, como reduzem o desperdício de materiais, contribuindo para uma construção mais sustentável.
    </p>

    <h3>Funcionalidades Principais</h3>
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose mt-6">
        <li className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>Cálculo de Áreas via Geometria</span>
        </li>
        <li className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>Estimativa de Betão e Aço</span>
        </li>
        <li className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>Suporte Métrico e Imperial</span>
        </li>
        <li className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>Exportação de Relatórios PDF</span>
        </li>
    </ul>

    <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
        Versão 1.2.0 • Desenvolvido com React & Tailwind
    </div>
  </PageLayout>
);

export const FaqPage: React.FC<PageProps> = ({ onClose }) => (
  <PageLayout title="Manual e FAQ" icon={<HelpCircle size={24}/>} onClose={onClose}>
    <div className="space-y-6">
        <details className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden open:bg-slate-900/80 transition-all">
            <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-white list-none group-hover:text-blue-400">
                <span>Como defino a escala do desenho?</span>
                <ChevronRight className="transition-transform group-open:rotate-90 text-slate-500"/>
            </summary>
            <div className="p-4 pt-0 text-slate-400 text-sm leading-relaxed border-t border-slate-800/50 mt-2">
                A escala define quantos píxeis no ecrã correspondem a 1 metro na realidade. 
                <br/><br/>
                Por defeito é <strong>15 px/m</strong>. Se o seu desenho ficar muito grande ou muito pequeno, ajuste este valor na barra de ferramentas superior antes de começar a desenhar os pontos.
            </div>
        </details>

        <details className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden open:bg-slate-900/80 transition-all">
            <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-white list-none group-hover:text-blue-400">
                <span>Como personalizar o logótipo (White Label)?</span>
                <ChevronRight className="transition-transform group-open:rotate-90 text-slate-500"/>
            </summary>
            <div className="p-4 pt-0 text-slate-400 text-sm leading-relaxed border-t border-slate-800/50 mt-2">
                Os membros <strong>PRO</strong> podem personalizar os relatórios PDF com a sua própria marca.
                <ol className="list-decimal list-inside mt-2 space-y-2">
                    <li>Clique no seu nome no canto superior direito para abrir o Perfil.</li>
                    <li>Selecione a aba <strong>"Empresa & Marca"</strong>.</li>
                    <li>Insira o nome da sua empresa.</li>
                    <li>Carregue o seu logótipo (recomendamos PNG com fundo transparente).</li>
                    <li>Clique em Guardar.</li>
                </ol>
                <div className="mt-3 flex items-center gap-2 bg-blue-900/20 p-2 rounded text-blue-300 text-xs">
                    <Building2 size={14} />
                    O logótipo aparecerá automaticamente no topo de todos os PDFs gerados.
                </div>
            </div>
        </details>

        <details className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden open:bg-slate-900/80 transition-all">
            <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-white list-none group-hover:text-blue-400">
                <span>Como guardar o meu projeto?</span>
                <ChevronRight className="transition-transform group-open:rotate-90 text-slate-500"/>
            </summary>
            <div className="p-4 pt-0 text-slate-400 text-sm leading-relaxed border-t border-slate-800/50 mt-2">
                Para guardar projetos na nuvem, precisa de uma conta <strong>PRO</strong>.
                <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Dê um nome ao projeto no campo de texto superior.</li>
                    <li>Desenhe uma geometria fechada (mínimo 3 pontos).</li>
                    <li>Clique no botão "Guardar" (ícone nuvem).</li>
                </ol>
            </div>
        </details>

        <details className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden open:bg-slate-900/80 transition-all">
            <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-white list-none group-hover:text-blue-400">
                <span>Os cálculos de aço são exatos?</span>
                <ChevronRight className="transition-transform group-open:rotate-90 text-slate-500"/>
            </summary>
            <div className="p-4 pt-0 text-slate-400 text-sm leading-relaxed border-t border-slate-800/50 mt-2">
                Não. O CalcConstruPRO fornece uma <strong>estimativa baseada em taxas médias de aço por m³</strong> (ex: 80kg a 100kg/m³). 
                <br/><br/>
                Para a construção real, é <strong>obrigatório</strong> um projeto de estabilidade assinado por um engenheiro, que definirá a armadura exata.
            </div>
        </details>
    </div>
  </PageLayout>
);

export const ContactPage: React.FC<PageProps> = ({ onClose }) => (
  <PageLayout title="Contacte-nos" icon={<Mail size={24}/>} onClose={onClose}>
    <p className="text-slate-300 mb-8">
      Tem dúvidas, sugestões ou encontrou um erro? A nossa equipa de suporte está disponível para ajudar.
    </p>

    <div className="grid gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-colors">
            <Mail className="text-blue-500 mb-4" size={32} />
            <h3 className="text-white font-bold text-lg mb-1">Email Geral</h3>
            <p className="text-slate-400 text-sm mb-4">Para questões gerais e parcerias.</p>
            <a href="mailto:info@calcconstru.pro" className="text-blue-400 font-bold hover:underline">info@calcconstru.pro</a>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-colors">
            <Globe className="text-emerald-500 mb-4" size={32} />
            <h3 className="text-white font-bold text-lg mb-1">Suporte Técnico</h3>
            <p className="text-slate-400 text-sm mb-4">Problemas com a aplicação ou conta.</p>
            <a href="mailto:suporte@calcconstru.pro" className="text-emerald-400 font-bold hover:underline">suporte@calcconstru.pro</a>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <MapPin className="text-amber-500 mb-4" size={32} />
            <h3 className="text-white font-bold text-lg mb-1">Sede</h3>
            <address className="text-slate-400 text-sm not-italic">
                Av. da Construção, 123<br/>
                Lisboa, Portugal<br/>
                1000-001
            </address>
        </div>
    </div>
  </PageLayout>
);

export const TermsPage: React.FC<PageProps> = ({ onClose }) => (
  <PageLayout title="Termos e Condições" icon={<FileText size={24}/>} onClose={onClose}>
    <h4>1. Aceitação dos Termos</h4>
    <p>Ao aceder e utilizar o CalcConstruPRO, aceita e concorda em cumprir os termos e disposições deste acordo.</p>

    <h4>2. Uso da Aplicação</h4>
    <p>Esta ferramenta destina-se apenas a fins de estimativa. Os resultados não substituem o cálculo profissional de engenharia civil.</p>

    <h4>3. Contas PRO</h4>
    <p>A subscrição PRO é pessoal e intransmissível. O cancelamento pode ser efetuado a qualquer momento, mantendo-se o acesso até ao fim do período pago.</p>

    <h4>4. Limitação de Responsabilidade</h4>
    <p>A CalcConstruPRO não se responsabiliza por quaisquer erros de construção, desvios orçamentais ou danos resultantes do uso das estimativas fornecidas por este software.</p>
  </PageLayout>
);

export const PrivacyPage: React.FC<PageProps> = ({ onClose }) => (
  <PageLayout title="Política de Privacidade" icon={<Shield size={24}/>} onClose={onClose}>
    <h4>1. Recolha de Dados</h4>
    <p>Recolhemos apenas os dados necessários para o funcionamento da conta (email, nome) e dados dos projetos que decide guardar na nuvem.</p>

    <h4>2. Proteção de Dados</h4>
    <p>Utilizamos encriptação SSL e bases de dados seguras (Supabase) para proteger as suas informações. Não vendemos os seus dados a terceiros.</p>

    <h4>3. Cookies</h4>
    <p>Utilizamos cookies essenciais para manter a sua sessão de login ativa e cookies analíticos anónimos para melhorar a performance da aplicação.</p>

    <h4>4. Seus Direitos</h4>
    <p>Pode solicitar a remoção completa da sua conta e de todos os dados associados a qualquer momento através do painel de perfil ou contactando o suporte.</p>
  </PageLayout>
);
