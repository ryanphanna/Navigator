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
    onUpdateUser?: (updates: { is_admin?: boolean; is_tester?: boolean }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, userTier, isTester, isAdmin, onUpdateUser }) => {
    const [devMode, setDevMode] = useState(false);
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
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
                        </div>
                    </div>

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

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Dev Mode toggle */}
                    <div className="pt-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={devMode}
                                onChange={(e) => setDevMode(e.target.checked)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                            />
                            <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 uppercase tracking-wider transition-colors">Enable Dev Mode</span>
                        </label>

                        {devMode && (
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Support Tools</p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => onUpdateUser?.({ is_admin: !isAdmin })}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                    >
                                        Toggle Admin
                                    </button>
                                    <button
                                        onClick={() => onUpdateUser?.({ is_tester: !isTester })}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                    >
                                        Toggle Beta
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText('JOBFIT2024');
                                            alert('Invite code copied to clipboard!');
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                    >
                                        Copy Invite
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
