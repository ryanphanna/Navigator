import React, { useState } from 'react';
import { Zap, Sparkles, FileText, Bookmark, PenTool, GraduationCap, TrendingUp } from 'lucide-react';
import { BentoCard, type BentoColorConfig } from '../../components/common/BentoCard';
import { BENTO_CARDS } from '../../constants';

// Icon Map
const ICON_MAP = {
    Sparkles,
    Zap,
    FileText,
    GraduationCap,
    Bookmark,
    PenTool,
    TrendingUp
} as const;

export const MarketingGrid: React.FC = () => {
    const [shuffledCards] = useState<string[]>(() => {
        // Reduced to 5 cards to match ActionGrid count
        const marketingCards = ['JOBFIT', 'KEYWORDS', 'RESUMES', 'COVER_LETTERS', 'HISTORY', 'COACH'];
        return [...marketingCards].sort(() => Math.random() - 0.5);
    });

    if (shuffledCards.length === 0) return null;

    const renderPreview = (id: string, color: BentoColorConfig) => {
        switch (id) {
            case 'jobfit':
                return (
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="40" cy="40" r="32" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-neutral-100 dark:text-neutral-800" />
                            <circle cx="40" cy="40" r="32" fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray="201.06" strokeDashoffset="40.21" className={`${color.text} animate-[dash_2s_ease-in-out_forwards]`} />
                        </svg>
                        <span className={`absolute text-base font-black ${color.text}`}>98%</span>
                    </div>
                );
            case 'keywords':
                return (
                    <div className="flex flex-wrap items-center justify-center gap-2 px-6">
                        {['Python', 'React', 'AWS', 'Docker'].map((skill, i) => (
                            <span key={skill} className={`px-3 py-1.5 rounded-xl ${i === 0 ? color.bg.replace('/50', '/80') + ' ' + color.text : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'} text-xs font-bold transition-all hover:scale-110 cursor-default shadow-sm border border-neutral-200/50 dark:border-white/5`}>
                                {i === 0 ? '✓ ' : '+ '}{skill}
                            </span>
                        ))}
                    </div>
                );
            case 'resumes':
                return (
                    <div className="relative w-full px-10 flex flex-col gap-2">
                        <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div className={`h-full ${color.iconBg} w-3/4 animate-pulse`} />
                        </div>
                        <div className="h-2 w-1/2 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                        <div className="h-2 w-5/6 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                    </div>
                );
            case 'cover_letters':
                return (
                    <div className="flex flex-col gap-2 w-full px-10">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center ${color.text}`}>
                                <PenTool className="w-4 h-4" />
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                                <div className="h-2 w-2/3 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                            </div>
                        </div>
                    </div>
                );
            case 'history':
                return (
                    <div className="relative group/save">
                        <div className={`flex items-center gap-2 px-6 py-3 ${color.iconBg} text-white text-sm font-black rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer`}>
                            <Bookmark className="w-4 h-4" />
                            SAVE JOB
                        </div>
                        <div className={`absolute -inset-2 ${color.iconBg} opacity-20 blur-xl rounded-full scale-110 group-hover/save:scale-125 transition-transform duration-1000`} />
                    </div>
                );
            case 'coach':
                return (
                    <div className="w-full px-10 space-y-4">
                        <div className="flex justify-between items-end h-12 gap-1.5">
                            {[40, 70, 55, 90, 65].map((h, i) => (
                                <div key={i} className={`flex-1 ${color.iconBg} rounded-t-lg transition-all duration-1000 origin-bottom hover:scale-y-110`} style={{ height: `${h}%`, opacity: 0.3 + (i * 0.15) }} />
                            ))}
                        </div>
                        <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div className={`h-full ${color.iconBg} w-2/3 animate-[shimmer_2s_infinite]`} style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="mt-8 w-full max-w-7xl mx-auto px-4 pb-24">
            {/* HUB: The Central Mission Statement */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12`}>
                {shuffledCards.map((key) => {
                    const config = BENTO_CARDS[key as keyof typeof BENTO_CARDS];
                    if (!config) {
                        console.error(`Missing config for key: ${key}`, { BENTO_CARDS_KEYS: Object.keys(BENTO_CARDS) });
                        return null;
                    }
                    return (
                        <BentoCard
                            key={config.id}
                            id={config.id}
                            icon={ICON_MAP[config.iconName as keyof typeof ICON_MAP]}
                            title={config.title.marketing}
                            description={config.description.marketing}
                            color={config.colors}
                            actionLabel={config.action.marketing}
                            previewContent={renderPreview(config.id, config.colors)}
                            onAction={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                setTimeout(() => document.querySelector('input')?.focus(), 500);
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};
