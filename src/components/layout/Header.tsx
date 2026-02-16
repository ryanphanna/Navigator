import React from 'react';
import { TrendingUp, Briefcase, LogOut, Settings, Bookmark, Zap, Sparkles, FileText, Users, Target, GraduationCap, ShieldCheck, BookOpen, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../contexts/UserContext';
import { useModal } from '../../contexts/ModalContext';
import { useGlobalUI } from '../../contexts/GlobalUIContext';

interface HeaderProps {
    currentView: string;
    isCoachMode: boolean;
    isEduMode: boolean;
    onViewChange: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
    currentView,
    isCoachMode,
    isEduMode,
    onViewChange
}) => {
    const { user, isLoading, isAdmin, signOut } = useUser();
    const { openModal } = useModal();
    const { isDark, toggleDarkMode } = useGlobalUI();

    // Navigation Groups
    const navGroups = [
        {
            id: 'job',
            label: 'Job',
            icon: Briefcase,
            isActive: !isCoachMode && !isEduMode,
            items: [
                { id: 'analyze', label: 'Analyze', icon: Sparkles },
                { id: 'history', label: 'History', icon: Bookmark },
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
            label: 'Education',
            icon: GraduationCap,
            isActive: isEduMode,
            items: [
                { id: 'edu-home', label: 'Overview', icon: BookOpen },
                { id: 'edu-record', label: 'Academic Record', icon: GraduationCap }
            ]
        }
    ];


    return (
        <header className={`fixed top-0 left-0 right-0 z-50 h-16 pointer-events-none transition-all duration-700 ease-in-out`}>
            {/* Background Background blur/border (Conditional on scroll if needed, but keeping it elegant) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between relative pointer-events-auto">
                {/* Brand Logo */}
                <div className="flex items-center">
                    <div
                        className="group flex items-center gap-2.5 cursor-pointer"
                        onClick={() => onViewChange('home')}
                    >
                        <div className={`p-1.5 rounded-xl shadow-lg transition-all duration-500 group-hover:scale-105 active:scale-95 ${isCoachMode ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                            isEduMode ? 'bg-amber-500 text-white shadow-amber-500/20' :
                                'bg-indigo-600 text-white shadow-indigo-600/20'
                            }`}>
                            {isCoachMode ? <Sparkles className="w-5 h-5" /> : isEduMode ? <GraduationCap className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-800 dark:from-white dark:via-neutral-200 dark:to-neutral-400 leading-none">
                                Navigator
                            </span>
                        </div>
                    </div>
                </div>

                {/* Center Navigation - Floating Island Aesthetic */}
                {user && !isLoading && (
                    <motion.nav
                        layout
                        transition={{ layout: { duration: 0.3, type: "spring", bounce: 0 } }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-white/40 dark:bg-neutral-900/40 p-1.5 rounded-[2.5rem] border border-white/20 dark:border-neutral-800/40 backdrop-blur-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                    >
                        {navGroups.map((group) => (
                            <div
                                key={group.id}
                                className="relative flex items-center px-1"
                            >
                                <AnimatePresence>
                                    {group.isActive && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className="absolute inset-0 bg-white/90 dark:bg-neutral-800/90 shadow-sm border border-white/50 dark:border-neutral-700/50 rounded-[2rem] z-0"
                                            style={{ borderRadius: 32 }}
                                            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                                        />
                                    )}
                                </AnimatePresence>

                                <div className="relative z-10 flex items-center gap-1">
                                    <button
                                        onClick={() => onViewChange(group.items[0].id)}
                                        className={`px-2.5 py-2 rounded-2xl text-[11px] font-bold transition-all duration-300 flex items-center gap-2 ${group.isActive
                                            ? (group.id === 'career' ? 'text-emerald-600' : group.id === 'edu' ? 'text-amber-600' : 'text-indigo-600')
                                            : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                                            }`}
                                    >
                                        <group.icon className={`w-3.5 h-3.5 transition-transform duration-300 ${group.isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100'}`} />
                                        <span className="hidden leading-none md:block tracking-wider">{group.label}</span>
                                    </button>

                                    {/* Inline Sub-items (Expand Right of the Active Category) */}
                                    <AnimatePresence mode="popLayout" initial={false}>
                                        {group.isActive && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="flex items-center gap-0.5 pr-1.5 ml-0.5 border-l border-neutral-100 dark:border-neutral-700/50 pl-2"
                                            >
                                                {group.items.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => onViewChange(item.id)}
                                                        className={`relative px-2 py-1.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap tracking-wide overflow-hidden ${currentView === item.id
                                                            ? (group.id === 'career' ? 'text-emerald-600' : group.id === 'edu' ? 'text-amber-600' : 'text-indigo-600')
                                                            : 'text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                                                            }`}
                                                    >
                                                        <span className="relative z-10">{item.label}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))}
                    </motion.nav>
                )}

                {/* Right Actions */}
                <div className="flex items-center gap-1.5">
                    {!isLoading && !user ? (
                        <button
                            onClick={() => openModal('AUTH')}
                            className="px-4 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            Get Started
                        </button>
                    ) : (
                        <button
                            onClick={signOut}
                            className="group flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-all text-neutral-500 dark:text-neutral-400"
                        >
                            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                            <span className="hidden md:inline tracking-wider">Sign Out</span>
                        </button>
                    )}
                    {user && (
                        <div className="flex items-center gap-0.5">
                            {isAdmin && (
                                <button
                                    onClick={() => onViewChange('admin')}
                                    className="p-2.5 text-neutral-400 hover:text-indigo-600 dark:text-neutral-500 dark:hover:text-indigo-400 transition-all active:scale-90"
                                    title="Admin Console"
                                >
                                    <ShieldCheck className="w-4.5 h-4.5" />
                                </button>
                            )}
                            <button
                                onClick={toggleDarkMode}
                                className="p-2.5 text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-100 transition-all active:scale-90"
                                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                            </button>
                            <button
                                onClick={() => openModal('SETTINGS')}
                                className="p-2.5 text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-100 transition-all active:scale-90"
                            >
                                <Settings className="w-4.5 h-4.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
