import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Loader2, Check, AlertCircle as AlertIcon, X } from 'lucide-react';

export const ApiKeyInput: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Load initially
        const stored = localStorage.getItem('gemini_api_key');
        if (stored) setApiKey(stored);
    }, []);

    const handleSaveKey = async () => {
        if (!apiKey.trim()) {
            setMessage('Please enter a valid API Key');
            setStatus('error');
            return;
        }

        setStatus('validating');
        setMessage('Saving key...');

        // Save the key without validation - first real use will validate it
        localStorage.setItem('gemini_api_key', apiKey);

        // Clear any existing quota/limit errors so the user is unblocked immediately
        localStorage.removeItem('jobfit_quota_status');
        // We also clear daily usage stats to give the new key a fresh start locally
        localStorage.removeItem('jobfit_daily_usage');

        // Dispatch a custom event to notify App.tsx to re-check quota status immediately
        window.dispatchEvent(new CustomEvent('quotaStatusCleared'));

        // Dispatch event to close the API key setup modal if it's open
        window.dispatchEvent(new CustomEvent('apiKeySaved'));

        setStatus('success');
        setMessage('Key saved successfully');

        setTimeout(() => {
            setStatus('idle');
            setMessage('');
        }, 3000);
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => {
                        setApiKey(e.target.value);
                        setStatus('idle');
                        setMessage('');
                    }}
                    placeholder="Paste Gemini API Key..."
                    className={`w-full pl-9 pr-32 py-2 rounded-lg border text-sm font-mono transition-all outline-none focus:ring-2
                        ${status === 'error'
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50'
                            : status === 'success'
                                ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 bg-emerald-50'
                                : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                        } `}
                />
                <div className="absolute left-2.5 top-2.5 text-slate-400">
                    <Key className="w-4 h-4" />
                </div>

                <div className="absolute right-1 top-1 bottom-1 flex gap-1">
                    {apiKey && (
                        <button
                            onClick={() => {
                                setApiKey('');
                                setStatus('idle');
                                setMessage('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                            title="Clear Key"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    {apiKey && (
                        <button
                            onClick={() => setShowKey(!showKey)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                        >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    )}
                    <button
                        onClick={handleSaveKey}
                        disabled={status === 'validating' || !apiKey}
                        className={`px-3 flex items-center justify-center rounded-md font-medium text-xs transition-all
                            ${status === 'success'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                            } `}
                    >
                        {status === 'validating' ? <Loader2 className="w-3 h-3 animate-spin" /> : status === 'success' ? <Check className="w-3 h-3" /> : 'Save'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`text-xs flex items-center gap-1.5 
                    ${status === 'error' ? 'text-rose-600' : 'text-emerald-600'} `}>
                    {status === 'error' ? <AlertIcon className="w-3 h-3" /> : status === 'success' ? <Check className="w-3 h-3" /> : null}
                    {message}
                </div>
            )}
        </div>
    );
};
