import React from 'react';
import { Search, X } from 'lucide-react';

interface StandardSearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    themeColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
    rightElement?: React.ReactNode;
}

export const StandardSearchBar: React.FC<StandardSearchBarProps> = ({
    value,
    onChange,
    placeholder = "Search...",
    className = "",
    themeColor = 'indigo',
    rightElement
}) => {
    const focusColors = {
        indigo: 'focus:ring-indigo-600/10 focus:border-indigo-600/50',
        emerald: 'focus:ring-emerald-600/10 focus:border-emerald-600/50',
        amber: 'focus:ring-amber-600/10 focus:border-amber-600/50',
        rose: 'focus:ring-rose-600/10 focus:border-rose-600/50',
        slate: 'focus:ring-neutral-600/10 focus:border-neutral-600/50',
    };

    const iconFocusColor = {
        indigo: 'group-focus-within:text-indigo-600',
        emerald: 'group-focus-within:text-emerald-600',
        amber: 'group-focus-within:text-amber-600',
        rose: 'group-focus-within:text-rose-600',
        slate: 'group-focus-within:text-neutral-600',
    };

    return (
        <div className={`flex flex-col md:flex-row items-center gap-4 w-full ${className}`}>
            <div className="relative group flex-1 w-full">
                <Search className={`absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 ${iconFocusColor[themeColor]} transition-colors z-10`} />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 py-3 pl-15 pr-12 rounded-2xl text-sm focus:outline-none focus:ring-8 transition-all shadow-lg shadow-neutral-900/5 dark:shadow-black/20 text-neutral-900 dark:text-white placeholder:text-neutral-400 ${focusColors[themeColor]}`}
                />
                {value && (
                    <button
                        onClick={() => onChange('')}
                        className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-neutral-600 transition-all z-10"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
            {rightElement && (
                <div className="w-full md:w-auto animate-in fade-in slide-in-from-right-4 duration-500">
                    {rightElement}
                </div>
            )}
        </div>
    );
};
