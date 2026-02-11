import React from 'react';
import { Plus } from 'lucide-react';

interface SkillSuggestionsProps {
    suggestions: Array<{ name: string; description: string }>;
    onAddSuggestion: (name: string, description?: string) => void;
    onClear: () => void;
}

export const SkillSuggestions: React.FC<SkillSuggestionsProps> = ({ suggestions, onAddSuggestion, onClear }) => {
    if (suggestions.length === 0) return null;

    return (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest">Recommended additions</h2>
                    <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">NEW</span>
                </div>
                <button
                    onClick={onClear}
                    className="text-[10px] font-black text-neutral-400 hover:text-neutral-600 uppercase tracking-widest"
                >
                    Clear All
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {suggestions.map((skill, i) => (
                    <button
                        key={i}
                        onClick={() => onAddSuggestion(skill.name, skill.description)}
                        className="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-indigo-600 hover:ring-1 hover:ring-indigo-600 transition-all shadow-sm"
                        title={skill.description} // Show description on hover
                    >
                        <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">{skill.name}</span>
                        <Plus className="w-3.5 h-3.5 text-neutral-400 group-hover:text-indigo-600" />
                    </button>
                ))}
            </div>
        </div>
    );
};
