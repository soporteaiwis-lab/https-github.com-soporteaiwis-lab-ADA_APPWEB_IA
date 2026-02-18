
// --- GOOGLE FIREBASE CLOUD DATABASE CONFIG ---

// 🔴 IMPORTANTE: PEGA TU NUEVA API KEY DENTRO DE LAS COMILLAS DE ABAJO:
// (Asegúrate de que la clave tenga restricciones de dominio en Google Cloud Console para que no te la bloqueen)
const MANUAL_API_KEY = "AIzaSyDSaR4mpibwg6XSkQdE8jlwOMq7WoWXKpg"; // <--- CLAVE INYECTADA

// ⚠️ CONFIGURACIÓN AVANZADA (VARIABLES DE ENTORNO)
// Si prefieres usar archivo .env, el sistema buscará ahí primero.
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

// Lógica de selección de clave: .env > Manual > Placeholder
const apiKey = getEnvVar('REACT_APP_FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY') || (MANUAL_API_KEY.length > 5 ? MANUAL_API_KEY : "TU_API_KEY_PENDIENTE");

export const FIREBASE_CONFIG = {
  apiKey: apiKey,
  authDomain: "portal-ada-ia.firebaseapp.com", // Updated to match error log
  projectId: "portal-ada-ia",                // Updated to match error log
  storageBucket: "portal-ada-ia.firebasestorage.app",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

export const APP_CONFIG = {
  // Configuración limpia
};

export const INITIAL_MODULES = [];
