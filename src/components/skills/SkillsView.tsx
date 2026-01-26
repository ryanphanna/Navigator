import React, { useState } from 'react';
import type { CustomSkill, ResumeProfile } from '../../types';
import { Storage } from '../../services/storageService';
import { Target, Zap, Plus, Search } from 'lucide-react';
import { suggestSkillsFromResumes } from '../../services/geminiService';
import { SkillCard } from './SkillCard';
import { SkillsStats } from './SkillsStats';
import { AddSkillModal } from './AddSkillModal';
import { SkillSuggestions } from './SkillSuggestions';
import { PageLayout } from '../common/PageLayout';

interface SkillsViewProps {
    skills: CustomSkill[];
    resumes: ResumeProfile[];
    onSkillsUpdated: (skills: CustomSkill[]) => void;
    onStartInterview: (skillName: string) => void;
}

export const SkillsView: React.FC<SkillsViewProps> = ({ skills, resumes, onSkillsUpdated, onStartInterview }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);

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
        if (confirm(`Remove ${name} from your Skills?`)) {
            await Storage.deleteSkill(name);
            onSkillsUpdated(skills.filter(s => s.name !== name));
        }
    };

    const filteredSkills = skills.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSuggestSkills = async () => {
        setIsSuggesting(true);
        try {
            const rawSuggestions = await suggestSkillsFromResumes(resumes);
            // Filter out skills already in the vault
            const existingNames = skills.map(s => s.name.toLowerCase());
            const filtered = rawSuggestions.filter(s => !existingNames.includes(s.toLowerCase()));
            setSuggestions(filtered);
        } catch (err) {
            console.error("Suggestion Failed", err);
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleAddSuggestedSkill = async (name: string) => {
        try {
            const newSkill = await Storage.saveSkill({
                name,
                proficiency: 'learning'
            });
            onSkillsUpdated([...skills, newSkill]);
            setSuggestions(prev => prev.filter(s => s !== name));
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
            description="Track your skills, verify proficiency, and close the gap."
            icon={<Target className="w-8 h-8 text-white" />}
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
                suggestions={suggestions}
                onAddSuggestion={handleAddSuggestedSkill}
                onClear={() => setSuggestions([])}
            />

            {/* Filter & Search */}
            <div className="relative mb-8 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                    type="text"
                    placeholder="Search your skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-5 pl-14 pr-6 rounded-[2rem] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-sm"
                />
            </div>

            {/* Skills Grid */}
            {filteredSkills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSkills.map((skill) => (
                        <SkillCard
                            key={skill.id}
                            skill={skill}
                            onDelete={handleDeleteSkill}
                            onVerify={onStartInterview}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-32 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Zap className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Your Skills list is Empty</h3>
                    <p className="text-sm text-slate-400 mt-2 uppercase tracking-widest font-bold">Start adding skills to analyze gaps</p>
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
