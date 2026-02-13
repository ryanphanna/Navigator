import React, { useState } from 'react';
import { X, Moon, LogOut, AlertTriangle, Eye } from 'lucide-react';
import { EventService } from '../services/eventService';

import type { User } from '@supabase/supabase-js';
import { removeSecureItem } from '../utils/secureStorage';
import { APP_VERSION, STORAGE_KEYS } from '../constants';

import type { UserTier } from '../types/app';

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
            return document.documentElement.classList.contains('dark') || localStorage.getItem(STORAGE_KEYS.THEME) === 'dark';
        }
        return false;
    });

    // Sync dark mode state with document class
    React.useEffect(() => {
        const checkDark = () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            setIsDark(isDarkMode);
        };

        checkDark();

        // Optional: Listen for class changes if needed, but for now just sync on mount and toggle
    }, []);

    const toggleDarkMode = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        if (newIsDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem(STORAGE_KEYS.THEME, 'light');
        }
    };

    const handleSignOut = async () => {
        const { Storage } = await import('../services/storageService');
        await Storage.signOut();
        window.location.reload();
    };

    const handleReset = () => {
        // Clear all JobFit data
        localStorage.removeItem(STORAGE_KEYS.RESUMES);
        localStorage.removeItem(STORAGE_KEYS.JOBS_HISTORY);
        removeSecureItem(STORAGE_KEYS.API_KEY); // Clear encrypted API key
        localStorage.removeItem('gemini_api_key'); // Clear old unencrypted key if it exists
        localStorage.removeItem(STORAGE_KEYS.PRIVACY_ACCEPTED);
        localStorage.removeItem(STORAGE_KEYS.DAILY_USAGE);
        localStorage.removeItem(STORAGE_KEYS.QUOTA_STATUS);
        localStorage.removeItem(STORAGE_KEYS.THEME);
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
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-neutral-200 dark:border-neutral-800" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
                    <h3 className="font-bold text-neutral-900 dark:text-white">Settings</h3>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    <div>
                        <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-wider mb-4">Account</h4>
                        <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-4">
                            {user && (
                                <>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate max-w-[150px]">{user?.email}</div>
                                        <div className="flex gap-1.5">
                                            {isAdmin && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800 shadow-sm">
                                                    Admin
                                                </span>
                                            )}
                                            {isTester && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/50 dark:text-purple-400 dark:border-purple-800">
                                                    Beta
                                                </span>
                                            )}
                                            {userTier === 'pro' && !isAdmin && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800">
                                                    Pro
                                                </span>
                                            )}
                                            {userTier === 'free' && !isAdmin && !isTester && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-neutral-50 text-neutral-600 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
                                                    Free
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-neutral-500 font-medium leading-relaxed">
                                        {isAdmin && isTester ? "Full system access with beta features enabled." :
                                            isAdmin ? "System administrator access enabled." :
                                                isTester ? "Early access to new features enabled." :
                                                    "Standard account access."}
                                    </div>
                                </>
                            )}
                            {!user && (
                                <div className="text-center py-2">
                                    <p className="text-xs text-neutral-500 leading-relaxed">
                                        Sign in via the header to sync your data and access Pro features.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Admin-only: Feature Stats */}
                    {isAdmin && (
                        <>
                            <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
                            <div>
                                <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                                    Feature Usage
                                    <span className="text-[8px] font-mono text-neutral-300">Local Only</span>
                                </h4>
                                <div className="space-y-3">
                                    {(() => {
                                        const stats = EventService.getFeatureStats();
                                        const allStats = Object.values(stats);
                                        const totalInterest = allStats.reduce((a, b) => a + (b.interest || 0), 0);
                                        const totalUsage = allStats.reduce((a, b) => a + (b.usage || 0), 0);

                                        if (totalInterest === 0 && totalUsage === 0) {
                                            return <p className="text-[10px] text-neutral-400 italic">No usage recorded yet.</p>;
                                        }

                                        return Object.entries(stats).sort((a, b) => b[1].interest - a[1].interest).map(([id, s]) => {
                                            const conversionRate = s.interest > 0 ? Math.round((s.usage / s.interest) * 100) : 0;

                                            return (
                                                <div key={id} className="space-y-2 p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-100 dark:border-neutral-700/30">
                                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                                        <span className="text-neutral-600 dark:text-neutral-400 uppercase tracking-tight">{id}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-neutral-400">CLK: <span className="text-neutral-900 dark:text-white">{s.interest}</span></span>
                                                            <span className="text-neutral-400">ACT: <span className="text-indigo-600 dark:text-indigo-400">{s.usage}</span></span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${conversionRate}%` }} />
                                                        </div>
                                                        <span className="text-[9px] font-black text-neutral-400 w-8 text-right">{conversionRate}%</span>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

                    {/* Admin-only: View As Different User Type */}
                    {isAdmin && (
                        <>
                            <div>
                                <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Eye className="w-3 h-3" />
                                    View As (Admin Only)
                                </h4>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onSimulateTier(null)}
                                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${simulatedTier === null
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                            }`}
                                    >
                                        Admin
                                    </button>
                                    <button
                                        onClick={() => onSimulateTier('pro')}
                                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${simulatedTier === 'pro'
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                            }`}
                                    >
                                        Pro
                                    </button>
                                    <button
                                        onClick={() => onSimulateTier('free')}
                                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${simulatedTier === 'free'
                                            ? 'bg-neutral-600 text-white shadow-sm'
                                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
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
                            <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
                        </>
                    )}

                    <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

                    {/* Appearance */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <Moon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">Dark Mode</h4>
                                <p className="text-[10px] text-neutral-500">Adjust the interface theme</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleDarkMode}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? 'bg-indigo-600' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

                    {/* Session & Data */}
                    <div>
                        <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-wider mb-4">Session</h4>

                        {user ? (
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-300 transition-colors text-left"
                            >
                                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                                    <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Sign Out</h4>
                                    <p className="text-[10px] opacity-80 font-medium">Log out of your account</p>
                                </div>
                            </button>
                        ) : (
                            !confirmReset ? (
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
                                            className="flex-1 bg-white dark:bg-neutral-800 border border-rose-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 py-2 rounded-xl text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
                <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 text-center">
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                        JobFit v{APP_VERSION}
                    </p>
                </div>
            </div>
        </div>
    );
};
