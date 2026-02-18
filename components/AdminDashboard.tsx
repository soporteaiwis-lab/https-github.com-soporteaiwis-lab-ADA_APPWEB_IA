
import React, { useState } from 'react';
import { User, CourseModule, ClassSession } from '../types';
import { FIREBASE_CONFIG } from '../constants';
import { getCloudStatus, getDbError } from '../services/dataService';
import { Save, Trash2, Database, Video, Monitor, AlertTriangle, ShieldCheck, Cpu, Plus, Edit, ChevronDown, ChevronRight, Layout, UserPlus, Lock, RefreshCw } from 'lucide-react';

interface AdminDashboardProps {
    users: User[];
    modules: CourseModule[];
    onUpdateUsers: (users: User[]) => void;
    onUpdateModules: (modules: CourseModule[]) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, modules, onUpdateUsers, onUpdateModules }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'content' | 'database'>('users');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Content Management State
    const [expandedModule, setExpandedModule] = useState<string | null>(null);
    const [newModuleTitle, setNewModuleTitle] = useState('');

    const isCloudActive = getCloudStatus();
    const dbError = getDbError();

    const handleRetry = () => {
        window.location.reload();
    };

    // --- USER MANAGEMENT ---
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserEmail || !newUserName) return;
        setIsSaving(true);
        const newUser: User = {
            email: newUserEmail,
            nombre: newUserName,
            rol: 'Usuario',
            habilidades: { prompting: 0, herramientas: 0, analisis: 0 },
            progreso: { porcentaje: 0, completados: 0, pendientes: 20 }
        };
        const updatedUsers = [...users, newUser];
        await onUpdateUsers(updatedUsers);
        setNewUserEmail('');
        setNewUserName('');
        setIsSaving(false);
    };

    const handleDeleteUser = async (email: string) => {
        if (email === 'AIWIS') return; 
        if (confirm(`¿Eliminar usuario ${email}?`)) {
            setIsSaving(true);
            await onUpdateUsers(users.filter(u => u.email !== email));
            setIsSaving(false);
        }
    };

    const handleRoleChange = async (email: string, newRole: string) => {
        setIsSaving(true);
        const updated = users.map(u => u.email === email ? { ...u, rol: newRole } : u);
        await onUpdateUsers(updated);
        setIsSaving(false);
    };

    // --- MODULE MANAGEMENT ---
    const handleAddModule = () => {
        if(!newModuleTitle.trim()) return;
        const newModule: CourseModule = {
            id: Date.now().toString(),
            title: newModuleTitle,
            classes: []
        };
        onUpdateModules([...modules, newModule]);
        setNewModuleTitle('');
    };

    const handleDeleteModule = (moduleId: string) => {
        if(confirm("¿Eliminar módulo completo y todas sus clases?")) {
            onUpdateModules(modules.filter(m => m.id !== moduleId));
        }
    };

    const handleUpdateModuleTitle = (moduleId: string, newTitle: string) => {
        const updated = modules.map(m => m.id === moduleId ? { ...m, title: newTitle } : m);
        onUpdateModules(updated);
    };

    // --- CLASS MANAGEMENT ---
    const handleAddClass = (moduleId: string) => {
        const newClass: ClassSession = {
            id: Date.now().toString(),
            title: "Nueva Clase",
            desc: "",
            videoUrl: "",
            duration: "0 min",
            completed: false
        };
        const updated = modules.map(m => {
            if (m.id === moduleId) {
                return { ...m, classes: [...m.classes, newClass] };
            }
            return m;
        });
        onUpdateModules(updated);
        setExpandedModule(moduleId);
    };

    const handleDeleteClass = (moduleId: string, classId: string) => {
        if(!confirm("¿Borrar esta clase?")) return;
        const updated = modules.map(m => {
            if (m.id === moduleId) {
                return { ...m, classes: m.classes.filter(c => c.id !== classId) };
            }
            return m;
        });
        onUpdateModules(updated);
    };

    const handleUpdateClass = (moduleId: string, classId: string, field: keyof ClassSession, value: string) => {
        const updated = modules.map(m => {
            if (m.id === moduleId) {
                return {
                    ...m,
                    classes: m.classes.map(c => c.id === classId ? { ...c, [field]: value } : c)
                };
            }
            return m;
        });
        onUpdateModules(updated);
    };

    const safeStringify = (data: any) => {
        try {
            return JSON.stringify(data, null, 2);
        } catch (e) {
            return "Error visualizando datos";
        }
    };

    return (
        <div className="animate-in fade-in zoom-in duration-300 pb-20">
            {/* --- CRITICAL ERRORS --- */}
            
            {/* 1. API KEY BLOCKED */}
            {!isCloudActive && (dbError === 'blocked_key' || !FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey.includes("TU_API_KEY")) && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-red-500 flex items-center gap-2 mb-3"><Lock size={24}/> API Key Bloqueada o Inválida</h3>
                    <p className="text-slate-300 mb-4">Google ha bloqueado tu clave. Esto pasa cuando la subes a GitHub públicamente. Sigue estos pasos para arreglarlo:</p>
                    <div className="bg-black/40 p-4 rounded-lg text-sm text-slate-300 font-mono space-y-3 border border-red-500/20">
                        <p className="text-emerald-400 font-bold">SOLUCIÓN:</p>
                        <p>1. Ve a <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-blue-400 underline">Google Cloud Console &gt; Credenciales</a>.</p>
                        <p>2. ELIMINA la clave API actual (la que está en rojo/bloqueada).</p>
                        <p>3. Crea una NUEVA Clave de API.</p>
                        <p>4. Haz clic en la nueva clave y busca "Restricciones de sitios web".</p>
                        <p>5. Agrega: <code>localhost</code> y <code>*.run.app</code> (o tu dominio actual).</p>
                        <p>6. Guarda la clave.</p>
                        <p>7. En tu proyecto local, crea un archivo <code>.env</code> y pega: <br/><span className="text-amber-400">REACT_APP_FIREBASE_API_KEY=tu_clave_nueva_aqui</span></p>
                    </div>
                </div>
            )}

            {/* 2. PERMISSIONS (RULES) */}
            {!isCloudActive && dbError === 'permission' && (
                <div className="bg-blue-600/10 border border-blue-500/50 rounded-xl p-6 mb-6">
                     <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2 mb-3"><ShieldCheck size={24}/> ERROR: Acceso Denegado (Reglas)</h3>
                     <p className="text-slate-300 mb-4">Tu base de datos funciona, pero las Reglas de Seguridad rechazan la conexión.</p>
                     
                     <div className="bg-black/50 p-4 rounded-lg border border-blue-500/30">
                        <p className="text-sm text-slate-400 mb-2">Copia y pega esto exactamente en <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-400 underline">Firebase Console &gt; Firestore &gt; Reglas</a>:</p>
                        <pre className="text-xs text-emerald-400 font-mono bg-black p-3 rounded select-all border border-white/10">
rules_version = '2';
service cloud.firestore {'{'}
  match /databases/{'{'}database{'}'}/documents {'{'}
    match /{'{'}document=**{'}'} {'{'}
      allow read, write: if true;
    {'}'}
  {'}'}
{'}'}
                        </pre>
                        <p className="text-xs text-amber-500 mt-2">* Esto abre la DB para que la app funcione sin autenticación de Firebase Auth (usando tu auth personalizada).</p>
                     </div>
                </div>
            )}

             {/* 3. DB NOT FOUND */}
             {!isCloudActive && dbError === 'missing_db' && (
                <div className="bg-amber-500/10 border border-amber-500/50 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-amber-500 flex items-center gap-2 mb-3"><Database size={24}/> Base de Datos No Encontrada</h3>
                    <p className="text-slate-300 mb-2">El sistema busca una DB llamada <strong>aiwis-bd-ia-portal</strong> pero no existe o está inhabilitada.</p>
                    <div className="bg-black/30 p-3 rounded text-sm text-slate-400">
                        Ve a Firebase Console &gt; Firestore Database. Asegúrate de que la base de datos (default) o la nombrada esté creada y activa.
                    </div>
                </div>
            )}

            <div className="bg-slate-800 border border-violet-500/30 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-slate-900/90 p-4 md:p-6 border-b border-violet-500/20 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 flex items-center justify-center md:justify-start gap-2">
                            <ShieldCheck className="text-violet-400" /> Panel Master Root
                        </h2>
                        <div className="flex items-center gap-2 text-slate-400 text-xs mt-1">
                            {isCloudActive ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> ONLINE: aiwis-bd-ia-portal</span>
                            ) : (
                                <span className="text-red-400 font-bold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> OFFLINE ({dbError})</span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="flex flex-1 bg-slate-950 p-1 rounded-lg border border-white/10 overflow-hidden">
                            <button onClick={() => setActiveTab('users')} className={`flex-1 px-3 py-2 text-xs md:text-sm font-medium rounded ${activeTab === 'users' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}>Usuarios</button>
                            <button onClick={() => setActiveTab('content')} className={`flex-1 px-3 py-2 text-xs md:text-sm font-medium rounded ${activeTab === 'content' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Módulos</button>
                            <button onClick={() => setActiveTab('database')} className={`flex-1 px-3 py-2 text-xs md:text-sm font-medium rounded ${activeTab === 'database' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>DB</button>
                        </div>
                        <button onClick={handleRetry} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white" title="Recargar / Reintentar">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 min-h-[500px]">
                    
                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <form onSubmit={handleAddUser} className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col md:flex-row gap-4 items-end">
                                <div className="w-full md:flex-1">
                                    <label className="block text-xs text-slate-400 mb-1">Nuevo Email</label>
                                    <input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full bg-slate-900 border border-white/20 rounded p-3 text-sm" placeholder="usuario@ada.cl" />
                                </div>
                                <div className="w-full md:flex-1">
                                    <label className="block text-xs text-slate-400 mb-1">Nombre</label>
                                    <input value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full bg-slate-900 border border-white/20 rounded p-3 text-sm" placeholder="Juan Pérez" />
                                </div>
                                <button type="submit" disabled={isSaving || !isCloudActive} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-bold text-sm">
                                    <UserPlus size={18} /> Agregar
                                </button>
                            </form>

                            <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/5 text-slate-300 text-sm uppercase">
                                            <th className="p-3">Nombre</th>
                                            <th className="p-3">Email</th>
                                            <th className="p-3">Rol</th>
                                            <th className="p-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10 text-sm">
                                        {users.map((user) => (
                                            <tr key={user.email} className="hover:bg-white/5 transition-colors">
                                                <td className="p-3 font-medium">{user.nombre}</td>
                                                <td className="p-3 text-slate-400">{user.email}</td>
                                                <td className="p-3">
                                                    <select 
                                                        value={user.rol} 
                                                        onChange={(e) => handleRoleChange(user.email, e.target.value)}
                                                        className="bg-transparent border border-white/20 rounded px-2 py-1 text-xs focus:bg-slate-800"
                                                        disabled={user.email === 'AIWIS' || !isCloudActive}
                                                    >
                                                        <option value="Usuario">Usuario</option>
                                                        <option value="Admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="p-3 text-right">
                                                    {user.email !== 'AIWIS' && (
                                                        <button onClick={() => handleDeleteUser(user.email)} disabled={!isCloudActive} className="text-red-400 hover:text-red-300 p-1">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* CONTENT TAB (MODULES) */}
                    {activeTab === 'content' && (
                        <div className="space-y-6">
                            {/* Create Module */}
                            <div className="flex gap-2 mb-6">
                                <input 
                                    type="text" 
                                    value={newModuleTitle}
                                    onChange={(e) => setNewModuleTitle(e.target.value)}
                                    placeholder="Nombre del nuevo módulo..."
                                    className="flex-1 bg-slate-900 border border-white/20 rounded-lg p-3 text-white"
                                />
                                <button onClick={handleAddModule} className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold flex items-center gap-2">
                                    <Layout size={18} /> Crear Módulo
                                </button>
                            </div>

                            {/* Modules List */}
                            <div className="space-y-4">
                                {modules.length === 0 && (
                                    <div className="text-center text-slate-500 py-10 border border-dashed border-white/10 rounded-xl">
                                        No hay módulos creados. Agrega uno arriba.
                                    </div>
                                )}
                                {modules.map(module => (
                                    <div key={module.id} className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                                        <div className="p-4 bg-slate-900 flex justify-between items-center border-b border-white/10">
                                            <div className="flex items-center gap-3 flex-1">
                                                <button onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}>
                                                    {expandedModule === module.id ? <ChevronDown size={20} className="text-blue-400" /> : <ChevronRight size={20} />}
                                                </button>
                                                <input 
                                                    value={module.title}
                                                    onChange={(e) => handleUpdateModuleTitle(module.id, e.target.value)}
                                                    className="bg-transparent font-bold text-lg text-white outline-none focus:border-b border-blue-500 w-full"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleAddClass(module.id)} className="text-emerald-400 hover:text-emerald-300 text-xs font-bold px-3 py-1 bg-emerald-400/10 rounded border border-emerald-400/20 flex items-center gap-1">
                                                    <Plus size={14} /> Clase
                                                </button>
                                                <button onClick={() => handleDeleteModule(module.id)} className="text-red-400 p-2 hover:bg-red-400/10 rounded">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {expandedModule === module.id && (
                                            <div className="p-4 space-y-4 bg-black/20">
                                                {module.classes.length === 0 && <div className="text-sm text-slate-500 italic p-2">Sin clases en este módulo.</div>}
                                                {module.classes.map((cls) => (
                                                    <div key={cls.id} className="bg-slate-800 border border-white/10 rounded-lg p-4 grid gap-4 relative group">
                                                        <button 
                                                            onClick={() => handleDeleteClass(module.id, cls.id)}
                                                            className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <input 
                                                                value={cls.title}
                                                                onChange={(e) => handleUpdateClass(module.id, cls.id, 'title', e.target.value)}
                                                                className="bg-slate-900 border border-white/10 rounded p-2 text-white font-bold text-sm"
                                                                placeholder="Título de la clase"
                                                            />
                                                            <input 
                                                                value={cls.duration}
                                                                onChange={(e) => handleUpdateClass(module.id, cls.id, 'duration', e.target.value)}
                                                                className="bg-slate-900 border border-white/10 rounded p-2 text-slate-300 text-sm"
                                                                placeholder="Ej: 45 min"
                                                            />
                                                        </div>
                                                        <textarea 
                                                            value={cls.desc}
                                                            onChange={(e) => handleUpdateClass(module.id, cls.id, 'desc', e.target.value)}
                                                            className="bg-slate-900 border border-white/10 rounded p-2 text-slate-400 text-sm h-16"
                                                            placeholder="Descripción del contenido..."
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <Video size={16} className="text-red-500" />
                                                            <input 
                                                                value={cls.videoUrl || ''}
                                                                onChange={(e) => handleUpdateClass(module.id, cls.id, 'videoUrl', e.target.value)}
                                                                className="flex-1 bg-slate-900 border border-white/10 rounded p-2 text-xs text-blue-300"
                                                                placeholder="https://www.youtube.com/watch?v=..."
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* DATABASE TAB */}
                    {activeTab === 'database' && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900 border border-emerald-500/30 rounded-xl p-6">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <Cpu className="text-emerald-400" /> Firebase Status
                                </h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    Estado: {isCloudActive ? <span className="text-emerald-400 font-bold">CONECTADO</span> : <span className="text-red-400 font-bold">DESCONECTADO ({dbError})</span>}
                                </p>
                            </div>
                            <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
                                <h4 className="font-bold text-slate-300 mb-4 flex items-center gap-2"><Database size={16}/> Schema: Módulos (JSON)</h4>
                                <div className="font-mono text-xs text-slate-500 bg-black p-4 rounded-lg overflow-x-auto max-h-64 custom-scrollbar">
                                    {isCloudActive ? safeStringify(modules) : "Offline"}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
