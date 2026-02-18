
import { User, CourseModule } from '../types';
import { FIREBASE_CONFIG, INITIAL_MODULES } from '../constants';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';

// --- INITIALIZATION ---
let db: Firestore | null = null;
let isFirebaseReady = false;
let dbErrorType: string = 'none';

try {
    console.log("🔥 Inicializando Firebase (Modular SDK)...");
    
    // Inicializamos App
    // @ts-ignore
    const app = initializeApp(FIREBASE_CONFIG);
    
    // Intento 1: Conectar a la DB nombrada 'aiwis-bd-ia-portal'
    try {
        db = getFirestore(app, "aiwis-bd-ia-portal");
        isFirebaseReady = true;
        console.log("✅ Instancia Firestore creada: aiwis-bd-ia-portal");
    } catch (e) {
        console.warn("⚠️ Falló conexión a DB nombrada, intentando default...", e);
        // Fallback a default si la nombrada falla (versiones viejas o configuración)
        db = getFirestore(app); 
        isFirebaseReady = true;
    }

} catch (e: any) {
    console.error("❌ Error CRÍTICO init Firebase:", e);
    isFirebaseReady = false;
    // Detectar si el error es por clave inválida
    if (e.message && (e.message.includes('API key') || e.message.includes('blocked'))) {
        dbErrorType = 'blocked_key';
    } else {
        dbErrorType = 'missing_db';
    }
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

// --- LOCAL STORAGE HELPERS ---
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

const withTimeout = (promise: Promise<any>, ms: number) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
    ]);
};

// --- CLOUD OPERATIONS ---

export const getCloudStatus = () => isFirebaseReady;
export const getDbError = () => dbErrorType;

// Centralized error handler
function handleFirebaseError(error: any) {
    console.error("🔥 Error DataService:", error);
    const msg = error?.message || '';
    const code = error?.code || '';

    // PERMISSION DENIED (Reglas de Seguridad)
    if (code === 'permission-denied' || msg.includes('permission-denied') || msg.includes('insufficient permissions')) {
        dbErrorType = 'permission';
        isFirebaseReady = false; 
        return;
    }

    // DATABASE NOT FOUND
    if (code === 'not-found' || msg.includes('not-found')) {
        dbErrorType = 'missing_db';
        isFirebaseReady = false;
        return;
    }

    // API KEY ISSUES
    if (msg.includes('API key') || msg.includes('blocked') || msg.includes('expired')) {
        dbErrorType = 'blocked_key';
        isFirebaseReady = false;
        return;
    }
}

export const getStoredUsers = async (): Promise<User[]> => {
    if (!isFirebaseReady || !db) return getLocalUsers();

    try {
        const docRef = doc(db, "ada_portal", "users");
        const docSnap: any = await withTimeout(getDoc(docRef), 3000);

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
            console.log("Creando doc usuarios inicial...");
            await setDoc(docRef, { list: [MASTER_USER] });
            saveLocalUsers([MASTER_USER]);
            dbErrorType = 'none';
            return [MASTER_USER];
        }
    } catch (error: any) {
        handleFirebaseError(error);
        return getLocalUsers();
    }
};

export const getStoredModules = async (): Promise<CourseModule[]> => {
    if (!isFirebaseReady || !db) return getLocalModules();

    try {
        const docRef = doc(db, "ada_portal", "modules");
        const docSnap: any = await withTimeout(getDoc(docRef), 3000);

        if (docSnap.exists()) {
            const data = docSnap.data().list as CourseModule[];
            saveLocalModules(data || []);
            return data || [];
        } else {
            await setDoc(docRef, { list: INITIAL_MODULES });
            saveLocalModules(INITIAL_MODULES);
            return INITIAL_MODULES;
        }
    } catch (error: any) {
        if (dbErrorType === 'none') handleFirebaseError(error);
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
        return false; 
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
        return false;
    }
};

export const syncProgress = async (user: User, progressMap: Record<string, boolean>) => {
    localStorage.setItem(`ada_progress_${user.email}`, JSON.stringify(progressMap));
    if (!isFirebaseReady || !db) return;

    try {
        const docRef = doc(db, "ada_portal", `progress_${user.email.replace(/\./g, '_')}`);
        await setDoc(docRef, { map: progressMap }, { merge: true });
    } catch (error: any) {
        handleFirebaseError(error);
    }
};

export const loadLocalProgress = async (email: string): Promise<Record<string, boolean>> => {
    const saved = localStorage.getItem(`ada_progress_${email}`);
    let localData = saved ? JSON.parse(saved) : {};

    if (isFirebaseReady && db) {
        try {
             const docRef = doc(db, "ada_portal", `progress_${email.replace(/\./g, '_')}`);
             const docSnap: any = await withTimeout(getDoc(docRef), 2000);
             if (docSnap.exists()) {
                 const cloudData = docSnap.data().map || {};
                 return { ...localData, ...cloudData };
             }
        } catch (e) { /* ignore */ }
    }
    return localData;
};
