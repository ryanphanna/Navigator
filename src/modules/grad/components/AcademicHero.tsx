import React from 'react';

import { CourseVerificationModal } from '../../../components/edu/CourseVerificationModal';
import type { Transcript } from '../../../types';
import { UnifiedUploadHero } from '../../../components/common/UnifiedUploadHero';
import { GraduationCap, Zap } from 'lucide-react';

interface AcademicHeroProps {
    handleFileUpload: (files: File[]) => void;
    isParsing: boolean;
    parseError: string | null;
    tempTranscript: Transcript | null;
    showVerification: boolean;
    setShowVerification: (show: boolean) => void;
    handleVerificationSave: (verified: Transcript) => void;
}

export const AcademicHero: React.FC<AcademicHeroProps> = ({
    handleFileUpload,
    isParsing,
    parseError,
    tempTranscript,
    showVerification,
    setShowVerification,
    handleVerificationSave
}) => {
    return (
        <div className="max-w-5xl mx-auto mt-12 px-4">
            <UnifiedUploadHero
                title="Upload Transcript"
                description="Drag & drop your PDF transcript here to automatically import your academic history"
                onUpload={handleFileUpload}
                isLoading={isParsing}
                error={parseError}
                themeColor="amber"
                cards={{
                    foundation: {
                        title: "Academic Record",
                        description: "We analyze your courses and calculate your 4.0 GPA automatically. Your privacy is our priority.",
                        icon: GraduationCap,
                        benefits: ['Smart Course Extraction', 'Grade Normalization', 'Privacy-First Parsing']
                    },
                    intelligence: {
                        title: "Intelligence",
                        description: "Experience a smart overview of your academic journey and discover your true potential.",
                        icon: Zap,
                        benefits: ['GPA Forecasting', 'Credit Tracking', 'Curated Program Discovery']
                    }
                }}
            />

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

