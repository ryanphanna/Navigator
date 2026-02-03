import React from 'react';
import { CheckCircle2, XCircle, ArrowRight, Zap, Target, FileSearch } from 'lucide-react';

export const LandingContent: React.FC = () => {
    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-12 pb-32 space-y-32 mt-32">

            {/* 1. The "Aha" Moment: The ATS Problem (Now includes Headline logic moved to HomeInput, so this just starts with Comparison) */}
            <div className="max-w-7xl mx-auto">
                {/* Spacer to separate from the main grid above */}
                <div className="h-0"></div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-stretch">
                    {/* The Old Way */}
                    <div className="relative group h-full">
                        <div className="absolute inset-0 bg-red-500/5 rounded-[2rem] transform rotate-2 group-hover:rotate-1 transition-transform" />
                        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="font-bold text-slate-500 text-sm uppercase tracking-wider">The Old Way</span>
                            </div>
                            <div className="space-y-4 opacity-50 blur-[0.5px]">
                                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-20 w-full bg-slate-100 dark:bg-slate-800/50 rounded border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                    <span className="text-sm font-medium">Standard_Resume.pdf</span>
                                </div>
                            </div>

                            {/* Rejection Stamp */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white dark:bg-slate-900 shadow-xl border-2 border-red-100 dark:border-red-900/50 px-6 py-4 rounded-xl transform -rotate-12 flex items-center gap-3">
                                    <XCircle className="w-8 h-8 text-red-500" />
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-slate-400 uppercase">ATS Score</div>
                                        <div className="text-2xl font-black text-red-500">12% Match</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* The Navigator Way */}
                    <div className="relative group h-full">
                        <div className="absolute inset-0 bg-emerald-500/10 rounded-[2rem] transform -rotate-2 group-hover:-rotate-1 transition-transform" />
                        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-emerald-500/20 p-8 rounded-[2rem] shadow-xl shadow-emerald-500/10 h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-6 border-b border-emerald-500/10 pb-4">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider">The Navigator Way</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded">✓ React</span>
                                    <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded">✓ TypeScript</span>
                                    <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded">✓ AWS</span>
                                </div>
                                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-emerald-100/50 w-2/3" />
                                </div>
                                <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded" />
                            </div>

                            {/* Success Badge */}
                            <div className="absolute bottom-8 right-8">
                                <div className="bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 px-6 py-3 rounded-xl flex items-center gap-3 transform translate-x-4 translate-y-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform">
                                    <CheckCircle2 className="w-6 h-6" />
                                    <div className="text-left">
                                        <div className="text-[10px] font-bold text-emerald-100 uppercase">Interview</div>
                                        <div className="text-xl font-black">Probable</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. How it Works (Steps) */}
            <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

                    <div className="relative pt-8 text-center px-4">
                        <div className="w-16 h-16 bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10 shadow-sm">
                            <Target className="w-8 h-8 text-slate-400" />
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Copy Job Link</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Find a job on LinkedIn, Indeed, or anywhere. Just copy the URL.
                        </p>
                    </div>

                    <div className="relative pt-8 text-center px-4">
                        <div className="w-16 h-16 bg-white dark:bg-slate-900 border-4 border-indigo-50 dark:border-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10 shadow-sm">
                            <Zap className="w-8 h-8 text-indigo-500" />
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/30">2</div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">AI Analysis</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            We extract keywords, required skills, and hidden criteria in seconds.
                        </p>
                    </div>

                    <div className="relative pt-8 text-center px-4">
                        <div className="w-16 h-16 bg-white dark:bg-slate-900 border-4 border-emerald-50 dark:border-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10 shadow-sm">
                            <FileSearch className="w-8 h-8 text-emerald-500" />
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-emerald-500/30">3</div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Get Tailored</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Get a tailored cover letter and resume advice that beats the bots.
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. Final Call to Action */}
            <div className="max-w-4xl mx-auto text-center bg-slate-900 dark:bg-white rounded-[3rem] p-12 md:p-20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />

                <div className="relative z-10 space-y-8">
                    <h2 className="text-4xl md:text-6xl font-black text-white dark:text-slate-900 tracking-tight">
                        Ready to land the interview?
                    </h2>
                    <p className="text-lg text-slate-400 dark:text-slate-500 max-w-xl mx-auto">
                        Join other smart candidates who stopped guessing and started getting callbacks.
                    </p>
                    <button
                        onClick={() => document.querySelector('input')?.focus()}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-2xl"
                    >
                        Analyze Your First Job
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        No credit card required • Free for first 3 scans
                    </p>
                </div>
            </div>
        </div>
    );
};
