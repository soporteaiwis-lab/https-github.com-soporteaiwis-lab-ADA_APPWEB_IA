// --- GOOGLE FIREBASE CLOUD DATABASE CONFIG ---
// Debes obtener estas credenciales en: https://console.firebase.google.com/
// Crea un proyecto, agrega una "Web App" y copia la configuración aquí.
export const FIREBASE_CONFIG = {
  apiKey: "TU_API_KEY_AQUI", // Reemplazar con datos reales
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

export const APP_CONFIG = {
  // Eliminada la URL de Apps Script (Google Sheets)
  GITHUB_REPO_BASE: 'https://raw.githack.com/soporteaiwis-lab/ada/main',
};

export const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

export const SYLLABUS_DATA: Record<number, Record<string, { title: string; desc: string }>> = {
  1: {
    lunes: {
      title: "Introducción a la IA Corporativa",
      desc: "Presentación del programa, objetivos y visión. ¿Qué es la IA y por qué es crucial para ADA?"
    },
    martes: {
      title: "Dominando ChatGPT y Claude",
      desc: "Aprenderás a usar las herramientas de IA más potentes del mercado para maximizar tu productividad."
    },
    miercoles: {
      title: "Ingeniería de Prompts Profesional",
      desc: "Técnicas avanzadas de prompting para obtener resultados profesionales de los LLMs."
    },
    jueves: {
      title: "IA para Desarrolladores I",
      desc: "Introducción al desarrollo con IA: Copilot, Cursor y herramientas de código asistido."
    },
    viernes: {
      title: "Automatización de Tareas Diarias",
      desc: "Cómo automatizar tus tareas repetitivas usando IA y scripts simples."
    }
  },
  2: {
    lunes: {
      title: "IA en Azure Databricks",
      desc: "Introducción a la plataforma Azure Databricks y casos de uso con IA."
    },
    martes: {
      title: "Soluciones IA con Oracle y AWS",
      desc: "Panorama de soluciones IA en las plataformas cloud más importantes."
    },
    miercoles: {
      title: "Automatización Real con N8N",
      desc: "Webinar práctico sobre cómo crear automatizaciones reales que se usan en producción."
    },
    jueves: {
      title: "IA para el Sector Financiero",
      desc: "Casos de uso específicos de IA en el sector financiero y bancario."
    },
    viernes: {
      title: "Estrategias de Venta de Soluciones IA",
      desc: "Cómo vender proyectos de IA a clientes: desde la prospección hasta el cierre."
    }
  },
  3: {
    lunes: {
      title: "Arquitectura de Sistemas IA",
      desc: "Diseño de arquitecturas escalables para soluciones de IA empresariales."
    },
    martes: {
      title: "Agentes IA y LangChain",
      desc: "Creación de agentes inteligentes que pueden ejecutar tareas complejas de forma autónoma."
    },
    miercoles: {
      title: "Workflows Enterprise con N8N",
      desc: "Webinar avanzado sobre workflows empresariales con N8N."
    },
    jueves: {
      title: "Workshop: Propuestas para Cliente BCI",
      desc: "Workshop práctico desarrollando una propuesta real para el cliente BCI."
    },
    viernes: {
      title: "Workshop: Automatizaciones Internas",
      desc: "Identificación y desarrollo de automatizaciones para procesos internos de ADA."
    }
  },
  4: {
    lunes: {
      title: "Detección de Oportunidades IA",
      desc: "Metodología para identificar oportunidades de IA en cualquier negocio."
    },
    martes: {
      title: "Design Thinking para Proyectos IA",
      desc: "Aplicación de Design Thinking en el diseño de soluciones de IA."
    },
    miercoles: {
      title: "Elaboración de Propuestas Comerciales",
      desc: "Cómo estructurar propuestas comerciales ganadoras para proyectos de IA."
    },
    jueves: {
      title: "Presentación Final de Propuestas",
      desc: "Cada equipo presenta su propuesta de proyecto para recibir feedback."
    },
    viernes: {
      title: "Selección de Proyecto Final",
      desc: "Votación y selección del proyecto que se desarrollará en la Fase 2."
    }
  }
};