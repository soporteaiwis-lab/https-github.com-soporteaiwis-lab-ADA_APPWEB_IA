import { User, SyllabusStructure } from '../types';
import { FIREBASE_CONFIG, SYLLABUS_DATA as INITIAL_SYLLABUS } from '../constants';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// --- INITIALIZATION ---
let db: any = null;
let isFirebaseReady = false;

// Attempt to initialize Firebase
try {
    if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "TU_API_KEY_AQUI") {
        const app = initializeApp(FIREBASE_CONFIG);
        db = getFirestore(app);
        isFirebaseReady = true;
        console.log("🔥 Firebase Firestore Conectado Exitosamente");
    } else {
        console.warn("⚠️ Firebase no configurado. Revisa constants.ts");
    }
} catch (e) {
    console.error("Error inicializando Firebase:", e);
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

// --- CLOUD OPERATIONS (FIRESTORE) ---

export const getCloudStatus = () => isFirebaseReady;

/**
 * Fetch Users from Firestore 'ada_portal/users'
 */
export const getStoredUsers = async (): Promise<User[]> => {
    if (!isFirebaseReady || !db) {
        // Fallback TEMPORAL en memoria si no hay nube configurada
        return [MASTER_USER];
    }

    try {
        const docRef = doc(db, "ada_portal", "users");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            let users = data.list as User[];
            
            // Ensure Master Exists
            if (!users.find(u => u.email === 'AIWIS')) {
                users.unshift(MASTER_USER);
            }
            return users;
        } else {
            // First run: Create the doc
            await setDoc(docRef, { list: [MASTER_USER] });
            return [MASTER_USER];
        }
    } catch (error) {
        console.error("Error leyendo usuarios de Firestore:", error);
        return [MASTER_USER];
    }
};

/**
 * Fetch Syllabus from Firestore 'ada_portal/syllabus'
 */
export const getStoredSyllabus = async (): Promise<SyllabusStructure> => {
    if (!isFirebaseReady || !db) {
        return INITIAL_SYLLABUS;
    }

    try {
        const docRef = doc(db, "ada_portal", "syllabus");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data().data as SyllabusStructure;
        } else {
            // First run: Create the doc with initial data
            await setDoc(docRef, { data: INITIAL_SYLLABUS });
            return INITIAL_SYLLABUS;
        }
    } catch (error) {
        console.error("Error leyendo syllabus de Firestore:", error);
        return INITIAL_SYLLABUS;
    }
};

/**
 * Save Users to Cloud
 */
export const saveUsersToCloud = async (users: User[]): Promise<boolean> => {
    if (!isFirebaseReady || !db) return false;

    try {
        const docRef = doc(db, "ada_portal", "users");
        await setDoc(docRef, { list: users }, { merge: true });
        console.log("Usuarios guardados en nube");
        return true;
    } catch (error) {
        console.error("Error guardando usuarios:", error);
        return false;
    }
};

/**
 * Save Syllabus to Cloud
 */
export const saveSyllabusToCloud = async (syllabus: SyllabusStructure): Promise<boolean> => {
    if (!isFirebaseReady || !db) return false;

    try {
        const docRef = doc(db, "ada_portal", "syllabus");
        await setDoc(docRef, { data: syllabus }, { merge: true });
        console.log("Syllabus guardado en nube");
        return true;
    } catch (error) {
        console.error("Error guardando syllabus:", error);
        return false;
    }
};

/**
 * Sync Progress to Cloud (Firestore: ada_portal/progress_{email})
 */
export const syncProgress = async (user: User, progressMap: Record<string, boolean>) => {
    // We update localstorage JUST for session persistence, but truth is cloud
    localStorage.setItem(`ada_progress_${user.email}`, JSON.stringify(progressMap));

    if (!isFirebaseReady || !db) return;

    try {
        const docRef = doc(db, "ada_portal", `progress_${user.email.replace(/\./g, '_')}`); // Clean email for ID
        await setDoc(docRef, { map: progressMap }, { merge: true });
    } catch (error) {
        console.error("Error sincronizando progreso:", error);
    }
};

/**
 * Load Progress from Cloud
 */
export const loadLocalProgress = async (email: string): Promise<Record<string, boolean>> => {
    // Try Cloud First
    if (isFirebaseReady && db) {
        try {
             const docRef = doc(db, "ada_portal", `progress_${email.replace(/\./g, '_')}`);
             const docSnap = await getDoc(docRef);
             if (docSnap.exists()) {
                 const data = docSnap.data();
                 return data.map || {};
             }
        } catch (e) {
            console.warn("No se pudo leer progreso nube, intentando local...");
        }
    }

    // Fallback Local (Session only)
    const saved = localStorage.getItem(`ada_progress_${email}`);
    return saved ? JSON.parse(saved) : {};
};