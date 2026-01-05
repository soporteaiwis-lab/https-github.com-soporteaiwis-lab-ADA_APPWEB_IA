import React, { useState } from 'react';
import { ClassSession } from '../types';
import { X, MessageSquare, FileText, Sparkles, Send } from 'lucide-react';
import { askGeminiTutor } from '../services/geminiService';

interface ClassModalProps {
    session: ClassSession | null;
    onClose: () => void;
}

const ClassModal: React.FC<ClassModalProps> = ({ session, onClose }) => {
    const [activeTab, setActiveTab] = useState<'desc' | 'tutor'>('desc');
    const [question, setQuestion] = useState('');
    const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
    const [loadingAi, setLoadingAi] = useState(false);

    if (!session) return null;

    const handleAskTutor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;

        const userQ = question;
        setChatHistory(prev => [...prev, { role: 'user', text: userQ }]);
        setQuestion('');
        setLoadingAi(true);

        const context = `Título: ${session.title}. Descripción: ${session.desc}. Semana: ${session.semana}. Fase: ${session.fase}.`;
        const answer = await askGeminiTutor(context, userQ);

        setChatHistory(prev => [...prev, { role: 'ai', text: answer }]);
        setLoadingAi(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-5xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-slate-800/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{session.title}</h2>
                        <div className="flex gap-3 text-slate-400 text-sm">
                            <span className="bg-blue-900/30 px-2 py-0.5 rounded text-blue-300">Semana {session.semana}</span>
                            <span className="capitalize">{session.dia}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row">
                    {/* Video Section */}
                    <div className="flex-1 p-6 bg-black flex items-center justify-center min-h-[300px] lg:min-h-full">
                        {session.videoId ? (
                            <iframe 
                                src={`https://www.youtube.com/embed/${session.videoId}`} 
                                className="w-full h-full aspect-video rounded-lg shadow-lg"
                                allowFullScreen
                                title="Video Player"
                            />
                        ) : (
                            <div className="text-center p-10">
                                <span className="text-4xl block mb-4">🚧</span>
                                <h3 className="text-xl font-bold">Video no disponible aún</h3>
                                <p className="text-slate-500 mt-2">Este contenido se liberará próximamente.</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Info & AI Tutor */}
                    <div className="lg:w-96 border-l border-white/10 bg-slate-900 flex flex-col h-[500px] lg:h-auto">
                        <div className="flex border-b border-white/10">
                            <button 
                                onClick={() => setActiveTab('desc')}
                                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'desc' ? 'text-blue-400 border-b-2 border-blue-400 bg-white/5' : 'text-slate-400 hover:text-white'}`}
                            >
                                <FileText size={16} /> Descripción
                            </button>
                            <button 
                                onClick={() => setActiveTab('tutor')}
                                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'tutor' ? 'text-violet-400 border-b-2 border-violet-400 bg-white/5' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Sparkles size={16} /> Tutor IA (Gemini)
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {activeTab === 'desc' ? (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white">Sobre esta clase</h3>
                                    <p className="text-slate-300 leading-relaxed">
                                        {session.desc}
                                    </p>
                                    <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                        <h4 className="text-blue-300 font-bold text-sm mb-2">Objetivos de aprendizaje</h4>
                                        <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                                            <li>Comprender los conceptos fundamentales.</li>
                                            <li>Aplicar la teoría a casos de uso de ADA.</li>
                                            <li>Preparar el quiz de evaluación.</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 space-y-4 mb-4">
                                        {chatHistory.length === 0 && (
                                            <div className="text-center py-8 text-slate-500">
                                                <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">¡Hola! Soy tu Tutor IA con tecnología Gemini. Pregúntame cualquier cosa sobre esta clase.</p>
                                            </div>
                                        )}
                                        {chatHistory.map((msg, idx) => (
                                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 border border-white/10'}`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        {loadingAi && (
                                            <div className="flex justify-start">
                                                <div className="bg-slate-800 rounded-lg p-3 text-sm border border-white/10 animate-pulse">
                                                    Escribiendo...
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <form onSubmit={handleAskTutor} className="mt-auto relative">
                                        <input 
                                            type="text" 
                                            value={question}
                                            onChange={(e) => setQuestion(e.target.value)}
                                            placeholder="Ej: Explícame más sobre..."
                                            className="w-full bg-slate-800 border border-white/20 rounded-lg pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!question.trim() || loadingAi}
                                            className="absolute right-2 top-2 p-1.5 bg-violet-600 rounded-md text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassModal;