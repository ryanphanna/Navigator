import { useState, useMemo } from 'react';
import type { SavedJob } from '../../types';
import { Search, X, Trash2, ArrowRight, Sparkles, Building, Calendar, Filter, Clock } from 'lucide-react';
import { PageLayout } from '../../components/common/PageLayout';

interface HistoryProps {
    jobs: SavedJob[];
    onSelectJob: (id: string) => void;
    onDeleteJob: (id: string) => void;
}

type StatusFilter = 'all' | 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

interface StatusTabProps {
    id: StatusFilter;
    label: string;
    count: number;
    activeFilter: StatusFilter;
    onSelect: (filter: StatusFilter) => void;
}

const StatusTab = ({ id, label, count, activeFilter, onSelect }: StatusTabProps) => (
    <button
        onClick={() => onSelect(id)}
        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2 border active:scale-95 ${activeFilter === id
            ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white shadow-lg shadow-neutral-900/10 dark:shadow-white/5'
            : 'bg-white/50 backdrop-blur-md text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:bg-white dark:bg-neutral-900/50 dark:text-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-900'
            }`}
    >
        {label}
        {count > 0 && (
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-tighter ${activeFilter === id
                ? 'bg-white/20 text-white dark:bg-neutral-900/10 dark:text-neutral-900'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500'
                }`}>
                {count}
            </span>
        )}
    </button>
);

