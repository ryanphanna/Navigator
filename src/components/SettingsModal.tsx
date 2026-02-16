import React, { useState } from 'react';
import { X } from 'lucide-react';

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
            <div className="absolute inset-0 bg-neutral-950/40 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-500" />

            <div
                className="relative w-full max-w-4xl max-h-[90vh] bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-3xl shadow-[0_32px_128px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_160px_rgba(0,0,0,0.8)] rounded-3xl border border-white/50 dark:border-neutral-800/50 flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-500 ease-out"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="px-8 py-6 flex justify-between items-center relative z-10 shrink-0 border-b border-neutral-100/50 dark:border-neutral-800/50">
                    <div className="flex flex-col">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">Settings</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-all active:scale-90"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden relative z-10 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-100 dark:divide-neutral-800">

                    {/* Column 1: Account */}
                    <div className="flex flex-col p-8 bg-neutral-50/30 dark:bg-neutral-900/10">
                        <div className="flex-1 space-y-8">
                            <div>
                                <h4 className="font-bold text-[11px] text-neutral-400 uppercase tracking-widest mb-6">Account</h4>
                                <div className="flex flex-col gap-1">
                                    <div className="text-sm font-bold text-neutral-900 dark:text-white truncate">{user?.email || 'Not Signed In'}</div>
                                    <div className="flex gap-2 mt-2">
                                        {isAdmin && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
                                                Admin
                                            </span>
                                        )}
                                        {isTester && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
                                                Beta
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 mt-auto border-t border-neutral-100 dark:border-neutral-800/50">
                            {user ? (
                                <button
                                    onClick={handleSignOut}
                                    className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors"
                                >
                                    Sign Out
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {/* Column 2: Plan & Usage */}
                    <div className="flex flex-col p-8">
                        <div className="flex-1 space-y-8">
                            <div>
                                <h4 className="font-bold text-[11px] text-neutral-400 uppercase tracking-widest mb-6">Plan & Usage</h4>

                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Current Plan</span>
                                        <span className="text-sm font-bold text-neutral-900 dark:text-white capitalize">
                                            {userTier}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-semibold text-neutral-500">Analyses used</span>
                                        <span className="text-sm font-bold text-neutral-900 dark:text-white">
                                            {usageStats?.todayAnalyses || 0} <span className="text-neutral-300 dark:text-neutral-600 font-normal">/ {usageStats?.limit === Infinity ? '∞' : usageStats?.limit || 0}</span>
                                        </span>
                                    </div>

                                    {/* Visual Progress Bar */}
                                    <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${userTier === 'pro' ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-900 dark:bg-white'}`}
                                            style={{ width: `${Math.min(100, ((usageStats?.todayAnalyses || 0) / (usageStats?.limit || 1)) * 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-neutral-400 pt-1">
                                        <span className="text-neutral-900 dark:text-white font-bold">{usageStats?.totalAnalyses || 0}</span> analyses created total
                                    </p>
                                </div>
                            </div>
                        </div>

                        {userTier !== 'pro' && !isAdmin && (
                            <div className="pt-8 mt-auto">
                                <button
                                    onClick={() => openModal('UPGRADE', { initialView: 'compare' })}
                                    className="w-full py-3 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-bold rounded-xl transition-all shadow-lg shadow-neutral-500/10 flex items-center justify-center gap-2"
                                >
                                    Upgrade to Pro
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Column 3: Settings */}
                    <div className="flex flex-col p-8 bg-neutral-50/30 dark:bg-neutral-900/10 overflow-y-auto custom-scrollbar">
                        <h4 className="font-bold text-[11px] text-neutral-400 uppercase tracking-widest mb-6">Settings</h4>

                        <div className="space-y-8">
                            {/* Appearance */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Dark Mode</span>
                                <button
                                    onClick={toggleDarkMode}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${isDark ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                                >
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-black shadow-sm transition-transform duration-300 ${isDark ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                                </button>
                            </div>

                            <div className="h-px bg-neutral-100 dark:bg-neutral-800/50 w-full" />

                            {/* Job Ingestion */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Job Alerts</span>
                                </div>
                                <p className="text-[10px] text-neutral-500 leading-relaxed">
                                    Send job emails here to auto-save them.
                                </p>

                                {userTier === 'pro' || userTier === 'plus' || isAdmin || isTester ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                                            <p className="font-mono text-[10px] text-neutral-500 truncate select-all">
                                                {usageStats?.inboundEmailToken ? `navigator-${usageStats.inboundEmailToken}@...` : 'Initializing...'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (usageStats?.inboundEmailToken) {
                                                    navigator.clipboard.writeText(`navigator-${usageStats.inboundEmailToken}@inbound.navigator.work`);
                                                }
                                            }}
                                            className="text-[10px] font-bold text-neutral-900 dark:text-white hover:text-neutral-600 dark:hover:text-neutral-300 w-full text-left"
                                        >
                                            Copy Address
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => openModal('UPGRADE')}
                                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline w-full text-left"
                                    >
                                        Upgrade to unlock
                                    </button>
                                )}
                            </div>

                            {/* Admin Simulator */}
                            {isAdmin && (
                                <>
                                    <div className="h-px bg-neutral-100 dark:bg-neutral-800/50 w-full" />
                                    <div className="space-y-3 opacity-50 hover:opacity-100 transition-opacity">
                                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Developer Mode</span>
                                        <div className="grid grid-cols-3 gap-1">
                                            {[
                                                { id: null, label: 'Default' },
                                                { id: 'pro', label: 'Pro' },
                                                { id: 'free', label: 'Free' }
                                            ].map((tier) => (
                                                <button
                                                    key={tier.label}
                                                    onClick={() => onSimulateTier(tier.id as UserTier | null)}
                                                    className={`py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${simulatedTier === tier.id
                                                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                                                        }`}
                                                >
                                                    {tier.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="h-px bg-neutral-100 dark:bg-neutral-800/50 w-full" />

                            {/* Danger Zone */}
                            <div className="pt-1">
                                <button
                                    onClick={() => setConfirmReset(true)}
                                    className="text-[11px] font-medium text-neutral-400 hover:text-rose-500 transition-colors"
                                >
                                    Reset Local Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="px-8 py-4 bg-neutral-50/50 dark:bg-neutral-950/30 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between relative z-20">
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-600 font-medium">
                        Navigator System v{APP_VERSION}
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
