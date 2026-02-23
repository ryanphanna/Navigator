import React from 'react';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { Calculator, School } from 'lucide-react';
import { useGlobalUI } from '../../contexts/GlobalUIContext';
import { FEATURE_REGISTRY, shouldShowNewBadge } from '../../featureRegistry';

import { BentoCard } from '../../components/ui/BentoCard';
import { EduHero } from './components/EduHero';
import { ProgramRequirements } from './components/ProgramRequirements';


import { useAcademicLogic } from './hooks/useAcademicLogic';

import { PageHeader } from '../../components/ui/PageHeader';
import { CourseVerificationModal } from '../../components/edu/CourseVerificationModal';

export const EducationDashboard: React.FC = () => {
    const { setView } = useGlobalUI();
    const {
        transcript,
        calculatedGpa,
        totalCredits,
        targetCredits,
        progressPercentage,
        handleFileUpload,
        isParsing,
        parseError,
        tempTranscript,
        showVerification,
        setShowVerification,
        handleVerificationSave,
        programRequirements,
        isAnalyzingRequirements,
        fetchRequirements
    } = useAcademicLogic();



    // Secondary tools only
    const eduToolKeys = ['EDU_EXPLORER', 'EDU_GPA'] as const;

    return (
        <SharedPageLayout maxWidth="full" animate={false} className="relative theme-edu" spacing="hero">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl mix-blend-multiply animate-blob" />
                <div className="absolute top-40 right-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <PageHeader
                    variant="simple"
                    title="Education"
                    subtitle="Manage your academic records, track progress, and explore degree opportunities."
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                    {/* Main Tool: Transcript Analysis */}
                    <div className="lg:col-span-8">
                        <EduHero
                            transcript={transcript}
                            calculatedGpa={calculatedGpa}
                            totalCredits={totalCredits}
                            targetCredits={targetCredits}
                            progressPercentage={progressPercentage}
                            onViewChange={setView}
                            handleFileUpload={handleFileUpload}
                            isParsing={isParsing}
                            parseError={parseError}
                        />

                        {transcript && (
                            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                                <ProgramRequirements
                                    requirements={programRequirements}
                                    isAnalyzing={isAnalyzingRequirements}
                                    onAnalyze={fetchRequirements}
                                    programName={transcript.program}
                                />
                            </div>
                        )}
                    </div>

                    {/* Secondary Tools Column */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold text-neutral-400 tracking-tight">Academic Tools</span>
                            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {eduToolKeys.map((key) => {
                                const config = FEATURE_REGISTRY[key];
                                if (!config) return null;

                                const Icon = key === 'EDU_EXPLORER' ? School : Calculator;

                                return (
                                    <BentoCard
                                        key={config.id}
                                        id={config.id}
                                        icon={Icon}
                                        title={config.shortName}
                                        description={config.description.short}
                                        actionLabel={config.action.short}
                                        badge={config.badge || (shouldShowNewBadge(config) ? 'New' : undefined)}
                                        isComingSoon={config.isComingSoon}
                                        onAction={() => setView(config.targetView)}
                                        className="h-full"
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification Modal integration */}
            {tempTranscript && (
                <CourseVerificationModal
                    isOpen={showVerification}
                    onClose={() => setShowVerification(false)}
                    transcript={tempTranscript}
                    onSave={handleVerificationSave}
                />
            )}
        </SharedPageLayout>
    );
};