export default function History({ jobs, onSelectJob, onDeleteJob }: HistoryProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            if (!job || job.status === 'feed') return false;

            // Status Filter
            if (statusFilter !== 'all') {
                if (statusFilter === 'offer' && job.status !== 'offer') return false;
                if (statusFilter === 'interview' && job.status !== 'interview') return false;
                if (statusFilter === 'rejected' && (job.status !== 'rejected' && job.status !== 'ghosted')) return false;
                if (statusFilter === 'applied' && job.status !== 'applied') return false;
                if (statusFilter === 'saved' && (job.status !== 'saved' && job.status !== 'analyzing' && job.status !== 'error' && job.status)) return false;
            }

            // Search Filter
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            const role = (job.analysis?.distilledJob.roleTitle || job.position || '').toLowerCase();
            const company = (job.analysis?.distilledJob.companyName || job.company || '').toLowerCase();
            return role.includes(query) || company.includes(query);
        }).sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    }, [jobs, searchQuery, statusFilter]);

    const getStatusParams = (status?: SavedJob['status']) => {
        switch (status) {
            case 'offer': return { label: 'Offer', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' };
            case 'interview': return { label: 'Interview', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' };
            case 'rejected': return { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' };
            case 'ghosted': return { label: 'Ghosted', color: 'bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700' };
            case 'applied': return { label: 'Applied', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' };
            case 'analyzing': return { label: 'Analyzing...', color: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800 animate-pulse' };
            case 'error': return { label: 'Failed', color: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' };
            default: return { label: 'Saved', color: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700' };
        }
    };

    const getCount = (filter: StatusFilter) => {
        if (filter === 'all') return jobs.length;
        return jobs.filter(job => {
            if (filter === 'offer') return job.status === 'offer';
            if (filter === 'interview') return job.status === 'interview';
            if (filter === 'rejected') return job.status === 'rejected' || job.status === 'ghosted';
            if (filter === 'applied') return job.status === 'applied';
            if (filter === 'saved') return job.status === 'saved' || job.status === 'analyzing' || job.status === 'error' || !job.status;
            return false;
        }).length;
    };

    return (
        <PageLayout
            title="Application History"
            description="Track your analyzed jobs and applications throughout your journey."
            icon={<Clock />}
            themeColor="indigo"
        >
            {/* Filters Row */}
            <div className="flex flex-col gap-6 mb-8">
                {/* Search */}
                <div className="relative group/search">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within/search:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search roles, companies, or keywords..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-neutral-400 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900/50"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-neutral-300 hover:text-neutral-500 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Status Tabs - Mobile Scrollable */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                    <StatusTab id="all" label="All" count={getCount('all')} activeFilter={statusFilter} onSelect={setStatusFilter} />

                    {['saved', 'applied', 'interview', 'offer', 'rejected'].map((filterId) => {
                        const count = getCount(filterId as StatusFilter);
                        if (count === 0 && statusFilter !== filterId) return null;

                        const label = filterId.charAt(0).toUpperCase() + filterId.slice(1);
                        return (
                            <StatusTab
                                key={filterId}
                                id={filterId as StatusFilter}
                                label={label}
                                count={count}
                                activeFilter={statusFilter}
                                onSelect={setStatusFilter}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
                {jobs.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-8 h-8 text-neutral-400" />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">No history yet</h3>
                        <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                            Apps you analyze and apply to will appear here. Start by analyzing a job!
                        </p>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="py-20 text-center bg-neutral-50 dark:bg-neutral-900/50 rounded-[2.5rem] border border-dashed border-neutral-200 dark:border-neutral-800">
                        <Filter className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">No jobs match your filter</h3>
                        <p className="text-neutral-500 dark:text-neutral-400">Try adjusting your search or status filter.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                            className="mt-6 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    filteredJobs.map((job) => {
                        const isAnalyzing = job.status === 'analyzing';
                        const isError = job.status === 'error';
                        const params = getStatusParams(job.status);
                        const roleTitle = job.analysis?.distilledJob.roleTitle || job.position || 'Unknown Role';
                        const companyName = job.analysis?.distilledJob.companyName || job.company || 'Unknown Company';
                        const location = job.analysis?.distilledJob.location || 'Remote/Unknown';
                        const score = job.analysis?.compatibilityScore;

                        return (
                            <div
                                key={job.id}
                                onClick={() => onSelectJob(job.id)}
                                className={`group relative bg-white dark:bg-neutral-900 rounded-[2.5rem] p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800/50 hover:shadow-[0_20px_50px_-20px_rgba(79,70,229,0.15)] dark:hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:-translate-y-1.5 transition-all duration-500 cursor-pointer overflow-hidden shadow-sm ${isError ? 'bg-rose-50/10 dark:bg-rose-950/5' : ''}`}
                            >
                                {/* Ambient Background Glow */}
                                {!isError && <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-all duration-1000 opacity-0 group-hover:opacity-100 group-hover:scale-125" />}

                                <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                                    {/* Logo / Date Col */}
                                    <div className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-4 shrink-0">
                                        <div className="relative">
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${isAnalyzing ? 'animate-pulse' : ''}`}>
                                                {isError ? '!' : companyName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center justify-center">
                                                <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center ${isError ? 'bg-rose-500/20' : 'bg-indigo-500/20'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isError ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(job.dateAdded).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                            <div className="space-y-1">
                                                <h3 className={`text-2xl font-black transition-colors truncate pr-4 tracking-tight leading-tight ${isError ? 'text-rose-900 dark:text-rose-400' : 'text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
                                                    {isAnalyzing ? 'Processing Job...' : isError ? 'Incomplete Analysis' : roleTitle}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <Building className="w-4 h-4 text-neutral-400" />
                                                        <span className={isError ? 'text-rose-600/60' : 'text-neutral-700 dark:text-neutral-300'}>
                                                            {isAnalyzing ? 'Extracting details...' : isError ? 'Needs manual review' : companyName}
                                                        </span>
                                                    </div>
                                                    {!isAnalyzing && !isError && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                                            <div className="flex items-center gap-1.5">
                                                                <Building className="w-4 h-4 text-neutral-400" />
                                                                <span>{location}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className={`self-start px-4 py-1.5 rounded-full text-[10px] font-black border flex items-center gap-2 uppercase tracking-widest transition-all ${params.color}`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                {params.label}
                                            </div>
                                        </div>

                                        {/* Footer: Stats & Actions */}
                                        <div className="flex items-center justify-between pt-6 border-t border-neutral-100 dark:border-neutral-800/50 mt-4">
                                            <div className="flex items-center gap-4">
                                                {isAnalyzing ? (
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                                                        <div className="flex gap-1">
                                                            <div className="w-1 h-1 rounded-full bg-current animate-bounce" />
                                                            <div className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                                                            <div className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                                                        </div>
                                                        AI is pathfinding
                                                    </div>
                                                ) : isError ? (
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500 dark:text-rose-400">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Extraction failed
                                                    </div>
                                                ) : score ? (
                                                    <div className={`px-4 py-2 rounded-2xl text-xs font-black border shadow-sm transition-all flex items-center gap-2 ${score >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                                        score >= 60 ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                                                            'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                                                        }`}>
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        {score}% Match
                                                    </div>
                                                ) : null}

                                                {!isAnalyzing && (
                                                    <div className="hidden sm:flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                                                        <Clock className="w-3 h-3" />
                                                        {isError ? 'Analysis attempted' : 'Last updated'} {new Date(job.dateAdded).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteJob(job.id); }}
                                                    className={`p-3 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl transition-all group-hover:opacity-100`}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                                <button
                                                    className={`group/btn pl-5 pr-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg active:scale-95 ${isError
                                                        ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-900/10'
                                                        : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-indigo-600 dark:hover:bg-indigo-50 shadow-neutral-900/10'
                                                        }`}
                                                >
                                                    {isError ? 'Fix Issues' : isAnalyzing ? 'Opening...' : 'View Details'}
                                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </PageLayout>
    );
}
