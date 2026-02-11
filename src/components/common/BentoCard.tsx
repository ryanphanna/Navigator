import React, { useState, useRef } from 'react';
import { ArrowRight, type LucideIcon } from 'lucide-react';

export interface BentoColorConfig {
    bg: string;
    text: string;
    accent: string;
    iconBg: string;
    preview: string;
    glow: string;
}

export interface BentoCardProps {
    id: string;
    icon: LucideIcon;
    title: string;
    description: string;
    color: BentoColorConfig;
    previewContent?: React.ReactNode;
    actionLabel: string;
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

        const rotateX = (e.clientY - centerY) / 30; // Reduced tilt for more subtle feel
        const rotateY = (centerX - e.clientX) / 30;

        setTilt({ x: rotateX, y: rotateY });

        const shimmerX = ((e.clientX - rect.left) / rect.width) * 100;
        const shimmerY = ((e.clientY - rect.top) / rect.height) * 100;
        setShimmer({ x: shimmerX, y: shimmerY });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: tilt.x === 0 ? 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)' : 'none'
            }}
            className={`group relative bg-white dark:bg-neutral-900/40 backdrop-blur-2xl rounded-3xl p-6 border ${color.accent} shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 text-left overflow-hidden h-full flex flex-col ${className}`}
        >
            {/* Dynamic Mouse Shimmer */}
            <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-700 z-0"
                style={{
                    background: `radial-gradient(circle at ${shimmer.x}% ${shimmer.y}%, rgba(255,255,255,0.4) 0%, transparent 70%)`
                }}
            />

            {/* Ambient Background Glow */}
            <div className={`absolute top-0 right-0 w-48 h-48 ${color.glow} rounded-full blur-[80px] -mr-24 -mt-24 transition-all duration-1000 opacity-30 group-hover:opacity-60 group-hover:scale-125`} />

            <div className="flex items-center gap-5 relative z-10 mb-4">
                <div className={`w-14 h-14 ${color.iconBg} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ease-out`}>
                    <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight leading-none">
                    {title}
                </h3>
            </div>

            <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6 relative z-10 font-medium">
                {description}
            </p>

            {/* Preview Section - More dynamic height and better integration */}
            <div className="relative mt-auto pt-6 border-t border-neutral-100 dark:border-white/5">
                <div className="relative z-10 flex items-center justify-center min-h-[80px] transform group-hover:scale-105 transition-transform duration-700 ease-out">
                    {previewContent}
                </div>

                {/* Modern Action Bar */}
                <div
                    className={`mt-6 flex items-center justify-end gap-2 ${color.text} font-black text-[10px] tracking-[0.15em] uppercase transition-all relative z-10 cursor-pointer group/btn`}
                    onClick={onAction}
                >
                    <span>{actionLabel}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
            </div>
        </div>
    );
};
