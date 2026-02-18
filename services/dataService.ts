
import { User, CourseModule } from '../types';
import { FIREBASE_CONFIG, INITIAL_MODULES } from '../constants';
// @ts-ignore
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';

// --- INITIALIZATION ---
let db: Firestore | null = null;
let isFirebaseReady = false;
let dbErrorType: string = 'none';

try {
    console.log("🔥 Inicializando Firebase (Modular - Cloud Only)...");
    
    // Usamos la importación modular estricta que coincide con el importmap de index.html (v10.8.0)
    const app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    
    isFirebaseReady = true;
    console.log("✅ Firebase SDK Inicializado Correctamente");
} catch (e: any) {
    console.error("❌ Error Init Firebase:", e);
    // Si falla 'Service firestore is not available', suele ser mismatch de versiones.
    // Al usar initializeApp de 'firebase/app' (gstatic) y getFirestore de 'firebase/firestore' (gstatic),
    // aseguramos compatibilidad.
    dbErrorType = 'init_failed';
}

// --- UTILS ---
export const extractVideoId = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : undefined;
};

export const getCloudStatus = () => isFirebaseReady;
export const getDbError = () => dbErrorType;

// --- MASTER USER (Always available in memory) ---
const MASTER_USER: User = {
    email: 'AIWIS',
    password: '1234',
    nombre: 'Master Root AIWIS',
    rol: 'Super Admin',
    habilidades: { prompting: 100, herramientas: 100, analisis: 100 },
    progreso: { porcentaje: 100, completados: 999, pendientes: 0 }
};

// --- ERROR HANDLING ---
function handleFirebaseError(error: any) {
    console.error("🔥 Error DataService:", error);
    const msg = error?.message || '';
    
    // 1. API Disabled / DB Not Created
    if (msg.includes('API has not been used') || msg.includes('is disabled') || msg.includes('Project has not yet been configured')) {
        dbErrorType = 'api_disabled';
        console.warn("⚠️ API NO HABILITADA: Debes crear la base de datos en Firebase Console.");
        return;
    }

    // 2. Permissions Error (Prioritize over offline)
    if (dbErrorType === 'permission' || dbErrorType === 'api_disabled') return;

    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
        dbErrorType = 'permission';
        console.warn("⚠️ PERMISO DENEGADO: Necesitas actualizar las Reglas en Firebase Console.");
    } else if (msg.includes('offline') || msg.includes('network') || msg.includes('connection')) {
        dbErrorType = 'network';
    } else {
        dbErrorType = 'unknown';
    }
}

// --- CLOUD OPERATIONS (NO LOCAL STORAGE FALLBACK) ---

export const getStoredUsers = async (): Promise<User[]> => {
    // Si no hay DB, devolvemos solo Master para que se pueda arreglar
    if (!db) {
        console.warn("Firebase DB no inicializada. Retornando usuario Maestro local.");
        return [MASTER_USER];
    }

    try {
        const docRef = doc(db, "ada_portal", "users");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            dbErrorType = 'none';
            return docSnap.data().list as User[];
        } else {
            // Document doesn't exist yet, return Master to allow first login and creation
            return [MASTER_USER];
        }
    } catch (error: any) {
        handleFirebaseError(error);
        // En caso de error (ej. permisos), devolvemos Master para permitir login y fix
        return [MASTER_USER];
    }
};

export const getStoredModules = async (): Promise<CourseModule[]> => {
    if (!db) return INITIAL_MODULES;

    try {
        const docRef = doc(db, "ada_portal", "modules");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data().list as CourseModule[];
        }
        return INITIAL_MODULES;
    } catch (error: any) {
        handleFirebaseError(error);
        return INITIAL_MODULES;
    }
};

export const saveUsersToCloud = async (users: User[]): Promise<boolean> => {
    if (!db) {
        alert("Error CRÍTICO: No hay conexión con Firebase. Revisa la consola.");
        return false;
    }
    try {
        const docRef = doc(db, "ada_portal", "users");
        await setDoc(docRef, { list: users }, { merge: true });
        console.log("✅ Usuarios guardados en Nube");
        return true;
    } catch (error: any) {
        handleFirebaseError(error);
        alert(`❌ ERROR AL GUARDAR: ${error.message}\n\nRevisa el panel de Admin > Botón 🛠️ para ver las instrucciones.`);
        return false;
    }
};

export const saveModulesToCloud = async (modules: CourseModule[]): Promise<boolean> => {
    if (!db) {
        alert("Error CRÍTICO: No hay conexión con Firebase.");
        return false;
    }
    try {
        const docRef = doc(db, "ada_portal", "modules");
        await setDoc(docRef, { list: modules }, { merge: true });
        console.log("✅ Módulos guardados en Nube");
        return true;
    } catch (error: any) {
        handleFirebaseError(error);
        alert(`❌ ERROR AL GUARDAR: ${error.message}\n\nRevisa el panel de Admin > Botón 🛠️ para ver las instrucciones.`);
        return false;
    }
};

export const syncProgress = async (user: User, progressMap: Record<string, boolean>) => {
    if (!db) return;
    try {
        const docRef = doc(db, "ada_portal", `progress_${user.email.replace(/\./g, '_')}`);
        await setDoc(docRef, { map: progressMap }, { merge: true });
    } catch (error: any) {
        handleFirebaseError(error);
    }
};

export const loadLocalProgress = async (email: string): Promise<Record<string, boolean>> => {
    if (!db) return {};
    try {
         const docRef = doc(db, "ada_portal", `progress_${email.replace(/\./g, '_')}`);
         const docSnap = await getDoc(docRef);
         if (docSnap.exists()) {
             return docSnap.data().map || {};
         }
    } catch (e) { /* ignore */ }
    return {};
};
