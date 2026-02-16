import React from 'react';
import { TrendingUp, Briefcase, LogOut, Settings, Bookmark, Zap, Sparkles, FileText, Users, Target, GraduationCap } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

interface HeaderProps {
    currentView: string;
    isCoachMode: boolean;
    isEduMode: boolean;
    onViewChange: (view: string) => void;
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
    const { user, isLoading } = useUser();

    // Navigation Groups
    const navGroups = [
        {
            id: 'job',
            label: 'Job',
            icon: Briefcase,
            isActive: !isCoachMode && !isEduMode,
            items: [
                { id: 'home', label: 'Analyze', icon: Sparkles },
                { id: 'history', label: 'Vault', icon: Bookmark },
                { id: 'skills', label: 'Skills', icon: Zap },
                { id: 'resumes', label: 'Resumes', icon: FileText }
            ]
        },
        {
            id: 'career',
            label: 'Career',
            icon: Sparkles,
            isActive: isCoachMode,
            items: [
                { id: 'coach-home', label: 'Coach', icon: Sparkles },
                { id: 'coach-role-models', label: 'Models', icon: Users },
                { id: 'coach-gap-analysis', label: 'Gap', icon: Target }
            ]
        },
        {
            id: 'edu',
            label: 'Edu',
            icon: GraduationCap,
            isActive: isEduMode,
            items: [
                { id: 'grad', label: 'Grad HQ', icon: GraduationCap }
            ]
        }
    ];


    return (
        <header className={`fixed top-0 left-0 right-0 backdrop-blur-md border-b z-50 h-14 transition-all duration-500 ease-in-out ${isCoachMode ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30'
            : isEduMode ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30'
                : 'bg-white/90 dark:bg-black/80 border-neutral-200 dark:border-neutral-800'
            }`}>
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between relative">
                {/* Brand Logo */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onViewChange('home')}>
                        <div className={`p-1.5 rounded-xl shadow-lg transition-all duration-500 ${isCoachMode ? 'bg-emerald-500 text-white' : isEduMode ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'}`}>
                            {isCoachMode ? <Sparkles className="w-5 h-5" /> : isEduMode ? <GraduationCap className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                        </div>
                        <span className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 hidden sm:block">
                            {isCoachMode ? 'Career' : isEduMode ? 'Edu' : 'Job'} Navigator
                        </span>
                    </div>
                </div>

                {/* Center Navigation - Expanding Category System */}
                {user && !isLoading && (
                    <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-neutral-100/30 dark:bg-neutral-900/40 p-1 rounded-[2rem] border border-neutral-200/60 dark:border-neutral-800/60 backdrop-blur-md shadow-sm transition-all duration-700">
                        {navGroups.map((group) => (
                            <div
                                key={group.id}
                                className={`flex items-center transition-all duration-500 ease-in-out px-1 ${group.isActive ? 'bg-white dark:bg-neutral-800 shadow-sm rounded-2xl' : ''}`}
                            >
                                {/* Category Button */}
                                <button
                                    onClick={() => onViewChange(group.items[0].id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 ${group.isActive ? (group.id === 'career' ? 'text-emerald-600' : group.id === 'edu' ? 'text-amber-600' : 'text-indigo-600') : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
                                >
                                    <group.icon className="w-3.5 h-3.5" />
                                    <span>{group.label}</span>
                                </button>

                                {/* Inline Sub-items (Expand Right of the Active Category) */}
                                {group.isActive && (
                                    <div className="flex items-center gap-1.5 animate-in slide-in-from-left-2 fade-in duration-500 overflow-hidden pr-2 ml-1 border-l border-neutral-100 dark:border-neutral-700 pl-2">
                                        {group.items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => onViewChange(item.id)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${currentView === item.id ? (group.id === 'career' ? 'bg-emerald-500 text-white' : group.id === 'edu' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white') : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                )}

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    {!isLoading && !user ? (
                        <button onClick={onShowAuth} className="px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-black rounded-xl hover:scale-105 active:scale-95 transition-all">Sign In</button>
                    ) : (
                        <button onClick={onSignOut} className="flex items-center gap-2 px-3 py-1.5 text-xs font-black rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all text-neutral-600 dark:text-neutral-400">
                            <LogOut className="w-4 h-4" />
                            <span className="hidden md:inline">Exit</span>
                        </button>
                    )}
                    <button onClick={onShowSettings} className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
};
