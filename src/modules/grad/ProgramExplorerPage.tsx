import React from 'react';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { MAEligibility } from './MAEligibility';
import { SkillExtractor } from './SkillExtractor';
import { ProgramExplorer } from './components/ProgramExplorer';
import { GraduationCap, Zap } from 'lucide-react';


import { useSkillContext } from '../skills/context/SkillContext';
import { Storage } from '../../services/storageService';
import { useToast } from '../../contexts/ToastContext';
import { AcademicHero } from './components/AcademicHero';
import { useAcademicLogic } from './hooks/useAcademicLogic';

export const ProgramExplorerPage: React.FC = () => {
    const { updateSkills } = useSkillContext();
    const {
        transcript,
        handleFileUpload,
        isParsing,
        parseError,
        tempTranscript,
        showVerification,
        setShowVerification,
        handleVerificationSave
    } = useAcademicLogic();
    const [selectedProgram, setSelectedProgram] = React.useState<string | undefined>();
    useToast();

    const handleAddSkills = async (newSkills: Array<{ name: string; category?: 'hard' | 'soft'; proficiency: 'learning' | 'comfortable' | 'expert'; evidence?: string }>) => {
        try {
            // 1. Save all skills to storage
            await Promise.all(newSkills.map(skill =>
                Storage.saveSkill({
                    name: skill.name,
                    category: skill.category,
                    proficiency: skill.proficiency,
                    evidence: skill.evidence
                })
            ));

            // 2. Refresh skills from storage to get full objects with IDs
            const updatedSkills = await Storage.getSkills();

            // 3. Update context
            updateSkills(updatedSkills);

        } catch (error) {
            console.error('Failed to save skills:', error);
            throw error; // Re-throw to let SkillExtractor handle the error state
        }
    };

    return (
        <SharedPageLayout maxWidth="full" className="relative theme-edu" spacing="compact">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">

                    <PageHeader
                        variant="hero"
                        title="Program Explorer"
                        subtitle="Explore master's degrees and check your eligibility for top programs."
                    />
                </div>

                {transcript ? (
                    <div className="space-y-12">
                        {/* 1. Discovery Backbone */}
                        <ProgramExplorer
                            onSelect={(p) => {
                                setSelectedProgram(`${p.institution} - ${p.name}`);
                                // Scroll to analyzer
                                document.getElementById('program-analyzer')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        />

                        {/* 2. Deep Analysis & Extraction (Grounded Analysis) */}
                        <div id="program-analyzer" className="grid grid-cols-1 lg:grid-cols-2 gap-8 scroll-mt-20">
                            <MAEligibility transcript={transcript} initialProgram={selectedProgram} />
                            <SkillExtractor transcript={transcript} onAddSkills={handleAddSkills} />
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <AcademicHero
                            title="Ready to Explore?"
                            description="Upload your transcript to see which top programs you're eligible for."
                            handleFileUpload={handleFileUpload}
                            isParsing={isParsing}
                            parseError={parseError}
                            tempTranscript={tempTranscript}
                            showVerification={showVerification}
                            setShowVerification={setShowVerification}
                            handleVerificationSave={handleVerificationSave}
                            cards={{
                                foundation: {
                                    title: "Smart Discovery",
                                    description: "Stop searching and start discovering. We match your academic background against thousands of top-tier degree programs.",
                                    icon: GraduationCap,
                                    benefits: ['Instant Program Matching', 'Requirement Mapping', 'Automatic Eligibility']
                                },
                                intelligence: {
                                    title: "Match Logic",
                                    description: "See exactly why you're a fit for a program, from credit requirements to skill-based eligibility mapping.",
                                    icon: Zap,
                                    benefits: ['Credit Transfer Gap', 'Skill Alignment', 'Course Prerequisites']
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        </SharedPageLayout>
    );
};
