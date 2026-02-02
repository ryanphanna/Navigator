import { useState, useMemo } from 'react';
import type { SavedJob } from '../types';
import { Building, ArrowRight, Trash2, Loader2, AlertCircle, Send, Users, Star, XCircle, Search, X } from 'lucide-react';

interface HistoryProps {
    jobs: SavedJob[];
    onSelectJob: (id: string) => void;
    onDeleteJob: (id: string) => void;
}



export default function History({ jobs, onSelectJob, onDeleteJob }: HistoryProps) {
    const [searchQuery, setSearchQuery] = useState('');



    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            const role = job.analysis?.distilledJob.roleTitle?.toLowerCase() || '';
            const company = job.analysis?.distilledJob.companyName?.toLowerCase() || '';
            return role.includes(query) || company.includes(query);
        });
    }, [jobs, searchQuery]);

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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Application History</h2>
                    <p className="text-slate-500 text-sm">Track your analyzed jobs and applications</p>
                </div>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{filteredJobs.length} Jobs</span>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search roles or companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-500 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.length === 0 ? (
                    <div className="col-span-full py-20 text-slate-500 flex flex-col items-center justify-center text-center">
                        <div className="bg-slate-50 p-4 rounded-full mb-4">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-lg font-medium text-slate-900">No jobs analyzed yet</p>
                        <p className="text-sm text-slate-500">Paste a job URL on the home page to get started.</p>
                    </div>
                ) : filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                        <div
                            key={job.id}
                            onClick={() => job.status !== 'analyzing' && onSelectJob(job.id)}
                            className={`group relative bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm transition-all duration-300 flex flex-col h-full
                                ${job.status === 'analyzing'
                                    ? 'opacity-90 border-indigo-100'
                                    : job.status === 'error'
                                        ? 'border-red-100 bg-red-50/10 hover:border-red-200 hover:shadow-red-500/5'
                                        : 'hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 cursor-pointer hover:border-indigo-200'
                                }`}
                        >
                            {/* Card Header: Icon & Status */}
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold
                                    ${job.status === 'analyzing'
                                        ? 'bg-indigo-50 text-indigo-600 animate-pulse'
                                        : job.status === 'error'
                                            ? 'bg-red-50 text-red-600'
                                            : 'bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600'
                                    }`}>
                                    {job.status === 'analyzing' ? <Loader2 className="w-6 h-6 animate-spin" /> :
                                        job.status === 'error' ? <AlertCircle className="w-6 h-6" /> :
                                            (job.company || job.analysis?.distilledJob.companyName || 'C').charAt(0).toUpperCase()}
                                </div>

                                {job.status !== 'analyzing' && job.status !== 'error' && (
                                    <div className="flex flex-col items-end gap-1">
                                        {job.analysis && (
                                            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getScoreColor(job.analysis.compatibilityScore)}`}>
                                                {job.analysis.compatibilityScore}% Match
                                            </div>
                                        )}
                                        {getStatusBadge(job.status)}
                                    </div>
                                )}
                            </div>

                            {/* Card Content */}
                            <div className="flex-1 min-h-[5rem]">
                                {job.status === 'analyzing' ? (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-bold text-slate-700">Analyzing...</h3>
                                        <div className="h-4 w-3/4 bg-slate-100 rounded-full animate-pulse" />
                                        <div className="h-4 w-1/2 bg-slate-100 rounded-full animate-pulse delay-75" />
                                    </div>
                                ) : job.status === 'error' ? (
                                    <div>
                                        <h3 className="text-lg font-bold text-red-900 mb-1">Analysis Failed</h3>
                                        <p className="text-sm text-red-600 leading-relaxed mb-4">
                                            We couldn't automatically process this job. Click to retry manual entry.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1" title={job.analysis?.distilledJob.roleTitle}>
                                            {job.analysis?.distilledJob.roleTitle || 'Unknown Role'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-4">
                                            <Building className="w-4 h-4" />
                                            <span className="truncate">{job.analysis?.distilledJob.companyName || job.company || 'Unknown Company'}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-400">
                                    {new Date(job.dateAdded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteJob(job.id); }}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {job.status !== 'analyzing' && (
                                        <div className={`p-2 rounded-xl transition-colors ${job.status === 'error' ? 'text-red-400 bg-red-50' : 'text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100'}`}>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-medium mb-1">No jobs found</h3>
                        <p className="text-slate-500 text-sm mb-4">No applications match "{searchQuery}"</p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline px-4 py-2 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                            Clear search filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

