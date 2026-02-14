import React from 'react';
import { TrendingUp, Briefcase, LogOut, Settings, Bookmark, Zap, Sparkles } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

interface HeaderProps {
    currentView: string;
    isCoachMode: boolean;
    isEduMode: boolean;
    onViewChange: (view: any) => void;
    onSignOut: () => void;
    onShowSettings: () => void;
    onShowAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    currentView,
    isCoachMode,
    isEduMode,
    onViewChange,
    onSignOut,
    onShowSettings,
    onShowAuth
}) => {
    const { user, isAdmin, isTester, isLoading } = useUser();

    return (
        <header className={`fixed top-0 left-0 right-0 backdrop-blur-md border-b z-50 h-12 transition-all duration-500 ${isCoachMode ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30'
            : isEduMode ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30'
                : 'bg-white/80 dark:bg-neutral-900/80 border-neutral-200 dark:border-neutral-800'
            }`}>
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between relative">
                {/* Brand Logo */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onViewChange('home')}>
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-white dark:to-neutral-300 hidden sm:block">
                            Navigator
                        </span>
                    </div>
                </div>

                {/* Center Navigation */}
                {user && !isLoading && (
                    <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-neutral-100/50 dark:bg-neutral-800/50 p-0.5 rounded-full border border-neutral-200/50 dark:border-neutral-700/50 transition-all duration-500 ease-in-out shadow-sm h-8 overflow-x-auto no-scrollbar max-w-[calc(100vw-200px)]">
                        {[
                            { id: 'job-fit', label: 'Job', icon: Briefcase },
                            { id: 'history', label: 'History', icon: Bookmark },
                            { id: 'skills', label: 'Skills', icon: Zap },
                            ...((isAdmin || isTester) ? [{ id: 'coach-home', label: 'Coach', icon: Sparkles }] : [])
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                className={`relative z-10 px-3 h-full rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${currentView === item.id ? 'text-indigo-600 bg-white dark:bg-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                            >
                                <item.icon className="w-3 h-3" />
                                <span className="hidden xs:inline">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                )}

                {/* Right Actions */}
                <div className="flex items-center gap-1.5">
                    {!isLoading && !user ? (
                        <button onClick={onShowAuth} className="px-3 py-1 text-xs font-semibold rounded-full">Sign In</button>
                    ) : (
                        <button onClick={onSignOut} className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full group">
                            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                            <span>Log Out</span>
                        </button>
                    )}
                    <button onClick={onShowSettings} className="p-1.5 text-neutral-400 hover:bg-neutral-100 rounded-full transition-all">
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
};
