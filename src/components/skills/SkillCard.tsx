import React from 'react';
import { Trash2, Check } from 'lucide-react';
import type { CustomSkill } from '../../types';
import { Card } from '../ui/Card';

interface SkillCardProps {
    skill: CustomSkill;
    onDelete: (name: string) => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill, onDelete }) => {
    const getProficiencyStyle = (level: string) => {
        switch (level) {
            case 'expert': return 'bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200/50 dark:border-amber-500/20';
            case 'comfortable': return 'bg-accent-primary/5 text-accent-primary-hex dark:bg-accent-primary/10 dark:text-accent-primary-hex border-accent-primary/20 dark:border-accent-primary/20';
            default: return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-500/10 dark:text-neutral-400 border-neutral-200/50 dark:border-neutral-800';
        }
    };

    return (
        <Card
            variant="glass"
            glow
            className="group border-accent-primary/10 hover:border-accent-primary/30 h-full"
        >
            <div className="p-6 h-full flex flex-col">
                <div className="flex items-start justify-between gap-4">
                    {/* Skill Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-neutral-900 dark:text-white group-hover:text-accent-primary-hex transition-colors break-words tracking-tight">
                            {skill.name}
                            {skill.evidence && (
                                <span className="inline-flex items-center ml-1.5 align-middle" title="Verified Skill">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-accent-primary/10 border border-accent-primary/20">
                                        <Check className="w-3 h-3 text-accent-primary-hex stroke-[3]" />
                                    </span>
                                </span>
                            )}
                        </h3>

                        {skill.description && (
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1.5 mb-3 line-clamp-2 group-hover:line-clamp-none transition-all duration-300 leading-relaxed">
                                {skill.description}
                            </p>
                        )}

                        <div className="mt-auto pt-3">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getProficiencyStyle(skill.proficiency)}`}>
                                {skill.proficiency}
                            </span>
                        </div>
                    </div>

                    {/* Delete Action */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(skill.name);
                        }}
                        className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-900/40 text-neutral-400 hover:text-red-500 rounded-xl transition-all shadow-sm active:scale-95 shrink-0 opacity-0 group-hover:opacity-100"
                        title="Delete skill"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </Card>
    );
};
