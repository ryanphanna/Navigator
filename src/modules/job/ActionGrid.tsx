import React, { useState } from 'react';
import { TrendingUp, PenTool, Sparkles, FileText, GraduationCap, Bookmark, Zap } from 'lucide-react';
import { BentoCard, type BentoColorConfig } from '../../components/common/BentoCard';
import { BENTO_CARDS } from '../../constants';

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

interface ActionGridProps {
    onNavigate?: (view: string) => void;
    isAdmin?: boolean;
    isTester?: boolean;
}

export const ActionGrid: React.FC<ActionGridProps> = ({ onNavigate, isAdmin = false, isTester = false }) => {
    const [shuffledActionCards] = useState<string[]>(() => {
        // Job product cards in priority order
        const jobCardsByPriority = [
            'RESUMES',
            'JOBFIT',
            'COVER_LETTERS',
            'KEYWORDS',
            'HISTORY',
        ];

        const actionCards: string[] = [];
        const showCoach = isTester || isAdmin;
        const showEdu = isAdmin;
        const productCount = (showCoach ? 1 : 0) + (showEdu ? 1 : 0);
        const jobCardCount = 5 - productCount;

        actionCards.push(...jobCardsByPriority.slice(0, jobCardCount));
        if (showCoach) actionCards.push('COACH');
        if (showEdu) actionCards.push('EDU');

        return actionCards;
    });

    if (shuffledActionCards.length === 0) return null;

    const renderPreview = (id: string, color: BentoColorConfig) => {
        switch (id) {
            case 'jobfit':
                return (
                    <div className="relative w-full h-24 flex items-center justify-center scale-90 group-hover:scale-100 transition-transform duration-500">
                        {/* Scaled down version of the hero graphics */}
                        <div className="relative w-24 h-24 flex items-center justify-center z-10">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-neutral-100 dark:text-neutral-800" />
                                <circle cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray="251.32" strokeDashoffset="50.26" className={`${color.text} animate-[dash_1.5s_ease-in-out_forwards]`} />
                            </svg>
                            <span className={`absolute text-xl font-black ${color.text}`}>92%</span>
                        </div>

                        {/* Mini floating cards for flavor */}
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
                    <div className="relative flex items-center justify-center w-full h-24">
                        <div className="relative w-14 h-20 bg-white dark:bg-neutral-900 rounded-xl shadow-md border border-neutral-200 dark:border-white/10 transform -rotate-12 translate-x-4 opacity-40 scale-90" />
                        <div className="relative w-14 h-20 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-white/10 group-hover:-translate-y-2 transition-transform duration-500 z-10 flex flex-col p-2 gap-1.5">
                            <div className={`w-3/4 h-1.5 ${color.iconBg}/40 rounded-full`} />
                            <div className={`w-full h-1 ${color.iconBg}/20 rounded-full`} />
                            <div className={`w-5/6 h-1 ${color.iconBg}/10 rounded-full`} />
                        </div>
                    </div>
                );
            case 'edu':
                return (
                    <div className="flex items-center gap-2 px-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`w-10 h-14 ${color.iconBg}/10 rounded-xl flex items-center justify-center border ${color.accent} group-hover:scale-110 transition-transform`} style={{ transitionDelay: `${i * 100}ms` }}>
                                <div className={`w-5 h-1 ${color.iconBg}/40 rounded-full`} />
                            </div>
                        ))}
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
            default:
                return null;
        }
    };

    return (
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 w-full">
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 max-w-7xl mx-auto px-4`}>
                {shuffledActionCards.map((key) => {
                    const config = BENTO_CARDS[key as keyof typeof BENTO_CARDS];
                    return (
                        <BentoCard
                            key={config.id}
                            id={config.id}
                            icon={ICON_MAP[config.iconName as keyof typeof ICON_MAP]}
                            title={config.title.action}
                            description={config.description.action}
                            color={config.colors}
                            actionLabel={config.action.action}
                            previewContent={renderPreview(config.id, config.colors)}
                            onAction={() => onNavigate?.(config.targetView as any)}
                        />
                    );
                })}
            </div>
        </div>
    );
};
