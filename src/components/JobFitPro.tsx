import React, { useState } from 'react';
import {
    Sparkles, Zap, CheckCircle, ArrowRight,
    Check, Link as LinkIcon,
    FileText, X, Bell, Compass, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';

interface JobFitProProps {
    onBack: () => void;
}

export const JobFitPro: React.FC<JobFitProProps> = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setIsSubmitting(true);
            setTimeout(() => {
                console.log('Waitlist signup:', email);
                setSubmitted(true);
                setIsSubmitting(false);
            }, 1000);
        }
    };

    return (
        <div className="bg-white min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={onBack}
                className="fixed top-24 left-4 z-50 p-2 bg-white/80 backdrop-blur rounded-full shadow-sm border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors md:hidden"
            >
                <ArrowRight className="w-5 h-5 rotate-180" />
            </button>

            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto mb-16 pt-12 px-4 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-6 animate-fade-in-up">
                    <Sparkles className="w-4 h-4" />
                    <span>Coming Soon</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
                    The Auto-Application Machine
                    <span className="block text-indigo-600">for Your Career</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                    Stop managing 15 versions of your resume. Paste a job URL and get a perfectly tailored application package in seconds.
                </p>

                {/* Interactive Demo UI */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-2 max-w-xl mx-auto transform hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex gap-2">
                        <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-slate-100">
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                            <div className="h-2 w-32 bg-slate-200 rounded-full" />
                        </div>
                        <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-300" />
                            Auto-Apply
                        </button>
                    </div>
                </div>
            </div>

            {/* Value Props Grid */}
            <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 mb-20 relative z-10">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                        <LinkIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">1. Paste URL</h3>
                    <p className="text-slate-600 leading-relaxed">
                        No more copy-pasting descriptions. Just drop the link. (We handle the scraping).
                    </p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">2. Tailored Docs</h3>
                    <p className="text-slate-600 leading-relaxed">
                        We rewrite your resume and draft a cover letter instantly based on the job requirements.
                    </p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">3. Submit</h3>
                    <p className="text-slate-600 leading-relaxed">
                        Download your perfectly matched application package. Ready to send.
                    </p>
                </div>
            </div>

            {/* Comparison Section */}
            <div className="max-w-5xl mx-auto px-4 mb-20">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative z-10">
                    <div className="grid md:grid-cols-2">
                        <div className="p-10 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-500 mb-6 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-400" />
                                Current Free Version
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 text-slate-600">
                                    <Check className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <span>Complete Resume Analysis</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-600">
                                    <Check className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <span>Unlimited Analysis</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-600">
                                    <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                                    <span>You provide API Key</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-600 opacity-50">
                                    <X className="w-5 h-5 text-slate-300 mt-0.5 flex-shrink-0" />
                                    <span>Manual Copy/Paste</span>
                                </li>
                            </ul>
                        </div>
                        <div className="p-10 bg-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-gradient-to-bl from-indigo-100 to-transparent w-32 h-32 rounded-bl-full opacity-50" />
                            <h3 className="text-xl font-bold text-indigo-600 mb-6 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                JobFit Pro
                            </h3>
                            <ul className="space-y-4 relative z-10">
                                <li className="flex items-start gap-3 text-slate-800 font-medium">
                                    <div className="bg-indigo-100 p-1 rounded-full text-indigo-600 mt-0.5">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    <span>Everything in Free</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-800 font-medium">
                                    <div className="bg-indigo-100 p-1 rounded-full text-indigo-600 mt-0.5">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    <span>Unlimited Analysis (We pay API cost)</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-800 font-medium">
                                    <div className="bg-indigo-100 p-1 rounded-full text-indigo-600 mt-0.5">
                                        <Zap className="w-3 h-3" />
                                    </div>
                                    <span>Auto-Write Cover Letter</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-800 font-medium">
                                    <div className="bg-indigo-100 p-1 rounded-full text-indigo-600 mt-0.5">
                                        <LinkIcon className="w-3 h-3" />
                                    </div>
                                    <span>Paste Job URL directly</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* The North Star */}
            <div className="max-w-6xl mx-auto px-4 mb-20">
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-indigo-500/20 p-2 rounded-lg backdrop-blur-sm border border-indigo-400/30">
                                <Compass className="w-6 h-6 text-indigo-300" />
                            </div>
                            <h2 className="text-2xl font-bold">The Future: AI Job Feed</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-12">
                            <div>
                                <p className="text-indigo-100 text-lg leading-relaxed mb-6">
                                    Imagine waking up to an inbox of jobs that you're already 95% qualified for.
                                </p>
                                <p className="text-slate-300 leading-relaxed mb-8">
                                    Instead of searching, you follow companies. We monitor their career pages 24/7. When a match appears, we draft the application instantly.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {['Auto-Monitoring', 'Instant Drafts', '95% Match Rate'].map((tag, i) => (
                                        <span key={i} className="bg-white/10 border border-white/10 px-3 py-1 rounded-full text-sm text-indigo-200">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-indigo-300 mb-2">
                                        <Bell className="w-4 h-4" />
                                        <span>New Match Found • 2m ago</span>
                                    </div>
                                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <div className="font-bold text-white mb-1 whitespace-normal">Senior Frontend Engineer (React + TypeScript)</div>
                                                <div className="text-indigo-200 text-sm">Netflix • Remote</div>
                                            </div>
                                            <div className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2 py-1 rounded-lg border border-emerald-500/30">
                                                98% Match
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                                            <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-2 rounded-lg transition-colors">
                                                Review Draft
                                            </button>
                                            <button className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Waitlist Form */}
            <div className="max-w-xl mx-auto text-center px-4 pb-20" id="waitlist">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Join the Waitlist</h2>
                <p className="text-slate-600 mb-8">
                    We're opening spots gradually. Be the first to know when the machine is ready.
                </p>

                {submitted ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl flex items-center justify-center gap-2 animate-fade-in">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">You're on the list! We'll be in touch soon.</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="relative">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="w-full pl-6 pr-32 py-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-lg transition-all shadow-sm"
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Join
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                )}
                <p className="text-xs text-slate-400 mt-4">
                    Early access includes a 30-day extended free trial.
                </p>

                {!submitted && (
                    <button onClick={onBack} className="mt-8 text-slate-400 hover:text-slate-600 text-sm hover:underline">
                        No thanks, take me back to dashboard
                    </button>
                )}
            </div>
        </div>
    );
};
