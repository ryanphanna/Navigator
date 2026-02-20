import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface DetailHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    onBack: () => void;
    icon?: LucideIcon;
    actions?: React.ReactNode;
    center?: React.ReactNode;
    themeColor?: 'accent' | 'neutral';
}

export const DetailHeader: React.FC<DetailHeaderProps> = ({
    title,
    subtitle,
    onBack,
    icon: Icon,
    actions,
    center,
    themeColor = 'accent'
}) => {
    const iconColor = themeColor === 'accent' ? 'text-accent-primary-hex' : 'text-neutral-500';

    return (
        <div className="border-b border-neutral-200 dark:border-neutral-800 sticky top-16 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md z-10">
            <div className="mx-auto px-6 py-4 flex items-center justify-between relative">
                <div className="flex items-center gap-4 relative z-10">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all active:scale-95 group"
                    >
                        <ArrowLeft className="w-5 h-5 text-neutral-500 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-neutral-900 dark:text-white truncate max-w-md tracking-tight" title={typeof title === 'string' ? title : undefined}>
                            {title}
                        </h2>
                        {subtitle && (
                            <div className="flex flex-col gap-1.5 mt-0.5">
                                <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                                    {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
                                    <span className="font-semibold text-neutral-900 dark:text-neutral-200">{subtitle}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {center && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="pointer-events-auto">
                            {center}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 relative z-10">
                    {actions}
                </div>
            </div>
        </div>
    );
};
