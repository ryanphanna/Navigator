import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SavedJob } from '../../types';
import { Trash2, ArrowRight, Sparkles, Building, Calendar, Filter, Clock } from 'lucide-react';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { StandardSearchBar } from '../../components/common/StandardSearchBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants';
import { StandardFilterGroup } from '../../components/common/StandardFilterGroup';

interface HistoryProps {
    jobs: SavedJob[];
    onSelectJob: (id: string) => void;
    onDeleteJob: (id: string) => void;
}

const FILTER_OPTIONS = [
    { id: 'all', label: 'All' },
    { id: 'saved', label: 'Saved' },
    { id: 'applied', label: 'Applied' },
    { id: 'interview', label: 'Interview' },
    { id: 'offer', label: 'Offer' },
    { id: 'rejected', label: 'Rejected' },
] as const;

type StatusFilter = typeof FILTER_OPTIONS[number]['id'];

export default function History({ jobs, onSelectJob, onDeleteJob }: HistoryProps) {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const handleJobClick = (job: SavedJob) => {
        if (job.status === 'analyzing') return;
        onSelectJob(job.id);
        navigate(ROUTES.JOB_DETAIL.replace(':id', job.id));
    };

    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            if (!job || job.status === 'feed') return false;

            if (statusFilter !== 'all') {
                if (statusFilter === 'offer' && job.status !== 'offer') return false;
                if (statusFilter === 'interview' && job.status !== 'interview') return false;
                if (statusFilter === 'rejected' && (job.status !== 'rejected' && job.status !== 'ghosted')) return false;
                if (statusFilter === 'applied' && job.status !== 'applied') return false;
                if (statusFilter === 'saved' && (job.status !== 'saved' && job.status !== 'analyzing' && job.status !== 'error' && !!job.status)) return false;
            }

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
            case 'analyzing': return { label: 'Processing...', color: 'bg-accent-primary/10 text-accent-primary-hex border-accent-primary/20 animate-pulse' };
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
        <SharedPageLayout className="theme-job" spacing="none">
            <PageHeader
                title="History"
                highlight="Log"
                subtitle="Track your applications, interviews, and offers in one place."
            />

            {/* Filters & Search Row */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                <StandardSearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search roles, companies, or keywords..."
                    themeColor="indigo"
                    className="flex-1"
                />
                <StandardFilterGroup
                    options={FILTER_OPTIONS.map(opt => ({
                        ...opt,
                        count: getCount(opt.id)
                    }))}
                    activeFilter={statusFilter}
                    onSelect={(f) => setStatusFilter(f as StatusFilter)}
                    themeColor="slate"
                />
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
                            Jobs you save and assess will appear here. Start by finding a job fit!
                        </p>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <Card variant="glass" className="py-20 text-center border-dashed">
                        <Filter className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">No jobs match your filter</h3>
                        <p className="text-neutral-500 dark:text-neutral-400">Try adjusting your search or status filter.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                            className="mt-6 text-accent-primary-hex font-bold hover:underline"
                        >
                            Clear all filters
                        </button>
                    </Card>
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
                            <Card
                                key={job.id}
                                onClick={() => handleJobClick(job)}
                                variant="glass"
                                className={`group p-6 sm:p-8 border-neutral-200 dark:border-neutral-800/50 hover:border-accent-primary/30 transition-all duration-500 overflow-hidden ${isAnalyzing ? 'cursor-default opacity-90' : 'cursor-pointer'} ${isError ? 'bg-rose-50/10 dark:bg-rose-950/5' : ''}`}
                                glow
                            >
                                <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                                    {/* Logo / Date Col */}
                                    <div className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-4 shrink-0">
                                        <div className="relative">
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${isAnalyzing ? 'animate-pulse' : ''}`}>
                                                {isError ? '!' : companyName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center justify-center">
                                                <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center ${isError ? 'bg-rose-500/20' : 'bg-accent-primary/20'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isError ? 'bg-rose-500' : 'bg-accent-primary-hex'}`} />
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
                                                <h3 className={`text-2xl font-black transition-colors truncate pr-4 tracking-tight leading-tight ${isError ? 'text-rose-900 dark:text-rose-400' : 'text-neutral-900 dark:text-white group-hover:text-accent-primary-hex'}`}>
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

                                            <div className={`self-start px-3 py-1 rounded-full text-[10px] font-black border flex items-center gap-2 uppercase tracking-widest transition-all ${params.color}`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                {params.label}
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-6 border-t border-neutral-100 dark:border-neutral-800/50 mt-4">
                                            <div className="flex items-center gap-4">
                                                {isAnalyzing ? (
                                                    <div className="flex flex-col gap-1.5 min-w-[200px]">
                                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-accent-primary-hex">
                                                            <span>{job.progressMessage || 'Finding your fit...'}</span>
                                                            <span>{job.progress || 0}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-accent-primary/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-accent-primary-hex rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.max(5, job.progress || 5)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : isError ? (
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-2">
                                                        <Trash2 className="w-3.5 h-3.5" /> Extraction failed
                                                    </div>
                                                ) : score ? (
                                                    <div className={`px-4 py-2 rounded-2xl text-xs font-black border flex items-center gap-2 ${score >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        score >= 60 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                            'bg-rose-50 text-rose-700 border-rose-100'
                                                        }`}>
                                                        <Sparkles className="w-3.5 h-3.5" /> {score}% Match
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteJob(job.id); }}
                                                    className="p-3 text-neutral-300 hover:text-rose-500 rounded-2xl transition-all"
                                                >
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                                {!isAnalyzing && (
                                                    <Button
                                                        variant={isError ? "secondary" : "accent"}
                                                        size="sm"
                                                        icon={<ArrowRight className="w-4 h-4" />}
                                                    >
                                                        {isError ? 'Fix Issues' : 'View Analysis'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </SharedPageLayout>
    );
}
