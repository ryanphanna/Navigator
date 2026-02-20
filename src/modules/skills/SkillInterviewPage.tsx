import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CustomSkill } from '../../types';
import { generateUnifiedQuestions, analyzeUnifiedResponse } from '../../services/ai/interviewAiService';
import { useSkillContext } from './context/SkillContext';
import { checkInterviewLimit } from '../../services/usageLimits';
import { supabase } from '../../services/supabase';
import {
    ShieldCheck, CheckCircle2, X,
    Send, Sparkles, AlertCircle,
    ArrowLeft, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '../../constants';

type InterviewStep = 'intro' | 'interview' | 'summary';

interface UnifiedQuestion {
    question: string;
    targetSkills: string[];
}

interface InterviewMessage {
    role: 'ai' | 'user';
    content: string;
    overallPassed?: boolean;
    skillResults?: { skill: string; demonstrated: boolean; note: string }[];
}

export const SkillInterviewPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { handleInterviewComplete } = useSkillContext();

    // Accept array of skills from router state
    const skills = (location.state?.skills as { name: string; proficiency: string }[]) || [];

    const [step, setStep] = useState<InterviewStep>('intro');
    const [isLoading, setIsLoading] = useState(false);

    // Interview state
    const [questions, setQuestions] = useState<UnifiedQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [messages, setMessages] = useState<InterviewMessage[]>([]);
    const [limitError, setLimitError] = useState<string | null>(null);

    // Track which skills have been demonstrated across all answers
    const [skillScores, setSkillScores] = useState<Record<string, { demonstrated: number; total: number }>>({});

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (skills.length === 0) {
            navigate('/career/skills');
        }
    }, [skills.length, navigate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isAnalyzing]);

    const handleStart = async () => {
        setIsLoading(true);
        setLimitError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/');
                return;
            }

            const limit = await checkInterviewLimit(user.id);
            if (!limit.allowed) {
                setLimitError(`Monthly assessment limit reached (${limit.used}/${limit.limit}). Upgrade for more sessions.`);
                setIsLoading(false);
                return;
            }

            const qs = await generateUnifiedQuestions(skills);
            setQuestions(qs);
            setStep('interview');

            // Initialize skill scores
            const initialScores: Record<string, { demonstrated: number; total: number }> = {};
            skills.forEach(s => { initialScores[s.name] = { demonstrated: 0, total: 0 }; });
            setSkillScores(initialScores);

            // Add greeting + first question
            setMessages([
                { role: 'ai', content: `Great, let's get started! I'll ask you ${qs.length} questions that cover your skills. Answer naturally — each question may touch on multiple skills at once.` },
            ]);

            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'ai', content: qs[0].question }]);
            }, 800);
        } catch (error) {
            console.error('Failed to generate questions:', error);
            setMessages([{ role: 'ai', content: "Something went wrong generating questions. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!userAnswer.trim() || isAnalyzing) return;

        const currentQ = questions[currentQuestionIndex];
        const answer = userAnswer;
        setUserAnswer('');
        setIsAnalyzing(true);

        setMessages(prev => [...prev, { role: 'user', content: answer }]);

        try {
            const analysis = await analyzeUnifiedResponse(
                currentQ.question,
                currentQ.targetSkills,
                answer
            );

            // Update skill scores
            let updatedScores: Record<string, { demonstrated: number; total: number }> = {};
            setSkillScores(prev => {
                const updated = { ...prev };
                analysis.skillResults.forEach(r => {
                    if (updated[r.skill]) {
                        updated[r.skill] = {
                            demonstrated: updated[r.skill].demonstrated + (r.demonstrated ? 1 : 0),
                            total: updated[r.skill].total + 1,
                        };
                    }
                });
                updatedScores = updated;
                return updated;
            });

            // Add AI feedback
            setMessages(prev => [...prev, {
                role: 'ai',
                content: analysis.feedback,
                overallPassed: analysis.overallPassed,
                skillResults: analysis.skillResults,
            }]);

            // Live Persistence: Save skills that are currently verified
            analysis.skillResults.forEach(r => {
                const score = updatedScores[r.skill];
                // Require at least 3 questions for a skill to be "Auto-verified" mid-session
                // This ensures we have a representative sample before saving.
                if (score && score.total >= 3 && (score.demonstrated / score.total) >= 0.5) {
                    const evidence = `Verified via unified AI interview. Demonstrated in ${score.demonstrated}/${score.total} questions.`;
                    const skill = skills.find(s => s.name === r.skill);
                    const proficiency = (skill?.proficiency || 'learning') as CustomSkill['proficiency'];
                    handleInterviewComplete(proficiency, evidence, r.skill);
                }
            });

            // Next question or finish
            if (currentQuestionIndex < questions.length - 1) {
                const nextIdx = currentQuestionIndex + 1;
                setCurrentQuestionIndex(nextIdx);
                setTimeout(() => {
                    setMessages(prev => [...prev, { role: 'ai', content: questions[nextIdx].question }]);
                    setIsAnalyzing(false);
                }, 1200);
            } else {
                setTimeout(() => {
                    setStep('summary');
                    setIsAnalyzing(false);
                }, 1200);
            }
        } catch (error) {
            console.error('Analysis failed:', error);
            setIsAnalyzing(false);
            if (currentQuestionIndex < questions.length - 1) {
                const nextIdx = currentQuestionIndex + 1;
                setCurrentQuestionIndex(nextIdx);
                setMessages(prev => [...prev,
                { role: 'ai', content: "I couldn't analyze that response, but let's continue." },
                { role: 'ai', content: questions[nextIdx].question }
                ]);
            } else {
                setStep('summary');
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitAnswer();
        }
    };

    const getVerifiedSkills = () => {
        return Object.entries(skillScores)
            .filter(([, score]) => score.total > 0 && (score.demonstrated / score.total) >= 0.5)
            .map(([name]) => name);
    };

    const handleFinish = async () => {
        const verified = getVerifiedSkills();

        // Batch update all verified skills
        for (const skillName of verified) {
            const score = skillScores[skillName];
            const evidence = `Verified via unified AI interview. Demonstrated in ${score.demonstrated}/${score.total} questions.`;
            const skill = skills.find(s => s.name === skillName);
            const proficiency = (skill?.proficiency || 'learning') as CustomSkill['proficiency'];
            await handleInterviewComplete(proficiency, evidence, skillName);
        }

        navigate('/career/skills');
    };

    const handleClose = () => navigate('/career/skills');

    if (skills.length === 0) return null;

    const verifiedSkills = step === 'summary' ? getVerifiedSkills() : [];
    const verifiedCount = verifiedSkills.length;

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] animate-in fade-in duration-500">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-100 dark:border-neutral-800">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleClose}
                            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="h-8 w-[1px] bg-neutral-200 dark:bg-neutral-700 mx-2" />
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                                <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg text-white">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                                    Skills Assessment
                                    {step === 'interview' && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                            {currentQuestionIndex + 1}/{questions.length}
                                        </span>
                                    )}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-20 min-h-screen flex flex-col relative overflow-hidden bg-neutral-50/50 dark:bg-black/50">
                <div className="fixed top-20 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="fixed bottom-0 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 relative z-10 flex flex-col">
                    <AnimatePresence mode="wait">
                        {/* INTRO */}
                        {step === 'intro' && (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                                className="flex-1 flex flex-col items-center justify-center pb-20"
                            >
                                <div className="text-center max-w-md mb-10">
                                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl mb-8">
                                        <ShieldCheck className="w-12 h-12 text-emerald-500" />
                                    </div>
                                    <h4 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4 tracking-tight">
                                        Ready to verify your skills?
                                    </h4>
                                    <p className="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium">
                                        I'll ask cross-cutting questions that cover multiple skills at once. Answer naturally — no need to treat each skill separately.
                                    </p>
                                </div>

                                {limitError && (
                                    <div className="w-full max-w-md mb-8 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-2xl flex items-center gap-3 text-orange-700 dark:text-orange-400 text-sm font-bold">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <div className="flex-1">
                                            <p>{limitError}</p>
                                        </div>
                                        <button
                                            onClick={() => navigate(ROUTES.PLANS)}
                                            className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shrink-0"
                                        >
                                            Upgrade
                                        </button>
                                    </div>
                                )}

                                {/* Skills to assess */}
                                <div className="w-full max-w-md mb-10">
                                    <div className="text-xs font-bold text-neutral-400 tracking-wide mb-3 px-1">
                                        Skills being assessed
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map(s => (
                                            <span
                                                key={s.name}
                                                className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300"
                                            >
                                                {s.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleStart}
                                    disabled={isLoading || !!limitError}
                                    className="px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20 flex flex-col items-center gap-1 disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-3">
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Sparkles className="w-5 h-5" />
                                        )}
                                        <span>{isLoading ? 'Preparing questions...' : 'Begin assessment'}</span>
                                    </div>
                                    {!isLoading && !limitError && (
                                        <span className="text-[10px] opacity-70 uppercase tracking-widest">Uses 1 credit</span>
                                    )}
                                </button>
                            </motion.div>
                        )}

                        {/* INTERVIEW CHAT */}
                        {step === 'interview' && (
                            <motion.div
                                key="interview"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col pb-32"
                            >
                                <div className="flex-1 space-y-8">
                                    {messages.map((msg, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[85%] rounded-[2rem] p-8 shadow-sm ${msg.role === 'user'
                                                ? 'bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-white dark:to-neutral-200 text-white dark:text-black rounded-br-none'
                                                : 'bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-bl-none'
                                                }`}>
                                                <div className="text-base leading-relaxed font-medium">
                                                    {msg.content}
                                                </div>

                                                {/* Skill results feedback */}
                                                {msg.role === 'ai' && msg.skillResults && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800"
                                                    >
                                                        <div className="flex flex-wrap gap-2">
                                                            {msg.skillResults.map(r => (
                                                                <span
                                                                    key={r.skill}
                                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${r.demonstrated
                                                                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                                        : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                                                        }`}
                                                                    title={r.note}
                                                                >
                                                                    {r.demonstrated
                                                                        ? <CheckCircle2 className="w-3 h-3" />
                                                                        : <AlertCircle className="w-3 h-3" />
                                                                    }
                                                                    {r.skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {isAnalyzing && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                            <div className="bg-white dark:bg-neutral-900 px-6 py-5 rounded-[2rem] rounded-bl-none border border-neutral-100 dark:border-neutral-800 flex items-center gap-3 shadow-sm">
                                                <div className="flex gap-1.5">
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                                                </div>
                                                <span className="text-sm font-medium text-neutral-400">Analyzing...</span>
                                            </div>
                                        </motion.div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </motion.div>
                        )}

                        {/* SUMMARY */}
                        {step === 'summary' && (
                            <motion.div
                                key="summary"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                            >
                                <div className="relative mb-10">
                                    <div className={`absolute inset-0 ${verifiedCount > 0 ? 'bg-emerald-500' : 'bg-amber-500'} blur-[80px] opacity-20 rounded-full`} />
                                    <div className={`relative w-36 h-36 rounded-[3rem] ${verifiedCount > 0 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-amber-400 to-amber-600'} flex items-center justify-center shadow-2xl`}>
                                        <Sparkles className="w-16 h-16 text-white" />
                                    </div>
                                </div>

                                <h4 className="text-4xl font-bold text-neutral-900 dark:text-white mb-3 tracking-tight">
                                    {verifiedCount > 0 ? 'Mastery Achieved' : 'Practice Session Over'}
                                </h4>
                                <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium mb-10 max-w-lg">
                                    {verifiedCount > 0
                                        ? `You've successfully banked ${verifiedCount} skill${verifiedCount !== 1 ? 's' : ''} in your profile.`
                                        : `You didn't hit the verification threshold this time. Your progress was saved, but these skills need more proof.`
                                    }
                                </p>

                                {/* Skill results grid */}
                                <div className="w-full max-w-md mb-10 space-y-2">
                                    {skills.map(s => {
                                        const score = skillScores[s.name];
                                        const verified = verifiedSkills.includes(s.name);
                                        return (
                                            <div
                                                key={s.name}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${verified
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                                    : 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${verified
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'
                                                        }`}>
                                                        {verified ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                    </div>
                                                    <div className="text-left">
                                                        <span className={`font-bold text-sm block ${verified ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-500'}`}>
                                                            {s.name}
                                                        </span>
                                                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                                                            {verified ? 'Verified & Banked' : 'In Development'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {score && score.total > 0 && (
                                                    <span className="text-xs font-medium text-neutral-400">
                                                        {score.demonstrated}/{score.total}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={handleClose}
                                        className="px-8 py-4 rounded-2xl font-bold text-base text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                                    >
                                        Close
                                    </button>
                                    {verifiedCount > 0 && (
                                        <button
                                            onClick={handleFinish}
                                            className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-base hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                                        >
                                            Return to Dashboard
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Floating Input */}
            {step === 'interview' && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-transparent pt-24 z-40">
                    <div className="max-w-3xl mx-auto">
                        <div className="relative group">
                            <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl opacity-20 group-focus-within:opacity-100 transition duration-500 blur ${isAnalyzing ? 'opacity-0' : ''}`} />
                            <div className="relative flex items-center bg-white dark:bg-neutral-900 rounded-xl shadow-2xl">
                                <textarea
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your answer here..."
                                    disabled={isAnalyzing}
                                    className="w-full bg-transparent border-none p-6 text-base focus:ring-0 resize-none disabled:opacity-50 min-h-[4rem] max-h-48 text-neutral-900 dark:text-white placeholder:text-neutral-400 font-medium"
                                    rows={1}
                                />
                                <div className="pr-4">
                                    <button
                                        onClick={handleSubmitAnswer}
                                        disabled={!userAnswer.trim() || isAnalyzing}
                                        className="p-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-lg"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
