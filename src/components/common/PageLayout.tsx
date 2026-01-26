import React from 'react';

interface PageLayoutProps {
    title: string;
    description?: string;
    icon: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
    fullWidth?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
    title,
    description,
    icon,
    actions,
    children,
    fullWidth = false
}) => {
    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className={`${fullWidth ? 'w-full px-4 sm:px-6' : 'max-w-5xl mx-auto px-6'} py-8 sm:py-12`}>
                {/* Compact Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-md shadow-indigo-500/20 shrink-0">
                            {/* We can clone the icon to adjust size if needed, but CSS scaling works too */}
                            <div className="scale-75 origin-center">
                                {icon}
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    {description}
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

                {/* Content */}
                {children}
            </div>
        </div>
    );
};
