import React from 'react';
import { Plus } from 'lucide-react';

interface SkillSuggestionsProps {
    suggestions: Array<{ name: string; description: string }>;
    onAddSuggestion: (name: string, description?: string) => void;
    onClear: () => void;
}

export const SkillSuggestions: React.FC<SkillSuggestionsProps> = ({ suggestions, onAddSuggestion }) => {
    if (suggestions.length === 0) return null;

    return (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-4 px-1">
                <h2 className="text-xs font-bold text-neutral-400 tracking-wide">Recommended additions</h2>
                <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {suggestions.map((skill, i) => (
                    <button
                        key={i}
                        onClick={() => onAddSuggestion(skill.name, skill.description)}
                        className="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500 transition-all shadow-sm"
                        title={skill.description}
                    >
                        <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">{skill.name}</span>
                        <Plus className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-600" />
                    </button>
                ))}
            </div>
        </div>
    );
};
