import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Upload, ArrowRight, ArrowLeft, Check, Loader2, GraduationCap, Search, Building2, Shield, Lock, Zap, PenTool } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useResumeContext } from '../resume/context/ResumeContext';
import { TranscriptUpload } from '../grad/TranscriptUpload';
import { PlansOnboardingStep } from './PlansOnboardingStep';
import type { ExperienceBlock } from '../resume/types';
import { ROUTES } from '../../constants';

type JourneyStage = 'student' | 'job-hunter' | 'employed' | 'career-changer';

const JOURNEY_OPTIONS: { id: JourneyStage; icon: React.ReactNode; title: string; description: string; color: string }[] = [
    { id: 'job-hunter', icon: <Search className="w-6 h-6" />, title: "I'm job hunting", description: "Applying to roles and need an edge", color: 'indigo' },
    { id: 'employed', icon: <Building2 className="w-6 h-6" />, title: "I'm planning my career", description: "Looking to grow or find role models", color: 'emerald' },
    { id: 'career-changer', icon: <ArrowRight className="w-6 h-6 -rotate-45" />, title: "I'm changing careers", description: "Moving to a new industry or role", color: 'amber' },
    { id: 'student', icon: <GraduationCap className="w-6 h-6" />, title: "I'm focusing on grad school", description: "Mapping my academic path and GPA", color: 'violet' },
];

const TAILORED_CONTENT: Record<JourneyStage, { headline: string; tips: string[] }> = {
    student: {
        headline: "We'll help you build a standout profile",
        tips: ["Turn coursework into skills", "Highlight projects & internships", "Find entry-level opportunities"]
    },
    'job-hunter': {
        headline: "We'll maximize your application success",
        tips: ["Analyze job fit in seconds", "Tailor resumes automatically", "Generate cover letters instantly"]
    },
    employed: {
        headline: "We'll help you level up your career",
        tips: ["Identify skill gaps", "Build a 12-month roadmap", "Prepare for your next role"]
    },
    'career-changer': {
        headline: "We'll map your transferable skills",
        tips: ["Translate experience to new fields", "Find bridge roles", "Build relevant credentials"]
    }
};

const detectStudentStatus = (blocks: ExperienceBlock[]) => {
    return blocks.some(block =>
        block.type === 'education' &&
        (block.dateRange.toLowerCase().includes('present') ||
            block.dateRange.toLowerCase().includes('expected') ||
            block.dateRange.toLowerCase().includes('current'))
    );
};

