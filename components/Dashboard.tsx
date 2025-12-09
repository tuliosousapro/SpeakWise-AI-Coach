import React from 'react';
import { UserProgress, SessionStats, StageName } from '../types';
import { STAGE_THRESHOLDS, XP_PER_LEVEL } from '../constants';
import { Play, TrendingUp, Award, Flame, ChevronRight, Activity, Mic } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  user: UserProgress;
  onStartSession: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onStartSession }) => {
  const currentStageName = STAGE_THRESHOLDS[user.stage as keyof typeof STAGE_THRESHOLDS]?.name || "Unknown";
  
  // Progress towards next level
  const xpForNextLevel = user.level * XP_PER_LEVEL;
  const progressPercent = ((user.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

  const lastSession = user.history[0];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6 animate-fade-in">
      {/* Header / Hero */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-850 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center space-x-3 text-indigo-400 mb-1">
            <span className="text-xs font-bold tracking-wider uppercase bg-indigo-500/10 px-2 py-1 rounded">Level {user.level}</span>
            <span className="text-xs font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">{currentStageName}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Ready to speak, Champion?</h1>
          <p className="text-slate-400 max-w-lg">
            Your AI coach is ready. Complete your daily drill to boost your clarity and confidence.
          </p>
        </div>
        
        <button 
          onClick={onStartSession}
          className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all duration-200 bg-indigo-600 rounded-xl hover:bg-indigo-500 hover:scale-105 focus:outline-none ring-offset-2 focus:ring-2 ring-indigo-400"
        >
          <div className="absolute inset-0 w-full h-full rounded-xl animate-pulse-slow bg-indigo-400 opacity-20 group-hover:opacity-40"></div>
          <Mic className="w-5 h-5 mr-2" />
          Start Speaking
        </button>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Roadmap & Stats */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Roadmap Card */}
          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                Expert Roadmap
              </h2>
              <button className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center">
                View Full Map <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="relative pt-6 pb-2">
              <div className="flex justify-between mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <span>Beginner</span>
                <span>Expert</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-out"
                  style={{ width: `${(user.stage / 5) * 100}%` }}
                />
              </div>
              <p className="mt-4 text-sm text-slate-400 italic">
                "You’re on your journey to becoming an <span className="text-indigo-400 font-semibold">Expert Communicator</span>."
              </p>
            </div>
          </div>

          {/* Recent Performance Chart */}
          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-700">
             <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-emerald-400" />
                Performance Trends
              </h2>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={user.history.slice(0, 5).reverse()}>
                    <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, {weekday: 'short'})} stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                      itemStyle={{ color: '#818cf8' }}
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Bar dataKey="overallScore" radius={[4, 4, 0, 0]}>
                      {user.history.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.overallScore > 80 ? '#34d399' : '#818cf8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
          </div>

        </div>

        {/* Right Column: Quick Stats & Challenges */}
        <div className="space-y-6">
          
          {/* Last Session Snapshot */}
          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-24 h-24 text-white" />
            </div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">Last Session</h3>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-white">{lastSession?.overallScore || '-'}</span>
              <span className="text-sm text-slate-500">/ 100</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Pace</span>
                <span className="text-white font-medium">{lastSession?.wpm || 0} WPM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Clarity</span>
                <span className="text-white font-medium">{lastSession?.clarityScore || 0}%</span>
              </div>
            </div>
          </div>

          {/* Daily Challenge */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl border border-indigo-500/30">
             <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-500 p-2 rounded-lg">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full">+150 XP</span>
             </div>
             <h3 className="text-white font-bold mb-1">Pace Yourself</h3>
             <p className="text-sm text-indigo-200 mb-4">Speak for 2 minutes maintaining a pace between 130-150 WPM.</p>
             <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-400 h-full w-1/3"></div>
             </div>
          </div>

          {/* Streak & Badges */}
          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-700">
             <h3 className="text-white font-bold mb-4 flex items-center">
               <Award className="w-5 h-5 mr-2 text-yellow-500" />
               Achievements
             </h3>
             <div className="flex space-x-2">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/50" title="7 Day Streak">
                  <Flame className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50" title="Clarity Champion">
                  <Mic className="w-5 h-5 text-blue-500" />
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-500 border border-slate-600">
                  +3
                </div>
             </div>
             <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center text-sm">
                <span className="text-slate-400">Current Streak</span>
                <span className="text-white font-bold">{user.streak} Days 🔥</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;