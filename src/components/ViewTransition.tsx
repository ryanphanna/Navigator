import React, { useEffect, useState } from 'react';

interface ViewTransitionProps {
    children: React.ReactNode;
    viewKey: string; // Changes when view changes, triggering re-animation
    className?: string;
}

/**
 * Wraps content with a subtle entrance animation.
 * Uses opacity + slight blur for a modern, non-PowerPoint feel.
 */
export const ViewTransition: React.FC<ViewTransitionProps> = ({
    children,
    viewKey,
    className = ''
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentKey, setCurrentKey] = useState(viewKey);

    useEffect(() => {
        // When viewKey changes, trigger re-animation
        if (viewKey !== currentKey) {
            setIsVisible(false);
            setCurrentKey(viewKey);
            // Small delay before showing new content
            const timer = setTimeout(() => setIsVisible(true), 50);
            return () => clearTimeout(timer);
        } else {
            // Initial mount
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewKey, currentKey]);

    return (
        <div
            className={`transition-all duration-200 ease-out ${className} ${isVisible
                ? 'opacity-100 blur-0 translate-y-0'
                : 'opacity-0 blur-[2px] translate-y-1'
                }`}
        >
            {children}
        </div>
    );
};
