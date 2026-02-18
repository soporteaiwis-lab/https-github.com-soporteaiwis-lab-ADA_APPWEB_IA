import { User, SyllabusStructure } from '../types';
import { FIREBASE_CONFIG, SYLLABUS_DATA as INITIAL_SYLLABUS } from '../constants';
// import { initializeApp } from 'firebase/app';
// import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// --- MOCK FIREBASE IMPORTS ---
// Using mocks to resolve build errors. App will run in Offline Mode.
const initializeApp = (config: any) => null;
const getFirestore = (app: any) => null;
const doc = (db: any, ...args: any[]) => null;
const getDoc = (ref: any) => Promise.resolve({ exists: () => false, data: () => ({}) });
const setDoc = (ref: any, data: any, opts?: any) => Promise.resolve();
// -----------------------------

// --- INITIALIZATION ---
let db: any = null;
let isFirebaseReady = false;

// Attempt to initialize Firebase
try {
    if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "TU_API_KEY_AQUI") {
        // const app = initializeApp(FIREBASE_CONFIG);
        // db = getFirestore(app);
        // isFirebaseReady = true;
        // console.log("🔥 Firebase SDK Inicializado."); 
        console.warn("Firebase desactivado por errores de importación. Usando modo Offline.");
    }
} catch (e) {
    console.warn("Modo Offline forzado (Error init Firebase)");
}

// --- UTILS ---
export const extractVideoId = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : undefined;
};

// --- MASTER USER DEFAULT ---
const MASTER_USER: User = {
    email: 'AIWIS',
    password: '1234',
    nombre: 'Master Root AIWIS',
    rol: 'Super Admin',
    habilidades: { prompting: 100, herramientas: 100, analisis: 100 },
    progreso: { porcentaje: 100, completados: 999, pendientes: 0 }
};

// --- LOCAL STORAGE HELPERS (FALLBACK) ---
const LOCAL_USERS_KEY = 'ada_users_backup';
const LOCAL_SYLLABUS_KEY = 'ada_syllabus_backup';

const getLocalUsers = (): User[] => {
    const saved = localStorage.getItem(LOCAL_USERS_KEY);
    return saved ? JSON.parse(saved) : [MASTER_USER];
};

const saveLocalUsers = (users: User[]) => {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const getLocalSyllabus = (): SyllabusStructure => {
    const saved = localStorage.getItem(LOCAL_SYLLABUS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_SYLLABUS;
};

const saveLocalSyllabus = (data: SyllabusStructure) => {
    localStorage.setItem(LOCAL_SYLLABUS_KEY, JSON.stringify(data));
};

// --- HELPER TO PREVENT HANGING ---
const withTimeout = (promise: Promise<any>, ms: number) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
    ]);
};

// --- CLOUD OPERATIONS (FIRESTORE) ---

export const getCloudStatus = () => isFirebaseReady;

/**
 * Fetch Users: Try Cloud -> Fail -> Fallback to LocalStorage
 */
export const getStoredUsers = async (): Promise<User[]> => {
    // If we already know cloud is dead, go local immediately
    if (!isFirebaseReady || !db) {
        return getLocalUsers();
    }

    try {
        const docRef = doc(db, "ada_portal", "users");
        // Short timeout. If it hangs, we assume offline/permission issue.
        const docSnap: any = await withTimeout(getDoc(docRef), 2000);

        if (docSnap.exists()) {
            const data = docSnap.data();
            let users = data.list as User[];
            
            if (!Array.isArray(users) || !users.find(u => u.email === 'AIWIS')) {
                if (!Array.isArray(users)) users = [];
                users.unshift(MASTER_USER);
            }
            // Sync cloud data to local backup
            saveLocalUsers(users);
            return users;
        } else {
            // First run on cloud
            try {
                await setDoc(docRef, { list: [MASTER_USER] });
                saveLocalUsers([MASTER_USER]);
                return [MASTER_USER];
            } catch (writeError) {
                return getLocalUsers();
            }
        }
    } catch (error: any) {
        handleFirebaseError(error);
        // Fallback to local
        return getLocalUsers();
    }
};

/**
 * Fetch Syllabus: Try Cloud -> Fail -> Fallback to LocalStorage
 */
