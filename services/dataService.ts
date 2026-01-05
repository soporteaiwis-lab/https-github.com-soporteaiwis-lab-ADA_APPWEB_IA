import { User, ClassSession } from '../types';
import { APP_CONFIG, SYLLABUS_DATA, DIAS_SEMANA } from '../constants';

// Extracts YouTube ID from URL
export const extractVideoId = (url: string): string | undefined => {
  if (!url) return undefined;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : undefined;
};

// Updated User List (Database Backup)
const MOCK_USERS: User[] = [
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

const MOCK_VIDEOS: Record<string, string> = {
    '1-1-lunes': 'https://www.youtube.com/watch?v=Sqa8Zo2XWc4', 
    '1-1-martes': 'https://www.youtube.com/watch?v=jNQXAC9IVRw', 
};

export const fetchUsers = async (): Promise<User[]> => {
  if (!process.env.API_KEY) {
      console.warn("API Key not found, using updated user list.");
      return MOCK_USERS;
  }
  
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${APP_CONFIG.SPREADSHEET_ID}/values/Usuarios?key=${process.env.API_KEY}`;
    const response = await fetch(url);
    
    // Graceful Fallback: If API fails (403, 400, etc.), return the correct user list immediately
    if (!response.ok) {
        console.warn(`Sheets API returned ${response.status}. Using local user database.`);
        return MOCK_USERS;
    }
    
    const data = await response.json();
    const users: User[] = [];
    
    if (data.values && data.values.length > 1) {
       for (let i = 1; i < data.values.length; i++) {
           const row = data.values[i];
           // Ensure we have at least Email and Name (Col 0 and 1)
           if (row[0] && row[1]) {
               const email = row[0].trim();
               const nombre = row[1].trim();
               const rol = row[2] ? row[2].trim() : 'Usuario';
               
               // Assign high skills to Mentor
               const isMentor = rol.toLowerCase().includes('mentor') || email.includes('armin.salazar');

               users.push({
                   email: email,
                   nombre: nombre,
                   rol: rol,
                   habilidades: isMentor 
                      ? { prompting: 95, herramientas: 95, analisis: 95 } 
                      : { prompting: 50, herramientas: 50, analisis: 50 },
                   progreso: { porcentaje: 0, completados: 0, pendientes: 20 }
               });
           }
       }
    }
    return users.length > 0 ? users : MOCK_USERS;
  } catch (error) {
    console.warn("Network error fetching users. Using local user database.", error);
    return MOCK_USERS;
  }
};

export const fetchVideoUrls = async (): Promise<Record<string, string>> => {
    if (!process.env.API_KEY) return MOCK_VIDEOS;
    
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${APP_CONFIG.SPREADSHEET_ID}/values/Videos?key=${process.env.API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`Sheets API returned ${response.status} for Videos. Using mock videos.`);
            return MOCK_VIDEOS;
        }

        const data = await response.json();
        const map: Record<string, string> = {};

        if (data.values && data.values.length > 1) {
            for (let i = 1; i < data.values.length; i++) {
                const row = data.values[i]; // Fase, Semana, Dia, URL
                if (row[0] && row[1] && row[2]) {
                    // Key format: "1-1-lunes"
                    const key = `${row[0]}-${row[1]}-${row[2].toLowerCase()}`;
                    map[key] = row[3];
                }
            }
        }
        return Object.keys(map).length > 0 ? map : MOCK_VIDEOS;
    } catch (error) {
        console.warn("Error fetching videos. Using mock data.", error);
        return MOCK_VIDEOS;
    }
};

export const syncProgress = async (user: User, progressMap: Record<string, boolean>) => {
    // 1. Save to LocalStorage
    const storageKey = `ada_progress_${user.email}`;
    localStorage.setItem(storageKey, JSON.stringify(progressMap));

    // 2. Try to save to Google Sheets (via Apps Script)
    try {
        const completadas = Object.values(progressMap).filter(v => v).length;
        
        await fetch(APP_CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                portal: 'ada',
                email: user.email,
                nombre: user.nombre,
                rol: user.rol,
                completadas: completadas,
                progresoJSON: JSON.stringify(progressMap)
            })
        });
        return true;
    } catch (error) {
        console.warn("Could not sync to Apps Script (likely CORS or network), but saved locally.", error);
        return false;
    }
};

export const loadLocalProgress = (email: string): Record<string, boolean> => {
    const saved = localStorage.getItem(`ada_progress_${email}`);
    return saved ? JSON.parse(saved) : {};
};