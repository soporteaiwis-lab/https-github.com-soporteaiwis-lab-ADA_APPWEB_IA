
// --- GOOGLE FIREBASE CLOUD DATABASE CONFIG ---
// ⚠️ CONFIGURACIÓN SEGURA DE API KEY
// 1. Usa Variables de Entorno (.env) para no exponer tu clave en GitHub.
// 2. Si usas Vite, usa VITE_FIREBASE_API_KEY. Si usas CRA, usa REACT_APP_FIREBASE_API_KEY.
// 3. RESTRINGE tu API Key en Google Cloud Console a tu dominio (*.run.app, localhost).

const getEnvVar = (key: string, viteKey: string): string | undefined => {
  try {
    // Intenta Node/CRA (process.env)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) { /* ignore */ }

  try {
    // Intenta Vite (import.meta.env)
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env[viteKey]) {
      // @ts-ignore
      return import.meta.env[viteKey];
    }
  } catch (e) { /* ignore */ }

  return undefined;
};

// Obtener clave o usar marcador de posición
const apiKey = getEnvVar('REACT_APP_FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY') || "TU_API_KEY_NUEVA_RESTRINGIDA";

export const FIREBASE_CONFIG = {
  apiKey: apiKey,
  authDomain: "aiwis-mentor-clases.firebaseapp.com",
  projectId: "aiwis-mentor-clases", 
  storageBucket: "aiwis-mentor-clases.firebasestorage.app",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

export const APP_CONFIG = {
  // Configuración limpia
};

// ESTADO INICIAL VACÍO
export const INITIAL_MODULES = [];
