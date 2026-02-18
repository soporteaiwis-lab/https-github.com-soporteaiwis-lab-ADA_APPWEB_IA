import { User, SyllabusStructure } from '../types';
import { FIREBASE_CONFIG, SYLLABUS_DATA as INITIAL_SYLLABUS } from '../constants';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// --- INITIALIZATION ---
let db: any = null;
let isFirebaseReady = false;
// Track specific error type for UI feedback
let dbErrorType: 'none' | 'permission' | 'missing_db' = 'none';

// Attempt to initialize Firebase
try {
    // Check if config is valid (not placeholder)
    if (FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes("TU_API_KEY")) {
        const app = initializeApp(FIREBASE_CONFIG);
        
        // CRITICAL FIX: Connect to the specific named database "aiwis-bd-ia-portal"
        // The second argument specifies the database ID.
        try {
            db = getFirestore(app, "aiwis-bd-ia-portal");
            isFirebaseReady = true;
            console.log("🔥 Firebase SDK Inicializado. Conectando a DB: aiwis-bd-ia-portal"); 
        } catch (dbError) {
            console.error("Error conectando a la base de datos nombrada:", dbError);
            // Fallback to default if named fails, though user requested specific one
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
// Bumped to v4 to ensure clean start for new project
const LOCAL_USERS_KEY = 'ada_users_v4_clean';
const LOCAL_SYLLABUS_KEY = 'ada_syllabus_v4_clean';

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
export const getDbError = () => dbErrorType;

/**
 * Fetch Users: Try Cloud -> Fail -> Fallback to LocalStorage
 */
export const getStoredUsers = async (): Promise<User[]> => {
    if (!isFirebaseReady || !db) {
        return getLocalUsers();
    }

    try {
        const docRef = doc(db, "ada_portal", "users");
        // Short timeout. If it hangs, we assume offline/permission issue.
        const docSnap: any = await withTimeout(getDoc(docRef), 2500);

        if (docSnap.exists()) {
            const data = docSnap.data();
            let users = data.list as User[];
            
            if (!Array.isArray(users) || !users.find(u => u.email === 'AIWIS')) {
                if (!Array.isArray(users)) users = [];
                users.unshift(MASTER_USER);
            }
            saveLocalUsers(users);
            dbErrorType = 'none'; // Success
            return users;
        } else {
            // First run on cloud - CREATE THE DOCUMENT
            console.log("Creando documento inicial en la nube (aiwis-bd-ia-portal)...");
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
 * Fetch Syllabus
 */
export const getStoredSyllabus = async (): Promise<SyllabusStructure> => {
    if (!isFirebaseReady || !db) {
        return getLocalSyllabus();
    }

    try {
        const docRef = doc(db, "ada_portal", "syllabus");
        const docSnap: any = await withTimeout(getDoc(docRef), 2500);

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

export const saveUsersToCloud = async (users: User[]): Promise<boolean> => {
    saveLocalUsers(users);
    if (!isFirebaseReady || !db) return true; 

    try {
        const docRef = doc(db, "ada_portal", "users");
        await setDoc(docRef, { list: users }, { merge: true });
        console.log("Usuarios sincronizados con nube.");
        return true;
    } catch (error: any) {
        handleFirebaseError(error);
        return true; 
    }
};

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
    
    // Check for "Database Not Found" (Project exists but DB not created or wrong name)
    if (error?.code === 'not-found' || error?.message?.includes('not-found') || error?.message?.includes('database') && error?.message?.includes('does not exist')) {
        dbErrorType = 'missing_db';
        isFirebaseReady = false;
        db = null;
        return;
    }

    // Check for Permission/Rules issues
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