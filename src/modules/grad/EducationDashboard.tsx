import React from 'react';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { GraduationCap, Calculator, School, BookOpen, ArrowRight } from 'lucide-react';
import { useGlobalUI } from '../../contexts/GlobalUIContext';

export const EducationDashboard: React.FC = () => {
    const { setView } = useGlobalUI();

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
        // Placeholder for future tools or direct links if we want to expose them
        {
            id: 'programs',
            title: 'Program Explorer',
            description: 'Explore master\'s degrees and certificate programs tailored to your goals.',
            icon: School,
            action: () => setView('edu-record'), // Currently part of record, but could be separate
            color: 'bg-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            text: 'text-emerald-600 dark:text-emerald-400'
        },
        {
            id: 'calculator',
            title: 'GPA Calculator',
            description: 'Calculate your GPA and see what grades you need to hit your targets.',
            icon: Calculator,
            action: () => setView('edu-record'), // Integrated in record for now
            color: 'bg-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            text: 'text-blue-600 dark:text-blue-400'
        }
    ];

    return (
        <SharedPageLayout maxWidth="full" className="relative">
            <div className="max-w-7xl mx-auto space-y-8 py-8 animate-in fade-in duration-500">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
                    <div className="relative p-8 sm:p-12">
                        <div className="max-w-2xl">
                            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                                Education Command Center
                            </h1>
                            <p className="text-lg text-neutral-400 mb-8">
                                Manage your academic journey, track your progress, and explore new educational opportunities all in one place.
                            </p>
                            <button
                                onClick={() => setView('edu-record')}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-neutral-900 font-bold hover:bg-neutral-100 transition-colors"
                            >
                                <GraduationCap className="w-5 h-5" />
                                Go to Academic Record
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={tool.action}
                            className="group relative p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all text-left shadow-sm hover:shadow-md"
                        >
                            <div className={`w-12 h-12 rounded-xl ${tool.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                                <tool.icon className={`w-6 h-6 ${tool.text}`} />
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                                {tool.title}
                            </h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                                {tool.description}
                            </p>
                            <div className="flex items-center text-sm font-semibold text-neutral-900 dark:text-white group-hover:gap-2 transition-all">
                                Open Tool <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </button>
                    ))}

                    {/* Coming Soon Card */}
                    <div className="relative p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 border-dashed flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 text-neutral-400">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                            More Coming Soon
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            We're building more tools to help you succeed.
                        </p>
                    </div>
                </div>
            </div>
        </SharedPageLayout>
    );
};