export const OnboardingPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { resumes, handleImportResume, isParsingResume } = useResumeContext();
    const [lastKnownResumeCount, setLastKnownResumeCount] = useState(resumes.length);
    const [isStudent, setIsStudent] = useState(false);

    const [parsingSnapshot, setParsingSnapshot] = useState<{ skills: number, roles: number, education: boolean } | null>(null);

    // Flow: Journey (Step 3) -> Privacy (Step 1) -> Name (Step 1.5) -> Upload (Step 4) ...
    // Verify: Journey depends on user selection.

    // Initial State: Start at Step 3 (Journey)
    const [step, setStep] = useState<1 | 1.5 | 3 | 4 | 5 | 5.5 | 5.8 | 6>(3); // 5.8 is Plans
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [selectedJourneys, setSelectedJourneys] = useState<JourneyStage[]>([]);
    const [resumeUploaded, setResumeUploaded] = useState(false);
    const [transcriptUploaded, setTranscriptUploaded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // New State for Names
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    // Auto-advance from Feature Highlight (Step 5) when parsing completes
    useEffect(() => {
        if (step === 5 && !isParsingResume && resumeUploaded) {
            const hasNewResume = resumes.length > lastKnownResumeCount;
            const lastResume = hasNewResume ? resumes[resumes.length - 1] : null;

            if (lastResume) {
                const detected = detectStudentStatus(lastResume.blocks);
                const snapshot = {
                    skills: lastResume.blocks.filter(b => b.type === 'skill').length ||
                        lastResume.blocks.filter(b => b.type === 'work').reduce((acc, b) => acc + (b.bullets?.length || 0), 0),
                    roles: lastResume.blocks.filter(b => b.type === 'work').length,
                    education: detected
                };
                setParsingSnapshot(snapshot);
                setIsStudent(detected || selectedJourneys.includes('student'));
            }

            setLastKnownResumeCount(resumes.length);

            const delay = 2500; // Give a bit more time for the delight snapshot
            const timer = setTimeout(() => {
                const detected = hasNewResume ? detectStudentStatus(resumes[resumes.length - 1].blocks) : false;
                if (detected || selectedJourneys.includes('student')) {
                    setStep(5.5);
                } else {
                    setStep(6);
                }
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [step, isParsingResume, resumeUploaded, resumes, lastKnownResumeCount, selectedJourneys]);

    // Save state to sessionStorage to persist across redirects (e.g. Stripe)
    useEffect(() => {
        if (firstName || lastName || selectedJourneys.length > 0) {
            const state = {
                firstName,
                lastName,
                selectedJourneys,
                step,
                resumeUploaded,
                transcriptUploaded
            };
            sessionStorage.setItem('onboarding_state', JSON.stringify(state));
        }
    }, [firstName, lastName, selectedJourneys, step, resumeUploaded, transcriptUploaded]);

    // Restore state and handle Stripe success
    useEffect(() => {
        const savedState = sessionStorage.getItem('onboarding_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (parsed.firstName) setFirstName(parsed.firstName);
                if (parsed.lastName) setLastName(parsed.lastName);
                if (parsed.selectedJourneys) setSelectedJourneys(parsed.selectedJourneys);
                if (parsed.resumeUploaded) setResumeUploaded(parsed.resumeUploaded);
                if (parsed.transcriptUploaded) setTranscriptUploaded(parsed.transcriptUploaded);

                // If returning from success, go to final step
                if (searchParams.get('success') === 'true') {
                    setStep(6);
                } else if (searchParams.get('step') === 'plans') {
                    // If we were on plans step but failed/returned, stay there
                    setStep(5.8);
                }
            } catch (e) {
                console.error('Failed to restore state', e);
            }
        }
    }, [searchParams]);

    const toggleJourney = (journey: JourneyStage) => {
        setSelectedJourneys((prev: JourneyStage[]) =>
            prev.includes(journey)
                ? prev.filter((j: JourneyStage) => j !== journey)
                : [...prev, journey]
        );
    };

    const handleFileUpload = (file: File) => {
        if (file && (file.type === 'application/pdf' || file.type === 'text/plain' || file.name.endsWith('.docx'))) {
            handleImportResume(file);
            setResumeUploaded(true);
            setTimeout(() => setStep(5), 500);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };
    const primaryJourney = (selectedJourneys[0] || 'job-hunter') as JourneyStage;
    const tailoredContent = TAILORED_CONTENT[primaryJourney];

    const handleComplete = async () => {
        let intent: 'navigator' | 'coach' | 'grad' = 'navigator';
        if (selectedJourneys.includes('student')) intent = 'grad';
        else if (selectedJourneys.includes('employed')) intent = 'coach';

        const primaryJourney = selectedJourneys[0] || 'job-hunter';

        // Save profile data
        const userData = { firstName, lastName, journey: primaryJourney, intent };

        // Store in localStorage/Session
        localStorage.setItem('navigator_privacy_accepted', 'true');
        localStorage.setItem('navigator_user_journey', primaryJourney);
        sessionStorage.setItem('pending_user_meta', JSON.stringify(userData));

        // Try to update Supabase if user exists (though they likely don't yet)
        try {
            const { supabase } = await import('../../services/supabase');
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('profiles').update({
                    first_name: firstName,
                    last_name: lastName,
                    journey: primaryJourney
                }).eq('id', user.id);
            }
        } catch (e) {
            // Ignore auth errors here
        }

        // Navigate to Home
        navigate(ROUTES.HOME);
    };

    const handleNext = () => {
        if (step === 3 && selectedJourneys.length > 0) {
            // Journey -> Name
            setStep(1.5);
        } else if (step === 1.5) {
            // Name -> Privacy
            setStep(1);
        } else if (step === 1) {
            // Privacy -> Upload (Step 4)
            setStep(4);
        } else if (step === 4) {
            setStep(5.8);
        } else if (step === 5) {
            setStep(5.8);
        } else if (step === 5.5) {
            setStep(5.8);
        } else if (step === 5.8) {
            setStep(6);
        } else if (step === 6) {
            handleComplete();
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
            {/* Simple Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob" />
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
                <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
            </div>

            <div className="w-full max-w-2xl bg-white dark:bg-neutral-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 ring-1 ring-neutral-900/5 dark:ring-white/10 overflow-hidden relative z-10 min-h-[600px] flex flex-col">

                {/* Header / Progress */}
                <div className="px-8 pt-8 flex justify-between items-center">
                    <div className="flex gap-2">
                        {[3, 1.5, 1, 4, 5, 5.5, 5.8, 6].map((s, idx) => {
                            // Only show 5.5 if it's the current step or we are a student
                            if (s === 5.5 && step < 5.5 && !isStudent) return null;

                            // Determine if "active" or "completed" based on index in this specific array
                            // We need to find the index of the CURRENT step in this array
                            const currentStepIndex = [3, 1.5, 1, 4, 5, 5.5, 5.8, 6].indexOf(step);
                            const thisStepIndex = idx;

                            return (
                                <div
                                    key={s}
                                    className={`h - 1.5 rounded - full transition - all duration - 500 ${s === step
                                        ? 'w-8 bg-gradient-to-r from-indigo-600 to-violet-600'
                                        : thisStepIndex < currentStepIndex
                                            ? 'w-2 bg-indigo-200 dark:bg-indigo-900'
                                            : 'w-2 bg-neutral-100 dark:bg-neutral-800'
                                        } `}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="p-8 flex-1 flex flex-col items-center justify-center relative">
                    <AnimatePresence mode="wait">
                        {/* Step 3: Journey Selection */}
                        {step === 3 && (
                            <motion.div
                                key="step-3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full max-w-xl"
                            >
                                <div className="card-premium p-10 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

                                    <div className="relative text-center mb-10">
                                        <h1 className="text-4xl font-black mb-3 text-neutral-900 dark:text-white">
                                            Welcome to <span className="text-gradient">Navigator</span>
                                        </h1>
                                        <p className="text-neutral-500 dark:text-neutral-400 text-lg font-medium">
                                            Where are you currently in your journey?
                                        </p>
                                    </div>

                                    <div className="space-y-3 mb-10">
                                        {JOURNEY_OPTIONS.map((option) => {
                                            const isSelected = selectedJourneys.includes(option.id);
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => toggleJourney(option.id)}
                                                    className={`group w-full p-5 rounded-3xl border-2 text-left transition-all duration-300 relative overflow-hidden ${isSelected
                                                        ? 'border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10'
                                                        : 'border-neutral-100 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-5 relative z-10">
                                                        <div className={`w-14 h-14 rounded-2xl transition-all duration-500 flex items-center justify-center ${isSelected
                                                            ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 scale-110'
                                                            : 'bg-white dark:bg-neutral-800 text-neutral-400 group-hover:text-indigo-500 group-hover:scale-105 shadow-sm'
                                                            }`}>
                                                            {option.icon}
                                                        </div>
                                                        <div>
                                                            <h3 className={`font-black text-lg transition-colors ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-900 dark:text-white'}`}>{option.title}</h3>
                                                            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{option.description}</p>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="ml-auto animate-in zoom-in-50 duration-300">
                                                                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                                                    <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        disabled={selectedJourneys.length === 0}
                                        className="w-full btn-premium py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 group"
                                    >
                                        <span>Continue</span>
                                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 1.5: Name */}
                        {step === 1.5 && (
                            <motion.div
                                key="step-1.5"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full max-w-xl"
                            >
                                <div className="card-premium p-10 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

                                    <div className="relative text-center mb-10">
                                        <h1 className="text-4xl font-black mb-3 text-neutral-900 dark:text-white">Nice to meet you</h1>
                                        <p className="text-neutral-500 dark:text-neutral-400 text-lg font-medium">What should we call you?</p>
                                    </div>

                                    <div className="space-y-6 mb-10">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-neutral-400 pl-1">First Name</label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="w-full px-6 py-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-lg font-bold"
                                                placeholder="Jane"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-neutral-400 pl-1">Last Name</label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="w-full px-6 py-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-lg font-bold"
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setStep(3)}
                                            className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all group"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-neutral-500 group-hover:-translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            disabled={!firstName}
                                            className="flex-1 btn-premium py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 group"
                                        >
                                            <span>Continue</span>
                                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 1: Privacy First */}
                        {step === 1 && (
                            <motion.div
                                key="step-1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full max-w-xl"
                            >
                                <div className="card-premium p-10 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

                                    <div className="relative flex flex-col items-center text-center mb-10">
                                        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-6 ring-8 ring-emerald-500/5">
                                            <Shield className="w-10 h-10 text-emerald-500" />
                                        </div>
                                        <h1 className="text-4xl font-black mb-3 text-neutral-900 dark:text-white">Privacy First</h1>
                                        <p className="text-neutral-500 dark:text-neutral-400 text-lg font-medium">Before we start, our promise to you.</p>
                                    </div>

                                    <div className="space-y-3 mb-10">
                                        {[
                                            { icon: <Lock className="w-5 h-5 text-emerald-500" />, title: 'Local Vault', desc: 'Your resumes never leave your device storage unless you say so.', bg: 'bg-emerald-500/5' },
                                            { icon: <Zap className="w-5 h-5 text-amber-500" />, title: 'AI Processing', desc: 'We send anonymous text to Google Gemini for analysis. It is not used for training.', bg: 'bg-amber-500/5' },
                                            { icon: <span className="font-black text-rose-500">X</span>, title: 'Zero Tracking', desc: 'No analytics. No cookies. No creepiness.', bg: 'bg-rose-500/5' }
                                        ].map((item, i) => (
                                            <div key={i} className={`flex items-start gap-5 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 ${item.bg}`}>
                                                <div className="mt-1">{item.icon}</div>
                                                <div>
                                                    <h3 className="font-black text-neutral-900 dark:text-white uppercase tracking-tight text-sm">{item.title}</h3>
                                                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mb-10 flex flex-col items-center">
                                        <label className="flex items-center gap-4 cursor-pointer group p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={privacyAccepted}
                                                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                                    className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-neutral-200 dark:border-neutral-700 checked:bg-indigo-600 checked:border-indigo-600 transition-all"
                                                />
                                                <Check className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity stroke-[3px]" />
                                            </div>
                                            <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400 select-none">
                                                I agree to the{' '}
                                                <a href="/terms" target="_blank" className="text-indigo-600 hover:text-indigo-700 font-black underline underline-offset-4">Terms</a>
                                                {' '}and{' '}
                                                <a href="/privacy" target="_blank" className="text-indigo-600 hover:text-indigo-700 font-black underline underline-offset-4">Privacy Policy</a>
                                            </span>
                                        </label>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setStep(1.5)}
                                            className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all group"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-neutral-500 group-hover:-translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            disabled={!privacyAccepted}
                                            className="flex-1 btn-premium py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 group"
                                        >
                                            <Shield className="w-5 h-5" />
                                            <span>Accept & Continue</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Resume Upload */}
                        {step === 4 && (
                            <motion.div
                                key="step-4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full max-w-xl"
                            >
                                <div className="card-premium p-10 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

                                    <div className="relative text-center mb-10">
                                        <h1 className="text-4xl font-black mb-3 text-neutral-900 dark:text-white">
                                            {tailoredContent.headline}
                                        </h1>
                                        <p className="text-neutral-500 dark:text-neutral-400 text-lg font-medium">
                                            Upload your resume to get started
                                        </p>
                                    </div>

                                    <motion.div
                                        onDrop={handleDrop}
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onClick={() => fileInputRef.current?.click()}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className={`relative cursor-pointer border-3 border-dashed rounded-[2rem] p-12 mb-8 text-center transition-all duration-500 flex flex-col items-center justify-center overflow-hidden ${isDragging
                                            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02] shadow-2xl shadow-indigo-500/20'
                                            : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 hover:border-indigo-300 dark:hover:border-neutral-700'
                                            }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.txt,.docx"
                                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                            className="hidden"
                                        />
                                        <div className="w-24 h-24 bg-white dark:bg-neutral-800 rounded-3xl shadow-xl flex items-center justify-center mb-6 ring-8 ring-indigo-500/5">
                                            <Upload className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <p className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Drop it here</p>
                                        <p className="text-neutral-500 dark:text-neutral-400 font-medium">PDF, DOCX, or TXT</p>

                                        {isParsingResume && (
                                            <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                                                <p className="font-bold text-neutral-900 dark:text-white">Analyzing profile...</p>
                                            </div>
                                        )}
                                    </motion.div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setStep(1)}
                                            className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all group"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-neutral-500 group-hover:-translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="flex-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <span>Skip for now</span>
                                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 5: Feature Highlights (While Parsing) */}
                        {step === 5 && (
                            <motion.div
                                key="step-5"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full max-w-xl text-center"
                            >
                                <div className="card-premium p-10 shadow-2xl">
                                    <div className="mb-10">
                                        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl mb-6 shadow-xl animate-pulse">
                                            <Loader2 className="w-10 h-10 animate-spin" />
                                        </div>
                                        <h1 className="text-4xl font-black text-neutral-900 dark:text-white mb-3">
                                            Analyzing profile...
                                        </h1>
                                        <p className="text-neutral-500 dark:text-neutral-400 text-lg font-medium underline underline-offset-8 decoration-indigo-500/20">
                                            Extracting your brilliance.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 text-left">
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="bg-gradient-to-br from-indigo-500/5 to-violet-500/5 rounded-[2rem] p-6 border border-indigo-500/10 flex items-center gap-5"
                                        >
                                            <div className="w-14 h-14 bg-white dark:bg-neutral-800 rounded-2xl shadow-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                <Sparkles className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-neutral-900 dark:text-white mb-1">Smart Tailoring</h3>
                                                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Instantly rewrite your resume to match any job.</p>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-[2rem] p-6 border border-emerald-500/10 flex items-center gap-5"
                                        >
                                            <div className="w-14 h-14 bg-white dark:bg-neutral-800 rounded-2xl shadow-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                <PenTool className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-neutral-900 dark:text-white mb-1">Cover Letters</h3>
                                                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Generate unique, persuasive cover letters.</p>
                                            </div>
                                        </motion.div>
                                    </div>

                                    <div className="mt-10 min-h-[40px]">
                                        {parsingSnapshot && (
                                            <div className="flex items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black border border-indigo-500/20">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                                    {parsingSnapshot.roles} ROLES FOUND
                                                </div>
                                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-black border border-emerald-500/20">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                    SKILLS MAPPED
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 5.5: Smart Transcript Prompt */}
                        {step === 5.5 && (
                            <motion.div
                                key="step-5.5"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full max-w-xl"
                            >
                                <div className="card-premium p-10 shadow-2xl">
                                    <div className="text-center mb-10">
                                        <div className="inline-flex items-center justify-center w-20 h-20 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-3xl mb-6 shadow-xl ring-8 ring-violet-500/5">
                                            <GraduationCap className="w-10 h-10" />
                                        </div>
                                        <h1 className="text-4xl font-black text-neutral-900 dark:text-white mb-3">
                                            Sync Academic Plan
                                        </h1>
                                        <p className="text-neutral-500 dark:text-neutral-400 text-lg font-medium">
                                            Track your GPA and credits automatically.
                                        </p>
                                    </div>

                                    <div className="flex-1 flex flex-col items-center justify-center mb-10">
                                        <TranscriptUpload
                                            onUploadComplete={(parsed) => {
                                                localStorage.setItem('NAVIGATOR_TRANSCRIPT_CACHE', JSON.stringify(parsed));
                                                setTranscriptUploaded(true);
                                                setStep(6);
                                            }}
                                        />
                                    </div>

                                    <button
                                        onClick={() => setStep(6)}
                                        className="w-full btn-premium py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 group"
                                    >
                                        <span>Continue to Setup</span>
                                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 5.8: Plans Selection */}
                        {step === 5.8 && (
                            <motion.div
                                key="step-5.8"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full max-w-4xl"
                            >
                                <div className="card-premium p-4 md:p-10 shadow-2xl">
                                    <PlansOnboardingStep
                                        onNext={() => setStep(6)}
                                        firstName={firstName}
                                        lastName={lastName}
                                        selectedJourneys={selectedJourneys}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 6: Ready */}
                        {step === 6 && (
                            <motion.div
                                key="step-6"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-xl text-center"
                            >
                                <div className="card-premium p-10 shadow-2xl">
                                    <div className="mb-10">
                                        <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full mb-8 shadow-2xl shadow-emerald-500/20 animate-in zoom-in-50 duration-500">
                                            <Check className="w-14 h-14 text-white stroke-[3px]" />
                                        </div>
                                        <h1 className="text-5xl font-black text-neutral-900 dark:text-white mb-4 tracking-tight">
                                            You're ready!
                                        </h1>
                                        <p className="text-xl text-neutral-500 dark:text-neutral-400 font-medium max-w-md mx-auto">
                                            {selectedJourneys.includes('job-hunter')
                                                ? "Your journey to the perfect role starts here."
                                                : "Let's build your path to success."}
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleComplete}
                                        className="w-full btn-premium py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 group"
                                    >
                                        <span>Launch Navigator</span>
                                        <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div >
    );
};
