import React, { useState } from 'react';
import type { CustomSkill, ResumeProfile } from '../../types';
import { Storage } from '../../services/storageService';
import { Zap, Search } from 'lucide-react';
import { suggestSkillsFromResumes } from '../../services/geminiService';
import { useToast } from '../../contexts/ToastContext';
import { SkillCard } from './SkillCard';
import { SkillsStats } from './SkillsStats';
import { AddSkillModal } from './AddSkillModal';
import { SkillSuggestions } from './SkillSuggestions';
import { PageLayout } from '../common/PageLayout';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../constants';

interface SkillsViewProps {
    skills: CustomSkill[];
    resumes: ResumeProfile[];
    onSkillsUpdated: (skills: CustomSkill[]) => void;
    onStartUnifiedInterview: (skills: { name: string; proficiency: string }[]) => void;
}

export const SkillsView: React.FC<SkillsViewProps> = ({ skills, resumes, onSkillsUpdated, onStartUnifiedInterview }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Persist suggestions in LocalStorage so they don't vanish on unmount/reload
    const [suggestions, setSuggestions] = useLocalStorage<Array<{ name: string; description: string }>>(
        STORAGE_KEYS.SKILL_SUGGESTIONS,
        []
    );
    const [isSuggesting, setIsSuggesting] = useState(false);
    const { showSuccess } = useToast();

    // Dynamically filter suggestions: Include only those NOT in current skills
    const displayedSuggestions = suggestions.filter(s =>
        !skills.some(existing => existing.name.toLowerCase() === s.name.toLowerCase())
    );

    // Skills that haven't been verified yet
    const unverifiedSkills = skills.filter(s => !s.evidence);

    const handleAddSkill = async (newSkillName: string) => {
        if (!newSkillName.trim()) return;

        try {
            const newSkill = await Storage.saveSkill({
                name: newSkillName.trim(),
                proficiency: 'learning'
            });
            onSkillsUpdated([...skills, newSkill]);
            setIsAdding(false);
        } catch (err) {
            console.error("Add Skill Failed", err);
        }
    };

    const handleDeleteSkill = async (name: string) => {
        await Storage.deleteSkill(name);
        onSkillsUpdated(skills.filter(s => s.name !== name));
        showSuccess(`Removed ${name}`);
    };

    const [filter, setFilter] = useState<'all' | 'learning' | 'comfortable' | 'expert'>('all');
    const [visibleCount, setVisibleCount] = useState(12);

    const filteredSkills = skills.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || s.proficiency === filter;
        return matchesSearch && matchesFilter;
    });

    const visibleSkills = filteredSkills.slice(0, visibleCount);
    const hasMore = filteredSkills.length > visibleCount;

    const handleSuggestSkills = async () => {
        setIsSuggesting(true);
        try {
            const rawSuggestions = await suggestSkillsFromResumes(resumes);
            setSuggestions(rawSuggestions);
        } catch (err) {
            console.error("Suggestion Failed", err);
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleAddSuggestedSkill = async (name: string, description?: string) => {
        try {
            const newSkill = await Storage.saveSkill({
                name,
                proficiency: 'learning',
                description
            });
            onSkillsUpdated([...skills, newSkill]);
        } catch (err) {
            console.error("Add Suggested Skill Failed", err);
        }
    };

    const handleStartVerification = () => {
        const skillsToVerify = unverifiedSkills.map(s => ({
            name: s.name,
            proficiency: s.proficiency,
        }));
        onStartUnifiedInterview(skillsToVerify);
    };

    return (
        <PageLayout
            themeColor="emerald"
        >
            {/* Quick Stats */}
            <SkillsStats
                skills={skills}
                onSuggestSkills={handleSuggestSkills}
                isSuggesting={isSuggesting}
                onAddSkill={() => setIsAdding(true)}
                onVerifySkills={handleStartVerification}
                unverifiedCount={unverifiedSkills.length}
            />

            {/* Suggestions Area */}
            <SkillSuggestions
                suggestions={displayedSuggestions}
                onAddSuggestion={handleAddSuggestedSkill}
                onClear={() => setSuggestions([])}
            />

            {/* Filter & Search */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search your skills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 py-5 pl-14 pr-6 rounded-[2rem] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full md:w-auto overflow-x-auto whitespace-nowrap">
                    {(['all', 'learning', 'comfortable', 'expert'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setFilter(p)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${filter === p
                                ? 'bg-white dark:bg-neutral-800 text-emerald-600 shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                }`}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Skills Grid */}
            {filteredSkills.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                        {visibleSkills.map((skill) => (
                            <SkillCard
                                key={skill.id}
                                skill={skill}
                                onDelete={handleDeleteSkill}
                            />
                        ))}
                    </div>

                    {hasMore && (
                        <div className="flex justify-center pb-20">
                            <button
                                onClick={() => setVisibleCount(prev => prev + 12)}
                                className="px-8 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-neutral-600 dark:text-neutral-300 font-bold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all shadow-sm active:scale-95"
                            >
                                Show More Skills ({filteredSkills.length - visibleCount} remaining)
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-32 bg-neutral-50 dark:bg-neutral-900/50 rounded-[3rem] border-2 border-dashed border-neutral-200 dark:border-neutral-800">
                    <div className="w-20 h-20 bg-white dark:bg-neutral-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Zap className="w-10 h-10 text-neutral-200" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">Your skills list is empty</h3>
                    <p className="text-sm text-neutral-400 mt-2 font-medium">Start adding skills to analyze gaps</p>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="mt-8 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                    >
                        Add your first skill
                    </button>
                </div>
            )}

            {/* Add Skill Modal Overlay */}
            <AddSkillModal
                isOpen={isAdding}
                onAdd={handleAddSkill}
                onClose={() => setIsAdding(false)}
            />
        </PageLayout>
    );
};
