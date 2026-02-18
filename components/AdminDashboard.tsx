import React, { useState } from 'react';
import { User, SyllabusStructure } from '../types';
import { DIAS_SEMANA, FIREBASE_CONFIG } from '../constants';
import { getCloudStatus, getDbError } from '../services/dataService';
import { Save, UserPlus, Trash2, Database, Video, Monitor, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

interface AdminDashboardProps {
    users: User[];
    syllabus: SyllabusStructure;
    onUpdateUsers: (users: User[]) => void;
    onUpdateSyllabus: (syllabus: SyllabusStructure) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, syllabus, onUpdateUsers, onUpdateSyllabus }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'content' | 'database'>('users');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const isCloudActive = getCloudStatus();
    const dbError = getDbError();

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
        if (confirm(`¿Eliminar usuario ${email}? Esta acción se sincronizará con la nube.`)) {
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

    // --- CONTENT MANAGEMENT ---
    const handleContentChange = (week: string, day: string, field: 'title' | 'desc' | 'videoUrl', value: string) => {
        const newSyllabus = { ...syllabus };
        if (!newSyllabus[parseInt(week)]) newSyllabus[parseInt(week)] = {};
        if (!newSyllabus[parseInt(week)][day]) newSyllabus[parseInt(week)][day] = { title: '', desc: '' };
        
        newSyllabus[parseInt(week)][day] = {
            ...newSyllabus[parseInt(week)][day],
            [field]: value
        };
        onUpdateSyllabus(newSyllabus);
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
            {/* ALERT: DB MISSING OR DISABLED */}
            {!isCloudActive && dbError === 'missing_db' && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start gap-4">
                    <Database className="text-red-500 shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-red-500">Base de Datos "aiwis-bd-ia-portal" No Disponible</h3>
                        <p className="text-sm text-slate-300 mb-2">
                            El sistema intenta conectar a la base de datos nombrada <strong>aiwis-bd-ia-portal</strong>, pero falla.
                        </p>
                        <ul className="list-disc list-inside text-xs text-slate-400 space-y-2 font-mono bg-black/30 p-3 rounded">
                            <li><strong>Causa 1 (Status):</strong> La base de datos está "Inhabilitada" en la consola. Debes ir a Firebase Console y hacer clic en "Habilitar" o crearla.</li>
                            <li><strong>Causa 2 (Config):</strong> El <code>projectId</code> en <code>constants.ts</code> no coincide con el proyecto donde vive esta base de datos.</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* ALERT: PERMISSIONS */}
            {!isCloudActive && dbError === 'permission' && (
                <div className="bg-amber-500/10 border border-amber-500/50 rounded-xl p-4 mb-6 flex items-start gap-4">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-amber-500">Permisos Insuficientes en "aiwis-bd-ia-portal"</h3>
                        <p className="text-sm text-slate-300 mb-2">
                            La base de datos existe, pero las Reglas de Seguridad bloquean el acceso.
                        </p>
                        <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1 font-mono bg-black/30 p-3 rounded">
                            <li>Ve a <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-400 underline">Firebase Console</a>.</li>
                            <li>Selecciona el proyecto <strong>AIWIS MENTOR CLASES</strong>.</li>
                            <li>Ve a <strong>Firestore Database</strong> y selecciona <strong>aiwis-bd-ia-portal</strong> en el menú desplegable (arriba).</li>
                            <li>Pestaña <strong>Reglas</strong> y pega:</li>
                        </ol>
                        <div className="mt-2 text-xs text-emerald-400 bg-black p-2 rounded font-mono select-all">
                            rules_version = '2';<br/>
                            service cloud.firestore {'{'}<br/>
                            &nbsp;&nbsp;match /databases/{"{database}"}/documents {'{'}<br/>
                            &nbsp;&nbsp;&nbsp;&nbsp;match /{"{document=**}"} {'{'}<br/>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read, write: if true;<br/>
                            &nbsp;&nbsp;&nbsp;&nbsp;{'}'}<br/>
                            &nbsp;&nbsp;{'}'}<br/>
                            {'}'}
                        </div>
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
                                <>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-emerald-400 font-bold">Conectado: aiwis-bd-ia-portal</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span className="text-red-400 font-bold">Sin Conexión Cloud</span>
                                </>
                            )}
                            {isSaving && <span className="text-slate-500 ml-2 animate-pulse">Guardando...</span>}
                        </div>
                    </div>
                    
                    {/* Responsive Navigation */}
                    <div className="flex w-full md:w-auto bg-slate-950 p-1 rounded-lg border border-white/10 overflow-hidden">
                        <button onClick={() => setActiveTab('users')} className={`flex-1 px-3 py-2 text-xs md:text-sm font-medium transition-all rounded ${activeTab === 'users' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}>
                             Usuarios
                        </button>
                        <button onClick={() => setActiveTab('content')} className={`flex-1 px-3 py-2 text-xs md:text-sm font-medium transition-all rounded ${activeTab === 'content' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                             Contenidos
                        </button>
                        <button onClick={() => setActiveTab('database')} className={`flex-1 px-3 py-2 text-xs md:text-sm font-medium transition-all rounded ${activeTab === 'database' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>
                             IA DB
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
                                    <label className="block text-xs text-slate-400 mb-1">Nombre Completo</label>
                                    <input value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full bg-slate-900 border border-white/20 rounded p-3 text-sm" placeholder="Juan Pérez" />
                                </div>
                                <button type="submit" disabled={isSaving || !isCloudActive} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-bold text-sm">
                                    <Save size={18} /> {isSaving ? 'Guardando...' : 'Agregar Usuario'}
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
                                                        className="bg-transparent border border-white/20 rounded px-2 py-1 text-xs focus:bg-slate-800 w-full"
                                                        disabled={user.email === 'AIWIS' || !isCloudActive}
                                                    >
                                                        <option value="Usuario">Usuario</option>
                                                        <option value="Mentor AIWIS">Mentor</option>
                                                        <option value="Admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="p-3 text-right">
                                                    {user.email !== 'AIWIS' && (
                                                        <button onClick={() => handleDeleteUser(user.email)} disabled={!isCloudActive} className="text-red-400 hover:text-red-300 p-1 disabled:opacity-30">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="md:hidden space-y-3">
                                {users.map((user) => (
                                    <div key={user.email} className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-white">{user.nombre}</div>
                                                <div className="text-xs text-slate-400">{user.email}</div>
                                            </div>
                                            {user.email !== 'AIWIS' && (
                                                <button onClick={() => handleDeleteUser(user.email)} disabled={!isCloudActive} className="bg-red-500/20 text-red-300 p-2 rounded-lg disabled:opacity-30">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CONTENT TAB */}
                    {activeTab === 'content' && (
                        <div className="space-y-8">
                            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-sm text-blue-200 flex flex-col md:flex-row items-center gap-2 text-center md:text-left">
                                <Monitor size={20} />
                                <div>
                                    <span className="font-bold">Modo Edición en la Nube:</span> {isCloudActive ? 'Activo' : 'Inactivo (Revisa Configuración)'}
                                </div>
                            </div>

                            {Object.entries(syllabus).map(([week, days]) => (
                                <div key={week} className="border border-white/10 rounded-xl overflow-hidden">
                                    <div className="bg-white/5 p-3 font-bold border-b border-white/10 text-slate-300 flex justify-between items-center">
                                        <span>Semana {week}</span>
                                        <span className="text-xs bg-slate-800 px-2 py-1 rounded">Fase 1</span>
                                    </div>
                                    <div className="divide-y divide-white/10">
                                        {DIAS_SEMANA.map(day => {
                                            const dayData = days[day];
                                            if (!dayData) return null;
                                            return (
                                                <div key={day} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start hover:bg-white/5 transition-colors group">
                                                    <div className="md:col-span-1 text-xs font-bold uppercase text-slate-500 pt-3 md:text-center">
                                                        {day}
                                                    </div>
                                                    <div className="md:col-span-4 space-y-2">
                                                        <input 
                                                            type="text" 
                                                            value={dayData.title}
                                                            onChange={(e) => handleContentChange(week, day, 'title', e.target.value)}
                                                            className="w-full bg-transparent border-b border-white/10 focus:border-blue-500 outline-none text-white font-medium pb-1 transition-all placeholder:text-slate-600"
                                                            placeholder="Título de la clase..."
                                                            disabled={!isCloudActive}
                                                        />
                                                        <textarea 
                                                            value={dayData.desc}
                                                            onChange={(e) => handleContentChange(week, day, 'desc', e.target.value)}
                                                            className="w-full bg-slate-900/50 border border-white/10 rounded p-2 text-xs text-slate-400 h-20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-700"
                                                            placeholder="Descripción del contenido..."
                                                            disabled={!isCloudActive}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-7">
                                                        <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-lg p-2 focus-within:border-emerald-500 transition-colors">
                                                            <Video size={16} className="text-red-500 shrink-0" />
                                                            <input 
                                                                type="text"
                                                                value={dayData.videoUrl || ''}
                                                                onChange={(e) => handleContentChange(week, day, 'videoUrl', e.target.value)}
                                                                className="flex-1 bg-transparent outline-none text-xs text-slate-300 placeholder:text-slate-600 w-full"
                                                                placeholder="Pegar URL de YouTube..."
                                                                disabled={!isCloudActive}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* DATABASE TAB */}
                    {activeTab === 'database' && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900 border border-emerald-500/30 rounded-xl p-6">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <Cpu className="text-emerald-400" /> Firebase Status: aiwis-bd-ia-portal
                                </h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    Estado: {isCloudActive ? <span className="text-emerald-400 font-bold">CONECTADO</span> : <span className="text-red-400 font-bold">DESCONECTADO ({dbError})</span>}
                                </p>
                                <div className="p-4 bg-black/50 rounded-lg text-xs font-mono break-all text-slate-500">
                                    Project Config ID: {FIREBASE_CONFIG.projectId}
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
                                <h4 className="font-bold text-slate-300 mb-4 flex items-center gap-2"><Database size={16}/> Schema: Usuarios</h4>
                                <div className="font-mono text-xs text-slate-500 bg-black p-4 rounded-lg overflow-x-auto max-h-64 custom-scrollbar">
                                    {isCloudActive ? safeStringify(users) : "Conecta a la nube para ver datos reales."}
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