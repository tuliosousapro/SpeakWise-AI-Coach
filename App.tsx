import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import LiveSession from './components/LiveSession';
import PostSessionAnalysis from './components/PostSessionAnalysis';
import { AppState, UserProgress } from './types';
import { INITIAL_USER_STATE, XP_PER_LEVEL } from './constants';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD);
  const [user, setUser] = useState<UserProgress>(INITIAL_USER_STATE);
  const [lastSessionContext, setLastSessionContext] = useState<string>("");

  const startSession = () => {
    setAppState(AppState.LIVE_SESSION);
  };

  const endSession = (sessionData: { duration: number, context: string }) => {
    // 1. Update State Context for Analysis
    setLastSessionContext(sessionData.context);
    
    // 2. Mock: Update User Progress (Gamification)
    const xpGained = 250; // Base XP for completing a session
    const newXp = user.xp + xpGained;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
    
    // Simple stage progression based on levels for demo
    let newStage = user.stage;
    if (newLevel >= 51) newStage = 5;
    else if (newLevel >= 31) newStage = 4;
    else if (newLevel >= 16) newStage = 3;
    else if (newLevel >= 6) newStage = 2;

    setUser(prev => ({
        ...prev,
        xp: newXp,
        level: newLevel,
        stage: newStage,
        history: [
            {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                durationSeconds: sessionData.duration,
                wpm: 145, // Mocked from "live" data for history
                fillerWords: 3,
                clarityScore: 82,
                confidenceScore: 78,
                overallScore: 80,
                feedbackSummary: "Great improvement!",
            },
            ...prev.history
        ]
    }));

    setAppState(AppState.ANALYSIS);
  };

  const closeAnalysis = () => {
    setAppState(AppState.DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Navbar - Simple Top Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white text-lg">S</span>
            </div>
            <span className="font-bold text-xl tracking-tight">SpeakWise</span>
          </div>
          <div className="flex items-center space-x-4">
             <div className="text-sm text-slate-400">
                XP: <span className="text-indigo-400 font-mono">{user.xp}</span>
             </div>
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                <span className="text-xs font-bold text-white">JD</span>
             </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow relative">
        {appState === AppState.DASHBOARD && (
          <Dashboard user={user} onStartSession={startSession} />
        )}
        
        {appState === AppState.LIVE_SESSION && (
          <LiveSession onEndSession={endSession} />
        )}

        {appState === AppState.ANALYSIS && (
          <PostSessionAnalysis sessionContext={lastSessionContext} onClose={closeAnalysis} />
        )}
      </main>
    </div>
  );
};

export default App;