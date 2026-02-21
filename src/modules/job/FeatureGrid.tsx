import React, { useMemo } from 'react';
import { FEATURE_REGISTRY, FEATURE_RANKINGS, getFeatureColor, type FeatureDefinition } from '../../featureRegistry';
import { getPreviewComponent } from '../../components/common/FeaturePreviews';
import { Mail, TrendingUp, PenTool, Sparkles, FileText, GraduationCap, Bookmark, Zap, RefreshCw, Shield, Users, Globe, Search, Calculator, MessageSquare, Rss, type LucideIcon } from 'lucide-react';
import { BentoCard } from '../../components/ui/BentoCard';
import { EventService } from '../../services/eventService';
import type { User } from '@supabase/supabase-js';

// Icon Map — resolves string icon names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
    Sparkles,
    TrendingUp,
    Zap,
    FileText,
    GraduationCap,
    Bookmark,
    PenTool,
    Mail,
    RefreshCw,
    Shield,
    Users,
    Globe,
    Search,
    Calculator,
    MessageSquare,
    Rss,
} as const;

interface FeatureGridProps {
    user: User | null;
    onNavigate?: (view: string) => void;
    onShowAuth?: (feature?: FeatureDefinition) => void;
    isAdmin?: boolean;
    isTester?: boolean;
    userTier?: string;
    journey?: string;
    className?: string;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({
    user,
    onNavigate,
    onShowAuth,
    isAdmin: propIsAdmin,
    isTester: propIsTester,
    journey = 'job-hunter',
    userTier = 'free',
    className = ""
}) => {

    // Prioritize props
    const isAdmin = propIsAdmin;
    const isTester = propIsTester;

    // Content Strategy: Logged-in users see short/punchy text; logged-out see full descriptions
    const isLoggedIn = !!user && userTier !== 'free';
    const descriptionKey = isLoggedIn ? 'short' : 'full';
    const actionKey = isLoggedIn ? 'short' : 'full';

    const cardKeys = useMemo(() => {
        // 1. All available homepage cards
        const allKeys = Object.keys(FEATURE_REGISTRY).filter(key => {
            const config = FEATURE_REGISTRY[key];
            if (!config || !config.showOnHomepage) return false;

            // Education requires Admin/Tester
            if (config.category === 'EDUCATION') return isAdmin || isTester;

            return true;
        });

        // 2. Define Rank Helper (Centralized)
        const getEffectiveRank = (key: string): number => {
            const rankingKey = (userTier && FEATURE_RANKINGS[userTier]) ? userTier : (journey || 'job-hunter');
            const rankings = FEATURE_RANKINGS[rankingKey] || FEATURE_RANKINGS['job-hunter'];
            const rankIndex = rankings.indexOf(key);
            return rankIndex !== -1 ? rankIndex : 99;
        };

        // 3. Selection Logic: One from each bucket, then fill by rank
        const selectedKeys: string[] = [];
        const seenCategories = new Set<string>();

        const sortedAll = allKeys.sort((a, b) => getEffectiveRank(a) - getEffectiveRank(b));

        // Pass 1: Pick the top card from each available category
        for (const key of sortedAll) {
            const config = FEATURE_REGISTRY[key];
            if (config && !seenCategories.has(config.category)) {
                selectedKeys.push(key);
                seenCategories.add(config.category);
            }
        }

        // Pass 2: Fill remaining slots up to 5 based on global rank
        for (const key of sortedAll) {
            if (selectedKeys.length >= 5) break;
            if (!selectedKeys.includes(key)) {
                selectedKeys.push(key);
            }
        }

        // Final sort of selected keys to maintain ranking order for display
        return selectedKeys.sort((a, b) => getEffectiveRank(a) - getEffectiveRank(b));
    }, [isAdmin, isTester, journey, userTier]);

    const handleAction = (feature: FeatureDefinition) => {
        // Track curiosity (Interest)
        EventService.trackInterest(feature.id);

        if (user) {
            onNavigate?.(feature.targetView);
        } else {
            // Logged out behavior
            if (onShowAuth) {
                onShowAuth(feature);
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
                    const config = FEATURE_REGISTRY[key];
                    if (!config) return null;

                    const color = getFeatureColor(config);
                    const Icon = ICON_MAP[config.iconName];

                    return (
                        <BentoCard
                            key={config.id}
                            id={config.id}
                            icon={Icon}
                            title={config.shortName}
                            description={config.description[descriptionKey]}
                            color={color}
                            actionLabel={config.action[actionKey]}
                            previewContent={getPreviewComponent(config.id, color)}
                            onAction={() => handleAction(config)}
                        />
                    );
                })}
            </div>
        </div>
    );
};
