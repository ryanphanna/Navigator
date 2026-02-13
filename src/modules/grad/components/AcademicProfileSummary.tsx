import React from 'react';
import type { Transcript } from '../../../types';

interface AcademicProfileSummaryProps {
    transcript: Transcript;
    targetCredits: number;
    setTargetCredits: (credits: number) => void;
    totalCredits: number;
    progressPercentage: number;
}

export const AcademicProfileSummary: React.FC<AcademicProfileSummaryProps> = ({
    transcript,
    targetCredits,
    setTargetCredits,
    totalCredits,
    progressPercentage
}) => {
    return (
        <div className="bg-neutral-900 dark:bg-black rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">Academic Profile</div>
                    <h2 className="text-4xl font-black tracking-tighter mb-2">
                        {transcript.studentName || 'Unidentified Student'}
                    </h2>
                    <p className="text-neutral-400 font-bold flex items-center gap-2">
                        <span className="text-white">{transcript.university}</span>
                        <span className="opacity-30">•</span>
                        <span>{transcript.program}</span>
                    </p>
                </div>

                <div className="flex items-center gap-8 bg-white/5 p-6 rounded-3xl backdrop-blur-xl border border-white/10">
                    <div className="text-center px-4 border-r border-white/10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Standard GPA</div>
                        <div className="text-3xl font-black text-indigo-400 font-mono">{transcript.cgpa || '0.00'}</div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-neutral-800" />
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-emerald-500 transition-all duration-1000 ease-out" strokeDasharray={175.84} strokeDashoffset={175.84 - (175.84 * progressPercentage) / 100} strokeLinecap="round" />
                            </svg>
                            <div className="absolute text-[10px] font-black text-white">{Math.round(progressPercentage)}%</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Degree Progress</div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-white font-mono">{totalCredits}</span>
                                <span className="text-sm text-neutral-500 font-bold">/</span>
                                <input
                                    type="number"
                                    value={targetCredits}
                                    onChange={(e) => setTargetCredits(parseFloat(e.target.value))}
                                    className="w-12 bg-transparent text-sm text-neutral-500 font-bold border-b border-neutral-700 focus:border-indigo-500 focus:text-indigo-400 outline-none text-center transition-colors font-mono"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
