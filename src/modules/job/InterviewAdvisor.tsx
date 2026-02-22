import React, { useState } from 'react';
import {
    MessageSquare,
    Sparkles,
    Target,
    Zap,
    ChevronRight,
    CheckCircle2,
    Loader2,
    Send,
    Brain,
    AlertCircle,
    FileText,
    Copy,
    ShieldCheck,
    Check
} from 'lucide-react';
import { useJobContext } from './context/JobContext';
import { useResumeContext } from '../resume/context/ResumeContext';
import { useInterview } from './hooks/useInterview';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { motion } from 'framer-motion';
import { checkInterviewLimit } from '../../services/usageLimits';
import { BentoCard } from '../../components/ui/BentoCard';
import { FEATURE_COLORS } from '../../featureRegistry';
import { supabase } from '../../services/supabase';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { useGlobalUI } from '../../contexts/GlobalUIContext';

export const InterviewAdvisor: React.FC = () => {
    const { jobs } = useJobContext();
    const {
        questions,
        currentQuestionIndex,
        currentQuestion,
        responses,
        isLoading,
        loadGeneralQuestions,
        loadTailoredQuestions,
        submitResponse,
        nextQuestion,
        isLastQuestion
    } = useInterview();

    const { resumes, handleUpdateResume } = useResumeContext();

    const [mode, setMode] = useState<'selection' | 'session'>('selection');
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [userResponse, setUserResponse] = useState('');
    const [limitError, setLimitError] = useState<string | null>(null);
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const navigate = useNavigate();

    const { setFocusedMode } = useGlobalUI();

    React.useEffect(() => {
        if (mode === 'session') {
            setFocusedMode(true);
        } else {
            setFocusedMode(false);
        }
        return () => setFocusedMode(false);
    }, [mode, setFocusedMode]);

    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (mode === 'session') {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [responses, currentQuestionIndex, isLoading, mode]);

    const handleStartTailored = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const limit = await checkInterviewLimit(user.id);
        if (!limit.allowed) {
            setLimitError(`Monthly interview limit reached (${limit.used}/${limit.limit})`);
            return;
        }

        const job = jobs.find(j => j.id === selectedJobId);
        if (job) {
            loadTailoredQuestions(job, resumes);
            setMode('session');
        }
    };

    const handleStartGeneral = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const limit = await checkInterviewLimit(user.id);
        if (!limit.allowed) {
            setLimitError(`Monthly interview limit reached (${limit.used}/${limit.limit})`);
            return;
        }

        loadGeneralQuestions();
        setMode('session');
    };

    const handleSubmit = async () => {
        if (!userResponse.trim()) return;
        const job = jobs.find(j => j.id === selectedJobId);
        await submitResponse(currentQuestion.id, userResponse, job);
        setUserResponse('');
    };

    const handleBankSuggestion = async (suggestion: any) => {
        if (resumes.length === 0) return;

        // Apply to the first (primary) resume for now
        const primaryResume = resumes[0];
        const newSuggestion = {
            id: crypto.randomUUID(),
            type: suggestion.type,
            suggestion: suggestion.suggestion,
            impact: suggestion.impact,
            source: 'Interview Advisor',
            dateAdded: Date.now()
        };

        const updatedResume = {
            ...primaryResume,
            suggestedUpdates: [
                ...(primaryResume.suggestedUpdates || []),
                newSuggestion
            ]
        };

        await handleUpdateResume(updatedResume);
    };

    const isSessionLoading = mode === 'session' && questions.length === 0 && isLoading;

    if (isSessionLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-sm font-bold text-indigo-500 tracking-tight animate-pulse">
                        Warming up Gemini...
                    </p>
                    <p className="text-xs text-neutral-500">
                        Analyzing your background and the target role
                    </p>
                </div>
            </div>
        );
    }











    if (mode === 'session') {
        // Safety check: ensure questions exist
        if (!questions || questions.length === 0) {
            return (
                <div className="min-h-screen bg-neutral-50 dark:bg-black flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
                </div>
            );
        }

        const currentQ = questions[currentQuestionIndex];

        // Build history with defensive checks
        const conversationHistory = questions.slice(0, currentQuestionIndex + 1).map((q) => ({
            question: q,
            response: responses[q.id]
        }));

        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-black flex flex-col pt-16">

                {/* Chat Area */}
                <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-8 pb-40">
                    {conversationHistory.map((item) => (
                        <div key={item.question.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* AI Question */}
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1">
                                    <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="space-y-2 max-w-[85%]">
                                    <div className="text-sm font-bold text-neutral-400 tracking-wide">
                                        {item.question.isFollowUp ? 'Follow-up Question' : 'Interviewer'}
                                    </div>
                                    <div className="text-lg md:text-xl font-medium text-neutral-900 dark:text-neutral-100">
                                        {item.question.question}
                                    </div>
                                    {item.question.rationale && (
                                        <div className="text-xs text-neutral-500 italic bg-neutral-100 dark:bg-neutral-900 p-2 rounded-lg inline-block">
                                            Rationale: {item.question.rationale}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* User Response (if exists) */}
                            {item.response && (
                                <div className="flex gap-4 flex-row-reverse">
                                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-1">
                                        <div className="w-4 h-4 rounded-full bg-neutral-400" />
                                    </div>
                                    <div className="space-y-2 max-w-[85%]">
                                        <div className="text-sm font-bold text-neutral-400 tracking-wide text-right">
                                            You
                                        </div>
                                        <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl rounded-tr-none border border-neutral-200 dark:border-neutral-700 shadow-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                                            {item.response.response}
                                        </div>

                                        {/* Analysis/Feedback */}
                                        {item.response.analysis && (
                                            <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 space-y-3">
                                                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                                                    <Sparkles className="w-4 h-4" />
                                                    <span>Verdict: {item.response.analysis.decision}</span>
                                                </div>
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                    {item.response.analysis.feedback}
                                                </p>
                                                {item.response.analysis.betterVersion && (
                                                    <div className="text-xs text-neutral-500 dark:text-neutral-500 pt-2 border-t border-indigo-200 dark:border-indigo-800/30">
                                                        <strong>Better:</strong> "{item.response.analysis.betterVersion}"
                                                    </div>
                                                )}

                                                {/* Resume Suggestions */}
                                                {item.response.analysis.resumeSuggestions && item.response.analysis.resumeSuggestions.length > 0 && (
                                                    <div className="mt-4 pt-3 border-t border-indigo-200 dark:border-indigo-800/30 space-y-3">
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                                            <FileText className="w-3 h-3" />
                                                            <span>Resume Suggestions Based on your Answer</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {item.response.analysis.resumeSuggestions.map((suggestion, sIdx) => {
                                                                const isBanked = resumes[0]?.suggestedUpdates?.some(u => u.suggestion === suggestion.suggestion);

                                                                return (
                                                                    <div key={sIdx} className="bg-white dark:bg-neutral-900/50 rounded-xl p-3 border border-indigo-100 dark:border-indigo-500/10 group/suggest">
                                                                        <div className="flex items-start justify-between gap-3">
                                                                            <div className="space-y-1">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="text-[11px] font-bold text-neutral-900 dark:text-neutral-200">{suggestion.suggestion}</span>
                                                                                </div>
                                                                                <p className="text-[10px] text-neutral-500 leading-relaxed italic">{suggestion.impact}</p>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 shrink-0">
                                                                                <button
                                                                                    onClick={() => handleBankSuggestion(suggestion)}
                                                                                    disabled={isBanked}
                                                                                    className={`p-1.5 rounded-lg transition-all ${isBanked
                                                                                        ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 cursor-default'
                                                                                        : 'hover:bg-indigo-50 text-neutral-400 hover:text-indigo-600 dark:hover:bg-indigo-500/10'
                                                                                        }`}
                                                                                    title={isBanked ? "Banked" : "Bank Suggestion"}
                                                                                >
                                                                                    {isBanked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        navigator.clipboard.writeText(suggestion.suggestion);
                                                                                        setCopiedText(suggestion.suggestion);
                                                                                        setTimeout(() => setCopiedText(null), 2000);
                                                                                    }}
                                                                                    className={`p-1.5 rounded-lg transition-colors ${copiedText === suggestion.suggestion
                                                                                        ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10'
                                                                                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-indigo-500'}`}
                                                                                    title="Copy to clipboard"
                                                                                >
                                                                                    {copiedText === suggestion.suggestion ? (
                                                                                        <Check className="w-3.5 h-3.5" />
                                                                                    ) : (
                                                                                        <Copy className="w-3.5 h-3.5" />
                                                                                    )}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Thinking Indicator */}
                    {isLoading && (
                        <div className="flex gap-4 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 shrink-0" />
                            <div className="space-y-2">
                                <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
                                <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-800 rounded" />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black dark:to-transparent pt-20">
                    <div className="max-w-3xl mx-auto relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl opacity-20 group-focus-within:opacity-100 transition duration-500 blur" />
                        <div className="relative flex items-end gap-2 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl p-2 border border-neutral-200 dark:border-neutral-800">
                            <textarea
                                value={userResponse}
                                onChange={(e) => setUserResponse(e.target.value)}
                                placeholder={currentQ && responses[currentQ.id] ? "Waiting for next question..." : "Type your answer..."}
                                disabled={!currentQ || !!responses[currentQ.id] || isLoading}
                                className="w-full bg-transparent border-none p-3 text-base focus:ring-0 resize-none disabled:opacity-50 min-h-[50px] max-h-40 text-neutral-900 dark:text-white placeholder:text-neutral-400"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                            />
                            <div className="flex flex-col gap-2 pb-1 pr-1">
                                {currentQ && responses[currentQ.id] && !isLastQuestion ? (
                                    <button
                                        onClick={nextQuestion}
                                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
                                        title="Next Question"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!userResponse.trim() || !currentQ || !!responses[currentQ.id] || isLoading}
                                        className="p-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-lg"
                                        title="Submit Answer"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <span className="text-[10px] text-neutral-400 tracking-tight font-bold">
                                {currentQ && responses[currentQ.id]
                                    ? (isLastQuestion ? "Interview Complete" : "Press Enter for Next Question")
                                    : "Press Enter to Submit"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <SharedPageLayout className="theme-job" spacing="compact" maxWidth="5xl">
            <PageHeader
                title="Interview Advisor"
                subtitle="Master your narrative with AI-powered mock sessions"
                variant="simple"
                className="mb-8"
            />

            {limitError && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-2xl flex items-center gap-3 text-orange-700 dark:text-orange-400 text-sm font-bold"
                >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{limitError}</span>
                    <button
                        onClick={() => navigate(ROUTES.PLANS)}
                        className="ml-auto px-4 py-1.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
                    >
                        Upgrade
                    </button>
                </motion.div>
            )}

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {/* General Session Card */}
                    <div className="animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100 fill-mode-both">
                        <BentoCard
                            id="general"
                            icon={MessageSquare}
                            title="General Prep"
                            description="Broad behavioral questions applicable across roles. Master the STAR method."
                            color={FEATURE_COLORS.indigo}
                            actionLabel="Start General"
                            onAction={handleStartGeneral}
                            previewContent={
                                <ul className="space-y-3 pt-4 border-t border-neutral-100 dark:border-white/5">
                                    {[
                                        'Common behavioral questions',
                                        'STAR method training',
                                        'Instant AI feedback'
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-[11px] font-bold text-neutral-400">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            }
                        />
                    </div>

                    {/* Tailored Session Card */}
                    <div className="animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200 fill-mode-both">
                        <BentoCard
                            id="tailored"
                            icon={Target}
                            title="Tailored Mock"
                            description="Generated based on a specific role you've analyzed. High-stakes precision."
                            color={FEATURE_COLORS.violet}
                            actionLabel="Start Tailored"
                            onAction={handleStartTailored}
                            className={!selectedJobId ? "opacity-90" : ""}
                            previewContent={
                                <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-white/5 min-h-[160px] flex flex-col">
                                    <label className="text-[10px] font-black tracking-[0.1em] text-neutral-400 uppercase">
                                        Select Target Job
                                    </label>

                                    {jobs.filter(j => j.status !== 'feed' && j.analysis).length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar flex-grow">
                                            {jobs.filter(j => j.status !== 'feed' && j.analysis).map(job => (
                                                <button
                                                    key={job.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedJobId(job.id);
                                                    }}
                                                    className={`p-2.5 rounded-xl border transition-all text-left flex items-center justify-between group/item ${selectedJobId === job.id
                                                        ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30'
                                                        : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200 dark:bg-neutral-900/50 dark:border-neutral-800'
                                                        }`}
                                                >
                                                    <div className="min-w-0">
                                                        <p className={`font-black text-[11px] truncate ${selectedJobId === job.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{job.position}</p>
                                                        <p className="text-[9px] font-bold truncate text-neutral-400">
                                                            {job.company}
                                                        </p>
                                                    </div>
                                                    {selectedJobId === job.id && (
                                                        <CheckCircle2 className="w-3 h-3 text-indigo-500 shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 space-y-2 flex-grow flex flex-col justify-center">
                                            <div className="w-8 h-8 bg-white dark:bg-neutral-800 rounded-lg flex items-center justify-center mx-auto shadow-sm">
                                                <Sparkles className="w-4 h-4 text-neutral-300" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black text-neutral-500">No analyzed jobs</p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(ROUTES.HISTORY);
                                                    }}
                                                    className="text-[9px] font-black text-indigo-500 uppercase tracking-tight hover:underline transition-all"
                                                >
                                                    View History
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            }
                        />
                    </div>

                    {/* Prep Tips Card */}
                    <div className="animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300 fill-mode-both">
                        <BentoCard
                            id="tips"
                            icon={Zap}
                            title="Preparation Tips"
                            description="Logic and strategy to differentiate your narrative and maximize impact."
                            color={FEATURE_COLORS.amber}
                            previewContent={
                                <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-white/5">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <Target className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[11px] font-black text-neutral-900 dark:text-white">Master the 'Why'</p>
                                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">Focus on business impact, not tasks.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                                            <Zap className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[11px] font-black text-neutral-900 dark:text-white">Quantify Success</p>
                                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">Use numbers like 40% reduction.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                                            <Sparkles className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[11px] font-black text-neutral-900 dark:text-white">STAR+ Method</p>
                                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">S-T-A-R + Learning/Impact.</p>
                                        </div>
                                    </div>
                                </div>
                            }
                        />
                    </div>
                </div>
            </div>
        </SharedPageLayout >
    );
};
