import React from 'react';
import { BookOpen, Calculator, Award } from 'lucide-react';
import { TranscriptUpload } from './TranscriptUpload';
import { GPACalculator } from './GPACalculator';

import { SharedHeader } from '../../components/common/SharedHeader';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { MAEligibility } from './MAEligibility';
import { SkillExtractor } from './SkillExtractor';
import { CourseVerificationModal } from '../../components/edu/CourseVerificationModal';
import { CourseEditModal } from '../../components/edu/CourseEditModal';
import { useAcademicLogic } from '../../hooks/useAcademicLogic';

interface AcademicHQProps {
    onAddSkills?: (skills: Array<{ name: string; category?: 'hard' | 'soft'; proficiency: 'learning' | 'comfortable' | 'expert' }>) => Promise<void>;
}

export const AcademicHQ: React.FC<AcademicHQProps> = ({ onAddSkills }) => {
    const {
        transcript,
        setTranscript,
        targetCredits,
        setTargetCredits,
        tempTranscript,
        showVerification,
        setShowVerification,
        editingCourse,
        setEditingCourse,
        handleUploadComplete,
        handleVerificationSave,
        handleCourseUpdate,
        handleCourseDelete,
        totalCredits,
        progressPercentage
    } = useAcademicLogic();

    return (
        <SharedPageLayout maxWidth="full" className="relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob" />
                <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000" />
            </div>

            <SharedHeader
                title="Master your"
                highlight="Craft"
                subtitle="Your permanent academic record and career reconnaissance operations."
                theme="edu"
            />

            {!transcript ? (
                <div className="max-w-4xl mx-auto space-y-16">
                    <div className="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm p-2 rounded-[2.5rem] border border-white/50 dark:border-neutral-800 shadow-2xl">
                        <TranscriptUpload onUploadComplete={handleUploadComplete} />
                    </div>

                    {tempTranscript && (
                        <CourseVerificationModal
                            isOpen={showVerification}
                            onClose={() => setShowVerification(false)}
                            transcript={tempTranscript}
                            onSave={handleVerificationSave}
                        />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-8 bg-white/40 dark:bg-neutral-800/40 backdrop-blur-md rounded-3xl border border-white dark:border-neutral-700 shadow-sm group hover:scale-[1.02] transition-all">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Calculator className="w-6 h-6" />
                            </div>
                            <h3 className="font-black text-neutral-900 dark:text-white mb-2">GPA Calculator</h3>
                            <p className="text-sm text-neutral-500 font-medium leading-relaxed">Precision-engineered cGPA, sGPA, and L2 calculations.</p>
                        </div>
                        <div className="p-8 bg-white/40 dark:bg-neutral-800/40 backdrop-blur-md rounded-3xl border border-white dark:border-neutral-700 shadow-sm group hover:scale-[1.02] transition-all">
                            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <h3 className="font-black text-neutral-900 dark:text-white mb-2">Course Mapping</h3>
                            <p className="text-sm text-neutral-500 font-medium leading-relaxed">Map your academic history to prerequisite requirements.</p>
                        </div>
                        <div className="p-8 bg-white/40 dark:bg-neutral-800/40 backdrop-blur-md rounded-3xl border border-white dark:border-neutral-700 shadow-sm group hover:scale-[1.02] transition-all">
                            <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                <Award className="w-6 h-6" />
                            </div>
                            <h3 className="font-black text-neutral-900 dark:text-white mb-2">Skill Extraction</h3>
                            <p className="text-sm text-neutral-500 font-medium leading-relaxed">Mutate academic theory into professional market assets.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-12 max-w-6xl mx-auto">
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

                    <div className="space-y-8">
                        <GPACalculator transcript={transcript} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <MAEligibility transcript={transcript} />
                            {onAddSkills && <SkillExtractor transcript={transcript} onAddSkills={onAddSkills} />}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-black text-2xl text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                Course Registry
                            </h3>
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure? This cannot be undone.')) {
                                        setTranscript(null);
                                    }
                                }}
                                className="px-6 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-rose-500 font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Reset Registry
                            </button>
                        </div>

                        <div className="grid gap-6">
                            {transcript.semesters.map((sem, i) => (
                                <div key={i} className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-xl p-8 rounded-3xl border border-white dark:border-neutral-700 shadow-sm relative overflow-hidden group/sem">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 font-black text-6xl italic select-none">{sem.year}</div>
                                    <div className="flex justify-between items-end mb-6 relative">
                                        <div>
                                            <h4 className="text-xl font-black text-neutral-900 dark:text-white group-hover/sem:text-indigo-600 transition-colors uppercase tracking-tight">{sem.term}</h4>
                                            <p className="text-sm font-medium text-neutral-500">{sem.year}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-widest">
                                            {sem.courses.length} Units
                                        </span>
                                    </div>
                                    <div className="space-y-3 relative">
                                        {sem.courses.map((c, j) => (
                                            <div
                                                key={j}
                                                onClick={() => setEditingCourse({ semIndex: i, courseIndex: j, course: c })}
                                                className="flex items-center justify-between p-4 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl group/course hover:bg-white dark:hover:bg-neutral-800 transition-all border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-16 font-mono text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 py-1 px-2 rounded text-center uppercase tracking-tighter">
                                                        {c.code}
                                                    </div>
                                                    <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 truncate max-w-sm">{c.title}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{c.credits || 0.5} CR</span>
                                                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm shadow-sm transition-colors ${['A+', 'A', 'A-'].some(g => c.grade.includes(g)) ? 'bg-emerald-500 text-white' : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'}`}>
                                                        {c.grade}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {editingCourse && (
                <CourseEditModal
                    isOpen={!!editingCourse}
                    onClose={() => setEditingCourse(null)}
                    course={editingCourse.course}
                    onSave={handleCourseUpdate}
                    onDelete={handleCourseDelete}
                />
            )}
        </SharedPageLayout>
    );
};
