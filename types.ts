export interface UserProgress {
  xp: number;
  level: number;
  stage: number; // 1-5
  streak: number;
  history: SessionStats[];
}

export interface SessionStats {
  id: string;
  date: string;
  durationSeconds: number;
  wpm: number;
  fillerWords: number;
  clarityScore: number; // 0-100
  confidenceScore: number; // 0-100
  overallScore: number; // 0-100
  feedbackSummary: string;
}

export interface LiveMetrics {
  volume: number; // 0-1 normalized
  isSpeaking: boolean;
}

export interface AIAnalysisReport {
  strengths: string[];
  weaknesses: string[];
  actionableTips: string[];
  suggestedDrills: string[];
  scores: {
    pace: number;
    volume: number;
    clarity: number;
    structure: number;
    persuasion: number;
  };
}

export enum AppState {
  DASHBOARD,
  PRACTICE_SETUP,
  LIVE_SESSION,
  ANALYSIS,
}

export enum StageName {
  BEGINNER = "Beginner",
  IMPROVING = "Improving",
  COMPETENT = "Competent",
  CONFIDENT = "Confident",
  EXPERT = "Expert Communicator",
}