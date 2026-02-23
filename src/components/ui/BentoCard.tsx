import React, { useState, useRef } from 'react';
import { ArrowRight, X, type LucideIcon } from 'lucide-react';
import type { FeatureColor } from '../../featureRegistry';

export interface BentoCardProps {
    id: string;
    icon: LucideIcon;
    title: string;
    description: string;
    color?: FeatureColor;
    previewContent?: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    onDismiss?: (e: React.MouseEvent) => void;
    isComingSoon?: boolean;
    badge?: string;
    className?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({
    icon: Icon,
    title,
    description,
    color,
    previewContent,
    actionLabel,
    onAction,
    onDismiss,
    isComingSoon = false,
    badge,
    className = "",
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [shimmer, setShimmer] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const rotateX = (e.clientY - centerY) / 30;
        const rotateY = (centerX - e.clientX) / 30;

        setTilt({ x: rotateX, y: rotateY });

        const shimmerX = ((e.clientX - rect.left) / rect.width) * 100;
        const shimmerY = ((e.clientY - rect.top) / rect.height) * 100;
        setShimmer({ x: shimmerX, y: shimmerY });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    // Use color-specific classes when available, fallback to accent defaults
    const iconBgClass = color?.iconBg || 'bg-neutral-100 dark:bg-white/5';
    const borderAccentClass = color?.accent || 'border-neutral-200 dark:border-white/10';
    const glowClass = color?.glow || 'bg-accent-primary/15';
    const actionTextClass = color?.text || 'text-accent-primary-hex';
    const iconColorClass = color ? 'text-white' : 'text-neutral-700 dark:text-neutral-300';

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: tilt.x === 0
                    ? 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)'
                    : `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px)`,
                transition: tilt.x === 0 ? 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)' : 'transform 0.1s ease-out, box-shadow 0.3s ease-out'
            }}
            className={`group relative bg-white dark:bg-neutral-900/40 backdrop-blur-2xl rounded-3xl p-4 border ${borderAccentClass} h-full shadow-xl shadow-black/5 dark:shadow-none hover:shadow-2xl hover:shadow-indigo-500/10 text-left overflow-hidden flex flex-col cursor-pointer ${className}`}
            onClick={onAction}
        >
            {/* Dynamic Mouse Shimmer */}
            <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-700 z-0"
                style={{
                    background: `radial-gradient(circle at ${shimmer.x}% ${shimmer.y}%, rgba(255,255,255,0.4) 0%, transparent 70%)`
                }}
            />

            {/* Ambient Background Glow */}
            <div className={`absolute top-0 right-0 w-48 h-48 ${glowClass} rounded-full blur-[80px] -mr-24 -mt-24 transition-all duration-1000 opacity-30 group-hover:opacity-60 group-hover:scale-125`} />

            {/* Dismiss Button */}
            {onDismiss && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(e);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-neutral-100/50 dark:bg-white/5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-all z-20"
                >
                    <X className="w-3 h-3" />
                </button>
            )}

            <div className="flex items-start justify-between relative z-10 mb-2">
                <div className={`w-10 h-10 shrink-0 ${iconBgClass} ${iconColorClass} rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ease-out`}>
                    <Icon className="w-5 h-5" />
                </div>

                <div className="flex gap-1 pt-1.5">
                    {badge && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-[8px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/10 uppercase">
                            {badge}
                        </span>
                    )}
                    {isComingSoon && (
                        <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-white/5 text-[8px] font-black tracking-widest text-neutral-400 dark:text-neutral-500 rounded-md border border-neutral-200/50 dark:border-white/5 uppercase">
                            Soon
                        </span>
                    )}
                </div>
            </div>

            <div className="relative z-10 mb-1.5 h-[2.75rem] flex flex-col justify-start">
                <h3 className="text-lg font-black text-neutral-900 dark:text-white tracking-tight leading-tight line-clamp-2">
                    {title}
                </h3>
            </div>

            <div className="min-h-[3rem] mb-4">
                <p className="text-[12px] text-neutral-500 dark:text-neutral-400 leading-relaxed relative z-10 font-medium line-clamp-3">
                    {description}
                </p>
            </div>

            {/* Preview Section */}
            <div className="relative mt-auto pt-4 border-t border-neutral-100 dark:border-white/5">
                <div className="relative z-10 transform group-hover:scale-105 transition-transform duration-700 ease-out">
                    {previewContent}
                </div>

                {/* Action Bar Area - Reserved space for alignment */}
                <div className="mt-4 h-6 flex items-center justify-end relative z-10">
                    {actionLabel && !isComingSoon && (
                        <div
                            className={`flex items-center gap-2 ${actionTextClass} font-black text-[10px] tracking-[0.15em] uppercase transition-all cursor-pointer group/btn`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onAction?.();
                            }}
                        >
                            <span>{actionLabel}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
