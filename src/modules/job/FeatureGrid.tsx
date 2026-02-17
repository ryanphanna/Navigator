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
    className?: string;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({
    user,
    onNavigate,
    onShowAuth,
    isAdmin = false,
    isTester = false,
    className = ""
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
        switch (id) {
            case 'jobfit':
                return (
                    <div className="relative w-full h-24 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                        {/* Ambient Glow */}
                        <div className={`absolute inset-0 ${color.glow} blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`} />

                        <div className="relative w-20 h-20 flex items-center justify-center z-10">
                            <svg className="w-full h-full transform -rotate-90 filter drop-shadow-xl">
                                <circle cx="40" cy="40" r="34" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-neutral-100 dark:text-neutral-800" />
                                <circle cx="40" cy="40" r="34" fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray="213.63" strokeDashoffset="42.72" className={`${color.text} stroke-cap-round animate-[dash_2s_ease-in-out_forwards]`} />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className={`text-xl font-black ${color.text}`}>92%</span>
                                <span className="text-[10px] font-bold text-neutral-400 -mt-1 uppercase tracking-tighter">Match</span>
                            </div>
                        </div>

                        {/* Floating elements */}
                        <div className="absolute top-2 -left-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-2 font-mono text-[7px] w-24 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-700 delay-100 flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <span className="text-neutral-400 font-bold">Fit Analysis</span>
                                <Sparkles className={`w-2 h-2 ${color.text}`} />
                            </div>
                            <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div className={`h-full ${color.iconBg} w-4/5`} />
                            </div>
                        </div>

                        <div className="absolute bottom-4 -right-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-700 delay-200">
                            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400">Perfect Fit!</span>
                        </div>
                    </div>
                );
            case 'keywords':
                return (
                    <div className="relative flex flex-wrap items-center justify-center gap-2 px-4 h-24 overflow-hidden">
                        {['Python', 'React', 'Cloud Architect', 'Leadership', 'TypeScript', 'AWS'].map((skill, i) => (
                            <div
                                key={skill}
                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black border transition-all duration-500 scale-90 group-hover:scale-100 ${i % 2 === 0
                                        ? `${color.bg.replace('/50', '/80')} ${color.text} border-${color.text.split('-')[1]}-200/50`
                                        : 'bg-white dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700'
                                    }`}
                                style={{
                                    transitionDelay: `${i * 50}ms`,
                                    transform: `translateY(${Math.sin(i) * 5}px)`
                                }}
                            >
                                {i % 2 === 0 ? '✓ ' : '+ '}{skill}
                            </div>
                        ))}
                    </div>
                );
            case 'resumes':
                return (
                    <div className="relative flex items-center justify-center w-full h-24">
                        <div className="absolute w-16 h-20 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 transform -rotate-12 -translate-x-8 opacity-40 scale-90 group-hover:-translate-x-10 transition-transform duration-700" />
                        <div className="absolute w-16 h-20 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 transform rotate-6 translate-x-6 opacity-40 scale-95 group-hover:translate-x-8 transition-transform duration-700" />

                        <div className="relative w-20 h-24 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 group-hover:-translate-y-4 transition-transform duration-500 z-10 p-3 gap-2 flex flex-col">
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className={`w-3 h-3 rounded-full ${color.iconBg}/20 flex items-center justify-center`}><FileText className={`w-2 h-2 ${color.text}`} /></div>
                                <div className={`w-full h-1.5 ${color.iconBg}/40 rounded-full`} />
                            </div>
                            <div className="space-y-1.5">
                                <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-700 rounded-full" />
                                <div className="h-1 w-5/6 bg-neutral-100 dark:bg-neutral-700 rounded-full" />
                                <div className="h-1 w-4/6 bg-neutral-100 dark:bg-neutral-700 rounded-full" />
                            </div>
                            <div className={`mt-auto w-full h-4 rounded-lg ${color.bg} border border-${color.text.split('-')[1]}-100 dark:border-${color.text.split('-')[1]}-900 flex items-center justify-center`}>
                                <div className={`w-3 h-0.5 ${color.iconBg} rounded-full animate-pulse`} />
                            </div>
                        </div>
                    </div>
                );
            case 'history':
                return (
                    <div className="relative flex flex-col gap-2.5 w-full px-8 h-24 justify-center">
                        {[
                            { score: 98, name: 'Senior Dev', icon: '⚡️' },
                            { score: 87, name: 'Product Lead', icon: '🎨' },
                            { score: 92, name: 'Cloud Eng', icon: '☁️' }
                        ].map((item, i) => (
                            <div key={i} className={`flex items-center gap-3 transition-all duration-700 ${i > 0 ? 'opacity-30 group-hover:opacity-60' : ''}`} style={{ transitionDelay: `${i * 100}ms` }}>
                                <div className="text-[10px] w-4">{item.icon}</div>
                                <div className="flex-grow flex flex-col gap-1">
                                    <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-widest text-neutral-400">
                                        <span>{item.name}</span>
                                        <span className={color.text}>{item.score}%</span>
                                    </div>
                                    <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${color.iconBg} rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
                                            style={{ width: `${item.score}%`, transition: 'width 1.5s cubic-bezier(0.23, 1, 0.32, 1)', transitionDelay: `${i * 200}ms` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'cover_letters':
                return (
                    <div className="relative w-full px-8 h-24 flex items-center justify-center">
                        <div className="relative w-32 h-20 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 overflow-hidden p-2.5 group-hover:scale-110 transition-transform duration-700 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 mb-1">
                                <PenTool className={`w-3 h-3 ${color.text}`} />
                                <div className="h-2 w-16 bg-neutral-100 dark:bg-neutral-700 rounded-full" />
                            </div>
                            <div className="space-y-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`h-1 bg-neutral-50 dark:bg-neutral-700/50 rounded-full ${i === 3 ? 'w-2/3' : 'w-full'}`} />
                                ))}
                            </div>
                            <div className="mt-2 space-y-1">
                                {[1, 2].map(i => (
                                    <div key={i} className={`h-1 bg-neutral-50 dark:bg-neutral-700/50 rounded-full ${i === 2 ? 'w-1/2' : 'w-full'}`} />
                                ))}
                            </div>
                            <div className={`absolute bottom-0 right-0 w-12 h-12 ${color.bg} blur-xl opacity-40`} />
                        </div>
                    </div>
                );
            case 'coach':
                return (
                    <div className="w-full px-8 h-24 flex flex-col justify-center gap-4">
                        <div className="relative h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                                className={`absolute inset-0 h-full ${color.iconBg} w-2/3 animate-[shimmer_2s_infinite]`}
                                style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
                            />
                        </div>
                        <div className="flex justify-between items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl ${color.iconBg}/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all`}>
                                <TrendingUp className={`w-4 h-4 ${color.text}`} />
                            </div>
                            <div className="flex-1 flex flex-col gap-1.5">
                                <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${color.iconBg} w-4/5 rounded-full`} />
                                </div>
                                <div className="h-1.5 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${color.iconBg} w-2/5 rounded-full opacity-60`} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'edu':
                return (
                    <div className="relative w-full px-8 h-24 flex items-center justify-center">
                        <div className="relative group-hover:scale-110 transition-transform duration-700">
                            <div className={`absolute -inset-4 ${color.glow} blur-xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse`} />
                            <div className={`w-14 h-14 rounded-2xl ${color.iconBg} flex items-center justify-center shadow-2xl shadow-amber-500/20 z-10 relative`}>
                                <GraduationCap className="w-8 h-8 text-white" />
                            </div>
                            <div className="absolute -top-2 -right-2 bg-white dark:bg-neutral-800 rounded-full p-1.5 shadow-lg border border-neutral-100 dark:border-neutral-700 z-20 scale-0 group-hover:scale-100 transition-transform duration-500 delay-100">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                            </div>
                        </div>

                        {/* Course Path Preview */}
                        <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                            <div className="w-8 h-0.5 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                            <div className="w-8 h-0.5 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
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
        <div className={`mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 w-full ${className}`}>
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
