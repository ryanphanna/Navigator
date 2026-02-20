import React, { useState, useRef } from 'react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
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

            <div className="flex items-start gap-3 relative z-10 mb-2 min-h-[2.5rem]">
                <div className={`w-10 h-10 shrink-0 ${iconBgClass} ${iconColorClass} rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ease-out`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-neutral-900 dark:text-white tracking-tight leading-tight pt-0.5">
                    {title}
                </h3>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-2 relative z-10 font-medium">
                {description}
            </p>

            {/* Preview Section */}
            <div className="relative pt-4 border-t border-neutral-100 dark:border-white/5">
                <div className="relative z-10 transform group-hover:scale-105 transition-transform duration-700 ease-out">
                    {previewContent}
                </div>

                {/* Action Bar */}
                {actionLabel && (
                    <div
                        className={`mt-3 flex items-center justify-end gap-2 ${actionTextClass} font-black text-[10px] tracking-[0.15em] uppercase transition-all relative z-10 cursor-pointer group/btn`}
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
    );
};
