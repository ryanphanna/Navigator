import React from 'react';
import { Key } from 'lucide-react';
import { ApiKeyInput } from './ApiKeyInput';

interface ApiKeySetupProps {
    isOpen: boolean;
    onComplete: () => void;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ isOpen, onComplete }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-violet-50">
                    <div className="flex items-center gap-3">
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

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <button
                        onClick={onComplete}
                        className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl font-medium transition-colors"
                    >
                        Skip for Now
                    </button>
                    <p className="text-xs text-slate-500 text-center mt-2">
                        You can add your API key later in Settings
                    </p>
                </div>
            </div>
        </div>
    );
};
