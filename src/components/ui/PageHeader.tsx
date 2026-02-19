import React from 'react';
import { ArrowLeft, type LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    variant?: 'hero' | 'detail' | 'simple';
    title: string;
    highlight?: string;
    subtitle?: string | React.ReactNode;
    icon?: LucideIcon;
    onBack?: () => void;
    actions?: React.ReactNode;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    variant = 'simple',
    title,
    highlight,
    subtitle,
    icon: Icon,
    onBack,
    actions,
    className = ""
}) => {
    if (variant === 'hero') {
        return (
            <div className={`text-center mb-16 ${className}`}>
                <h1 className="text-5xl md:text-7xl font-black text-neutral-900 dark:text-white tracking-tight mb-8 leading-tight">
                    {title} {highlight && (
                        <span className="text-transparent bg-clip-text animate-gradient-x" style={{ backgroundImage: 'var(--accent-gradient)', backgroundSize: '200% auto' }}>
                            {highlight}
                        </span>
                    )}
                </h1>
                {subtitle && (
                    <div className="text-xl md:text-2xl text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-4xl mx-auto px-4 font-medium">
                        {subtitle}
                    </div>
                )}
            </div>
        );
    }

    if (variant === 'detail') {
        return (
            <div className={`border-b border-neutral-200/50 dark:border-neutral-800/50 sticky top-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md z-30 ${className}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all group"
                            >
                                <ArrowLeft className="w-5 h-5 text-neutral-500 group-hover:-translate-x-1 transition-transform" />
                            </button>
                        )}
                        <div>
                            <div className="flex items-center gap-3">
                                {Icon && (
                                    <div className="w-8 h-8 rounded-lg bg-accent-primary/10 dark:bg-accent-primary/20 flex items-center justify-center">
                                        <Icon className="w-4.5 h-4.5 text-accent-primary-hex" />
                                    </div>
                                )}
                                <h2 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight truncate max-w-md">
                                    {title}
                                </h2>
                            </div>
                            {subtitle && (
                                <div className="text-sm font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
                                    {subtitle}
                                </div>
                            )}
                        </div>
                    </div>
                    {actions && (
                        <div className="flex items-center gap-3">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Simple variant
    return (
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 ${className}`}>
            <div className="flex items-center gap-5">
                {Icon && (
                    <div className="w-14 h-14 bg-accent-primary/10 dark:bg-accent-primary/20 text-accent-primary-hex rounded-2xl flex items-center justify-center border-2 border-accent-primary/20 shrink-0">
                        <Icon className="w-7 h-7" />
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
};
