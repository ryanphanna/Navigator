import type { ExperienceBlock, CustomSkill } from '../../../types';

export interface StrengthResult {
    score: number;
    feedback: string;
    metrics: {
        depth: number;
        impact: number;
        alignment: number;
    };
}

export const calculateResumeStrength = (blocks: ExperienceBlock[], skills: CustomSkill[]): StrengthResult => {
    let score = 0;
    const visibleBlocks = blocks.filter(b => b.isVisible);
    const bullets = visibleBlocks.flatMap(b => b.bullets).filter(bul => bul.trim().length > 0);
    const skillNames = skills.map(s => s.name.toLowerCase());

    const actionVerbs = /^(Managed|Developed|Created|Led|Improved|Saved|Increase|Reduced|Architected|Spearheaded|Negotiated|Designed|Implemented|orchestrated|automated|transformed|accelerated|delivered)/i;

    // 1. Foundation Score (Max 25)
    const sectionTypes = new Set(visibleBlocks.map(b => b.type));
    if (sectionTypes.has('summary')) score += 5;
    if (sectionTypes.has('work')) score += 10;
    if (sectionTypes.has('education')) score += 5;
    if (sectionTypes.has('project') || sectionTypes.has('volunteer')) score += 5;

    // 2. Skill-Backed Content Score (Max 45)
    // A bullet only counts as "quality" if it mentions a recognized skill or is sufficiently detailed
    const qualityBullets = bullets.filter(b => {
        const hasSkill = skillNames.some(skill => b.toLowerCase().includes(skill));
        const hasAction = actionVerbs.test(b.trim());
        const isLong = b.length > 50;
        return (hasSkill && hasAction) || (hasSkill && isLong);
    });

    const depthScore = Math.min(45, qualityBullets.length * 8);
    score += depthScore;

    // 3. Quantification & Impact (Max 15)
    const impactBullets = qualityBullets.filter(b => /[0-9]%|\$|\b\d+\b/.test(b));
    const impactScore = Math.min(15, impactBullets.length * 5);
    score += impactScore;

    // 4. Skill Coverage / Evidence (Max 15)
    // How many of your "claimed skills" are actually proven in your experience?
    const allExperienceText = visibleBlocks.flatMap(b => [...b.bullets, b.title, b.organization]).join(' ').toLowerCase();
    const provenSkills = skillNames.filter(skill => allExperienceText.includes(skill));

    let alignmentScore = 0;
    if (skillNames.length > 0) {
        alignmentScore = (provenSkills.length / skillNames.length) * 15;
    } else if (qualityBullets.length > 3) {
        alignmentScore = 10; // Baseline if they have good content but haven't defined skills yet
    }
    score += alignmentScore;

    const finalScore = Math.min(100, Math.round(score));

    // Smart Feedback
    let feedback = "Great start! Add your first work experience to boost your score.";
    const missingProvenSkills = skillNames.filter(skill => !allExperienceText.includes(skill));

    if (skillNames.length === 0) {
        feedback = "Define your 'Top Skills' in the skills section to better align your resume.";
    } else if (missingProvenSkills.length > 0 && finalScore > 40) {
        feedback = `Your resume doesn't mention: ${missingProvenSkills.slice(0, 2).join(', ')}. Add evidence for these skills.`;
    } else if (impactScore < 10 && finalScore > 50) {
        feedback = "Strong skills, but try adding more metrics (%, $, numbers) to prove your impact.";
    } else if (finalScore >= 90) {
        feedback = "Elite resume! Your skills are perfectly backed by your experience.";
    } else if (finalScore < 40) {
        feedback = "Focus on writing detailed achievements that mention your core skills.";
    }

    return {
        score: finalScore,
        feedback,
        metrics: {
            depth: Math.round((depthScore / 45) * 100),
            impact: Math.round((impactScore / 15) * 100),
            alignment: Math.round((alignmentScore / 15) * 100)
        }
    };
};
