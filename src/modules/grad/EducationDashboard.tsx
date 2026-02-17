import React from 'react';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { SharedHeader } from '../../components/common/SharedHeader';
import { GraduationCap, Calculator, School, TrendingUp } from 'lucide-react';
import { useGlobalUI } from '../../contexts/GlobalUIContext';
import { HEADLINES, BENTO_CARDS } from '../../constants';

import { BentoCard, type BentoColorConfig } from '../../components/common/BentoCard';

export const EducationDashboard: React.FC = () => {
    const { setView } = useGlobalUI();
    const [activeHeadline, setActiveHeadline] = React.useState({ text: 'Accelerate your', highlight: 'Learning' });

    React.useEffect(() => {
        const choices = HEADLINES.edu;
        const randomChoice = choices[Math.floor(Math.random() * choices.length)];
        setActiveHeadline(randomChoice);
    }, []);

    const eduToolKeys = ['EDU_TRANSCRIPT', 'EDU_EXPLORER', 'EDU_GPA'] as const;

    const renderEduPreview = (id: string, color: BentoColorConfig) => {
        switch (id) {
            case 'edu-transcript':
                return (
                    <div className="relative w-full h-24 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                        <div className={`absolute inset-0 ${color.glow} blur-2xl opacity-10 group-hover:opacity-30 transition-opacity`} />

                        <div className="relative w-16 h-20 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-100 dark:border-neutral-700 p-2.5 flex flex-col gap-1.5 transform -rotate-3 group-hover:rotate-0 transition-all duration-500 overflow-hidden">
                            <div className="flex items-center gap-1.5 mb-1">
                                <GraduationCap className={`w-3 h-3 ${color.text}`} />
                                <div className="h-1.5 w-8 bg-neutral-100 dark:bg-neutral-700 rounded-full" />
                            </div>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="h-1 flex-1 bg-neutral-50 dark:bg-neutral-700/50 rounded-full" />
                                    <div className={`h-1 w-3 rounded-full ${i % 2 === 0 ? color.iconBg : 'bg-neutral-100 dark:bg-neutral-700'}`} />
                                </div>
                            ))}
                            <div className={`absolute bottom-0 right-0 w-8 h-8 ${color.bg} blur-xl opacity-40`} />
                        </div>

                        {/* Floating elements */}
                        <div className="absolute top-2 right-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-700">
                            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400">Dean's List</span>
                        </div>
                    </div>
                );
            case 'edu-explorer':
                return (
                    <div className="relative w-full h-24 flex items-center justify-center px-4 overflow-hidden">
                        <div className="absolute inset-0 flex flex-wrap gap-2 opacity-20 group-hover:opacity-40 transition-opacity blur-[1px] scale-110">
                            {['MSCS', 'MBA', 'PhD', 'JD', 'MD', 'MA', 'MFE'].map((prog, i) => (
                                <div key={i} className={`px-2 py-1 rounded-md text-[8px] font-black border ${color.accent} bg-white dark:bg-neutral-800`}>{prog}</div>
                            ))}
                        </div>

                        <div className="relative w-28 h-12 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-100 dark:border-neutral-700 z-10 flex items-center justify-between px-3 group-hover:-translate-y-2 transition-transform duration-500">
                            <div className="flex flex-col gap-1">
                                <div className="h-1.5 w-12 bg-neutral-100 dark:bg-neutral-700 rounded-full" />
                                <div className={`h-1.5 w-8 ${color.iconBg} rounded-full`} />
                            </div>
                            <div className={`w-6 h-6 rounded-lg ${color.iconBg}/10 flex items-center justify-center`}><School className={`w-3.5 h-3.5 ${color.text}`} /></div>
                        </div>

                        <div className={`absolute -bottom-2 -left-2 w-16 h-16 ${color.glow} blur-xl opacity-20 group-hover:opacity-40 transition-opacity`} />
                    </div>
                );
            case 'edu-gpa':
                return (
                    <div className="relative w-full h-24 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                        <div className={`absolute inset-0 ${color.glow} blur-2xl opacity-10 group-hover:opacity-30 transition-opacity`} />

                        {/* Grade Pillar Layout */}
                        <div className="flex items-end gap-3 h-16 relative z-10 p-1">
                            {[0.6, 0.8, 1, 0.9].map((scale, i) => (
                                <div key={i} className="flex flex-col gap-1 items-center">
                                    <div className="flex-grow w-3.5 bg-neutral-100 dark:bg-neutral-800 rounded-full relative overflow-hidden group/pillar h-16">
                                        <div
                                            className={`absolute bottom-0 w-full ${color.iconBg} rounded-full transition-all duration-1000 ease-out`}
                                            style={{ height: `${scale * 100}%`, transitionDelay: `${i * 100}ms` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                        </div>
                                    </div>
                                    <div className="text-[6px] font-black text-neutral-400 uppercase tracking-tighter">
                                        {['Y1', 'Y2', 'Y3', 'Y4'][i]}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Floating Scorecard */}
                        <div className="absolute -top-1 -right-4 bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 shadow-2xl z-20 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 group-hover:translate-x-2 transition-all duration-700 delay-300">
                            <div className="flex flex-col items-center">
                                <span className={`text-sm font-black ${color.text}`}>3.92</span>
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="w-2 h-2 text-emerald-500" />
                                    <span className="text-[6px] font-bold text-neutral-400 uppercase tracking-widest">Global GPA</span>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Icon */}
                        <div className="absolute bottom-2 -left-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-700 delay-100">
                            <Calculator className={`w-3 h-3 ${color.text}`} />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <SharedPageLayout maxWidth="full" animate={false} className="relative" spacing="hero">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob" />
                <div className="absolute top-40 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <SharedHeader
                    title={activeHeadline.text}
                    highlight={activeHeadline.highlight}
                    subtitle="Manage your academic journey, track your progress, and explore new educational opportunities all in one place."
                    theme="edu"
                />

                {/* Tools Grid - Precise match of home page grid system, centered with col-start */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 mt-12 animate-in fade-in duration-1000 delay-200">
                    {eduToolKeys.map((key, index) => {
                        const config = BENTO_CARDS[key];
                        if (!config) return null;

                        const Icon = key === 'EDU_TRANSCRIPT' ? GraduationCap :
                            key === 'EDU_EXPLORER' ? School : Calculator;

                        return (
                            <BentoCard
                                key={config.id}
                                id={config.id}
                                icon={Icon}
                                title={config.title.action}
                                description={config.description.action}
                                color={config.colors}
                                actionLabel={config.action.action}
                                onAction={() => setView(config.targetView)}
                                previewContent={renderEduPreview(config.id, config.colors)}
                                className={index === 0 ? 'xl:col-start-2' : ''}
                            />
                        );
                    })}
                </div>
            </div>
        </SharedPageLayout>
    );
};
