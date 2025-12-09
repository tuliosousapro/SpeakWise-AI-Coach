import { StageName } from './types';

export const XP_PER_LEVEL = 1000;

export const STAGE_THRESHOLDS = {
  1: { minLevel: 1, name: StageName.BEGINNER },
  2: { minLevel: 6, name: StageName.IMPROVING },
  3: { minLevel: 16, name: StageName.COMPETENT },
  4: { minLevel: 31, name: StageName.CONFIDENT },
  5: { minLevel: 51, name: StageName.EXPERT },
};

export const INITIAL_USER_STATE = {
  xp: 1250,
  level: 2,
  stage: 1,
  streak: 3,
  history: [
    {
      id: 'prev-1',
      date: new Date(Date.now() - 86400000).toISOString(),
      durationSeconds: 120,
      wpm: 130,
      fillerWords: 5,
      clarityScore: 72,
      confidenceScore: 65,
      overallScore: 68,
      feedbackSummary: "Good start, but watch your pace.",
    }
  ]
};

export const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
export const ANALYSIS_MODEL = 'gemini-3-pro-preview';
export const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
export const FAST_MODEL = 'gemini-2.5-flash-lite';
