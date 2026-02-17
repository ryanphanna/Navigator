import React, { useState } from 'react';
import type { CustomSkill, ResumeProfile } from '../../types';
import type { UserTier } from '../../types/app';
import { Storage } from '../../services/storageService';
import { Target, Zap, Plus, Search } from 'lucide-react';
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
    onStartInterview: (skillName: string) => void;
    userTier: UserTier;
}

export const SkillsView: React.FC<SkillsViewProps> = ({ skills, resumes, onSkillsUpdated, onStartInterview, userTier }) => {
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

    const handleAddSkill = async (newSkillName: string) => {
        if (!newSkillName.trim()) return;

        try {
            const newSkill = await Storage.saveSkill({
                name: newSkillName.trim(),
                proficiency: 'learning'
            });
            onSkillsUpdated([...skills, newSkill]);
            setIsAdding(false);

            // Auto-trigger interview for new skill
            onStartInterview(newSkill.name);
        } catch (err) {
            console.error("Add Skill Failed", err);
        }
    };

    const handleDeleteSkill = async (name: string) => {
        await Storage.deleteSkill(name);
        onSkillsUpdated(skills.filter(s => s.name !== name));
        showSuccess(`Removed ${name}`);
    };

    const [visibleCount, setVisibleCount] = useState(12);

    const filteredSkills = skills.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const visibleSkills = filteredSkills.slice(0, visibleCount);
    const hasMore = filteredSkills.length > visibleCount;

    const handleSuggestSkills = async () => {
        setIsSuggesting(true);
        try {
            const rawSuggestions = await suggestSkillsFromResumes(resumes);
            // We just store all raw suggestions. The filtering against existing skills happens in render.
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
            // No need to manually filter suggestions - 'displayedSuggestions' will automatically update
            // because 'skills' prop will change.
            onStartInterview(newSkill.name);
        } catch (err) {
            console.error("Add Suggested Skill Failed", err);
        }
    };

    const headerActions = (
        <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
        >
            <Plus className="w-5 h-5" />
            Add Skill
        </button>
    );

    return (
        <PageLayout
            title="Your Skills"
            description="Track your skills, verify proficiency, and propel your growth."
            icon={<Target />}
            themeColor="indigo"
            actions={headerActions}
        >
            {/* Quick Stats */}
            <SkillsStats
                skills={skills}
                resumes={resumes}
                onSuggestSkills={handleSuggestSkills}
                isSuggesting={isSuggesting}
            />

            {/* Suggestions Area */}
            <SkillSuggestions
                suggestions={displayedSuggestions}
                onAddSuggestion={handleAddSuggestedSkill}
                onClear={() => setSuggestions([])}
            />

            {/* Filter & Search */}
            <div className="relative mb-8 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                    type="text"
                    placeholder="Search your skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 py-5 pl-14 pr-6 rounded-[2rem] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-sm"
                />
            </div>

            {/* Skills Grid */}
            {filteredSkills.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12">
                        {visibleSkills.map((skill) => (
                            <SkillCard
                                key={skill.id}
                                skill={skill}
                                onDelete={handleDeleteSkill}
                                onVerify={onStartInterview}
                                userTier={userTier}
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
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight">Your Skills list is Empty</h3>
                    <p className="text-sm text-neutral-400 mt-2 uppercase tracking-widest font-bold">Start adding skills to analyze gaps</p>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="mt-8 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                    >
                        Add Your First Skill
                    </button>
                </div>
            )}

            {/* Add Skill Modal Overlay */}
            <AddSkillModal
                isOpen={isAdding}
                onClose={() => setIsAdding(false)}
                onAdd={handleAddSkill}
            />
        </PageLayout>
    );
};
