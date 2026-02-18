
export interface User {
  email: string;
  password?: string;
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
  id: string;
  title: string;
  desc: string;
  videoUrl: string;
  duration: string; // Editable by admin (e.g., "45 min", "1h 20m")
  videoId?: string; // Extracted automatically
  completed: boolean; // User specific state
}

export interface CourseModule {
  id: string;
  title: string;
  classes: ClassSession[];
}

export interface Idea {
  id: number;
  type: 'idea' | 'pregunta';
  text: string;
  timestamp: number;
}

export type PageView = 'inicio' | 'clases' | 'estudiantes' | 'guia' | 'admin';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}
