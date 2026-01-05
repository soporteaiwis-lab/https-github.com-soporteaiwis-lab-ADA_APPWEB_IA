import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing for Gemini");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const askGeminiTutor = async (context: string, question: string): Promise<string> => {
    try {
        const client = getClient();
        const model = "gemini-2.5-flash-latest"; 
        
        const systemInstruction = `
            Eres un tutor experto en Inteligencia Artificial para el programa corporativo ADA.
            Tu objetivo es ayudar a los estudiantes a comprender los conceptos de la clase actual.
            
            Contexto de la clase actual:
            ${context}
            
            Responde de manera concisa, alentadora y profesional. Usa emojis ocasionalmente.
            Si la pregunta no está relacionada con IA o tecnología, guia amablemente al usuario de vuelta al tema.
        `;

        const response = await client.models.generateContent({
            model: model,
            contents: [{
                role: 'user',
                parts: [{ text: question }]
            }],
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text || "Lo siento, no pude generar una respuesta en este momento.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Hubo un error al conectar con el tutor IA. Por favor intenta más tarde.";
    }
};

export const generateSmartReport = async (userName: string, progress: number, ideas: any[]): Promise<string> => {
     try {
        const client = getClient();
        const model = "gemini-2.5-flash-latest"; 

        const ideasText = ideas.map(i => `- ${i.type}: ${i.text}`).join('\n');
        
        const prompt = `
            Genera un resumen ejecutivo breve y motivador para el estudiante ${userName}.
            Progreso del curso: ${progress}%.
            
            Sus ideas y preguntas registradas son:
            ${ideasText}
            
            El reporte debe tener 2 párrafos:
            1. Análisis del progreso y motivación.
            2. Sugerencias basadas en sus ideas/preguntas (si las hay) o sugerencias generales de estudio de IA.
            Formato: Texto plano listo para insertar en un HTML.
        `;

        const response = await client.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text || "No se pudo generar el reporte inteligente.";
    } catch (error) {
        return "Error al generar reporte inteligente.";
    }
}