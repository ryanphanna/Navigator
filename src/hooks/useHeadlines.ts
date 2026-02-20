import { useState, useEffect, useMemo } from 'react';
import { HEADLINES } from '../constants';

type HeadlineType = 'all' | 'apply' | 'goal' | 'edu' | 'plans';

interface Headline {
    text: string;
    highlight: string;
}

export const useHeadlines = (type: HeadlineType) => {
    const choices = useMemo(() => HEADLINES[type], [type]);
    const [activeHeadline, setActiveHeadline] = useState<Headline>(choices[0]);

    useEffect(() => {
        const randomChoice = choices[Math.floor(Math.random() * choices.length)];
        setActiveHeadline(randomChoice);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [choices]);

    return activeHeadline;
};
