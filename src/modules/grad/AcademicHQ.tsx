import React from 'react';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { CourseEditModal } from '../../components/edu/CourseEditModal';
import { useAcademicLogic } from './hooks/useAcademicLogic';

// Refactored Components
import { AcademicHero } from './components/AcademicHero';
import { AcademicProfileSummary } from './components/AcademicProfileSummary';
import { AcademicPrograms } from './components/AcademicPrograms';
import { CourseRegistry } from './components/CourseRegistry';

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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Transcript</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-2">Manage your coursework and track your degree progress.</p>
                </div>

                {!transcript ? (
                    <AcademicHero
                        handleUploadComplete={handleUploadComplete}
                        tempTranscript={tempTranscript}
                        showVerification={showVerification}
                        setShowVerification={setShowVerification}
                        handleVerificationSave={handleVerificationSave}
                    />
                ) : (
                    <div className="space-y-12">
                        <AcademicProfileSummary
                            transcript={transcript}
                            targetCredits={targetCredits}
                            setTargetCredits={setTargetCredits}
                            totalCredits={totalCredits}
                            progressPercentage={progressPercentage}
                        />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <AcademicPrograms
                                    transcript={transcript}
                                    onAddSkills={onAddSkills}
                                />
                                <CourseRegistry
                                    transcript={transcript}
                                    setTranscript={setTranscript}
                                    setEditingCourse={setEditingCourse}
                                />
                            </div>
                            <div className="space-y-8">
                                {/* Placeholder for sidebar analytics or other widgets if needed */}
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
            </div>
        </SharedPageLayout>
    );
};
