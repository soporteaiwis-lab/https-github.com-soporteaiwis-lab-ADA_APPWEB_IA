
// --- GOOGLE FIREBASE CLOUD DATABASE CONFIG ---
// Debes obtener estas credenciales en: https://console.firebase.google.com/
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDN6bUA6X06VQCLsUskCobzjV9LP85hT1Q",
  authDomain: "portal-ada-ia.firebaseapp.com",
  projectId: "portal-ada-ia",
  storageBucket: "portal-ada-ia.firebasestorage.app",
  messagingSenderId: "96287198149",
  appId: "1:96287198149:web:e85c201e8c44fdb38c19ac"
};

export const APP_CONFIG = {
  GITHUB_REPO_BASE: 'https://raw.githack.com/soporteaiwis-lab/ada/main',
};

export const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

// ESTRUCTURA VACÍA PARA INICIO LIMPIO
// Se definen las 4 semanas y los 5 días para que el Admin Panel genere los inputs,
// pero el contenido (title, desc, videoUrl) está vacío.
const EMPTY_DAY = { title: "", desc: "", videoUrl: "" };

export const SYLLABUS_DATA: Record<number, Record<string, { title: string; desc: string; videoUrl?: string }>> = {
  1: {
    lunes: { ...EMPTY_DAY, title: "Clase Pendiente" }, // Título placeholder para que sea clicable en Admin
    martes: { ...EMPTY_DAY },
    miercoles: { ...EMPTY_DAY },
    jueves: { ...EMPTY_DAY },
    viernes: { ...EMPTY_DAY }
  },
  2: {
    lunes: { ...EMPTY_DAY },
    martes: { ...EMPTY_DAY },
    miercoles: { ...EMPTY_DAY },
    jueves: { ...EMPTY_DAY },
    viernes: { ...EMPTY_DAY }
  },
  3: {
    lunes: { ...EMPTY_DAY },
    martes: { ...EMPTY_DAY },
    miercoles: { ...EMPTY_DAY },
    jueves: { ...EMPTY_DAY },
    viernes: { ...EMPTY_DAY }
  },
  4: {
    lunes: { ...EMPTY_DAY },
    martes: { ...EMPTY_DAY },
    miercoles: { ...EMPTY_DAY },
    jueves: { ...EMPTY_DAY },
    viernes: { ...EMPTY_DAY }
  }
};
