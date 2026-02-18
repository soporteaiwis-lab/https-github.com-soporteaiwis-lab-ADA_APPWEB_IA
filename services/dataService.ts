import { User, SyllabusStructure } from '../types';
import { APP_CONFIG, SYLLABUS_DATA as INITIAL_SYLLABUS } from '../constants';

// --- UTILS ---
export const extractVideoId = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : undefined;
};

// --- MASTER USER (Always exists in memory for recovery) ---
const MASTER_USER: User = {
    email: 'AIWIS',
    password: '1234',
    nombre: 'Master Root AIWIS',
    rol: 'Super Admin',
    habilidades: { prompting: 100, herramientas: 100, analisis: 100 },
    progreso: { porcentaje: 100, completados: 999, pendientes: 0 }
};

// --- CLOUD SYNC SERVICES ---

/**
 * Fetch all data (Users and Syllabus) from the Google Cloud (Apps Script)
 */
export const fetchCloudData = async () => {
    try {
        // We add a timestamp to prevent browser caching of the GET request
        const response = await fetch(`${APP_CONFIG.APPS_SCRIPT_URL}?action=getData&t=${Date.now()}`);
        if (!response.ok) throw new Error("Error conectando a Google Cloud");
        
        const data = await response.json();
        return {
            users: data.users || [],
            syllabus: data.syllabus || null
        };
    } catch (error) {
        console.error("Cloud Fetch Error:", error);
        return { users: [], syllabus: null };
    }
};

/**
 * Save Users List to Google Cloud
 */
export const saveUsersToCloud = async (users: User[]): Promise<boolean> => {
    try {
        await fetch(APP_CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Standard for GAS Web Apps
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'saveUsers',
                data: users
            })
        });
        // Since no-cors returns opaque response, we assume success if no network error
        // Update local cache for instant feedback
        localStorage.setItem('ada_db_users', JSON.stringify(users));
        return true;
    } catch (error) {
        console.error("Cloud Save Error (Users):", error);
        return false;
    }
};

/**
 * Save Syllabus Structure to Google Cloud
 */
export const saveSyllabusToCloud = async (syllabus: SyllabusStructure): Promise<boolean> => {
    try {
        await fetch(APP_CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'saveSyllabus',
                data: syllabus
            })
        });
        localStorage.setItem('ada_db_syllabus', JSON.stringify(syllabus));
        return true;
    } catch (error) {
        console.error("Cloud Save Error (Syllabus):", error);
        return false;
    }
};

// --- DATA ACCESSORS ---

export const getStoredUsers = async (): Promise<User[]> => {
    // 1. Try Cloud First
    const cloudData = await fetchCloudData();
    
    // 2. If Cloud returns valid users, use them
    if (cloudData.users && cloudData.users.length > 0) {
        // Ensure Master is always present even if DB is wiped
        const hasMaster = cloudData.users.find((u: User) => u.email === 'AIWIS');
        if (!hasMaster) cloudData.users.unshift(MASTER_USER);
        
        localStorage.setItem('ada_db_users', JSON.stringify(cloudData.users));
        return cloudData.users;
    }

    // 3. Fallback to LocalStorage
    const stored = localStorage.getItem('ada_db_users');
    if (stored) return JSON.parse(stored);

    // 4. Fallback to Initial Hardcoded
    return [MASTER_USER]; 
};

export const getStoredSyllabus = async (): Promise<SyllabusStructure> => {
    const cloudData = await fetchCloudData();
    
    if (cloudData.syllabus) {
        localStorage.setItem('ada_db_syllabus', JSON.stringify(cloudData.syllabus));
        return cloudData.syllabus;
    }

    const stored = localStorage.getItem('ada_db_syllabus');
    return stored ? JSON.parse(stored) : INITIAL_SYLLABUS;
};


// --- HELPERS ---

export const syncProgress = async (user: User, progressMap: Record<string, boolean>) => {
    // 1. Save locally immediately
    const storageKey = `ada_progress_${user.email}`;
    localStorage.setItem(storageKey, JSON.stringify(progressMap));

    // 2. Send to Cloud
    try {
        await fetch(APP_CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'saveProgress',
                email: user.email,
                progress: progressMap
            })
        });
    } catch (e) {
        console.warn("Background sync failed", e);
    }
};

export const loadLocalProgress = (email: string): Record<string, boolean> => {
    const saved = localStorage.getItem(`ada_progress_${email}`);
    return saved ? JSON.parse(saved) : {};
};