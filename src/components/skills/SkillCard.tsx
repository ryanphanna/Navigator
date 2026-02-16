import React from 'react';
import { Trash2, Sparkles } from 'lucide-react';
import type { UserTier } from '../../types/app';
import type { CustomSkill } from '../../types';

interface SkillCardProps {
    skill: CustomSkill;
    onDelete: (name: string) => void;
    onVerify: (name: string) => void;
    userTier: UserTier;
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill, onDelete, onVerify, userTier }) => {
    const getProficiencyStyle = (level: string) => {
        switch (level) {
            case 'expert': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
            case 'comfortable': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            default: return 'bg-neutral-50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
        }
    };

    const getProficiencyIcon = (level: string) => {
        switch (level) {
            case 'expert': return '⭐';
            case 'comfortable': return '✓';
            default: return '○';
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 group">
            <div className="flex items-center gap-4">
                {/* Proficiency Icon */}
                <div className={`w-12 h-12 rounded-xl ${getProficiencyStyle(skill.proficiency)} border flex items-center justify-center text-2xl flex-shrink-0`}>
                    {getProficiencyIcon(skill.proficiency)}
                </div>

                {/* Skill Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white truncate">
                        {skill.name}
                    </h3>
                    {skill.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 mb-1 line-clamp-1">
                            {skill.description}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getProficiencyStyle(skill.proficiency)}`}>
                            {skill.proficiency}
                        </span>
                        {skill.evidence && (
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                                ✓ Verified
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {(userTier === 'admin' || userTier === 'tester') && (
                        <button
                            onClick={() => onVerify(skill.name)}
                            className="p-2.5 bg-neutral-50 dark:bg-neutral-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
                            title={skill.evidence ? 'Re-verify proficiency' : 'Verify with AI'}
                        >
                            <Sparkles className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(skill.name)}
                        className="p-2.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                        title="Delete skill"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
