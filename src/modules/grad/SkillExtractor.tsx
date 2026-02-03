import React, { useState } from 'react';
import { Award, Plus, Check, Loader2, Sparkles, Brain, Hammer } from 'lucide-react';
import { extractSkillsFromCourses } from '../../services/geminiService';
import { useToast } from '../../contexts/ToastContext';
import type { Transcript } from '../../types';

interface SkillExtractorProps {
    transcript: Transcript;
    onAddSkills: (skills: Array<{ name: string; proficiency: 'learning' | 'comfortable' | 'expert' }>) => Promise<void>;
}

interface ExtractedSkill {
    name: string;
    category: 'hard' | 'soft';
    proficiency: 'learning' | 'comfortable' | 'expert';
    evidence: string;
    selected: boolean;
}

export const SkillExtractor: React.FC<SkillExtractorProps> = ({ transcript, onAddSkills }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [extractedSkills, setExtractedSkills] = useState<ExtractedSkill[] | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { showError, showSuccess } = useToast();

    const handleExtraction = async () => {
        setIsAnalyzing(true);
        try {
            const result = await extractSkillsFromCourses(transcript);
            setExtractedSkills(result.map(r => ({ ...r, selected: true })));
        } catch (err: any) {
            showError(err.message || 'Failed to extract skills');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const toggleSkill = (index: number) => {
        if (!extractedSkills) return;
        const updated = [...extractedSkills];
        updated[index].selected = !updated[index].selected;
        setExtractedSkills(updated);
    };

    const handleSave = async () => {
        if (!extractedSkills) return;
        const toAdd = extractedSkills.filter(s => s.selected);
        if (toAdd.length === 0) return;

        setIsSaving(true);
        try {
            await onAddSkills(toAdd.map(({ name, proficiency }) => ({ name, proficiency })));
            showSuccess(`Added ${toAdd.length} new skills obtained from your courses!`);
            setExtractedSkills(null); // Reset
        } catch (err) {
            showError('Failed to save skills');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Skill Extraction</h3>
                        <p className="text-sm text-slate-500">Convert your coursework into job-ready skills.</p>
                    </div>
                </div>
            </div>

            {!extractedSkills ? (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 text-sm mb-4">
                        We'll analyze <strong>{transcript.semesters.reduce((acc, s) => acc + s.courses.length, 0)} courses</strong> to find technical and soft skills.
                    </p>
                    <button
                        onClick={handleExtraction}
                        disabled={isAnalyzing}
                        className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2 mx-auto disabled:opacity-50"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Mining Transcript...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Extract Skills
                            </>
                        )}
                    </button>
                    {isAnalyzing && <p className="text-xs text-slate-400 mt-3 animate-pulse">This might take a moment...</p>}
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">Found {extractedSkills.length} Skills</div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || extractedSkills.filter(s => s.selected).length === 0}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Add Selected
                        </button>
                    </div>

                    {/* Hard Skills */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Hammer className="w-3 h-3" /> Hard Skills
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            {extractedSkills.map((skill, idx) => (
                                skill.category === 'hard' && (
                                    <SkillCard key={idx} skill={skill} idx={idx} toggleSkill={toggleSkill} />
                                )
                            ))}
                        </div>
                    </div>

                    {/* Soft Skills */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Brain className="w-3 h-3" /> Soft Skills
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {extractedSkills.map((skill, idx) => (
                                skill.category !== 'hard' && (
                                    <SkillCard key={idx} skill={skill} idx={idx} toggleSkill={toggleSkill} />
                                )
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SkillCard: React.FC<{ skill: ExtractedSkill; idx: number; toggleSkill: (i: number) => void }> = ({ skill, idx, toggleSkill }) => (
    <div
        onClick={() => toggleSkill(idx)}
        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 group relative ${skill.selected
                ? 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
            }`}
    >
        <div className={`w-5 h-5 rounded flex items-center justify-center border mt-0.5 transition-colors ${skill.selected
                ? 'bg-violet-500 border-violet-500 text-white'
                : 'border-slate-300 dark:border-slate-600'
            }`}>
            {skill.selected && <Check className="w-3 h-3" />}
        </div>

        <div>
            <div className="font-bold text-slate-900 dark:text-white text-sm">{skill.name}</div>
            <div className="flex items-center gap-2 text-xs mt-1">
                <span className={`px-1.5 py-0.5 rounded uppercase tracking-wider font-bold text-[9px] ${skill.proficiency === 'expert' ? 'bg-emerald-100 text-emerald-700' :
                        skill.proficiency === 'comfortable' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                    }`}>
                    {skill.proficiency}
                </span>
                <span className="text-slate-400 truncate max-w-[150px]">{skill.evidence}</span>
            </div>
        </div>
    </div>
);
