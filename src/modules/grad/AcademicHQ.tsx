import React from 'react';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { CourseEditModal } from '../../components/edu/CourseEditModal';
import { useAcademicLogic } from './hooks/useAcademicLogic';

// Refactored Components
import { AcademicHero } from './components/AcademicHero';
import { AcademicProfileSummary } from './components/AcademicProfileSummary';
import { CourseRegistry } from './components/CourseRegistry';

export const AcademicHQ: React.FC = () => {
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
        handleFileUpload,
        isParsing,
        parseError,
        handleVerificationSave,
        handleCourseUpdate,
        handleCourseDelete,
        totalCredits,
        progressPercentage,
        calculatedGpa,
        addSemester,
        deleteSemester,
        addCourse
    } = useAcademicLogic();

    return (
        <SharedPageLayout maxWidth="full" className="relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* {!transcript && (
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Transcript</h1>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-2">Manage your coursework and track your degree progress.</p>
                    </div>
                )} */}

                {!transcript ? (
                    <AcademicHero
                        handleFileUpload={handleFileUpload}
                        isParsing={isParsing}
                        parseError={parseError}
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
                            gpa={calculatedGpa}
                        />

                        <div className="max-w-4xl mx-auto space-y-8">
                            <CourseRegistry
                                transcript={transcript}
                                setTranscript={setTranscript}
                                setEditingCourse={setEditingCourse}
                                addSemester={addSemester}
                                deleteSemester={deleteSemester}
                                addCourse={addCourse}
                            />
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
