
import { User, CourseModule } from '../types';
import { FIREBASE_CONFIG, INITIAL_MODULES } from '../constants';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// --- INITIALIZATION ---
let db: any = null;
let isFirebaseReady = false;
let dbErrorType: 'none' | 'permission' | 'missing_db' = 'none';

try {
    if (FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes("TU_API_KEY")) {
        const app = initializeApp(FIREBASE_CONFIG);
        try {
            // Conectando a la base de datos específica solicitada
            db = getFirestore(app, "aiwis-bd-ia-portal");
            isFirebaseReady = true;
            console.log("🔥 Firebase SDK Inicializado. Conectando a DB: aiwis-bd-ia-portal"); 
        } catch (dbError) {
            console.error("Error conectando a la base de datos nombrada:", dbError);
            db = getFirestore(app);
        }
    }
} catch (e) {
    console.warn("Modo Offline forzado (Error init Firebase)", e);
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
// Bumped to v5 for MODULE structure (Clean slate)
const LOCAL_USERS_KEY = 'ada_users_v5_modules';
const LOCAL_SYLLABUS_KEY = 'ada_modules_v5_clean';

const getLocalUsers = (): User[] => {
    const saved = localStorage.getItem(LOCAL_USERS_KEY);
    return saved ? JSON.parse(saved) : [MASTER_USER];
};

const saveLocalUsers = (users: User[]) => {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const getLocalModules = (): CourseModule[] => {
    const saved = localStorage.getItem(LOCAL_SYLLABUS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_MODULES;
};

const saveLocalModules = (data: CourseModule[]) => {
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
export const getDbError = () => dbErrorType;

export const getStoredUsers = async (): Promise<User[]> => {
    if (!isFirebaseReady || !db) {
        return getLocalUsers();
    }

    try {
        const docRef = doc(db, "ada_portal", "users");
        const docSnap: any = await withTimeout(getDoc(docRef), 2500);

        if (docSnap.exists()) {
            const data = docSnap.data();
            let users = data.list as User[];
            
            if (!Array.isArray(users) || !users.find(u => u.email === 'AIWIS')) {
                if (!Array.isArray(users)) users = [];
                users.unshift(MASTER_USER);
            }
            saveLocalUsers(users);
            dbErrorType = 'none';
            return users;
        } else {
            console.log("Creando documento inicial de usuarios...");
            try {
                await setDoc(docRef, { list: [MASTER_USER] });
                saveLocalUsers([MASTER_USER]);
                dbErrorType = 'none';
                return [MASTER_USER];
            } catch (writeError) {
                handleFirebaseError(writeError);
                return getLocalUsers();
            }
        }
    } catch (error: any) {
        handleFirebaseError(error);
        return getLocalUsers();
    }
};

/**
 * Fetch Modules (New Structure)
 */
export const getStoredModules = async (): Promise<CourseModule[]> => {
    if (!isFirebaseReady || !db) {
        return getLocalModules();
    }

    try {
        // We use a new document "modules" instead of "syllabus" to avoid conflicts
        const docRef = doc(db, "ada_portal", "modules");
        const docSnap: any = await withTimeout(getDoc(docRef), 2500);

        if (docSnap.exists()) {
            const data = docSnap.data().list as CourseModule[];
            saveLocalModules(data || []);
            return data || [];
        } else {
            try {
                await setDoc(docRef, { list: INITIAL_MODULES });
                saveLocalModules(INITIAL_MODULES);
                return INITIAL_MODULES;
            } catch (e) {
                return getLocalModules();
            }
        }
    } catch (error: any) {
        handleFirebaseError(error);
        return getLocalModules();
    }
};

export const saveUsersToCloud = async (users: User[]): Promise<boolean> => {
    saveLocalUsers(users);
    if (!isFirebaseReady || !db) return true; 

    try {
        const docRef = doc(db, "ada_portal", "users");
        await setDoc(docRef, { list: users }, { merge: true });
        return true;
    } catch (error: any) {
        handleFirebaseError(error);
        return true; 
    }
};

export const saveModulesToCloud = async (modules: CourseModule[]): Promise<boolean> => {
    saveLocalModules(modules);
    if (!isFirebaseReady || !db) return true;

    try {
        const docRef = doc(db, "ada_portal", "modules");
        await setDoc(docRef, { list: modules }, { merge: true });
        return true;
    } catch (error: any) {
        handleFirebaseError(error);
        return true;
    }
};

export const syncProgress = async (user: User, progressMap: Record<string, boolean>) => {
    localStorage.setItem(`ada_progress_${user.email}`, JSON.stringify(progressMap));
    if (!isFirebaseReady || !db) return;

    try {
        const docRef = doc(db, "ada_portal", `progress_${user.email.replace(/\./g, '_')}`);
        await setDoc(docRef, { map: progressMap }, { merge: true });
    } catch (error: any) {
        if (isBlockingError(error)) isFirebaseReady = false;
    }
};

export const loadLocalProgress = async (email: string): Promise<Record<string, boolean>> => {
    const saved = localStorage.getItem(`ada_progress_${email}`);
    let localData = saved ? JSON.parse(saved) : {};

    if (isFirebaseReady && db) {
        try {
             const docRef = doc(db, "ada_portal", `progress_${email.replace(/\./g, '_')}`);
             const docSnap: any = await withTimeout(getDoc(docRef), 1500);
             if (docSnap.exists()) {
                 const cloudData = docSnap.data().map || {};
                 return { ...localData, ...cloudData };
             }
        } catch (e) { /* ignore */ }
    }
    return localData;
};

// --- ERROR HANDLING ---
function handleFirebaseError(error: any) {
    console.error("Firebase Error Detectado:", error);
    
    if (error?.code === 'not-found' || error?.message?.includes('not-found') || (error?.message?.includes('database') && error?.message?.includes('does not exist'))) {
        dbErrorType = 'missing_db';
        isFirebaseReady = false;
        db = null;
        return;
    }

    if (isBlockingError(error)) {
        dbErrorType = 'permission';
        if (isFirebaseReady) {
            console.warn("⚠️ CONEXIÓN RECHAZADA: Modo Local.");
            isFirebaseReady = false; 
            db = null; 
        }
    }
}

function isBlockingError(error: any) {
    const msg = error?.message || '';
    const code = error?.code || '';
    return (
        msg.includes('permission-denied') || 
        msg.includes('Cloud Firestore API has not been used') || 
        msg.includes('Missing or insufficient permissions') ||
        code === 'permission-denied'
    );
}
