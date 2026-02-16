import React from 'react';

interface SharedHeaderProps {
    title: string;
    highlight?: string;
    subtitle?: string | React.ReactNode;
    theme?: 'job' | 'coach' | 'edu';
    className?: string;
}

export const SharedHeader: React.FC<SharedHeaderProps> = ({
    title,
    highlight,
    subtitle,
    theme = 'job',
    className = ""
}) => {
    const gradients = {
        job: "from-emerald-500 via-teal-500 to-emerald-500",
        coach: "from-indigo-500 via-purple-500 to-indigo-500",
        edu: "from-amber-500 via-orange-500 to-amber-500"
    };

    return (
        <div className={`text-center mb-20 ${className}`}>
            <h1 className="text-5xl md:text-6xl font-black text-neutral-900 dark:text-white tracking-tight mb-6 leading-tight">
                {title} {highlight && (
                    <span className={`text-transparent bg-clip-text animate-gradient-x bg-gradient-to-r ${gradients[theme]}`} style={{ backgroundSize: '200% auto' }}>
                        {highlight}
                    </span>
                )}
            </h1>
            {subtitle && (
                <div className="text-xl text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-3xl mx-auto px-4">
                    {subtitle}
                </div>
            )}
        </div>
    );
};
