import React, { useEffect, useRef, useState } from 'react';

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
    const [prevViewKey, setPrevViewKey] = useState(viewKey);
    const isMountedRef = useRef(false);

    if (viewKey !== prevViewKey) {
        setPrevViewKey(viewKey);
        setIsVisible(false);
    }

    useEffect(() => {
        const delay = isMountedRef.current ? 50 : 10;
        isMountedRef.current = true;
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [viewKey]);

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
