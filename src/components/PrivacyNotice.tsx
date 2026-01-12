import React from 'react';
import { Shield, ExternalLink, X } from 'lucide-react';

interface PrivacyNoticeProps {
    isOpen: boolean;
    onAccept: () => void;
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ isOpen, onAccept }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-violet-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-slate-900">Privacy Notice</h3>
                    </div>
                    <button onClick={onAccept} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Welcome to JobFit! Before you start, here's how your data is handled:
                    </p>

                    <div className="space-y-3">
                        <div className="flex gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <span className="text-emerald-600 font-bold text-lg">✓</span>
                            <div>
                                <h4 className="font-medium text-emerald-900 text-sm">Local Storage Only</h4>
                                <p className="text-xs text-emerald-700">Your resumes and job data stay in your browser</p>
                            </div>
                        </div>

                        <div className="flex gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                            <span className="text-amber-600 font-bold text-lg">!</span>
                            <div>
                                <h4 className="font-medium text-amber-900 text-sm">AI Processing</h4>
                                <p className="text-xs text-amber-700">Resume content is sent to Google Gemini API for analysis</p>
                            </div>
                        </div>

                        <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-slate-500 font-bold text-lg">○</span>
                            <div>
                                <h4 className="font-medium text-slate-900 text-sm">No Tracking</h4>
                                <p className="text-xs text-slate-600">No analytics or user monitoring</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500">
                        By continuing, you acknowledge that your resume data will be processed by Google's Gemini API.{' '}
                        <a
                            href="https://ai.google.dev/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                        >
                            View Google's Terms <ExternalLink className="w-3 h-3" />
                        </a>
                    </p>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <button
                        onClick={onAccept}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors shadow-sm hover:shadow"
                    >
                        I Understand, Continue
                    </button>
                </div>
            </div>
        </div>
    );
};
