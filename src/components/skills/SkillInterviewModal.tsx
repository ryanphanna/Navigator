import React, { useState, useEffect } from 'react';
import type { CustomSkill } from '../../types';
import { getSkillVerificationQuestions } from '../../services/skillQuestionsService';
import {
    X,
    ShieldCheck, CheckCircle2, ChevronRight, Zap, Plus
} from 'lucide-react';

interface SkillInterviewModalProps {
    skillName: string;
    onComplete: (proficiency: CustomSkill['proficiency'], evidence: string) => void;
    onClose: () => void;
    showValidation?: boolean;
}

export const SkillInterviewModal: React.FC<SkillInterviewModalProps> = ({ skillName, onComplete, onClose, showValidation = false }) => {
    const [step, setStep] = useState<'select' | 'confirm'>('select');
    const [selectedLevel, setSelectedLevel] = useState<CustomSkill['proficiency'] | null>(null);
    const [showOptionalInput, setShowOptionalInput] = useState(false);
    const [optionalContext, setOptionalContext] = useState('');
    const [verificationQuestions, setVerificationQuestions] = useState<string[]>([]);
    const [checkedQuestions, setCheckedQuestions] = useState<Set<number>>(new Set());
    const [loadingQuestions, setLoadingQuestions] = useState(false);

    // Load questions when moving to confirm step IF validation is shown
    useEffect(() => {
        if (step === 'confirm' && showValidation && verificationQuestions.length === 0) {
            loadQuestions();
        }
    }, [step, showValidation]);

    const loadQuestions = async () => {
        if (!selectedLevel) return;

        setLoadingQuestions(true);
        try {
            const questions = await getSkillVerificationQuestions(skillName, selectedLevel);
            setVerificationQuestions(questions);
        } catch (error) {
            console.error('Failed to load verification questions:', error);
            setVerificationQuestions([]);
        } finally {
            setLoadingQuestions(false);
        }
    };

    const toggleQuestion = (index: number) => {
        const newChecked = new Set(checkedQuestions);
        if (newChecked.has(index)) {
            newChecked.delete(index);
        } else {
            newChecked.add(index);
        }
        setCheckedQuestions(newChecked);
    };

    const handleLevelSelect = (level: CustomSkill['proficiency']) => {
        setSelectedLevel(level);
        setStep('confirm');
    };

    const handleConfirm = () => {
        if (!selectedLevel) return;

        const evidenceParts: string[] = [];

        if (checkedQuestions.size > 0) {
            const checkedStatements = Array.from(checkedQuestions)
                .map(idx => verificationQuestions[idx])
                .filter(Boolean);
            evidenceParts.push(...checkedStatements);
        }

        if (optionalContext.trim()) {
            evidenceParts.push(optionalContext.trim());
        }

        let evidence = evidenceParts.length > 0
            ? evidenceParts.join('. ')
            : `${selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} level proficiency in ${skillName}`;

        onComplete(selectedLevel, evidence);
    };

    const getProficiencyDescription = (level: CustomSkill['proficiency']) => {
        const descriptions = {
            'learning': 'Still building familiarity, may need guidance',
            'comfortable': 'Can work independently with this skill',
            'expert': 'Deep expertise, can mentor others'
        };
        return descriptions[level];
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-lg overflow-hidden flex flex-col rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in zoom-in-95 duration-300 max-h-[90vh]">

                {/* Compact Header */}
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-neutral-900 dark:text-white leading-none mb-0.5">
                                {skillName}
                            </h3>
                            <p className="text-xs font-bold text-neutral-400">
                                {step === 'select' ? 'Add Competency' : `Verify ${selectedLevel ? selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1) : ''}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {step === 'select' ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="text-center mb-6">
                                <h4 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
                                    Assess your level
                                </h4>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium px-8">
                                    Select the level that best matches your current capabilities.
                                </p>
                            </div>

                            <div className="grid gap-3">
                                {(['learning', 'comfortable', 'expert'] as const).map((level, idx) => {
                                    const icons = [
                                        { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', count: 1 },
                                        { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', count: 2 },
                                        { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', count: 3 }
                                    ];
                                    const config = icons[idx];
                                    // Manually capitalize for display
                                    const titleCaseLevel = level.charAt(0).toUpperCase() + level.slice(1);

                                    return (
                                        <button
                                            key={level}
                                            onClick={() => handleLevelSelect(level)}
                                            className="group p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-indigo-600 dark:hover:border-indigo-500 transition-all hover:shadow-md hover:scale-[1.01] text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 ${config.bg} rounded-xl group-hover:scale-105 transition-transform`}>
                                                    <div className="flex gap-0.5">
                                                        {Array.from({ length: config.count }).map((_, i) => (
                                                            <div key={i} className={`w-1 h-3.5 ${config.text} bg-current rounded-full`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-black text-neutral-900 dark:text-white mb-0.5">
                                                        {titleCaseLevel}
                                                    </div>
                                                    <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                                        {getProficiencyDescription(level)}
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                            {/* Validation Questions - Only if Enabled */}
                            {showValidation ? (
                                <div>
                                    <h3 className="text-xs font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                                        Quick Validation
                                    </h3>

                                    {loadingQuestions ? (
                                        <div className="space-y-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
                                            ))}
                                        </div>
                                    ) : verificationQuestions.length > 0 ? (
                                        <div className="space-y-2">
                                            {verificationQuestions.map((question, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => toggleQuestion(idx)}
                                                    className={`w-full text-left p-3 rounded-xl border transition-all ${checkedQuestions.has(idx)
                                                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20'
                                                        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-indigo-400'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${checkedQuestions.has(idx)
                                                            ? 'border-indigo-600 bg-indigo-600'
                                                            : 'border-neutral-300 dark:border-neutral-500'
                                                            }`}>
                                                            {checkedQuestions.has(idx) && (
                                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                                            )}
                                                        </div>
                                                        <span className={`text-sm leading-snug ${checkedQuestions.has(idx)
                                                            ? 'text-indigo-900 dark:text-indigo-200 font-medium'
                                                            : 'text-neutral-600 dark:text-neutral-300'
                                                            }`}>
                                                            {question}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700">
                                            <p className="text-xs text-neutral-400">No specific validation questions available.</p>
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {/* Optional Context - Collapsed by default */}
                            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
                                {showOptionalInput ? (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                                                Additional Context
                                            </label>
                                            <button
                                                onClick={() => setShowOptionalInput(false)}
                                                className="text-[10px] font-bold text-neutral-400 hover:text-neutral-600 uppercase"
                                            >
                                                Hide
                                            </button>
                                        </div>
                                        <textarea
                                            value={optionalContext}
                                            onChange={(e) => setOptionalContext(e.target.value)}
                                            placeholder="Projects, years of experience, or specific tools..."
                                            className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all resize-none"
                                            rows={2}
                                            autoFocus
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowOptionalInput(true)}
                                        className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Context / Notes
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex gap-3">
                    {step === 'select' ? (
                        <button
                            onClick={onClose}
                            className="w-full py-3 text-sm font-bold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                        >
                            Cancel
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setStep('select');
                                    setSelectedLevel(null);
                                    setShowOptionalInput(false);
                                    setOptionalContext('');
                                }}
                                className="px-6 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold text-sm hover:bg-white dark:hover:bg-neutral-800 transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Save
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
