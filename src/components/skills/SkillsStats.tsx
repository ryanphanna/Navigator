import React from 'react';
import { Sparkles } from 'lucide-react';
import type { CustomSkill, ResumeProfile } from '../../types';

interface SkillsStatsProps {
    skills: CustomSkill[];
    resumes: ResumeProfile[];
    onSuggestSkills: () => void;
    isSuggesting: boolean;
}

export const SkillsStats: React.FC<SkillsStatsProps> = ({ skills, resumes, onSuggestSkills, isSuggesting }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="text-3xl font-black text-indigo-600">{skills.length}</div>
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">Total Skills</div>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="text-3xl font-black text-emerald-500">
                    {skills.filter(s => s.proficiency === 'expert').length}
                </div>
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">Expert Level</div>
            </div>
            <div className="bg-violet-50/50 dark:bg-violet-500/5 backdrop-blur-xl p-6 rounded-[2rem] border border-violet-500/10 dark:border-violet-500/20 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">Skill Discovery</span>
                    </div>
                    <p className="text-sm font-medium leading-snug mb-4 text-neutral-600 dark:text-neutral-300">
                        Let AI find missing skills from your resumes.
                    </p>
                </div>
                <button
                    onClick={onSuggestSkills}
                    disabled={isSuggesting || resumes.length === 0}
                    className="relative z-10 bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all text-xs font-black uppercase tracking-widest py-3 px-4 rounded-xl text-white flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isSuggesting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Find Skills
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
