import React from 'react';
import {
    Users,
    TrendingUp,
    Plus,
    Target,
    Loader2,
    CheckCircle2,
    Link as LinkIcon,
    Sparkles
} from 'lucide-react';
import { SharedHeader } from '../../../components/common/SharedHeader';
import type { CustomSkill, RoleModelProfile, TargetJob } from '../../../types';

interface CoachHeroProps {
    activeHeadline: { text: string; highlight: string };
    isTargetMode: boolean;
    setIsTargetMode: (mode: boolean) => void;
    isUploading: boolean;
    uploadProgress: { current: number; total: number };
    triggerUpload: () => void;
    handleTargetJobSubmit: (e: React.FormEvent) => Promise<void>;
    url: string;
    setUrl: (url: string) => void;
    isScrapingUrl: boolean;
    error: string | null;
    setError: (error: string | null) => void;
    roleModels: RoleModelProfile[];
    targetJobs: TargetJob[];
    userSkills: CustomSkill[];
    onViewChange: (view: 'coach-role-models' | 'coach-gap-analysis') => void;
}

export const CoachHero: React.FC<CoachHeroProps> = ({
    activeHeadline,
    isTargetMode,
    setIsTargetMode,
    isUploading,
    uploadProgress,
    triggerUpload,
    handleTargetJobSubmit,
    url,
    setUrl,
    isScrapingUrl,
    error,
    setError,
    roleModels,
    targetJobs,
    userSkills,
    onViewChange
}) => {
    return (
        <>
            <SharedHeader
                title={activeHeadline.text}
                highlight={activeHeadline.highlight}
                subtitle="Distill career paths into your personalized growth roadmap."
                theme="coach"
            />

            {/* Mode Selector */}
            <div className="flex justify-center mb-10">
                <div className="relative bg-neutral-100/50 dark:bg-neutral-900/40 p-1.5 rounded-2xl flex items-center border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-xl shadow-inner-sm">
                    {/* Sliding Background */}
                    <div
                        className={`absolute h-[calc(100%-12px)] w-[calc(50%-6px)] bg-white dark:bg-neutral-800 rounded-xl shadow-sm transition-all duration-300 ease-out z-0 ${isTargetMode ? 'translate-x-[calc(100%)]' : 'translate-x-0'}`}
                    />

                    <button
                        onClick={() => setIsTargetMode(false)}
                        className={`relative z-10 px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2.5 ${!isTargetMode ? 'text-emerald-600' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                    >
                        <Users className={`w-4 h-4 transition-transform duration-300 ${!isTargetMode ? 'scale-110' : 'scale-100'}`} />
                        <span>Emulate</span>
                    </button>

                    <button
                        onClick={() => setIsTargetMode(true)}
                        className={`relative z-10 px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2.5 ${isTargetMode ? 'text-emerald-600' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                    >
                        <Target className={`w-4 h-4 transition-transform duration-300 ${isTargetMode ? 'scale-110' : 'scale-100'}`} />
                        <span>Destination</span>
                    </button>
                </div>
            </div>

            {/* High-Impact Input Area */}
            <div className="w-full max-w-3xl mx-auto animate-in fade-in duration-1000 delay-200">
                {!isTargetMode ? (
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="relative bg-white dark:bg-neutral-950/80 backdrop-blur-xl border border-neutral-200 dark:border-emerald-800/30 rounded-[2.5rem] p-4 shadow-2xl flex flex-col md:flex-row items-center gap-4 group-hover:border-emerald-500/30 transition-all duration-500">
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center text-emerald-600 shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <TrendingUp className="w-8 h-8" />}
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-1">Role Model</div>
                                <div className="text-lg font-medium text-neutral-600 dark:text-neutral-300">
                                    {isUploading
                                        ? `Distilling ${uploadProgress.current}/${uploadProgress.total} profiles...`
                                        : "Upload LinkedIn PDFs to start"}
                                </div>
                            </div>

                            <button
                                onClick={triggerUpload}
                                disabled={isUploading}
                                className="w-full md:w-auto px-8 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add Profile</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleTargetJobSubmit} className="relative group">
                        <div className={`absolute -inset-1 rounded-[2.5rem] blur-xl transition-all duration-1000 ${isScrapingUrl
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 opacity-100 animate-pulse'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 group-hover:opacity-100 transition-opacity'
                            }`} />
                        <div className="relative bg-white dark:bg-neutral-950/80 backdrop-blur-xl border border-neutral-200 dark:border-emerald-800/30 rounded-[2.5rem] p-4 shadow-2xl flex flex-col md:flex-row items-center gap-4 group-hover:border-emerald-500/30 transition-all duration-500">
                            <div className="w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
                                {isScrapingUrl ? (
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                ) : (
                                    <LinkIcon className="h-8 w-8" />
                                )}
                            </div>

                            <div className="flex-1 w-full text-center md:text-left">
                                <div className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-1">
                                    Dream Job
                                </div>
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => { setUrl(e.target.value); setError(null); }}
                                    placeholder={isScrapingUrl ? "Analyzing job requirements..." : "Enter job URL or title..."}
                                    className="w-full bg-transparent border-none rounded-xl text-lg font-medium text-neutral-600 dark:text-neutral-300 placeholder:text-neutral-400 focus:ring-0 focus:outline-none transition-all duration-300"
                                    autoFocus
                                    disabled={isScrapingUrl}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!url.trim() || isScrapingUrl}
                                className="w-full md:w-auto px-8 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isScrapingUrl ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                <span>Set Goal</span>
                            </button>
                        </div>
                        {error && (
                            <p className="absolute -bottom-10 left-6 text-sm font-bold text-red-500 animate-in slide-in-from-top-2">
                                {error}
                            </p>
                        )}
                    </form>
                )}

                {/* Stats Summary */}
                <div className="mt-12 flex flex-wrap items-center justify-center gap-8 animate-in fade-in duration-1000 delay-500">
                    <div
                        onClick={() => onViewChange('coach-role-models')}
                        className="flex items-center gap-3 cursor-pointer group transition-all hover:scale-105"
                    >
                        <div className="w-10 h-10 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shadow-sm group-hover:border-emerald-500/50 group-hover:text-emerald-500 transition-colors">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-lg font-black text-neutral-900 dark:text-white leading-none">{roleModels.length}</div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 group-hover:text-emerald-600 transition-colors">Profiles</div>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />

                    <div
                        onClick={() => onViewChange('coach-gap-analysis')}
                        className="flex items-center gap-3 cursor-pointer group transition-all hover:scale-105"
                    >
                        <div className="w-10 h-10 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shadow-sm group-hover:border-emerald-500/50 group-hover:text-emerald-500 transition-colors">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-lg font-black text-neutral-900 dark:text-white leading-none">{targetJobs.length}</div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 group-hover:text-emerald-600 transition-colors">Goals</div>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />

                    <div className="flex items-center gap-3 select-none">
                        <div className="w-10 h-10 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shadow-sm">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-lg font-black text-neutral-900 dark:text-white leading-none">{userSkills.length}</div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Skills</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
