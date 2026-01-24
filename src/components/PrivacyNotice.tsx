import React from 'react';
import { Shield, ExternalLink, X } from 'lucide-react';

interface PrivacyNoticeProps {
    isOpen: boolean;
    onAccept: () => void;
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ isOpen, onAccept }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20 ring-1 ring-slate-900/5 dark:ring-white/10">
                <div className="px-8 py-6 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-sm ring-1 ring-emerald-500/10">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Privacy First</h3>
                    </div>
                    <button
                        onClick={onAccept}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        Welcome to JobFit. Your data privacy is our obsession. Here is exactly how it works:
                    </p>

                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30 shadow-sm transition-transform hover:scale-[1.02] duration-300">
                            <div className="bg-emerald-100 dark:bg-emerald-900/30 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-emerald-600 dark:text-emerald-400 font-black text-lg">✓</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 mb-1">Local Vault</h4>
                                <p className="text-sm text-emerald-700 dark:text-emerald-400/80 leading-snug">Your resumes never leave your device storage unless you say so.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100/50 dark:border-amber-800/30 shadow-sm transition-transform hover:scale-[1.02] duration-300">
                            <div className="bg-amber-100 dark:bg-amber-900/30 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-amber-600 dark:text-amber-400 font-black text-lg">!</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-1">AI Processing</h4>
                                <p className="text-sm text-amber-700 dark:text-amber-400/80 leading-snug">We send anonymous text to Google Gemini for analysis. It is not used for training.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm transition-transform hover:scale-[1.02] duration-300">
                            <div className="bg-slate-200 dark:bg-slate-700 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-slate-500 dark:text-slate-300 font-black text-lg">X</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Zero Tracking</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">No analytics. No cookies. No creepiness.</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center px-4">
                        By continuing, you agree to the{' '}
                        <a
                            href="https://ai.google.dev/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 inline-flex items-center gap-0.5"
                        >
                            Google Gemini Terms <ExternalLink className="w-3 h-3" />
                        </a>
                    </p>
                </div>

                <div className="px-8 pb-8">
                    <button
                        onClick={onAccept}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Shield className="w-5 h-5" />
                        <span>I Understand, Let's Go</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
