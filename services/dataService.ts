import { User, SyllabusStructure } from '../types';
import { APP_CONFIG, SYLLABUS_DATA as INITIAL_SYLLABUS } from '../constants';

// Extracts YouTube ID from URL
export const extractVideoId = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : undefined;
};

// --- MASTER ROOT USER DEFINITION ---
const MASTER_USER: User = {
    email: 'AIWIS',
    password: '1234',
    nombre: 'Master Root AIWIS',
    rol: 'Super Admin',
    habilidades: { prompting: 100, herramientas: 100, analisis: 100 },
    progreso: { porcentaje: 100, completados: 999, pendientes: 0 }
};

// Initial Data Loading (Local Storage + Mock Fallback)
export const getStoredUsers = (): User[] => {
    const stored = localStorage.getItem('ada_db_users');
    if (stored) return JSON.parse(stored);
    
    // Default Initial Users
    return [
        MASTER_USER,
        { email: 'amartinez@ada.cl', nombre: 'Andrea Martínez', rol: 'Usuario', habilidades: { prompting: 50, herramientas: 50, analisis: 50 }, progreso: { porcentaje: 0, completados: 0, pendientes: 20 } },
        { email: 'currutia@ada.cl', nombre: 'Crizla Urrutia', rol: 'Usuario', habilidades: { prompting: 50, herramientas: 50, analisis: 50 }, progreso: { porcentaje: 0, completados: 0, pendientes: 20 } },
        { email: 'dmacaya@ada.cl', nombre: 'Doris Macaya', rol: 'Usuario', habilidades: { prompting: 50, herramientas: 50, analisis: 50 }, progreso: { porcentaje: 0, completados: 0, pendientes: 20 } },
        { email: 'echiappa@ada.cl', nombre: 'Erika Chiappa', rol: 'Usuario', habilidades: { prompting: 50, herramientas: 50, analisis: 50 }, progreso: { porcentaje: 0, completados: 0, pendientes: 20 } },
        { email: 'ralarcon@ada.cl', nombre: 'Raul Alarcon', rol: 'Usuario', habilidades: { prompting: 50, herramientas: 50, analisis: 50 }, progreso: { porcentaje: 0, completados: 0, pendientes: 20 } },
        { email: 'pconcha@ada.cl', nombre: 'Pedro Concha', rol: 'Usuario', habilidades: { prompting: 50, herramientas: 50, analisis: 50 }, progreso: { porcentaje: 0, completados: 0, pendientes: 20 } },
        { email: 'rvaldes@ada.cl', nombre: 'Rafael Valdés', rol: 'Usuario', habilidades: { prompting: 50, herramientas: 50, analisis: 50 }, progreso: { porcentaje: 0, completados: 0, pendientes: 20 } },
        { email: 'pretamal@ada.cl', nombre: 'Pablo Retamal', rol: 'Usuario', habilidades: { prompting: 50, herramientas: 50, analisis: 50 }, progreso: { porcentaje: 0, completados: 0, pendientes: 20 } },
        { email: 'hzapata@ada.cl', nombre: 'Hugo Zapata', rol: 'Usuario', habilidades: { prompting: 50, herramientas: 50, analisis: 50 }, progreso: { porcentaje: 0, completados: 0, pendientes: 20 } },
        { email: 'jspulveda@ada.cl', nombre: 'Julio Sepulveda', rol: 'Usuario', habilidades: { prompting: 50, herramientas: 50, analisis: 50 }, progreso: { porcentaje: 0, completados: 0, pendientes: 20 } },
        { email: 'armin.salazar@aiwis.cl', nombre: 'Armin Salazar', rol: 'Mentor AIWIS', habilidades: { prompting: 95, herramientas: 95, analisis: 95 }, progreso: { porcentaje: 100, completados: 20, pendientes: 0 } },
    ];
};

export const getStoredSyllabus = (): SyllabusStructure => {
    const stored = localStorage.getItem('ada_db_syllabus');
    return stored ? JSON.parse(stored) : INITIAL_SYLLABUS;
};

// --- ADMIN ACTIONS (Persistence) ---

export const saveUsersToDB = (users: User[]) => {
    localStorage.setItem('ada_db_users', JSON.stringify(users));
};

export const saveSyllabusToDB = (syllabus: SyllabusStructure) => {
    localStorage.setItem('ada_db_syllabus', JSON.stringify(syllabus));
};

// --- LEGACY FETCHERS (Modified to prefer Local Storage "DB") ---

export const fetchUsers = async (): Promise<User[]> => {
    // Priority: Local "Master" DB -> API -> Hardcoded List
    const localUsers = getStoredUsers();
    if (localUsers.length > 0) return localUsers;

    // ... (Original fetch logic would go here as fallback, but for "Master" control we prioritize local state)
    return localUsers;
};

export const fetchVideoUrls = async (): Promise<Record<string, string>> => {
    // We now construct the video map dynamically from the Stored Syllabus
    const syllabus = getStoredSyllabus();
    const map: Record<string, string> = {};
    
    Object.entries(syllabus).forEach(([weekKey, days]) => {
        Object.entries(days).forEach(([dayKey, data]) => {
            // Assuming phase 1 for simplicity in this structure, or we can map deeply
            const id = `1-${weekKey}-${dayKey}`; 
            if (data.videoUrl) {
                map[id] = data.videoUrl;
            }
        });
    });
    
    return map;
};

export const syncProgress = async (user: User, progressMap: Record<string, boolean>) => {
    // 1. Save to LocalStorage
    const storageKey = `ada_progress_${user.email}`;
    localStorage.setItem(storageKey, JSON.stringify(progressMap));

    // 2. Try to sync to "Cloud" (simulated)
    // In a real app with Master control, we'd PUT this to an endpoint.
    return true;
};

export const loadLocalProgress = (email: string): Record<string, boolean> => {
    const saved = localStorage.getItem(`ada_progress_${email}`);
    return saved ? JSON.parse(saved) : {};
};