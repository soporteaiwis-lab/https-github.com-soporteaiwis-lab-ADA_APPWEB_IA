import React, { useState, useEffect } from 'react';
import { User, ClassSession, PageView, Idea, SyllabusStructure } from './types';
import { DIAS_SEMANA } from './constants';
import { 
  getStoredUsers,
  getStoredSyllabus,
  saveUsersToCloud,
  saveSyllabusToCloud,
  extractVideoId,
  syncProgress, 
  loadLocalProgress
} from './services/dataService';
import { generateSmartReport } from './services/geminiService';
import Navbar from './components/Navbar';
import ClassCarousel from './components/ClassCarousel';
import ClassModal from './components/ClassModal';
import AdminDashboard from './components/AdminDashboard';
import { Book, Lightbulb, UserCheck, TrendingUp, Download, Loader2, Sparkles, Lock, Shield } from 'lucide-react';

const App = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [syllabus, setSyllabus] = useState<SyllabusStructure>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [videoMap, setVideoMap] = useState<Record<string, string>>({});
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
      // Load Database from Cloud (Google Sheets via Apps Script)
      // This waits for the fetch to complete to ensure data truth
      const [fetchedUsers, fetchedSyllabus] = await Promise.all([
          getStoredUsers(),
          getStoredSyllabus()
      ]);
      
      setUsers(fetchedUsers);
      setSyllabus(fetchedSyllabus);
      
      const vMap: Record<string, string> = {};
      Object.entries(fetchedSyllabus).forEach(([week, days]) => {
          Object.entries(days).forEach(([day, data]) => {
              if (data.videoUrl) vMap[`1-${week}-${day}`] = data.videoUrl;
          });
      });
      setVideoMap(vMap);

      // Check local storage for session
      const savedUser = localStorage.getItem('ada_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const freshUser = fetchedUsers.find(u => u.email === parsed.email) || parsed;
        setCurrentUser(freshUser);
        
        const savedProgress = loadLocalProgress(parsed.email);
        setProgressMap(savedProgress);
        
        const savedIdeas = localStorage.getItem(`ada_ideas_${parsed.email}`);
        if(savedIdeas) setUserIdeas(JSON.parse(savedIdeas));
      }
      setLoading(false);
    };
    init();
  }, []);

  // Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const user = users.find(u => u.email === selectedEmail);
    if (user) {
        // Auth Check
        if (user.password) {
            if (user.password !== password) {
                setLoginError('Contraseña incorrecta');
                return;
            }
        }

      setCurrentUser(user);
      localStorage.setItem('ada_user', JSON.stringify(user));
      
      // Load progress
      const savedProgress = loadLocalProgress(user.email);
      setProgressMap(savedProgress);
      
      const savedIdeas = localStorage.getItem(`ada_ideas_${user.email}`);
      if(savedIdeas) setUserIdeas(JSON.parse(savedIdeas));
      
      // Redirect Master directly to Admin
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

  // ADMIN UPDATES - Now calls Cloud functions
  const handleUpdateUsers = async (newUsers: User[]) => {
      setUsers(newUsers);
      await saveUsersToCloud(newUsers); 
  };

  const handleUpdateSyllabus = async (newSyllabus: SyllabusStructure) => {
      setSyllabus(newSyllabus);
      await saveSyllabusToCloud(newSyllabus);
      
      // Rebuild video map for UI
      const vMap: Record<string, string> = {};
      Object.entries(newSyllabus).forEach(([week, days]) => {
          Object.entries(days).forEach(([day, data]) => {
              if (data.videoUrl) vMap[`1-${week}-${day}`] = data.videoUrl;
          });
      });
      setVideoMap(vMap);
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
      localStorage.setItem(`ada_ideas_${currentUser.email}`, JSON.stringify(newIdeas));
  };

  const handleReportGen = async () => {
      if(!currentUser) return;
      const totalClasses = 20;
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

  // Helper to build Class Sessions from Dynamic Syllabus + Video Map
  const getClassesForPhase = (phase: number, week: number) => {
    const weekData = syllabus[week];
    if (!weekData) return [];
    
    return DIAS_SEMANA.map(day => {
      const info = weekData[day];
      if (!info) return null;

      const id = `${phase}-${week}-${day}`; 
      // Use video from syllabus first, fallback to map
      const videoUrl = info.videoUrl || videoMap[id];
      
      return {
        id,
        fase: phase,
        semana: week,
        dia: day,
        title: info.title,
        desc: info.desc,
        videoUrl: videoUrl,
        videoId: extractVideoId(videoUrl),
        completed: !!progressMap[id]
      } as ClassSession;
    }).filter(Boolean) as ClassSession[];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white flex-col gap-4">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" /> 
        <div className="text-center">
            <h2 className="text-xl font-bold">Conectando con Google Cloud...</h2>
            <p className="text-slate-400 text-sm">Sincronizando Base de Datos Maestra</p>
        </div>
      </div>
    );
  }

  // --- LOGIN VIEW ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Gradients */}
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

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1"
            >
              Ingresar al Portal
            </button>
          </form>

          {/* AUTO FILL LINK FOR MASTER */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
               <button 
                onClick={handleAutoLoginMaster}
                className="text-xs text-slate-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1 mx-auto"
               >
                   <Shield size={12}/> Auto-Login Master Root (AIWIS)
               </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP ---
  const completedCount = Object.values(progressMap).filter(v => v).length;
  const progressPct = Math.round((completedCount / 20) * 100);

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
                syllabus={syllabus}
                onUpdateUsers={handleUpdateUsers}
                onUpdateSyllabus={handleUpdateSyllabus}
            />
        )}
        
        {/* PAGE: INICIO (Regular User) */}
        {currentPage === 'inicio' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Stats Card */}
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
                            {/* Stats grid... */}
                        </div>
                    )}
                </div>

                {/* Ideas & Report */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col h-full">
                     {/* ... (Existing Ideas Logic) ... */}
                     <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Lightbulb className="text-amber-400" /> Centro de Ideas
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto max-h-[200px] mb-4 space-y-2 pr-2 custom-scrollbar">
                        {userIdeas.length === 0 ? (
                            <p className="text-slate-500 text-center py-4 text-sm italic">No has agregado ideas aún.</p>
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
                        <button 
                            type="button" 
                            onClick={handleReportGen}
                            className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Sparkles size={16} className="text-violet-400" /> Generar Reporte Inteligente con Gemini
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* PAGE: CLASES (Now Dynamic) */}
        {currentPage === 'clases' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400 mb-2">
                        Mis Clases
                    </h2>
                    <p className="text-slate-400">Contenido Dinámico Actualizado</p>
                </div>

                <ClassCarousel 
                    title="📅 Semana 1" 
                    classes={getClassesForPhase(1, 1)} 
                    onClassClick={setSelectedSession}
                    onToggleProgress={toggleProgress}
                />
                <ClassCarousel 
                    title="📅 Semana 2" 
                    classes={getClassesForPhase(1, 2)} 
                    onClassClick={setSelectedSession}
                    onToggleProgress={toggleProgress}
                />
                <ClassCarousel 
                    title="📅 Semana 3" 
                    classes={getClassesForPhase(1, 3)} 
                    onClassClick={setSelectedSession}
                    onToggleProgress={toggleProgress}
                />
                <ClassCarousel 
                    title="📅 Semana 4" 
                    classes={getClassesForPhase(1, 4)} 
                    onClassClick={setSelectedSession}
                    onToggleProgress={toggleProgress}
                />
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
                             {/* Stats... */}
                         </div>
                     ))}
                 </div>
             </div>
        )}
        
        {/* PAGE: GUIA (Dynamic) */}
        {currentPage === 'guia' && (
             <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                     <h1 className="text-3xl font-bold mb-6 text-blue-400 flex items-center gap-3">
                         <Book className="text-violet-400" /> Guía de Estudios
                     </h1>
                     <div className="space-y-8">
                         {Object.entries(syllabus).map(([week, days]) => (
                             <div key={week} className="border-b border-white/10 pb-6 last:border-0">
                                 <h3 className="text-xl font-bold text-white mb-4">Semana {week}</h3>
                                 <div className="grid gap-3">
                                     {Object.entries(days).map(([day, info]) => (
                                         <div key={day} className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-blue-500">
                                             <div className="text-xs uppercase font-bold text-blue-400 mb-1">{day}</div>
                                             <div className="font-medium text-white">{info.title}</div>
                                             <div className="text-sm text-slate-400 mt-1">{info.desc}</div>
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

      {/* MODAL */}
      {selectedSession && (
          <ClassModal session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
};

export default App;