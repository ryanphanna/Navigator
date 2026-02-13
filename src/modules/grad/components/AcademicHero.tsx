import React from 'react';
import { Calculator, BookOpen, Award } from 'lucide-react';
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
    );
};
