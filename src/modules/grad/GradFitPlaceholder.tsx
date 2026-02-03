import React, { useState } from 'react';
import { PageLayout } from '../../components/common/PageLayout';
import { GraduationCap, BookOpen, Calculator, Award } from 'lucide-react';
import { TranscriptUpload } from './TranscriptUpload';
import { GPACalculator } from './GPACalculator';
import { MAEligibility } from './MAEligibility';
import { SkillExtractor } from './SkillExtractor';
import type { Transcript } from '../../types';

interface GradFitPlaceholderProps {
    onAddSkills?: (skills: Array<{ name: string; category?: 'hard' | 'soft'; proficiency: 'learning' | 'comfortable' | 'expert' }>) => Promise<void>;
}

export const GradFitPlaceholder: React.FC<GradFitPlaceholderProps> = ({ onAddSkills }) => {
    const [transcript, setTranscript] = useState<Transcript | null>(null);

    return (
        <PageLayout
            title="GradFit"
            description="Transcript analysis and academic planning."
            icon={<GraduationCap />}
            themeColor="rose"
        >
            {!transcript ? (
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Academic Reconnaissance</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                            Upload your transcript to unlock GPA analysis, course mastery tracking, and grad school eligibility checks.
                        </p>
                    </div>

                    <TranscriptUpload onUploadComplete={setTranscript} />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-75">
                        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg flex items-center justify-center mb-4">
                                <Calculator className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold mb-2">GPA Calculator</h3>
                            <p className="text-sm text-slate-500">Auto-calculate cGPA, sGPA, and last-2-years GPA.</p>
                        </div>
                        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg flex items-center justify-center mb-4">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold mb-2">Course Mapping</h3>
                            <p className="text-sm text-slate-500">Map your courses to prerequisite requirements.</p>
                        </div>
                        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg flex items-center justify-center mb-4">
                                <Award className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold mb-2">Skill Extraction</h3>
                            <p className="text-sm text-slate-500">Turn academic theory into market-ready skills.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Active Dashboard View */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {transcript.studentName || 'Student'} Analysis
                                </h2>
                                <p className="text-slate-500">{transcript.university} • {transcript.program}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-500 mb-1">Cumulative GPA</div>
                                <div className="text-3xl font-bold text-rose-600">{transcript.cgpa || 'N/A'}</div>
                            </div>
                        </div>

                        {/* Feature Modules */}
                        <div className="space-y-6 mb-8">
                            <GPACalculator transcript={transcript} />
                            <MAEligibility transcript={transcript} />
                            {onAddSkills && <SkillExtractor transcript={transcript} onAddSkills={onAddSkills} />}
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Extracted Semesters
                            </h3>
                            <div className="grid gap-4">
                                {transcript.semesters.map((sem, i) => (
                                    <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between font-medium mb-2">
                                            <span>{sem.term} {sem.year}</span>
                                            <span className="text-slate-500">{sem.courses.length} courses</span>
                                        </div>
                                        <div className="space-y-1">
                                            {sem.courses.map((c, j) => (
                                                <div key={j} className="flex justify-between text-sm">
                                                    <span className="text-slate-700 dark:text-slate-300 w-24 shrink-0">{c.code}</span>
                                                    <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{c.title}</span>
                                                    <span className="font-mono text-slate-900 dark:text-slate-200 ml-4">{c.grade}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setTranscript(null)}
                                className="text-slate-500 hover:text-slate-700 text-sm"
                            >
                                Reset Analysis
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
};
