import React from 'react';

interface FilterOption<T extends string> {
    id: T;
    label: string;
    count?: number;
    icon?: React.ReactNode;
}

interface StandardFilterGroupProps<T extends string> {
    options: readonly FilterOption<T>[];
    activeFilter: T;
    onSelect: (filter: T) => void;
    themeColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
    className?: string;
}

export function StandardFilterGroup<T extends string>({
    options,
    activeFilter,
    onSelect,
    themeColor = 'indigo',
    className = ""
}: StandardFilterGroupProps<T>) {
    const themes = {
        indigo: {
            active: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20',
            inactive: 'text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
            countActive: 'bg-white/20 text-white',
            countInactive: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500'
        },
        emerald: {
            active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20',
            inactive: 'text-neutral-500 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
            countActive: 'bg-white/20 text-white',
            countInactive: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500'
        },
        amber: {
            active: 'bg-amber-600 text-white shadow-lg shadow-amber-600/20',
            inactive: 'text-neutral-500 hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20',
            countActive: 'bg-white/20 text-white',
            countInactive: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500'
        },
        rose: {
            active: 'bg-rose-600 text-white shadow-lg shadow-rose-600/20',
            inactive: 'text-neutral-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20',
            countActive: 'bg-white/20 text-white',
            countInactive: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500'
        },
        slate: {
            active: 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg shadow-neutral-900/10 dark:shadow-white/5',
            inactive: 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800',
            countActive: 'bg-white/20 dark:bg-neutral-900/10 text-white dark:text-neutral-900',
            countInactive: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500'
        }
    };

    const currentTheme = themes[themeColor];

    return (
        <div className={`flex items-center gap-1.5 p-1 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-x-auto scrollbar-hide no-scrollbar ${className}`}>
            {options.map((option) => (
                <button
                    key={option.id}
                    onClick={() => onSelect(option.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 whitespace-nowrap active:scale-95 ${activeFilter === option.id ? currentTheme.active : currentTheme.inactive}`}
                >
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    {option.label}
                    {typeof option.count === 'number' && option.count >= 0 && (
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-tighter transition-colors ${activeFilter === option.id ? currentTheme.countActive : currentTheme.countInactive}`}>
                            {option.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
