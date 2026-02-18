
import React, { useState, useEffect } from 'react';
import { User, ClassSession, PageView, Idea, CourseModule } from './types';
import { 
  getStoredUsers,
  getStoredModules,
  saveUsersToCloud,
  saveModulesToCloud,
  extractVideoId,
  syncProgress, 
  loadLocalProgress,
  getDbError
} from './services/dataService';
import { generateSmartReport } from './services/geminiService';
import Navbar from './components/Navbar';
import ClassCarousel from './components/ClassCarousel';
import ClassModal from './components/ClassModal';
import AdminDashboard from './components/AdminDashboard';
import { Book, Lightbulb, TrendingUp, Sparkles, Lock, Shield, Loader2, AlertTriangle } from 'lucide-react';

const App = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState<PageView>('inicio');
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [userIdeas, setUserIdeas] = useState<Idea[]>([]);
  
  // Login Input State
  const [selectedEmail, setSelectedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Initial Data Load
  useEffect(() => {
    const init = async () => {
      // Load Database from Cloud (Firebase) - Cloud Only!
      const [fetchedUsers, fetchedModules] = await Promise.all([
          getStoredUsers(),
          getStoredModules()
      ]);
      
      setUsers(fetchedUsers);
      setModules(fetchedModules);
      
      // Auto-relogin if session token exists
      const savedUserSession = localStorage.getItem('ada_user');
      if (savedUserSession) {
        try {
            const parsed = JSON.parse(savedUserSession);
            // Verify if user still exists in DB
            const freshUser = fetchedUsers.find(u => u.email === parsed.email);
            
            if (freshUser) {
                setCurrentUser(freshUser);
                const savedProgress = await loadLocalProgress(parsed.email);
                setProgressMap(savedProgress);
            } else if (parsed.email === 'AIWIS') {
                // Keep Master session valid even if DB read fails (to fix things)
                setCurrentUser(parsed);
            }
        } catch(e) {
            localStorage.removeItem('ada_user');
        }
      }
      
      // Ideas are local only for now (Personal Drafts)
      const savedIdeas = localStorage.getItem('ada_user_ideas_drafts');
      if(savedIdeas) setUserIdeas(JSON.parse(savedIdeas));
      
      setLoading(false);
    };
    init();
  }, []);

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const user = users.find(u => u.email === selectedEmail);
    if (user) {
        if (user.password) {
            if (user.password !== password) {
                setLoginError('Contraseña incorrecta');
                return;
            }
        }

      setCurrentUser(user);
      localStorage.setItem('ada_user', JSON.stringify(user));
      
      const savedProgress = await loadLocalProgress(user.email);
      setProgressMap(savedProgress);
      
      if (user.email === 'AIWIS') {
          setCurrentPage('admin');
      }
    } else {
        setLoginError('Usuario no encontrado');
    }
  };

  const handleAutoLoginMaster = () => {
      setSelectedEmail('AIWIS');
      setPassword('1234');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ada_user');
    setSelectedEmail('');
    setPassword('');
    setCurrentPage('inicio');
  };

  // ADMIN UPDATES - DIRECT TO CLOUD
  const handleUpdateUsers = async (newUsers: User[]) => {
      const success = await saveUsersToCloud(newUsers); 
      if (success) setUsers(newUsers);
  };

  const handleUpdateModules = async (newModules: CourseModule[]) => {
      const success = await saveModulesToCloud(newModules);
      if (success) setModules(newModules);
  };

  const toggleProgress = async (sessionId: string, status: boolean) => {
    if (!currentUser) return;
    const newProgress = { ...progressMap, [sessionId]: status };
    setProgressMap(newProgress);
    await syncProgress(currentUser, newProgress);
  };

  const handleIdeaAdd = (type: 'idea' | 'pregunta', text: string) => {
      if(!currentUser || !text.trim()) return;
      const newIdea: Idea = { id: Date.now(), type, text, timestamp: Date.now() };
      const newIdeas = [...userIdeas, newIdea];
      setUserIdeas(newIdeas);
      // Ideas are local drafts
      localStorage.setItem('ada_user_ideas_drafts', JSON.stringify(newIdeas));
  };

  const handleReportGen = async () => {
      if(!currentUser) return;
      // Calculate total classes across all modules
      const totalClasses = modules.reduce((acc, mod) => acc + mod.classes.length, 0) || 1;
      const completed = Object.values(progressMap).filter(v => v).length;
      const pct = Math.round((completed / totalClasses) * 100);
      
      const smartSummary = await generateSmartReport(currentUser.nombre, pct, userIdeas);
      
      const win = window.open('', '_blank');
      win?.document.write(`
        <html><head><title>Reporte IA</title>
        <style>body{font-family:sans-serif;padding:2rem;line-height:1.6;color:#333;max-width:800px;margin:0 auto;} h1{color:#2563eb;} .card{background:#f8fafc;padding:1.5rem;border-radius:8px;margin-bottom:1rem;border:1px solid #e2e8f0;}</style>
        </head><body>
        <h1>Reporte de Progreso ADA</h1>
        <p><strong>Estudiante:</strong> ${currentUser.nombre}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
        <div class="card">
            <h2>Resumen Ejecutivo (Generado por Gemini)</h2>
            <div style="white-space: pre-line;">${smartSummary}</div>
        </div>
        </body></html>
      `);
  };

  // Prepare classes for view (mapping progress)
  const getEnrichedClasses = (classes: ClassSession[]) => {
      return classes.map(c => ({
          ...c,
          videoId: extractVideoId(c.videoUrl),
          completed: !!progressMap[c.id]
      }));
  };

  // Check errors for UI
  const dbError = getDbError();
  const hasDbError = dbError !== 'none';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white flex-col gap-4">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" /> 
        <div className="text-center">
            <h2 className="text-xl font-bold">Conectando Portal ADA IA...</h2>
            <p className="text-slate-400 text-sm">Sincronizando con Google Cloud Firestore</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
             <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10">
          <div className="text-center mb-8">
            <span className="text-4xl block mb-2">🚀</span>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
              Portal ADA IA
            </h1>
            <p className="text-slate-400 mt-2">Acceso Corporativo Seguro</p>
          </div>
          
          {hasDbError && (
              <div className="bg-amber-500/10 border border-amber-500/50 p-4 rounded-xl mb-6 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertTriangle className="text-amber-500 shrink-0 mt-1" size={20} />
                  <div className="text-left">
                      <h4 className="font-bold text-amber-500 text-sm mb-1">
                          {dbError === 'api_disabled' ? 'Base de Datos no Creada' : 'Error de Conexión/Permisos'}
                      </h4>
                      <p className="text-xs text-amber-200/80 leading-relaxed">
                          No se pudo conectar con Firebase. Usa el usuario <strong>Master Root</strong> para entrar y ver las instrucciones de reparación.
                      </p>
                  </div>
              </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Usuario</label>
              <select 
                required
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
              >
                <option value="">-- Seleccionar --</option>
                {users.map(u => (
                  <option key={u.email} value={u.email}>{u.nombre} {u.email === 'AIWIS' ? '(ROOT)' : ''}</option>
                ))}
              </select>
            </div>
            
            {selectedEmail === 'AIWIS' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-amber-400 mb-2 flex items-center gap-1">
                        <Lock size={14}/> Contraseña Master
                    </label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800 border border-amber-500/50 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                        placeholder="••••"
                    />
                </div>
            )}

            {loginError && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg text-center">
                    {loginError}
                </div>
            )}

            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1">
              Ingresar al Portal
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
               <button onClick={handleAutoLoginMaster} className="text-xs text-slate-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1 mx-auto">
                   <Shield size={12}/> Auto-Login Master Root (AIWIS)
               </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate Progress
  const totalClasses = modules.reduce((acc, m) => acc + m.classes.length, 0) || 1;
  const completedCount = Object.values(progressMap).filter(v => v).length;
  const progressPct = Math.round((completedCount / totalClasses) * 100);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">
      <Navbar 
        currentUser={currentUser} 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        onLogout={handleLogout} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* --- ADMIN DASHBOARD --- */}
        {currentPage === 'admin' && currentUser.email === 'AIWIS' && (
            <AdminDashboard 
                users={users} 
                modules={modules}
                onUpdateUsers={handleUpdateUsers}
                onUpdateModules={handleUpdateModules}
            />
        )}
        
        {/* PAGE: INICIO */}
        {currentPage === 'inicio' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-2xl font-bold">
                            {currentUser.nombre.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{currentUser.nombre}</h2>
                            <p className="text-slate-400">{currentUser.rol}</p>
                            {currentUser.email === 'AIWIS' && (
                                <button onClick={() => setCurrentPage('admin')} className="mt-2 text-xs bg-emerald-600 px-2 py-1 rounded text-white font-bold hover:bg-emerald-500">
                                    Ir a Consola Master
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {currentUser.email !== 'AIWIS' && (
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-blue-400 font-medium">Progreso General</span>
                                    <span className="font-bold">{progressPct}%</span>
                                </div>
                                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-1000" style={{ width: `${progressPct}%` }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col h-full">
                     <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Lightbulb className="text-amber-400" /> Centro de Ideas
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto max-h-[200px] mb-4 space-y-2 pr-2 custom-scrollbar">
                        {userIdeas.length === 0 ? (
                            <p className="text-slate-500 text-center py-4 text-sm italic">No has agregado ideas aún (Borradores Locales).</p>
                        ) : (
                            userIdeas.map(idea => (
                                <div key={idea.id} className={`p-3 rounded-lg text-sm border-l-4 ${idea.type === 'idea' ? 'bg-blue-900/20 border-blue-500' : 'bg-amber-900/20 border-amber-500'}`}>
                                    <div className="font-bold opacity-75 text-xs uppercase mb-1">{idea.type}</div>
                                    {idea.text}
                                </div>
                            ))
                        )}
                    </div>

                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const text = (form.elements.namedItem('text') as HTMLInputElement).value;
                            const type = (form.elements.namedItem('type') as HTMLSelectElement).value as 'idea'|'pregunta';
                            handleIdeaAdd(type, text);
                            form.reset();
                        }}
                        className="mt-auto space-y-3"
                    >
                        <div className="flex gap-2">
                            <select name="type" className="bg-slate-800 border border-white/10 rounded-lg text-sm p-2 outline-none focus:border-blue-500">
                                <option value="idea">💡 Idea</option>
                                <option value="pregunta">❓ Pregunta</option>
                            </select>
                            <input 
                                name="text" 
                                type="text" 
                                placeholder="Escribe algo..." 
                                className="flex-1 bg-slate-800 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                                required
                            />
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors">
                                <TrendingUp size={18} />
                            </button>
                        </div>
                        <button type="button" onClick={handleReportGen} className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                            <Sparkles size={16} className="text-violet-400" /> Generar Reporte Inteligente
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* PAGE: CLASES (Dynamic Modules) */}
        {currentPage === 'clases' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400 mb-2">
                        Mis Clases
                    </h2>
                    <p className="text-slate-400">Contenido Modular</p>
                </div>

                {modules.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">
                        <div className="text-4xl mb-2">📂</div>
                        <p>No hay módulos disponibles en la nube.</p>
                        <p className="text-xs">El administrador debe crear contenido.</p>
                    </div>
                ) : (
                    modules.map(module => (
                        <ClassCarousel 
                            key={module.id}
                            title={module.title}
                            classes={getEnrichedClasses(module.classes)}
                            onClassClick={setSelectedSession}
                            onToggleProgress={toggleProgress}
                        />
                    ))
                )}
            </div>
        )}
        
        {/* PAGE: ESTUDIANTES */}
        {currentPage === 'estudiantes' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <h2 className="text-2xl font-bold mb-6">Comunidad de Estudiantes</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     {users.filter(u => u.email !== 'AIWIS').map((u, i) => (
                         <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors">
                             <div className="flex items-center gap-3 mb-4">
                                 <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center font-bold text-lg">
                                     {u.nombre.charAt(0)}
                                 </div>
                                 <div>
                                     <div className="font-bold">{u.nombre}</div>
                                     <div className="text-xs text-slate-400">{u.rol}</div>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
        )}
        
        {/* PAGE: GUIA (Dynamic List) */}
        {currentPage === 'guia' && (
             <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                     <h1 className="text-3xl font-bold mb-6 text-blue-400 flex items-center gap-3">
                         <Book className="text-violet-400" /> Índice de Contenidos
                     </h1>
                     <div className="space-y-8">
                         {modules.map((module) => (
                             <div key={module.id} className="border-b border-white/10 pb-6 last:border-0">
                                 <h3 className="text-xl font-bold text-white mb-4">{module.title}</h3>
                                 <div className="grid gap-3">
                                     {module.classes.map((cls) => (
                                         <div key={cls.id} className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-blue-500">
                                             <div className="font-medium text-white flex justify-between">
                                                {cls.title}
                                                <span className="text-xs text-slate-500 bg-black/30 px-2 py-0.5 rounded">{cls.duration}</span>
                                             </div>
                                             <div className="text-sm text-slate-400 mt-1">{cls.desc}</div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>
        )}

      </main>

      {selectedSession && (
          <ClassModal session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
};

export default App;
