import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { FeatureGrid } from './FeatureGrid';
import { useHeadlines } from '../../hooks/useHeadlines';
import { PageHeader } from '../../components/ui/PageHeader';

import type { User } from '@supabase/supabase-js';

interface HomePageProps {
    user: User | null;
    isAdmin?: boolean;
    isTester?: boolean;
    onNavigate?: (view: string) => void;
    onShowAuth?: (feature?: any) => void;
    journey?: string;
    userTier?: string;
}

const HomePage: React.FC<HomePageProps> = ({
    user,
    isAdmin = false,
    isTester = false,
    onNavigate,
    onShowAuth,
    journey = 'job-hunter',
    userTier = 'free',
}) => {
    const headlineCategory = journey === 'student' ? 'edu' : 'all';
    const activeHeadline = useHeadlines(headlineCategory);

    return (
        <SharedPageLayout
            maxWidth="full"
            className="relative theme-job"
            spacing="hero"
        >
            {/* Hero Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none z-0">
                <div className="absolute top-[-100px] left-1/4 w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full animate-[pulse_8s_ease-in-out_infinite]" />
                <div className="absolute top-[100px] right-1/4 w-[400px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full animate-[pulse_10s_ease-in-out_infinite_1s]" />
            </div>

            <PageHeader
                variant="hero"
                title={activeHeadline.text}
                highlight={activeHeadline.highlight}
                className="mb-8"
                subtitle=""
            />

            <div className="w-full max-w-6xl mx-auto">
                <FeatureGrid
                    user={user}
                    onNavigate={onNavigate}
                    onShowAuth={(feature) => onShowAuth?.(feature)}
                    isAdmin={isAdmin}
                    isTester={isTester}
                    userTier={userTier}
                    journey={journey}
                    className="mb-4"
                />

                <div className="flex justify-center mb-8 animate-in fade-in duration-700 delay-300">
                    <a
                        href="/features"
                        className="group flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                    >
                        Explore all features
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </div>
        </SharedPageLayout>
    );
};

export default HomePage;
