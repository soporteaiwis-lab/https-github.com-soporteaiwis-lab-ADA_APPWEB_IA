import React from 'react';
import { User, PageView } from '../types';
import { LogOut, Layout, BookOpen, Users, Folder, Github, ShieldCheck } from 'lucide-react';

interface NavbarProps {
    currentUser: User | null;
    currentPage: PageView;
    onNavigate: (page: PageView) => void;
    onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentUser, currentPage, onNavigate, onLogout }) => {
    const navItemClass = (page: PageView) => 
        `flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
            currentPage === page 
            ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg' 
            : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`;

    return (
        <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/10 shadow-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🚀</span>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400 hidden sm:block">
                            ADA Ltda - Portal IA
                        </h1>
                        {currentUser?.email === 'AIWIS' && (
                            <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">MASTER</span>
                        )}
                    </div>

                    {currentUser && (
                        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">
                            {currentUser.email === 'AIWIS' && (
                                <button onClick={() => onNavigate('admin')} className={navItemClass('admin')}>
                                    <ShieldCheck size={18} /> <span className="hidden md:inline">Admin</span>
                                </button>
                            )}
                            <button onClick={() => onNavigate('inicio')} className={navItemClass('inicio')}>
                                <Layout size={18} /> <span className="hidden md:inline">Inicio</span>
                            </button>
                            <button onClick={() => onNavigate('clases')} className={navItemClass('clases')}>
                                <BookOpen size={18} /> <span className="hidden md:inline">Clases</span>
                            </button>
                            <button onClick={() => onNavigate('estudiantes')} className={navItemClass('estudiantes')}>
                                <Users size={18} /> <span className="hidden md:inline">Estudiantes</span>
                            </button>
                            <button onClick={() => onNavigate('guia')} className={navItemClass('guia')}>
                                <Folder size={18} /> <span className="hidden md:inline">Guía</span>
                            </button>
                        </div>
                    )}

                    {currentUser && (
                        <div className="flex items-center gap-3 pl-4 border-l border-white/10 ml-4">
                            <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1 border border-white/10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentUser.email === 'AIWIS' ? 'bg-amber-500 text-black' : 'bg-gradient-to-br from-blue-500 to-violet-600 text-white'}`}>
                                    {currentUser.nombre.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium hidden lg:block">{currentUser.nombre.split(' ')[0]}</span>
                            </div>
                            <button onClick={onLogout} className="text-slate-400 hover:text-red-400 transition-colors p-2" title="Cerrar Sesión">
                                <LogOut size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;