export interface User {
  email: string;
  nombre: string;
  rol: string;
  habilidades: {
    prompting: number;
    herramientas: number;
    analisis: number;
  };
  progreso: {
    porcentaje: number;
    completados: number;
    pendientes: number;
  };
}

export interface ClassSession {
  id: string; // e.g., "1-1-lunes" (Phase-Week-Day)
  fase: number;
  semana: number;
  dia: string;
  title: string;
  desc: string;
  videoUrl?: string;
  videoId?: string;
  completed: boolean;
}

export interface Idea {
  id: number;
  type: 'idea' | 'pregunta';
  text: string;
  timestamp: number;
}

export type PageView = 'inicio' | 'clases' | 'estudiantes' | 'guia';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}