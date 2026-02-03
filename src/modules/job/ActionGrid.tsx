import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, TrendingUp, Zap, FileText, GraduationCap, Clock, PenTool } from 'lucide-react';

interface ActionGridProps {
    onNavigate?: (view: any) => void;
    isAdmin?: boolean;
    isTester?: boolean;
}

export const ActionGrid: React.FC<ActionGridProps> = ({ onNavigate, isAdmin = false, isTester = false }) => {
    const [shuffledActionCards, setShuffledActionCards] = useState<number[]>([]);

    useEffect(() => {
        // Card indices by product:
        // JOB: 0 (Analyze), 2 (Skills), 3 (Resumes), 5 (History), 6 (Cover Letters)
        // COACH: 1 (Roadmap)
        // EDU: 4 (Edu)

        // Job product cards in priority order (highest to lowest)
        const jobCardsByPriority = [
            3, // 1. Resumes (highest priority - core workflow)
            0, // 2. Analyze (primary tool - job fit scoring)
            6, // 3. Cover Letters (high value - double analysis)
            2, // 4. Skills (skill gap analysis)
            5, // 5. History (lowest priority - past work viewer)
        ];

        // Build action cards based on user permissions
        const actionCards: number[] = [];

        // Determine how many Job cards to show based on other products
        const showCoach = isTester || isAdmin;
        const showEdu = isAdmin;
        const productCount = (showCoach ? 1 : 0) + (showEdu ? 1 : 0);
        const jobCardCount = 5 - productCount; // Total 5 cards, subtract other products

        // Add top priority Job cards
        actionCards.push(...jobCardsByPriority.slice(0, jobCardCount));

        // Add Coach product if beta/admin
        if (showCoach) {
            actionCards.push(1); // Roadmap
        }

        // Add Edu product if admin
        if (showEdu) {
            actionCards.push(4); // Edu
        }

        setShuffledActionCards(actionCards);
    }, [isAdmin, isTester]);

    if (shuffledActionCards.length === 0) return null;

    return (
        <div className={`mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150`}>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-8 max-w-[1920px] mx-auto px-12`}>
                {shuffledActionCards.map((index) => {
                    switch (index) {
                        case 0: return (
                            /* Action Card: JobFit */
                            <button
                                key="action-jobfit"
                                onClick={() => onNavigate?.('job-fit')}
                                className="group relative bg-indigo-50/50 dark:bg-indigo-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-indigo-500/10 dark:border-indigo-500/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-left overflow-hidden h-full flex flex-col"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all duration-700" />
                                <div className="flex items-center gap-4 relative z-10 mb-4">
                                    <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Analyze</h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                    Tailor your resume for any opening with a single click.
                                </p>
                                <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-indigo-500/5 to-transparent" />
                                    <div className="relative w-14 h-14 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="28" cy="28" r="24" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-800" />
                                            <circle cx="28" cy="28" r="24" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray="150.8" strokeDashoffset="30.16" className="text-indigo-500 group-hover:stroke-indigo-400 transition-colors" />
                                        </svg>
                                        <span className="absolute text-[10px] font-black text-slate-900 dark:text-white">98%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10">
                                    <span>Get Hired</span>
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </button>
                        );
                        case 1: return (
                            /* Action Card: JobCoach */
                            <button
                                key="action-coach"
                                onClick={() => onNavigate?.('coach-home')}
                                className="group relative bg-emerald-50/50 dark:bg-emerald-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-emerald-500/10 dark:border-emerald-500/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-left overflow-hidden h-full flex flex-col"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700" />
                                <div className="flex items-center gap-4 relative z-10 mb-4">
                                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Roadmap</h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                    Build your roadmap to land major target roles.
                                </p>
                                <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex items-center justify-center px-4 overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-500/5 to-transparent" />
                                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 relative rounded-full">
                                        <div className="absolute inset-y-0 left-0 w-2/3 bg-emerald-500 rounded-full group-hover:w-3/4 transition-all duration-1000" />
                                        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-full shadow-sm" />
                                        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-full shadow-sm" />
                                        <div className="absolute top-1/2 left-2/3 -translate-y-1/2 w-4 h-4 bg-emerald-500 rounded-full shadow-lg animate-pulse" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10">
                                    <span>Scale Up</span>
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </button>
                        );
                        case 2: return (
                            /* Action Card: Skills Arsenal */
                            <button
                                key="action-skills"
                                onClick={() => onNavigate?.('skills')}
                                className="group relative bg-amber-50/50 dark:bg-amber-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-amber-500/10 dark:border-amber-500/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-left overflow-hidden h-full flex flex-col"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all duration-700" />
                                <div className="flex items-center gap-4 relative z-10 mb-4">
                                    <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Skills</h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                    Identify and bridge your skill gaps with AI.
                                </p>
                                <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex flex-col items-center justify-center gap-2 px-4 overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-amber-500/5 to-transparent" />
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600"><div className="w-4 h-1 bg-amber-500 rounded-full" /></div>
                                        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg transform -rotate-12 group-hover:rotate-0 transition-transform"><Sparkles className="w-4 h-4 text-white" /></div>
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/20" />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-12 h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                        <div className="w-8 h-2 bg-amber-500/40 rounded-full" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10">
                                    <span>Audit Gaps</span>
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </button>
                        );
                        case 3: return (
                            /* Action Card: Resume Manager */
                            <button
                                key="action-resumes"
                                onClick={() => onNavigate?.('resumes')}
                                className="group relative bg-rose-50/50 dark:bg-rose-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-rose-500/10 dark:border-rose-500/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-left overflow-hidden h-full flex flex-col"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-rose-500/20 transition-all duration-700" />
                                <div className="flex items-center gap-4 relative z-10 mb-4">
                                    <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform duration-500">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Resumes</h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                    Store and edit your resume profiles.
                                </p>
                                <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-rose-500/5 to-transparent" />
                                    <div className="relative w-12 h-16 bg-white dark:bg-slate-900 rounded shadow-md border border-slate-200 dark:border-slate-800 transform -rotate-12 translate-x-2 translate-y-2 opacity-50" />
                                    <div className="relative w-12 h-16 bg-white dark:bg-slate-900 rounded shadow-lg border border-slate-200 dark:border-slate-800 group-hover:-translate-y-1 transition-transform" />
                                    <div className="absolute bottom-6 w-8 h-1 bg-rose-500/30 rounded-full" />
                                    <div className="absolute bottom-4 w-6 h-1 bg-rose-500/20 rounded-full" />
                                </div>
                                <div className="flex items-center justify-end gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10">
                                    <span>Manage All</span>
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </button>
                        );
                        case 4: return (
                            /* Action Card: Edu module */
                            <button
                                key="action-edu"
                                onClick={() => onNavigate?.('grad')}
                                className="group relative bg-violet-50/50 dark:bg-violet-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-violet-500/10 dark:border-violet-500/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-left overflow-hidden h-full flex flex-col"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-violet-500/20 transition-all duration-700" />
                                <div className="flex items-center gap-4 relative z-10 mb-4">
                                    <div className="w-12 h-12 bg-violet-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                                        <GraduationCap className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Edu</h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                    High-fidelity academic reconnaissance and pathfinding.
                                </p>
                                <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-violet-500/5 to-transparent" />
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center border border-violet-200/50">
                                                <div className="w-4 h-0.5 bg-violet-400 rounded-full" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 text-violet-600 dark:text-violet-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10">
                                    <span>Scout Programs</span>
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </button>
                        );
                        case 5: return (
                            /* Action Card: History */
                            <button
                                key="action-history"
                                onClick={() => onNavigate?.('history')}
                                className="group relative bg-blue-50/50 dark:bg-blue-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-blue-500/10 dark:border-blue-500/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-left overflow-hidden h-full flex flex-col"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-700" />
                                <div className="flex items-center gap-4 relative z-10 mb-4">
                                    <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">History</h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                    Review your analyzed jobs and insights.
                                </p>
                                <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex flex-col gap-2 px-4 justify-center overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-500/5 to-transparent" />
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                        <div className="flex-grow h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                        <div className="text-[10px] font-bold text-blue-600">98%</div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-60">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                                        <div className="flex-grow h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                        <div className="text-[10px] font-bold text-blue-500">87%</div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-40">
                                        <div className="w-2 h-2 bg-blue-300 rounded-full" />
                                        <div className="flex-grow h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                        <div className="text-[10px] font-bold text-blue-400">92%</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10">
                                    <span>View All</span>
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </button>
                        );
                        case 6: return (
                            /* Action Card: Cover Letters */
                            <button
                                key="action-cover-letters"
                                onClick={() => onNavigate?.('cover-letters')}
                                className="group relative bg-purple-50/50 dark:bg-purple-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-purple-500/10 dark:border-purple-500/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-left overflow-hidden h-full flex flex-col"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-all duration-700" />
                                <div className="flex items-center gap-4 relative z-10 mb-4">
                                    <div className="w-12 h-12 bg-purple-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                                        <PenTool className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Cover Letters</h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                    Generate AI-tailored cover letters.
                                </p>
                                <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex flex-col gap-1.5 px-4 justify-center overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-purple-500/5 to-transparent" />
                                    <div className="w-3/4 h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                    <div className="w-full h-2 bg-purple-200 dark:bg-purple-900/40 rounded-full" />
                                    <div className="w-5/6 h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                    <div className="w-2/3 h-2 bg-purple-100 dark:bg-purple-900/20 rounded-full" />
                                </div>
                                <div className="flex items-center justify-end gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10">
                                    <span>Create New</span>
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </button>
                        );
                        default: return null;
                    }
                })}
            </div>
        </div>
    );
};
