import React from 'react';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { Calculator, School } from 'lucide-react';
import { useGlobalUI } from '../../contexts/GlobalUIContext';
import { FEATURE_REGISTRY } from '../../featureRegistry';

import { BentoCard } from '../../components/ui/BentoCard';
import { EduHero } from './components/EduHero';
import { ProgramRequirements } from './components/ProgramRequirements';
import { GradLaunchpad } from './components/GradLaunchpad';
import { PortfolioProposer } from './components/PortfolioProposer';
import { useAcademicLogic } from './hooks/useAcademicLogic';
import { useHeadlines } from '../../hooks/useHeadlines';
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
        handleUploadComplete,
        tempTranscript,
        showVerification,
        setShowVerification,
        handleVerificationSave,
        programRequirements,
        isAnalyzingRequirements,
        fetchRequirements
    } = useAcademicLogic();

    const activeHeadline = useHeadlines('edu');

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
                    variant="hero"
                    title={activeHeadline.text}
                    highlight={activeHeadline.highlight}
                    subtitle="Manage your academic journey, track your progress, and explore new educational opportunities."
                />

                <EduHero
                    transcript={transcript}
                    calculatedGpa={calculatedGpa}
                    totalCredits={totalCredits}
                    targetCredits={targetCredits}
                    progressPercentage={progressPercentage}
                    onViewChange={setView}
                    handleUploadComplete={handleUploadComplete}
                />

                {transcript && (
                    <div className="max-w-4xl mx-auto mb-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        <ProgramRequirements
                            requirements={programRequirements}
                            isAnalyzing={isAnalyzingRequirements}
                            onAnalyze={fetchRequirements}
                            programName={transcript.program}
                        />

                        <GradLaunchpad />

                        <PortfolioProposer transcript={transcript} />
                    </div>
                )}

                {/* Secondary Tools Header */}
                <div className="flex items-center gap-4 mb-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
                    <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Academic Tools</span>
                    <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                </div>

                {/* Tools Grid - Centered secondary tools */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-500 pb-20">
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
                                onAction={() => setView(config.targetView)}
                                className="h-full"
                            />
                        );
                    })}
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
