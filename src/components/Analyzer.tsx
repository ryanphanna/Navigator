import React, { useState } from 'react';
import type { ResumeProfile, JobAnalysis } from '../types';
import { analyzeJobFit, generateCoverLetter } from '../services/geminiService';
import { AlertCircle, Sparkles, Copy, FileText, Loader2, CheckCircle, Globe, AlignLeft, Link as LinkIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface AnalyzerProps {
    resumes: ResumeProfile[];
}

const Analyzer: React.FC<AnalyzerProps> = ({ resumes }) => {
    const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
    const [url, setUrl] = useState('');
    const [jobText, setJobText] = useState('');
    const [showDistilled, setShowDistilled] = useState(false);

    const [status, setStatus] = useState<'idle' | 'fetching' | 'analyzing' | 'generating_letter'>('idle');
    const [result, setResult] = useState<JobAnalysis | null>(null);
    const [coverLetter, setCoverLetter] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchJobContent = async (targetUrl: string): Promise<string> => {
        // Use allorigins as a CORS proxy
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Failed to connect to proxy');

        const data = await response.json();
        if (!data.contents) throw new Error('Empty response from URL');

        // Parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');

        // Clean up DOM to extract meaningful text
        const unwanted = ['script', 'style', 'noscript', 'iframe', 'header', 'footer', 'nav', 'aside'];
        unwanted.forEach(tag => {
            doc.querySelectorAll(tag).forEach(el => el.remove());
        });

        const text = doc.body.textContent || "";
        // Normalize whitespace
        const cleanText = text.replace(/\s+/g, ' ').trim();

        if (cleanText.length < 50) {
            throw new Error("Extracted text is too short. The site might be blocking scrapers.");
        }

        return cleanText;
    };

    const handleAnalyze = async () => {
        setError(null);
        setResult(null);
        setCoverLetter(null);
        setShowDistilled(false);

        let textToAnalyze = jobText;

        try {
            if (inputMode === 'url') {
                if (!url.trim()) return;
                setStatus('fetching');

                try {
                    textToAnalyze = await fetchJobContent(url);
                    setJobText(textToAnalyze);
                } catch (fetchErr) {
                    console.error(fetchErr);
                    throw new Error("Could not automatically scrape this URL. Sites like LinkedIn or Indeed often block this. Please copy-paste the text instead.");
                }
            } else {
                if (!jobText.trim()) return;
            }

            setStatus('analyzing');
            const analysis = await analyzeJobFit(textToAnalyze, resumes);
            setResult(analysis);
        } catch (e) {
            setError((e as Error).message || "An unexpected error occurred.");
        } finally {
            setStatus('idle');
        }
    };

    const handleGenerateCoverLetter = async () => {
        if (!result) return;
        setStatus('generating_letter');
        try {
            const bestResume = resumes.find(r => r.id === result.bestResumeProfileId) || resumes[0];
            const letter = await generateCoverLetter(jobText, bestResume, result.tailoringInstructions);
            setCoverLetter(letter);
        } catch (e) {
            setError("Failed to generate cover letter.");
        } finally {
            setStatus('idle');
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-indigo-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreRing = (score: number) => {
        if (score >= 90) return 'border-green-500';
        if (score >= 70) return 'border-indigo-500';
        if (score >= 50) return 'border-yellow-500';
        return 'border-red-500';
    };

    const isProcessing = status !== 'idle';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Input Section */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setInputMode('url')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${inputMode === 'url' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <LinkIcon className="w-4 h-4" /> Paste URL
                    </button>
                    <button
                        onClick={() => setInputMode('text')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${inputMode === 'text' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <AlignLeft className="w-4 h-4" /> Paste Text
                    </button>
                </div>

                <div className="p-6">
                    {inputMode === 'url' ? (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-700">
                                Job Posting URL
                            </label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://company.com/careers/job-123"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                Works best with direct company career pages. LinkedIn/Indeed may require copy-pasting.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-700">
                                Job Description Text
                            </label>
                            <textarea
                                className="w-full h-40 p-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                                placeholder="Paste the full job posting text here..."
                                value={jobText}
                                onChange={(e) => setJobText(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleAnalyze}
                            disabled={isProcessing || (inputMode === 'url' ? !url.trim() : !jobText.trim())}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-w-[140px] justify-center"
                        >
                            {status === 'fetching' && <Loader2 className="w-4 h-4 animate-spin" />}
                            {status === 'analyzing' && <Sparkles className="w-4 h-4 animate-spin" />}
                            {status === 'idle' && <Sparkles className="w-4 h-4" />}

                            {status === 'fetching' ? 'Fetching...' :
                                status === 'analyzing' ? 'Analyzing...' :
                                    'Analyze Fit'}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start gap-3 text-sm animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <p className="font-medium">Error</p>
                        <p>{error}</p>
                        {inputMode === 'url' && (
                            <button
                                onClick={() => setInputMode('text')}
                                className="mt-2 text-indigo-700 hover:text-indigo-800 underline font-medium"
                            >
                                Switch to text paste mode
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Result Section */}
            {result && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Score Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Analysis Result</h2>
                                <p className="text-slate-500 text-sm mt-1">Based on <span className="font-medium text-slate-900">{resumes.find(r => r.id === result.bestResumeProfileId)?.name}</span></p>
                            </div>
                            <div className={`flex items-center justify-center w-24 h-24 rounded-full border-4 ${getScoreRing(result.compatibilityScore)} bg-slate-50`}>
                                <div className="text-center">
                                    <span className={`block text-3xl font-bold ${getScoreColor(result.compatibilityScore)}`}>
                                        {result.compatibilityScore}%
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Fit</span>
                                </div>
                            </div>
                        </div>

                        {/* Distilled Job Toggle */}
                        <button
                            onClick={() => setShowDistilled(!showDistilled)}
                            className="w-full flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            <span>DISTILLED JOB PROFILE</span>
                            {showDistilled ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showDistilled && (
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 text-sm space-y-3 animate-in fade-in">
                                <div>
                                    <span className="font-semibold text-slate-700 block text-xs uppercase tracking-wide">Role</span>
                                    <span className="text-slate-900 font-medium">{result.distilledJob.roleTitle}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-700 block text-xs uppercase tracking-wide mb-1">Key Skills</span>
                                    <div className="flex flex-wrap gap-1">
                                        {result.distilledJob.keySkills.map((s, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-600">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-6 bg-white">
                            <p className="text-slate-700 italic border-l-4 border-slate-300 pl-4 py-1 mb-6">
                                "{result.reasoning}"
                            </p>

                            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-500" />
                                Resume Updates (Checklist)
                            </h3>
                            <ul className="space-y-2">
                                {result.tailoringInstructions.map((instruction, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>{instruction}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                            {result.compatibilityScore > 80 ? (
                                <button
                                    onClick={handleGenerateCoverLetter}
                                    disabled={status === 'generating_letter'}
                                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm font-medium"
                                >
                                    {status === 'generating_letter' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                    {status === 'generating_letter' ? 'Writing...' : 'Generate Cover Letter'}
                                </button>
                            ) : (
                                <div className="text-xs text-slate-500 text-right max-w-xs">
                                    Cover letter generation is available for matches over 80%. Tailor your resume first to improve the score.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cover Letter Section */}
                    {coverLetter && (
                        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 relative animate-in slide-in-from-bottom-4 duration-500">
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    onClick={() => navigator.clipboard.writeText(coverLetter)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                                    title="Copy to clipboard"
                                >
                                    <Copy className="w-5 h-5" />
                                </button>
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Cover Letter Draft</h3>
                            <div className="prose prose-slate prose-sm max-w-none whitespace-pre-wrap font-serif text-slate-800 leading-relaxed">
                                {coverLetter}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Analyzer;
