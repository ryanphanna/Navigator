import React from 'react';
import { SharedHeader } from '../../components/common/SharedHeader';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { CourseEditModal } from '../../components/edu/CourseEditModal';
import { useAcademicLogic } from '../../hooks/useAcademicLogic';

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
                <AcademicHero
                    handleUploadComplete={handleUploadComplete}
                    tempTranscript={tempTranscript}
                    showVerification={showVerification}
                    setShowVerification={setShowVerification}
                    handleVerificationSave={handleVerificationSave}
                />
            ) : (
                <div className="space-y-12 max-w-6xl mx-auto">
                    <AcademicProfileSummary
                        transcript={transcript}
                        targetCredits={targetCredits}
                        setTargetCredits={setTargetCredits}
                        totalCredits={totalCredits}
                        progressPercentage={progressPercentage}
                    />

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
