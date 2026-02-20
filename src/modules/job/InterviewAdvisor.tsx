import React, { useState } from 'react';
import {
    MessageSquare,
    Sparkles,
    Target,
    Zap,
    ChevronRight,
    Play,
    CheckCircle2,
    Loader2,
    Send,
    Brain,
    ArrowLeft
} from 'lucide-react';
import { useJobContext } from './context/JobContext';
import { useResumeContext } from '../resume/context/ResumeContext';
import { useInterview } from './hooks/useInterview';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { motion } from 'framer-motion';
import { DetailLayout } from '../../components/common/DetailLayout';

export const InterviewAdvisor: React.FC = () => {
    const { jobs } = useJobContext();
    const { resumes } = useResumeContext();
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
        isLastQuestion,
        totalQuestions
    } = useInterview();

    const [mode, setMode] = useState<'selection' | 'session'>('selection');
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [userResponse, setUserResponse] = useState('');
    const navigate = useNavigate();

    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (mode === 'session') {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [responses, currentQuestionIndex, isLoading, mode]);

    const handleStartTailored = () => {
        const job = jobs.find(j => j.id === selectedJobId);
        if (job) {
            loadTailoredQuestions(job, resumes);
            setMode('session');
        }
    };

    const handleStartGeneral = () => {
        loadGeneralQuestions();
        setMode('session');
    };

    const handleSubmit = async () => {
        if (!userResponse.trim()) return;
        const job = jobs.find(j => j.id === selectedJobId);
        await submitResponse(currentQuestion.id, userResponse, job);
        setUserResponse('');
    };

    const isSessionLoading = mode === 'session' && questions.length === 0 && isLoading;

    if (isSessionLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-sm font-black text-indigo-500 uppercase tracking-widest animate-pulse">
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
            <div className="min-h-screen bg-neutral-50 dark:bg-black flex flex-col">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 py-4">
                    <div className="max-w-3xl mx-auto flex items-center justify-between">
                        <button
                            onClick={() => setMode('selection')}
                            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-neutral-500" />
                        </button>
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                {selectedJobId ? 'Tailored Interview' : 'General Prep'}
                            </span>
                            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                                <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                                <span className="w-1 h-1 rounded-full bg-neutral-300" />
                                <span className={questions[currentQuestionIndex]?.isFollowUp ? "text-indigo-500 font-bold" : ""}>
                                    {questions[currentQuestionIndex]?.category}
                                </span>
                            </div>
                        </div>
                        <div className="w-9" /> {/* Spacer */}
                    </div>
                </div>

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
                                    <div className="text-sm font-bold text-neutral-400 uppercase tracking-wide">
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
                                        <div className="text-sm font-bold text-neutral-400 uppercase tracking-wide text-right">
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
                                                    <span>Feedback ({item.response.analysis.score}/100)</span>
                                                </div>
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                    {item.response.analysis.feedback}
                                                </p>
                                                {item.response.analysis.betterVersion && (
                                                    <div className="text-xs text-neutral-500 dark:text-neutral-500 pt-2 border-t border-indigo-200 dark:border-indigo-800/30">
                                                        <strong>Better:</strong> "{item.response.analysis.betterVersion}"
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
                            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">
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
        <div className="bg-neutral-50 dark:bg-[#000000] min-h-screen pt-24 pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-8 text-center md:text-left">
                <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">Interview Advisor</h1>
                <p className="text-neutral-500 dark:text-neutral-400 font-bold mt-1.5">Master your narrative with AI-powered mock sessions</p>
            </div>

            <DetailLayout maxWidth="max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* General Session Card */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 p-8 shadow-sm flex flex-col justify-between h-full"
                    >
                        <div className="space-y-6">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">General Prep</h2>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    Broad behavioral questions applicable across roles. Master the STAR method and build fundamental confidence.
                                </p>
                            </div>

                            <ul className="space-y-3 pt-2">
                                {[
                                    'Common behavioral questions',
                                    'STAR method training',
                                    'Instant AI feedback'
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={handleStartGeneral}
                            disabled={isLoading}
                            className="mt-8 w-full py-3.5 bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
                        >
                            Start General Session
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>

                    {/* Tailored Session Card */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 p-8 shadow-sm flex flex-col h-full"
                    >
                        <div className="space-y-6 flex-grow flex flex-col">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Tailored Mock</h2>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    Generated based on a specific role you've analyzed. High-stakes precision for your target jobs.
                                </p>
                            </div>

                            {/* Job Selection */}
                            <div className="space-y-3 pt-2 flex-grow flex flex-col">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                                    Select Target Job
                                </label>

                                {jobs.filter(j => j.status !== 'feed' && j.analysis).length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar flex-grow">
                                        {jobs.filter(j => j.status !== 'feed' && j.analysis).map(job => (
                                            <button
                                                key={job.id}
                                                onClick={() => setSelectedJobId(job.id)}
                                                className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between group/item ${selectedJobId === job.id
                                                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30'
                                                    : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800'
                                                    }`}
                                            >
                                                <div className="min-w-0">
                                                    <p className={`font-bold text-xs truncate ${selectedJobId === job.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{job.position}</p>
                                                    <p className="text-[10px] truncate text-neutral-400">
                                                        {job.company}
                                                    </p>
                                                </div>
                                                {selectedJobId === job.id && (
                                                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 space-y-3 flex-grow flex flex-col justify-center">
                                        <div className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center mx-auto shadow-sm">
                                            <Sparkles className="w-5 h-5 text-neutral-300" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-bold text-neutral-500">No analyzed jobs</p>
                                            <button
                                                onClick={() => navigate(ROUTES.HISTORY)}
                                                className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline"
                                            >
                                                View History
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleStartTailored}
                            disabled={!selectedJobId || isLoading}
                            className="mt-8 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            Start Tailored Session
                        </button>
                    </motion.div>

                    {/* Prep Tips Card */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 p-8 shadow-sm flex flex-col h-full"
                    >
                        <div className="space-y-6 flex-grow">
                            <div className="w-12 h-12 bg-neutral-50 dark:bg-neutral-500/10 rounded-2xl flex items-center justify-center">
                                <Zap className="w-6 h-6 text-amber-500" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Preparation Tips</h2>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    Logic and strategy to differentiate your narrative and maximize impact.
                                </p>
                            </div>

                            <div className="space-y-6 pt-2">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                                        <Target className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-neutral-900 dark:text-white">Master the 'Why'</p>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed">Focus on business impact, not just the technical steps.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                                        <Zap className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-neutral-900 dark:text-white">Quantify Success</p>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed">Use numbers. "Improved efficiency" → "Reduced latency by 40%."</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                                        <Sparkles className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-neutral-900 dark:text-white">STAR+ Method</p>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed">Situation, Task, Action, Result + Learning/Impact.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </DetailLayout>
        </div>
    );
};
