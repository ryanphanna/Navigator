import React, { useState } from 'react';
import { School, Search, TrendingUp, AlertTriangle, CheckCircle, Loader2, Sparkles } from 'lucide-react';
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
        <div className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-neutral-700/50 p-8 shadow-2xl shadow-rose-500/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors duration-700" />

            <div className="flex items-center gap-4 mb-8 relative">
                <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                    <School className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-black text-xl text-neutral-900 dark:text-white tracking-tight">MA Eligibility Check</h3>
                    <p className="text-sm text-neutral-500 font-medium">AI-powered chance-me for Grad School.</p>
                </div>
            </div>

            <div className="space-y-6 relative">
                <div className="flex gap-3">
                    <div className="relative flex-1 group/input">
                        <input
                            type="text"
                            placeholder="e.g. UofT Master of Computer Science"
                            value={targetProgram}
                            onChange={(e) => setTargetProgram(e.target.value)}
                            className="w-full px-5 py-3.5 bg-white dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 rounded-2xl text-sm font-bold focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleAnalysis()}
                        />
                        <Search className="w-5 h-5 text-neutral-400 absolute right-4 top-1/2 -translate-y-1/2 group-focus-within/input:text-rose-500 transition-colors" />
                    </div>
                    <button
                        onClick={handleAnalysis}
                        disabled={isAnalyzing || !targetProgram}
                        className="px-8 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-sm disabled:opacity-50 transition-all shadow-lg shadow-rose-500/20 active:scale-95 flex items-center gap-2"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            'Research'
                        )}
                    </button>
                </div>

                {result && (
                    <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Probability Header */}
                        <div className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 relative overflow-hidden ${result.probability === 'High'
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl shadow-emerald-500/20'
                            : result.probability === 'Medium'
                                ? 'bg-amber-500 border-amber-400 text-white shadow-xl shadow-amber-500/20'
                                : 'bg-rose-500 border-rose-400 text-white shadow-xl shadow-rose-500/20'
                            }`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="relative flex items-center gap-4 mb-4">
                                <TrendingUp className="w-8 h-8" />
                                <span className="font-black text-3xl tracking-tighter">{result.probability} Eligibility</span>
                            </div>
                            <p className="text-sm font-bold opacity-90 leading-relaxed max-w-2xl">{result.analysis}</p>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm group/card hover:border-emerald-200 transition-colors">
                                <h4 className="font-black text-[11px] text-neutral-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg group-hover/card:bg-emerald-500 group-hover/card:text-white transition-colors">
                                        <CheckCircle className="w-3 h-3" />
                                    </div>
                                    GPA Verdict
                                </h4>
                                <div className="space-y-2">
                                    <div className="text-lg font-black text-neutral-900 dark:text-white leading-tight">{result.gpaVerdict}</div>
                                    <div className="text-sm text-neutral-500 font-medium leading-relaxed">{result.gpaContext}</div>
                                </div>
                            </div>

                            <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm group/card hover:border-amber-200 transition-colors">
                                <h4 className="font-black text-[11px] text-neutral-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg group-hover/card:bg-amber-500 group-hover/card:text-white transition-colors">
                                        <AlertTriangle className="w-3 h-3" />
                                    </div>
                                    Risk Factors
                                </h4>
                                <ul className="space-y-2">
                                    {result.weaknesses.map((w, i) => (
                                        <li key={i} className="text-sm text-neutral-600 dark:text-neutral-400 font-bold flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                                            {w}
                                        </li>
                                    ))}
                                    {result.weaknesses.length === 0 && <li className="text-neutral-400 italic font-medium">No major risks detected</li>}
                                </ul>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-neutral-900 dark:bg-black rounded-[2.5rem] p-8 shadow-2xl">
                            <h4 className="font-black text-white text-xl mb-6 tracking-tight flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-rose-500" />
                                Strategic Roadmap
                            </h4>
                            <div className="grid gap-4">
                                {result.recommendations.map((rec, i) => (
                                    <div key={i} className="flex gap-4 p-5 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl group/item">
                                        <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center font-black text-xs shrink-0 group-hover/item:bg-rose-500 group-hover/item:text-white transition-colors">
                                            {i + 1}
                                        </div>
                                        <p className="text-neutral-300 text-sm font-medium leading-relaxed">{rec}</p>
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
