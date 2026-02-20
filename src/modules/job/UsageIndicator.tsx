import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { UsageStats } from '../../services/usageLimits';
import { ROUTES } from '../../constants';

interface UsageIndicatorProps {
    usageStats?: UsageStats | null;
}

export const UsageIndicator: React.FC<UsageIndicatorProps> = ({ usageStats }) => {
    const navigate = useNavigate();

    if (!usageStats || usageStats.tier !== 'free') return null;

    return (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm animate-in fade-in duration-500">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                        {usageStats.weekAnalyses}/{usageStats.analysisLimit}
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                        weekly analyses used
                    </span>
                </div>
                {usageStats.weekAnalyses >= 2 && (
                    <button
                        onClick={() => navigate(ROUTES.PLANS)}
                        className="ml-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                        Upgrade
                    </button>
                )}
            </div>
        </div>
    );
};
