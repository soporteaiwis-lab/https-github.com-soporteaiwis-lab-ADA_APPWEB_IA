import React, { useState } from 'react';
import { User, SyllabusStructure } from '../types';
import { DIAS_SEMANA } from '../constants';
import { Save, UserPlus, Trash2, Edit3, Database, Video, BookOpen, Cpu, ShieldCheck } from 'lucide-react';

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
    
    // --- USER MANAGEMENT ---
    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserEmail || !newUserName) return;
        const newUser: User = {
            email: newUserEmail,
            nombre: newUserName,
            rol: 'Usuario',
            habilidades: { prompting: 0, herramientas: 0, analisis: 0 },
            progreso: { porcentaje: 0, completados: 0, pendientes: 20 }
        };
        onUpdateUsers([...users, newUser]);
        setNewUserEmail('');
        setNewUserName('');
    };

    const handleDeleteUser = (email: string) => {
        if (email === 'AIWIS') return; // Protect Root
        if (confirm(`¿Eliminar usuario ${email}?`)) {
            onUpdateUsers(users.filter(u => u.email !== email));
        }
    };

    const handleRoleChange = (email: string, newRole: string) => {
        onUpdateUsers(users.map(u => u.email === email ? { ...u, rol: newRole } : u));
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

    return (
        <div className="animate-in fade-in zoom-in duration-300 pb-20">
            <div className="bg-slate-800 border border-violet-500/30 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-slate-900/90 p-6 border-b border-violet-500/20 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 flex items-center gap-2">
                            <ShieldCheck /> Panel Master Root
                        </h2>
                        <p className="text-slate-400 text-sm">Control Total de Base de Datos y Contenidos ADA</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'users' ? 'bg-violet-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}>
                             <div className="flex items-center gap-2"><UserPlus size={16}/> Usuarios</div>
                        </button>
                        <button onClick={() => setActiveTab('content')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'content' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}>
                             <div className="flex items-center gap-2"><BookOpen size={16}/> Clases & Videos</div>
                        </button>
                        <button onClick={() => setActiveTab('database')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'database' ? 'bg-emerald-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}>
                             <div className="flex items-center gap-2"><Database size={16}/> DB & Tablas</div>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 min-h-[500px]">
                    
                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            {/* Add User Form */}
                            <form onSubmit={handleAddUser} className="bg-white/5 p-4 rounded-xl border border-white/10 flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs text-slate-400 mb-1">Nuevo Email</label>
                                    <input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full bg-slate-900 border border-white/20 rounded p-2 text-sm" placeholder="usuario@ada.cl" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-slate-400 mb-1">Nombre Completo</label>
                                    <input value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full bg-slate-900 border border-white/20 rounded p-2 text-sm" placeholder="Juan Pérez" />
                                </div>
                                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors flex items-center gap-2">
                                    <Save size={18} /> Agregar
                                </button>
                            </form>

                            {/* User Table */}
                            <div className="overflow-x-auto rounded-xl border border-white/10">
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
                                                        disabled={user.email === 'AIWIS'}
                                                    >
                                                        <option value="Usuario">Usuario</option>
                                                        <option value="Mentor AIWIS">Mentor</option>
                                                        <option value="Admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="p-3 text-right">
                                                    {user.email !== 'AIWIS' && (
                                                        <button onClick={() => handleDeleteUser(user.email)} className="text-red-400 hover:text-red-300 p-1">
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

                    {/* CONTENT TAB */}
                    {activeTab === 'content' && (
                        <div className="space-y-8">
                            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-sm text-blue-200">
                                <span className="font-bold">Modo Edición Activado:</span> Todos los cambios en Títulos, Descripciones y URLs de YouTube se guardan automáticamente en la base de datos maestra.
                            </div>

                            {Object.entries(syllabus).map(([week, days]) => (
                                <div key={week} className="border border-white/10 rounded-xl overflow-hidden">
                                    <div className="bg-white/5 p-3 font-bold border-b border-white/10 text-slate-300">
                                        Semana {week}
                                    </div>
                                    <div className="divide-y divide-white/10">
                                        {DIAS_SEMANA.map(day => {
                                            const dayData = days[day];
                                            if (!dayData) return null;
                                            return (
                                                <div key={day} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start hover:bg-white/5 transition-colors">
                                                    <div className="md:col-span-1 text-xs font-bold uppercase text-slate-500 pt-3">
                                                        {day}
                                                    </div>
                                                    <div className="md:col-span-4 space-y-2">
                                                        <input 
                                                            type="text" 
                                                            value={dayData.title}
                                                            onChange={(e) => handleContentChange(week, day, 'title', e.target.value)}
                                                            className="w-full bg-transparent border-b border-white/10 focus:border-blue-500 outline-none text-white font-medium pb-1"
                                                            placeholder="Título de la clase"
                                                        />
                                                        <textarea 
                                                            value={dayData.desc}
                                                            onChange={(e) => handleContentChange(week, day, 'desc', e.target.value)}
                                                            className="w-full bg-slate-900/50 border border-white/10 rounded p-2 text-xs text-slate-400 h-20 focus:border-blue-500 outline-none"
                                                            placeholder="Descripción..."
                                                        />
                                                    </div>
                                                    <div className="md:col-span-7">
                                                        <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-lg p-2">
                                                            <Video size={16} className="text-red-500" />
                                                            <input 
                                                                type="text"
                                                                value={dayData.videoUrl || ''}
                                                                onChange={(e) => handleContentChange(week, day, 'videoUrl', e.target.value)}
                                                                className="flex-1 bg-transparent outline-none text-xs text-slate-300 placeholder:text-slate-600"
                                                                placeholder="Pegar URL de YouTube aquí..."
                                                            />
                                                        </div>
                                                        {dayData.videoUrl && (
                                                            <div className="mt-2 text-xs text-emerald-500 flex items-center gap-1">
                                                                <ShieldCheck size={12} /> Video Vinculado
                                                            </div>
                                                        )}
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
                                    <Cpu className="text-emerald-400" /> Gemini Database Architect
                                </h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    La IA de Google está conectada a la estructura de la base de datos. Puedes pedirle que optimice tablas, genere reportes SQL o reestructure campos.
                                </p>
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Ej: Crear tabla de Asistencia con campos fecha y estado..." className="flex-1 bg-black/30 border border-emerald-500/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white" />
                                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors">
                                        Ejecutar Comando IA
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
                                    <h4 className="font-bold text-slate-300 mb-4 flex items-center gap-2"><Database size={16}/> Schema: Usuarios</h4>
                                    <div className="font-mono text-xs text-slate-500 bg-black p-4 rounded-lg overflow-x-auto">
                                        {JSON.stringify(users[0], null, 4)}
                                    </div>
                                    <button className="mt-4 w-full py-2 border border-dashed border-white/20 text-slate-400 text-sm hover:text-white hover:border-white transition-colors rounded">
                                        + Agregar Campo a Tabla
                                    </button>
                                </div>
                                <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
                                    <h4 className="font-bold text-slate-300 mb-4 flex items-center gap-2"><BookOpen size={16}/> Schema: Syllabus</h4>
                                    <div className="font-mono text-xs text-slate-500 bg-black p-4 rounded-lg overflow-x-auto h-48 custom-scrollbar">
                                        {JSON.stringify(syllabus[1]['lunes'], null, 4)}
                                    </div>
                                    <button className="mt-4 w-full py-2 border border-dashed border-white/20 text-slate-400 text-sm hover:text-white hover:border-white transition-colors rounded">
                                        + Agregar Metadatos
                                    </button>
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