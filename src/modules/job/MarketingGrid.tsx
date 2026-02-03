import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, Sparkles, Lock, PenTool, FileText, Bookmark, TrendingUp, Shield } from 'lucide-react';

export const MarketingGrid: React.FC = () => {
    const [shuffledCards, setShuffledCards] = useState<number[]>([]);

    useEffect(() => {
        // Initialize shuffled cards for marketing (logged-out) view
        // Exclude Coach (6) and Roadmap (7) from marketing cards - they're beta only
        const marketingCards = [0, 1, 2, 3, 4, 5];
        const shuffled = [...marketingCards].sort(() => Math.random() - 0.5);
        setShuffledCards(shuffled);
    }, []);

    if (shuffledCards.length === 0) return null;

    return (
        <div className="mt-16 w-full max-w-[1920px] mx-auto px-6 lg:px-12">
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`}>

                {/* HUB: The Central Mission Statement (Bursting Core) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 min-h-[40vh] flex flex-col items-center justify-center text-center py-20 relative overflow-hidden rounded-[3rem] bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-50" />

                    <div className="relative z-10 max-w-4xl mx-auto px-6">
                        <h2 className="text-5xl md:text-8xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.9]">
                            Get hired.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-indigo-600">Delete us.</span>
                        </h2>
                        <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                            We measure success by how fast you leave. Get your forever job, delete your account, and get on with your life.
                        </p>
                    </div>
                </div>

                {shuffledCards.map((index: number) => {
                    switch (index) {
                        case 0: return (
                            /* Card 1: Speed (Flash) */
                            <div key="card-1" className="bg-blue-50/50 dark:bg-blue-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-blue-500/10 dark:border-blue-500/20 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col overflow-hidden relative h-full">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-700" />
                                <div className="flex items-center gap-4 relative z-10 mb-4">
                                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                        JobFit Score
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                    Stop guessing. Get an instant 0-100 compatibility rating for any job description.
                                </p>
                                <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-500/5 to-transparent" />
                                    <div className="relative w-14 h-14 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="28" cy="28" r="24" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-800" />
                                            <circle cx="28" cy="28" r="24" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray="150.8" strokeDashoffset="30.16" className="text-blue-600 dark:text-blue-400 animate-[dash_1.5s_ease-in-out_forwards]" />
                                        </svg>
                                        <span className="absolute text-[10px] font-black text-slate-900 dark:text-white">98%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10 cursor-pointer" onClick={() => document.querySelector('input')?.focus()}>
                                    <span>Get Started</span>
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </div>
                        );
                        case 1: return (
                            /* Card 2: Keyword Targeting */
                            <div key="card-2" className="bg-violet-50/50 dark:bg-violet-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-violet-500/10 dark:border-violet-500/20 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col overflow-hidden relative h-full">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-violet-500/20 transition-all duration-700" />
                                <div className="flex items-center gap-4 relative z-10 mb-4">
                                    <div className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                        Keyword Targeting
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                    Beat the ATS. We identify exactly which skills and keywords your resume is missing.
                                </p>
                                <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex items-center justify-center gap-2 overflow-hidden px-4">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-violet-500/5 to-transparent" />
                                    <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold">✓ React</span>
                                    <span className="px-2 py-1 rounded bg-rose-50 text-rose-600 text-[10px] font-bold opacity-60">+ Node</span>
                                </div>
                                <div className="flex items-center justify-end gap-2 text-violet-600 dark:text-violet-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10 cursor-pointer" onClick={() => document.querySelector('input')?.focus()}>
                                    <span>Optimize Now</span>
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </div>
                        );
                        case 2: return (
                            /* Card 3: Private Vault (Lock) */
                            <div key="card-3" className="bg-emerald-50/50 dark:bg-emerald-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-emerald-500/10 dark:border-emerald-500/20 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col overflow-hidden relative h-full">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700" />
                                <div className="flex items-center gap-4 relative z-10 mb-4">
                                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                        Private Vault
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                    Your data stays yours. Encrypted local storage that we can't access or train on.
                                </p>
                                <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex items-center justify-center gap-2 overflow-hidden px-4">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-500/5 to-transparent" />
                                    <div className="p-2 bg-emerald-500/10 rounded-full">
                                        <Shield className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-600">AES-256 Encrypted</span>
                                </div>
                                <div className="flex items-center justify-end gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10 cursor-pointer" onClick={() => document.querySelector('input')?.focus()}>
                                    <span>Secure</span>
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </div>
                        );
                        case 3: return (
                            /* Card 4: Smart Cover Letters */
                            <div key="card-4" className="bg-orange-50/50 dark:bg-orange-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-orange-500/10 dark:border-orange-500/20 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col overflow-hidden relative h-full">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/20 transition-all duration-700" />
                                <div className="flex items-center gap-4 relative z-10 mb-4">
                                    <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                        <PenTool className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                        Smart Cover Letters
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                    Not Just templates. We write unique, persuasive letters that cite your actual experience.
                                </p>
                                <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex flex-col justify-center gap-1.5 px-4 overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-orange-500/5 to-transparent" />
                                    <div className="w-3/4 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                    <div className="w-full h-1.5 bg-orange-200 dark:bg-orange-900/40 rounded-full" />
                                    <div className="w-2/3 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                </div>
                                <div className="flex items-center justify-end gap-2 text-orange-600 dark:text-orange-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10 cursor-pointer" onClick={() => document.querySelector('input')?.focus()}>
                                    <span>Start Writing</span>
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </div>
                        );
                        case 4: return (
                            /* Card 5: Tailored Summaries */
                            <div key="card-5" className="bg-rose-50/50 dark:bg-rose-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-rose-500/10 dark:border-rose-500/20 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col overflow-hidden relative h-full">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-rose-500/20 transition-all duration-700" />
                                <div className="flex items-center gap-4 relative z-10 mb-4">
                                    <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                        Tailored Summaries
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                    We rewrite your professional summary to perfection for every single application.
                                </p>
                                <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-rose-500/5 to-transparent" />
                                    <div className="relative w-12 h-12 bg-rose-500/20 rounded-lg flex items-center justify-center border border-rose-500/30">
                                        <div className="w-6 h-0.5 bg-rose-500 rounded-full" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10 cursor-pointer" onClick={() => document.querySelector('input')?.focus()}>
                                    <span>Try It</span>
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </div>
                        );
                        case 5: return (
                            /* Card 6: Bookmarklet */
                            <div key="card-6" className="bg-sky-50/50 dark:bg-sky-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-sky-500/10 dark:border-sky-500/20 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col overflow-hidden relative h-full">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-sky-500/20 transition-all duration-700" />
                                <div className="flex items-center gap-4 relative z-10 mb-4">
                                    <div className="w-12 h-12 bg-sky-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                        <Bookmark className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                        Save from Anywhere
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                    Found a job on LinkedIn or Indeed? Save it to JobFit with a single click.
                                </p>
                                <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-sky-500/5 to-transparent" />
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 text-white text-[10px] font-bold rounded shadow-sm">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                        Save
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 text-sky-600 dark:text-sky-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10 cursor-pointer" onClick={() => document.querySelector('input')?.focus()}>
                                    <span>Install</span>
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </div>
                        );
                        default: return null;
                    }
                })}
            </div>
        </div>
    );
};
