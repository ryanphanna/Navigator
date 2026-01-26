import React from 'react';
import { Key } from 'lucide-react';
import { ApiKeyInput } from './ApiKeyInput';

interface ApiKeySetupProps {
    isOpen: boolean;
    onComplete: () => void;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ isOpen, onComplete }) => {
    const [mode, setMode] = React.useState<'selection' | 'input'>('selection');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {mode === 'selection' ? (
                    <div className="p-6">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Choose Your Setup</h3>
                            <p className="text-slate-600">Select how you want to power JobFit's AI analysis.</p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={onComplete}
                                className="w-full text-left p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-100 hover:bg-slate-50 transition-all group"
                            >
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                    <span className="font-semibold text-slate-900">Hosted (Free)</span>
                                </div>
                                <p className="text-sm text-slate-500 pl-[52px]">
                                    Use our hosted keys. Perfect for getting started quickly. Standard usage limits apply.
                                </p>
                            </button>

                            <button
                                onClick={() => setMode('input')}
                                className="w-full text-left p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-100 hover:bg-slate-50 transition-all group"
                            >
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-2 bg-violet-100 text-violet-600 rounded-lg group-hover:bg-violet-200 transition-colors">
                                        <Key className="w-5 h-5" />
                                    </div>
                                    <span className="font-semibold text-slate-900">Bring Your Own Key</span>
                                </div>
                                <p className="text-sm text-slate-500 pl-[52px]">
                                    Use your own Gemini API key. Your data stays private. Higher rate limits.
                                </p>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-violet-50">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setMode('selection')}
                                    className="p-1 -ml-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/50 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <Key className="w-5 h-5" />
                                </div>
                                <h3 className="font-semibold text-slate-900">Setup Your API Key</h3>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600 leading-relaxed">
                                JobFit uses your own Gemini API key to analyze jobs and generate cover letters. This keeps your data private and gives you full control.
                            </p>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <p className="text-xs text-blue-900 font-medium mb-1">Don't have a key?</p>
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Get a free API key from Google AI Studio →
                                </a>
                            </div>

                            <ApiKeyInput />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
