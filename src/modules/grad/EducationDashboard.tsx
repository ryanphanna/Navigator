import React from 'react';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { SharedHeader } from '../../components/common/SharedHeader';
import { GraduationCap, Calculator, School, BookOpen, ArrowRight } from 'lucide-react';
import { useGlobalUI } from '../../contexts/GlobalUIContext';
import { HEADLINES } from '../../constants';

export const EducationDashboard: React.FC = () => {
    const { setView } = useGlobalUI();
    const [activeHeadline, setActiveHeadline] = React.useState({ text: 'Accelerate your', highlight: 'Learning' });

    React.useEffect(() => {
        const choices = HEADLINES.edu;
        const randomChoice = choices[Math.floor(Math.random() * choices.length)];
        setActiveHeadline(randomChoice);
    }, []);

    const tools = [
        {
            id: 'academic-record',
            title: 'Academic Record',
            description: 'Manage your coursework, track credits, and monitor degree progress.',
            icon: GraduationCap,
            action: () => setView('edu-record'),
            color: 'bg-amber-500',
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            text: 'text-amber-600 dark:text-amber-400'
        },
        {
            id: 'programs',
            title: 'Program Explorer',
            description: 'Explore master\'s degrees and certificate programs tailored to your goals.',
            icon: School,
            action: () => setView('edu-record'),
            color: 'bg-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            text: 'text-emerald-600 dark:text-emerald-400'
        },
        {
            id: 'calculator',
            title: 'GPA Calculator',
            description: 'Calculate your GPA and see what grades you need to hit your targets.',
            icon: Calculator,
            action: () => setView('edu-record'),
            color: 'bg-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            text: 'text-blue-600 dark:text-blue-400'
        }
    ];

    return (
        <SharedPageLayout maxWidth="full" animate={false} className="relative" spacing="hero">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob" />
                <div className="absolute top-40 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SharedHeader
                    title={activeHeadline.text}
                    highlight={activeHeadline.highlight}
                    subtitle="Manage your academic journey, track your progress, and explore new educational opportunities all in one place."
                    theme="edu"
                />

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 animate-in fade-in duration-1000 delay-200">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={tool.action}
                            className="group relative p-8 rounded-[2rem] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/30 dark:hover:border-amber-500/30 transition-all text-left shadow-xl shadow-neutral-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-amber-500/10 active:scale-[0.98]"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${tool.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-inner`}>
                                <tool.icon className={`w-7 h-7 ${tool.text}`} />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                                {tool.title}
                            </h3>
                            <p className="text-base text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
                                {tool.description}
                            </p>
                            <div className="flex items-center text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest group-hover:gap-2 transition-all">
                                Open Tool <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </button>
                    ))}

                    {/* Coming Soon Card */}
                    <div className="relative p-8 rounded-[2rem] bg-neutral-50/50 dark:bg-neutral-900/50 border-2 border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center text-center opacity-75">
                        <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6 text-neutral-400">
                            <BookOpen className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                            More Coming Soon
                        </h3>
                        <p className="text-base text-neutral-500 dark:text-neutral-400">
                            We're building more tools to help you succeed.
                        </p>
                    </div>
                </div>
            </div>
        </SharedPageLayout>
    );
};
