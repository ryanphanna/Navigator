import React from 'react';
import { X, Lock, Copy, Check, Star, Puzzle, Mail, Activity, ArrowRight } from 'lucide-react';

import type { User } from '@supabase/supabase-js';
import { APP_VERSION } from '../constants';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../services/supabase';

import type { UserTier } from '../types/app';
import { Button } from './ui/Button';

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

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, userTier, isTester, isAdmin, simulatedTier, usageStats }) => {
    const { openModal } = useModal();
    const { showInfo, showError } = useToast();
    const [isCopyingToken, setIsCopyingToken] = React.useState(false);
    const [isCopyingEmail, setIsCopyingEmail] = React.useState(false);

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

    const handleResetPassword = async () => {
        if (user?.email) {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: window.location.origin + '/reset-password',
            });
            if (error) {
                showError(error.message);
            } else {
                showInfo("Password reset email sent!");
            }
        }
    };

    const handleCopyToken = async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
            navigator.clipboard.writeText(data.session.access_token);
            setIsCopyingToken(true);
            setTimeout(() => setIsCopyingToken(false), 2000);
        }
    };

    const handleCopyEmail = () => {
        const email = `navigator-${usageStats?.inboundEmailToken || 'admin'}@inbound.navigator.work`;
        navigator.clipboard.writeText(email);
        setIsCopyingEmail(true);
        setTimeout(() => setIsCopyingEmail(false), 2000);
    };

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
                    <div className="flex flex-col p-8 pb-12 md:pb-8 bg-neutral-50/30 dark:bg-neutral-900/10 overflow-y-auto custom-scrollbar">
                        <div className="space-y-8">
                            <div>
                                <h4 className="font-bold text-[11px] text-neutral-400 uppercase tracking-widest mb-6">Account</h4>
                                <div className="flex flex-col gap-1 mb-4">
                                    <div className="text-sm font-bold text-neutral-900 dark:text-white truncate">{user?.email || 'Not Signed In'}</div>
                                    <div className="flex gap-2 mt-2">
                                        {isAdmin && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
                                                Admin
                                            </span>
                                        )}
                                        {isTester && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
                                                Early Access
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 items-start mt-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResetPassword}
                                        icon={<Lock className="w-3.5 h-3.5" />}
                                        className="!px-0 !justify-start !text-neutral-500 hover:!text-neutral-900 dark:hover:!text-white"
                                    >
                                        Change Password
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Plan & Usage */}
                    <div className="flex flex-col p-8 pb-12 md:pb-8 bg-white dark:bg-[#0a0a0a]">
                        <div className="flex-1 space-y-8">
                            <div>
                                <h4 className="font-bold text-[11px] text-neutral-400 uppercase tracking-widest mb-6">Plan & Usage</h4>

                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Star className="w-3 h-3 text-amber-500" />
                                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Current Plan</span>
                                        </div>
                                        <span className="text-sm font-bold text-neutral-900 dark:text-white capitalize">
                                            {simulatedTier ?
                                                (simulatedTier === 'free' ? 'Explorer' : (simulatedTier === 'plus' ? 'Plus' : 'Pro')) :
                                                (userTier === 'free' ? 'Explorer' : (userTier === 'plus' ? 'Plus' : 'Pro'))
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Jobs Analyzed */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-3 h-3 text-emerald-500" />
                                                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                                    Jobs Analyzed {usageStats?.analysisPeriod === 'weekly' ? '(this week)' : usageStats?.analysisPeriod === 'lifetime' ? '(total)' : '(today)'}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold text-neutral-900 dark:text-white">
                                                {(usageStats?.analysisPeriod === 'weekly' ? usageStats?.weekAnalyses : usageStats?.todayAnalyses) || 0} <span className="text-neutral-300 dark:text-neutral-600 font-normal">/ {usageStats?.analysisLimit === Infinity || ((isAdmin || isTester) && !simulatedTier) ? '∞' : usageStats?.analysisLimit || 0}</span>
                                            </span>
                                        </div>

                                        <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-1000"
                                                style={{ width: `${(isAdmin || isTester) && !simulatedTier ? 0 : Math.min(100, ((usageStats?.analysisPeriod === 'weekly' ? usageStats?.weekAnalyses : usageStats?.todayAnalyses) || 0) / (usageStats?.analysisLimit || 1) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Inbound Emails (Gate 1) */}
                                    {usageStats?.emailLimit > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-3 h-3 text-indigo-500" />
                                                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Inbound Emails</span>
                                                </div>
                                                <span className="text-sm font-bold text-neutral-900 dark:text-white">
                                                    {usageStats?.todayEmails || 0} <span className="text-neutral-300 dark:text-neutral-600 font-normal">/ {(isAdmin || isTester) && !simulatedTier ? '∞' : usageStats?.emailLimit}</span>
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 transition-all duration-1000"
                                                    style={{ width: `${(isAdmin || isTester) && !simulatedTier ? 0 : Math.min(100, ((usageStats?.todayEmails || 0) / (usageStats?.emailLimit || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}



                                </div>
                            </div>
                        </div>

                        {userTier !== 'pro' && !isAdmin && (
                            <div className="pt-8 mt-auto">
                                <Button
                                    variant="premium"
                                    className="w-full"
                                    onClick={() => {
                                        onClose();
                                        window.dispatchEvent(new CustomEvent('navigate-to-plans'));
                                    }}
                                    icon={<ArrowRight className="w-4 h-4" />}
                                >
                                    Upgrade & View Plans
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Column 3: Integrations */}
                    <div className="flex flex-col p-8 pb-12 md:pb-8 bg-neutral-50/30 dark:bg-neutral-900/10 overflow-y-auto custom-scrollbar">
                        <h4 className="font-bold text-[11px] text-neutral-400 uppercase tracking-widest mb-6">Integrations</h4>

                        <div className="space-y-8">
                            {/* Browser Extension */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Puzzle className="w-3 h-3 text-blue-500" />
                                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Browser Extension</span>
                                </div>
                                <p className="text-[10px] text-neutral-500 leading-relaxed">
                                    Save jobs from anywhere using our browser extension.
                                </p>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCopyToken}
                                    icon={isCopyingToken ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    className="!px-0 !justify-start !text-neutral-900 dark:!text-white hover:!text-neutral-600 dark:hover:!text-neutral-300"
                                >
                                    {isCopyingToken ? 'Copied Token!' : 'Copy Access Token'}
                                </Button>
                            </div>

                            <div className="h-px bg-neutral-100 dark:bg-neutral-800/50 w-full" />

                            {/* Email Alerts */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Mail className="w-3 h-3 text-indigo-500" />
                                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Email Alerts</span>
                                </div>
                                <p className="text-[10px] text-neutral-500 leading-relaxed">
                                    Email jobs to your unique address and we'll process them automatically.
                                </p>

                                {(usageStats?.inboundEmailToken || isAdmin || isTester) ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopyEmail}
                                        icon={isCopyingEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        className="!px-0 !justify-start !text-neutral-900 dark:!text-white hover:!text-neutral-600 dark:hover:!text-neutral-300"
                                    >
                                        {isCopyingEmail ? 'Copied Address!' : 'Copy Email Address'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openModal('UPGRADE')}
                                        className="!px-0 !justify-start !text-indigo-600 dark:!text-indigo-400 hover:!underline"
                                    >
                                        Upgrade to unlock
                                    </Button>
                                )}
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
