import React from 'react';
import type { Transcript } from '../../../types';

interface AcademicProfileSummaryProps {
    transcript: Transcript;
    targetCredits: number;
    setTargetCredits: (credits: number) => void;
    totalCredits: number;
    progressPercentage: number;
    gpa?: string;
    onUpdateTranscript?: (updates: Partial<Transcript>) => void;
}

export const AcademicProfileSummary: React.FC<AcademicProfileSummaryProps> = ({
    transcript,
    targetCredits,
    setTargetCredits,
    totalCredits,
    progressPercentage,
    gpa,
    onUpdateTranscript
}) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editedUniversity, setEditedUniversity] = React.useState(transcript.university || '');
    const [editedProgram, setEditedProgram] = React.useState(transcript.program || '');

    const handleSave = () => {
        onUpdateTranscript?.({
            university: editedUniversity,
            program: editedProgram
        });
        setIsEditing(false);
    };
    return (
        <div className="bg-neutral-50 dark:bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 text-neutral-900 dark:text-white border border-neutral-200 dark:border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-amber-500/10 transition-colors duration-1000" />
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <span className="text-xl font-black">{transcript.university?.charAt(0) || 'U'}</span>
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-0.5">Academic Profile</div>
                            <h2 className="text-xl font-black tracking-tight tracking-[-0.02em]">
                                {transcript.studentName || 'Student Name'}
                            </h2>
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="space-y-3 bg-neutral-100 dark:bg-white/5 p-4 rounded-2xl border border-neutral-200 dark:border-white/5 mx-auto md:mx-0 w-full md:w-80">
                            <input
                                value={editedUniversity}
                                onChange={(e) => setEditedUniversity(e.target.value)}
                                placeholder="University Name"
                                className="w-full bg-transparent border-b border-neutral-300 dark:border-neutral-700 text-sm font-bold p-1 outline-none focus:border-amber-500 transition-colors"
                            />
                            <input
                                value={editedProgram}
                                onChange={(e) => setEditedProgram(e.target.value)}
                                placeholder="Program Name"
                                className="w-full bg-transparent border-b border-neutral-300 dark:border-neutral-700 text-sm font-bold p-1 outline-none focus:border-amber-500 transition-colors"
                            />
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-colors"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neutral-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 font-bold bg-neutral-100 dark:bg-white/5 px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/5 cursor-pointer hover:border-amber-500 transition-colors"
                            onClick={() => {
                                setEditedUniversity(transcript.university || '');
                                setEditedProgram(transcript.program || '');
                                setIsEditing(true);
                            }}
                        >
                            <span className="text-neutral-900 dark:text-white text-sm">{transcript.university || 'Add University'}</span>
                            <span className="opacity-30">•</span>
                            <span className="text-sm">{transcript.program || 'Add Program'}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-8 bg-white dark:bg-neutral-800/50 p-6 rounded-[2rem] shadow-xl border border-neutral-200 dark:border-white/5 group/stats">
                    <div className="text-center px-4 border-r border-neutral-200 dark:border-white/10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">Calculated GPA</div>
                        <div className="text-3xl font-black text-amber-500 font-mono drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]">{gpa || transcript.cgpa || '0.00'}</div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-neutral-100 dark:text-neutral-800" />
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-amber-500 transition-all duration-1000 ease-out" strokeDasharray={175.84} strokeDashoffset={175.84 - (175.84 * progressPercentage) / 100} strokeLinecap="round" />
                            </svg>
                            <div className="absolute text-[10px] font-black text-neutral-900 dark:text-white">{Math.round(progressPercentage)}%</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">Degree Completion</div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-neutral-900 dark:text-white font-mono">{Math.round(totalCredits * 10) / 10}</span>
                                <span className="text-sm text-neutral-400 font-bold">/</span>
                                <div className="flex flex-col">
                                    <input
                                        type="number"
                                        value={targetCredits === 0 ? '' : targetCredits}
                                        onChange={(e) => setTargetCredits(e.target.value ? parseFloat(e.target.value) : 0)}
                                        placeholder="Target"
                                        className="w-16 bg-transparent text-sm text-neutral-500 dark:text-neutral-400 font-bold border-b border-neutral-200 dark:border-neutral-700 focus:border-amber-500 focus:text-amber-500 outline-none text-center transition-colors font-mono"
                                    />
                                    <span className="text-[8px] font-black uppercase tracking-tighter text-neutral-400 mt-0.5">Target</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
