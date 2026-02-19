import React from 'react';
import {
    Users,
    TrendingUp,
    Plus,
    Target,
    Loader2,
    CheckCircle2,
    Link as LinkIcon,
    Sparkles,
    ArrowRight,
    Map
} from 'lucide-react';
import type { CustomSkill, RoleModelProfile, TargetJob } from '../../../types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

interface CoachHeroProps {
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
    onViewChange: (view: string) => void;
}

export const CoachHero: React.FC<CoachHeroProps> = ({
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
            {/* Mode Selector */}
            <div className="flex justify-center mb-10">
                <div className="relative bg-neutral-100/50 dark:bg-neutral-900/40 p-1.5 rounded-2xl flex items-center border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-xl shadow-inner-sm">
                    {/* Sliding Background */}
                    <div
                        className={`absolute h-[calc(100%-12px)] w-[calc(50%-6px)] bg-white dark:bg-neutral-800 rounded-xl shadow-sm transition-all duration-300 ease-out z-0 ${isTargetMode ? 'translate-x-[calc(100%)]' : 'translate-x-0'}`}
                    />

                    <button
                        onClick={() => setIsTargetMode(false)}
                        className={`relative z-10 px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2.5 ${!isTargetMode ? 'text-accent-primary-hex' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                    >
                        <Users className={`w-4 h-4 transition-transform duration-300 ${!isTargetMode ? 'scale-110' : 'scale-100'}`} />
                        <span>Emulate</span>
                    </button>

                    <button
                        onClick={() => setIsTargetMode(true)}
                        className={`relative z-10 px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2.5 ${isTargetMode ? 'text-accent-primary-hex' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                    >
                        <Target className={`w-4 h-4 transition-transform duration-300 ${isTargetMode ? 'scale-110' : 'scale-100'}`} />
                        <span>Destination</span>
                    </button>
                </div>
            </div>

            {/* High-Impact Input Area */}
            <div className="w-full max-w-3xl mx-auto animate-in fade-in duration-1000 delay-200">
                {!isTargetMode ? (
                    <Card variant="glass" className="p-4 border-accent-primary/20 hover:border-accent-primary/50" glow>
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="w-16 h-16 bg-accent-primary/10 rounded-3xl flex items-center justify-center text-accent-primary-hex shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
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

                            <Button
                                onClick={triggerUpload}
                                disabled={isUploading}
                                variant="accent"
                                size="lg"
                                icon={<Plus className="w-5 h-5" />}
                            >
                                Add Profile
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <form onSubmit={handleTargetJobSubmit}>
                        <Card variant="glass" className="p-4 border-accent-primary/20 hover:border-accent-primary/50" glow>
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                <div className="w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500 bg-accent-primary/10 text-accent-primary-hex">
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

                                <Button
                                    type="submit"
                                    disabled={!url.trim() || isScrapingUrl}
                                    variant="accent"
                                    size="lg"
                                    loading={isScrapingUrl}
                                    icon={<Sparkles className="w-5 h-5" />}
                                >
                                    Set Goal
                                </Button>
                            </div>
                        </Card>
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
                        <div className="w-10 h-10 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shadow-sm group-hover:border-accent-primary/50 group-hover:text-accent-primary-hex transition-colors">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-lg font-black text-neutral-900 dark:text-white leading-none">{roleModels.length}</div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 group-hover:text-accent-primary-hex transition-colors">Profiles</div>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />

                    <div
                        onClick={() => onViewChange('coach-gap-analysis')}
                        className="flex items-center gap-3 cursor-pointer group transition-all hover:scale-105"
                    >
                        <div className="w-10 h-10 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shadow-sm group-hover:border-accent-primary/50 group-hover:text-accent-primary-hex transition-colors">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-lg font-black text-neutral-900 dark:text-white leading-none">{targetJobs.length}</div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 group-hover:text-accent-primary-hex transition-colors">Goals</div>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />

                    <div
                        onClick={() => onViewChange('skills' as any)}
                        className="flex items-center gap-3 cursor-pointer group transition-all hover:scale-105"
                    >
                        <div className="w-10 h-10 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shadow-sm group-hover:border-accent-primary/50 group-hover:text-accent-primary-hex transition-colors">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-lg font-black text-neutral-900 dark:text-white leading-none">{userSkills.length}</div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 group-hover:text-accent-primary-hex transition-colors">Skills</div>
                        </div>
                    </div>
                </div>

                {/* Quick-Start Guide (only when empty) */}
                {roleModels.length === 0 && targetJobs.length === 0 && (
                    <div className="mt-14 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
                        <div className="text-center mb-6">
                            <div className="text-[10px] uppercase tracking-widest font-black text-neutral-400">Getting Started</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div
                                onClick={() => onViewChange('coach-role-models')}
                                className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 cursor-pointer group hover:border-accent-primary/30 hover:shadow-lg hover:shadow-accent-primary/5 transition-all hover:-translate-y-1"
                            >
                                <div className="w-12 h-12 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-accent-primary-hex mb-4 group-hover:scale-110 transition-transform">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div className="text-[10px] uppercase tracking-widest font-black text-accent-primary-hex mb-1">Step 1</div>
                                <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Add Mentors</h4>
                                <p className="text-xs text-neutral-400 leading-relaxed">Upload LinkedIn profiles of people whose careers you admire.</p>
                                <div className="flex items-center gap-1 mt-3 text-xs font-bold text-accent-primary-hex opacity-0 group-hover:opacity-100 transition-opacity">
                                    Start here <ArrowRight className="w-3 h-3" />
                                </div>
                            </div>

                            <div
                                onClick={() => onViewChange('coach-gap-analysis')}
                                className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 cursor-pointer group hover:border-accent-primary/30 hover:shadow-lg hover:shadow-accent-primary/5 transition-all hover:-translate-y-1"
                            >
                                <div className="w-12 h-12 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-accent-primary-hex mb-4 group-hover:scale-110 transition-transform">
                                    <Target className="w-6 h-6" />
                                </div>
                                <div className="text-[10px] uppercase tracking-widest font-black text-accent-primary-hex mb-1">Step 2</div>
                                <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Set Goals</h4>
                                <p className="text-xs text-neutral-400 leading-relaxed">Define your dream role and run a gap analysis against your profile.</p>
                                <div className="flex items-center gap-1 mt-3 text-xs font-bold text-accent-primary-hex opacity-0 group-hover:opacity-100 transition-opacity">
                                    Set a goal <ArrowRight className="w-3 h-3" />
                                </div>
                            </div>

                            <div
                                onClick={() => onViewChange('career-growth')}
                                className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 cursor-pointer group hover:border-accent-primary/30 hover:shadow-lg hover:shadow-accent-primary/5 transition-all hover:-translate-y-1"
                            >
                                <div className="w-12 h-12 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-accent-primary-hex mb-4 group-hover:scale-110 transition-transform">
                                    <Map className="w-6 h-6" />
                                </div>
                                <div className="text-[10px] uppercase tracking-widest font-black text-accent-primary-hex mb-1">Step 3</div>
                                <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Track Growth</h4>
                                <p className="text-xs text-neutral-400 leading-relaxed">Generate a 12-month roadmap and track milestones as you progress.</p>
                                <div className="flex items-center gap-1 mt-3 text-xs font-bold text-accent-primary-hex opacity-0 group-hover:opacity-100 transition-opacity">
                                    View roadmap <ArrowRight className="w-3 h-3" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
