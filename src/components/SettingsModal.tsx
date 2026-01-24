import React, { useState } from 'react';
import { X, Moon, LogOut, AlertTriangle } from 'lucide-react';

import type { User } from '@supabase/supabase-js';
import { removeSecureItem } from '../utils/secureStorage';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    userTier: 'free' | 'pro' | 'admin';
    isTester: boolean;
    isAdmin: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, userTier, isTester, isAdmin }) => {
    const [confirmReset, setConfirmReset] = useState(false);
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark') || localStorage.getItem('jobfit_theme') === 'dark';
        }
        return false;
    });

    const toggleDarkMode = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        if (newIsDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('jobfit_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('jobfit_theme', 'light');
        }
    };

    const handleReset = () => {
        // Clear all JobFit data
        localStorage.removeItem('jobfit_resumes_v2');
        localStorage.removeItem('jobfit_jobs_history');
        removeSecureItem('api_key'); // Clear encrypted API key
        localStorage.removeItem('gemini_api_key'); // Clear old unencrypted key if it exists
        localStorage.removeItem('jobfit_privacy_accepted');
        localStorage.removeItem('jobfit_daily_usage');
        localStorage.removeItem('jobfit_quota_status');
        localStorage.removeItem('jobfit_theme');
        window.location.reload(); // Force reload to reset state
    };

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900">Settings</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Account Status */}
                    {user && (
                        <div>
                            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Account</h4>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">{user.email}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {isAdmin ? 'Administrator' :
                                            isTester ? 'Beta Tester (Early Access)' :
                                                userTier === 'pro' ? 'Pro Subscriber' : 'Free Plan'}
                                    </div>
                                </div>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${isAdmin ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                    isTester ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                        userTier === 'pro' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                    {isAdmin ? 'Admin' : isTester ? 'Beta' : userTier === 'pro' ? 'Pro' : 'Free'}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="h-px bg-slate-100" />

                    {/* Appearance */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Moon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900">Dark Mode</h4>
                                <p className="text-xs text-slate-500">Adjust the interface theme</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleDarkMode}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Danger Zone */}
                    <div>
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Session & Data</h4>

                        {!confirmReset ? (
                            <button
                                onClick={() => setConfirmReset(true)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors text-left"
                            >
                                <div className="p-2 bg-rose-100 rounded-lg">
                                    <LogOut className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-medium">Reset</h4>
                                    <p className="text-xs opacity-80">Clears all data and keys</p>
                                </div>
                            </button>
                        ) : (
                            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-start gap-3 mb-3">
                                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-rose-700 text-sm">Are you sure?</h4>
                                        <p className="text-xs text-rose-600 mt-1">This will delete all your local resumes, job history, and API keys. This cannot be undone.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleReset}
                                        className="flex-1 bg-rose-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-rose-700 transition-colors"
                                    >
                                        Yes, Clear Everything
                                    </button>
                                    <button
                                        onClick={() => setConfirmReset(false)}
                                        className="flex-1 bg-white border border-rose-200 text-slate-600 py-2 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
