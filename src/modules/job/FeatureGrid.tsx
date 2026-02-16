import React, { useState } from 'react';
import { TrendingUp, PenTool, Sparkles, FileText, GraduationCap, Bookmark, Zap } from 'lucide-react';
import { BentoCard, type BentoColorConfig } from '../../components/common/BentoCard';
import { BENTO_CARDS, type BentoCardConfig } from '../../constants';
import { EventService } from '../../services/eventService';
import type { User } from '@supabase/supabase-js';

// Icon Map
const ICON_MAP = {
    Sparkles,
    TrendingUp,
    Zap,
    FileText,
    GraduationCap,
    Bookmark,
    PenTool
} as const;

interface FeatureGridProps {
    user: User | null;
    onNavigate?: (view: string) => void;
    onShowAuth?: () => void;
    isAdmin?: boolean;
    isTester?: boolean;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({
    user,
    onNavigate,
    onShowAuth,
    isAdmin = false,
    isTester = false
}) => {
    const [cardKeys] = useState<string[]>(() => {
        const eligibleCards: string[] = [];

        // Base cards always eligible but filtered later
        const baseKeys = ['JOBFIT', 'KEYWORDS', 'RESUMES', 'COVER_LETTERS', 'HISTORY'];
        eligibleCards.push(...baseKeys);

        // Career Coach for all
        eligibleCards.push('COACH');

        // Edu HQ for admins or testers
        if (isAdmin || isTester) {
            eligibleCards.push('EDU');
        }

        // Sort by rank and take top 5
        return eligibleCards
            .filter(key => BENTO_CARDS[key as keyof typeof BENTO_CARDS])
            .sort((a, b) => {
                const rankA = BENTO_CARDS[a as keyof typeof BENTO_CARDS].rank || 99;
                const rankB = BENTO_CARDS[b as keyof typeof BENTO_CARDS].rank || 99;
                return rankA - rankB;
            })
            .slice(0, 5);
    });

    const renderPreview = (id: string, color: BentoColorConfig) => {
        // Combined preview logic from both grids
        switch (id) {
            case 'jobfit':
                return (
                    <div className="relative w-full h-16 flex items-center justify-center scale-90 group-hover:scale-100 transition-transform duration-500">
                        <div className="relative w-16 h-16 flex items-center justify-center z-10">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-neutral-100 dark:text-neutral-800" />
                                <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray="175.93" strokeDashoffset="35.19" className={`${color.text} animate-[dash_1.5s_ease-in-out_forwards]`} />
                            </svg>
                            <span className={`absolute text-sm font-black ${color.text}`}>92%</span>
                        </div>
                        <div className="absolute -top-4 -left-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-1.5 font-mono text-[6px] w-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-neutral-400"># Match</span>
                                <span className="text-emerald-500 font-bold">78%</span>
                            </div>
                            <div className="space-y-0.5">
                                <div className="h-0.5 w-full bg-neutral-100 dark:bg-neutral-700 rounded-full" />
                                <div className="h-0.5 w-2/3 bg-indigo-500 rounded-full" />
                            </div>
                        </div>
                    </div>
                );
            case 'keywords':
                return (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 px-6">
                        {['Python', 'React', 'AWS'].map((skill, i) => (
                            <span key={skill} className={`px-2.5 py-1 rounded-lg ${i === 0 ? color.bg.replace('/50', '/80') + ' ' + color.text : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'} text-[10px] font-black border border-neutral-200/50 dark:border-white/5`}>
                                {i === 0 ? '✓ ' : '+ '}{skill}
                            </span>
                        ))}
                    </div>
                );
            case 'resumes':
                return (
                    <div className="relative flex items-center justify-center w-full h-16">
                        <div className="relative w-10 h-14 bg-white dark:bg-neutral-900 rounded-lg shadow-md border border-neutral-200 dark:border-white/10 transform -rotate-12 translate-x-4 opacity-40 scale-90" />
                        <div className="relative w-10 h-14 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-white/10 group-hover:-translate-y-2 transition-transform duration-500 z-10 flex flex-col p-1.5 gap-1">
                            <div className={`w-3/4 h-1 ${color.iconBg}/40 rounded-full`} />
                            <div className={`w-full h-0.5 ${color.iconBg}/20 rounded-full`} />
                            <div className={`w-5/6 h-0.5 ${color.iconBg}/10 rounded-full`} />
                        </div>
                    </div>
                );
            case 'history':
                return (
                    <div className="flex flex-col gap-3 w-full px-8">
                        {[98, 87, 92].map((score, i) => (
                            <div key={i} className={`flex items-center gap-3 ${i > 0 ? 'opacity-40' : ''}`}>
                                <div className={`w-2.5 h-2.5 ${color.iconBg} rounded-full`} />
                                <div className="flex-grow h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                                <div className={`text-[10px] font-black ${color.text}`}>{score}%</div>
                            </div>
                        ))}
                    </div>
                );
            case 'cover_letters':
                return (
                    <div className="flex flex-col gap-2 w-full px-8">
                        <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div className={`h-full ${color.iconBg} w-3/4 animate-pulse`} />
                        </div>
                        <div className="w-5/6 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                        <div className="w-2/3 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                    </div>
                );
            case 'coach':
                return (
                    <div className="w-full px-8 space-y-4">
                        <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div className={`h-full ${color.iconBg} w-2/3 animate-[shimmer_2s_infinite]`} style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
                        </div>
                        <div className="flex justify-between items-center gap-2">
                            <div className={`h-6 w-6 rounded-lg ${color.iconBg}/20 flex items-center justify-center`}><Zap className={`w-3.5 h-3.5 ${color.text}`} /></div>
                            <div className="h-1.5 flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const handleAction = (config: BentoCardConfig) => {
        // Track curiosity (Interest)
        EventService.trackInterest(config.id);

        if (user) {
            onNavigate?.(config.targetView);
        } else {
            // Logged out behavior
            if (onShowAuth) {
                onShowAuth();
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => document.querySelector('input')?.focus(), 500);
            }
        }
    };

    return (
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 w-full">
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 max-w-7xl mx-auto px-4`}>
                {cardKeys.map((key) => {
                    const config = BENTO_CARDS[key as keyof typeof BENTO_CARDS];
                    if (!config) return null;

                    return (
                        <BentoCard
                            key={config.id}
                            id={config.id}
                            icon={ICON_MAP[config.iconName as keyof typeof ICON_MAP]}
                            title={user ? config.title.action : config.title.marketing}
                            description={user ? config.description.action : config.description.marketing}
                            color={config.colors}
                            actionLabel={user ? config.action.action : config.action.marketing}
                            previewContent={renderPreview(config.id, config.colors)}
                            onAction={() => handleAction(config)}
                        />
                    );
                })}
            </div>
        </div>
    );
};
