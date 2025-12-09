import React, { useEffect, useState } from 'react';
import { generateDetailedReport } from '../services/geminiService';
import { AIAnalysisReport, SessionStats } from '../types';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle, AlertTriangle, Lightbulb, PlayCircle, Loader2, ArrowRight } from 'lucide-react';

interface AnalysisProps {
  sessionContext: string;
  onClose: () => void;
}

const PostSessionAnalysis: React.FC<AnalysisProps> = ({ sessionContext, onClose }) => {
  const [report, setReport] = useState<AIAnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      // Simulate "Thinking" time for the demo effect if API is very fast, 
      // but purely we call the service.
      const result = await generateDetailedReport(sessionContext);
      setReport(result);
      setLoading(false);
    };
    fetchAnalysis();
  }, [sessionContext]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Analyzing your speech...</h2>
        <p className="text-slate-400">Gemini is thinking about your structure, tone, and pacing.</p>
        <div className="mt-8 w-64 bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full w-2/3 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const chartData = [
    { subject: 'Pace', A: report.scores.pace, fullMark: 100 },
    { subject: 'Volume', A: report.scores.volume, fullMark: 100 },
    { subject: 'Clarity', A: report.scores.clarity, fullMark: 100 },
    { subject: 'Structure', A: report.scores.structure, fullMark: 100 },
    { subject: 'Persuasion', A: report.scores.persuasion, fullMark: 100 },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900 z-40 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 lg:p-12">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Session Analysis</h1>
                <p className="text-slate-400">Deep dive into your performance using Gemini 3 Pro.</p>
            </div>
            <button 
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center transition-colors"
            >
                Return to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Scores */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-white font-semibold mb-4 text-center">Skill Breakdown</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid stroke="#475569" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="You" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.4} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-white font-semibold mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                            <span className="text-slate-400 text-sm">Overall Score</span>
                            <span className="text-emerald-400 font-bold text-xl">
                                {Math.round((report.scores.pace + report.scores.clarity + report.scores.persuasion + report.scores.structure + report.scores.volume) / 5)}
                            </span>
                        </div>
                         <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                            <span className="text-slate-400 text-sm">Tone</span>
                            <span className="text-white font-medium">Confident</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Col: Qualitative Feedback */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-green-500/20">
                        <h3 className="text-green-400 font-bold mb-4 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2" /> Strengths
                        </h3>
                        <ul className="space-y-2">
                            {report.strengths.map((s, i) => (
                                <li key={i} className="text-slate-300 text-sm flex items-start">
                                    <span className="mr-2 text-green-500">•</span> {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div className="bg-slate-800/50 p-6 rounded-2xl border border-orange-500/20">
                        <h3 className="text-orange-400 font-bold mb-4 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" /> Areas to Improve
                        </h3>
                        <ul className="space-y-2">
                            {report.weaknesses.map((s, i) => (
                                <li key={i} className="text-slate-300 text-sm flex items-start">
                                    <span className="mr-2 text-orange-500">•</span> {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* AI Tips */}
                <div className="bg-indigo-900/20 p-6 rounded-2xl border border-indigo-500/30">
                    <h3 className="text-indigo-400 font-bold mb-4 flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2" /> Actionable Coaching Tips
                    </h3>
                    <div className="space-y-3">
                         {report.actionableTips.map((tip, i) => (
                            <div key={i} className="flex bg-slate-800/80 p-3 rounded-lg">
                                <span className="text-indigo-400 font-bold mr-3">{i+1}</span>
                                <p className="text-slate-200 text-sm">{tip}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Suggested Drills */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-white font-bold mb-4 flex items-center">
                        <PlayCircle className="w-5 h-5 mr-2 text-blue-400" /> Recommended Drills
                    </h3>
                     <div className="flex flex-wrap gap-2">
                         {report.suggestedDrills.map((drill, i) => (
                            <span key={i} className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors border border-slate-600">
                                {drill}
                            </span>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default PostSessionAnalysis;