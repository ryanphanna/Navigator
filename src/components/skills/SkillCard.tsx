import React from 'react';
import { Trash2, Check } from 'lucide-react';
import type { CustomSkill } from '../../types';

interface SkillCardProps {
    skill: CustomSkill;
    onDelete: (name: string) => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill, onDelete }) => {

    return (
        <div
            className="group flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-accent-primary-hex/50 hover:shadow-sm transition-all duration-300 relative"
        >
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 tracking-tight whitespace-nowrap">
                    {skill.name}
                </span>

                {skill.evidence && (
                    <span className="flex-shrink-0" title="Verified Skill">
                        <Check className="w-3.5 h-3.5 text-accent-primary-hex stroke-[3]" />
                    </span>
                )}

                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${skill.proficiency === 'expert' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' :
                    skill.proficiency === 'comfortable' ? 'bg-accent-primary-hex' :
                        'bg-neutral-300 dark:bg-neutral-700'
                    }`} title={skill.proficiency} />
            </div>

            {/* Hover Delete Action */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(skill.name);
                }}
                className="w-0 group-hover:w-6 overflow-hidden transition-all duration-300 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 flex items-center justify-center -mr-1"
                title="Delete skill"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};
