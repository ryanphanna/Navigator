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
                description="Overview of your current technical proficiency."
                color={FEATURE_COLORS.indigo}
                previewContent={
                    <div className="flex items-end gap-6 h-full pb-2 px-2">
                        <div className="flex flex-col items-center">
                            <div className="text-5xl font-black text-white tracking-tighter leading-none hover:scale-110 transition-transform duration-500 drop-shadow-2xl">{skills.length}</div>
                            <div className="text-[9px] uppercase tracking-[0.2em] font-black text-white/40 mt-3">Active</div>
                        </div>
                        <div className="w-px h-10 bg-gradient-to-b from-white/0 via-white/20 to-white/0" />
                        <div className="flex flex-col items-center">
                            <div className="text-5xl font-black text-amber-400 tracking-tighter leading-none hover:scale-110 transition-transform duration-500 drop-shadow-2xl">
                                {skills.filter(s => s.proficiency === 'expert').length}
                            </div>
                            <div className="text-[9px] uppercase tracking-[0.2em] font-black text-white/40 mt-3">Expert</div>
                        </div>
                    </div>
                }
            />

            {/* Action: Add Skill */}
            <BentoCard
                id="add-skill"
                icon={Plus}
                title="Add Skill"
                description="Manually expand your skill tracking."
                onAction={onAddSkill}
                actionLabel="Add New"
                color={FEATURE_COLORS.emerald}
                previewContent={
                    <div className="relative w-full h-12 flex items-center justify-center">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full scale-150 group-hover:scale-125 transition-transform duration-1000" />
                        <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                            <Plus className="w-6 h-6 text-emerald-500" />
                        </div>
                    </div>
                }
            />

            {/* Action: Verify Skills (Conditional) */}
            <BentoCard
                id="verify-skills"
                icon={ShieldCheck}
                title="Verify Skills"
                description={unverifiedCount > 0 ? `Prove expertise for ${unverifiedCount} skills.` : "All skills verified by AI coach."}
                onAction={onVerifySkills}
                actionLabel={unverifiedCount > 0 ? "Start Proof" : undefined}
                color={FEATURE_COLORS.amber}
                previewContent={
                    <div className="relative w-full h-12 flex items-center justify-center">
                        <ShieldCheck className={`w-10 h-10 ${unverifiedCount > 0 ? 'text-amber-500 animate-pulse' : 'text-neutral-300 dark:text-neutral-700'}`} />
                        {unverifiedCount > 0 && (
                            <div className="absolute top-0 right-1/3 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        )}
                    </div>
                }
            />

            {/* Action: Skill Discovery */}
            <BentoCard
                id="skill-discovery"
                icon={Sparkles}
                title="Skill Discovery"
                description="Extract latent skills from your resumes."
                onAction={onSuggestSkills}
                actionLabel={isSuggesting ? "Finding..." : "Discover"}
                color={FEATURE_COLORS.violet}
                previewContent={
                    <div className="relative w-full h-12 flex items-center justify-center">
                        <div className="absolute inset-0 bg-violet-500/10 blur-2xl rounded-full scale-150 animate-pulse" />
                        <Sparkles className={`w-10 h-10 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] ${isSuggesting ? 'animate-spin' : 'animate-bounce duration-[3000ms]'}`} />
                    </div>
                }
            />
        </div>
    );
};
