import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

import type { User } from '@supabase/supabase-js';
import { APP_VERSION, STORAGE_KEYS } from '../constants';
import { useModal } from '../contexts/ModalContext';

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
    usageStats?: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, userTier, isTester, isAdmin, simulatedTier, onSimulateTier, usageStats }) => {
    const { openModal } = useModal();
    const [_, setConfirmReset] = useState(false);
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

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-neutral-950/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-500" />

            <div
                className="relative w-full max-w-2xl max-h-[90vh] bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-3xl shadow-[0_32px_128px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_128px_rgba(0,0,0,0.6)] rounded-[3rem] border border-white/50 dark:border-neutral-800/50 flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-500 ease-out"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="px-8 py-7 border-b border-neutral-100 dark:border-neutral-800/60 flex justify-between items-center relative z-10">
                    <div className="flex flex-col">
                        <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Account Settings</h3>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mt-0.5">Profile & Configuration</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-2xl transition-all active:scale-90"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden relative z-10 flex">
                    {/* Left Column: Status & Plan (1/3) */}
                    <div className="w-1/3 border-r border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/20 dark:bg-neutral-900/10 flex flex-col">
                        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                            <section>
                                <h4 className="font-black text-[11px] text-neutral-400 uppercase tracking-[0.2em] mb-8">System Status</h4>
                                <div className="space-y-8">
                                    <div className="flex flex-col">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black uppercase text-neutral-400">Current Plan</span>
                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${userTier === 'pro' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : userTier === 'plus' ? 'bg-blue-500 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                                                }`}>
                                                {userTier}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-xl font-black text-neutral-900 dark:text-white">Analyses</span>
                                            <span className="text-xs font-bold text-neutral-400">{usageStats?.todayAnalyses || 0} / {usageStats?.limit === Infinity ? '∞' : usageStats?.limit || 0}</span>
                                        </div>
                                        <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-800/50 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ${userTier === 'pro' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                style={{ width: `${Math.min(100, ((usageStats?.todayAnalyses || 0) / (usageStats?.limit || 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-neutral-400 uppercase mb-1">Total Impact</span>
                                            <div className="text-2xl font-black text-neutral-900 dark:text-white">{usageStats?.totalAnalyses || 0} <span className="text-[10px] text-neutral-400 ml-1 font-bold">Analyses</span></div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-neutral-400 uppercase mb-1">AI Events</span>
                                            <div className="text-2xl font-black text-neutral-900 dark:text-white">{usageStats?.totalAICalls || 0} <span className="text-[10px] text-neutral-400 ml-1 font-bold">Calls</span></div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="p-10 border-t border-neutral-100 dark:border-neutral-800/60">
                            <button
                                onClick={() => openModal('UPGRADE', { initialView: 'compare' })}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-[1.25rem] transition-all shadow-lg shadow-indigo-500/20 uppercase tracking-[0.15em] flex items-center justify-center gap-2 group"
                            >
                                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                Compare Plans
                            </button>
                        </div>
                    </div>

                    {/* Right Column: General Settings (2/3) */}
                    <div className="flex-1 overflow-y-auto p-12 space-y-16 custom-scrollbar">
                        {/* Account Identification */}
                        <section>
                            <h4 className="font-black text-[11px] text-neutral-400 uppercase tracking-[0.2em] mb-8">Account</h4>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase mb-1 tracking-wider">Identity</span>
                                    <div className="text-sm font-black text-neutral-900 dark:text-white truncate">{user?.email || 'Not Signed In'}</div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    {isAdmin && (
                                        <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-indigo-500 text-white">
                                            Admin
                                        </span>
                                    )}
                                    {isTester && (
                                        <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-purple-500 text-white">
                                            Beta
                                        </span>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Job Automation Section */}
                        <section>
                            <h4 className="font-black text-[11px] text-neutral-400 uppercase tracking-[0.2em] mb-8">Job Ingestion</h4>
                            {userTier === 'pro' || userTier === 'plus' || isAdmin || isTester ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-black uppercase text-neutral-900 dark:text-white">Active Drop Address</span>
                                            </div>
                                            <p className="text-[11px] text-neutral-500 max-w-sm">Forward job alerts here to automatically parse and triage them.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 rounded-2xl px-4 py-3 font-mono text-[11px] font-bold text-neutral-500 dark:text-neutral-400 truncate">
                                            {usageStats?.inboundEmailToken ? `navigator-${usageStats.inboundEmailToken}@inbound.navigator.work` : 'Token initializing...'}
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (usageStats?.inboundEmailToken) {
                                                    navigator.clipboard.writeText(`navigator-${usageStats.inboundEmailToken}@inbound.navigator.work`);
                                                }
                                            }}
                                            className="px-4 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shrink-0"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between group">
                                    <div className="flex flex-col pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Sparkles className="w-3 h-3 text-indigo-600" />
                                            <span className="text-[10px] font-black uppercase text-indigo-600">Premium Feature</span>
                                        </div>
                                        <h5 className="font-black text-xs text-neutral-900 dark:text-white uppercase mb-1">Email Auto-Ingestion</h5>
                                        <p className="text-[10px] text-neutral-500 leading-relaxed font-medium">Forward job alerts to your unique Navigator address.</p>
                                    </div>
                                    <button
                                        onClick={() => openModal('UPGRADE')}
                                        className="px-6 py-3 bg-indigo-600 text-white text-[9px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95"
                                    >
                                        Unlock
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* Admin Simulator */}
                        {isAdmin && (
                            <section>
                                <h4 className="font-black text-[11px] text-neutral-400 uppercase tracking-[0.2em] mb-8">System Diagnostics</h4>
                                <div className="flex flex-col gap-4">
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Simulate Experience</span>
                                    <div className="flex p-1 bg-neutral-100 dark:bg-neutral-900 rounded-2xl gap-1">
                                        {[
                                            { id: null, label: 'Default', color: 'bg-indigo-600' },
                                            { id: 'pro', label: 'Pro', color: 'bg-emerald-600' },
                                            { id: 'free', label: 'Free', color: 'bg-neutral-600' }
                                        ].map((tier) => (
                                            <button
                                                key={tier.label}
                                                onClick={() => onSimulateTier(tier.id as UserTier | null)}
                                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${simulatedTier === tier.id
                                                    ? `${tier.color} text-white shadow-lg`
                                                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                                                    }`}
                                            >
                                                {tier.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Preferences */}
                        <section className="space-y-12">
                            <h4 className="font-black text-[11px] text-neutral-400 uppercase tracking-[0.2em] mb-8">Preferences</h4>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <h5 className="font-black text-xs text-neutral-900 dark:text-white uppercase mb-1">Appearance</h5>
                                        <p className="text-[10px] text-neutral-500 font-medium tracking-tight">System-wide dark mode toggle</p>
                                    </div>
                                    <button
                                        onClick={toggleDarkMode}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${isDark ? 'bg-indigo-600' : 'bg-neutral-200 dark:bg-neutral-800'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="h-px bg-neutral-100 dark:bg-neutral-800/60 w-full" />

                                {user ? (
                                    <div className="flex items-center justify-between group">
                                        <div className="flex flex-col">
                                            <h5 className="font-black text-xs text-rose-600 uppercase mb-1">Session</h5>
                                            <p className="text-[10px] text-neutral-500 font-medium tracking-tight">End current browser session</p>
                                        </div>
                                        <button
                                            onClick={handleSignOut}
                                            className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/10 text-rose-600 text-[10px] font-black rounded-xl uppercase tracking-widest border border-rose-100 dark:border-rose-900/20 hover:bg-rose-600 hover:text-white transition-all"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between group">
                                        <div className="flex flex-col">
                                            <h5 className="font-black text-xs text-rose-600 uppercase mb-1">Danger Zone</h5>
                                            <p className="text-[10px] text-neutral-500 font-medium tracking-tight">Wipe all local persistent data</p>
                                        </div>
                                        <button
                                            onClick={() => setConfirmReset(true)}
                                            className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/10 text-rose-600 text-[10px] font-black rounded-xl uppercase tracking-widest border border-rose-100 dark:border-rose-900/20 hover:bg-rose-600 hover:text-white transition-all"
                                        >
                                            Reset Data
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="px-10 py-5 bg-neutral-50/50 dark:bg-neutral-950/50 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between relative z-20">
                    <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-black uppercase tracking-[0.2em]">
                        Navigator System
                    </p>
                    <p className="text-[9px] text-neutral-400 font-mono px-2 py-0.5 bg-neutral-100 dark:bg-neutral-900 rounded-md">
                        v{APP_VERSION}
                    </p>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e5e5;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #262626;
                }
            `}</style>
        </div>
    );
};
