import React from 'react';
import { BookOpen, Plus, Trash2, CalendarPlus } from 'lucide-react';
import type { Transcript, Course } from '../../../types';

interface CourseRegistryProps {
    transcript: Transcript;
    setTranscript: (transcript: Transcript | null) => void;
    setEditingCourse: (edit: { semIndex: number; courseIndex: number; course: Course } | null) => void;
    addSemester: () => void;
    addCourse: (semIndex: number) => void;
    deleteSemester: (semIndex: number) => void;
}

export const CourseRegistry: React.FC<CourseRegistryProps> = ({
    transcript,
    setTranscript,
    setEditingCourse,
    addSemester,
    addCourse,
    deleteSemester
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-2xl text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    Transcript
                </h3>
                <div className="flex items-center gap-3">
                    <button
                        onClick={addSemester}
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                    >
                        <CalendarPlus className="w-4 h-4" />
                        Add Term
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to reset your entire transcript? This cannot be undone.')) {
                                setTranscript(null);
                            }
                        }}
                        className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-rose-500 font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div className="grid gap-6">
                {transcript.semesters.map((sem, i) => (
                    <div key={i} className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-xl p-8 rounded-3xl border border-white dark:border-neutral-700 shadow-sm relative overflow-hidden group/sem">
                        <div className="absolute top-0 right-0 p-4 opacity-5 font-black text-6xl italic select-none">{sem.year}</div>
                        <div className="flex justify-between items-start mb-6 relative">
                            <div>
                                <h4 className="text-xl font-black text-neutral-900 dark:text-white group-hover/sem:text-indigo-600 transition-colors uppercase tracking-tight">{sem.term}</h4>
                                <p className="text-sm font-medium text-neutral-500">{sem.year}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-widest">
                                    {sem.courses.length} Courses
                                </span>
                                <button
                                    onClick={() => deleteSemester(i)}
                                    className="p-1.5 text-neutral-300 hover:text-rose-500 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
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
                                        {c.grade ? (
                                            <div className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm shadow-sm transition-colors ${['A+', 'A', 'A-'].some(g => c.grade.includes(g)) ? 'bg-emerald-500 text-white' : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'}`}>
                                                {c.grade}
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 flex items-center justify-center rounded-xl font-black text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-400 shadow-inner">
                                                PL
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => addCourse(i)}
                                className="w-full py-3 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-indigo-500 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                            >
                                <Plus className="w-4 h-4" />
                                Add Course
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
