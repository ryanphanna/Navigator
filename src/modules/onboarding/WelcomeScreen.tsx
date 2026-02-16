import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Upload, ArrowRight, ArrowLeft, Check, Loader2, GraduationCap, Search, Building2, Shield, ExternalLink, Lock, Zap, PenTool, Key, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { setSecureItem } from '../../utils/secureStorage';

type JourneyStage = 'student' | 'job-hunter' | 'employed' | 'career-changer';

interface WelcomeScreenProps {
    isOpen: boolean;
    onContinue: (preferences?: { journeys: JourneyStage[]; intent?: 'jobfit' | 'coach' }) => void;
    onImportResume?: (file: File) => void;
    isParsing?: boolean;
}

const JOURNEY_OPTIONS: { id: JourneyStage; icon: React.ReactNode; title: string; description: string; color: string }[] = [
    { id: 'job-hunter', icon: <Search className="w-6 h-6" />, title: "I'm job hunting", description: "Applying to roles and need an edge", color: 'indigo' },
    { id: 'employed', icon: <Building2 className="w-6 h-6" />, title: "I'm planning my career", description: "Looking to grow or find role models", color: 'emerald' },
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

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
    isOpen,
    onContinue,
    onImportResume,
    isParsing = false
}) => {
    // Step 1: Privacy -> Step 2: Model Setup -> Step 3: Journey -> Step 4: Upload -> Step 5: Features -> Step 6: Done
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
    const [selectedJourneys, setSelectedJourneys] = useState<JourneyStage[]>([]);
    const [resumeUploaded, setResumeUploaded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // API Key State
    const [apiKeyMode, setApiKeyMode] = useState<'selection' | 'input'>('selection');
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [keyStatus, setKeyStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
    const [keyMessage, setKeyMessage] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-advance from Feature Highlight (Step 5) when parsing completes
    useEffect(() => {
        if (step === 5 && !isParsing && resumeUploaded) {
            const timer = setTimeout(() => setStep(6), 1500);
            return () => clearTimeout(timer);
        }
    }, [step, isParsing, resumeUploaded]);

    useEffect(() => {
        // Load partial progress if needed or handle keydown
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // Prevent escape
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const toggleJourney = (journey: JourneyStage) => {
        setSelectedJourneys(prev =>
            prev.includes(journey)
                ? prev.filter(j => j !== journey)
                : [...prev, journey]
        );
    };

    const handleFileUpload = (file: File) => {
        if (file && (file.type === 'application/pdf' || file.type === 'text/plain' || file.name.endsWith('.docx'))) {
            onImportResume?.(file);
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

    const handleSaveKey = async () => {
        if (!apiKey.trim()) {
            setKeyMessage('Please enter a valid API Key');
            setKeyStatus('error');
            return;
        }

        setKeyStatus('validating');
        setKeyMessage('Saving key...');

        await setSecureItem('api_key', apiKey);

        // Clear limits
        localStorage.removeItem('navigator_quota_status');
        localStorage.removeItem('navigator_daily_usage');
        window.dispatchEvent(new CustomEvent('quotaStatusCleared'));
        window.dispatchEvent(new CustomEvent('apiKeySaved'));

        setKeyStatus('success');
        setKeyMessage('Key saved securely');

        setTimeout(() => {
            setKeyStatus('idle');
            setKeyMessage('');
            setStep(3); // Advance
        }, 1000);
    };

    const handleStandardSelect = () => {
        // Just proceed, essentially "Free" mode
        setStep(3);
    };

    const primaryJourney = selectedJourneys[0] || 'job-hunter';
    const tailoredContent = TAILORED_CONTENT[primaryJourney];

    const handleContinue = () => {
        if (step === 1) {
            localStorage.setItem('navigator_privacy_accepted', 'true');
            setStep(2);
        } else if (step === 2) {
            // Should participate in selection flow
        } else if (step === 3 && selectedJourneys.length > 0) {
            setStep(4);
        } else if (step === 4) {
            setStep(6); // Skip upload
        } else if (step === 5) {
            setStep(6);
        } else if (step === 6) {
            let intent: 'navigator' | 'coach' | 'grad' = 'navigator';
            if (selectedJourneys.includes('student')) intent = 'grad';
            else if (selectedJourneys.includes('employed')) intent = 'coach';

            onContinue({ journeys: selectedJourneys, intent } as any);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 ring-1 ring-neutral-900/5 dark:ring-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                {/* Header / Progress */}
                <div className="px-8 pt-6 flex justify-between items-center">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5, 6].map((s) => (
                            <div
                                key={s}
                                className={`h-1.5 rounded-full transition-all duration-500 ${s === step
                                    ? 'w-8 bg-gradient-to-r from-indigo-600 to-violet-600'
                                    : s < step
                                        ? 'w-2 bg-indigo-200 dark:bg-indigo-900'
                                        : 'w-2 bg-neutral-100 dark:bg-neutral-800'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <div className="p-8 min-h-[500px] flex flex-col">
                    {/* Step 1: Privacy First */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex-1 flex flex-col">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-4 shadow-lg ring-4 ring-emerald-50 dark:ring-emerald-900/10">
                                    <Shield className="w-8 h-8" />
                                </div>
                                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                                    Privacy First
                                </h1>
                                <p className="text-neutral-600 dark:text-neutral-400">
                                    Before we start, our promise to you.
                                </p>
                            </div>

                            <div className="space-y-3 mb-8 flex-1">
                                <div className="flex gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30">
                                    <div className="bg-emerald-100 dark:bg-emerald-900/30 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                        <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-emerald-900 dark:text-emerald-300 mb-1">Local Vault</h4>
                                        <p className="text-sm text-emerald-700 dark:text-emerald-400/80 leading-snug">Your resumes never leave your device storage unless you say so.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100/50 dark:border-amber-800/30">
                                    <div className="bg-amber-100 dark:bg-amber-900/30 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                        <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-1">AI Processing</h4>
                                        <p className="text-sm text-amber-700 dark:text-amber-400/80 leading-snug">We send anonymous text to Google Gemini for analysis. It is not used for training.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-4 bg-neutral-50/50 dark:bg-neutral-800/30 rounded-2xl border border-neutral-100 dark:border-neutral-700/50">
                                    <div className="bg-neutral-200 dark:bg-neutral-700 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                        <span className="text-neutral-500 dark:text-neutral-300 font-black text-lg">X</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Zero Tracking</h4>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-snug">No analytics. No cookies. No creepiness.</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center mb-6">
                                By continuing, you agree to the{' '}
                                <a href="https://ai.google.dev/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 underline underline-offset-2 inline-flex items-center gap-0.5">
                                    Google Gemini Terms <ExternalLink className="w-3 h-3" />
                                </a>
                            </p>

                            <button
                                onClick={handleContinue}
                                className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <Shield className="w-5 h-5" />
                                <span>I Understand, Let's Go</span>
                            </button>
                        </div>
                    )}

                    {/* Step 2: Model Setup */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex-1 flex flex-col">
                            {apiKeyMode === 'selection' ? (
                                <>
                                    <div className="text-center mb-6">
                                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                                            Choose Your Engine
                                        </h1>
                                        <p className="text-neutral-600 dark:text-neutral-400">
                                            Select how you want to power Navigator's AI analysis.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 mb-8">
                                        {/* Standard */}
                                        <button
                                            onClick={handleStandardSelect}
                                            className="w-full text-left p-6 rounded-2xl border-2 border-neutral-100 dark:border-neutral-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all group relative overflow-hidden flex flex-col h-full"
                                        >
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                                                    <Zap className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-lg text-neutral-900 dark:text-white">Standard</span>
                                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Free with Limits</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium mb-4 flex-1">
                                                Instant setup using shared keys. Good for testing, but has daily usage limits.
                                            </p>
                                        </button>

                                        {/* Pro / BYOK */}
                                        <button
                                            onClick={() => setApiKeyMode('input')}
                                            className="w-full text-left p-6 rounded-2xl border-2 border-neutral-100 dark:border-neutral-800 hover:border-violet-500 dark:hover:border-violet-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all group relative overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl hover:shadow-violet-500/5"
                                        >
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="p-3 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-xl group-hover:bg-violet-100 dark:group-hover:bg-violet-900/40 transition-colors">
                                                    <Key className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-lg text-neutral-900 dark:text-white">Pro / BYOK</span>
                                                        <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Free Forever</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium mb-4 flex-1">
                                                Use your own free Google Gemini API key. Higher limits and total privacy.
                                            </p>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="animate-in slide-in-from-right-4 duration-300 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-6 cursor-pointer text-neutral-500 hover:text-neutral-700" onClick={() => setApiKeyMode('selection')}>
                                        <ArrowLeft className="w-4 h-4" />
                                        <span className="text-sm font-medium">Back to options</span>
                                    </div>

                                    <div className="text-center mb-6">
                                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                                            Setup Your Key
                                        </h1>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                            Navigator uses your Gemini API key locally.
                                        </p>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 flex items-center justify-between">
                                            <div className="text-xs text-indigo-900 dark:text-indigo-300 font-medium">
                                                Don't have a key? Get one free.
                                            </div>
                                            <a
                                                href="https://aistudio.google.com/app/apikey"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs bg-white dark:bg-neutral-800 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 font-bold px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-neutral-700 transition-all"
                                            >
                                                Get API Key <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>

                                        <div className="relative">
                                            <input
                                                type={showKey ? 'text' : 'password'}
                                                value={apiKey}
                                                onChange={(e) => {
                                                    setApiKey(e.target.value);
                                                    setKeyStatus('idle');
                                                    setKeyMessage('');
                                                }}
                                                placeholder="Paste Gemini API Key..."
                                                className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm font-mono transition-all outline-none focus:ring-2 ${keyStatus === 'error'
                                                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50'
                                                    : keyStatus === 'success'
                                                        ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 bg-emerald-50'
                                                        : 'border-neutral-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                                                    }`}
                                            />
                                            <div className="absolute left-3 top-3.5 text-neutral-400">
                                                <Key className="w-4 h-4" />
                                            </div>
                                            <button
                                                onClick={() => setShowKey(!showKey)}
                                                className="absolute right-3 top-3 p-1 text-neutral-400 hover:text-neutral-600"
                                            >
                                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        {keyMessage && (
                                            <div className={`text-xs flex items-center gap-1.5 ${keyStatus === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {keyStatus === 'error' ? <AlertCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                                {keyMessage}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleSaveKey}
                                        disabled={keyStatus === 'validating' || !apiKey}
                                        className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                                    >
                                        {keyStatus === 'validating' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                        <span>Save & Continue</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Journey Selection */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex-1 flex flex-col">
                            <div className="text-center mb-6">
                                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                                    Welcome to Navigator
                                </h1>
                                <p className="text-neutral-600 dark:text-neutral-400">
                                    Where are you currently in your journey?
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 flex-1">
                                {JOURNEY_OPTIONS.map((option) => {
                                    const isSelected = selectedJourneys.includes(option.id);
                                    const colorMap: Record<string, any> = {
                                        violet: { selected: 'border-violet-500 shadow-violet-500/10', icon: 'bg-violet-500', iconBase: 'bg-violet-100 text-violet-600' },
                                        indigo: { selected: 'border-indigo-500 shadow-indigo-500/10', icon: 'bg-indigo-500', iconBase: 'bg-indigo-100 text-indigo-600' },
                                        emerald: { selected: 'border-emerald-500 shadow-emerald-500/10', icon: 'bg-emerald-500', iconBase: 'bg-emerald-100 text-emerald-600' },
                                        amber: { selected: 'border-amber-500 shadow-amber-500/10', icon: 'bg-amber-500', iconBase: 'bg-amber-100 text-amber-600' },
                                    };
                                    const colorClasses = colorMap[option.color] || colorMap.indigo;

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => toggleJourney(option.id)}
                                            className={`group relative bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm border-2 transition-all duration-300 text-left flex items-start gap-4 ${isSelected
                                                ? `${colorClasses.selected} shadow-xl`
                                                : 'border-neutral-100 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                                                }`}
                                        >
                                            {isSelected && (
                                                <div className={`absolute top-3 right-3 w-5 h-5 ${colorClasses.icon} rounded-full flex items-center justify-center`}>
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${isSelected
                                                ? `${colorClasses.icon} text-white shadow-lg`
                                                : `${colorClasses.iconBase} group-hover:scale-105`
                                                }`}>
                                                {option.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-neutral-900 dark:text-white mb-0.5">{option.title}</h3>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{option.description}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={handleContinue}
                                disabled={selectedJourneys.length === 0}
                                className={`w-full py-4 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 text-lg ${selectedJourneys.length > 0
                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white hover:shadow-xl'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                                    }`}
                            >
                                Continue
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Step 4: Resume Upload */}
                    {step === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex-1 flex flex-col">
                            <div className="text-center mb-6">
                                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                                    {tailoredContent.headline}
                                </h1>
                                <p className="text-neutral-600 dark:text-neutral-400">
                                    Upload your resume to get started
                                </p>
                            </div>

                            <div
                                onDrop={handleDrop}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative cursor-pointer border-3 border-dashed rounded-2xl p-8 mb-6 text-center transition-all duration-300 flex-1 flex flex-col items-center justify-center ${isDragging
                                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                                    : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.txt,.docx"
                                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                    className="hidden"
                                />
                                <div className="w-20 h-20 bg-white dark:bg-neutral-800 rounded-full shadow-lg flex items-center justify-center mb-6">
                                    <Upload className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <p className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Drop your resume here</p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">PDF, DOCX, or TXT</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(3)}
                                    className="px-5 py-3 rounded-xl font-semibold transition-all border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                                <button
                                    onClick={handleContinue}
                                    className="flex-1 py-3 rounded-xl font-semibold transition-all bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center gap-2"
                                >
                                    Skip for now
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Feature Highlights (While Parsing) */}
                    {step === 5 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex-1 flex flex-col text-center">
                            <div className="mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4 shadow-lg animate-pulse">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                </div>
                                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                                    Analyzing your profile...
                                </h1>
                                <p className="text-neutral-600 dark:text-neutral-400">
                                    While we work, here is what you can do next.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/30 text-left">
                                    <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/20">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Smart Tailoring</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Instantly rewrite your resume to match any job description keywords.</p>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800/30 text-left">
                                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
                                        <PenTool className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Cover Letters</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Generate unique, persuasive cover letters that cite your actual experience.</p>
                                </div>
                            </div>

                            <div className="mt-8">
                                <p className="text-xs text-neutral-400 animate-pulse">Extracting experience blocks...</p>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Ready */}
                    {step === 6 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex-1 flex flex-col text-center justify-center">
                            <div className="mb-8">
                                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full mb-6 shadow-xl animate-in zoom-in-50 duration-500">
                                    <Check className="w-12 h-12 text-white" />
                                </div>
                                <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-3">
                                    You're all set!
                                </h1>
                                <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                                    {selectedJourneys.includes('job-hunter')
                                        ? "Let's find your perfect job match."
                                        : "Let's explore your career options."}
                                </p>
                            </div>

                            <button
                                onClick={handleContinue}
                                className="w-full py-4 rounded-xl font-semibold transition-all shadow-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white hover:shadow-xl flex items-center justify-center gap-2 text-lg"
                            >
                                Get Started
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
