import { useState } from 'react';
import type { SavedJob } from '../types';
import { Calendar, Building, ArrowRight, Trash2, Loader2, AlertCircle, Send, Users, Star, XCircle, Search, X } from 'lucide-react';

interface HistoryProps {
    jobs: SavedJob[];
    onSelectJob: (id: string) => void;
    onDeleteJob: (id: string) => void;
}



export default function History({ jobs, onSelectJob, onDeleteJob }: HistoryProps) {
    const [searchQuery, setSearchQuery] = useState('');

    if (jobs.length === 0) {
        return (
            <div className="text-center py-20 text-slate-500">
                <p>No jobs analyzed yet.</p>
            </div>
        );
    }

    const filteredJobs = jobs.filter(job => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const role = job.analysis?.distilledJob.roleTitle?.toLowerCase() || '';
        const company = job.analysis?.distilledJob.companyName?.toLowerCase() || '';
        return role.includes(query) || company.includes(query);
    });

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600 bg-green-50 border-green-100';
        if (score >= 70) return 'text-indigo-600 bg-indigo-50 border-indigo-100';
        if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-100';
        return 'text-red-600 bg-red-50 border-red-100';
    };

    const getStatusBadge = (status: SavedJob['status']) => {
        switch (status) {
            case 'applied': return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100"><Send className="w-3 h-3" /> Applied</span>;
            case 'interview': return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100"><Users className="w-3 h-3" /> Interview</span>;
            case 'offer': return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100"><Star className="w-3 h-3" /> Offer</span>;
            case 'rejected': return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200"><XCircle className="w-3 h-3" /> Rejected</span>;
            default: return null;
        }
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-slate-900">Application History</h2>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{jobs.length} Jobs</span>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search roles or companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <div className="grid gap-3">
                {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                        <div
                            key={job.id}
                            className={`group relative bg - white p - 4 rounded - xl border border - slate - 200 shadow - sm transition - all ${job.status === 'analyzing' ? 'opacity-90' : 'hover:shadow-md hover:border-indigo-200 cursor-pointer'} `}
                            onClick={() => job.status !== 'analyzing' && onSelectJob(job.id)}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    {/* Header Line */}
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        {job.status === 'analyzing' ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                                <span className="font-medium text-slate-600">Analyzing Job Fit...</span>
                                            </div>
                                        ) : job.status === 'error' ? (
                                            <div className="flex items-center gap-2 text-red-600">
                                                <AlertCircle className="w-4 h-4" />
                                                <span className="font-medium">Analysis Failed</span>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs" title={job.analysis?.distilledJob.roleTitle}>
                                                    {job.analysis?.distilledJob.roleTitle || 'Unknown Role'}
                                                </h3>
                                                {job.analysis && (
                                                    <span className={`text - xs font - bold px - 2 py - 0.5 rounded - full border ${getScoreColor(job.analysis.compatibilityScore)} `}>
                                                        {job.analysis.compatibilityScore}%
                                                    </span>
                                                )}
                                                {getStatusBadge(job.status)}
                                            </>
                                        )}
                                    </div>

                                    {/* Details Line */}
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                        {job.status === 'analyzing' ? (
                                            <span className="text-xs text-slate-400">Processing in background</span>
                                        ) : job.status === 'error' ? (
                                            <span className="text-xs text-red-400">Click to retry manual entry</span>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-start w-full">
                                                    <div>
                                                        <span className="flex items-center gap-1.5 truncate" title={job.analysis?.distilledJob.companyName}>
                                                            <Building className="w-3.5 h-3.5" />
                                                            {job.analysis?.distilledJob.companyName || 'Unknown Company'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {job.analysis?.distilledJob.applicationDeadline && (
                                                    <span className="flex items-center gap-1.5 text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        Due: {job.analysis.distilledJob.applicationDeadline}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        <span className="text-xs text-slate-400 ml-auto sm:ml-0">
                                            {new Date(job.dateAdded).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteJob(job.id); }}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {job.status !== 'analyzing' && (
                                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No jobs found matching "{searchQuery}"</p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                            Clear search
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

