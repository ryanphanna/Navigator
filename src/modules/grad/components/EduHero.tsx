import React from 'react';
import {
    GraduationCap,
    FileText
} from 'lucide-react';
import { TranscriptUpload } from '../TranscriptUpload';
import type { Transcript } from '../../../types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

interface EduHeroProps {
    transcript: Transcript | null;
    calculatedGpa: string;
    totalCredits: number;
    targetCredits: number;
    progressPercentage: number;
    onViewChange: (view: string) => void;
    handleUploadComplete: (parsed: Transcript) => void;
}

export const EduHero: React.FC<EduHeroProps> = ({
    transcript,
    calculatedGpa,
    totalCredits,
    targetCredits,
    progressPercentage,
    onViewChange,
    handleUploadComplete
}) => {
    return (
        <>
            <div className="w-full max-w-4xl mx-auto mb-16 px-4 animate-in zoom-in-95 fade-in duration-500">
                {!transcript ? (
                    <Card variant="glass" className="group border-accent-primary/20 hover:border-accent-primary/50" glow>
                        <div className="p-8 md:p-12 flex flex-col items-center text-center gap-8 transition-all duration-500 overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 text-accent-primary/5 group-hover:text-accent-primary/10 transition-colors pointer-events-none">
                                <GraduationCap className="w-48 h-48" />
                            </div>

                            <div className="relative z-10 space-y-6">
                                <div className="w-20 h-20 bg-accent-primary/10 rounded-[2rem] flex items-center justify-center text-accent-primary-hex mx-auto shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <GraduationCap className="w-10 h-10" />
                                </div>

                                <div className="space-y-2">
                                    <div className="text-[10px] font-black text-accent-primary-hex uppercase tracking-[0.3em]">Academic Record</div>
                                    <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                                        Upload Transcript to start tracking
                                    </h2>
                                    <p className="text-neutral-500 dark:text-neutral-400 font-medium max-w-md mx-auto leading-relaxed">
                                        Experience a smart overview of your academic journey. We'll analyze your courses and calculate your 4.0 GPA automatically.
                                    </p>
                                </div>

                                <div className="w-full max-w-sm mx-auto pt-4">
                                    <TranscriptUpload onUploadComplete={handleUploadComplete} />
                                </div>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card variant="glass" className="p-6 md:p-8 border-accent-primary/20" glow>
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            {/* GPA Circle */}
                            <div className="relative group/gpa cursor-pointer" onClick={() => onViewChange('edu-gpa')}>
                                <svg className="w-24 h-24 transform -rotate-90">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="42"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        className="text-neutral-100 dark:text-neutral-800"
                                    />
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="42"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        strokeDasharray={264}
                                        strokeDashoffset={264 - (264 * (parseFloat(calculatedGpa) / 4.0))}
                                        strokeLinecap="round"
                                        className="text-accent-primary-hex transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-neutral-900 dark:text-white leading-none">{calculatedGpa}</span>
                                    <span className="text-[10px] uppercase font-bold text-neutral-400">GPA</span>
                                </div>
                            </div>

                            {/* Stats & Progress */}
                            <div className="flex-1 w-full space-y-6">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <div className="text-[12px] font-black text-neutral-900 dark:text-white mb-0.5">
                                                {transcript.university}
                                            </div>
                                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                                <span>{transcript.program}</span>
                                                <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span>{totalCredits >= targetCredits ? 'Requirements Met' : 'Active'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-px h-10 bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />
                                        <div>
                                            <div className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-1">Credits</div>
                                            <span className="text-lg font-bold text-neutral-900 dark:text-white">{totalCredits} / {targetCredits}</span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="secondary"
                                        size="md"
                                        onClick={() => onViewChange('edu-transcript')}
                                        icon={<FileText className="w-4 h-4" />}
                                        title="View and edit your transcript records"
                                    >
                                        Transcript Registry
                                    </Button>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-black text-neutral-400">
                                        <span>Degree Completion Progress</span>
                                        <span>{Math.round(progressPercentage)}%</span>
                                    </div>
                                    <div className="h-3.5 w-full bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 shadow-inner">
                                        <div
                                            className="h-full bg-accent-gradient transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(var(--accent-primary),0.3)]"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </>
    );
};
