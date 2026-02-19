import React from 'react';
import { Sparkles, Plus, ShieldCheck, TrendingUp } from 'lucide-react';
import type { CustomSkill } from '../../types';
import { BentoCard } from '../ui/BentoCard';
import { FEATURE_COLORS } from '../../featureRegistry';

interface SkillsStatsProps {
    skills: CustomSkill[];
    onSuggestSkills: () => void;
    isSuggesting: boolean;
    onAddSkill: () => void;
    onVerifySkills?: () => void;
    unverifiedCount?: number;
}

export const SkillsStats: React.FC<SkillsStatsProps> = ({
    skills,
    onSuggestSkills,
    isSuggesting,
    onAddSkill,
    onVerifySkills,
    unverifiedCount = 0
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {/* Stat: Skill Analytics */}
            <BentoCard
                id="skill-stats"
                icon={TrendingUp}
                title="Skill Analytics"
                description="Your current proficiency and tracking overview."
                color={FEATURE_COLORS.indigo}
                className="theme-job"
                previewContent={
                    <div className="flex items-end gap-6 h-full pb-2">
                        <div className="flex flex-col items-center">
                            <div className="text-4xl font-black text-white tracking-tighter leading-none hover:scale-110 transition-transform duration-300">{skills.length}</div>
                            <div className="text-[8px] uppercase tracking-widest font-black text-white/50 mt-2">Total</div>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col items-center">
                            <div className="text-4xl font-black text-amber-400 tracking-tighter leading-none hover:scale-110 transition-transform duration-300">
                                {skills.filter(s => s.proficiency === 'expert').length}
                            </div>
                            <div className="text-[8px] uppercase tracking-widest font-black text-white/50 mt-2">Expert</div>
                        </div>
                    </div>
                }
            />

            {/* Action: Add Skill */}
            <BentoCard
                id="add-skill"
                icon={Plus}
                title="Add Skill"
                description="Manually add a new skill to track."
                onAction={onAddSkill}
                actionLabel="Add New"
                className="theme-coach"
            />

            {/* Action: Verify Skills (Conditional) */}
            {unverifiedCount > 0 && (
                <BentoCard
                    id="verify-skills"
                    icon={ShieldCheck}
                    title="Verify Skills"
                    description={`Verify ${unverifiedCount} skills with AI.`}
                    onAction={onVerifySkills}
                    actionLabel="Start Proof"
                    className="theme-job"
                />
            )}

            {/* Action: Skill Discovery */}
            <BentoCard
                id="skill-discovery"
                icon={Sparkles}
                title="Skill Discovery"
                description="Find skills from your resumes."
                onAction={onSuggestSkills}
                actionLabel={isSuggesting ? "Finding..." : "Discover"}
                className="theme-edu"
                previewContent={
                    <div className="relative w-full h-full flex items-center justify-center">
                        <Sparkles className={`w-8 h-8 text-amber-500 ${isSuggesting ? 'animate-pulse' : ''}`} />
                    </div>
                }
            />
        </div>
    );
};
