import React from 'react';
import { Search, FileDown } from 'lucide-react';
import { UnifiedUploadHero } from '../../../components/common/UnifiedUploadHero';

interface LinkedInExportGuideProps {
    onUpload: (files: File[]) => void;
    onViewSteps: () => void;
    isUploading: boolean;
}

export const LinkedInExportGuide: React.FC<LinkedInExportGuideProps> = ({
    onUpload,
    onViewSteps,
    isUploading
}) => {
    return (
        <div className="animate-in zoom-in-95 duration-500 overflow-hidden relative -mt-8 -mx-4 sm:-mx-6 px-4 sm:px-6 py-12 min-h-[calc(100vh-12rem)]">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 -left-24 w-96 h-96 bg-emerald-500/10 blur-[150px] rounded-full" />
            <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-teal-500/10 blur-[150px] rounded-full" />

            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="max-w-2xl mx-auto text-center mb-8">
                    <p className="text-lg md:text-xl text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
                        Follow these steps to ingest a mentor's profile.
                    </p>
                </div>

                <UnifiedUploadHero
                    title="Analyze"
                    description="Drop their LinkedIn PDF here to begin analyzing their blueprint."
                    onUpload={onUpload}
                    isLoading={isUploading}
                    loadingText="Distilling..."
                    themeColor="emerald"
                    cards={{
                        foundation: {
                            title: "Identify",
                            description: "Find a Mentor or Role Model on LinkedIn whose career path you want to study.",
                            icon: Search,
                            benefits: ['Target Titles', 'Desired Companies', 'Career Path Peaks']
                        },
                        intelligence: {
                            title: "Distill",
                            description: "On their profile, click More → Save to PDF. This captures their full journey.",
                            icon: FileDown,
                            benefits: ['Complete History', 'Role Transitions', 'Skill Evolution'],
                            actionLabel: "See steps",
                            onAction: onViewSteps
                        }
                    }}
                />
            </div>
        </div>
    );
};

