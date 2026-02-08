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
        if (showCoach) actionCards.push('COUCH');
        if (showEdu) actionCards.push('EDU');

        return actionCards;
    });

    if (shuffledActionCards.length === 0) return null;

    const renderPreview = (id: string, color: BentoColorConfig) => {
        switch (id) {
            case 'jobfit':
                return (
                    <div className="relative w-14 h-14 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="28" cy="28" r="24" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-800" />
                            <circle cx="28" cy="28" r="24" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray="150.8" strokeDashoffset="30.16" className={`${color.text} animate-[dash_1.5s_ease-in-out_forwards]`} />
                        </svg>
                        <span className={`absolute text-[10px] font-black ${color.text}`}>98%</span>
                    </div>
                );
            case 'coach':
                return (
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 relative rounded-full mx-4">
                        <div className={`absolute inset-y-0 left-0 w-2/3 ${color.iconBg} rounded-full group-hover:w-3/4 transition-all duration-1000`} />
                        <div className={`absolute top-1/2 left-0 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-2 ${color.accent.replace('border-', 'border-').split(' ')[0]} rounded-full shadow-sm`} />
                        <div className={`absolute top-1/2 left-1/3 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-2 ${color.accent.replace('border-', 'border-').split(' ')[0]} rounded-full shadow-sm`} />
                        <div className={`absolute top-1/2 left-2/3 -translate-y-1/2 w-4 h-4 ${color.iconBg} rounded-full shadow-lg animate-pulse`} />
                    </div>
                );
            case 'keywords':
                return (
                    <div className="flex flex-col items-center justify-center gap-2">
                        <div className="flex gap-2">
                            <div className={`w-8 h-8 rounded-lg ${color.iconBg}/20 flex items-center justify-center ${color.text}`}><div className={`w-4 h-1 ${color.iconBg} rounded-full`} /></div>
                            <div className={`w-8 h-8 rounded-lg ${color.iconBg} flex items-center justify-center shadow-lg transform -rotate-12 group-hover:rotate-0 transition-transform`}><Sparkles className="w-4 h-4 text-white" /></div>
                            <div className={`w-8 h-8 rounded-lg ${color.iconBg}/20`} />
                        </div>
                        <div className="flex gap-2">
                            <div className="w-12 h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
                            <div className={`w-8 h-2 ${color.iconBg}/40 rounded-full`} />
                        </div>
                    </div>
                );
            case 'resumes':
                return (
                    <div className="relative flex items-center justify-center w-full h-full">
                        <div className="relative w-12 h-16 bg-white dark:bg-slate-950 rounded shadow-md border border-slate-200 dark:border-slate-800 transform -rotate-12 translate-x-2 translate-y-2 opacity-50" />
                        <div className="relative w-12 h-16 bg-white dark:bg-slate-950 rounded shadow-lg border border-slate-200 dark:border-slate-800 group-hover:-translate-y-1 transition-transform" />
                        <div className={`absolute bottom-6 w-8 h-1 ${color.iconBg}/30 rounded-full`} />
                        <div className={`absolute bottom-4 w-6 h-1 ${color.iconBg}/20 rounded-full`} />
                    </div>
                );
            case 'edu':
                return (
                    <div className="flex items-center gap-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`w-8 h-10 ${color.iconBg}/10 rounded-lg flex items-center justify-center border ${color.accent}`}>
                                <div className={`w-4 h-0.5 ${color.iconBg}/40 rounded-full`} />
                            </div>
                        ))}
                    </div>
                );
            case 'history':
                return (
                    <div className="flex flex-col gap-2 w-full px-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 ${color.iconBg} rounded-full`} />
                            <div className="flex-grow h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
                            <div className={`text-[10px] font-bold ${color.text}`}>98%</div>
                        </div>
                        <div className="flex items-center gap-2 opacity-60">
                            <div className={`w-2 h-2 ${color.iconBg} rounded-full`} />
                            <div className="flex-grow h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
                            <div className={`text-[10px] font-bold ${color.text}`}>87%</div>
                        </div>
                        <div className="flex items-center gap-2 opacity-40">
                            <div className={`w-2 h-2 ${color.iconBg} rounded-full`} />
                            <div className="flex-grow h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
                            <div className={`text-[10px] font-bold ${color.text}`}>92%</div>
                        </div>
                    </div>
                );
            case 'cover_letters':
                return (
                    <div className="flex flex-col gap-1.5 w-full px-4">
                        <div className="w-3/4 h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
                        <div className={`w-full h-2 ${color.iconBg}/20 rounded-full`} />
                        <div className="w-5/6 h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
                        <div className={`w-2/3 h-2 ${color.iconBg}/10 rounded-full`} />
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
