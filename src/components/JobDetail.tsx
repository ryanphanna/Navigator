import React, { useState } from 'react';
import type { SavedJob, ResumeProfile } from '../types';
import { generateCoverLetter, analyzeJobFit, critiqueCoverLetter } from '../services/geminiService';
import * as Storage from '../services/storageService';
import { ArrowLeft, CheckCircle, Copy, Loader2, ThumbsUp, AlertTriangle, Briefcase, Users, XCircle, PenTool, Sparkles, AlertCircle, FileText } from 'lucide-react';

interface JobDetailProps {
    job: SavedJob;
    resumes: ResumeProfile[];
    onBack: () => void;
    onUpdateJob: (job: SavedJob) => void;
}

type Tab = 'analysis' | 'resume' | 'cover-letter';

const JobDetail: React.FC<JobDetailProps> = ({ job, resumes, onBack, onUpdateJob }) => {
    const [activeTab, setActiveTab] = useState<Tab>('analysis');
    const [generating, setGenerating] = useState(false);
    const [localJob, setLocalJob] = useState(job);

    // Retry / Manual Entry State
    const [manualText, setManualText] = useState('');
    const [retrying, setRetrying] = useState(false);

    // Resume Builder State

    const analysis = localJob.analysis;


    // Guard clause for Missing / Error state -> Show Retry UI
    if (!analysis || localJob.status === 'error') {
        const handleRetry = async () => {
            if (!manualText.trim()) return;
            setRetrying(true);
            try {
                const result = await analyzeJobFit(manualText, resumes);
                const updatedJob: SavedJob = {
                    ...localJob,
                    status: 'new',
                    originalText: manualText,
                    analysis: result
                };
                Storage.updateJob(updatedJob);
                setLocalJob(updatedJob);
                onUpdateJob(updatedJob);
            } catch {
                alert("Analysis failed again. Please try with different text.");
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

                <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Analysis Failed</h2>
                        <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                            We couldn't scrape the content from <br />
                            <a href={localJob.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-mono text-xs break-all">{localJob.url || 'the provided link'}</a>.
                            <span className="block mt-2 text-sm">Most job sites (LinkedIn, Indeed) block automated bots. Please paste the text manually below.</span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                            Paste Job Description
                        </label>
                        <textarea
                            className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 text-sm leading-relaxed transition-all"
                            placeholder="Paste the full role description, requirements, and responsibilities here..."
                            value={manualText}
                            onChange={e => setManualText(e.target.value)}
                        />
                        <div className="flex justify-between items-center pt-2">
                            <button onClick={onBack} className="px-4 py-2 text-slate-500 hover:text-slate-900 text-sm font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={handleRetry}
                                disabled={!manualText.trim() || retrying}
                                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm hover:shadow active:scale-95"
                            >
                                {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {retrying ? 'Analyzing...' : 'Analyze Job Fit'}
                            </button>
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
            const textToUse = localJob.originalText || `Role: ${analysis.distilledJob.roleTitle} at ${analysis.distilledJob.companyName}`;

            // Combine user context with critique instructions if strictly fixing
            let finalContext = localJob.contextNotes;
            let instructions = analysis.tailoringInstructions;

            if (critiqueContext) {
                // Should we clear the critique after fixing? maybe not immediately
                finalContext = critiqueContext;
                instructions = [...instructions, "CRITIQUE_FIX"];
            } else if (localJob.contextNotes) {
                finalContext = localJob.contextNotes;
            }

            const letter = await generateCoverLetter(
                textToUse,
                bestResume,
                instructions,
                finalContext
            );

            const updated = {
                ...localJob,
                coverLetter: letter,
                // specific logic: if we just fixed it, maybe we clear the old critique or mark it resolved?
                // for simplicity, let's keep the old critique until they request a new one, or just overwrite it
            };

            Storage.updateJob(updated);
            setLocalJob(updated);
            onUpdateJob(updated);
        } catch {
            alert("Failed to generate cover letter");
        } finally {
            setGenerating(false);
        }
    };

    const handleRunCritique = async () => {
        if (!localJob.coverLetter) return;
        setGenerating(true);
        try {
            const textToUse = localJob.originalText || `Role: ${analysis.distilledJob.roleTitle} at ${analysis.distilledJob.companyName}`;
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

    const handleStatusChange = (newStatus: SavedJob['status']) => {
        const updated = { ...localJob, status: newStatus };
        Storage.updateJob(updated);
        setLocalJob(updated);
        onUpdateJob(updated);
    };


    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600 ring-green-500';
        if (score >= 70) return 'text-indigo-600 ring-indigo-500';
        if (score >= 50) return 'text-yellow-600 ring-yellow-500';
        return 'text-red-600 ring-red-500';
    };


    if (!localJob) return <div>Job not found</div>;

    const tabs = [
        { id: 'analysis', label: 'Analysis', icon: CheckCircle },
        { id: 'resume', label: 'Tailored Resume', icon: FileText },
        { id: 'cover-letter', label: 'Cover Letter', icon: PenTool },
    ];

    return (
        <div className="bg-white h-full flex flex-col">
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
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`
                                py-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2
                                ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
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
                <div className="max-w-4xl mx-auto">

                    {/* ANALYSIS TAB */}
                    {activeTab === 'analysis' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Score Card */}
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center gap-8">
                                <div className="text-center min-w-[120px]">
                                    <div className="relative inline-flex items-center justify-center">
                                        <svg className="w-24 h-24 transform -rotate-90">
                                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * analysis.compatibilityScore / 100)} className={`${getScoreColor(analysis.compatibilityScore).split(' ')[1]}`} />
                                        </svg>
                                        <span className={`absolute text-3xl font-bold ${getScoreColor(analysis.compatibilityScore).split(' ')[0]}`}>
                                            {analysis.compatibilityScore}%
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium mt-2">Match Score</p>
                                </div>
                                <div className="flex-1 border-l border-slate-100 pl-8">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Assessment</h3>
                                    <p className="text-slate-600 leading-relaxed text-sm">{analysis.reasoning}</p>
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

                    {/* RESUME TAB */}
                    {activeTab === 'resume' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                                <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                    Tailoring Strategy
                                </h4>
                                <div className="space-y-3">
                                    {analysis.tailoringInstructions.map((instruction: string, idx: number) => (
                                        <div key={idx} className="flex gap-3 text-sm text-blue-800 bg-white/60 p-3 rounded-lg border border-blue-100/50">
                                            <span className="font-bold text-blue-400 font-mono text-xs mt-0.5">0{idx + 1}</span>
                                            {instruction}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Recommended Blocks</h3>
                                        <p className="text-xs text-slate-500">Based on job requirements</p>
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                                        {analysis.recommendedBlockIds?.length || 0} Blocks Selected
                                    </span>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {resumes
                                        .find(r => r.id === analysis.bestResumeProfileId)
                                        ?.blocks.filter((b: { id: string }) => analysis.recommendedBlockIds?.includes(b.id))
                                        .map((block: { id: string; title: string; organization: string; dateRange: string; type: string; bullets: string[] }) => (
                                            <div key={block.id} className="p-6 hover:bg-slate-50 transition-colors group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h5 className="font-medium text-slate-900 text-sm">{block.title}</h5>
                                                        <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                                                            <span className="font-medium text-slate-700">{block.organization}</span>
                                                            <span>•</span>
                                                            <span>{block.dateRange}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-300 bg-slate-100 px-2 py-0.5 rounded">
                                                        {block.type}
                                                    </span>
                                                </div>
                                                <ul className="space-y-1.5 mt-3">
                                                    {block.bullets.map((b: string, i: number) => (
                                                        <li key={i} className="text-xs text-slate-600 pl-3 border-l-2 border-slate-200 group-hover:border-indigo-300 transition-colors">
                                                            {b}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COVER LETTER TAB */}
                    {activeTab === 'cover-letter' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                <div className="max-w-3xl mx-auto space-y-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-indigo-600" />
                                            Generated Draft
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(localJob.coverLetter || '');
                                                    alert("Copied to clipboard!");
                                                }}
                                                className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                                Copy
                                            </button>
                                            <button
                                                onClick={() => handleGenerateCoverLetter()}
                                                disabled={generating}
                                                className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                                Regenerate
                                            </button>
                                        </div>
                                    </div>

                                    {/* The Letter */}
                                    <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-slate-200 text-slate-800 leading-relaxed font-serif whitespace-pre-wrap selection:bg-indigo-100 selection:text-indigo-900 border-t-4 border-t-indigo-500">
                                        {localJob.coverLetter}
                                    </div>

                                    {/* CRITIQUE SECTION */}
                                    {localJob.coverLetterCritique ? (
                                        <div className="bg-slate-900 text-slate-200 rounded-xl p-6 shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-start justify-between mb-6">
                                                <div>
                                                    <h4 className="text-white font-semibold text-lg flex items-center gap-2">
                                                        <div className="bg-indigo-500 p-1 rounded text-white">
                                                            <Users className="w-4 h-4" />
                                                        </div>
                                                        Hiring Manager Review
                                                    </h4>
                                                    <p className="text-slate-400 text-sm mt-1">AI assessment of your letter</p>
                                                </div>
                                                <div className={`text-right px-4 py-2 rounded-lg font-bold border ${localJob.coverLetterCritique.score >= 8 ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-amber-500/10 border-amber-500/50 text-amber-400'}`}>
                                                    <div className="text-2xl">{localJob.coverLetterCritique.score}/10</div>
                                                    <div className="text-[10px] uppercase tracking-wider opacity-80">{localJob.coverLetterCritique.decision}</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Strengths</h5>
                                                    <ul className="space-y-2">
                                                        {localJob.coverLetterCritique.strengths.map((s: string, i: number) => (
                                                            <li key={i} className="text-sm flex gap-2 items-start text-emerald-200/80">
                                                                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                                {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Improvements Needed</h5>
                                                    <ul className="space-y-2">
                                                        {localJob.coverLetterCritique.feedback.map((s: string, i: number) => (
                                                            <li key={i} className="text-sm flex gap-2 items-start text-rose-200/80">
                                                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                                {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            <div className="border-t border-slate-700 pt-5 flex justify-end gap-3">
                                                <button
                                                    onClick={() => handleGenerateCoverLetter(localJob.coverLetterCritique?.feedback.join('\n'))}
                                                    disabled={generating}
                                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                    Auto-Fix (Apply Feedback)
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-center pt-4 pb-8">
                                            <button
                                                onClick={handleRunCritique}
                                                disabled={generating}
                                                className="group bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md text-slate-600 hover:text-indigo-600 px-6 py-3 rounded-xl transition-all flex items-center gap-3"
                                            >
                                                <div className="bg-slate-100 group-hover:bg-indigo-50 p-2 rounded-lg transition-colors">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold text-sm">Review as Hiring Manager</div>
                                                    <div className="text-[10px] text-slate-400">Get a score & automatic feedback</div>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobDetail;
