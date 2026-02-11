import React, { useState } from 'react';
import { X, Check, AlertCircle, Save, Trash2, Plus } from 'lucide-react';
import type { Transcript, Course } from '../../types';

interface CourseVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    transcript: Transcript;
    onSave: (updatedTranscript: Transcript) => void;
}

export const CourseVerificationModal: React.FC<CourseVerificationModalProps> = ({
    isOpen,
    onClose,
    transcript,
    onSave
}) => {
    const [editableTranscript, setEditableTranscript] = useState<Transcript>({ ...transcript });

    if (!isOpen) return null;

    const handleCourseChange = (semIndex: number, courseIndex: number, field: keyof Course, value: any) => {
        const newSemesters = [...editableTranscript.semesters];
        const newCourses = [...newSemesters[semIndex].courses];
        newCourses[courseIndex] = { ...newCourses[courseIndex], [field]: value };
        newSemesters[semIndex] = { ...newSemesters[semIndex], courses: newCourses };
        setEditableTranscript({ ...editableTranscript, semesters: newSemesters });
    };

    const addCourse = (semIndex: number) => {
        const newSemesters = [...editableTranscript.semesters];
        newSemesters[semIndex].courses.push({
            code: '',
            title: 'New Course',
            grade: '',
            credits: 0.5
        });
        setEditableTranscript({ ...editableTranscript, semesters: newSemesters });
    };

    const removeCourse = (semIndex: number, courseIndex: number) => {
        const newSemesters = [...editableTranscript.semesters];
        newSemesters[semIndex].courses.splice(courseIndex, 1);
        setEditableTranscript({ ...editableTranscript, semesters: newSemesters });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <Check className="w-6 h-6 text-emerald-500" />
                            Verify Transcript Data
                        </h2>
                        <p className="text-sm text-neutral-500 mt-1">Gemini extracted these courses. Please confirm they are accurate.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-700">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Student Name</label>
                            <input
                                type="text"
                                value={editableTranscript.studentName || ''}
                                onChange={(e) => setEditableTranscript({ ...editableTranscript, studentName: e.target.value })}
                                className="w-full bg-transparent border-none p-0 text-sm font-semibold focus:ring-0"
                            />
                        </div>
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-700">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">University</label>
                            <input
                                type="text"
                                value={editableTranscript.university || ''}
                                onChange={(e) => setEditableTranscript({ ...editableTranscript, university: e.target.value })}
                                className="w-full bg-transparent border-none p-0 text-sm font-semibold focus:ring-0"
                            />
                        </div>
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-700">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Stated cGPA</label>
                            <input
                                type="number"
                                step="0.01"
                                value={editableTranscript.cgpa || ''}
                                onChange={(e) => setEditableTranscript({ ...editableTranscript, cgpa: parseFloat(e.target.value) })}
                                className="w-full bg-transparent border-none p-0 text-sm font-semibold focus:ring-0"
                            />
                        </div>
                    </div>

                    {editableTranscript.semesters.map((sem, sIdx) => (
                        <div key={sIdx} className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                                <h3 className="font-bold text-neutral-800 dark:text-neutral-200">{sem.term} {sem.year}</h3>
                                <button
                                    onClick={() => addCourse(sIdx)}
                                    className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    <Plus className="w-3 h-3" /> Add Course
                                </button>
                            </div>
                            <div className="grid grid-cols-12 gap-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2">
                                <div className="col-span-2">Code</div>
                                <div className="col-span-6">Title</div>
                                <div className="col-span-2 text-center">Grade</div>
                                <div className="col-span-1 text-center">Cred</div>
                                <div className="col-span-1"></div>
                            </div>
                            <div className="space-y-2">
                                {sem.courses.map((course, cIdx) => (
                                    <div key={cIdx} className="grid grid-cols-12 gap-3 items-center bg-neutral-50 dark:bg-neutral-800/30 p-2 rounded-lg group transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800/50">
                                        <div className="col-span-2">
                                            <input
                                                type="text"
                                                value={course.code}
                                                onChange={(e) => handleCourseChange(sIdx, cIdx, 'code', e.target.value)}
                                                className="w-full bg-transparent border-none p-0 text-xs font-medium focus:ring-0"
                                            />
                                        </div>
                                        <div className="col-span-6">
                                            <input
                                                type="text"
                                                value={course.title}
                                                onChange={(e) => handleCourseChange(sIdx, cIdx, 'title', e.target.value)}
                                                className="w-full bg-transparent border-none p-0 text-xs focus:ring-0"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="text"
                                                value={course.grade}
                                                onChange={(e) => handleCourseChange(sIdx, cIdx, 'grade', e.target.value)}
                                                className="w-full bg-transparent border-none p-0 text-xs font-bold text-center focus:ring-0"
                                            />
                                        </div>
                                        <div className="col-span-1 text-center text-xs">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={course.credits}
                                                onChange={(e) => handleCourseChange(sIdx, cIdx, 'credits', parseFloat(e.target.value))}
                                                className="w-full bg-transparent border-none p-0 text-xs text-center focus:ring-0"
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <button
                                                onClick={() => removeCourse(sIdx, cIdx)}
                                                className="p-1.5 text-neutral-300 hover:text-red-500 rounded transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/50">
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        Changes will be saved to your local vault.
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { onSave(editableTranscript); onClose(); }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Save className="w-4 h-4" />
                            Confirm Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
