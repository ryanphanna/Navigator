import type { ResumeProfile } from '../modules/resume/types';


export interface Tip {
    id: string;
    text: string;
    category: 'quantification' | 'formatting' | 'strategy' | 'ats' | 'narrative';
}

const GENERAL_TIPS: Tip[] = [
    {
        id: 'quant-1',
        text: 'Instead of "Managed a team", try "Led a team of 10 to exceed sales targets by 24%". Numbers catch the eye.',
        category: 'quantification'
    },
    {
        id: 'ats-1',
        text: 'Use standard section headings like "Work Experience" and "Education". Creative titles can confuse some ATS filters.',
        category: 'ats'
    },
    {
        id: 'strat-1',
        text: 'Tailor your summary for every job. Mirror the language used in the job description to show immediate alignment.',
        category: 'strategy'
    },
    {
        id: 'narrative-1',
        text: 'Your resume should tell a story of growth. Highlight how your responsibilities increased at each career step.',
        category: 'narrative'
    },
    {
        id: 'quant-2',
        text: 'Think about the "So What?". For every bullet point, ask yourself how it helped the company save time, money, or effort.',
        category: 'quantification'
    },
    {
        id: 'formatting-1',
        text: 'Keep your formatting consistent. If you use "Jan" for one date, don\'t use "January" for another.',
        category: 'formatting'
    }
];

export class TipService {
    static getTip(resume?: ResumeProfile): Tip {
        if (!resume || resume.blocks.length === 0) {
            return {
                id: 'onboarding-1',
                text: 'Pro Tip: Import your current resume to see how our AI identifies your hidden strengths and skill gaps.',
                category: 'strategy'
            };
        }

        const hasSummary = resume.blocks.some(b => b.type === 'summary');
        if (!hasSummary) {
            return {
                id: 'context-summary',
                text: 'Pro Tip: Add a Professional Summary. It\'s your elevator pitch to recruiters and helps set the tone for your profile.',
                category: 'narrative'
            };
        }

        const workBlocks = resume.blocks.filter(b => b.type === 'work');
        const lowBulletCount = workBlocks.some(b => b.bullets.length < 2);
        if (lowBulletCount) {
            return {
                id: 'context-bullets',
                text: 'Pro Tip: Detailed achievements beat lists of duties. Try to add 3-5 high-impact bullet points for your most recent roles.',
                category: 'quantification'
            };
        }

        // Return a random general tip
        return GENERAL_TIPS[Math.floor(Math.random() * GENERAL_TIPS.length)];
    }
}
