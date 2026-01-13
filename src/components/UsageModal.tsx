import React, { useEffect, useState } from 'react';
import { X, Activity, Server, Zap, AlertTriangle } from 'lucide-react';
import { ApiKeyInput } from './ApiKeyInput';

interface UsageModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiStatus: 'ok' | 'checking' | 'error';
    quotaStatus: 'normal' | 'high_traffic' | 'daily_limit';
    cooldownSeconds: number;
}

export const UsageModal: React.FC<UsageModalProps> = ({ isOpen, onClose, apiStatus, quotaStatus, cooldownSeconds }) => {
    const [dailyUsage, setDailyUsage] = useState(0);

    useEffect(() => {
        if (isOpen) {
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
    }, [isOpen]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        System Usage
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

                        <ApiKeyInput />
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
                            <p className="text-[10px] text-slate-400 mt-1">
                                Free Tier: 1,500 requests / day.<br />
                                Paid Tier: Higher limits available via Google AI Studio.
                            </p>
                            {quotaStatus === 'high_traffic' && (
                                <p className="text-xs text-orange-600 mt-1 font-medium">Auto-queue active (Cooling down)</p>
                            )}
                            {quotaStatus === 'daily_limit' && (
                                <p className="text-xs text-red-600 mt-1 font-medium">Quota resets at midnight PT. Try another key.</p>
                            )}
                        </div>
                    </div>

                    {/* Clear Quota Status Button - only show if there's a quota issue */}
                    {quotaStatus !== 'normal' && (
                        <>
                            <div className="h-px bg-slate-100" />
                            <button
                                onClick={() => {
                                    localStorage.removeItem('jobfit_quota_status');
                                    window.dispatchEvent(new CustomEvent('quotaStatusCleared'));
                                }}
                                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors text-sm font-medium"
                            >
                                <Activity className="w-4 h-4" />
                                Clear Quota Status
                            </button>
                        </>
                    )}
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
