import React, { useState } from 'react';
import { School, Search, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { analyzeMAEligibility } from '../../services/geminiService';
import { useToast } from '../../contexts/ToastContext';
import type { Transcript } from '../../types';

interface MAEligibilityProps {
    transcript: Transcript;
}

export const MAEligibility: React.FC<MAEligibilityProps> = ({ transcript }) => {
    const [targetProgram, setTargetProgram] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<{
        probability: 'High' | 'Medium' | 'Low';
        analysis: string;
        gpaVerdict: string;
        gpaContext: string;
        weaknesses: string[];
        recommendations: string[];
    } | null>(null);
    const { showError } = useToast();

    const handleAnalysis = async () => {
        if (!targetProgram.trim()) return;
        setIsAnalyzing(true);
        try {
            const analysis = await analyzeMAEligibility(transcript, targetProgram);
            setResult(analysis);
        } catch (err: any) {
            showError(err.message || "Failed to analyze eligibility");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg flex items-center justify-center">
                    <School className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">MA Eligibility Check</h3>
                    <p className="text-sm text-slate-500">AI-powered chance-me for Grad School.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="e.g. UofT Master of Computer Science"
                        value={targetProgram}
                        onChange={(e) => setTargetProgram(e.target.value)}
                        className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalysis()}
                    />
                    <button
                        onClick={handleAnalysis}
                        disabled={isAnalyzing || !targetProgram}
                        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {isAnalyzing ? 'Thinking...' : <Search className="w-4 h-4" />}
                    </button>
                </div>

                {result && (
                    <div className="mt-6 space-y-6 animate-fadeIn">
                        {/* Probability Badge */}
                        <div className={`p-4 rounded-xl border ${result.probability === 'High' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300' :
                                result.probability === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300' :
                                    'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                            }`}>
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="w-5 h-5" />
                                <span className="font-bold text-lg">{result.probability} Probability</span>
                            </div>
                            <p className="text-sm opacity-90">{result.analysis}</p>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" /> GPA Verdict
                                </h4>
                                <div className="text-sm">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{result.gpaVerdict}: </span>
                                    <span className="text-slate-500">{result.gpaContext}</span>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Weak Areas
                                </h4>
                                <ul className="text-sm text-slate-500 space-y-1">
                                    {result.weaknesses.map((w, i) => (
                                        <li key={i}>• {w}</li>
                                    ))}
                                    {result.weaknesses.length === 0 && <li>None detected.</li>}
                                </ul>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Strategic Recommendations</h4>
                            <div className="space-y-2">
                                {result.recommendations.map((rec, i) => (
                                    <div key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg">
                                        <span className="font-bold text-rose-500">{i + 1}.</span>
                                        {rec}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
