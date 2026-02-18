
import React, { useRef } from 'react';
import { ClassSession } from '../types';
import { extractVideoId } from '../services/dataService';
import { Play, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface ClassCarouselProps {
    title: string;
    classes: ClassSession[];
    onClassClick: (session: ClassSession) => void;
    onToggleProgress: (sessionId: string, currentStatus: boolean) => void;
}

const ClassCarousel: React.FC<ClassCarouselProps> = ({ title, classes, onClassClick, onToggleProgress }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 320;
            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (classes.length === 0) {
        return (
            <div className="mb-10 opacity-50">
                <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
                <div className="p-6 border border-white/10 rounded-xl bg-white/5 text-center text-sm">
                    No hay clases disponibles en este módulo aún.
                </div>
            </div>
        );
    }

    return (
        <div className="mb-10 relative group">
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <div className="flex gap-2">
                    <button onClick={() => scroll('left')} className="p-2 rounded-full bg-white/10 hover:bg-blue-600 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => scroll('right')} className="p-2 rounded-full bg-white/10 hover:bg-blue-600 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div 
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-6 px-2 no-scrollbar snap-x snap-mandatory"
                style={{ scrollBehavior: 'smooth' }}
            >
                {classes.map((session) => {
                     const videoId = extractVideoId(session.videoUrl || '');
                     const thumbnail = videoId 
                        ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` 
                        : null;
                     
                    return (
                        <div 
                            key={session.id}
                            onClick={() => onClassClick(session)}
                            className="flex-none w-[300px] bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:scale-105 hover:shadow-2xl hover:border-blue-500 transition-all duration-300 cursor-pointer snap-start group/card"
                        >
                            {/* Thumbnail Area */}
                            <div className="relative h-44 bg-slate-800 flex items-center justify-center overflow-hidden">
                                {thumbnail ? (
                                    <img src={thumbnail} alt={session.title} className="w-full h-full object-cover opacity-80 group-hover/card:opacity-100 transition-opacity" />
                                ) : (
                                    <span className="text-4xl">🎬</span>
                                )}
                                
                                {videoId && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-slate-900 shadow-lg scale-0 group-hover/card:scale-110 transition-transform duration-300">
                                            <Play size={24} fill="currentColor" />
                                        </div>
                                    </div>
                                )}

                                {videoId && (
                                    <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" 
                                            checked={session.completed}
                                            onChange={(e) => onToggleProgress(session.id, e.target.checked)}
                                            className="w-6 h-6 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-emerald-500"
                                        />
                                    </div>
                                )}

                                {session.completed && (
                                    <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                        <CheckCircle size={12} /> VISTO
                                    </div>
                                )}
                            </div>

                            {/* Info Area */}
                            <div className="p-4">
                                <h4 className="font-bold text-white mb-2 leading-tight h-10 line-clamp-2">
                                    {session.title}
                                </h4>
                                <p className="text-slate-400 text-sm line-clamp-2 h-10 mb-3">
                                    {session.desc}
                                </p>
                                
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} /> {session.duration || "Duración N/A"}
                                    </span>
                                    {videoId ? (
                                        <span className="text-emerald-500">Disponible</span>
                                    ) : (
                                        <span className="text-amber-500">Próximamente</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ClassCarousel;
