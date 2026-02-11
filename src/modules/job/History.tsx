import { useState, useMemo } from 'react';
import type { SavedJob } from '../../types';
import { Search, X, Send, Users, Star, XCircle } from 'lucide-react';
import { EntityCard } from '../../components/common/EntityCard';

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

    const getStatusBadge = (status: SavedJob['status']) => {
        switch (status) {
            case 'applied': return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800"><Send className="w-3 h-3" /> Applied</span>;
            case 'interview': return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-800"><Users className="w-3 h-3" /> Interview</span>;
            case 'offer': return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded border border-green-100 dark:border-green-800"><Star className="w-3 h-3" /> Offer</span>;
            case 'rejected': return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700"><XCircle className="w-3 h-3" /> Rejected</span>;
            default: return null;
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Application History</h2>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Track your analyzed jobs and applications</p>
                    </div>
                    <span className="text-xs font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">{filteredJobs.length} Jobs</span>
                </div>

                {/* Search Bar */}
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search roles or companies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:border-indigo-500 transition-all placeholder:text-neutral-400 shadow-sm transition-all"
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.length === 0 ? (
                        <div className="col-span-full py-20 text-neutral-500 flex flex-col items-center justify-center text-center">
                            <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-full mb-4">
                                <Search className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
                            </div>
                            <p className="text-lg font-medium text-neutral-900 dark:text-white">No jobs analyzed yet</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Paste a job URL on the home page to get started.</p>
                        </div>
                    ) : filteredJobs.length > 0 ? (
                        filteredJobs.map((job) => (
                            <EntityCard
                                key={job.id}
                                title={job.analysis?.distilledJob.roleTitle || job.position || 'Unknown Role'}
                                subtitle={job.analysis?.distilledJob.companyName || job.company || 'Unknown Company'}
                                score={job.analysis?.compatibilityScore}
                                status={job.status}
                                date={new Date(job.dateAdded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                badge={getStatusBadge(job.status)}
                                onClick={() => onSelectJob(job.id)}
                                onDelete={() => onDeleteJob(job.id)}
                                onAction={() => onSelectJob(job.id)} // Retry action
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-20 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-[2.5rem] border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center text-center">
                            <div className="bg-white dark:bg-neutral-950 p-4 rounded-2xl shadow-sm mb-4">
                                <Search className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
                            </div>
                            <h3 className="text-neutral-900 dark:text-white font-medium mb-1">No jobs found</h3>
                            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">No applications match "{searchQuery}"</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                            >
                                Clear search filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
