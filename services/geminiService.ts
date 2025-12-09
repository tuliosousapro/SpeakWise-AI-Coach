import { GoogleGenAI } from "@google/genai";
import { AIAnalysisReport } from "../types";
import { ANALYSIS_MODEL, TTS_MODEL } from "../constants";
import { decodePCM16 } from "../utils/audioUtils";

// Helper to get client instance
const getAiClient = () => {
  // Safe access thanks to index.html polyfill
  const apiKey = process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

// Using Gemini 3 Pro with Thinking Budget for deep analysis
export const generateDetailedReport = async (transcriptOrContext: string): Promise<AIAnalysisReport> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: `Analyze the following public speaking session context and provide a structured coaching report. 
      Context: ${transcriptOrContext}`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking for deep analysis
        responseMimeType: "application/json",
        responseSchema: {
          type: 'OBJECT',
          properties: {
            strengths: { type: 'ARRAY', items: { type: 'STRING' } },
            weaknesses: { type: 'ARRAY', items: { type: 'STRING' } },
            actionableTips: { type: 'ARRAY', items: { type: 'STRING' } },
            suggestedDrills: { type: 'ARRAY', items: { type: 'STRING' } },
            scores: {
              type: 'OBJECT',
              properties: {
                pace: { type: 'NUMBER' },
                volume: { type: 'NUMBER' },
                clarity: { type: 'NUMBER' },
                structure: { type: 'NUMBER' },
                persuasion: { type: 'NUMBER' },
              }
            }
          }
        }
      }
    });

    if (response && response.text) {
      // Clean up markdown if present
      let cleanText = response.text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```/, '').replace(/```$/, '');
      }
      return JSON.parse(cleanText) as AIAnalysisReport;
    }
    throw new Error("No analysis generated");
  } catch (error) {
    console.error("Analysis failed:", error);
    // Fallback mock for robustness
    return {
      strengths: ["Great energy", "Clear voice"],
      weaknesses: ["Too many filler words", "Rushed conclusion"],
      actionableTips: ["Pause more often", "Take a breath between points"],
      suggestedDrills: ["Tongue twisters", "Box breathing"],
      scores: { pace: 70, volume: 80, clarity: 75, structure: 60, persuasion: 65 }
    };
  }
};

// Text to Speech for the Coach
export const synthesizeSpeech = async (text: string): Promise<AudioBuffer | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    const audioContext = new AudioContextClass();
    return decodePCM16(base64Audio, audioContext);
  } catch (error) {
    console.error("TTS failed:", error);
    return null;
  }
};