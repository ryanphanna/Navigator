import React from 'react';
import type { ExperienceBlock } from '../types';

interface ResumePreviewProps {
    blocks: ExperienceBlock[];
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ blocks }) => {
    const summary = blocks.find(b => b.type === 'summary');
    const workExperience = blocks.filter(b => b.type === 'work');
    const education = blocks.filter(b => b.type === 'education');
    const projects = blocks.filter(b => b.type === 'project');
    const skills = blocks.filter(b => b.type === 'skill');
    const volunteer = blocks.filter(b => b.type === 'volunteer');
    const other = blocks.filter(b => b.type === 'other');

    const renderBlock = (block: ExperienceBlock) => (
        <div key={block.id} className="mb-6 last:mb-0">
            <div className="flex justify-between items-baseline mb-1">
                <h4 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">
                    {block.title}
                </h4>
                {block.dateRange && (
                    <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 shrink-0">
                        {block.dateRange}
                    </span>
                )}
            </div>
            {block.organization && (
                <div className="text-md font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    {block.organization}
                </div>
            )}
            {block.bullets && block.bullets.length > 0 && (
                <ul className="list-disc ml-4 space-y-1">
                    {block.bullets.map((bullet, idx) => bullet.trim() && (
                        <li key={idx} className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            {bullet}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    const renderSection = (title: string, sectionBlocks: ExperienceBlock[]) => {
        if (sectionBlocks.length === 0) return null;
        return (
            <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 border-b border-indigo-100 dark:border-indigo-900/50 pb-1">
                    {title}
                </h3>
                <div className="space-y-6">
                    {sectionBlocks.map(renderBlock)}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-neutral-900 p-12 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 min-h-[1056px] w-full max-w-[816px] mx-auto font-sans">
            {/* Header / Summary */}
            {summary && (
                <div className="mb-10">
                    <h2 className="text-3xl font-black text-neutral-900 dark:text-white mb-4 tracking-tight">
                        Professional Summary
                    </h2>
                    <p className="text-md text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {summary.bullets[0]}
                    </p>
                </div>
            )}

            {renderSection("Work Experience", workExperience)}
            {renderSection("Education", education)}
            {renderSection("Projects", projects)}
            {renderSection("Skills", skills)}
            {renderSection("Volunteer", volunteer)}
            {renderSection("Other", other)}

            {blocks.length === 0 && (
                <div className="h-full flex items-center justify-center text-neutral-300 italic">
                    Start adding content to see your preview here...
                </div>
            )}
        </div>
    );
};
