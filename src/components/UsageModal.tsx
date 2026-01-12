import React, { useEffect, useState } from 'react';
import { X, Activity, Server, Zap, AlertTriangle, Key, Loader2, Check, AlertCircle as AlertIcon, Eye, EyeOff } from 'lucide-react';
import { validateApiKey } from '../services/geminiService';

interface UsageModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiStatus: 'ok' | 'checking' | 'error';
    quotaStatus: 'normal' | 'high_traffic' | 'daily_limit';
    cooldownSeconds: number;
}

export const UsageModal: React.FC<UsageModalProps> = ({ isOpen, onClose, apiStatus, quotaStatus, cooldownSeconds }) => {
    // API Key State
    const [apiKey, setApiKey] = useState(() => {
        return isOpen ? (localStorage.getItem('gemini_api_key') || '') : '';
    });
    const [showKey, setShowKey] = useState(false);
    const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [dailyUsage, setDailyUsage] = useState(0);

    useEffect(() => {
        if (isOpen) {
            // Load key if not already loaded by lazy init (lazy init runs once per mount, but modal might be unmounted? No, likely conditionally rendered or hidden)
            // If component is always mounted but hidden, lazy init only runs once. 
            // We should rely on effect for updates if isOpen changes, but avoid immediate set if unnecessary.

            const storedKey = localStorage.getItem('gemini_api_key');
            if (storedKey && storedKey !== apiKey) {
                setTimeout(() => setApiKey(storedKey), 0);
            }
            if (storedKey) {
                // If we have a key, we can assume status is idle or valid?
                // setStatus('idle'); // status default is idle
            }

            // Load daily usage
            try {
                const usageData = JSON.parse(localStorage.getItem('jobfit_daily_usage') || '{}');
                const today = new Date().toISOString().split('T')[0];
                if (usageData.date === today) {
                    setTimeout(() => setDailyUsage(usageData.count || 0), 0);
                } else {
                    setTimeout(() => setDailyUsage(0), 0);
                }
            } catch {
                setTimeout(() => setDailyUsage(0), 0);
            }
        }
    }, [isOpen, apiKey]);

    const handleSaveKey = async () => {
        if (!apiKey.trim()) {
            setMessage('Please enter a valid API Key');
            setStatus('error');
            return;
        }

        setStatus('validating');
        setMessage('Verifying key works...');

        const result = await validateApiKey(apiKey.trim());

        if (result.isValid) {
            localStorage.setItem('gemini_api_key', apiKey);
            if (result.error) {
                setStatus('success'); // Still success
                setMessage(result.error);
            } else {
                setStatus('success');
                setMessage('Key verified & saved');
            }
            // Clear message after delay
            setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 3000);
        } else {
            setStatus('error');
            setMessage(result.error || 'Invalid API Key');
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        System Status
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* API Connection & Key Management */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Server className={`w-4 h-4 ${apiStatus === 'ok' ? 'text-emerald-500' : 'text-slate-400'}`} />
                            <h4 className="font-medium text-slate-900 text-sm">API Connection</h4>
                        </div>

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
                                className={`w-full pl-9 pr-20 py-2 rounded-lg border text-sm font-mono transition-all outline-none focus:ring-2
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

                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-slate-400 hover:text-indigo-600 hover:underline block text-right"
                        >
                            Get free key ↗
                        </a>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Model Info */}
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-violet-100 text-violet-600">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-medium text-slate-900">Active Model</h4>
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-slate-500">gemini-2.0-flash</p>
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">
                                    {dailyUsage} requests
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Optimized for speed & free tier</p>
                        </div>
                    </div>

                    {/* Quota Status */}
                    <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${quotaStatus === 'normal' ? 'bg-blue-100 text-blue-600' :
                            quotaStatus === 'daily_limit' ? 'bg-red-100 text-red-600' :
                                'bg-orange-100 text-orange-600'
                            }`}>
                            {quotaStatus === 'normal' ? <Activity className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div>
                            <h4 className="font-medium text-slate-900">Traffic & Quota</h4>
                            <p className="text-sm text-slate-500">
                                {quotaStatus === 'normal' && 'Operating within normal limits'}
                                {quotaStatus === 'high_traffic' && `High traffic detected (Retry in ${cooldownSeconds}s)`}
                                {quotaStatus === 'daily_limit' && 'Daily Free Tier Limit Reached'}
                            </p>
                            {quotaStatus === 'high_traffic' && (
                                <p className="text-xs text-orange-600 mt-1 font-medium">Auto-queue active (Cooling down)</p>
                            )}
                            {quotaStatus === 'daily_limit' && (
                                <p className="text-xs text-red-600 mt-1 font-medium">Quota resets at midnight PT. Try another key.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 px-6 py-3 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                        Version 1.2.0 • Local Storage Only
                    </p>
                </div>
            </div>
        </div>
    );
};
