
// --- GOOGLE FIREBASE CLOUD DATABASE CONFIG ---
// ⚠️ IMPORTANTE: PEGA AQUÍ LAS CREDENCIALES DEL PROYECTO "AIWIS MENTOR CLASES"
// Ve a: https://console.firebase.google.com/ > Tu Proyecto > Configuración del Proyecto > General > Tus Apps > SDK Setup
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDSaR4mpibwg6XSkQdE8jlwOMq7WoWXKpg",
  authDomain: "gen-lang-client-0359889313.firebaseapp.com",
  projectId: "gen-lang-client-0359889313",
  storageBucket: "gen-lang-client-0359889313.firebasestorage.app",
  messagingSenderId: "360369243391",
  appId: "1:360369243391:web:3d7f883ed29ac6462af8ca"
};

export const APP_CONFIG = {
  GITHUB_REPO_BASE: 'https://raw.githack.com/soporteaiwis-lab/ada/main',
};

export const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

// ESTRUCTURA VACÍA PARA INICIO LIMPIO (CANVAS EN BLANCO)
const EMPTY_DAY = { title: "", desc: "", videoUrl: "" };

export const SYLLABUS_DATA: Record<number, Record<string, { title: string; desc: string; videoUrl?: string }>> = {
  1: {
    lunes: { ...EMPTY_DAY },
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