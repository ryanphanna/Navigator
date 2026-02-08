import React, { useState } from 'react';
import { X, Moon, LogOut, AlertTriangle, Eye } from 'lucide-react';

import type { User } from '@supabase/supabase-js';
import { removeSecureItem } from '../utils/secureStorage';
import { version } from '../../package.json';

type UserTier = 'free' | 'pro' | 'admin';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    userTier: UserTier;
    isTester: boolean;
    isAdmin: boolean;
    simulatedTier: UserTier | null;
    onSimulateTier: (tier: UserTier | null) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, userTier, isTester, isAdmin, simulatedTier, onSimulateTier }) => {
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-slate-900 dark:text-white">Settings</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    <div>
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Account</h4>
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                            {user && (
                                <>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">{user?.email}</div>
                                        <div className="flex gap-1.5">
                                            {isAdmin && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white shadow-sm">
                                                    Admin
                                                </span>
                                            )}
                                            {isTester && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/50 dark:text-purple-400 dark:border-purple-800">
                                                    Beta
                                                </span>
                                            )}
                                            {userTier === 'pro' && !isAdmin && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800">
                                                    Pro
                                                </span>
                                            )}
                                            {userTier === 'free' && !isAdmin && !isTester && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                                    Free
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                        {isAdmin && isTester ? "Full system access with beta features enabled." :
                                            isAdmin ? "System administrator access enabled." :
                                                isTester ? "Early access to new features enabled." :
                                                    "Standard account access."}
                                    </div>
                                </>
                            )}
                            {!user && (
                                <div className="text-center py-2">
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Sign in via the header to sync your data and access Pro features.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Admin-only: View As Different User Type */}
                    {isAdmin && (
                        <>
                            <div className="h-px bg-slate-100 dark:bg-slate-800" />
                            <div>
                                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Eye className="w-3 h-3" />
                                    View As (Admin Only)
                                </h4>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onSimulateTier(null)}
                                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${simulatedTier === null
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        Admin
                                    </button>
                                    <button
                                        onClick={() => onSimulateTier('pro')}
                                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${simulatedTier === 'pro'
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        Pro
                                    </button>
                                    <button
                                        onClick={() => onSimulateTier('free')}
                                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${simulatedTier === 'free'
                                            ? 'bg-slate-600 text-white shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        Free
                                    </button>
                                </div>
                                {simulatedTier && (
                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
                                        ⚠️ Viewing as {simulatedTier.toUpperCase()} user (visual only)
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Appearance */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <Moon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Dark Mode</h4>
                                <p className="text-[10px] text-slate-500">Adjust the interface theme</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleDarkMode}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Session & Data */}
                    <div>
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Session & Data</h4>

                        {!confirmReset ? (
                            <button
                                onClick={() => setConfirmReset(true)}
                                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/10 text-rose-600 transition-colors text-left"
                            >
                                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                                    <LogOut className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Reset</h4>
                                    <p className="text-[10px] opacity-80 font-medium">Clears all data and keys</p>
                                </div>
                            </button>
                        ) : (
                            <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/50 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-start gap-3 mb-3">
                                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-rose-700 dark:text-rose-500 text-sm">Are you sure?</h4>
                                        <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-medium leading-relaxed">This will delete all your local resumes, job history, and API keys. This cannot be undone.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleReset}
                                        className="flex-1 bg-rose-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
                                    >
                                        Yes, Clear
                                    </button>
                                    <button
                                        onClick={() => setConfirmReset(false)}
                                        className="flex-1 bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        JobFit v{version}
                    </p>
                </div>
            </div>
        </div>
    );
};
