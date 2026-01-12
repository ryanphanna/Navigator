import React, { useState, useEffect } from 'react';
import type { SavedJob, ResumeProfile } from '../types';
import { generateCoverLetter, analyzeJobFit } from '../services/geminiService';
import * as Storage from '../services/storageService';
import { ArrowLeft, Calendar, FileText, CheckCircle, Copy, Loader2, ExternalLink, ThumbsUp, AlertTriangle, Briefcase, Send, Users, Star, XCircle, PenTool, BookOpen, Printer, Eye, CheckSquare, Square, Sparkles, AlertCircle } from 'lucide-react';

interface JobDetailProps {
    job: SavedJob;
    resumes: ResumeProfile[];
    onBack: () => void;
    onUpdateJob: (job: SavedJob) => void;
}

type Tab = 'analysis' | 'resume' | 'cover_letter';

const JobDetail: React.FC<JobDetailProps> = ({ job, resumes, onBack, onUpdateJob }) => {
    const [activeTab, setActiveTab] = useState<Tab>('analysis');
    const [generating, setGenerating] = useState(false);
    const [localJob, setLocalJob] = useState(job);

    // Retry / Manual Entry State
    const [manualText, setManualText] = useState('');
    const [retrying, setRetrying] = useState(false);

    // Resume Builder State
    const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());

    const analysis = localJob.analysis;

    // Initialize selected blocks based on AI recommendation
    useEffect(() => {
        if (analysis) {
            if (analysis.recommendedBlockIds && analysis.recommendedBlockIds.length > 0) {
                setSelectedBlockIds(new Set(analysis.recommendedBlockIds));
            } else {
                // Fallback: Select all blocks from best profile if AI didn't return IDs (legacy analysis)
                const profile = resumes.find(r => r.id === analysis.bestResumeProfileId) || resumes[0];
                if (profile) {
                    setSelectedBlockIds(new Set(profile.blocks.map(b => b.id)));
                }
            }
        }
    }, [analysis, resumes]);

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
            } catch (e) {
                console.error(e);
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

    const activeProfile = resumes.find(r => r.id === analysis.bestResumeProfileId) || resumes[0];

    const handleGenerateCoverLetter = async () => {
        setGenerating(true);
        try {
            const bestResume = resumes.find(r => r.id === analysis.bestResumeProfileId) || resumes[0];
            // Format for generator: "Role at Company"
            const textToUse = localJob.originalText || `Role: ${analysis.distilledJob.roleTitle} at ${analysis.distilledJob.companyName}`;

            // Pass context notes if they exist
            const letter = await generateCoverLetter(
                textToUse,
                bestResume,
                analysis.tailoringInstructions,
                localJob.contextNotes
            );

            const updated = { ...localJob, coverLetter: letter };
            Storage.updateJob(updated);
            setLocalJob(updated);
            onUpdateJob(updated);
        } catch (e) {
            console.error(e);
            alert("Failed to generate cover letter");
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

    const toggleBlock = (id: string) => {
        const newSet = new Set(selectedBlockIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedBlockIds(newSet);
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600 ring-green-500';
        if (score >= 70) return 'text-indigo-600 ring-indigo-500';
        if (score >= 50) return 'text-yellow-600 ring-yellow-500';
        return 'text-red-600 ring-red-500';
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'applied': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'interview': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'offer': return 'bg-green-50 text-green-700 border-green-200';
            case 'rejected': return 'bg-slate-100 text-slate-500 border-slate-200';
            default: return 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50';
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="animate-in slide-in-from-right-4 duration-300 pb-20">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to History
                </button>

                {/* Status Dropdown */}
                <div className="relative group">
                    <select
                        value={localJob.status}
                        onChange={(e) => handleStatusChange(e.target.value as SavedJob['status'])}
                        className={`appearance-none pl-9 pr-8 py-2 rounded-lg text-sm font-bold uppercase tracking-wide border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${getStatusStyle(localJob.status)}`}
                    >
                        <option value="new">To Apply</option>
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                    </select>

                    <div className="absolute left-3 top-2.5 pointer-events-none">
                        {localJob.status === 'new' && <Briefcase className="w-4 h-4 text-slate-400" />}
                        {localJob.status === 'applied' && <Send className="w-4 h-4 text-blue-500" />}
                        {localJob.status === 'interview' && <Users className="w-4 h-4 text-purple-500" />}
                        {localJob.status === 'offer' && <Star className="w-4 h-4 text-green-500" />}
                        {localJob.status === 'rejected' && <XCircle className="w-4 h-4 text-slate-400" />}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row gap-6 justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-slate-900">{analysis.distilledJob.roleTitle}</h1>
                            {localJob.url && (
                                <a href={localJob.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600">
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                        <p className="text-lg text-slate-600 mb-4">{analysis.distilledJob.companyName}</p>

                        <div className="flex flex-wrap gap-3">
                            {analysis.distilledJob.applicationDeadline && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 text-sm font-medium rounded-full">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Due: {analysis.distilledJob.applicationDeadline}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className={`relative flex items-center justify-center w-20 h-20 rounded-full ring-4 ${getScoreColor(analysis.compatibilityScore).split(' ')[1]} bg-slate-50`}>
                            <span className={`text-2xl font-bold ${getScoreColor(analysis.compatibilityScore).split(' ')[0]}`}>
                                {analysis.compatibilityScore}%
                            </span>
                        </div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-2">Match</span>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'analysis' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <BookOpen className="w-4 h-4" /> Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('resume')}
                        className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'resume' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText className="w-4 h-4" /> Tailored Resume
                    </button>
                    <button
                        onClick={() => setActiveTab('cover_letter')}
                        className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'cover_letter' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <PenTool className="w-4 h-4" /> Cover Letter
                    </button>
                </div>

                {/* Tab Content */}
                <div className="bg-slate-50/50 min-h-[400px]">

                    {/* 1. ANALYSIS TAB */}
                    {activeTab === 'analysis' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="px-6 sm:px-8 py-6 bg-white border-b border-slate-100">
                                <p className="text-slate-700 italic text-lg leading-relaxed border-l-4 border-indigo-200 pl-4">
                                    "{analysis.reasoning}"
                                </p>
                            </div>

                            <div className="p-6 sm:p-8 border-b border-slate-100 grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <ThumbsUp className="w-4 h-4 text-green-600" />
                                        Match Strengths
                                    </h3>
                                    <ul className="space-y-3">
                                        {(analysis.strengths && analysis.strengths.length > 0) ? analysis.strengths.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                                <span className="leading-relaxed">{s}</span>
                                            </li>
                                        )) : (
                                            <p className="text-sm text-slate-500 italic">No specific strengths listed.</p>
                                        )}
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                        Missing / Gaps
                                    </h3>
                                    <ul className="space-y-3">
                                        {(analysis.weaknesses && analysis.weaknesses.length > 0) ? analysis.weaknesses.map((w, i) => (
                                            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                                                <span className="leading-relaxed">{w}</span>
                                            </li>
                                        )) : (
                                            <p className="text-sm text-slate-500 italic">No major gaps detected.</p>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 bg-white">
                                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-indigo-500" />
                                    Recommended Resume Updates
                                </h3>
                                <ul className="space-y-3 mb-8">
                                    {analysis.tailoringInstructions.map((instruction, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                            <span className="text-sm leading-relaxed">{instruction}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mb-2">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Required Skills Found</span>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {analysis.distilledJob.keySkills.map((skill, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-xs rounded-md font-medium">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. TAILORED RESUME TAB (REPLACES INTERVIEW) */}
                    {activeTab === 'resume' && (
                        <div className="flex flex-col md:flex-row h-[600px] animate-in fade-in">
                            {/* Sidebar: Selection */}
                            <div className="w-full md:w-1/3 border-r border-slate-200 bg-white overflow-y-auto p-4">
                                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                                    Select Blocks
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">
                                    The AI has auto-selected the blocks most relevant to this job description.
                                </p>

                                <div className="space-y-3">
                                    {activeProfile.blocks.map(block => (
                                        <div
                                            key={block.id}
                                            onClick={() => toggleBlock(block.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedBlockIds.has(block.id)
                                                ? 'bg-indigo-50 border-indigo-200'
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 ${selectedBlockIds.has(block.id) ? 'text-indigo-600' : 'text-slate-300'}`}>
                                                    {selectedBlockIds.has(block.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-slate-900">{block.title}</h4>
                                                    <p className="text-xs text-slate-500">{block.organization}</p>
                                                    <span className="inline-block mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-400 border border-slate-100 px-1.5 rounded">
                                                        {block.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Preview Area */}
                            <div className="w-full md:w-2/3 bg-slate-100 p-8 overflow-y-auto relative">
                                <div className="max-w-[210mm] mx-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <Eye className="w-4 h-4" /> Document Preview
                                        </div>
                                        <button
                                            onClick={handlePrint}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
                                        >
                                            <Printer className="w-4 h-4" /> Print / Save PDF
                                        </button>
                                    </div>

                                    {/* THE RESUME DOCUMENT */}
                                    <div
                                        id="resume-preview"
                                        className="bg-white shadow-lg p-[10mm] min-h-[297mm] text-slate-900 font-serif"
                                        style={{ width: '100%' }}
                                    >
                                        {/* Header (Simplified) */}
                                        <div className="text-center border-b-2 border-slate-900 pb-6 mb-6">
                                            <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">My Name</h1>
                                            <p className="text-sm text-slate-600">contact@email.com • (555) 555-5555 • City, State</p>
                                        </div>

                                        {/* Content */}
                                        <div className="space-y-6">
                                            {['work', 'project', 'education', 'skill', 'other'].map(type => {
                                                const typeBlocks = activeProfile.blocks
                                                    .filter(b => b.type === type && selectedBlockIds.has(b.id));

                                                if (typeBlocks.length === 0) return null;

                                                return (
                                                    <div key={type}>
                                                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 mb-4 pb-1">
                                                            {type === 'work' ? 'Experience' : type === 'project' ? 'Projects' : type === 'education' ? 'Education' : type === 'skill' ? 'Skills' : 'Other'}
                                                        </h2>
                                                        <div className="space-y-4">
                                                            {typeBlocks.map(block => (
                                                                <div key={block.id}>
                                                                    <div className="flex justify-between items-baseline mb-1">
                                                                        <h3 className="font-bold text-base">{block.title}</h3>
                                                                        <span className="text-sm text-slate-600 font-medium whitespace-nowrap">{block.dateRange}</span>
                                                                    </div>
                                                                    <div className="text-sm font-medium text-slate-700 mb-1">{block.organization}</div>
                                                                    <ul className="list-disc list-outside ml-4 space-y-0.5 text-sm text-slate-700 leading-relaxed">
                                                                        {block.bullets.filter(b => b.trim()).map((bullet, idx) => (
                                                                            <li key={idx} className="pl-1">{bullet}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. COVER LETTER TAB */}
                    {activeTab === 'cover_letter' && (
                        <div className="p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {localJob.coverLetter ? (
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-slate-900">Cover Letter Draft</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const update = { ...localJob, coverLetter: undefined }; // Clear to regenerate
                                                    Storage.updateJob(update);
                                                    setLocalJob(update);
                                                }}
                                                className="text-xs font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5"
                                            >
                                                Regenerate
                                            </button>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(localJob.coverLetter || '')}
                                                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 bg-indigo-50 rounded-md transition-colors"
                                            >
                                                <Copy className="w-3.5 h-3.5" /> Copy Text
                                            </button>
                                        </div>
                                    </div>
                                    <div className="prose prose-slate prose-sm max-w-none p-8 bg-white rounded-xl border border-slate-200 font-serif whitespace-pre-wrap leading-relaxed shadow-sm">
                                        {localJob.coverLetter}
                                    </div>
                                </div>
                            ) : (
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
                                            onClick={handleGenerateCoverLetter}
                                            disabled={generating}
                                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-70 transition-all font-medium shadow-sm mx-auto"
                                        >
                                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                            {generating ? 'Writing Cover Letter...' : 'Generate Cover Letter'}
                                        </button>
                                    ) : (
                                        <div className="bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg inline-block text-sm">
                                            We recommend tailoring your resume first. Improve your match score to &gt;80% to generate a high-quality letter.
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
