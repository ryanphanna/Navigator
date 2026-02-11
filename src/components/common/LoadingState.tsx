import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
    message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading module...' }) => {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
                <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin relative z-10" />
            </div>
            <p className="mt-6 text-sm font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest animate-pulse">
                {message}
            </p>
        </div>
    );
};
