import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface DetailHeaderProps {
    title: string;
    subtitle?: React.ReactNode;
    onBack: () => void;
    icon?: LucideIcon;
    actions?: React.ReactNode;
    themeColor?: 'indigo' | 'emerald';
}

export const DetailHeader: React.FC<DetailHeaderProps> = ({
    title,
    subtitle,
    onBack,
    icon: Icon,
    actions,
    themeColor = 'indigo'
}) => {
    const iconColor = themeColor === 'emerald' ? 'text-emerald-600' : 'text-indigo-600';

    return (
        <div className="border-b border-neutral-200 sticky top-0 bg-white/80 backdrop-blur-md z-10">
            <div className={`mx-auto px-6 py-4 flex items-center justify-between ${themeColor === 'emerald' ? 'max-w-4xl' : ''}`}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-neutral-100 rounded-full transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 text-neutral-500 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 truncate max-w-md" title={title}>
                            {title}
                        </h2>
                        {subtitle && (
                            <div className="flex flex-col gap-1.5 mt-1">
                                <div className="flex items-center gap-2 text-sm text-neutral-500">
                                    {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
                                    <span className="font-medium text-neutral-900">{subtitle}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {actions}
                </div>
            </div>
        </div>
    );
};
