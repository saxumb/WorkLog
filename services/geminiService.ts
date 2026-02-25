
import { GoogleGenAI, Type } from "@google/genai";
import { Activity, Project } from "../types";

// Initialize Gemini API client using the mandatory environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Summarizes the user's work activities using Gemini 3 Flash.
 */
export const summarizeWork = async (activities: Activity[], projects: Project[]) => {
  if (!navigator.onLine) {
    return "L'analisi AI richiede una connessione internet. Funzionalità non disponibile offline.";
  }

  const model = 'gemini-3-flash-preview';
  
  const activitiesContext = activities.map(a => {
    const project = projects.find(p => p.id === a.projectId);
    const durationMin = Math.round(a.durationSeconds / 60);
    return `Project: ${project?.name || 'Unknown'}, Code: ${a.activityCode}, Details: ${a.description || 'N/A'}, Duration: ${durationMin} mins`;
  }).join('\n');

  const prompt = `
    Analizza queste attività lavorative e crea un report professionale e conciso in Italiano.
    Organizzalo per commessa. Per ogni commessa, sintetizza i risultati principali basandoti sui codici attività e sulle descrizioni.
    Concludi con un consiglio su come migliorare la gestione del tempo o un'osservazione sui trend.
    
    Attività:
    ${activitiesContext}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Impossibile generare il report AI al momento.";
  }
};

/**
 * Parses natural language input into structured activity data using Gemini 3 Pro for complex reasoning.
 */
export const parseActivityInput = async (input: string, projects: Project[]) => {
  if (!navigator.onLine) {
    return null;
  }

  const model = 'gemini-3-pro-preview';
  
  const projectsContext = projects.map(p => `ID: ${p.id}, Nome: ${p.name}, Cliente: ${p.client}`).join('\n');
  
  const prompt = `
    Analizza la seguente frase dell'utente e trasformala in dati strutturati per una scheda attività.
    Trova la commessa corrispondente tra quelle fornite.
    Estrai un codice attività (breve stringa, lascia vuoto se non rilevabile) e una descrizione.
    Estrai la durata in minuti.

    Progetti Disponibili:
    ${projectsContext}

    Input Utente: "${input}"

    Rispondi rigorosamente in formato JSON:
    {
      "projectId": "string (id del progetto)",
      "activityCode": "string (opzionale)",
      "durationMinutes": number,
      "description": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectId: { type: Type.STRING },
            activityCode: { type: Type.STRING },
            durationMinutes: { type: Type.NUMBER },
            description: { type: Type.STRING },
          },
          required: ["projectId", "durationMinutes", "description"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Parse Error:", error);
    return null;
  }
};
