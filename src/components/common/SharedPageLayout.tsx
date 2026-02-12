import React from 'react';

interface SharedPageLayoutProps {
    children: React.ReactNode;
    maxWidth?: '3xl' | '4xl' | '5xl' | '6xl' | 'full';
    paddingTop?: 'pt-8' | 'pt-12' | 'pt-16' | 'pt-20' | 'pt-24';
    animate?: boolean;
    className?: string;
}

export const SharedPageLayout: React.FC<SharedPageLayoutProps> = ({
    children,
    maxWidth = '4xl',
    paddingTop = 'pt-16',
    animate = true,
    className = ""
}) => {
    const maxWidthClass = {
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        'full': 'max-w-full'
    }[maxWidth];

    return (
        <div className={`mx-auto px-4 sm:px-6 w-full ${maxWidthClass} ${paddingTop} ${animate ? 'animate-in fade-in slide-in-from-bottom-2 duration-700' : ''} ${className}`}>
            {children}
        </div>
    );
};
