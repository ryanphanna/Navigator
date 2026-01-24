import React, { useState } from 'react';
import type { SavedJob, ResumeProfile } from '../types';
import { generateCoverLetter, analyzeJobFit, critiqueCoverLetter, tailorExperienceBlock } from '../services/geminiService';
import { Storage } from '../services/storageService';
import {
    ArrowLeft, Loader2, Sparkles, AlertCircle, Briefcase, ThumbsUp, CheckCircle, AlertTriangle, XCircle, FileText, Check, Copy, PenTool, BookOpen, Users, ThumbsDown, Lock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UsageModal } from './UsageModal';

interface JobDetailProps {
    job: SavedJob;
    resumes: ResumeProfile[];
    onBack: () => void;
    onUpdateJob: (job: SavedJob) => void;
    userTier?: 'free' | 'pro' | 'admin' | 'tester';
}

type Tab = 'analysis' | 'resume' | 'cover-letter' | 'job-post';

const JobDetail: React.FC<JobDetailProps> = ({ job, resumes, onBack, onUpdateJob, userTier = 'free' }) => {
    const [activeTab, setActiveTab] = useState<Tab>('analysis');
    const [generating, setGenerating] = useState(false);
    const [localJob, setLocalJob] = useState(job);
    const [showUsage, setShowUsage] = useState(false);
    const [copiedState, setCopiedState] = useState<'summary' | 'cl' | null>(null);
    const [rated, setRated] = useState<1 | -1 | null>(null);

    // Retry / Manual Entry State
    const [manualText, setManualText] = useState('');
    const [retrying, setRetrying] = useState(false);

    // Hyper-Tailoring State
    const [tailoringBlock, setTailoringBlock] = useState<string | null>(null); // Block ID currently being rewritten


    // Handle Escape Key (Back) - Only if no modals are open
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // If sub-modal is open, don't go back (let modal handle it)
                if (!showUsage) {
                    onBack();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onBack, showUsage]);

    const analysis = localJob.analysis;

    const handleCopy = async (text: string, type: 'summary' | 'cl') => {
        try {
            await navigator.clipboard.writeText(text);

            // Log optimization event on copy (this is a "vote" for the content)
            if (type === 'cl' && localJob.initialCoverLetter && localJob.promptVersion) {
                Storage.logOptimizationEvent(localJob.id, localJob.promptVersion, localJob.initialCoverLetter, text);
            }

            setCopiedState(type);
            setTimeout(() => setCopiedState(null), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    // Auto-generate summary when entering Resume tab


    // Guard clause for Missing / Error state -> Show Retry UI
    if (!analysis || localJob.status === 'error') {
        const handleRetry = async () => {
            if (!manualText.trim()) return;
            setRetrying(true);
            try {
                const result = await analyzeJobFit(manualText, resumes);
                const updatedJob: SavedJob = {
                    ...localJob,
                    status: 'analyzing',
                    description: manualText,
                    analysis: result
                };
                Storage.updateJob(updatedJob);
                setLocalJob(updatedJob);
                onUpdateJob(updatedJob);
            } catch (e) {
                console.error(e);
                alert(`Analysis failed: ${(e as Error).message} `);
            } finally {
                setRetrying(false);
            }
        };

        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to History
                    </button>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* Header Card */}
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-center">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-slate-900 mb-1">Error</h2>
                                    <p className="text-slate-700 text-sm leading-relaxed">
                                        This website prevented us from automatically gathering information about this job.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Instructions Card */}
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 h-full flex flex-col justify-center">
                            <h3 className="text-base font-semibold text-slate-900 mb-4">Here's what to do:</h3>
                            <ol className="space-y-4 text-sm text-slate-600">
                                <li className="flex gap-3 items-center">
                                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                    <span>
                                        Open the job posting in another tab.
                                    </span>
                                </li>
                                <li className="flex gap-3 items-center">
                                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                    <span>Copy the entire description</span>
                                </li>
                                <li className="flex gap-3 items-center">
                                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                    <span>Paste it below</span>
                                </li>
                            </ol>
                        </div>
                    </div>

                    {/* Input Card */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
                            Paste Job Description
                        </label>
                        <textarea
                            className="w-full h-72 p-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-sm leading-relaxed transition-all resize-none font-mono"
                            placeholder="Paste the full job description here... Include the title, company name, requirements, and responsibilities."
                            value={manualText}
                            onChange={e => setManualText(e.target.value)}
                            autoFocus
                        />

                        <div className="flex justify-between items-center pt-4">
                            <div className="text-xs text-slate-500">
                                {manualText.length} characters
                                {manualText.length > 0 && manualText.length < 100 && (
                                    <span className="text-orange-600 ml-2">⚠️ Too short - add more details</span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onBack}
                                    className="px-4 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRetry}
                                    disabled={!manualText.trim() || manualText.length < 100 || retrying}
                                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30"
                                >
                                    {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {retrying ? 'Analyzing Job Fit...' : 'Analyze Job Fit'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleGenerateCoverLetter = async (critiqueContext?: string) => {
        setGenerating(true);
        try {
            const bestResume = resumes.find(r => r.id === analysis.bestResumeProfileId) || resumes[0];
            const textToUse = localJob.description || `Role: ${analysis.distilledJob.roleTitle} at ${analysis.distilledJob.companyName} `;

            // Combine user context with critique instructions if strictly fixing
            let finalContext = localJob.contextNotes;
            let instructions = analysis.tailoringInstructions;

            if (critiqueContext) {
                finalContext = critiqueContext;
                instructions = [...instructions, "CRITIQUE_FIX"];
            } else if (localJob.contextNotes) {
                finalContext = localJob.contextNotes;
            }

            const { text: letter, promptVersion } = await generateCoverLetter(
                textToUse,
                bestResume,
                instructions,
                finalContext
            );

            const updated = {
                ...localJob,
                coverLetter: letter,
                initialCoverLetter: letter, // Save original for diffing
                promptVersion: promptVersion,
                coverLetterCritique: undefined
            };

            Storage.updateJob(updated);
            setLocalJob(updated);
            onUpdateJob(updated);
            onUpdateJob(updated);
        } catch (e) {
            console.error(e);
            alert(`Failed to generate cover letter: ${(e as Error).message} `);
        } finally {
            setGenerating(false);
        }
    };

    const handleRunCritique = async () => {
        if (!localJob.coverLetter) return;
        setGenerating(true);
        try {
            const textToUse = localJob.description || `Role: ${analysis.distilledJob.roleTitle} at ${analysis.distilledJob.companyName}`;
            const critique = await critiqueCoverLetter(textToUse, localJob.coverLetter);

            const updated = { ...localJob, coverLetterCritique: critique };
            Storage.updateJob(updated);
            setLocalJob(updated);
            onUpdateJob(updated);
        } catch (e) {
            alert("Failed to critique letter: " + (e as Error).message);
        } finally {
            setGenerating(false);
        }
    };

    const handleUpdateContext = (text: string) => {
        const updated = { ...localJob, contextNotes: text };
        Storage.updateJob(updated);
        setLocalJob(updated);
        onUpdateJob(updated);
    };

    const handleCopyResume = async () => {
        if (!analysis || !analysis.bestResumeProfileId) return;
        setGenerating(true);
        try {
            const bestResume = resumes.find(r => r.id === analysis.bestResumeProfileId) || resumes[0];
            if (!bestResume) throw new Error("Resume not found");

            // Used recommended blocks or fallback to all active blocks
            const blocks = bestResume.blocks.filter(b =>
                analysis.recommendedBlockIds ? analysis.recommendedBlockIds.includes(b.id) : b.isVisible
            );

            // Organize blocks by type
            const experience = blocks.filter(b => b.type === 'work');
            const projects = blocks.filter(b => b.type === 'project');
            const education = blocks.filter(b => b.type === 'education');

            // Format Function
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formatBlock = (b: any) => {
                return `** ${b.title}** | ${b.organization} \n${b.dateRange} \n${b.bullets.map((bull: string) => `- ${bull}`).join('\n')} `;
            };

            const resumeText = [
                `# ${bestResume.name} `,
                `[Email] | [Phone] | [LinkedIn]`,
                `\n## Professional Summary\n${analysis.distilledJob.roleTitle ? `Targeting: ${analysis.distilledJob.roleTitle}` : ''} `,
                `\n## Core Competencies`,
                `${analysis.distilledJob.keySkills.join(' • ')} `,
                experience.length > 0 ? `\n## Experience` : '',
                experience.map(formatBlock).join('\n\n'),
                projects.length > 0 ? `\n## Projects` : '',
                projects.map(formatBlock).join('\n\n'),
                education.length > 0 ? `\n## Education` : '',
                education.map(formatBlock).join('\n\n'),
            ].filter(Boolean).join('\n');

            await navigator.clipboard.writeText(resumeText);
            alert("Full Tailored Resume copied to clipboard!");

        } catch (e) {
            console.error(e);
            alert("Failed to generate resume: " + (e as Error).message);
        } finally {
            setGenerating(false);
        }
    };

    const handleStatusChange = (newStatus: SavedJob['status']) => {
        const updated = { ...localJob, status: newStatus };

        // Log optimization if applying
        if (newStatus === 'applied' && localJob.initialCoverLetter && localJob.coverLetter && localJob.promptVersion) {
            Storage.logOptimizationEvent(localJob.id, localJob.promptVersion, localJob.initialCoverLetter, localJob.coverLetter);
        }

        Storage.updateJob(updated);
        setLocalJob(updated);
        onUpdateJob(updated);
    };



    const handleHyperTailor = async (block: any) => {
        if (userTier === 'free') return; // Should be blocked by UI, but safety check

        setTailoringBlock(block.id);
        try {
            const textToUse = localJob.description || `Role: ${analysis.distilledJob.roleTitle}`;

            // Find relevant instructions for this specific block type/content
            // (Simple heuristic: pass all instructions for now, let AI pick)
            const instructions = analysis.tailoringInstructions;

            const newBullets = await tailorExperienceBlock(block, textToUse, instructions);

            const updatedJob = {
                ...localJob,
                tailoredResumes: {
                    ...(localJob.tailoredResumes || {}),
                    [block.id]: newBullets
                }
            };

            Storage.updateJob(updatedJob);
            setLocalJob(updatedJob);
            onUpdateJob(updatedJob);

        } catch (e) {
            console.error("Hyper-tailor failed", e);
            alert("Failed to rewrite bullets. Please try again.");
        } finally {
            setTailoringBlock(null);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600 ring-green-500';
        if (score >= 70) return 'text-indigo-600 ring-indigo-500';
        if (score >= 50) return 'text-yellow-600 ring-yellow-500';
        return 'text-red-600 ring-red-500';
    };

    if (!localJob) return <div>Job not found</div>;

    const tabsList = [
        { id: 'analysis', label: 'Analysis', icon: CheckCircle },
        { id: 'job-post', label: 'Job Post', icon: BookOpen },
        { id: 'resume', label: 'Resume', icon: FileText },
        { id: 'cover-letter', label: 'Cover Letter', icon: PenTool },
    ];

    return (
        <div className="bg-white h-full flex flex-col">
            <UsageModal
                isOpen={showUsage}
                onClose={() => setShowUsage(false)}
                apiStatus="ok"
                quotaStatus="normal"
                cooldownSeconds={0}
            />
            {/* Header */}
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 truncate max-w-md">
                            {analysis.distilledJob.roleTitle}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Briefcase className="w-4 h-4" />
                            <span>{analysis.distilledJob.companyName}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-medium uppercase tracking-wide">
                                {localJob.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="h-6 w-px bg-slate-200 mx-2" />
                    <select
                        value={localJob.status}
                        onChange={(e) => handleStatusChange(e.target.value as SavedJob['status'])}
                        className="text-sm border-none bg-slate-50 rounded-lg px-3 py-2 font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                        <option value="new">New</option>
                        <option value="analyzing">Analyzing</option>
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-slate-200">
                <div className="flex gap-6">
                    {tabsList.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`
py - 4 text - sm font - medium border - b - 2 transition - all flex items - center gap - 2
                                ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }
`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                <div className="max-w-4xl mx-auto relative">

                    {/* ANALYSIS TAB */}
                    {activeTab === 'analysis' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Analysis Header & Score */}
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-900">AI Compatibility Analysis</h3>
                                    <div className="flex items-center gap-3">
                                        <div className={`px - 3 py - 1 rounded - full text - sm font - bold bg - slate - 100 ${getScoreColor(analysis.compatibilityScore).split(' ')[0]} `}>
                                            {analysis.compatibilityScore >= 90 ? 'Excellent Match' :
                                                analysis.compatibilityScore >= 75 ? 'Strong Match' :
                                                    analysis.compatibilityScore >= 50 ? 'Fair Match' : 'Weak Match'}
                                        </div>
                                        <span className={`text - 3xl font - bold ${getScoreColor(analysis.compatibilityScore).split(' ')[0]} `}>
                                            {analysis.compatibilityScore}%
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
                                    <div
                                        className={`h - full rounded - full transition - all duration - 1000 ease - out ${analysis.compatibilityScore >= 90 ? 'bg-green-500' :
                                            analysis.compatibilityScore >= 70 ? 'bg-indigo-500' :
                                                analysis.compatibilityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                            } `}
                                        style={{ width: `${analysis.compatibilityScore}% ` }}
                                    />
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <p className="text-slate-700 leading-relaxed text-sm font-medium">
                                        <span className="text-indigo-600 font-bold mr-2">Why?</span>
                                        {analysis.reasoning}
                                    </p>
                                </div>
                            </div>

                            {/* Two Col Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Strengths */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100/50">
                                    <h4 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
                                        <ThumbsUp className="w-4 h-4 text-emerald-500" />
                                        Matching Strengths
                                    </h4>
                                    <ul className="space-y-3">
                                        {(analysis.strengths || []).map((s: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-slate-600 bg-emerald-50/50 p-2.5 rounded-lg">
                                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Gaps */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-rose-100/50">
                                    <h4 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
                                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                                        Missing / Weak Areas
                                    </h4>
                                    <ul className="space-y-3">
                                        {(analysis.weaknesses || []).map((w: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-slate-600 bg-rose-50/50 p-2.5 rounded-lg">
                                                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                                {w}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* JOB POST TAB */}
                    {activeTab === 'job-post' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                {/* Metadata Header */}
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center min-h-[52px]">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Source</span>
                                        <span className="text-sm text-slate-500 italic">Manual Entry / Pasted</span>
                                    </div>

                                    {analysis.distilledJob.applicationDeadline && (
                                        <div className="flex items-center gap-2 text-xs font-medium text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100">
                                            <span>Due: {analysis.distilledJob.applicationDeadline}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-8 space-y-8">
                                    {/* Key Skills */}
                                    <div>
                                        <h4 className="flex items-center gap-2 font-bold text-slate-900 mb-4 uppercase text-sm tracking-wider">
                                            <Sparkles className="w-4 h-4 text-indigo-500" />
                                            Required Skills
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.distilledJob.keySkills.map((skill: string, i: number) => (
                                                <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Core Responsibilities */}
                                    <div>
                                        <h4 className="flex items-center gap-2 font-bold text-slate-900 mb-4 uppercase text-sm tracking-wider">
                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            Core Responsibilities
                                        </h4>
                                        <ul className="space-y-3">
                                            {analysis.distilledJob.coreResponsibilities.map((resp: string, i: number) => (
                                                <li key={i} className="flex gap-3 text-slate-600 leading-relaxed text-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                                                    {resp}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="pt-8 border-t border-slate-100">
                                        <details className="group">
                                            <summary className="flex items-center gap-2 text-sm text-slate-400 font-medium cursor-pointer hover:text-slate-600 transition-colors list-none">
                                                <div className="p-1 bg-slate-100 rounded group-hover:bg-slate-200 transition-colors">
                                                    <FileText className="w-3 h-3" />
                                                </div>
                                                Show Description
                                            </summary>
                                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 font-mono whitespace-pre-wrap leading-relaxed">
                                                {localJob.description}
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RESUME TAB */}
                    {activeTab === 'resume' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                            {/* Main Content */}
                            <div className="space-y-6">

                                {/* Recommended Blocks */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">Experience Blocks</h3>
                                            <p className="text-xs text-slate-500">Selected based on relevance</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                                                {analysis.recommendedBlockIds?.length || 0} Blocks
                                            </span>
                                            <button
                                                onClick={handleCopyResume}
                                                disabled={generating}
                                                className="text-xs font-medium px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-70"
                                            >
                                                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                                                {generating ? 'Assembling...' : 'Copy Full'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-slate-100">
                                        {resumes
                                            .find(r => r.id === analysis.bestResumeProfileId)
                                            ?.blocks.filter((b: { id: string }) => analysis.recommendedBlockIds?.includes(b.id))
                                            .map((block: { id: string; title: string; organization: string; dateRange: string; type: string; bullets: string[] }) => {
                                                const tailoredBullets = localJob.tailoredResumes?.[block.id];
                                                const isTailoring = tailoringBlock === block.id;

                                                return (
                                                    <div key={block.id} className="p-6 hover:bg-slate-50 transition-colors group relative">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h5 className="font-medium text-slate-900 text-sm">{block.title}</h5>
                                                                <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                                                                    <span className="font-medium text-slate-700">{block.organization}</span>
                                                                    <span>{block.dateRange}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 items-center">
                                                                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-300 bg-slate-100 px-2 py-0.5 rounded">
                                                                    {block.type}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Main Bullets */}
                                                        <div className="mt-3">
                                                            {tailoredBullets ? (
                                                                <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100 mb-2">
                                                                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                                                        <Sparkles className="w-3 h-3" /> Hyper-Tailored
                                                                    </div>
                                                                    <ul className="space-y-1.5">
                                                                        {tailoredBullets.map((b: string, i: number) => (
                                                                            <li key={i} className="text-xs text-indigo-900 pl-3 border-l-2 border-indigo-400">
                                                                                {b}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                    <button
                                                                        onClick={() => {
                                                                            // Revert capability
                                                                            const updated = { ...localJob };
                                                                            if (updated.tailoredResumes) delete updated.tailoredResumes[block.id];
                                                                            setLocalJob(updated);
                                                                        }}
                                                                        className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-600 underline"
                                                                    >
                                                                        Revert to Original
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <ul className="space-y-1.5">
                                                                    {block.bullets.map((b: string, i: number) => (
                                                                        <li key={i} className="text-xs text-slate-600 pl-3 border-l-2 border-slate-200 group-hover:border-indigo-300 transition-colors">
                                                                            {b}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>

                                                        {/* Hyper Tailor Action */}
                                                        <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {userTier === 'free' ? (
                                                                <div className="group/tooltip relative">
                                                                    <button disabled className="text-xs flex items-center gap-1 text-slate-400 cursor-not-allowed">
                                                                        <Lock className="w-3 h-3" /> Rewrite with AI
                                                                    </button>
                                                                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-20">
                                                                        Upgrade to Pro to auto-rewrite bullets for this job.
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                !tailoredBullets && (
                                                                    <button
                                                                        onClick={() => handleHyperTailor(block)}
                                                                        disabled={isTailoring}
                                                                        className="text-xs flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50"
                                                                    >
                                                                        {isTailoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                                        {isTailoring ? 'Rewriting...' : 'Hyper-Tailor'}
                                                                    </button>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar - Absolute on right for large screens */}
                            <div className="mt-8 xl:mt-0 xl:absolute xl:left-[102%] xl:top-0 xl:w-80 space-y-6">
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 xl:sticky xl:top-6">
                                    <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-blue-600" />
                                        Tailoring Strategy
                                    </h4>
                                    <p className="text-xs text-blue-700 mb-4 leading-relaxed opacity-80">
                                        Follow these AI suggestions to maximize your ATS score.
                                    </p>
                                    <div className="space-y-3">
                                        {analysis.tailoringInstructions.map((instruction: string, idx: number) => (
                                            <div key={idx} className="flex gap-3 text-sm text-blue-800 bg-white/60 p-3 rounded-lg border border-blue-100/50 shadow-sm">
                                                <span className="font-bold text-blue-400 font-mono text-xs mt-0.5 min-w-[1.2em]">0{idx + 1}</span>
                                                <span className="leading-snug text-xs">
                                                    {instruction.replace(/\([a-f0-9-]{30,}\)/gi, '').replace(/\s+/g, ' ').trim()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COVER LETTER TAB */}
                    {activeTab === 'cover-letter' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-250px)]">
                            {!localJob.coverLetter ? (
                                <div className="text-center py-12">
                                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Cover Letter Yet</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Generate a tailored cover letter based on your matched skills and the job description.</p>

                                    {/* Context Notes Input */}
                                    <div className="max-w-md mx-auto mb-8 text-left">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Additional Context (Optional)
                                        </label>
                                        <textarea
                                            className="w-full h-24 p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                            placeholder="e.g. I am currently learning React in my spare time, or I have a project X that isn't on my resume yet..."
                                            value={localJob.contextNotes || ''}
                                            onChange={(e) => handleUpdateContext(e.target.value)}
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Add any job-specific details here that aren't in your main resume. The AI will include them.
                                        </p>
                                    </div>

                                    {analysis.compatibilityScore > 80 ? (
                                        <button
                                            onClick={() => handleGenerateCoverLetter()}
                                            disabled={generating}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                            {generating ? 'Writing Cover Letter...' : 'Generate Cover Letter'}
                                        </button>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="bg-amber-50 text-amber-800 text-sm px-4 py-3 rounded-lg inline-flex items-center gap-2 border border-amber-100">
                                                <AlertTriangle className="w-4 h-4" />
                                                Match score below 80%. AI generation might be generic.
                                            </div>
                                            <br />
                                            <button
                                                onClick={() => handleGenerateCoverLetter()}
                                                disabled={generating}
                                                className="text-slate-600 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 px-6 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition-all active:scale-95"
                                            >
                                                Generate Anyway
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid lg:grid-cols-2 gap-6 h-full">
                                    {/* LEFT COL: The Letter */}
                                    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-indigo-600" />
                                                Generated Draft
                                            </h3>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCopy(localJob.coverLetter!, 'cl')}
                                                    className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    {copiedState === 'cl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                    {copiedState === 'cl' ? 'Copied' : 'Copy'}
                                                </button>
                                                {userTier !== 'free' && (
                                                    <button
                                                        onClick={() => handleGenerateCoverLetter()}
                                                        disabled={generating}
                                                        className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                                        Regenerate
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-8 md:p-10 bg-white">
                                            <div
                                                className="text-slate-800 leading-relaxed font-serif whitespace-pre-wrap selection:bg-indigo-100 selection:text-indigo-900 outline-none focus:bg-slate-50 transition-colors rounded p-2 -ml-2"
                                                contentEditable
                                                suppressContentEditableWarning
                                                onBlur={(e) => {
                                                    const newText = e.currentTarget.innerText;
                                                    if (newText !== localJob.coverLetter) {
                                                        const updated = { ...localJob, coverLetter: newText };
                                                        setLocalJob(updated);
                                                        Storage.updateJob(updated);
                                                    }
                                                }}
                                            >
                                                {localJob.coverLetter}
                                            </div>
                                            {localJob.promptVersion && (
                                                <div className="mt-4 text-[10px] text-slate-300 font-mono">
                                                    Ver: {localJob.promptVersion}
                                                </div>
                                            )}
                                        </div>
                                        {/* Feedback Footer */}
                                        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500">
                                            <span>Values provided by AI. Check for accuracy.</span>
                                            <div className="flex items-center gap-2">
                                                <span className="mr-1">Rate this draft:</span>
                                                <button
                                                    onClick={() => { Storage.submitFeedback(localJob.id, 1, 'cover_letter'); setRated(1); }}
                                                    className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${rated === 1 ? 'text-green-600 bg-green-50 ring-1 ring-green-200' : ''} `}
                                                    disabled={!!rated}
                                                >
                                                    <ThumbsUp className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => { Storage.submitFeedback(localJob.id, -1, 'cover_letter'); setRated(-1); }}
                                                    className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${rated === -1 ? 'text-red-600 bg-red-50 ring-1 ring-red-200' : ''} `}
                                                    disabled={!!rated}
                                                >
                                                    <ThumbsDown className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT COL: The Critique / Feedback */}
                                    <div className="flex flex-col h-full">
                                        {localJob.coverLetterCritique ? (
                                            <div className="bg-slate-900 text-slate-200 rounded-xl p-6 shadow-xl border border-slate-700 h-full overflow-y-auto animate-in fade-in slide-in-from-right-4">
                                                <div className="flex items-start justify-between mb-6">
                                                    <h3 className="font-semibold text-white flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4 text-indigo-400" />
                                                        Latest Critique
                                                    </h3>
                                                    <button
                                                        onClick={() => { /* Close logic if needed, or remove button */ }}
                                                        className="p-1 hover:bg-slate-800 rounded transition-colors"
                                                    >
                                                        <XCircle className="w-4 h-4 text-slate-500" />
                                                    </button>
                                                </div>
                                                <div className="prose prose-invert prose-sm max-w-none">
                                                    {typeof localJob.coverLetterCritique === 'string' ? (
                                                        <ReactMarkdown>{localJob.coverLetterCritique}</ReactMarkdown>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                                                                <span className="text-sm font-medium text-slate-400">Match Score</span>
                                                                <span className={`text-2xl font-bold ${localJob.coverLetterCritique!.score >= 80 ? 'text-green-400' : localJob.coverLetterCritique!.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                    {localJob.coverLetterCritique!.score}/100
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-slate-300 mb-2 flex items-center gap-2">
                                                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                                                    Improvements Needed
                                                                </h4>
                                                                <ul className="list-disc pl-5 space-y-2 text-slate-400 text-sm">
                                                                    {localJob.coverLetterCritique!.feedback.map((point: string, i: number) => (
                                                                        <li key={i}>{point}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <div className="pt-4 border-t border-slate-700">
                                                                <h4 className="font-medium text-slate-300 mb-2 flex items-center gap-2">
                                                                    <ThumbsUp className="w-4 h-4 text-green-400" />
                                                                    Strengths
                                                                </h4>
                                                                <ul className="list-disc pl-5 space-y-2 text-slate-400 text-sm">
                                                                    {localJob.coverLetterCritique!.strengths.map((point: string, i: number) => (
                                                                        <li key={i}>{point}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full bg-slate-50 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 text-center">
                                                <div className="max-w-xs space-y-4">
                                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4">
                                                        <Users className="w-8 h-8 text-indigo-600" />
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-slate-900">Ready for Review?</h3>
                                                    <p className="text-slate-500 text-sm">
                                                        Get a tough critique from our AI Hiring Manager persona before you send this out.
                                                    </p>
                                                    <button
                                                        onClick={handleRunCritique}
                                                        disabled={generating}
                                                        className="w-full bg-slate-900 text-white hover:bg-slate-800 px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95"
                                                    >
                                                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                                                        Review as Hiring Manager
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default JobDetail;
