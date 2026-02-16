import React from 'react';

import { TranscriptUpload } from '../TranscriptUpload';
import { CourseVerificationModal } from '../../../components/edu/CourseVerificationModal';
import type { Transcript } from '../../../types';

interface AcademicHeroProps {
    handleUploadComplete: (parsed: Transcript) => void;
    tempTranscript: Transcript | null;
    showVerification: boolean;
    setShowVerification: (show: boolean) => void;
    handleVerificationSave: (verified: Transcript) => void;
}

export const AcademicHero: React.FC<AcademicHeroProps> = ({
    handleUploadComplete,
    tempTranscript,
    showVerification,
    setShowVerification,
    handleVerificationSave
}) => {
    return (
        <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-8 md:p-10 text-center">
                <div className="mb-8 max-w-lg mx-auto">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">Upload your Transcript</h2>
                    <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Upload your PDF transcript to automatically import your academic history.
                        We'll extract your courses, grades, and credits to help you track your progress.
                    </p>
                </div>

                <div className="max-w-md mx-auto">
                    <TranscriptUpload onUploadComplete={handleUploadComplete} />
                </div>
            </div>

            {tempTranscript && (
                <CourseVerificationModal
                    isOpen={showVerification}
                    onClose={() => setShowVerification(false)}
                    transcript={tempTranscript}
                    onSave={handleVerificationSave}
                />
            )}
        </div>
    );
};
