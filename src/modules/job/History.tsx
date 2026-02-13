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
        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${activeFilter === id
            ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white'
            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-700'
            }`}
    >
        {label}
        <span className={`px-1.5 py-0.5 rounded-md text-xs ${activeFilter === id
            ? 'bg-white/20 text-white dark:bg-neutral-900/10 dark:text-neutral-900'
            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500'
            }`}>
            {count}
        </span>
    </button>
);

export default function History({ jobs, onSelectJob, onDeleteJob }: HistoryProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            if (!job) return false;

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
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search roles, companies, or keywords..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-neutral-400 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-neutral-300 hover:text-neutral-500 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Status Tabs - Mobile Scrollable */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                    <StatusTab id="all" label="All" count={getCount('all')} activeFilter={statusFilter} onSelect={setStatusFilter} />
                    <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 mx-2 shrink-0" />
                    <StatusTab id="saved" label="Saved" count={getCount('saved')} activeFilter={statusFilter} onSelect={setStatusFilter} />
                    <StatusTab id="applied" label="Applied" count={getCount('applied')} activeFilter={statusFilter} onSelect={setStatusFilter} />
                    <StatusTab id="interview" label="Interview" count={getCount('interview')} activeFilter={statusFilter} onSelect={setStatusFilter} />
                    <StatusTab id="offer" label="Offer" count={getCount('offer')} activeFilter={statusFilter} onSelect={setStatusFilter} />
                    <StatusTab id="rejected" label="Rejected" count={getCount('rejected')} activeFilter={statusFilter} onSelect={setStatusFilter} />
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
                        const status = getStatusParams(job.status);
                        const roleTitle = job.analysis?.distilledJob.roleTitle || job.position || 'Unknown Role';
                        const companyName = job.analysis?.distilledJob.companyName || job.company || 'Unknown Company';
                        const location = job.analysis?.distilledJob.location || 'Remote/Unknown';
                        const score = job.analysis?.compatibilityScore;

                        return (
                            <div
                                key={job.id}
                                onClick={() => onSelectJob(job.id)}
                                className="group relative bg-white dark:bg-neutral-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-neutral-200 dark:border-neutral-800 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300 cursor-pointer overflow-hidden"
                            >
                                <div className="flex flex-col sm:flex-row gap-6">
                                    {/* Logo / Date Col */}
                                    <div className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-4 shrink-0">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400`}>
                                            {companyName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="text-xs font-medium text-neutral-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(job.dateAdded).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors truncate pr-4">
                                                    {roleTitle}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                                                    <Building className="w-3.5 h-3.5" />
                                                    <span className="font-medium">{companyName}</span>
                                                    <span>•</span>
                                                    <span>{location}</span>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className={`self-start px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 uppercase tracking-wider ${status.color}`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                                                {status.label}
                                            </div>
                                        </div>

                                        {/* Footer: Stats & Actions */}
                                        <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                            {score ? (
                                                <div className="flex items-center gap-2">
                                                    <div className={`px-2.5 py-1 rounded-lg text-sm font-bold border flex items-center gap-1.5 ${score >= 80 ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                                                        score >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' :
                                                            'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                                        }`}>
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        {score}% Match
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-neutral-400 italic">No analysis score</div>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteJob(job.id); }}
                                                    className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="pl-3 pr-2 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-sm font-bold transition-all flex items-center gap-1 group-hover:translate-x-1"
                                                >
                                                    View
                                                    <ArrowRight className="w-4 h-4" />
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