export const getStoredSyllabus = async (): Promise<SyllabusStructure> => {
    if (!isFirebaseReady || !db) {
        return getLocalSyllabus();
    }

    try {
        const docRef = doc(db, "ada_portal", "syllabus");
        const docSnap: any = await withTimeout(getDoc(docRef), 2000);

        if (docSnap.exists()) {
            const data = docSnap.data().data as SyllabusStructure;
            saveLocalSyllabus(data);
            return data;
        } else {
            try {
                await setDoc(docRef, { data: INITIAL_SYLLABUS });
                saveLocalSyllabus(INITIAL_SYLLABUS);
                return INITIAL_SYLLABUS;
            } catch (e) {
                return getLocalSyllabus();
            }
        }
    } catch (error: any) {
        handleFirebaseError(error);
        return getLocalSyllabus();
    }
};

/**
 * Save Users: Try Cloud -> Fail -> Save to LocalStorage
 */
export const saveUsersToCloud = async (users: User[]): Promise<boolean> => {
    // Always save local first for instant UI feeling
    saveLocalUsers(users);

    if (!isFirebaseReady || !db) return true; // Return true because local save succeeded

    try {
        const docRef = doc(db, "ada_portal", "users");
        await setDoc(docRef, { list: users }, { merge: true });
        console.log("Usuarios sincronizados con nube.");
        return true;
    } catch (error: any) {
        handleFirebaseError(error);
        console.log("Usuarios guardados LOCALMENTE (Nube desconectada).");
        return true; 
    }
};

/**
 * Save Syllabus: Try Cloud -> Fail -> Save to LocalStorage
 */
export const saveSyllabusToCloud = async (syllabus: SyllabusStructure): Promise<boolean> => {
    saveLocalSyllabus(syllabus);

    if (!isFirebaseReady || !db) return true;

    try {
        const docRef = doc(db, "ada_portal", "syllabus");
        await setDoc(docRef, { data: syllabus }, { merge: true });
        return true;
    } catch (error: any) {
        handleFirebaseError(error);
        return true;
    }
};

/**
 * Sync Progress
 */
export const syncProgress = async (user: User, progressMap: Record<string, boolean>) => {
    // Local is the source of truth for progress usually
    localStorage.setItem(`ada_progress_${user.email}`, JSON.stringify(progressMap));

    if (!isFirebaseReady || !db) return;

    try {
        const docRef = doc(db, "ada_portal", `progress_${user.email.replace(/\./g, '_')}`);
        await setDoc(docRef, { map: progressMap }, { merge: true });
    } catch (error: any) {
        // Silent fail, local storage handles it
        if (isPermissionError(error)) isFirebaseReady = false;
    }
};

/**
 * Load Progress
 */
export const loadLocalProgress = async (email: string): Promise<Record<string, boolean>> => {
    // Check local first for speed
    const saved = localStorage.getItem(`ada_progress_${email}`);
    let localData = saved ? JSON.parse(saved) : {};

    // Try to merge with cloud if available
    if (isFirebaseReady && db) {
        try {
             const docRef = doc(db, "ada_portal", `progress_${email.replace(/\./g, '_')}`);
             const docSnap: any = await withTimeout(getDoc(docRef), 1000);
             if (docSnap.exists()) {
                 const cloudData = docSnap.data().map || {};
                 // Merge: True wins
                 const merged = { ...localData, ...cloudData };
                 return merged;
             }
        } catch (e) {
            // Ignore cloud error
        }
    }

    return localData;
};

// --- ERROR HANDLING HELPER ---
function handleFirebaseError(error: any) {
    if (isPermissionError(error)) {
        if (isFirebaseReady) {
            console.warn("⚠️ CONEXIÓN GOOGLE CLOUD RECHAZADA: Cambiando a Modo Local Permanente para esta sesión.");
            // Kill the connection to stop further errors
            isFirebaseReady = false; 
            db = null; 
        }
    }
}

function isPermissionError(error: any) {
    const msg = error?.message || '';
    const code = error?.code || '';
    return (
        msg.includes('permission-denied') || 
        msg.includes('Cloud Firestore API has not been used') || 
        code === 'permission-denied'
    );
}